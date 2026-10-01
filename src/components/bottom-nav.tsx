"use client";
import { usePathname, useRouter } from 'next/navigation';
import { Clock, Folder, Calendar, Users, User } from 'lucide-react';

const items = [
  { path: '/', label: 'Today', icon: Clock },
  { path: '/cases', label: 'Cases', icon: Folder },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/team', label: 'Team', icon: Users },
  { path: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = (path: string) => path === '/' ? pathname === '/' : pathname.startsWith(path);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border pb-safe">
      <div className="flex justify-around items-center px-2 py-1.5 max-w-lg mx-auto">
        {items.map(item => {
          const active = isActive(item.path);
          return (
            <button key={item.path} onClick={() => router.push(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[56px] ${active ? 'bg-navy-900/8 dark:bg-white/8' : ''}`}>
              <item.icon className={`w-[22px] h-[22px] ${active ? 'text-navy-900 dark:text-white' : 'text-slate-400'}`} strokeWidth={1.75} />
              <span className={`text-[10px] ${active ? 'font-semibold text-navy-900 dark:text-white' : 'font-medium text-slate-400'}`}>{item.label}</span>
              {active && <div className="w-4 h-[3px] bg-navy-900 dark:bg-white rounded-full" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
