"use client";
import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, parseISO, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarPage() {
  const { hearings, cases } = useStore();
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const hearingsByDate = useMemo(() => {
    const map = new Map<string, typeof hearings>();
    hearings.forEach(h => {
      const key = h.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(h);
    });
    return map;
  }, [hearings]);

  const selectedHearings = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, 'yyyy-MM-dd');
    return (hearingsByDate.get(key) || []).map(h => {
      const c = cases.find(c => c.id === h.caseId);
      return { hearing: h, caseData: c };
    });
  }, [selectedDate, hearingsByDate, cases]);

  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="page-enter">
      <div className="px-4 pt-5 pb-3">
        <h1 className="text-xl font-bold text-foreground">Calendar</h1>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between px-4 mb-3">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-muted transition-colors"><ChevronLeft className="w-5 h-5 text-foreground" /></button>
        <h2 className="text-[15px] font-semibold text-foreground">{format(currentMonth, 'MMMM yyyy')}</h2>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-muted transition-colors"><ChevronRight className="w-5 h-5 text-foreground" /></button>
      </div>

      {/* Calendar Grid */}
      <div className="px-4 mb-4">
        <div className="bg-card rounded-[14px] shadow-[0_1px_4px_rgba(11,42,91,0.08),0_0_0_1px_rgba(11,42,91,0.06)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)] p-3">
          <div className="grid grid-cols-7 gap-0">
            {weekdays.map((d, i) => <div key={i} className="text-center text-[11px] font-semibold text-muted-foreground py-1.5">{d}</div>)}
            {Array.from({ length: startPadding }).map((_, i) => <div key={`pad-${i}`} />)}
            {days.map(day => {
              const key = format(day, 'yyyy-MM-dd');
              const count = hearingsByDate.get(key)?.length || 0;
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const hasOverdue = hearingsByDate.get(key)?.some(h => !h.completed && day < new Date()) || false;
              return (
                <button key={key} onClick={() => setSelectedDate(day)}
                  className={`flex flex-col items-center py-1.5 rounded-lg transition-colors ${isSelected ? 'bg-navy-900 text-white dark:bg-white dark:text-navy-900' : isToday ? 'bg-gold-400/15 text-gold-500' : 'hover:bg-muted'}`}>
                  <span className={`text-[13px] font-medium ${!isSelected && !isToday ? 'text-card-foreground' : ''}`}>{format(day, 'd')}</span>
                  {count > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                        <span key={i} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/70 dark:bg-navy-900/70' : hasOverdue ? 'bg-red-status' : 'bg-navy-700 dark:bg-slate-400'}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Date Hearings */}
      {selectedDate && (
        <div className="px-4 pb-4">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{format(selectedDate, 'EEEE, d MMMM')}</div>
          {selectedHearings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No hearings on this date</div>
          ) : selectedHearings.map(({ hearing: h, caseData: c }) => (
            <div key={h.id} onClick={() => c && router.push(`/cases/${c.id}`)}
              className="bg-card rounded-[14px] shadow-[0_1px_4px_rgba(11,42,91,0.08),0_0_0_1px_rgba(11,42,91,0.06)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)] p-3.5 mb-2.5 cursor-pointer case-card-hover">
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-card-foreground truncate">{c?.clientName || 'Unknown'}</div>
                  <div className="text-xs text-muted-foreground truncate">{c?.caseNumber} · {h.time || 'No time set'}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0 ml-2 ${h.completed ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}`}>{h.completed ? 'Done' : 'Pending'}</span>
              </div>
              {h.notes && <div className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{h.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
