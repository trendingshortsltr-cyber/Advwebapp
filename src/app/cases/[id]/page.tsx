"use client";
import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { AddHearingDialog } from '@/components/add-hearing-dialog';
import { toast } from '@/components/ui/toast';
import { ArrowLeft, Phone, MessageCircle, Check, Plus, Edit3, Save } from 'lucide-react';
import { format, parseISO, isToday, isBefore, startOfDay } from 'date-fns';

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getCase, getCaseHearings, updateHearing, updateCase } = useStore();
  const [tab, setTab] = useState<'hearings' | 'notes' | 'members'>('hearings');
  const [addHearingOpen, setAddHearingOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');

  const caseData = getCase(id);
  const caseHearings = useMemo(() => getCaseHearings(id), [id, getCaseHearings]);

  if (!caseData) return <div className="flex items-center justify-center min-h-screen text-muted-foreground"><div className="text-center"><div className="text-4xl mb-3">📁</div><div className="text-sm">Case not found</div><button onClick={() => router.back()} className="mt-3 text-navy-700 text-sm font-medium">Go back</button></div></div>;

  const handleMarkDone = (hId: string) => {
    updateHearing(hId, { completed: true, result: 'Completed' });
    toast.add({ type: 'success', title: 'Hearing Marked Done' });
  };

  const handleSaveNotes = () => {
    updateCase(id, { notes: notesText });
    setEditingNotes(false);
    toast.add({ type: 'success', title: 'Notes Saved' });
  };

  const startEditNotes = () => { setNotesText(caseData.notes || ''); setEditingNotes(true); };

  const tags = [caseData.caseType, caseData.stage, caseData.cnrNumber ? `CNR: ${caseData.cnrNumber}` : null].filter(Boolean);

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="bg-navy-900 px-4 pt-5 pb-5 text-white">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[13px] text-white/65 mb-4 hover:text-white/90 transition-colors">
          <ArrowLeft className="w-4 h-4" />Back
        </button>
        <div className="inline-flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full text-[11px] font-semibold mb-2.5">
          <span className={`w-1.5 h-1.5 rounded-full ${caseData.status === 'Active' ? 'bg-amber-400' : 'bg-slate-400'}`} />
          {caseData.status}
        </div>
        <h1 className="text-[22px] font-bold mb-1">{caseData.clientName}</h1>
        <div className="text-[13px] text-white/65 leading-relaxed">
          {caseData.caseNumber} &nbsp;·&nbsp; {caseData.court}
          {caseData.oppositeParty && <><br />Opposite: {caseData.oppositeParty}</>}
        </div>
        {tags.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {tags.map((t, i) => <span key={i} className="bg-white/12 px-2.5 py-1 rounded-full text-[11px] text-white/80">{t}</span>)}
          </div>
        )}
        {caseData.clientPhone && (
          <div className="flex gap-2 mt-3">
            <a href={`tel:${caseData.clientPhone}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 rounded-full text-xs font-medium hover:bg-white/25 transition-colors"><Phone className="w-3 h-3" />Call</a>
            <a href={`https://wa.me/${caseData.clientPhone.replace(/[^0-9]/g, '')}`} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 rounded-full text-xs font-medium hover:bg-white/25 transition-colors"><MessageCircle className="w-3 h-3" />WhatsApp</a>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-card border-b border-border px-4 gap-1">
        {(['hearings', 'notes', 'members'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3.5 py-3 text-[13px] font-medium border-b-2 transition-colors capitalize ${tab === t ? 'text-navy-900 dark:text-white border-navy-900 dark:border-white font-semibold' : 'text-muted-foreground border-transparent'}`}>{t}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-4 py-3 pb-4">
        {tab === 'hearings' && (
          <>
            <button onClick={() => setAddHearingOpen(true)} className="flex items-center gap-1.5 px-3.5 py-2 bg-navy-900 dark:bg-white text-white dark:text-navy-900 rounded-full text-xs font-semibold mb-4 hover:bg-navy-800 dark:hover:bg-slate-200 transition-colors">
              <Plus className="w-3.5 h-3.5" />Add Hearing
            </button>
            {caseHearings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground"><div className="text-3xl mb-2">📅</div><div className="text-sm">No hearings yet</div></div>
            ) : caseHearings.map(h => {
              const hDate = parseISO(h.date);
              const isOverdue = !h.completed && isBefore(hDate, startOfDay(new Date()));
              const isTodayH = isToday(hDate);
              const chipColor = h.completed ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : isTodayH ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : isOverdue ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
              const chipLabel = h.completed ? 'Completed' : isTodayH ? 'Due today' : isOverdue ? 'Overdue' : 'Upcoming';
              return (
                <div key={h.id} className={`bg-card rounded-[14px] shadow-[0_1px_4px_rgba(11,42,91,0.08),0_0_0_1px_rgba(11,42,91,0.06)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)] p-3.5 mb-2.5 ${!h.completed && (isTodayH || isOverdue) ? 'border-l-[3px] border-l-amber-status pl-3' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-[13px] font-semibold text-card-foreground">{isTodayH ? 'Today — ' : ''}{format(hDate, 'd MMM yyyy')}</div>
                      {h.time && <div className="text-xs text-muted-foreground">{h.time}</div>}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${chipColor}`}>{chipLabel}</span>
                  </div>
                  {h.notes && <div className="text-[13px] text-muted-foreground leading-relaxed">{h.notes}</div>}
                  {h.result && <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">Result: {h.result}</div>}
                  {!h.completed && (
                    <button onClick={() => handleMarkDone(h.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-900 dark:bg-white text-white dark:text-navy-900 rounded-full text-xs font-semibold mt-2 hover:bg-navy-800 dark:hover:bg-slate-200 transition-colors">
                      <Check className="w-3.5 h-3.5" />Mark Done
                    </button>
                  )}
                </div>
              );
            })}
          </>
        )}

        {tab === 'notes' && (
          <div>
            {editingNotes ? (
              <div>
                <textarea className="w-full px-3.5 py-2.5 border-[1.5px] border-border rounded-[10px] text-[14px] bg-card text-card-foreground outline-none focus:border-navy-700 resize-none min-h-[200px]" value={notesText} onChange={e => setNotesText(e.target.value)} autoFocus />
                <div className="flex gap-2 mt-3">
                  <button onClick={handleSaveNotes} className="flex items-center gap-1.5 px-4 py-2 bg-navy-900 dark:bg-white text-white dark:text-navy-900 rounded-full text-xs font-semibold hover:bg-navy-800 dark:hover:bg-slate-200 transition-colors"><Save className="w-3.5 h-3.5" />Save</button>
                  <button onClick={() => setEditingNotes(false)} className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <button onClick={startEditNotes} className="flex items-center gap-1.5 px-3.5 py-2 bg-navy-900 dark:bg-white text-white dark:text-navy-900 rounded-full text-xs font-semibold mb-4 hover:bg-navy-800 dark:hover:bg-slate-200 transition-colors"><Edit3 className="w-3.5 h-3.5" />Edit Notes</button>
                {caseData.notes ? <div className="bg-card rounded-[14px] shadow-[0_1px_4px_rgba(11,42,91,0.08),0_0_0_1px_rgba(11,42,91,0.06)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)] p-4 text-[14px] text-card-foreground leading-relaxed whitespace-pre-wrap">{caseData.notes}</div> : <div className="text-center py-12 text-muted-foreground"><div className="text-3xl mb-2">📝</div><div className="text-sm">No notes yet</div></div>}
              </div>
            )}
          </div>
        )}

        {tab === 'members' && (
          <div>
            <div className="bg-card rounded-[14px] shadow-[0_1px_4px_rgba(11,42,91,0.08),0_0_0_1px_rgba(11,42,91,0.06)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)] p-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-navy-900/10 dark:bg-white/10 rounded-full flex items-center justify-center text-navy-900 dark:text-white font-semibold text-sm">AS</div>
                <div><div className="text-sm font-semibold text-card-foreground">Adv. Sharma</div><div className="text-xs text-muted-foreground">Owner · You</div></div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">Team sharing will be available soon</p>
          </div>
        )}
      </div>

      <AddHearingDialog open={addHearingOpen} onOpenChange={setAddHearingOpen} caseId={id} />
    </div>
  );
}
