'use client';

import {FormEvent, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {Mail, Lock, KeyRound, ArrowRight} from 'lucide-react';

import {useSession} from '@/components/session-provider';
import {ApiError} from '@/lib/api';

function normalizePhone(phone: string): string {
  // Convert Eastern Arabic numerals to Western numerals
  const westernised = phone.replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
  // Strip all non-digit characters except leading +
  let cleaned = westernised.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('01') && cleaned.length === 11) return '+2' + cleaned;
  if (cleaned.startsWith('1') && cleaned.length === 10) return '+20' + cleaned;
  if (cleaned.startsWith('201') && cleaned.length === 12) return '+' + cleaned;
  return cleaned;
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
      <section className="rounded-[2rem] border border-white/70 bg-slate-950 p-6 text-slate-50 shadow-soft sm:p-8 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-teal/20 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300 relative z-10">{t('eyebrow')}</p>
        <h2 className="mb-3 text-2xl font-semibold relative z-10">{t('title')}</h2>
        <p className="text-sm leading-7 text-slate-300 relative z-10">{t('subtitle')}</p>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 shadow-soft backdrop-blur sm:p-8">
        
        {authMode === 'initial' ? (
          <form className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500" onSubmit={handlePasswordLogin}>
            <div className="space-y-4">
              <label className="block group">
                <span className="mb-2 block text-sm font-medium text-ink transition-colors group-focus-within:text-teal">{t('fields.identifier')}</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink/40 group-focus-within:text-teal transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    className="w-full rounded-2xl border border-white/40 bg-white/50 backdrop-blur-md pl-12 pr-4 py-3.5 text-sm text-ink outline-none transition-all focus:bg-white focus:border-teal focus:ring-4 focus:ring-teal/10 hover:border-black/20"
                    placeholder={t('placeholders.identifier')}
                    required
                  />
                </div>
              </label>

              <label className="block group">
                <div className="flex justify-between items-center mb-2">
                  <span className="block text-sm font-medium text-ink transition-colors group-focus-within:text-teal">{t('fields.password')}</span>
                  <a href={`/${locale}/auth/forgot-password`} className="text-xs font-medium text-teal hover:text-teal/80 transition-colors">
                    {t('actions.forgotPassword')}
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink/40 group-focus-within:text-teal transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-2xl border border-white/40 bg-white/50 backdrop-blur-md pl-12 pr-4 py-3.5 text-sm text-ink outline-none transition-all focus:bg-white focus:border-teal focus:ring-4 focus:ring-teal/10 hover:border-black/20"
                    placeholder={t('placeholders.password')}
                    type="password"
                  />
                </div>
              </label>
            </div>

            {error ? <p className="rounded-2xl border border-rose-100 bg-rose-50/80 backdrop-blur px-4 py-3 text-sm text-rose-700 animate-in fade-in">{error}</p> : null}

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full overflow-hidden rounded-2xl bg-teal px-4 py-3.5 text-sm font-medium text-white transition-all hover:bg-teal/90 hover:shadow-lg hover:shadow-teal/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {t('actions.loginPassword')}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-ink/10"></div>
                <span className="flex-shrink-0 mx-4 text-xs font-medium text-ink/40 uppercase tracking-wider">{t('or')}</span>
                <div className="flex-grow border-t border-ink/10"></div>
              </div>

              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={isSubmitting}
                className="group w-full rounded-2xl border-2 border-transparent bg-white/60 px-4 py-3.5 text-sm font-medium text-ink backdrop-blur transition-all hover:bg-white hover:border-teal/20 hover:text-teal hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex items-center justify-center gap-2">
                  <KeyRound className="h-4 w-4 transition-transform group-hover:scale-110" />
                  {t('actions.sendOtp')}
                </span>
              </button>
            </div>
          </form>
        ) : (
          <form className="space-y-5 animate-in slide-in-from-right-8 fade-in duration-500" onSubmit={handleVerifyOtp}>
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal/10 text-teal">
                <KeyRound className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-ink mb-1">{t('verifyTitle')}</h3>
              <p className="text-sm text-ink/60">
                {t('verifyBody', {identifier: identifier})}
              </p>
            </div>

            <label className="block group">
              <span className="mb-2 block text-sm font-medium text-ink transition-colors group-focus-within:text-teal">{t('fields.otp')}</span>
              <input
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
                className="w-full rounded-2xl border border-white/40 bg-white/50 backdrop-blur-md px-4 py-4 text-center text-2xl tracking-[0.4em] text-ink outline-none transition-all focus:bg-white focus:border-teal focus:ring-4 focus:ring-teal/10 hover:border-black/20"
                placeholder="0000"
                maxLength={4}
                required
                autoFocus
              />
            </label>

            {feedback ? <p className="rounded-2xl border border-emerald-100 bg-emerald-50/80 backdrop-blur px-4 py-3 text-sm text-emerald-800 text-center">{feedback}</p> : null}
            {error ? <p className="rounded-2xl border border-rose-100 bg-rose-50/80 backdrop-blur px-4 py-3 text-sm text-rose-700 text-center animate-in fade-in">{error}</p> : null}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group w-full rounded-2xl bg-teal px-4 py-3.5 text-sm font-medium text-white transition-all hover:bg-teal/90 hover:shadow-lg hover:shadow-teal/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('actions.verify')}
              </button>
            </div>
            
            <div className="text-center">
              <button 
                type="button" 
                onClick={() => setAuthMode('initial')}
                className="text-sm text-ink/50 hover:text-ink transition-colors"
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
