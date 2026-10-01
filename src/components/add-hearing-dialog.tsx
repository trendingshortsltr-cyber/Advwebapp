"use client";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useStore } from '@/lib/store';
import { toast } from '@/components/ui/toast';
import { format } from 'date-fns';

export function AddHearingDialog({ open, onOpenChange, caseId }: { open: boolean; onOpenChange: (v: boolean) => void; caseId: string }) {
  const { addHearing } = useStore();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('10:00 AM');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(false);

  const reset = () => { setDate(format(new Date(), 'yyyy-MM-dd')); setTime('10:00 AM'); setNotes(''); setError(false); };
  const inputCls = (err?: boolean) => `w-full px-3.5 py-2.5 border-[1.5px] rounded-[10px] text-[15px] bg-card text-card-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-navy-700 ${err ? 'border-red-status' : 'border-border'}`;

  const handleSave = () => {
    if (!date) { setError(true); return; }
    addHearing({ caseId, date, time: time || undefined, notes: notes.trim() || undefined });
    toast.add({ type: 'success', title: 'Hearing Added', description: `Hearing on ${format(new Date(date + 'T00:00:00'), 'd MMM yyyy')} added` });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-[340px]">
        <DialogHeader>
          <DialogTitle>Add Hearing</DialogTitle>
          <DialogDescription>Schedule a new hearing date</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1.5"><span className="w-[5px] h-[5px] bg-red-status rounded-full" />Date</label>
            <input type="date" className={inputCls(error)} value={date} onChange={e => { setDate(e.target.value); setError(false); }} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Time</label>
            <input className={inputCls()} placeholder="e.g. 10:00 AM" value={time} onChange={e => setTime(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Notes</label>
            <textarea className={`${inputCls()} resize-none`} rows={3} placeholder="Hearing details…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <button onClick={handleSave} className="w-full py-3 mt-2 bg-navy-900 dark:bg-white text-white dark:text-navy-900 rounded-xl text-[15px] font-semibold hover:bg-navy-800 dark:hover:bg-slate-200 transition-colors">Add Hearing</button>
      </DialogContent>
    </Dialog>
  );
}
