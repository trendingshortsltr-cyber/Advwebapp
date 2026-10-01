"use client";
import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { CaseCard } from '@/components/case-card';
import { AddCaseSheet } from '@/components/add-case-sheet';
import { Plus, Search } from 'lucide-react';

export default function CasesPage() {
  const { cases } = useStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = cases;
    if (filter === 'active') list = list.filter(c => c.status === 'Active');
    if (filter === 'closed') list = list.filter(c => c.status === 'Closed');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.clientName.toLowerCase().includes(q) || c.caseNumber.toLowerCase().includes(q) || c.court.toLowerCase().includes(q));
    }
    return list;
  }, [cases, filter, search]);

  const tabs: { key: typeof filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: cases.length },
    { key: 'active', label: 'Active', count: cases.filter(c => c.status === 'Active').length },
    { key: 'closed', label: 'Closed', count: cases.filter(c => c.status === 'Closed').length },
  ];

  return (
    <div className="page-enter">
      <div className="px-4 pt-5 pb-3">
        <h1 className="text-xl font-bold text-foreground">Cases</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">{cases.length} total cases</p>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input className="w-full pl-9 pr-3 py-2.5 bg-card border border-border rounded-xl text-sm placeholder:text-muted-foreground outline-none focus:border-navy-700 transition-colors" placeholder="Search by name, case number, or court…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 px-4 mb-4">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filter === t.key ? 'bg-navy-900 text-white dark:bg-white dark:text-navy-900' : 'bg-muted text-muted-foreground hover:bg-border'}`}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Case List */}
      <div className="px-4 pb-4">
        {filtered.length > 0 ? filtered.map(c => <CaseCard key={c.id} caseData={c} showActions={false} />) : (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">🔍</div>
            <div className="text-sm font-medium">No cases found</div>
            <div className="text-xs mt-1">{search ? 'Try a different search' : 'Tap + to add your first case'}</div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setAddOpen(true)} className="fixed bottom-[88px] right-4 w-[52px] h-[52px] bg-gold-500 rounded-2xl flex items-center justify-center shadow-[0_4px_16px_rgba(217,119,6,0.4)] hover:scale-105 active:scale-95 transition-transform z-30 fab-animate">
        <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
      </button>
      <AddCaseSheet open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
