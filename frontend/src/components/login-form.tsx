'use client';

import {FormEvent, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';

import {useSession} from '@/components/session-provider';
import {ApiError} from '@/lib/api';

export function LoginForm() {
  const t = useTranslations('LoginPage');
  const locale = useLocale();
  const router = useRouter();
  const {requestOtp, verifyOtpCode} = useSession();

  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFeedback(null);
    setIsSubmitting(true);

    try {
      const challenge = await requestOtp(phone);
      setOtpSent(true);
      setFeedback(t('otpSent', {phone: challenge.phone}));
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
      const role = await verifyOtpCode(phone, otpCode);
      router.push(`/${locale}/${role === 'provider' ? 'provider/appointments' : 'dashboard'}`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('genericError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[2rem] border border-white/70 bg-slate-950 p-6 text-slate-50 shadow-soft sm:p-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">{t('eyebrow')}</p>
        <h2 className="mb-3 text-2xl font-semibold">{t('title')}</h2>
        <p className="text-sm leading-7 text-slate-300">{t('subtitle')}</p>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 shadow-soft backdrop-blur sm:p-8">
        <form className="space-y-4" onSubmit={otpSent ? handleVerify : handleRequest}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink">{t('fields.phone')}</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-teal"
              placeholder={t('placeholders.phone')}
              required
            />
          </label>

          {otpSent ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink">{t('fields.otp')}</span>
              <input
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm tracking-[0.4em] text-ink outline-none transition focus:border-teal"
                placeholder={t('placeholders.otp')}
                maxLength={4}
                required
              />
            </label>
          ) : null}

          {feedback ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{feedback}</p> : null}
          {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-teal px-4 py-3 text-sm font-medium text-white transition hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {otpSent ? t('actions.verify') : t('actions.request')}
          </button>
        </form>
      </section>
    </div>
  );
}
