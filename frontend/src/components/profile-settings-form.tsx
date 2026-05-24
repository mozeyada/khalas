'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {useSession} from '@/components/session-provider';
import {ApiError} from '@/lib/api';

type Tab = 'basic' | 'security';

async function updateProfile(body: any) {
  const res = await fetch('/api/proxy/auth/me', {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.json();
    throw new ApiError(errBody.error ?? 'Request failed', res.status);
  }
  return await res.json();
}

async function changePassword(body: any) {
  const res = await fetch('/api/proxy/auth/change-password', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.json();
    throw new ApiError(errBody.error ?? 'Request failed', res.status);
  }
  return await res.json();
}

export function ProfileSettingsForm() {
  const t = useTranslations('ProfilePage');
  const {user, isReady} = useSession();
  const [tab, setTab] = useState<Tab>('basic');
  
  const [nameAr, setNameAr] = useState(user?.name_ar ?? '');
  const [nameEn, setNameEn] = useState(user?.name_en ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [channel, setChannel] = useState<'whatsapp' | 'email'>(user?.preferred_channel ?? 'whatsapp');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isReady || !user) return null;

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await updateProfile({
        name_ar: nameAr,
        name_en: nameEn,
        email: email || null,
        preferred_channel: channel,
      });
      setSuccess(t('successProfile'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('genericError'));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess(t('successPassword'));
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('genericError'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Tabs */}
      <div className="mb-6 flex gap-2 rounded-2xl border border-black/10 bg-white/60 p-1.5 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setTab('basic')}
          className={`flex-1 rounded-xl px-5 py-2.5 text-sm font-medium transition ${
            tab === 'basic' ? 'bg-teal text-white shadow-sm' : 'text-ink hover:bg-black/5'
          }`}
        >
          {t('tabBasic')}
        </button>
        <button
          type="button"
          onClick={() => setTab('security')}
          className={`flex-1 rounded-xl px-5 py-2.5 text-sm font-medium transition ${
            tab === 'security' ? 'bg-teal text-white shadow-sm' : 'text-ink hover:bg-black/5'
          }`}
        >
          {t('tabSecurity')}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 border border-rose-100">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 border border-emerald-100">
          {success}
        </div>
      )}

      {tab === 'basic' && (
        <form onSubmit={handleSaveProfile} className="rounded-[2rem] border border-white/70 bg-white/50 p-6 sm:p-8 shadow-soft backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-teal">{t('basicEyebrow')}</h2>
            <p className="mt-1 text-xl font-bold text-ink">{t('basicTitle')}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">{t('fields.nameAr')}</label>
              <input
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                required
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink placeholder:text-ink/40 focus:border-teal focus:outline-none focus:ring-4 focus:ring-teal/10"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">{t('fields.nameEn')}</label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                required
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink placeholder:text-ink/40 focus:border-teal focus:outline-none focus:ring-4 focus:ring-teal/10"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">{t('fields.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink placeholder:text-ink/40 focus:border-teal focus:outline-none focus:ring-4 focus:ring-teal/10"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">{t('fields.preferredChannel')}</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as 'whatsapp' | 'email')}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink focus:border-teal focus:outline-none focus:ring-4 focus:ring-teal/10"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-8 w-full rounded-full bg-teal px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-teal/20 transition hover:bg-teal/90 disabled:opacity-50"
          >
            {isLoading ? '...' : t('actions.save')}
          </button>
        </form>
      )}

      {tab === 'security' && (
        <form onSubmit={handleChangePassword} className="rounded-[2rem] border border-white/70 bg-white/50 p-6 sm:p-8 shadow-soft backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-amber-500">{t('securityEyebrow')}</h2>
            <p className="mt-1 text-xl font-bold text-ink">{t('securityTitle')}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">{t('fields.currentPassword')}</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink placeholder:text-ink/40 focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/10"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">{t('fields.newPassword')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink placeholder:text-ink/40 focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-8 w-full rounded-full bg-ink px-4 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-black/80 disabled:opacity-50"
          >
            {isLoading ? '...' : t('actions.save')}
          </button>
        </form>
      )}
    </div>
  );
}
