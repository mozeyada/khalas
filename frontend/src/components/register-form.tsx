'use client';

import {FormEvent, useState, useEffect} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter, useSearchParams} from 'next/navigation';
import {User, Mail, Phone, Lock, KeyRound, ArrowRight, MessageSquare} from 'lucide-react';

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

function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const westernised = phone.replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
  let cleaned = westernised.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('00')) cleaned = '+' + cleaned.slice(2);
  if (cleaned.startsWith('01') && cleaned.length === 11) return true;
  return /^\+\d{10,15}$/.test(cleaned);
}

export function RegisterForm() {
  const t = useTranslations('RegisterPage');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isProviderFlow = searchParams?.get('role') === 'provider';
  const {register, verifyOtpCode} = useSession();

  const [formState, setFormState] = useState({
    phone: '',
    name: '',
    email: '',
    password: '',
    otpCode: '',
    preferredChannel: 'whatsapp' as 'email' | 'whatsapp',
    role: (isProviderFlow ? 'provider' : 'patient') as 'patient' | 'provider',
    providerType: (isProviderFlow ? 'doctor' : undefined) as 'doctor' | 'clinic' | undefined
  });
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormState(c => ({
      ...c,
      role: isProviderFlow ? 'provider' : 'patient',
      providerType: isProviderFlow ? 'doctor' : undefined
    }));
  }, [isProviderFlow]);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFeedback(null);
    setIsSubmitting(true);

    const normalizedPhone = normalizePhone(formState.phone);

    try {
      const challenge = await register({
        phone: normalizedPhone,
        name_ar: formState.name,
        name_en: formState.name,
        role: formState.role,
        provider_type: formState.role === 'provider' ? formState.providerType : undefined,
        email: formState.email || undefined,
        password: formState.password || undefined,
        preferred_channel: (normalizedPhone && formState.email) ? formState.preferredChannel : undefined
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

    const normalizedPhone = normalizePhone(formState.phone);

    try {
      const role = await verifyOtpCode(normalizedPhone, formState.otpCode);
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
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="mb-2 text-2xl font-bold text-ink tracking-tight">
          {isProviderFlow ? t('providerTitle') : t('title')}
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-zinc-500">
          {isProviderFlow ? t('providerSubtitle') : t('subtitle')}
        </p>

        <form className="space-y-5" onSubmit={otpSent ? handleVerify : handleRegister}>
          {!otpSent ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {isProviderFlow && (
                <div className="flex bg-zinc-50 p-1 rounded-md mb-6 border border-zinc-200">
                  <button
                    type="button"
                    onClick={() => setFormState(c => ({...c, role: 'provider', providerType: 'doctor'}))}
                    className={`flex-grow rounded-sm py-2 text-sm font-semibold transition-all ${
                      formState.role === 'provider' && formState.providerType === 'doctor'
                        ? 'bg-white shadow-sm border border-zinc-200 text-ink' 
                        : 'text-zinc-500 hover:text-ink'
                    }`}
                  >
                    {locale === 'ar' ? 'أنا طبيب' : 'I am a Doctor'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormState(c => ({...c, role: 'provider', providerType: 'clinic'}))}
                    className={`flex-grow rounded-sm py-2 text-sm font-semibold transition-all ${
                      formState.role === 'provider' && formState.providerType === 'clinic'
                        ? 'bg-white shadow-sm border border-zinc-200 text-ink' 
                        : 'text-zinc-500 hover:text-ink'
                    }`}
                  >
                    {locale === 'ar' ? 'أنا عيادة / مركز طبي' : 'I am a Clinic / Dr. Office'}
                  </button>
                </div>
              )}

              <div className="grid gap-4">
                <label className="block group">
                  <span className="mb-2 block text-sm font-semibold text-ink">{t('fields.name')}</span>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-ink transition-colors">
                      <User className="h-5 w-5" />
                    </div>
                    <input
                      value={formState.name}
                      onChange={(event) => setFormState((current) => ({...current, name: event.target.value}))}
                      className="w-full rounded-sm border border-zinc-200 bg-[#FAFAFA] pl-10 pr-4 py-3 text-sm text-ink outline-none transition-all focus:bg-white focus:border-ink hover:border-zinc-300"
                      placeholder={t('placeholders.name')}
                      required
                    />
                  </div>
                </label>
              </div>
              
              <label className="block group">
                <span className="mb-2 block text-sm font-semibold text-ink">{t('fields.phone')}</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-ink transition-colors">
                    <Phone className="h-5 w-5" />
                  </div>
                  <input
                    dir="ltr"
                    value={formState.phone}
                    onChange={(event) => setFormState((current) => ({...current, phone: event.target.value}))}
                    className={`w-full rounded-sm border bg-[#FAFAFA] pl-10 pr-4 py-3 text-sm text-left outline-none transition-all focus:bg-white 
                      ${formState.phone.length > 0
                        ? isValidPhone(formState.phone) 
                          ? 'border-emerald-500 text-emerald-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10' 
                          : 'border-rose-500 text-rose-600 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10'
                        : 'border-zinc-200 text-ink focus:border-ink hover:border-zinc-300'
                      }`}
                    placeholder={t('placeholders.phone')}
                    required
                  />
                </div>
              </label>
              
              <label className="block group">
                <span className="mb-2 block text-sm font-semibold text-ink">{t('fields.email')}</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-ink transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    value={formState.email}
                    onChange={(event) => setFormState((current) => ({...current, email: event.target.value}))}
                    className="w-full rounded-sm border border-zinc-200 bg-[#FAFAFA] pl-10 pr-4 py-3 text-sm text-ink outline-none transition-all focus:bg-white focus:border-ink hover:border-zinc-300"
                    placeholder={t('placeholders.email')}
                    type="email"
                  />
                </div>
              </label>
              
              <label className="block group">
                <span className="mb-2 block text-sm font-semibold text-ink">{t('fields.passwordOptional')}</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-ink transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    value={formState.password}
                    onChange={(event) => setFormState((current) => ({...current, password: event.target.value}))}
                    className="w-full rounded-sm border border-zinc-200 bg-[#FAFAFA] pl-10 pr-4 py-3 text-sm text-ink outline-none transition-all focus:bg-white focus:border-ink hover:border-zinc-300"
                    placeholder={t('placeholders.password')}
                    type="password"
                    minLength={8}
                  />
                </div>
              </label>
              
              {formState.phone && formState.email && (
                <div className="block pt-2 animate-in fade-in zoom-in-95">
                  <span className="mb-3 block text-sm font-semibold text-ink">{t('fields.preferredChannel')}</span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setFormState(c => ({...c, preferredChannel: 'whatsapp'}))}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-md border py-3 text-sm font-semibold transition-all ${
                        formState.preferredChannel === 'whatsapp' 
                          ? 'border-ink bg-zinc-50 text-ink' 
                          : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-ink'
                      }`}
                    >
                      <MessageSquare className="h-5 w-5" />
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormState(c => ({...c, preferredChannel: 'email'}))}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-md border py-3 text-sm font-semibold transition-all ${
                        formState.preferredChannel === 'email' 
                          ? 'border-ink bg-zinc-50 text-ink' 
                          : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-ink'
                      }`}
                    >
                      <Mail className="h-5 w-5" />
                      Email
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-right-8 fade-in duration-500">
              <div className="text-center mb-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center text-ink">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-ink mb-1">{t('verifyTitle')}</h3>
                <p className="text-sm text-zinc-500">
                  {t('verifyBody')}
                </p>
              </div>

              <label className="block group">
                <span className="mb-2 block text-sm font-semibold text-ink">{t('fields.otp')}</span>
                <input
                  value={formState.otpCode}
                  onChange={(event) => setFormState((current) => ({...current, otpCode: event.target.value}))}
                  className="w-full rounded-sm border border-zinc-200 bg-[#FAFAFA] px-4 py-4 text-center text-2xl tracking-[0.4em] text-ink outline-none transition-all focus:bg-white focus:border-ink hover:border-zinc-300"
                  placeholder={t('placeholders.otp')}
                  maxLength={4}
                  required
                  autoFocus
                />
              </label>
            </div>
          )}

          {feedback ? <p className="text-sm text-emerald-600 font-medium text-center animate-in fade-in">{feedback}</p> : null}
          {error ? <p className="text-sm text-rose-600 font-medium text-center animate-in fade-in">{error}</p> : null}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full overflow-hidden rounded-md bg-ink px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {otpSent ? t('actions.verify') : t('actions.submit')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          </div>

          {!otpSent && (
            <div className="mt-6 text-center space-y-3">
              <div>
                <a
                  href={`/${locale}/auth/login`}
                  className="text-sm text-zinc-500 hover:text-ink font-semibold transition-colors"
                >
                  {t('loginLink')}
                </a>
              </div>
              <div className="pt-2 border-t border-zinc-200">
                {isProviderFlow ? (
                  <a
                    href={`/${locale}/auth/register`}
                    className="text-sm text-ink hover:underline font-semibold transition-colors"
                  >
                    {t('patientLink')}
                  </a>
                ) : (
                  <a
                    href={`/${locale}/auth/register?role=provider`}
                    className="text-sm text-zinc-500 hover:text-ink font-semibold transition-colors"
                  >
                    {t('providerLink')}
                  </a>
                )}
              </div>
            </div>
          )}
        </form>
      </section>

      {/* Dark note aside — desktop only */}
      <aside className="hidden lg:block rounded-lg border border-white/10 bg-slate-950 p-8 text-slate-50 relative overflow-hidden group">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.24em] text-zinc-400 relative z-10">{t('noteEyebrow')}</p>
        <h3 className="mb-3 text-2xl font-bold relative z-10">{t('noteTitle')}</h3>
        <p className="text-sm leading-relaxed text-slate-300 relative z-10">{t('noteBody')}</p>
      </aside>
    </div>
  );
}
