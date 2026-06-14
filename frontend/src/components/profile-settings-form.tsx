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
    <div className="mx-auto w-full max-w-4xl">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-6 text-start">
        {t('pageTitle') || (locale === 'ar' ? 'إعدادات الحساب' : 'Account Settings')}
      </h1>

      {/* ── Identity card ─────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
        <div className="bg-blue-100 text-blue-600 font-bold text-3xl w-24 h-24 flex items-center justify-center rounded-full flex-shrink-0">
          {(locale === 'ar' ? user.name_ar : user.name_en)
            ?.trim()
            .split(/\s+/)
            .map((p: string) => p[0])
            .slice(0, 2)
            .join('')}
        </div>
        <div className="min-w-0 text-center md:text-start flex-1">
          <p className="font-bold text-xl text-slate-900">
            {locale === 'ar' ? user.name_ar : user.name_en}
          </p>
          <div className="mt-1 flex flex-col gap-0.5">
            {user.email && <p className="text-sm text-slate-500">{user.email}</p>}
            <p className="text-sm text-slate-500">
              {user.phone ? (
                <span dir="ltr">{user.phone}</span>
              ) : (
                <span className="italic text-slate-400">
                  {locale === 'ar' ? 'لا يوجد رقم هاتف' : 'No phone number added'}
                </span>
              )}
            </p>
          </div>
          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold inline-block mt-3">
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
      <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-max mb-8">
        <button
          type="button"
          onClick={() => setTab('basic')}
          className={`w-1/2 md:w-auto text-center transition-all ${
            tab === 'basic' ? 'bg-white text-slate-900 shadow-sm rounded-lg px-6 py-2 font-bold' : 'text-slate-500 hover:text-slate-700 px-6 py-2 font-medium'
          }`}
        >
          {t('tabBasic')}
        </button>
        <button
          type="button"
          onClick={() => setTab('security')}
          className={`w-1/2 md:w-auto text-center transition-all ${
            tab === 'security' ? 'bg-white text-slate-900 shadow-sm rounded-lg px-6 py-2 font-bold' : 'text-slate-500 hover:text-slate-700 px-6 py-2 font-medium'
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
        <form onSubmit={handleSaveProfile} className="bg-white rounded-[24px] p-6 lg:p-8 shadow-sm border border-slate-100 text-start">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-500 mb-1">{t('basicEyebrow')}</h2>
            <p className="text-xl font-bold tracking-tight text-slate-900">{t('basicTitle')}</p>
          </div>

          <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 text-start">{t('fields.nameAr')}</label>
              <input
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                required
                className="bg-slate-50 border border-transparent rounded-xl px-4 py-3 w-full focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-start"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 text-start">{t('fields.nameEn')}</label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                required
                className="bg-slate-50 border border-transparent rounded-xl px-4 py-3 w-full focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-start"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 text-start">{t('fields.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-50 border border-transparent rounded-xl px-4 py-3 w-full focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-start"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 text-start">
                {locale === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
              </label>
              <input
                dir="ltr"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-slate-50 border border-transparent rounded-xl px-4 py-3 w-full focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-start"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2 text-start">{t('fields.preferredChannel')}</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as 'whatsapp' | 'email')}
                className="bg-slate-50 border border-transparent rounded-xl px-4 py-3 w-full focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-start"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full md:w-auto px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all mt-8 disabled:opacity-50"
          >
            {isLoading ? '...' : t('actions.save')}
          </button>
        </form>
      )}

      {tab === 'security' && (
        <form onSubmit={handleChangePassword} className="bg-white rounded-[24px] p-6 lg:p-8 shadow-sm border border-slate-100 text-start">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-500 mb-1">{t('securityEyebrow')}</h2>
            <p className="text-xl font-bold tracking-tight text-slate-900">{t('securityTitle')}</p>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 text-start">{t('fields.currentPassword')}</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="bg-slate-50 border border-transparent rounded-xl px-4 py-3 w-full focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-start"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 text-start">{t('fields.newPassword')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="bg-slate-50 border border-transparent rounded-xl px-4 py-3 w-full focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-start"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full md:w-auto px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all mt-8 disabled:opacity-50"
          >
            {isLoading ? '...' : t('actions.save')}
          </button>
        </form>
      )}

      {/* ── Sign out ──────────────────────────────────────────── */}
      <div className="mt-12 text-center">
        <button
          type="button"
          onClick={() => void logout()}
          className="flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 w-full md:w-max mx-auto px-6 py-3 rounded-xl transition-colors font-semibold"
        >
          <LogOut className="h-5 w-5" />
          {locale === 'ar' ? 'تسجيل الخروج' : 'Sign out of Khalas'}
        </button>
      </div>
    </div>
  );
}
