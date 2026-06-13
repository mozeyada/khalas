'use client';

import {FormEvent, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {Mail, Lock, KeyRound, ArrowRight} from 'lucide-react';

import {useSession} from '@/components/session-provider';
import {ApiError} from '@/lib/api';

function normalizePhone(phone: string): string {
  const westernised = phone.replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
  let cleaned = westernised.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('00')) cleaned = '+' + cleaned.slice(2);
  if (cleaned.startsWith('+201') && cleaned.length === 13) return cleaned;
  if (cleaned.startsWith('01') && cleaned.length === 11) return '+2' + cleaned;
  return cleaned;
}

function isValidIdentifier(id: string): boolean {
  if (!id) return false;
  if (id.includes('@')) return id.length > 5 && id.includes('.');
  const westernised = id.replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
  let cleaned = westernised.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('00')) cleaned = '+' + cleaned.slice(2);
  if (cleaned.startsWith('01') && cleaned.length === 11) return true;
  return /^\+\d{10,15}$/.test(cleaned);
}

export function LoginForm() {
  const t = useTranslations('LoginPage');
  const locale = useLocale();
  const router = useRouter();
  const {requestOtp, verifyOtpCode, loginWithPassword} = useSession();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [authMode, setAuthMode] = useState<'initial' | 'otp_verify'>('initial');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePasswordLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password) {
      setError(t('errors.missingPassword'));
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const normalizedIdentifier = identifier.includes('@') ? identifier : normalizePhone(identifier);
      const role = await loginWithPassword(normalizedIdentifier, password);
      let targetPath = 'dashboard';
      if (role === 'admin') targetPath = 'admin';
      else if (role === 'salesman') targetPath = 'salesman';
      else if (role === 'provider') targetPath = 'provider/appointments';
      
      router.push(`/${locale}/${targetPath}`);
    } catch (caught: any) {
      setError(caught.message || t('genericError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRequestOtp() {
    if (!identifier) {
      setError(t('errors.missingIdentifier'));
      return;
    }
    setError(null);
    setFeedback(null);
    setIsSubmitting(true);

    try {
      const normalizedIdentifier = identifier.includes('@') ? identifier : normalizePhone(identifier);
      const challenge = await requestOtp(normalizedIdentifier);
      setAuthMode('otp_verify');
      setFeedback(`Login code sent to ${challenge.identifier}`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('genericError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const normalizedIdentifier = identifier.includes('@') ? identifier : normalizePhone(identifier);
      const role = await verifyOtpCode(normalizedIdentifier, otpCode);
      let targetPath = 'dashboard';
      if (role === 'admin') targetPath = 'admin';
      else if (role === 'salesman') targetPath = 'salesman';
      else if (role === 'provider') targetPath = 'provider/appointments';
      
      router.push(`/${locale}/${targetPath}`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('genericError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      {/* Dark branding panel — desktop only */}
      <section className="hidden lg:block rounded-lg border border-white/10 bg-slate-950 p-8 text-slate-50 relative overflow-hidden group">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.24em] text-zinc-400 relative z-10">{t('eyebrow')}</p>
        <h2 className="mb-3 text-2xl font-bold relative z-10">{t('title')}</h2>
        <p className="text-sm leading-relaxed text-slate-300 relative z-10">{t('subtitle')}</p>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        
        {authMode === 'initial' ? (
          <form className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500" onSubmit={handlePasswordLogin}>
            <div className="space-y-4">
              <label className="block group">
                <span className="mb-2 block text-sm font-semibold text-ink">{t('fields.identifier')}</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-ink transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    dir="ltr"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    className="w-full rounded-sm border border-zinc-200 bg-[#FAFAFA] pl-10 pr-4 py-3 text-sm text-left text-ink outline-none transition-all focus:bg-white focus:border-ink hover:border-zinc-300"
                    placeholder={t('placeholders.identifier')}
                    required
                  />
                </div>
              </label>

              <label className="block group">
                <div className="flex justify-between items-center mb-2">
                  <span className="block text-sm font-semibold text-ink">{t('fields.password')}</span>
                  <a href={`/${locale}/auth/forgot-password`} className="text-xs font-semibold text-zinc-500 hover:text-ink transition-colors">
                    {t('actions.forgotPassword')}
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-ink transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-sm border border-zinc-200 bg-[#FAFAFA] pl-10 pr-4 py-3 text-sm text-ink outline-none transition-all focus:bg-white focus:border-ink hover:border-zinc-300"
                    placeholder={t('placeholders.password')}
                    type="password"
                  />
                </div>
              </label>
            </div>

            {error ? <p className="text-sm text-rose-600 font-medium animate-in fade-in">{error}</p> : null}

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full overflow-hidden rounded-md bg-ink px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {t('actions.loginPassword')}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-zinc-200"></div>
                <span className="flex-shrink-0 mx-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('or')}</span>
                <div className="flex-grow border-t border-zinc-200"></div>
              </div>

              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={isSubmitting}
                className="group w-full rounded-md border border-zinc-200 bg-white px-4 py-3.5 text-sm font-semibold text-ink transition-all hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
              >
                <span className="flex items-center justify-center gap-2">
                  <KeyRound className="h-4 w-4 transition-transform group-hover:scale-110" />
                  {t('actions.sendOtp')}
                </span>
              </button>
            </div>

            <p className="pt-3 text-center text-sm text-zinc-500 font-medium">
              {locale === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
              <a href={`/${locale}/auth/register`} className="font-semibold text-ink hover:underline">
                {locale === 'ar' ? 'سجل الآن' : 'Register'}
              </a>
            </p>
          </form>
        ) : (
          <form className="space-y-5 animate-in slide-in-from-right-8 fade-in duration-500" onSubmit={handleVerifyOtp}>
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center text-ink">
                <KeyRound className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-ink tracking-tight mb-1">{t('verifyTitle')}</h3>
              <p className="text-sm text-zinc-500">
                {t('verifyBody', {identifier: identifier})}
              </p>
            </div>

            <label className="block group">
              <span className="mb-2 block text-sm font-semibold text-ink">{t('fields.otp')}</span>
              <input
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
                className="w-full rounded-sm border border-zinc-200 bg-[#FAFAFA] px-4 py-4 text-center text-2xl tracking-[0.4em] text-ink outline-none transition-all focus:bg-white focus:border-ink hover:border-zinc-300"
                placeholder="0000"
                maxLength={4}
                required
                autoFocus
              />
            </label>

            {feedback ? <p className="text-sm text-emerald-600 font-medium text-center">{feedback}</p> : null}
            {error ? <p className="text-sm text-rose-600 font-medium text-center animate-in fade-in">{error}</p> : null}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group w-full rounded-md bg-ink px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
              >
                {t('actions.verify')}
              </button>
            </div>
            
            <div className="text-center">
              <button 
                type="button" 
                onClick={() => setAuthMode('initial')}
                className="text-sm font-semibold text-zinc-500 hover:text-ink transition-colors"
              >
                {t('actions.back')}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
