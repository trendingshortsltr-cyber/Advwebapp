"use client";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useStore } from '@/lib/store';
import { toast } from '@/components/ui/toast';
import { format } from 'date-fns';
import type { Hearing } from '@/lib/types';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  caseId: string;
  /** If provided, the dialog edits an existing hearing instead of creating one */
  existingHearing?: Hearing;
}

export function AddHearingDialog({ open, onOpenChange, caseId, existingHearing }: Props) {
  if (!open) return null;
  return (
    <HearingForm
      onOpenChange={onOpenChange}
      caseId={caseId}
      existingHearing={existingHearing}
    />
  );
}

function HearingForm({
  onOpenChange,
  caseId,
  existingHearing,
}: Omit<Props, 'open'>) {
  const { addHearing, updateHearing } = useStore();
  const isEdit = Boolean(existingHearing);

  const [date, setDate] = useState(existingHearing?.date || format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState(existingHearing?.time || '10:00 AM');
  const [notes, setNotes] = useState(existingHearing?.notes || '');
  const [result, setResult] = useState(existingHearing?.result || '');
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  const inputCls = (err?: boolean) =>
    `w-full px-3.5 py-2.5 border-[1.5px] rounded-[10px] text-[14px] bg-card text-card-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-navy-700 ${err ? 'border-red-status' : 'border-border'}`;

  const handleSave = async () => {
    const nextErrors: Record<string, boolean> = {};
    if (!date) nextErrors.date = true;
    if (time.length > 20) nextErrors.time = true;
    if (notes.trim().length > 2000) nextErrors.notes = true;
    if (result.trim().length > 500) nextErrors.result = true;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setValidationMessage('Review the highlighted fields and their character limits.');
      return;
    }
    setValidationMessage('');
    setSaving(true);
    try {
      if (isEdit && existingHearing) {
        await updateHearing(existingHearing.id, {
          date,
          time: time || undefined,
          notes: notes.trim() || undefined,
          result: result.trim() || undefined,
        });
        toast.add({ type: 'success', title: 'Hearing Updated' });
      } else {
        await addHearing({
          caseId,
          date,
          time: time || undefined,
          notes: notes.trim() || undefined,
          result: result.trim() || undefined,
        });
        toast.add({
          type: 'success',
          title: 'Hearing Added',
          description: `Hearing on ${format(new Date(date + 'T00:00:00'), 'd MMM yyyy')} added`,
        });
      }
      onOpenChange(false);
    } catch {
      toast.add({ type: 'error', title: 'Failed to save', description: 'Please check your connection.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Hearing' : 'Add Hearing'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update hearing details' : 'Schedule a new hearing date'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1.5">
              <span className="w-[5px] h-[5px] bg-red-status rounded-full" />Date
            </label>
            <input
              type="date"
              className={inputCls(errors.date)}
              value={date}
              onChange={e => { setDate(e.target.value); setErrors(p => ({ ...p, date: false })); }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Time</label>
            <input
              className={inputCls(errors.time)}
              placeholder="e.g. 10:00 AM"
              maxLength={20}
              value={time}
              onChange={e => setTime(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Notes</label>
            <textarea
              className={`${inputCls(errors.notes)} resize-none`}
              rows={2}
              maxLength={2000}
              placeholder="Hearing details…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Result / Outcome</label>
            <input
              className={inputCls(errors.result)}
              placeholder="e.g. Adjourned, Summons issued…"
              maxLength={500}
              value={result}
              onChange={e => setResult(e.target.value)}
            />
          </div>
        </div>

        {validationMessage && <p role="alert" className="text-sm text-red-status">{validationMessage}</p>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 mt-2 bg-navy-900 dark:bg-white text-white dark:text-navy-900 rounded-xl text-[15px] font-semibold hover:bg-navy-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Hearing'}
        </button>
      </DialogContent>
    </Dialog>
  );
}
