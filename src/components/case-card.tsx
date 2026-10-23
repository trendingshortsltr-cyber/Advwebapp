"use client";
import { useRouter } from 'next/navigation';
import { Phone, MessageCircle, ChevronRight } from 'lucide-react';
import type { Case } from '@/lib/types';
import { format, parseISO, isToday, isBefore, startOfDay } from 'date-fns';

type CardType = 'overdue' | 'today' | 'active' | 'closed';

function getCardType(c: Case, hearingDate = c.nextHearingDate): CardType {
  if (c.status === 'Closed') return 'closed';
  if (!hearingDate) return 'active';
  const d = parseISO(hearingDate);
  if (isToday(d)) return 'today';
  if (isBefore(d, startOfDay(new Date()))) return 'overdue';
  return 'active';
}

const borderColors: Record<CardType, string> = { overdue: 'bg-red-status', today: 'bg-amber-status', active: 'bg-green-status', closed: 'bg-slate-400' };
const chipStyles: Record<CardType, string> = {
  overdue: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  today: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  active: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  closed: 'bg-slate-100 dark:bg-slate-800 text-slate-500',
};
const chipLabels: Record<CardType, string> = { overdue: 'Overdue', today: 'Today', active: 'Active', closed: 'Closed' };

export function CaseCard({ caseData, hearingTime, hearingDate, showActions = true }: { caseData: Case; hearingTime?: string; hearingDate?: string; showActions?: boolean }) {
  const router = useRouter();
  const effectiveHearingDate = hearingDate ?? caseData.nextHearingDate;
  const type = getCardType(caseData, effectiveHearingDate);
  const dateLabel = effectiveHearingDate ? (() => { try { return format(parseISO(effectiveHearingDate), 'd MMM'); } catch { return ''; } })() : '';

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (caseData.clientPhone) window.open(`tel:${caseData.clientPhone}`);
  };
  const handleWA = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (caseData.clientPhone) { const num = caseData.clientPhone.replace(/[^0-9]/g, ''); window.open(`https://wa.me/${num}`, '_blank'); }
  };

  return (
    <div onClick={() => router.push(`/case/?id=${encodeURIComponent(caseData.id)}`)}
      className="bg-card rounded-[14px] shadow-[0_1px_4px_rgba(11,42,91,0.08),0_0_0_1px_rgba(11,42,91,0.06)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)] flex overflow-hidden cursor-pointer case-card-hover mb-2.5">
      <div className={`w-1 rounded-l-[14px] flex-shrink-0 ${borderColors[type]}`} />
      <div className="flex-1 min-w-0 p-3.5 pl-3">
        <div className="text-[15px] font-semibold text-card-foreground truncate">{caseData.clientName}</div>
        <div className="text-xs text-muted-foreground mt-0.5 truncate">{caseData.caseNumber} · {caseData.court}</div>
        <div className="flex items-center justify-between mt-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${chipStyles[type]}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {chipLabels[type]}{type === 'today' && hearingTime ? ` · ${hearingTime}` : ''}
          </span>
          {dateLabel && <span className="text-[11px] text-muted-foreground font-medium">{type === 'overdue' ? `Was ${dateLabel}` : dateLabel}</span>}
        </div>
        {showActions && caseData.clientPhone && (
          <div className="flex gap-1.5 mt-2.5">
            <button onClick={handleCall} aria-label={`Call ${caseData.clientName}`} className="flex min-h-10 items-center gap-1.5 px-3 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground hover:border-green-status hover:text-green-status transition-colors">
              <Phone className="w-[11px] h-[11px]" />Call
            </button>
            <button onClick={handleWA} aria-label={`WhatsApp ${caseData.clientName}`} className="flex min-h-10 items-center gap-1.5 px-3 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground hover:border-[#25D366] hover:text-[#25D366] transition-colors">
              <MessageCircle className="w-[11px] h-[11px]" />WhatsApp
            </button>
            <button onClick={(e) => { e.stopPropagation(); router.push(`/case/?id=${encodeURIComponent(caseData.id)}`); }} className="flex min-h-10 items-center gap-1.5 px-3 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
              Open <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export { getCardType };
