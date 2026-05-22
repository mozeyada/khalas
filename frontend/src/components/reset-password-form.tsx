'use client';

import {FormEvent, useState} from 'react';
import {resetPassword} from '@/lib/api';
import {useRouter} from 'next/navigation';
import {useLocale} from 'next-intl';

export function ResetPasswordForm() {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const locale = useLocale();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFeedback(null);
    setIsSubmitting(true);

    try {
      const res = await resetPassword(token, newPassword);
      setFeedback(res.detail || 'Password reset successfully.');
      setTimeout(() => {
        router.push(`/${locale}/auth/login`);
      }, 2000);
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
            <span className="mb-2 block text-sm font-medium text-ink">Reset Token</span>
            <input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-teal"
              placeholder="Enter reset token"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink">New Password</span>
            <input
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-teal"
              placeholder="••••••••"
              type="password"
              minLength={8}
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
            Update Password
          </button>
        </form>
      </section>
    </div>
  );
}
