'use client';

import {FormEvent, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {User, Mail, Phone, Lock, KeyRound, ArrowRight, MessageSquare} from 'lucide-react';

import {useSession} from '@/components/session-provider';
import {ApiError} from '@/lib/api';

export function RegisterForm() {
  const t = useTranslations('RegisterPage');
  const locale = useLocale();
  const router = useRouter();
  const {register, verifyOtpCode} = useSession();

  const [formState, setFormState] = useState({
    phone: '',
    nameAr: '',
    nameEn: '',
    email: '',
    password: '',
    otpCode: '',
    preferredChannel: 'whatsapp' as 'email' | 'whatsapp'
  });
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFeedback(null);
    setIsSubmitting(true);

    try {
      const challenge = await register({
        phone: formState.phone,
        name_ar: formState.nameAr,
        name_en: formState.nameEn,
        email: formState.email || undefined,
        password: formState.password || undefined,
        preferred_channel: (formState.phone && formState.email) ? formState.preferredChannel : undefined
      });
      setOtpSent(true);
      setFeedback(
        t('otpSent', {
          phone: challenge.identifier
        })
      );
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('genericError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await verifyOtpCode(formState.phone, formState.otpCode);
      router.push(`/${locale}/dashboard`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('genericError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 shadow-soft backdrop-blur sm:p-8">
        <h2 className="mb-2 text-2xl font-semibold text-ink">{t('title')}</h2>
        <p className="mb-6 text-sm leading-6 text-ink/70">{t('subtitle')}</p>

        <form className="space-y-5" onSubmit={otpSent ? handleVerify : handleRegister}>
          {!otpSent ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block group">
                  <span className="mb-2 block text-sm font-medium text-ink transition-colors group-focus-within:text-teal">{t('fields.nameEn')}</span>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink/40 group-focus-within:text-teal transition-colors">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      value={formState.nameEn}
                      onChange={(event) => setFormState((current) => ({...current, nameEn: event.target.value}))}
                      className="w-full rounded-2xl border border-white/40 bg-white/50 backdrop-blur-md pl-11 pr-4 py-3 text-sm text-ink outline-none transition-all focus:bg-white focus:border-teal focus:ring-4 focus:ring-teal/10 hover:border-black/20"
                      placeholder={t('placeholders.nameEn')}
                      required
                    />
                  </div>
                </label>
                <label className="block group">
                  <span className="mb-2 block text-sm font-medium text-ink transition-colors group-focus-within:text-teal">{t('fields.nameAr')}</span>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink/40 group-focus-within:text-teal transition-colors">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      value={formState.nameAr}
                      onChange={(event) => setFormState((current) => ({...current, nameAr: event.target.value}))}
                      className="w-full rounded-2xl border border-white/40 bg-white/50 backdrop-blur-md pl-11 pr-4 py-3 text-sm text-ink outline-none transition-all focus:bg-white focus:border-teal focus:ring-4 focus:ring-teal/10 hover:border-black/20 text-right"
                      placeholder={t('placeholders.nameAr')}
                      required
                    />
                  </div>
                </label>
              </div>
              
              <label className="block group">
                <span className="mb-2 block text-sm font-medium text-ink transition-colors group-focus-within:text-teal">{t('fields.phone')}</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink/40 group-focus-within:text-teal transition-colors">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    value={formState.phone}
                    onChange={(event) => setFormState((current) => ({...current, phone: event.target.value}))}
                    className="w-full rounded-2xl border border-white/40 bg-white/50 backdrop-blur-md pl-11 pr-4 py-3 text-sm text-ink outline-none transition-all focus:bg-white focus:border-teal focus:ring-4 focus:ring-teal/10 hover:border-black/20"
                    placeholder={t('placeholders.phone')}
                    required
                  />
                </div>
              </label>
              
              <label className="block group">
                <span className="mb-2 block text-sm font-medium text-ink transition-colors group-focus-within:text-teal">{t('fields.email')}</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink/40 group-focus-within:text-teal transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    value={formState.email}
                    onChange={(event) => setFormState((current) => ({...current, email: event.target.value}))}
                    className="w-full rounded-2xl border border-white/40 bg-white/50 backdrop-blur-md pl-11 pr-4 py-3 text-sm text-ink outline-none transition-all focus:bg-white focus:border-teal focus:ring-4 focus:ring-teal/10 hover:border-black/20"
                    placeholder={t('placeholders.email')}
                    type="email"
                  />
                </div>
              </label>
              
              <label className="block group">
                <span className="mb-2 block text-sm font-medium text-ink transition-colors group-focus-within:text-teal">{t('fields.passwordOptional')}</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink/40 group-focus-within:text-teal transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    value={formState.password}
                    onChange={(event) => setFormState((current) => ({...current, password: event.target.value}))}
                    className="w-full rounded-2xl border border-white/40 bg-white/50 backdrop-blur-md pl-11 pr-4 py-3 text-sm text-ink outline-none transition-all focus:bg-white focus:border-teal focus:ring-4 focus:ring-teal/10 hover:border-black/20"
                    placeholder={t('placeholders.password')}
                    type="password"
                    minLength={8}
                  />
                </div>
              </label>
              
              {formState.phone && formState.email && (
                <div className="block pt-2 animate-in fade-in zoom-in-95">
                  <span className="mb-3 block text-sm font-medium text-ink">{t('fields.preferredChannel')}</span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setFormState(c => ({...c, preferredChannel: 'whatsapp'}))}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-all ${
                        formState.preferredChannel === 'whatsapp' 
                          ? 'border-teal bg-teal/5 text-teal ring-1 ring-teal/20 shadow-sm' 
                          : 'border-white/40 bg-white/50 text-ink/60 hover:bg-white hover:border-black/10'
                      }`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormState(c => ({...c, preferredChannel: 'email'}))}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-all ${
                        formState.preferredChannel === 'email' 
                          ? 'border-teal bg-teal/5 text-teal ring-1 ring-teal/20 shadow-sm' 
                          : 'border-white/40 bg-white/50 text-ink/60 hover:bg-white hover:border-black/10'
                      }`}
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-right-8 fade-in duration-500">
              <div className="text-center mb-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal/10 text-teal">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-ink mb-1">{t('verifyTitle')}</h3>
                <p className="text-sm text-ink/60">
                  {t('verifyBody')}
                </p>
              </div>

              <label className="block group">
                <span className="mb-2 block text-sm font-medium text-ink transition-colors group-focus-within:text-teal">{t('fields.otp')}</span>
                <input
                  value={formState.otpCode}
                  onChange={(event) => setFormState((current) => ({...current, otpCode: event.target.value}))}
                  className="w-full rounded-2xl border border-white/40 bg-white/50 backdrop-blur-md px-4 py-4 text-center text-2xl tracking-[0.4em] text-ink outline-none transition-all focus:bg-white focus:border-teal focus:ring-4 focus:ring-teal/10 hover:border-black/20"
                  placeholder={t('placeholders.otp')}
                  maxLength={4}
                  required
                  autoFocus
                />
              </label>
            </div>
          )}

          {feedback ? <p className="rounded-2xl border border-emerald-100 bg-emerald-50/80 backdrop-blur px-4 py-3 text-sm text-emerald-800 text-center animate-in fade-in">{feedback}</p> : null}
          {error ? <p className="rounded-2xl border border-rose-100 bg-rose-50/80 backdrop-blur px-4 py-3 text-sm text-rose-700 text-center animate-in fade-in">{error}</p> : null}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full overflow-hidden rounded-2xl bg-teal px-4 py-3.5 text-sm font-medium text-white transition-all hover:bg-teal/90 hover:shadow-lg hover:shadow-teal/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {otpSent ? t('actions.verify') : t('actions.submit')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          </div>
        </form>
      </section>

      <aside className="rounded-[2rem] border border-white/70 bg-slate-950 p-6 text-slate-50 shadow-soft sm:p-8 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300 relative z-10">{t('noteEyebrow')}</p>
        <h3 className="mb-3 text-2xl font-semibold relative z-10">{t('noteTitle')}</h3>
        <p className="text-sm leading-7 text-slate-300 relative z-10">{t('noteBody')}</p>
      </aside>
    </div>
  );
}
