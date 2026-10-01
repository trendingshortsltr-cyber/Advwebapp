"use client";
import { useStore } from '@/lib/store';
import { Users, UserPlus } from 'lucide-react';

export default function TeamPage() {
  const { cases } = useStore();
  const activeCases = cases.filter(c => c.status === 'Active').length;

  return (
    <div className="page-enter">
      <div className="px-4 pt-5 pb-3">
        <h1 className="text-xl font-bold text-foreground">Team</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Manage your team & shared cases</p>
      </div>

      <div className="px-4">
        {/* Current User */}
        <div className="bg-card rounded-[14px] shadow-[0_1px_4px_rgba(11,42,91,0.08),0_0_0_1px_rgba(11,42,91,0.06)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)] p-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-navy-900/10 dark:bg-white/10 rounded-full flex items-center justify-center">
              <span className="text-navy-900 dark:text-white font-bold text-lg">AS</span>
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-semibold text-card-foreground">Adv. Sharma</div>
              <div className="text-xs text-muted-foreground">Owner · {activeCases} active cases</div>
            </div>
            <div className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-[11px] font-semibold">Online</div>
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card rounded-[14px] shadow-[0_1px_4px_rgba(11,42,91,0.08),0_0_0_1px_rgba(11,42,91,0.06)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)] p-4 text-center">
            <Users className="w-6 h-6 text-navy-700 dark:text-slate-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-card-foreground">1</div>
            <div className="text-xs text-muted-foreground mt-0.5">Team Members</div>
          </div>
          <div className="bg-card rounded-[14px] shadow-[0_1px_4px_rgba(11,42,91,0.08),0_0_0_1px_rgba(11,42,91,0.06)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)] p-4 text-center">
            <div className="w-6 h-6 mx-auto mb-2 text-navy-700 dark:text-slate-400 flex items-center justify-center text-lg">📂</div>
            <div className="text-2xl font-bold text-card-foreground">0</div>
            <div className="text-xs text-muted-foreground mt-0.5">Shared Cases</div>
          </div>
        </div>

        {/* Invite CTA */}
        <div className="bg-gradient-to-r from-navy-900 to-navy-700 rounded-[14px] p-5 text-white text-center">
          <UserPlus className="w-8 h-8 mx-auto mb-3 text-white/80" />
          <div className="text-[15px] font-semibold mb-1">Invite Team Members</div>
          <div className="text-xs text-white/60 mb-4">Share cases with junior advocates and clerks for seamless collaboration.</div>
          <button className="px-5 py-2.5 bg-white text-navy-900 rounded-full text-sm font-semibold hover:bg-slate-100 transition-colors" onClick={() => alert('Team invitations coming soon! This feature will be available with Firebase Auth.')}>
            Send Invite
          </button>
        </div>
      </div>
    </div>
  );
}
