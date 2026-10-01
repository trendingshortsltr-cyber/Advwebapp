"use client";
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { format, subDays, addDays } from 'date-fns';
import type { Case, Hearing } from './types';

function genId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}
function nowISO() { return new Date().toISOString(); }

function createDemoData() {
  const t = new Date();
  const f = (d: Date) => format(d, 'yyyy-MM-dd');
  const cases: Case[] = [
    { id:'c1', clientName:'Rajesh Kumar Sharma', caseNumber:'CWP/4521/2024', court:'High Court, Bombay', status:'Active', clientPhone:'+919876543210', caseType:'Civil Writ', oppositeParty:'State of Maharashtra', cnrNumber:'MHBM010004521024', stage:'Arguments', notes:'Land acquisition matter. Client seeking stay order.', nextHearingDate:f(subDays(t,3)), ownerId:'demo-user', members:{}, memberIds:[], createdAt:subDays(t,90).toISOString(), updatedAt:nowISO(), deletedAt:null },
    { id:'c2', clientName:'Priya Mehta', caseNumber:'CC/881/2023', court:'Sessions Court, Pune', status:'Active', clientPhone:'+918765432109', caseType:'Criminal', oppositeParty:'State of Maharashtra', stage:'Evidence', notes:'Bail granted. Next hearing for evidence.', nextHearingDate:f(subDays(t,2)), ownerId:'demo-user', members:{}, memberIds:[], createdAt:subDays(t,180).toISOString(), updatedAt:nowISO(), deletedAt:null },
    { id:'c3', clientName:'Sunil Patil Contractors', caseNumber:'CS/1102/2024', court:'District Court, Nagpur', status:'Active', clientPhone:'+917654321098', caseType:'Civil Suit', oppositeParty:'State of Maharashtra', cnrNumber:'MHNG010001102024', stage:'Argument stage', notes:'Contract dispute. ₹45L involved.', nextHearingDate:f(t), ownerId:'demo-user', members:{}, memberIds:[], createdAt:subDays(t,85).toISOString(), updatedAt:nowISO(), deletedAt:null },
    { id:'c4', clientName:'Anita Singh', caseNumber:'WA/209/2024', court:'Family Court, Mumbai', status:'Active', clientPhone:'+916543210987', caseType:'Family', oppositeParty:'Rakesh Singh', stage:'Mediation', notes:'Divorce petition. Custody dispute.', nextHearingDate:f(addDays(t,3)), ownerId:'demo-user', members:{}, memberIds:[], createdAt:subDays(t,120).toISOString(), updatedAt:nowISO(), deletedAt:null },
    { id:'c5', clientName:'Vikram Deshmukh', caseNumber:'CRA/331/2025', court:'High Court, Aurangabad', status:'Active', clientPhone:'+915432109876', caseType:'Criminal Appeal', oppositeParty:'State of Maharashtra', stage:'Admission', notes:'Appeal against conviction.', nextHearingDate:f(addDays(t,7)), ownerId:'demo-user', members:{}, memberIds:[], createdAt:subDays(t,30).toISOString(), updatedAt:nowISO(), deletedAt:null },
    { id:'c6', clientName:'Meera Joshi', caseNumber:'MA/45/2024', court:'District Court, Pune', status:'Closed', clientPhone:'+914321098765', caseType:'Motor Accident', oppositeParty:'National Insurance Co.', stage:'Disposed', notes:'Claim settled. ₹12L compensation awarded.', nextHearingDate:null, ownerId:'demo-user', members:{}, memberIds:[], createdAt:subDays(t,200).toISOString(), updatedAt:subDays(t,15).toISOString(), deletedAt:null },
  ];
  const hearings: Hearing[] = [
    { id:'h1a', caseId:'c1', date:f(subDays(t,82)), time:'10:00 AM', notes:'Case filed and admitted.', result:'Summons issued', completed:true, createdAt:nowISO(), updatedAt:nowISO() },
    { id:'h1b', caseId:'c1', date:f(subDays(t,59)), time:'11:00 AM', notes:'Summons served. Defendant appeared.', result:'Written statement due', completed:true, createdAt:nowISO(), updatedAt:nowISO() },
    { id:'h1c', caseId:'c1', date:f(subDays(t,15)), time:'10:30 AM', notes:'Written statement filed by respondent.', result:'Adjourned for arguments', completed:true, createdAt:nowISO(), updatedAt:nowISO() },
    { id:'h1d', caseId:'c1', date:f(subDays(t,3)), time:'11:00 AM', notes:'Final arguments scheduled.', completed:false, createdAt:nowISO(), updatedAt:nowISO() },
    { id:'h2a', caseId:'c2', date:f(subDays(t,117)), time:'10:00 AM', notes:'Bail hearing.', result:'Bail granted', completed:true, createdAt:nowISO(), updatedAt:nowISO() },
    { id:'h2b', caseId:'c2', date:f(subDays(t,72)), time:'10:30 AM', notes:'Charge sheet filed.', result:'Charges framed', completed:true, createdAt:nowISO(), updatedAt:nowISO() },
    { id:'h2c', caseId:'c2', date:f(subDays(t,2)), time:'10:00 AM', notes:'Prosecution evidence. 3 witnesses.', completed:false, createdAt:nowISO(), updatedAt:nowISO() },
    { id:'h3a', caseId:'c3', date:f(subDays(t,82)), time:'10:00 AM', notes:'Case filed and admitted.', result:'Summons issued', completed:true, createdAt:nowISO(), updatedAt:nowISO() },
    { id:'h3b', caseId:'c3', date:f(subDays(t,59)), time:'11:00 AM', notes:'Defendant appeared.', result:'Written statement due', completed:true, createdAt:nowISO(), updatedAt:nowISO() },
    { id:'h3c', caseId:'c3', date:f(subDays(t,15)), time:'10:30 AM', notes:'Written statement filed.', result:'Adjourned for arguments → today', completed:true, createdAt:nowISO(), updatedAt:nowISO() },
    { id:'h3d', caseId:'c3', date:f(t), time:'11:00 AM', notes:'Final arguments. Review documents before court.', completed:false, createdAt:nowISO(), updatedAt:nowISO() },
    { id:'h4a', caseId:'c4', date:f(subDays(t,45)), time:'10:30 AM', notes:'First mediation session.', result:'Partial agreement', completed:true, createdAt:nowISO(), updatedAt:nowISO() },
    { id:'h4b', caseId:'c4', date:f(addDays(t,3)), time:'10:30 AM', notes:'Second mediation session scheduled.', completed:false, createdAt:nowISO(), updatedAt:nowISO() },
    { id:'h5a', caseId:'c5', date:f(addDays(t,7)), time:'10:00 AM', notes:'Admission hearing.', completed:false, createdAt:nowISO(), updatedAt:nowISO() },
    { id:'h6a', caseId:'c6', date:f(subDays(t,60)), time:'11:00 AM', notes:'Final arguments heard.', result:'Compensation ₹12L awarded', completed:true, createdAt:nowISO(), updatedAt:nowISO() },
  ];
  return { cases, hearings };
}

interface StoreCtx {
  cases: Case[];
  hearings: Hearing[];
  addCase: (d: Partial<Case>) => Case;
  updateCase: (id: string, d: Partial<Case>) => void;
  deleteCase: (id: string) => void;
  getCase: (id: string) => Case | undefined;
  getCaseHearings: (caseId: string) => Hearing[];
  addHearing: (d: Partial<Hearing> & { caseId: string; date: string }) => Hearing;
  updateHearing: (id: string, d: Partial<Hearing>) => void;
  deleteHearing: (id: string) => void;
  loaded: boolean;
}

const Ctx = createContext<StoreCtx | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<Case[]>([]);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const sc = localStorage.getItem('advdiary-cases');
      const sh = localStorage.getItem('advdiary-hearings');
      if (sc && sh) { setCases(JSON.parse(sc)); setHearings(JSON.parse(sh)); }
      else { const d = createDemoData(); setCases(d.cases); setHearings(d.hearings); }
    } catch { const d = createDemoData(); setCases(d.cases); setHearings(d.hearings); }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem('advdiary-cases', JSON.stringify(cases));
      localStorage.setItem('advdiary-hearings', JSON.stringify(hearings));
    }
  }, [cases, hearings, loaded]);

  const addCase = (d: Partial<Case>): Case => {
    const c: Case = { id: genId(), clientName: d.clientName || '', caseNumber: d.caseNumber || '', court: d.court || '', status: 'Active', clientPhone: d.clientPhone, caseType: d.caseType, oppositeParty: d.oppositeParty, cnrNumber: d.cnrNumber, stage: d.stage, notes: d.notes, nextHearingDate: d.nextHearingDate || null, ownerId: 'demo-user', members: {}, memberIds: [], createdAt: nowISO(), updatedAt: nowISO(), deletedAt: null };
    setCases(prev => [c, ...prev]);
    return c;
  };
  const updateCase = (id: string, d: Partial<Case>) => setCases(prev => prev.map(c => c.id === id ? { ...c, ...d, updatedAt: nowISO() } : c));
  const deleteCase = (id: string) => setCases(prev => prev.map(c => c.id === id ? { ...c, deletedAt: nowISO() } : c));
  const getCase = (id: string) => cases.find(c => c.id === id && !c.deletedAt);
  const getCaseHearings = (caseId: string) => hearings.filter(h => h.caseId === caseId).sort((a, b) => b.date.localeCompare(a.date));
  const addHearing = (d: Partial<Hearing> & { caseId: string; date: string }): Hearing => {
    const h: Hearing = { id: genId(), caseId: d.caseId, date: d.date, time: d.time, notes: d.notes, result: d.result, completed: false, createdAt: nowISO(), updatedAt: nowISO() };
    setHearings(prev => [...prev, h]);
    // update case nextHearingDate
    const caseHearings = [...hearings.filter(x => x.caseId === d.caseId && !x.completed), h].sort((a, b) => a.date.localeCompare(b.date));
    const next = caseHearings[0];
    if (next) updateCase(d.caseId, { nextHearingDate: next.date });
    return h;
  };
  const updateHearing = (id: string, d: Partial<Hearing>) => {
    setHearings(prev => prev.map(h => h.id === id ? { ...h, ...d, updatedAt: nowISO() } : h));
    // If marking as completed, recalc nextHearingDate
    if (d.completed) {
      const hearing = hearings.find(h => h.id === id);
      if (hearing) {
        const remaining = hearings.filter(h => h.caseId === hearing.caseId && !h.completed && h.id !== id).sort((a, b) => a.date.localeCompare(b.date));
        updateCase(hearing.caseId, { nextHearingDate: remaining[0]?.date || null });
      }
    }
  };
  const deleteHearing = (id: string) => setHearings(prev => prev.filter(h => h.id !== id));

  if (!loaded) return <div className="flex items-center justify-center min-h-screen bg-background"><div className="animate-pulse text-muted-foreground text-lg">Loading AdvDiary...</div></div>;

  return <Ctx.Provider value={{ cases: cases.filter(c => !c.deletedAt), hearings, addCase, updateCase, deleteCase, getCase, getCaseHearings, addHearing, updateHearing, deleteHearing, loaded }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be used within DataProvider');
  return ctx;
}
