"use client";
import { useState, useMemo, useEffect, useRef, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { AddHearingDialog } from '@/components/add-hearing-dialog';
import { EditCaseSheet } from '@/components/edit-case-sheet';
import { toast } from '@/components/ui/toast';
import {
  ArrowLeft, Phone, MessageCircle, Check, Plus, Edit3,
  Trash2, RotateCcw, CheckCircle, Pencil
} from 'lucide-react';
import { format, parseISO, isToday, isBefore, startOfDay } from 'date-fns';
import type { Hearing } from '@/lib/types';

type Tab = 'hearings' | 'notes' | 'info';

function subscribeToLocation(callback: () => void) {
  window.addEventListener('popstate', callback);
  return () => window.removeEventListener('popstate', callback);
}

function getCaseIdFromLocation() {
  return new URLSearchParams(window.location.search).get('id') ?? '';
}

function getServerCaseId() {
  return '';
}

export default function CaseDetailPage() {
  const id = useSyncExternalStore(subscribeToLocation, getCaseIdFromLocation, getServerCaseId);
  const router = useRouter();
  const { getCase, getCaseHearings, ensureInitialHearing, updateHearing, updateCase, deleteCase, deleteHearing } = useStore();
  const { user, displayName } = useAuth();

  const [tab, setTab] = useState<Tab>('hearings');
  const [addHearingOpen, setAddHearingOpen] = useState(false);
  const [editHearing, setEditHearing] = useState<Hearing | undefined>(undefined);
  const [editCaseOpen, setEditCaseOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [markDoneId, setMarkDoneId] = useState<string | null>(null);
  const [markDoneResult, setMarkDoneResult] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const initialHearingAttempts = useRef(new Set<string>());

  const caseData = getCase(id);
  const caseHearings = useMemo(() => getCaseHearings(id), [id, getCaseHearings]);

  useEffect(() => {
    const nextDate = caseData?.nextHearingDate;
    if (!nextDate || caseHearings.some(hearing => hearing.date === nextDate)) return;
    const attemptKey = `${id}-${nextDate}`;
    if (initialHearingAttempts.current.has(attemptKey)) return;
    initialHearingAttempts.current.add(attemptKey);
    void ensureInitialHearing(id, nextDate).catch((error: unknown) => {
      const code = error && typeof error === 'object' && 'code' in error &&
        typeof error.code === 'string' ? error.code : null;
      if (code === 'already-exists') return;
      toast.add({
        type: 'error',
        title: 'Could not add the next hearing',
        description: code ? `Please check your connection and try again (${code}).` : 'Please check your connection and try again.',
      });
    });
  }, [id, caseData?.nextHearingDate, caseHearings, ensureInitialHearing]);

  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        <div className="text-sm">Loading case…</div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        <div className="text-center">
          <div className="text-4xl mb-3">📁</div>
          <div className="text-sm font-medium">Case not found</div>
          <button onClick={() => router.back()} className="mt-3 text-navy-700 text-sm font-medium underline">
            Go back
          </button>
        </div>
      </div>
    );
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleMarkDone = async (hId: string) => {
    setActionLoading(hId);
    try {
      await updateHearing(hId, { completed: true, result: markDoneResult.trim() || 'Completed' });
      toast.add({ type: 'success', title: 'Hearing Marked Done' });
      setMarkDoneId(null);
      setMarkDoneResult('');
    } catch {
      toast.add({ type: 'error', title: 'Failed to update' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteHearing = async (hId: string) => {
    if (!confirm('Delete this hearing? This cannot be undone.')) return;
    setActionLoading(hId + '_del');
    try {
      await deleteHearing(id, hId);
      toast.add({ type: 'success', title: 'Hearing Deleted' });
    } catch {
      toast.add({ type: 'error', title: 'Failed to delete' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async () => {
    const next = caseData.status === 'Active' ? 'Closed' : 'Active';
    setActionLoading('status');
    try {
      await updateCase(id, { status: next });
      toast.add({ type: 'success', title: `Case ${next === 'Closed' ? 'Closed' : 'Reopened'}` });
    } catch {
      toast.add({ type: 'error', title: 'Failed to update status' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCase = async () => {
    if (!confirm('Delete this case and all its hearings? This cannot be undone.')) return;
    setActionLoading('delete');
    try {
      await deleteCase(id);
      toast.add({ type: 'success', title: 'Case Deleted' });
      router.replace('/cases');
    } catch {
      toast.add({ type: 'error', title: 'Failed to delete case' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveNotes = async () => {
    setActionLoading('notes');
    try {
      await updateCase(id, { notes: notesText });
      setEditingNotes(false);
      toast.add({ type: 'success', title: 'Notes Saved' });
    } catch {
      toast.add({ type: 'error', title: 'Failed to save notes' });
    } finally {
      setActionLoading(null);
    }
  };

  const startEditNotes = () => { setNotesText(caseData.notes || ''); setEditingNotes(true); };

  const tags = [
    caseData.caseType,
    caseData.stage,
    caseData.cnrNumber ? `CNR: ${caseData.cnrNumber}` : null,
  ].filter(Boolean) as string[];

  const inputCls = `w-full px-3.5 py-2.5 border-[1.5px] border-border rounded-[10px] text-[14px] bg-card text-card-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-navy-700`;

  return (
    <div className="page-enter pb-8">
      {/* Header */}
      <div className="bg-navy-900 px-4 pt-5 pb-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[13px] text-white/65 hover:text-white/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />Back
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditCaseOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white/15 rounded-full text-xs font-medium hover:bg-white/25 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />Edit
            </button>
            <button
              onClick={handleDeleteCase}
              disabled={actionLoading === 'delete'}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600/30 rounded-full text-xs font-medium text-red-200 hover:bg-red-600/50 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />Delete
            </button>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full text-[11px] font-semibold mb-2.5">
          <span className={`w-1.5 h-1.5 rounded-full ${caseData.status === 'Active' ? 'bg-amber-400' : 'bg-slate-400'}`} />
          {caseData.status}
        </div>
        <h1 className="text-[22px] font-bold mb-1">{caseData.clientName}</h1>
        <div className="text-[13px] text-white/65 leading-relaxed">
          {caseData.caseNumber}&nbsp;·&nbsp;{caseData.court}
          {caseData.oppositeParty && <><br />vs. {caseData.oppositeParty}</>}
        </div>

        {tags.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {tags.map((t, i) => (
              <span key={i} className="bg-white/12 px-2.5 py-1 rounded-full text-[11px] text-white/80">{t}</span>
            ))}
          </div>
        )}

        {/* Actions row */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {caseData.clientPhone && (
            <>
              <a href={`tel:${caseData.clientPhone}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 rounded-full text-xs font-medium hover:bg-white/25 transition-colors">
                <Phone className="w-3 h-3" />Call
              </a>
              <a href={`https://wa.me/${caseData.clientPhone.replace(/[^0-9]/g, '')}`} target="_blank"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 rounded-full text-xs font-medium hover:bg-white/25 transition-colors">
                <MessageCircle className="w-3 h-3" />WhatsApp
              </a>
            </>
          )}
          <button
            onClick={handleToggleStatus}
            disabled={actionLoading === 'status'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
              caseData.status === 'Active'
                ? 'bg-white/15 text-white hover:bg-white/25'
                : 'bg-green-600/30 text-green-200 hover:bg-green-600/50'
            }`}
          >
            {caseData.status === 'Active'
              ? <><CheckCircle className="w-3 h-3" />Close Case</>
              : <><RotateCcw className="w-3 h-3" />Reopen Case</>
            }
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-card border-b border-border px-4 gap-1">
        {(['hearings', 'notes', 'info'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3.5 py-3 text-[13px] font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? 'text-navy-900 dark:text-white border-navy-900 dark:border-white font-semibold'
                : 'text-muted-foreground border-transparent'
            }`}>
            {t === 'info' ? 'Info' : t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-4 py-3 pb-4">

        {/* ── HEARINGS TAB ── */}
        {tab === 'hearings' && (
          <>
            <button
              onClick={() => setAddHearingOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-navy-900 dark:bg-white text-white dark:text-navy-900 rounded-full text-xs font-semibold mb-4 hover:bg-navy-800 dark:hover:bg-slate-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />Add Hearing
            </button>

            {caseHearings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-3xl mb-2">📅</div>
                <div className="text-sm">No hearings yet</div>
                <div className="text-xs mt-1">Tap &quot;Add Hearing&quot; to schedule one</div>
              </div>
            ) : caseHearings.map(h => {
              const hDate = parseISO(h.date);
              const isOverdue = !h.completed && isBefore(hDate, startOfDay(new Date()));
              const isTodayH = isToday(hDate);
              const chipColor = h.completed
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                : isTodayH
                  ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  : isOverdue
                    ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
              const chipLabel = h.completed ? 'Completed'
                : isTodayH ? 'Due today'
                : isOverdue ? 'Overdue'
                : 'Upcoming';

              return (
                <div key={h.id}
                  className={`bg-card rounded-[14px] shadow-[0_1px_4px_rgba(11,42,91,0.08),0_0_0_1px_rgba(11,42,91,0.06)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)] p-3.5 mb-2.5 ${
                    !h.completed && (isTodayH || isOverdue) ? 'border-l-[3px] border-l-amber-status pl-3' : ''
                  }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-[13px] font-semibold text-card-foreground">
                        {isTodayH ? 'Today — ' : ''}{format(hDate, 'd MMM yyyy')}
                      </div>
                      {h.time && <div className="text-xs text-muted-foreground">{h.time}</div>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${chipColor}`}>
                        {chipLabel}
                      </span>
                      {/* Edit hearing */}
                      <button
                        onClick={() => { setEditHearing(h); setAddHearingOpen(true); }}
                        className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                        title="Edit hearing"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {/* Delete hearing */}
                      <button
                        onClick={() => handleDeleteHearing(h.id)}
                        disabled={actionLoading === h.id + '_del'}
                        className="p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-status disabled:opacity-50"
                        title="Delete hearing"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {h.notes && <div className="text-[13px] text-muted-foreground leading-relaxed">{h.notes}</div>}
                  {h.result && (
                    <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                      Result: {h.result}
                    </div>
                  )}

                  {/* Mark Done — shows result input */}
                  {!h.completed && (
                    <div className="mt-2.5">
                      {markDoneId === h.id ? (
                        <div className="space-y-2">
                          <input
                            className={`${inputCls} text-xs py-2`}
                            placeholder="Result / outcome (optional)"
                            value={markDoneResult}
                            onChange={e => setMarkDoneResult(e.target.value)}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleMarkDone(h.id)}
                              disabled={actionLoading === h.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-900 dark:bg-white text-white dark:text-navy-900 rounded-full text-xs font-semibold hover:bg-navy-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-60"
                            >
                              <Check className="w-3 h-3" />
                              {actionLoading === h.id ? 'Saving…' : 'Confirm Done'}
                            </button>
                            <button
                              onClick={() => { setMarkDoneId(null); setMarkDoneResult(''); }}
                              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setMarkDoneId(h.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-900 dark:bg-white text-white dark:text-navy-900 rounded-full text-xs font-semibold hover:bg-navy-800 dark:hover:bg-slate-200 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />Mark Done
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* ── NOTES TAB ── */}
        {tab === 'notes' && (
          <div>
            {editingNotes ? (
              <div>
                <textarea
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-border rounded-[10px] text-[14px] bg-card text-card-foreground outline-none focus:border-navy-700 resize-none min-h-[200px]"
                  value={notesText}
                  onChange={e => setNotesText(e.target.value)}
                  autoFocus
                  placeholder="Write case notes here…"
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleSaveNotes}
                    disabled={actionLoading === 'notes'}
                    className="flex items-center gap-1.5 px-4 py-2 bg-navy-900 dark:bg-white text-white dark:text-navy-900 rounded-full text-xs font-semibold hover:bg-navy-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-60"
                  >
                    {actionLoading === 'notes' ? 'Saving…' : 'Save Notes'}
                  </button>
                  <button
                    onClick={() => setEditingNotes(false)}
                    className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <button
                  onClick={startEditNotes}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-navy-900 dark:bg-white text-white dark:text-navy-900 rounded-full text-xs font-semibold mb-4 hover:bg-navy-800 dark:hover:bg-slate-200 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />Edit Notes
                </button>
                {caseData.notes ? (
                  <div className="bg-card rounded-[14px] shadow-[0_1px_4px_rgba(11,42,91,0.08),0_0_0_1px_rgba(11,42,91,0.06)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)] p-4 text-[14px] text-card-foreground leading-relaxed whitespace-pre-wrap">
                    {caseData.notes}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="text-3xl mb-2">📝</div>
                    <div className="text-sm">No notes yet</div>
                    <div className="text-xs mt-1">Tap &quot;Edit Notes&quot; to add some</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── INFO TAB ── */}
        {tab === 'info' && (
          <div className="space-y-3">
            <InfoRow label="Status" value={caseData.status} />
            <InfoRow label="Case Number" value={caseData.caseNumber} />
            <InfoRow label="Court" value={caseData.court} />
            {caseData.oppositeParty && <InfoRow label="Opposite Party" value={caseData.oppositeParty} />}
            {caseData.caseType && <InfoRow label="Case Type" value={caseData.caseType} />}
            {caseData.stage && <InfoRow label="Stage" value={caseData.stage} />}
            {caseData.cnrNumber && <InfoRow label="CNR Number" value={caseData.cnrNumber} />}
            {caseData.clientPhone && <InfoRow label="Client Phone" value={caseData.clientPhone} />}
            {caseData.nextHearingDate && (
              <InfoRow label="Next Hearing"
                value={format(parseISO(caseData.nextHearingDate), 'd MMM yyyy')} />
            )}
            <InfoRow label="Owner" value={displayName || user?.displayName || 'You'} />
            <InfoRow label="Created" value={format(parseISO(caseData.createdAt), 'd MMM yyyy')} />
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AddHearingDialog
        open={addHearingOpen}
        onOpenChange={(v) => { if (!v) setEditHearing(undefined); setAddHearingOpen(v); }}
        caseId={id}
        existingHearing={editHearing}
      />
      <EditCaseSheet
        open={editCaseOpen}
        onOpenChange={setEditCaseOpen}
        caseData={caseData}
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card rounded-[14px] shadow-[0_1px_4px_rgba(11,42,91,0.08),0_0_0_1px_rgba(11,42,91,0.06)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)] px-4 py-3 flex justify-between items-center">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <span className="text-sm text-card-foreground font-medium text-right max-w-[60%] break-words">{value}</span>
    </div>
  );
}
