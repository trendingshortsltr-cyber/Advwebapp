"use client";
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { User, Moon, Sun, LogOut, Trash2, Info } from 'lucide-react';

export default function ProfilePage() {
  const { cases, hearings } = useStore();
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('advdiary-theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('advdiary-theme', next ? 'dark' : 'light');
  };

  const handleClearData = () => {
    if (confirm('Reset all data? This will remove all cases and hearings and reload demo data.')) {
      localStorage.removeItem('advdiary-cases');
      localStorage.removeItem('advdiary-hearings');
      window.location.reload();
    }
  };

  const activeCases = cases.filter(c => c.status === 'Active').length;
  const closedCases = cases.filter(c => c.status === 'Closed').length;
  const totalHearings = hearings.length;

  return (
    <div className="page-enter">
      <div className="px-4 pt-5 pb-3">
        <h1 className="text-xl font-bold text-foreground">Profile</h1>
      </div>

      <div className="px-4">
        {/* User Info */}
        <div className="bg-card rounded-[14px] shadow-[0_1px_4px_rgba(11,42,91,0.08),0_0_0_1px_rgba(11,42,91,0.06)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)] p-5 mb-4">
          <div className="flex items-center gap-4">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-border" />
            ) : (
              <div className="w-16 h-16 bg-navy-900/10 dark:bg-white/10 rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-navy-900 dark:text-white" />
              </div>
            )}
            <div>
              <div className="text-lg font-bold text-card-foreground">{user?.displayName || 'Advocate'}</div>
              <div className="text-sm text-muted-foreground">{user?.email || ''}</div>
              <div className="text-xs text-green-600 font-medium mt-0.5">● Signed in with Google</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <div className="bg-card rounded-[14px] shadow-[0_1px_4px_rgba(11,42,91,0.08),0_0_0_1px_rgba(11,42,91,0.06)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)] p-3.5 text-center">
            <div className="text-xl font-bold text-card-foreground">{activeCases}</div>
            <div className="text-[11px] text-muted-foreground font-medium">Active</div>
          </div>
          <div className="bg-card rounded-[14px] shadow-[0_1px_4px_rgba(11,42,91,0.08),0_0_0_1px_rgba(11,42,91,0.06)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)] p-3.5 text-center">
            <div className="text-xl font-bold text-card-foreground">{closedCases}</div>
            <div className="text-[11px] text-muted-foreground font-medium">Closed</div>
          </div>
          <div className="bg-card rounded-[14px] shadow-[0_1px_4px_rgba(11,42,91,0.08),0_0_0_1px_rgba(11,42,91,0.06)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)] p-3.5 text-center">
            <div className="text-xl font-bold text-card-foreground">{totalHearings}</div>
            <div className="text-[11px] text-muted-foreground font-medium">Hearings</div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-card rounded-[14px] shadow-[0_1px_4px_rgba(11,42,91,0.08),0_0_0_1px_rgba(11,42,91,0.06)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)] overflow-hidden mb-4">
          <button onClick={toggleDark} className="flex items-center justify-between w-full px-4 py-3.5 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              {isDark ? <Moon className="w-5 h-5 text-muted-foreground" /> : <Sun className="w-5 h-5 text-muted-foreground" />}
              <span className="text-sm font-medium text-card-foreground">Dark Mode</span>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors flex items-center ${isDark ? 'bg-navy-700 justify-end' : 'bg-slate-200 justify-start'}`}>
              <div className="w-5 h-5 bg-white rounded-full shadow-sm mx-0.5" />
            </div>
          </button>
          <div className="h-px bg-border mx-4" />
          <button onClick={handleClearData} className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-muted/50 transition-colors text-left">
            <Trash2 className="w-5 h-5 text-red-status" />
            <div>
              <span className="text-sm font-medium text-red-status">Reset Demo Data</span>
              <div className="text-xs text-muted-foreground">Clear all data and reload demo</div>
            </div>
          </button>
          <div className="h-px bg-border mx-4" />
          <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-muted/50 transition-colors">
            <LogOut className="w-5 h-5 text-red-status" />
            <span className="text-sm font-medium text-red-status">Sign Out</span>
          </button>
        </div>

        {/* App Info */}
        <div className="flex items-center justify-center gap-1.5 py-4 text-muted-foreground">
          <Info className="w-3.5 h-3.5" />
          <span className="text-xs">AdvDiary 2.0 · Demo Mode</span>
        </div>
      </div>
    </div>
  );
}
