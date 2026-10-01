"use client";
import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { CaseCard } from '@/components/case-card';
import { SummaryCard } from '@/components/summary-card';
import { AddCaseSheet } from '@/components/add-case-sheet';
import { Plus } from 'lucide-react';
import { format, parseISO, isToday, isBefore, startOfDay, addDays } from 'date-fns';

export default function TodayPage() {
  const { cases, hearings } = useStore();
  const [addOpen, setAddOpen] = useState(false);
  const today = startOfDay(new Date());

  const grouped = useMemo(() => {
    const overdue: { c: typeof cases[0]; time?: string }[] = [];
    const todayList: { c: typeof cases[0]; time?: string }[] = [];
    const upcoming: { c: typeof cases[0]; time?: string }[] = [];

    for (const c of cases) {
      if (c.status === 'Closed') continue;
      const cHearings = hearings.filter(h => h.caseId === c.id && !h.completed).sort((a, b) => a.date.localeCompare(b.date));
      const next = cHearings[0];
      if (!next) continue;
      const d = parseISO(next.date);
      if (isBefore(d, today)) overdue.push({ c, time: next.time });
      else if (isToday(d)) todayList.push({ c, time: next.time });
      else if (isBefore(d, addDays(today, 8))) upcoming.push({ c, time: next.time });
    }
    return { overdue, todayList, upcoming };
  }, [cases, hearings, today]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning,';
    if (h < 17) return 'Good afternoon,';
    return 'Good evening,';
  })();

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-muted-foreground">{greeting}</div>
          <div className="text-xl font-bold text-foreground">Adv. Sharma 👋</div>
          <div className="text-[13px] text-muted-foreground mt-0.5">{format(new Date(), 'EEEE, d MMMM yyyy')}</div>
        </div>
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-border shadow-sm flex-shrink-0 bg-slate-100 dark:bg-navy-900">
          {/* Default fallback avatar from ui-avatars, can be easily replaced by a real photo URL */}
          <img 
            src="https://ui-avatars.com/api/?name=Adv+Sharma&background=0B2A5B&color=fff&size=150&bold=true" 
            alt="Advocate Logo/Photo" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Summary */}
      <SummaryCard todayCount={grouped.todayList.length} overdueCount={grouped.overdue.length} upcomingCount={grouped.upcoming.length} />

      {/* Case Lists */}
      <div className="px-4 pb-4 no-scrollbar">
        {grouped.todayList.length > 0 && (
          <>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-2">Today</div>
            {grouped.todayList.map(({ c, time }) => <CaseCard key={c.id} caseData={c} hearingTime={time} />)}
          </>
        )}
        {grouped.todayList.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-sm font-medium">No hearings scheduled for today</div>
            <div className="text-xs mt-1">Tap + to add a new case</div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setAddOpen(true)} className="fixed bottom-[88px] right-4 w-[52px] h-[52px] bg-gold-500 rounded-2xl flex items-center justify-center shadow-[0_4px_16px_rgba(217,119,6,0.4)] hover:scale-105 active:scale-95 transition-transform z-30 fab-animate max-w-lg">
        <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
      </button>
      <AddCaseSheet open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
