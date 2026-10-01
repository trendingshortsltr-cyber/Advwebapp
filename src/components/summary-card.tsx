"use client";
import { Calendar } from 'lucide-react';

export function SummaryCard({ todayCount, overdueCount, upcomingCount }: { todayCount: number; overdueCount: number; upcomingCount: number }) {
  const parts: string[] = [];
  if (overdueCount > 0) parts.push(`${overdueCount} overdue`);
  if (upcomingCount > 0) parts.push(`${upcomingCount} upcoming`);
  const total = todayCount + overdueCount;

  return (
    <div className="bg-navy-900 rounded-[14px] p-4 text-white flex justify-between items-center shadow-[0_4px_16px_rgba(11,42,91,0.3)] mx-4 mb-4">
      <div>
        <div className="text-[13px] text-white/65 mb-1">Today&apos;s hearings</div>
        <div className="text-[28px] font-bold leading-none">{total}</div>
        {parts.length > 0 && <div className="text-xs text-white/50 mt-0.5">{parts.join(' · ')}</div>}
      </div>
      <div className="w-12 h-12 bg-white/12 rounded-xl flex items-center justify-center">
        <Calendar className="w-6 h-6 text-white/90" strokeWidth={1.75} />
      </div>
    </div>
  );
}
