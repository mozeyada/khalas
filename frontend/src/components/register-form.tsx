'use client';

import {FormEvent, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';

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
    otpCode: ''
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
        email: formState.email
      });
      setOtpSent(true);
      setFeedback(
        t('otpSent', {
          phone: challenge.phone
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

        <form className="space-y-4" onSubmit={otpSent ? handleVerify : handleRegister}>
          {!otpSent ? (
            <>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">{t('fields.nameAr')}</span>
                <input
                  value={formState.nameAr}
                  onChange={(event) => setFormState((current) => ({...current, nameAr: event.target.value}))}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-teal"
                  placeholder={t('placeholders.nameAr')}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">{t('fields.nameEn')}</span>
                <input
                  value={formState.nameEn}
                  onChange={(event) => setFormState((current) => ({...current, nameEn: event.target.value}))}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-teal"
                  placeholder={t('placeholders.nameEn')}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">{t('fields.phone')}</span>
                <input
                  value={formState.phone}
                  onChange={(event) => setFormState((current) => ({...current, phone: event.target.value}))}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-teal"
                  placeholder={t('placeholders.phone')}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">{t('fields.email')}</span>
                <input
                  value={formState.email}
                  onChange={(event) => setFormState((current) => ({...current, email: event.target.value}))}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-teal"
                  placeholder={t('placeholders.email')}
                  type="email"
                  required
                />
              </label>
            </>
          ) : (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink">{t('fields.otp')}</span>
              <input
                value={formState.otpCode}
                onChange={(event) => setFormState((current) => ({...current, otpCode: event.target.value}))}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm tracking-[0.4em] text-ink outline-none transition focus:border-teal"
                placeholder={t('placeholders.otp')}
                maxLength={4}
                required
              />
            </label>
          )}

          {feedback ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{feedback}</p> : null}
          {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-teal px-4 py-3 text-sm font-medium text-white transition hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {otpSent ? t('actions.verify') : t('actions.submit')}
          </button>
        </form>
      </section>

      <aside className="rounded-[2rem] border border-white/70 bg-slate-950 p-6 text-slate-50 shadow-soft sm:p-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">{t('noteEyebrow')}</p>
        <h3 className="mb-3 text-2xl font-semibold">{t('noteTitle')}</h3>
        <p className="text-sm leading-7 text-slate-300">{t('noteBody')}</p>
      </aside>
    </div>
  );
}
