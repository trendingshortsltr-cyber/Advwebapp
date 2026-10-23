"use client";
import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode
} from 'react';
import {
  collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, Timestamp, writeBatch, runTransaction, deleteField,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { toast } from '@/components/ui/toast';
import type { Case, Hearing } from './types';

// ── helpers ──────────────────────────────────────────────────────────────────
function genId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function nowISO() { return new Date().toISOString(); }

/** Convert Firestore Timestamp or string to ISO string safely */
function toISO(val: unknown): string {
  if (!val) return nowISO();
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'string') return val;
  return nowISO();
}

/** Deserialise a raw Firestore doc into a typed Case */
function docToCase(id: string, data: Record<string, unknown>): Case {
  return {
    id,
    clientName: (data.clientName as string) || '',
    caseNumber: (data.caseNumber as string) || '',
    court: (data.court as string) || '',
    status: (data.status as 'Active' | 'Closed') || 'Active',
    clientPhone: data.clientPhone as string | undefined,
    caseType: data.caseType as string | undefined,
    oppositeParty: data.oppositeParty as string | undefined,
    cnrNumber: data.cnrNumber as string | undefined,
    stage: data.stage as string | undefined,
    notes: data.notes as string | undefined,
    nextHearingDate: (data.nextHearingDate as string | null) ?? null,
    ownerId: (data.ownerId as string) || '',
    members: (data.members as Record<string, string>) || {},
    memberIds: (data.memberIds as string[]) || [],
    createdAt: toISO(data.createdAt),
    updatedAt: toISO(data.updatedAt),
    deletedAt: (data.deletedAt as string | null) ?? null,
  };
}

/** Deserialise a raw Firestore doc into a typed Hearing */
function docToHearing(id: string, data: Record<string, unknown>): Hearing {
  return {
    id,
    caseId: (data.caseId as string) || '',
    date: (data.date as string) || '',
    time: data.time as string | undefined,
    notes: data.notes as string | undefined,
    result: data.result as string | undefined,
    completed: Boolean(data.completed),
    createdAt: toISO(data.createdAt),
    updatedAt: toISO(data.updatedAt),
  };
}

// ── Firestore paths ───────────────────────────────────────────────────────────
const casesCol = (uid: string) => collection(db, 'users', uid, 'cases');
const caseDoc  = (uid: string, caseId: string) => doc(db, 'users', uid, 'cases', caseId);
const hearingsCol = (uid: string, caseId: string) =>
  collection(db, 'users', uid, 'cases', caseId, 'hearings');
const hearingDoc = (uid: string, caseId: string, hId: string) =>
  doc(db, 'users', uid, 'cases', caseId, 'hearings', hId);

// ── Context types ─────────────────────────────────────────────────────────────
interface StoreCtx {
  cases: Case[];
  hearings: Hearing[];
  loaded: boolean;
  addCase: (d: Partial<Case>) => Promise<Case>;
  ensureInitialHearing: (caseId: string, date: string) => Promise<void>;
  updateCase: (id: string, d: Partial<Case>) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
  getCase: (id: string) => Case | undefined;
  getCaseHearings: (caseId: string) => Hearing[];
  addHearing: (d: Partial<Hearing> & { caseId: string; date: string }) => Promise<Hearing>;
  updateHearing: (id: string, d: Partial<Hearing>) => Promise<void>;
  deleteHearing: (caseId: string, id: string) => Promise<void>;
}

const Ctx = createContext<StoreCtx | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Subscribe to all cases for this user.
  useEffect(() => {
    if (!user) return;

    const uid = user.uid;
    const hearingUnsubs = new Map<string, Unsubscribe>();
    const casesQ = query(casesCol(uid), orderBy('createdAt', 'desc'));
    const unsubCases = onSnapshot(casesQ, (snap) => {
      const newCases = snap.docs.map(d => docToCase(d.id, d.data() as Record<string, unknown>));
      setCases(newCases);
      setLoaded(true);

      const activeCaseIds = new Set(newCases.filter(c => !c.deletedAt).map(c => c.id));

      for (const [caseId, unsubscribe] of hearingUnsubs) {
        if (!activeCaseIds.has(caseId)) {
          unsubscribe();
          hearingUnsubs.delete(caseId);
        }
      }
      setHearings(prev => prev.filter(h => activeCaseIds.has(h.caseId)));

      newCases.forEach(c => {
        if (c.deletedAt || hearingUnsubs.has(c.id)) return;
        const hQ = query(hearingsCol(uid, c.id), orderBy('date', 'asc'));
        const unsubH = onSnapshot(hQ, (hSnap) => {
          const caseHearings = hSnap.docs.map(d =>
            docToHearing(d.id, d.data() as Record<string, unknown>)
          );
          setHearings(prev => {
            const others = prev.filter(h => h.caseId !== c.id);
            return [...others, ...caseHearings];
          });
        }, () => {
          toast.add({
            type: 'error',
            title: 'Could not load hearings',
            description: 'Check your connection and Firestore access, then reload the app.',
          });
        });
        hearingUnsubs.set(c.id, unsubH);
      });
    }, () => {
      setLoaded(true);
      toast.add({
        type: 'error',
        title: 'Could not load cases',
        description: 'Check your connection and Firestore access, then reload the app.',
      });
    });

    return () => {
      unsubCases();
      hearingUnsubs.forEach(unsubscribe => unsubscribe());
    };
  }, [user]);

  // ── Helpers for next hearing date calculation ─────────────────────────────
  const recalcNextHearing = useCallback(async (uid: string, caseId: string, currentHearings: Hearing[]) => {
    const upcoming = currentHearings
      .filter(h => h.caseId === caseId && !h.completed)
      .sort((a, b) => a.date.localeCompare(b.date));
    const nextDate = upcoming[0]?.date || null;
    await updateDoc(caseDoc(uid, caseId), { nextHearingDate: nextDate, updatedAt: serverTimestamp() });
  }, []);

  // ── CASE CRUD ─────────────────────────────────────────────────────────────
  const addCase = useCallback(async (d: Partial<Case>): Promise<Case> => {
    if (!user) throw new Error('Not authenticated');
    const id = genId();
    const uid = user.uid;
    const isoNow = nowISO();
    // Firestore payload — uses serverTimestamp() for accurate server time
    const firestoreData: Record<string, unknown> = {
      clientName: d.clientName || '',
      caseNumber: d.caseNumber || '',
      court: d.court || '',
      status: d.status || 'Active',
      nextHearingDate: d.nextHearingDate || null,
      ownerId: uid,
      members: {},
      memberIds: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deletedAt: null,
    };
    if (d.clientPhone)    firestoreData.clientPhone    = d.clientPhone;
    if (d.caseType)       firestoreData.caseType       = d.caseType;
    if (d.oppositeParty)  firestoreData.oppositeParty  = d.oppositeParty;
    if (d.cnrNumber)      firestoreData.cnrNumber      = d.cnrNumber;
    if (d.stage)          firestoreData.stage          = d.stage;
    if (d.notes)          firestoreData.notes          = d.notes;

    const batch = writeBatch(db);
    batch.set(caseDoc(uid, id), firestoreData);
    if (d.nextHearingDate) {
      const initialHearingId = `initial-${d.nextHearingDate}`;
      batch.set(hearingDoc(uid, id, initialHearingId), {
        caseId: id,
        date: d.nextHearingDate,
        completed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();

    // Return optimistic Case object with ISO dates for immediate UI use
    const returned: Case = {
      id,
      clientName: d.clientName || '',
      caseNumber: d.caseNumber || '',
      court: d.court || '',
      status: d.status || 'Active',
      clientPhone: d.clientPhone,
      caseType: d.caseType,
      oppositeParty: d.oppositeParty,
      cnrNumber: d.cnrNumber,
      stage: d.stage,
      notes: d.notes,
      nextHearingDate: d.nextHearingDate || null,
      ownerId: uid,
      members: {},
      memberIds: [],
      createdAt: isoNow,
      updatedAt: isoNow,
      deletedAt: null,
    };
    return returned;
  }, [user]);

  const ensureInitialHearing = useCallback(async (caseId: string, date: string): Promise<void> => {
    if (!user) throw new Error('Not authenticated');
    const uid = user.uid;
    const initialHearingRef = hearingDoc(uid, caseId, `initial-${date}`);
    await runTransaction(db, async (transaction) => {
      const existing = await transaction.get(initialHearingRef);
      if (existing.exists()) return;
      transaction.set(initialHearingRef, {
        caseId,
        date,
        completed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  }, [user]);

  const updateCase = useCallback(async (id: string, d: Partial<Case>): Promise<void> => {
    if (!user) throw new Error('Not authenticated');
    const uid = user.uid;
    const updates: Record<string, unknown> = { ...d, updatedAt: serverTimestamp() };
    // Never let client overwrite these
    delete updates.id;
    delete updates.ownerId;
    delete updates.members;
    delete updates.memberIds;
    delete updates.createdAt;
    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).map(([key, value]) => [
        key,
        value === undefined ? deleteField() : value,
      ])
    );
    await updateDoc(caseDoc(uid, id), cleanUpdates);
  }, [user]);

  const deleteCase = useCallback(async (id: string): Promise<void> => {
    if (!user) throw new Error('Not authenticated');
    await updateDoc(caseDoc(user.uid, id), { deletedAt: nowISO(), updatedAt: serverTimestamp() });
  }, [user]);

  const getCase = useCallback((id: string) =>
    cases.find(c => c.id === id && !c.deletedAt), [cases]);

  const getCaseHearings = useCallback((caseId: string) =>
    hearings.filter(h => h.caseId === caseId).sort((a, b) => b.date.localeCompare(a.date)),
    [hearings]);

  // ── HEARING CRUD ──────────────────────────────────────────────────────────
  const addHearing = useCallback(async (
    d: Partial<Hearing> & { caseId: string; date: string }
  ): Promise<Hearing> => {
    if (!user) throw new Error('Not authenticated');
    const id = genId();
    const uid = user.uid;
    const isoNow = nowISO();
    const firestoreHearing: Record<string, unknown> = {
      caseId: d.caseId,
      date: d.date,
      completed: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (d.time)   firestoreHearing.time   = d.time;
    if (d.notes)  firestoreHearing.notes  = d.notes;
    if (d.result) firestoreHearing.result = d.result;

    await setDoc(hearingDoc(uid, d.caseId, id), firestoreHearing);

    const returnedHearing: Hearing = {
      id,
      caseId: d.caseId,
      date: d.date,
      time: d.time,
      notes: d.notes,
      result: d.result,
      completed: false,
      createdAt: isoNow,
      updatedAt: isoNow,
    };
    // Recalc nextHearingDate on the parent case
    const current = hearings.filter(h => h.caseId === d.caseId);
    const merged = [...current, returnedHearing];
    await recalcNextHearing(uid, d.caseId, merged);
    return returnedHearing;
  }, [user, hearings, recalcNextHearing]);

  const updateHearing = useCallback(async (id: string, d: Partial<Hearing>): Promise<void> => {
    if (!user) throw new Error('Not authenticated');
    const hearing = hearings.find(h => h.id === id);
    if (!hearing) throw new Error('Hearing not found');
    const uid = user.uid;
    const updates: Record<string, unknown> = { ...d, updatedAt: serverTimestamp() };
    delete updates.id;
    delete updates.caseId;
    delete updates.createdAt;
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).map(([key, value]) => [
        key,
        value === undefined ? deleteField() : value,
      ])
    );
    await updateDoc(hearingDoc(uid, hearing.caseId, id), cleanUpdates);
    if (d.completed !== undefined || d.date !== undefined) {
      const updatedHearing = { ...hearing, ...d, id, caseId: hearing.caseId };
      const updatedHearings = [
        ...hearings.filter(h => h.caseId === hearing.caseId && h.id !== id),
        updatedHearing,
      ];
      await recalcNextHearing(uid, hearing.caseId, updatedHearings);
    }
  }, [user, hearings, recalcNextHearing]);

  const deleteHearing = useCallback(async (caseId: string, id: string): Promise<void> => {
    if (!user) throw new Error('Not authenticated');
    const uid = user.uid;
    await deleteDoc(hearingDoc(uid, caseId, id));
    const remaining = hearings.filter(h => h.caseId === caseId && h.id !== id);
    await recalcNextHearing(uid, caseId, remaining);
  }, [user, hearings, recalcNextHearing]);

  // Loading screen
  if (!loaded) return (
    <div className="min-h-screen bg-[#0B2A5B] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center border border-white/20">
          <span className="text-3xl">⚖️</span>
        </div>
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <p className="text-white/50 text-xs">Loading your cases…</p>
      </div>
    </div>
  );

  return (
    <Ctx.Provider value={{
      cases: cases.filter(c => !c.deletedAt),
      hearings,
      loaded,
      addCase, ensureInitialHearing, updateCase, deleteCase, getCase, getCaseHearings,
      addHearing, updateHearing, deleteHearing,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be used within DataProvider');
  return ctx;
}
