"use client";
import { usePathname, useRouter } from 'next/navigation';
import { Clock, Folder, Calendar, User } from 'lucide-react';

const items = [
  { path: '/', label: 'Today', icon: Clock },
  { path: '/cases', label: 'Cases', icon: Folder },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = (path: string) => path === '/' ? pathname === '/' : pathname.startsWith(path);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border pb-safe">
      <div className="flex justify-around items-center gap-1 px-2 pt-1.5 max-w-lg mx-auto">
        {items.map(item => {
          const active = isActive(item.path);
          return (
            <button key={item.path} onClick={() => router.push(item.path)} aria-current={active ? 'page' : undefined}
              className={`nav-link flex flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 rounded-xl min-h-12 min-w-0 ${active ? 'bg-navy-900/8 dark:bg-white/8' : ''}`}>
              <item.icon className={`w-[22px] h-[22px] transition-transform duration-200 ${active ? 'scale-105 text-navy-900 dark:text-white' : 'text-slate-400'}`} strokeWidth={1.75} />
              <span className={`text-[10px] ${active ? 'font-semibold text-navy-900 dark:text-white' : 'font-medium text-slate-400'}`}>{item.label}</span>
              {active && <div className="nav-indicator w-4 h-[3px] bg-navy-900 dark:bg-white rounded-full" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
