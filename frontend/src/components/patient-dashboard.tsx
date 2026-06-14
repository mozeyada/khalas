'use client';

import {useEffect, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {
  Calendar, Clock, CreditCard, CalendarX, ArrowRight,
  Building2, Search, Star, MapPin, ChevronRight, Paperclip, Stethoscope
} from 'lucide-react';

import {useSession} from '@/components/session-provider';
import {ApiError, cancelAppointment, getMyAppointments} from '@/lib/api';
import {formatDateTime, formatPrice} from '@/lib/format';
import {Appointment} from '@/lib/types';

// ── helpers ──────────────────────────────────────────────────────────────────

function isUpcoming(dt: string) {
  return new Date(dt) > new Date();
}

function isSoon(dt: string) {
  const diff = new Date(dt).getTime() - Date.now();
  return diff > 0 && diff < 24 * 60 * 60 * 1000; // within 24h
}

// ── component ─────────────────────────────────────────────────────────────────

export function PatientDashboard() {
  const t = useTranslations('DashboardPage');
  const locale = useLocale();
  const router = useRouter();
  const { isAuthenticated, isReady, user } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated || user?.role !== 'patient') {
      router.push(`/${locale}/auth/login`);
      return;
    }

    void getMyAppointments()
      .then(response => {
        setAppointments(response);
        setError(null);
      })
      .catch(caught => {
        setError(caught instanceof ApiError ? caught.message : t('genericError'));
      })
      .finally(() => { setIsLoading(false); });
  }, [isAuthenticated, isReady, locale, router, t, user?.role]);

  async function handleCancel(appointmentId: string) {
    try {
      const updated = await cancelAppointment(appointmentId, t('cancelReasonDefault'));
      setAppointments(current => current.filter(item => item._id !== updated._id));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('genericError'));
    }
  }

  if (!isReady || isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--text-1)] border-t-transparent" />
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = locale === 'ar'
    ? (hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء النور')
    : (hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening');

  const upcomingAppts = appointments.filter(a => isUpcoming(a.slot_datetime) && a.status !== 'cancelled');
  const nextAppt = upcomingAppts[0] ?? null;
  const pastAppts = appointments.filter(a => !isUpcoming(a.slot_datetime));

  // Deduplicate clinics from past visits for "My Clinics" carousel
  const pastClinicSlugs = new Set<string>();
  const pastClinics: { slug: string; name: string }[] = [];
  pastAppts.forEach(a => {
    const slug = (a as any).venue_slug || '';
    const name = (a as any).venue_name || (locale === 'ar' ? 'عيادة' : 'Clinic');
    if (slug && !pastClinicSlugs.has(slug)) {
      pastClinicSlugs.add(slug);
      pastClinics.push({ slug, name });
    }
  });

  return (
    <div className="space-y-6">
      {/* ── Greeting ────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-3)]">
          {new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
        </p>
        <h1 className="mt-1 text-2xl font-black text-[var(--text-1)]">
          {greeting}{user?.name_ar || user?.name_en ? `, ${locale === 'ar' ? user.name_ar : user.name_en}` : ''} 👋
        </h1>
      </div>

      {/* ── Error ───────────────────────────────────────────────── */}
      {error && (
        <div className="animate-in fade-in rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* ── Next Appointment Hero ────────────────────────────────── */}
      {nextAppt ? (
        <div className={`relative overflow-hidden rounded-lg p-6 ${
          isSoon(nextAppt.slot_datetime) 
            ? 'bg-brand text-white' 
            : 'bg-white border border-zinc-200 shadow-sm'
        }`}>
          {isSoon(nextAppt.slot_datetime) && (
            <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-sm bg-white/20 px-3 py-1">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              <span className="text-[11px] font-bold text-white uppercase tracking-widest">
                {locale === 'ar' ? 'قريباً' : 'Soon'}
              </span>
            </div>
          )}
          <p className={`text-xs font-bold uppercase tracking-widest ${isSoon(nextAppt.slot_datetime) ? 'text-white/60' : 'text-zinc-500'}`}>
            {locale === 'ar' ? 'موعدك القادم' : 'Next Appointment'}
          </p>

          <div className="mt-3 flex items-center gap-4">
            <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-md ${isSoon(nextAppt.slot_datetime) ? 'bg-white/10' : 'bg-zinc-100 text-ink'}`}>
              <span className="text-xl font-black leading-none">
                {new Date(nextAppt.slot_datetime).getDate()}
              </span>
              <span className="text-[10px] font-bold uppercase">
                {new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(nextAppt.slot_datetime))}
              </span>
            </div>
            <div className="min-w-0">
              <h2 className={`text-lg font-black tracking-tight ${isSoon(nextAppt.slot_datetime) ? 'text-white' : 'text-ink'}`}>
                {new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(new Date(nextAppt.slot_datetime))}
              </h2>
              <p className={`text-sm ${isSoon(nextAppt.slot_datetime) ? 'text-white/70' : 'text-zinc-600'}`}>
                {(nextAppt as any).venue_name || (locale === 'ar' ? 'عيادة' : 'Clinic')}
              </p>
              <p className={`text-xs font-bold mt-0.5 ${isSoon(nextAppt.slot_datetime) ? 'text-white/50' : 'text-zinc-400'}`}>
                {formatPrice(nextAppt.price_at_booking, locale)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            {(nextAppt.status === 'pending' || nextAppt.status === 'confirmed') && (
              <button
                onClick={() => void handleCancel(nextAppt._id)}
                className={`flex-1 rounded-sm py-2.5 text-sm font-semibold transition active:scale-95 ${
                  isSoon(nextAppt.slot_datetime)
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'border border-rose-200 text-rose-600 hover:bg-rose-50'
                }`}
              >
                {t('cancel')}
              </button>
            )}
            <span className={`inline-flex flex-1 items-center justify-center rounded-sm py-2.5 text-xs font-bold uppercase tracking-widest ${
              nextAppt.status === 'confirmed' 
                ? (isSoon(nextAppt.slot_datetime) ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-100')
                : (isSoon(nextAppt.slot_datetime) ? 'bg-white/10 text-white/70' : 'bg-amber-50 text-amber-700 border border-amber-100')
            }`}>
              {nextAppt.status}
            </span>
          </div>

          {/* Dossier upload CTA */}
          {(nextAppt.status === 'pending' || nextAppt.status === 'confirmed') && (
            <button
              onClick={() => router.push(`/${locale}/dashboard/dossier/${nextAppt._id}`)}
              className={`mt-2 flex w-full items-center justify-center gap-2 rounded-sm py-2.5 text-xs font-semibold transition active:scale-95 ${
                isSoon(nextAppt.slot_datetime)
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'border border-brand/20 text-brand hover:bg-brand/5'
              }`}
            >
              <Paperclip className="h-3.5 w-3.5" />
              {locale === 'ar' ? 'أرسل ملفاتك للطبيب قبل الموعد' : 'Send your files to the doctor'}
            </button>
          )}
        </div>
      ) : (
        /* ── No Upcoming ── */
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 py-16 px-6 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm border border-zinc-200">
            <CalendarX className="h-6 w-6 text-zinc-400" />
          </div>
          <h3 className="mb-2 text-xl font-bold tracking-tight text-ink">{t('noAppointments')}</h3>
          <p className="mb-8 max-w-sm text-sm text-zinc-500 leading-relaxed">{t('empty')}</p>
          <button
            onClick={() => router.push(`/${locale}/search`)}
            className="group flex items-center gap-2 rounded-md bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover active:scale-95"
          >
            <Search className="h-4 w-4" />
            {t('bookNow')}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180" />
          </button>
        </div>
      )}

      {/* ── Quick Book Button (when they do have appointments) ───── */}
      {nextAppt && (
        <button
          onClick={() => router.push(`/${locale}/search`)}
          className="group flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-5 py-4 shadow-sm transition hover:border-zinc-300 hover:shadow-md active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-brand text-white">
              <Search className="h-5 w-5" />
            </div>
            <div className="text-start">
              <p className="text-sm font-bold text-ink">
                {locale === 'ar' ? 'احجز موعداً جديداً' : 'Book a New Appointment'}
              </p>
              <p className="text-xs text-zinc-500">
                {locale === 'ar' ? 'ابحث عن عيادة أو طبيب' : 'Find a clinic or doctor near you'}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-zinc-400 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
        </button>
      )}

      {/* ── Past Appointments ────────────────────────────────────── */}
      {pastAppts.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--text-1)]">
              {locale === 'ar' ? 'المواعيد السابقة' : 'Past Appointments'}
            </h2>
            <span className="rounded-full bg-[var(--surface-1)] border border-[var(--border)] px-2.5 py-0.5 text-xs font-bold text-[var(--text-2)]">
              {pastAppts.length}
            </span>
          </div>
          <div className="space-y-2">
            {pastAppts.slice(0, 3).map((appointment, index) => {
              const dateObj = new Date(appointment.slot_datetime);
              const dateStr = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(dateObj);
              const timeStr = new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(dateObj);
              return (
                <article
                  key={appointment._id}
                  className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300"
                >
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md bg-zinc-50 border border-zinc-100 text-center">
                    <span className="text-base font-black leading-none text-ink">{dateObj.getDate()}</span>
                    <span className="text-[10px] font-bold uppercase text-zinc-500 mt-0.5">
                      {new Intl.DateTimeFormat(locale, { month: 'short' }).format(dateObj)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {(appointment as any).venue_name || (locale === 'ar' ? 'عيادة' : 'Clinic')}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">{timeStr} · {formatPrice(appointment.price_at_booking, locale)}</p>
                  </div>
                  <span className={`shrink-0 rounded-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                    appointment.status === 'completed' ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                    : appointment.status === 'cancelled' ? 'bg-rose-50 border border-rose-100 text-rose-700'
                    : 'bg-zinc-100 border border-zinc-200 text-zinc-600'
                  }`}>
                    {appointment.status}
                  </span>
                </article>
              );
            })}
            {pastAppts.length > 3 && (
              <p className="pt-1 text-center text-xs font-semibold text-[var(--text-3)]">
                {locale === 'ar' ? `+${pastAppts.length - 3} مواعيد أخرى` : `+${pastAppts.length - 3} more appointments`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── All Upcoming Appts (if more than 1) ─────────────────── */}
      {upcomingAppts.length > 1 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--text-1)]">
              {locale === 'ar' ? 'المواعيد القادمة' : 'Upcoming'}
            </h2>
          </div>
          <div className="space-y-2">
            {upcomingAppts.slice(1).map(appointment => {
              const dateObj = new Date(appointment.slot_datetime);
              const timeStr = new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(dateObj);
              return (
                <article
                  key={appointment._id}
                  className="group flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md hover:border-zinc-300"
                >
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md bg-zinc-50 border border-zinc-100 text-center">
                    <span className="text-base font-black leading-none text-ink">{dateObj.getDate()}</span>
                    <span className="text-[10px] font-bold uppercase text-zinc-500 mt-0.5">
                      {new Intl.DateTimeFormat(locale, { month: 'short' }).format(dateObj)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {(appointment as any).venue_name || (locale === 'ar' ? 'عيادة' : 'Clinic')}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">{timeStr} · {formatPrice(appointment.price_at_booking, locale)}</p>
                  </div>
                  <span className={`shrink-0 rounded-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                    appointment.status === 'confirmed' ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' : 'bg-amber-50 border border-amber-100 text-amber-700'
                  }`}>
                    {appointment.status}
                  </span>
                  {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                    <button
                      onClick={() => void handleCancel(appointment._id)}
                      className="shrink-0 rounded-sm border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 active:scale-95"
                    >
                      {t('cancel')}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
