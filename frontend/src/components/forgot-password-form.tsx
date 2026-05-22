'use client';

import {FormEvent, useState} from 'react';
import {requestPasswordReset} from '@/lib/api';

export function ForgotPasswordForm() {
  const [identifier, setIdentifier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFeedback(null);
    setIsSubmitting(true);

    try {
      const res = await requestPasswordReset(identifier);
      setFeedback(res.detail || 'Reset link sent.');
    } catch (caught: any) {
      setError(caught.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 shadow-soft backdrop-blur sm:p-8">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink">Email or Phone Number</span>
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-teal"
              placeholder="e.g. +201000000000 or user@example.com"
              required
            />
          </label>

          {feedback ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{feedback}</p> : null}
          {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-teal px-4 py-3 text-sm font-medium text-white transition hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Send Reset Link
          </button>
        </form>
      </section>
    </div>
  );
}
