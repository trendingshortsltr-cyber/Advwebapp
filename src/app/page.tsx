"use client";
import Image from 'next/image';
import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { CaseCard } from '@/components/case-card';
import { SummaryCard } from '@/components/summary-card';
import { AddCaseSheet } from '@/components/add-case-sheet';
import { Plus } from 'lucide-react';
import { format, parseISO, isToday, isBefore, startOfDay, addDays } from 'date-fns';

function SectionLabel({ text }: { text: string }) {
  return <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-2">{text}</div>;
}

export default function TodayPage() {
  const { cases, hearings } = useStore();
  const { user, displayName, photoURL } = useAuth();
  const [addOpen, setAddOpen] = useState(false);

  const grouped = useMemo(() => {
    const today = startOfDay(new Date());
    const overdue:   { c: typeof cases[0]; time?: string; date: string }[] = [];
    const todayList: { c: typeof cases[0]; time?: string; date: string }[] = [];
    const upcoming:  { c: typeof cases[0]; time?: string; date: string }[] = [];
    const appointmentsByCase = new Map<string, Map<string, string | undefined>>();

    for (const hearing of hearings) {
      if (hearing.completed) continue;
      const appointments = appointmentsByCase.get(hearing.caseId) || new Map();
      if (!appointments.has(hearing.date) || (!appointments.get(hearing.date) && hearing.time)) {
        appointments.set(hearing.date, hearing.time);
      }
      appointmentsByCase.set(hearing.caseId, appointments);
    }

    for (const c of cases) {
      if (c.status === 'Closed') continue;
      const appointments = appointmentsByCase.get(c.id) || new Map();
      if (c.nextHearingDate && !appointments.has(c.nextHearingDate)) {
        appointments.set(c.nextHearingDate, undefined);
      }
      for (const [date, time] of appointments) {
        const d = parseISO(date);
        const item = { c, time, date };
        if (isBefore(d, today)) overdue.push(item);
        else if (isToday(d)) todayList.push(item);
        else if (isBefore(d, addDays(today, 8))) upcoming.push(item);
      }
    }
    const byDate = (a: (typeof overdue)[number], b: (typeof overdue)[number]) =>
      a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '');
    overdue.sort(byDate);
    todayList.sort(byDate);
    upcoming.sort(byDate);
    return { overdue, todayList, upcoming };
  }, [cases, hearings]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning,';
    if (h < 17) return 'Good afternoon,';
    return 'Good evening,';
  })();

  const userName = displayName || user?.displayName || 'Advocate';

  const isEmpty = grouped.overdue.length === 0 && grouped.todayList.length === 0 && grouped.upcoming.length === 0;

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-muted-foreground">{greeting}</div>
          <div className="text-xl font-bold text-foreground">{userName} 👋</div>
          <div className="text-[13px] text-muted-foreground mt-0.5">{format(new Date(), 'EEEE, d MMMM yyyy')}</div>
        </div>
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-border shadow-sm flex-shrink-0 bg-slate-100 dark:bg-navy-900 flex items-center justify-center">
          {photoURL
            ? <Image src={photoURL} alt="Profile Photo" width={48} height={48} unoptimized className="w-full h-full object-cover" />
            : <span className="text-sm font-semibold text-navy-900 dark:text-white">{userName.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()}</span>}
        </div>
      </div>

      {/* Summary */}
      <SummaryCard
        todayCount={grouped.todayList.length}
        overdueCount={grouped.overdue.length}
        upcomingCount={grouped.upcoming.length}
      />

      {/* Case Lists */}
      <div className="px-4 pb-4 no-scrollbar">
        {/* Overdue */}
        {grouped.overdue.length > 0 && (
          <>
            <SectionLabel text={`Overdue (${grouped.overdue.length})`} />
            <div className="motion-stagger">
            {grouped.overdue.map(({ c, time, date }) => (
              <CaseCard key={`${c.id}-${date}`} caseData={c} hearingTime={time} hearingDate={date} />
            ))}
            </div>
          </>
        )}

        {/* Today */}
        {grouped.todayList.length > 0 && (
          <>
            <SectionLabel text="Today" />
            <div className="motion-stagger">
            {grouped.todayList.map(({ c, time, date }) => (
              <CaseCard key={`${c.id}-${date}`} caseData={c} hearingTime={time} hearingDate={date} />
            ))}
            </div>
          </>
        )}

        {/* Upcoming (next 7 days) */}
        {grouped.upcoming.length > 0 && (
          <>
            <SectionLabel text="Upcoming (next 7 days)" />
            <div className="motion-stagger">
            {grouped.upcoming.map(({ c, time, date }) => (
              <CaseCard key={`${c.id}-${date}`} caseData={c} hearingTime={time} hearingDate={date} />
            ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-sm font-medium">No upcoming hearings</div>
            <div className="text-xs mt-1">Tap + to add a new case or schedule a hearing</div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setAddOpen(true)}
        aria-label="Add case"
        className="app-fab fab-enter fixed w-[52px] h-[52px] bg-gold-500 rounded-2xl flex items-center justify-center shadow-[0_4px_16px_rgba(217,119,6,0.4)] transition-transform z-30"
      >
        <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
      </button>
      <AddCaseSheet open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
