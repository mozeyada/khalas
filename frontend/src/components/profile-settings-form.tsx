'use client';

import {useState} from 'react';
import {useTranslations, useLocale} from 'next-intl';
import {LogOut} from 'lucide-react';
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
  const tNav = useTranslations('Navigation');
  const locale = useLocale();
  const {user, isReady, logout} = useSession();
  const [tab, setTab] = useState<Tab>('basic');
  
  const [nameAr, setNameAr] = useState(user?.name_ar ?? '');
  const [nameEn, setNameEn] = useState(user?.name_en ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
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
        phone: phone || null,
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

      {/* ── Identity card ─────────────────────────────────────── */}
      <div className="mb-6 flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-xl font-bold text-ink">
          {(locale === 'ar' ? user.name_ar : user.name_en)
            ?.trim()
            .split(/\s+/)
            .map((p: string) => p[0])
            .slice(0, 2)
            .join('')}
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold text-[var(--text-1)]">
            {locale === 'ar' ? user.name_ar : user.name_en}
          </p>
          <div className="mt-1 flex flex-col gap-0.5">
            {user.email && <p className="truncate text-sm text-zinc-500">{user.email}</p>}
            <p className="truncate text-sm text-zinc-500">
              {user.phone ? (
                <span dir="ltr">{user.phone}</span>
              ) : (
                <span className="italic text-zinc-400">
                  {locale === 'ar' ? 'لا يوجد رقم هاتف' : 'No phone number added'}
                </span>
              )}
            </p>
          </div>
          <span
            className={`mt-1 inline-block rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
              user.role === 'admin'
                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                : user.role === 'salesman'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                  : user.role === 'provider'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
            }`}
          >
            {user.role === 'admin'
              ? (locale === 'ar' ? 'مشرف' : 'Admin')
              : user.role === 'salesman'
                ? (locale === 'ar' ? 'مبيعات' : 'Sales')
                : user.role === 'provider'
                  ? (locale === 'ar' ? 'مقدم خدمة' : 'Provider')
                  : (locale === 'ar' ? 'مريض' : 'Patient')}
          </span>
        </div>
      </div>
      {/* Tabs */}
      <div className="mb-6 flex gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-1">
        <button
          type="button"
          onClick={() => setTab('basic')}
          className={`flex-1 rounded-sm px-5 py-2.5 text-sm font-semibold transition ${
            tab === 'basic' ? 'bg-white text-ink shadow-sm border border-zinc-200' : 'text-zinc-500 hover:text-ink'
          }`}
        >
          {t('tabBasic')}
        </button>
        <button
          type="button"
          onClick={() => setTab('security')}
          className={`flex-1 rounded-sm px-5 py-2.5 text-sm font-semibold transition ${
            tab === 'security' ? 'bg-white text-ink shadow-sm border border-zinc-200' : 'text-zinc-500 hover:text-ink'
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
        <form onSubmit={handleSaveProfile} className="rounded-lg border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-zinc-500">{t('basicEyebrow')}</h2>
            <p className="mt-1 text-xl font-bold tracking-tight text-ink">{t('basicTitle')}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">{t('fields.nameAr')}</label>
              <input
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                required
                className="w-full rounded-sm border border-zinc-200 bg-[#FAFAFA] px-4 py-3 text-ink placeholder:text-zinc-400 focus:border-ink focus:outline-none focus:bg-white transition-colors hover:border-zinc-300"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">{t('fields.nameEn')}</label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                required
                className="w-full rounded-sm border border-zinc-200 bg-[#FAFAFA] px-4 py-3 text-ink placeholder:text-zinc-400 focus:border-ink focus:outline-none focus:bg-white transition-colors hover:border-zinc-300"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">{t('fields.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-sm border border-zinc-200 bg-[#FAFAFA] px-4 py-3 text-ink placeholder:text-zinc-400 focus:border-ink focus:outline-none focus:bg-white transition-colors hover:border-zinc-300"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">
                {locale === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
              </label>
              <input
                dir="ltr"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-sm border border-zinc-200 bg-[#FAFAFA] px-4 py-3 text-left text-ink placeholder:text-zinc-400 focus:border-ink focus:outline-none focus:bg-white transition-colors hover:border-zinc-300"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">{t('fields.preferredChannel')}</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as 'whatsapp' | 'email')}
                className="w-full rounded-sm border border-zinc-200 bg-[#FAFAFA] px-4 py-3 text-ink focus:border-ink focus:outline-none focus:bg-white transition-colors hover:border-zinc-300"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-8 w-full rounded-md bg-ink px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? '...' : t('actions.save')}
          </button>
        </form>
      )}

      {tab === 'security' && (
        <form onSubmit={handleChangePassword} className="rounded-lg border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-zinc-500">{t('securityEyebrow')}</h2>
            <p className="mt-1 text-xl font-bold tracking-tight text-ink">{t('securityTitle')}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">{t('fields.currentPassword')}</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full rounded-sm border border-zinc-200 bg-[#FAFAFA] px-4 py-3 text-ink placeholder:text-zinc-400 focus:border-ink focus:outline-none focus:bg-white transition-colors hover:border-zinc-300"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">{t('fields.newPassword')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-sm border border-zinc-200 bg-[#FAFAFA] px-4 py-3 text-ink placeholder:text-zinc-400 focus:border-ink focus:outline-none focus:bg-white transition-colors hover:border-zinc-300"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-8 w-full rounded-md bg-ink px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? '...' : t('actions.save')}
          </button>
        </form>
      )}

      {/* ── Sign out ──────────────────────────────────────────── */}
      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={() => void logout()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-rose-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {locale === 'ar' ? 'تسجيل الخروج' : 'Sign out of Khalas'}
        </button>
      </div>
    </div>
  );
}
