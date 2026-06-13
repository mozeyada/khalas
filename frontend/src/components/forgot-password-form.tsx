'use client';

import {FormEvent, useState} from 'react';
import {useTranslations, useLocale} from 'next-intl';
import {Mail, ArrowRight, KeyRound, ArrowRightCircle} from 'lucide-react';
import {requestPasswordReset} from '@/lib/api';
import {useRouter} from 'next/navigation';

export function ForgotPasswordForm() {
  const t = useTranslations('ForgotPasswordPage');
  const locale = useLocale();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFeedback(null);
    setIsSubmitting(true);

    try {
      const res = await requestPasswordReset(identifier);
      setFeedback(res.detail || 'Reset link sent.');
      setIsSuccess(true);
    } catch (caught: any) {
      setError(caught.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        
        {!isSuccess ? (
          <form className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500" onSubmit={handleSubmit}>
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center text-ink">
                <KeyRound className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-ink mb-2">{t('title')}</h2>
              <p className="text-sm text-zinc-500">
                {t('subtitle')}
              </p>
            </div>

            <label className="block group">
              <span className="mb-2 block text-sm font-semibold text-ink">{t('fields.identifier')}</span>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-ink transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  className="w-full rounded-sm border border-zinc-200 bg-[#FAFAFA] pl-10 pr-4 py-3 text-sm text-ink outline-none transition-all focus:bg-white focus:border-ink hover:border-zinc-300"
                  placeholder={t('placeholders.identifier')}
                  required
                />
              </div>
            </label>

            {error ? <p className="text-sm text-rose-600 font-medium animate-in fade-in">{error}</p> : null}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full overflow-hidden rounded-md bg-ink px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {t('actions.submit')}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-6 animate-in zoom-in-95 fade-in duration-500">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center text-ink">
              <Mail className="h-8 w-8" />
            </div>
            <h3 className="mb-2 text-xl font-bold tracking-tight text-ink">{t('successTitle')}</h3>
            <p className="mb-6 text-sm text-zinc-500">
              {feedback}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/${locale}/auth/reset-password`)}
                className="group relative w-full overflow-hidden rounded-md bg-ink px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 active:scale-95"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Enter Reset Code
                  <ArrowRightCircle className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
              <button
                onClick={() => setIsSuccess(false)}
                className="w-full rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-ink outline-none transition-all hover:bg-zinc-50 active:scale-95"
              >
                {t('tryAnother')}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
