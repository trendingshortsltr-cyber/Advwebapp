"use client";
import Image from 'next/image';
import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { User, Moon, Sun, LogOut, ShieldCheck, Pencil, Check, X, Camera, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/toast';

const THEME_CHANGE_EVENT = 'advdiary-theme-change';

function getThemeSnapshot() {
  const stored = localStorage.getItem('advdiary-theme');
  return stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

function subscribeToTheme(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
  };
}

export default function ProfilePage() {
  const { cases, hearings } = useStore();
  const { user, displayName, photoURL, profileError, updateDisplayName, updateProfilePhoto, logout } = useAuth();
  const isDark = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const toggleDark = () => {
    const next = !isDark;
    localStorage.setItem('advdiary-theme', next ? 'dark' : 'light');
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      toast.add({ type: 'error', title: 'Logout failed', description: 'Please try again.' });
      setLoggingOut(false);
    }
  };

  const handleSaveName = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = nameDraft.trim();
    if (!trimmedName || trimmedName.length > 100) {
      toast.add({ type: 'error', title: 'Invalid name', description: 'Enter a name between 1 and 100 characters.' });
      return;
    }

    setSavingName(true);
    try {
      await updateDisplayName(trimmedName);
      setEditingName(false);
      toast.add({ type: 'success', title: 'Name updated' });
    } catch (error: unknown) {
      const code = error && typeof error === 'object' && 'code' in error &&
        typeof error.code === 'string' ? error.code : null;
      toast.add({
        type: 'error',
        title: 'Could not update name',
        description: code ? `Please try again (${code}).` : error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setSavingName(false);
    }
  };

  const handlePhotoSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.add({ type: 'error', title: 'Unsupported image', description: 'Choose a JPG, PNG, or WebP image.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.add({ type: 'error', title: 'Image is too large', description: 'Choose an image smaller than 5 MB.' });
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSavePhoto = async () => {
    if (!photoFile) return;
    setSavingPhoto(true);
    try {
      await updateProfilePhoto(photoFile);
      setPhotoFile(null);
      setPhotoPreview(null);
      toast.add({ type: 'success', title: 'Profile photo updated' });
    } catch (error: unknown) {
      const code = error && typeof error === 'object' && 'code' in error &&
        typeof error.code === 'string' ? error.code : null;
      toast.add({
        type: 'error',
        title: 'Could not update photo',
        description: code === 'storage/unauthorized'
          ? 'Photo storage is not enabled yet. Deploy the Firebase Storage rules and try again.'
          : code ? `Please try again (${code}).` : error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setSavingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    setSavingPhoto(true);
    try {
      await updateProfilePhoto(null);
      setPhotoFile(null);
      setPhotoPreview(null);
      toast.add({ type: 'success', title: 'Profile photo removed' });
    } catch (error: unknown) {
      const code = error && typeof error === 'object' && 'code' in error &&
        typeof error.code === 'string' ? error.code : null;
      toast.add({
        type: 'error',
        title: 'Could not remove photo',
        description: code ? `Please try again (${code}).` : error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setSavingPhoto(false);
    }
  };

  const activeCases   = cases.filter(c => c.status === 'Active').length;
  const closedCases   = cases.filter(c => c.status === 'Closed').length;
  const totalHearings = hearings.length;
  const completedHearings = hearings.filter(h => h.completed).length;

  return (
    <div className="page-enter">
      <div className="px-4 pt-5 pb-3">
        <h1 className="text-xl font-bold text-foreground">Profile</h1>
      </div>

      <div className="px-4 pb-8">
        {/* User Info */}
        <div className="bg-card rounded-[14px] shadow-[0_1px_4px_rgba(11,42,91,0.08),0_0_0_1px_rgba(11,42,91,0.06)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)] p-5 mb-4">
          <div className="flex items-center gap-4">
            {photoPreview || photoURL ? (
              <Image src={photoPreview || photoURL || ''} alt="Profile" width={64} height={64} unoptimized className="w-16 h-16 rounded-full object-cover border-2 border-border" />
            ) : (
              <div className="w-16 h-16 bg-navy-900/10 dark:bg-white/10 rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-navy-900 dark:text-white" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              {editingName ? (
                <form onSubmit={handleSaveName} className="space-y-2">
                  <label htmlFor="profile-name" className="text-xs font-medium text-muted-foreground">Display name</label>
                  <input
                    id="profile-name"
                    value={nameDraft}
                    onChange={event => setNameDraft(event.target.value)}
                    maxLength={100}
                    autoComplete="name"
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-base text-card-foreground outline-none focus:border-navy-700"
                    required
                  />
                  <div className="flex gap-2">
                    <button type="submit" disabled={savingName} className="flex min-h-10 items-center gap-1.5 rounded-lg bg-navy-900 px-3 text-xs font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-navy-900">
                      <Check className="size-3.5" />{savingName ? 'Saving…' : 'Save'}
                    </button>
                    <button type="button" onClick={() => setEditingName(false)} disabled={savingName} className="flex min-h-10 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-muted-foreground disabled:opacity-60">
                      <X className="size-3.5" />Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="text-lg font-bold text-card-foreground break-words">{displayName || user?.displayName || 'Advocate'}</div>
                  <button
                    type="button"
                    onClick={() => { setNameDraft(displayName || user?.displayName || ''); setEditingName(true); }}
                    className="mt-1 inline-flex min-h-10 items-center gap-1.5 text-xs font-semibold text-navy-700 hover:underline dark:text-slate-300"
                  >
                    <Pencil className="size-3.5" />Edit name
                  </button>
                </>
              )}
              <div className="text-sm text-muted-foreground">{user?.email || ''}</div>
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium mt-0.5">
                <ShieldCheck className="w-3 h-3" />
                Signed in with Google
              </div>
              <div className="mt-4 border-t border-border pt-3">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelection}
                  className="sr-only"
                  aria-label="Choose a profile photo"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={savingPhoto}
                    className="flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold text-card-foreground hover:bg-muted disabled:opacity-60"
                  >
                    <Camera className="size-4" />{photoFile ? 'Choose another photo' : photoURL ? 'Change photo' : 'Add profile photo'}
                  </button>
                  {photoFile && (
                    <button
                      type="button"
                      onClick={handleSavePhoto}
                      disabled={savingPhoto}
                      className="flex min-h-10 items-center gap-1.5 rounded-lg bg-navy-900 px-3 text-xs font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-navy-900"
                    >
                      <Check className="size-3.5" />{savingPhoto ? 'Uploading…' : 'Save photo'}
                    </button>
                  )}
                  {photoURL && !photoFile && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={savingPhoto}
                      className="flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-red-status hover:bg-red-50 disabled:opacity-60 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="size-3.5" />Remove
                    </button>
                  )}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">Saved only on this device · JPG, PNG, or WebP · up to 5 MB</p>
              </div>
            </div>
            {profileError && <p role="alert" className="mt-3 text-xs text-red-status">{profileError}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <StatCard label="Active Cases"   value={activeCases} />
          <StatCard label="Closed Cases"   value={closedCases} />
          <StatCard label="Total Hearings" value={totalHearings} />
          <StatCard label="Completed"      value={completedHearings} />
        </div>

        {/* Settings */}
        <div className="bg-card rounded-[14px] shadow-[0_1px_4px_rgba(11,42,91,0.08),0_0_0_1px_rgba(11,42,91,0.06)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)] overflow-hidden mb-4">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            className="flex items-center justify-between w-full px-4 py-3.5 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {isDark ? <Moon className="w-5 h-5 text-muted-foreground" /> : <Sun className="w-5 h-5 text-muted-foreground" />}
              <span className="text-sm font-medium text-card-foreground">Dark Mode</span>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors flex items-center ${isDark ? 'bg-navy-700 justify-end' : 'bg-slate-200 justify-start'}`}>
              <div className="w-5 h-5 bg-white rounded-full shadow-sm mx-0.5" />
            </div>
          </button>

          <div className="h-px bg-border mx-4" />

          {/* Sign out */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-muted/50 transition-colors disabled:opacity-60"
          >
            <LogOut className="w-5 h-5 text-red-status" />
            <span className="text-sm font-medium text-red-status">
              {loggingOut ? 'Signing out…' : 'Sign Out'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card rounded-[14px] shadow-[0_1px_4px_rgba(11,42,91,0.08),0_0_0_1px_rgba(11,42,91,0.06)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)] p-3.5 text-center">
      <div className="text-xl font-bold text-card-foreground">{value}</div>
      <div className="text-[11px] text-muted-foreground font-medium">{label}</div>
    </div>
  );
}
