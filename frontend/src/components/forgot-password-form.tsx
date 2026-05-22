'use client';

import {FormEvent, useState} from 'react';
import {Mail, ArrowRight, KeyRound} from 'lucide-react';
import {requestPasswordReset} from '@/lib/api';

export function ForgotPasswordForm() {
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
      <section className="rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 shadow-soft backdrop-blur sm:p-8">
        
        {!isSuccess ? (
          <form className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500" onSubmit={handleSubmit}>
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal/10 text-teal">
                <KeyRound className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-semibold text-ink mb-2">Reset Password</h2>
              <p className="text-sm text-ink/60">
                Enter your email or phone number to receive a reset link.
              </p>
            </div>

            <label className="block group">
              <span className="mb-2 block text-sm font-medium text-ink transition-colors group-focus-within:text-teal">Email or Phone Number</span>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink/40 group-focus-within:text-teal transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  className="w-full rounded-2xl border border-white/40 bg-white/50 backdrop-blur-md pl-12 pr-4 py-3.5 text-sm text-ink outline-none transition-all focus:bg-white focus:border-teal focus:ring-4 focus:ring-teal/10 hover:border-black/20"
                  placeholder="e.g. user@example.com or +201000000000"
                  required
                />
              </div>
            </label>

            {error ? <p className="rounded-2xl border border-rose-100 bg-rose-50/80 backdrop-blur px-4 py-3 text-sm text-rose-700 animate-in fade-in">{error}</p> : null}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full overflow-hidden rounded-2xl bg-teal px-4 py-3.5 text-sm font-medium text-white transition-all hover:bg-teal/90 hover:shadow-lg hover:shadow-teal/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Send Reset Link
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-6 animate-in zoom-in-95 fade-in duration-500">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Mail className="h-8 w-8" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-ink">Check your messages</h3>
            <p className="mb-6 text-sm text-ink/70">
              {feedback}
            </p>
            <button
              onClick={() => setIsSuccess(false)}
              className="text-sm font-medium text-teal hover:text-teal/80 transition-colors"
            >
              Try another email or phone number
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
