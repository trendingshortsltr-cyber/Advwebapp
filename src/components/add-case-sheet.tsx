"use client";
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useStore } from '@/lib/store';
import { toast } from '@/components/ui/toast';

export function AddCaseSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { addCase } = useStore();
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [court, setCourt] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const reset = () => { setClientName(''); setClientPhone(''); setCaseNumber(''); setCourt(''); setNotes(''); setErrors({}); };

  const handleSave = () => {
    const e: Record<string, boolean> = {};
    if (!clientName.trim()) e.clientName = true;
    if (!caseNumber.trim()) e.caseNumber = true;
    if (!court.trim()) e.court = true;
    if (Object.keys(e).length) { setErrors(e); return; }
    addCase({ 
      clientName: clientName.trim(), 
      clientPhone: clientPhone.trim() || undefined,
      caseNumber: caseNumber.trim(), 
      court: court.trim(), 
      notes: notes.trim() || undefined 
    });
    toast.add({ type: 'success', title: 'Case Created', description: `${clientName.trim()}'s case added successfully` });
    reset();
    onOpenChange(false);
  };

  const inputCls = (err?: boolean) => `w-full px-3.5 py-2.5 border-[1.5px] rounded-[10px] text-[15px] bg-card text-card-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-navy-700 ${err ? 'border-red-status' : 'border-border'}`;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <SheetContent side="bottom" className="rounded-t-[20px] max-h-[88vh] p-0" showCloseButton={false}>
        <div className="w-9 h-1 bg-border rounded-full mx-auto mt-3" />
        <SheetHeader className="px-5 pt-4 pb-3 border-b border-border">
          <SheetTitle className="text-[17px] font-bold">New Case</SheetTitle>
          <SheetDescription>Fill in the required details below</SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto max-h-[60vh] px-5 py-4 no-scrollbar space-y-4">
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1.5">
              <span className="w-[5px] h-[5px] bg-red-status rounded-full" />Client Name
            </label>
            <input className={inputCls(errors.clientName)} placeholder="e.g. Rajesh Kumar" value={clientName} onChange={e => { setClientName(e.target.value); setErrors(p => ({ ...p, clientName: false })); }} />
          </div>
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1.5">
              Client Phone Number
            </label>
            <input className={inputCls()} type="tel" placeholder="+91 98765 43210" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
          </div>
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1.5">
              <span className="w-[5px] h-[5px] bg-red-status rounded-full" />Case Number
            </label>
            <input className={inputCls(errors.caseNumber)} placeholder="e.g. CWP/4521/2024" value={caseNumber} onChange={e => { setCaseNumber(e.target.value); setErrors(p => ({ ...p, caseNumber: false })); }} />
          </div>
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1.5">
              <span className="w-[5px] h-[5px] bg-red-status rounded-full" />Court Name
            </label>
            <input className={inputCls(errors.court)} placeholder="e.g. District Court" value={court} onChange={e => { setCourt(e.target.value); setErrors(p => ({ ...p, court: false })); }} />
          </div>
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1.5">
              Case Notes
            </label>
            <textarea className={`${inputCls()} resize-none`} rows={3} placeholder="Add important details or reminders about this case..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="px-5 py-3 border-t border-border mt-auto">
          <button onClick={handleSave} className="w-full py-3.5 bg-navy-900 dark:bg-white text-white dark:text-navy-900 rounded-xl text-[15px] font-semibold hover:bg-navy-800 dark:hover:bg-slate-200 transition-colors">Save Case</button>
          <p className="text-center text-[11px] text-muted-foreground mt-2">Tap outside to dismiss</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
