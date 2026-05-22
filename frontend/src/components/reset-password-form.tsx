'use client';

import {FormEvent, useState} from 'react';
import {Lock, KeyRound, CheckCircle2} from 'lucide-react';
import {resetPassword} from '@/lib/api';
import {useRouter} from 'next/navigation';
import {useLocale} from 'next-intl';

export function ResetPasswordForm() {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
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
      setIsSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}/auth/login`);
      }, 2000);
    } catch (caught: any) {
      setError(caught.message || 'Something went wrong.');
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
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-semibold text-ink mb-2">Create New Password</h2>
              <p className="text-sm text-ink/60">
                Enter your reset token and your new secure password.
              </p>
            </div>

            <label className="block group">
              <span className="mb-2 block text-sm font-medium text-ink transition-colors group-focus-within:text-teal">Reset Token</span>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink/40 group-focus-within:text-teal transition-colors">
                  <KeyRound className="h-5 w-5" />
                </div>
                <input
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  className="w-full rounded-2xl border border-white/40 bg-white/50 backdrop-blur-md pl-12 pr-4 py-3.5 text-sm tracking-widest text-ink outline-none transition-all focus:bg-white focus:border-teal focus:ring-4 focus:ring-teal/10 hover:border-black/20"
                  placeholder="Paste token here"
                  required
                />
              </div>
            </label>

            <label className="block group">
              <span className="mb-2 block text-sm font-medium text-ink transition-colors group-focus-within:text-teal">New Password</span>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink/40 group-focus-within:text-teal transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-2xl border border-white/40 bg-white/50 backdrop-blur-md pl-12 pr-4 py-3.5 text-sm text-ink outline-none transition-all focus:bg-white focus:border-teal focus:ring-4 focus:ring-teal/10 hover:border-black/20"
                  placeholder="••••••••"
                  type="password"
                  minLength={8}
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
                Update Password
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-6 animate-in zoom-in-95 fade-in duration-500">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-ink">Password Updated</h3>
            <p className="mb-6 text-sm text-ink/70">
              {feedback} Redirecting to login...
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
