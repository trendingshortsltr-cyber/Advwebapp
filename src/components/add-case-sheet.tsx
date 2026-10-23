"use client";
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useStore } from '@/lib/store';
import { toast } from '@/components/ui/toast';

const CASE_TYPES = [
  'Civil Writ', 'Criminal', 'Civil Suit', 'Family', 'Criminal Appeal',
  'Motor Accident', 'Labour', 'Consumer', 'Revenue', 'Service Matter', 'Other',
];

const STAGES = [
  'Filing', 'Admission', 'Summons', 'Evidence', 'Arguments',
  'Judgment', 'Mediation', 'Disposed', 'Other',
];

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1.5">
        {required && <span className="w-[5px] h-[5px] bg-red-status rounded-full" />}
        {label}
      </label>
      {children}
    </div>
  );
}

export function AddCaseSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { addCase } = useStore();
  const [saving, setSaving] = useState(false);

  // Required
  const [clientName, setClientName]   = useState('');
  const [caseNumber, setCaseNumber]   = useState('');
  const [court, setCourt]             = useState('');
  // Optional
  const [clientPhone, setClientPhone] = useState('');
  const [caseType, setCaseType]       = useState('');
  const [oppositeParty, setOppositeParty] = useState('');
  const [cnrNumber, setCnrNumber]     = useState('');
  const [stage, setStage]             = useState('');
  const [nextHearingDate, setNextHearingDate] = useState('');
  const [notes, setNotes]             = useState('');

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const reset = () => {
    setClientName(''); setCaseNumber(''); setCourt('');
    setClientPhone(''); setCaseType(''); setOppositeParty('');
    setCnrNumber(''); setStage(''); setNextHearingDate(''); setNotes('');
    setErrors({});
  };

  const validate = () => {
    const e: Record<string, boolean> = {};
    if (!clientName.trim()) e.clientName = true;
    if (!caseNumber.trim()) e.caseNumber = true;
    if (!court.trim()) e.court = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await addCase({
        clientName: clientName.trim(),
        caseNumber: caseNumber.trim(),
        court: court.trim(),
        clientPhone: clientPhone.trim() || undefined,
        caseType: caseType || undefined,
        oppositeParty: oppositeParty.trim() || undefined,
        cnrNumber: cnrNumber.trim() || undefined,
        stage: stage || undefined,
        nextHearingDate: nextHearingDate || null,
        notes: notes.trim() || undefined,
        status: 'Active',
      });
      toast.add({ type: 'success', title: 'Case Created', description: `${clientName.trim()}'s case added` });
      reset();
      onOpenChange(false);
    } catch (error: unknown) {
      const code = error && typeof error === 'object' && 'code' in error &&
        typeof error.code === 'string' ? error.code : null;
      const description = code === 'permission-denied'
        ? 'Firestore rejected the write. Verify the signed-in account and deployed Firestore rules.'
        : code === 'unavailable'
          ? 'Firestore is unavailable. Check your connection and try again.'
          : code
            ? `Could not save this case (${code}). Please try again.`
            : 'An unexpected error occurred. Please try again.';
      toast.add({ type: 'error', title: 'Failed to save', description });
    } finally {
      setSaving(false);
    }
  };

  const inputCls = (err?: boolean) =>
    `w-full px-3.5 py-2.5 border-[1.5px] rounded-[10px] text-[14px] bg-card text-card-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-navy-700 ${err ? 'border-red-status' : 'border-border'}`;

  const selectCls = inputCls();

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <SheetContent side="bottom" className="rounded-t-[20px] max-h-[92vh] p-0" showCloseButton={false}>
        <div className="w-9 h-1 bg-border rounded-full mx-auto mt-3" />
        <SheetHeader className="px-5 pt-4 pb-3 border-b border-border">
          <SheetTitle className="text-[17px] font-bold">New Case</SheetTitle>
          <SheetDescription>Fill in the required details below</SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto max-h-[68vh] px-5 py-4 no-scrollbar space-y-4">
          {/* Required */}
          <Field label="Client Name" required>
            <input
              className={inputCls(errors.clientName)}
              maxLength={200}
              placeholder="e.g. Rajesh Kumar Sharma"
              value={clientName}
              onChange={e => { setClientName(e.target.value); setErrors(p => ({ ...p, clientName: false })); }}
            />
          </Field>

          <Field label="Client Phone">
            <input
              className={inputCls()}
              type="tel"
              maxLength={20}
              placeholder="+91 98765 43210"
              value={clientPhone}
              onChange={e => setClientPhone(e.target.value)}
            />
          </Field>

          <Field label="Case Number" required>
            <input
              className={inputCls(errors.caseNumber)}
              maxLength={100}
              placeholder="e.g. CWP/4521/2024"
              value={caseNumber}
              onChange={e => { setCaseNumber(e.target.value); setErrors(p => ({ ...p, caseNumber: false })); }}
            />
          </Field>

          <Field label="Court Name" required>
            <input
              className={inputCls(errors.court)}
              maxLength={200}
              placeholder="e.g. High Court, Bombay"
              value={court}
              onChange={e => { setCourt(e.target.value); setErrors(p => ({ ...p, court: false })); }}
            />
          </Field>

          <Field label="Opposite Party">
            <input
              className={inputCls()}
              maxLength={200}
              placeholder="e.g. State of Maharashtra"
              value={oppositeParty}
              onChange={e => setOppositeParty(e.target.value)}
            />
          </Field>

          {/* Row: Case Type + Stage */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Case Type">
              <select className={selectCls} value={caseType} onChange={e => setCaseType(e.target.value)}>
                <option value="">Select…</option>
                {CASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Stage">
              <select className={selectCls} value={stage} onChange={e => setStage(e.target.value)}>
                <option value="">Select…</option>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <Field label="CNR Number">
            <input
              className={inputCls()}
              maxLength={50}
              placeholder="e.g. MHBM010004521024"
              value={cnrNumber}
              onChange={e => setCnrNumber(e.target.value)}
            />
          </Field>

          <Field label="Next Hearing Date">
            <input
              type="date"
              className={inputCls()}
              value={nextHearingDate}
              onChange={e => setNextHearingDate(e.target.value)}
            />
          </Field>

          <Field label="Case Notes">
            <textarea
              className={`${inputCls()} resize-none`}
              rows={3}
              maxLength={5000}
              placeholder="Add important details or reminders about this case..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </Field>
        </div>

        <div className="px-5 py-3 border-t border-border">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 bg-navy-900 dark:bg-white text-white dark:text-navy-900 rounded-xl text-[15px] font-semibold hover:bg-navy-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Case'}
          </button>
          <p className="text-center text-[11px] text-muted-foreground mt-2">Tap outside to dismiss</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
