"use client";
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useStore } from '@/lib/store';
import { toast } from '@/components/ui/toast';
import type { Case } from '@/lib/types';

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

export function EditCaseSheet({
  open,
  onOpenChange,
  caseData,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  caseData: Case;
}) {
  if (!open) return null;
  return <EditCaseForm onOpenChange={onOpenChange} caseData={caseData} />;
}

function EditCaseForm({
  onOpenChange,
  caseData,
}: {
  onOpenChange: (v: boolean) => void;
  caseData: Case;
}) {
  const { updateCase } = useStore();
  const [saving, setSaving] = useState(false);

  const [clientName, setClientName]   = useState(caseData.clientName || '');
  const [caseNumber, setCaseNumber]   = useState(caseData.caseNumber || '');
  const [court, setCourt]             = useState(caseData.court || '');
  const [clientPhone, setClientPhone] = useState(caseData.clientPhone || '');
  const [caseType, setCaseType]       = useState(caseData.caseType || '');
  const [oppositeParty, setOppositeParty] = useState(caseData.oppositeParty || '');
  const [cnrNumber, setCnrNumber]     = useState(caseData.cnrNumber || '');
  const [stage, setStage]             = useState(caseData.stage || '');
  const [nextHearingDate, setNextHearingDate] = useState(caseData.nextHearingDate || '');
  const [notes, setNotes]             = useState(caseData.notes || '');
  const [errors, setErrors]           = useState<Record<string, boolean>>({});
  const [validationMessage, setValidationMessage] = useState('');

  const validate = () => {
    const e: Record<string, boolean> = {};
    if (!clientName.trim()) e.clientName = true;
    if (!caseNumber.trim()) e.caseNumber = true;
    if (!court.trim()) e.court = true;
    if (clientName.trim().length > 200) e.clientName = true;
    if (caseNumber.trim().length > 100) e.caseNumber = true;
    if (court.trim().length > 200) e.court = true;
    if (clientPhone.trim().length > 20) e.clientPhone = true;
    if (caseType.length > 100) e.caseType = true;
    if (oppositeParty.trim().length > 200) e.oppositeParty = true;
    if (cnrNumber.trim().length > 50) e.cnrNumber = true;
    if (stage.length > 100) e.stage = true;
    if (notes.trim().length > 5000) e.notes = true;
    setErrors(e);
    const isValid = Object.keys(e).length === 0;
    setValidationMessage(isValid ? '' : 'Review the highlighted fields and their character limits.');
    return isValid;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await updateCase(caseData.id, {
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
      });
      toast.add({ type: 'success', title: 'Case Updated', description: 'Changes saved successfully' });
      onOpenChange(false);
    } catch {
      toast.add({ type: 'error', title: 'Failed to save', description: 'Please check your connection.' });
    } finally {
      setSaving(false);
    }
  };

  const inputCls = (err?: boolean) =>
    `w-full px-3.5 py-2.5 border-[1.5px] rounded-[10px] text-[14px] bg-card text-card-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-navy-700 ${err ? 'border-red-status' : 'border-border'}`;

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[20px] max-h-[92vh] p-0" showCloseButton={false}>
        <div className="w-9 h-1 bg-border rounded-full mx-auto mt-3" />
        <SheetHeader className="px-5 pt-4 pb-3 border-b border-border">
          <SheetTitle className="text-[17px] font-bold">Edit Case</SheetTitle>
          <SheetDescription>Update case information below</SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto max-h-[68vh] px-5 py-4 no-scrollbar space-y-4">
          <Field label="Client Name" required>
            <input className={inputCls(errors.clientName)} maxLength={200} placeholder="e.g. Rajesh Kumar Sharma" value={clientName}
              onChange={e => { setClientName(e.target.value); setErrors(p => ({ ...p, clientName: false })); }} />
          </Field>

          <Field label="Client Phone">
            <input className={inputCls(errors.clientPhone)} type="tel" maxLength={20} placeholder="+91 98765 43210" value={clientPhone}
              onChange={e => setClientPhone(e.target.value)} />
          </Field>

          <Field label="Case Number" required>
            <input className={inputCls(errors.caseNumber)} maxLength={100} placeholder="e.g. CWP/4521/2024" value={caseNumber}
              onChange={e => { setCaseNumber(e.target.value); setErrors(p => ({ ...p, caseNumber: false })); }} />
          </Field>

          <Field label="Court Name" required>
            <input className={inputCls(errors.court)} maxLength={200} placeholder="e.g. High Court, Bombay" value={court}
              onChange={e => { setCourt(e.target.value); setErrors(p => ({ ...p, court: false })); }} />
          </Field>

          <Field label="Opposite Party">
            <input className={inputCls(errors.oppositeParty)} maxLength={200} placeholder="e.g. State of Maharashtra" value={oppositeParty}
              onChange={e => setOppositeParty(e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Case Type">
              <select className={inputCls(errors.caseType)} value={caseType} onChange={e => setCaseType(e.target.value)}>
                <option value="">Select…</option>
                {CASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Stage">
              <select className={inputCls(errors.stage)} value={stage} onChange={e => setStage(e.target.value)}>
                <option value="">Select…</option>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <Field label="CNR Number">
            <input className={inputCls(errors.cnrNumber)} maxLength={50} placeholder="e.g. MHBM010004521024" value={cnrNumber}
              onChange={e => setCnrNumber(e.target.value)} />
          </Field>

          <Field label="Next Hearing Date">
            <input type="date" className={inputCls()} value={nextHearingDate}
              onChange={e => setNextHearingDate(e.target.value)} />
          </Field>

          <Field label="Case Notes">
            <textarea className={`${inputCls(errors.notes)} resize-none`} rows={3} maxLength={5000}
              placeholder="Important details or reminders…" value={notes}
              onChange={e => setNotes(e.target.value)} />
          </Field>
        </div>

        <div className="px-5 py-3 border-t border-border">
          {validationMessage && <p role="alert" className="text-sm text-red-status mb-2">{validationMessage}</p>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 bg-navy-900 dark:bg-white text-white dark:text-navy-900 rounded-xl text-[15px] font-semibold hover:bg-navy-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
