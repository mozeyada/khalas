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
      <div className="space-y-6">
        <div className="h-40 rounded-3xl skeleton" />
        <div className="h-48 rounded-3xl skeleton" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl skeleton" />)}
        </div>
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
    <div data-theme="patient" className="space-y-6">
      {/* ── Hero Banner ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl px-6 py-8 text-white" style={{background: 'var(--grad-patient)'}}>
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-purple-500/20" />
        <div className="relative">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
            <Calendar className="h-3 w-3" />
            {new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            {greeting}{user?.name_ar || user?.name_en ? `, ${locale === 'ar' ? user.name_ar : user.name_en}` : ''}
          </h1>
          <p className="mt-1 max-w-lg text-sm text-white/70">
            {locale === 'ar'
              ? 'مرحباً بك في ملفك الصحي الذكي. يمكنك إدارة مواعيدك وملفاتك بكل سهولة.'
              : 'Welcome to your smart health dossier. Manage your appointments and records seamlessly.'}
          </p>
        </div>
      </div>

      {/* ── Error ───────────────────────────────────────────────── */}
      {error && (
        <div className="animate-fade-in rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* ── Next Appointment Hero ────────────────────────────────── */}
      {nextAppt ? (
        <div className={`relative overflow-hidden rounded-[2rem] p-6 transition card-lift animate-fade-in-up stagger-1 ${
          isSoon(nextAppt.slot_datetime) 
            ? 'bg-[var(--text-1)] text-white shadow-float border border-[var(--text-1)]/20' 
            : 'bg-white border border-[var(--border)] shadow-sm'
        }`}>
          {isSoon(nextAppt.slot_datetime) && (
            <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-white dot-pulse" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">
                {locale === 'ar' ? 'قريباً' : 'Soon'}
              </span>
            </div>
          )}
          <p className={`text-xs font-bold uppercase tracking-widest ${isSoon(nextAppt.slot_datetime) ? 'text-white/60' : 'text-[var(--text-3)]'}`}>
            {locale === 'ar' ? 'موعدك القادم' : 'Next Appointment'}
          </p>

          <div className="mt-4 flex items-center gap-4">
            <div className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl ${isSoon(nextAppt.slot_datetime) ? 'bg-white/10' : 'bg-[var(--surface-1)] text-[var(--text-1)]'}`}>
              <span className="text-2xl font-black leading-none">
                {new Date(nextAppt.slot_datetime).getDate()}
              </span>
              <span className="text-[10px] font-bold uppercase mt-1">
                {new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(nextAppt.slot_datetime))}
              </span>
            </div>
            <div className="min-w-0">
              <h2 className={`text-xl font-black tracking-tight ${isSoon(nextAppt.slot_datetime) ? 'text-white' : 'text-[var(--text-1)]'}`}>
                {new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(new Date(nextAppt.slot_datetime))}
              </h2>
              <p className={`text-sm font-semibold mt-0.5 ${isSoon(nextAppt.slot_datetime) ? 'text-white/70' : 'text-[var(--text-2)]'}`}>
                {(nextAppt as any).venue_name || (locale === 'ar' ? 'عيادة' : 'Clinic')}
              </p>
              <p className={`text-xs font-bold mt-1 ${isSoon(nextAppt.slot_datetime) ? 'text-white/50' : 'text-[var(--text-3)]'}`}>
                {formatPrice(nextAppt.price_at_booking, locale)}
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            {(nextAppt.status === 'pending' || nextAppt.status === 'confirmed') && (
              <button
                onClick={() => void handleCancel(nextAppt._id)}
                className={`flex-1 rounded-xl py-3 text-sm font-bold transition active:scale-95 ${
                  isSoon(nextAppt.slot_datetime)
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'border border-rose-200 text-rose-600 hover:bg-rose-50'
                }`}
              >
                {t('cancel')}
              </button>
            )}
            <span className={`inline-flex flex-1 items-center justify-center rounded-xl py-3 text-xs font-black uppercase tracking-widest ${
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
              className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition active:scale-95 ${
                isSoon(nextAppt.slot_datetime)
                  ? 'bg-white text-[var(--text-1)] hover:bg-white/90 shadow-sm'
                  : 'bg-[var(--text-1)] text-white hover:bg-[var(--text-1)]/90 shadow-sm'
              }`}
            >
              <Paperclip className="h-4 w-4" />
              {locale === 'ar' ? 'أرسل ملفاتك للطبيب قبل الموعد' : 'Send your files to the doctor'}
            </button>
          )}
        </div>
      ) : (
        /* ── No Upcoming ── */
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-[var(--border)] bg-white py-16 px-6 text-center shadow-sm animate-fade-in-up stagger-1">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--surface-0)] text-[var(--text-3)]">
            <CalendarX className="h-8 w-8" />
          </div>
          <h3 className="mb-2 text-xl font-black tracking-tight text-[var(--text-1)]">{t('noAppointments')}</h3>
          <p className="mb-8 max-w-sm text-sm text-[var(--text-3)] leading-relaxed">{t('empty')}</p>
          <button
            onClick={() => router.push(`/${locale}/search`)}
            className="group flex items-center gap-2 rounded-full bg-[var(--text-1)] px-8 py-4 text-sm font-bold text-white transition hover:scale-105 active:scale-95 shadow-md"
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
          className="group flex w-full items-center justify-between rounded-2xl border border-[var(--border)] bg-white px-5 py-4 shadow-sm transition hover:border-[var(--text-3)] hover:shadow-md active:scale-[0.99] animate-fade-in-up stagger-2 card-lift"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--surface-1)] text-[var(--text-1)] group-hover:bg-[var(--text-1)] group-hover:text-white transition-colors">
              <Search className="h-5 w-5" />
            </div>
            <div className="text-start">
              <p className="text-sm font-black text-[var(--text-1)]">
                {locale === 'ar' ? 'احجز موعداً جديداً' : 'Book a New Appointment'}
              </p>
              <p className="text-xs text-[var(--text-3)] mt-0.5">
                {locale === 'ar' ? 'ابحث عن عيادة أو طبيب' : 'Find a clinic or doctor near you'}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-[var(--text-3)] transition-transform group-hover:translate-x-0.5 rtl:rotate-180 group-hover:text-[var(--text-1)]" />
        </button>
      )}

      {/* ── Past Appointments ────────────────────────────────────── */}
      {pastAppts.length > 0 && (
        <div className="animate-fade-in-up stagger-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[var(--text-3)]" />
              {locale === 'ar' ? 'المواعيد السابقة' : 'Past Appointments'}
            </h2>
            <span className="rounded-full bg-[var(--surface-1)] border border-[var(--border)] px-2.5 py-0.5 text-xs font-bold text-[var(--text-2)]">
              {pastAppts.length}
            </span>
          </div>
          <div className="space-y-3">
            {pastAppts.slice(0, 3).map((appointment, index) => {
              const dateObj = new Date(appointment.slot_datetime);
              const dateStr = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(dateObj);
              const timeStr = new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(dateObj);
              return (
                <article
                  key={appointment._id}
                  className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm transition-colors hover:border-[var(--text-3)] card-lift"
                >
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--surface-0)] text-center">
                    <span className="text-base font-black leading-none text-[var(--text-1)]">{dateObj.getDate()}</span>
                    <span className="text-[10px] font-bold uppercase text-[var(--text-3)] mt-0.5">
                      {new Intl.DateTimeFormat(locale, { month: 'short' }).format(dateObj)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--text-1)]">
                      {(appointment as any).venue_name || (locale === 'ar' ? 'عيادة' : 'Clinic')}
                    </p>
                    <p className="text-xs font-semibold text-[var(--text-3)] mt-0.5">{timeStr} · {formatPrice(appointment.price_at_booking, locale)}</p>
                  </div>
                  <span className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                    appointment.status === 'completed' ? 'bg-emerald-50 text-emerald-700'
                    : appointment.status === 'cancelled' ? 'bg-rose-50 text-rose-700'
                    : 'bg-[var(--surface-1)] text-[var(--text-2)]'
                  }`}>
                    {appointment.status}
                  </span>
                </article>
              );
            })}
            {pastAppts.length > 3 && (
              <button className="w-full pt-2 text-center text-xs font-bold text-[var(--text-3)] hover:text-[var(--text-1)] transition">
                {locale === 'ar' ? `عرض ${pastAppts.length - 3} مواعيد أخرى` : `View ${pastAppts.length - 3} more appointments`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── All Upcoming Appts (if more than 1) ─────────────────── */}
      {upcomingAppts.length > 1 && (
        <div className="animate-fade-in-up stagger-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[var(--text-3)]" />
              {locale === 'ar' ? 'المواعيد القادمة' : 'Upcoming'}
            </h2>
          </div>
          <div className="space-y-3">
            {upcomingAppts.slice(1).map(appointment => {
              const dateObj = new Date(appointment.slot_datetime);
              const timeStr = new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(dateObj);
              return (
                <article
                  key={appointment._id}
                  className="group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm transition hover:shadow-md hover:border-[var(--text-3)] card-lift"
                >
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--surface-0)] text-center">
                    <span className="text-base font-black leading-none text-[var(--text-1)]">{dateObj.getDate()}</span>
                    <span className="text-[10px] font-bold uppercase text-[var(--text-3)] mt-0.5">
                      {new Intl.DateTimeFormat(locale, { month: 'short' }).format(dateObj)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--text-1)]">
                      {(appointment as any).venue_name || (locale === 'ar' ? 'عيادة' : 'Clinic')}
                    </p>
                    <p className="text-xs font-semibold text-[var(--text-3)] mt-0.5">{timeStr} · {formatPrice(appointment.price_at_booking, locale)}</p>
                  </div>
                  <span className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                    appointment.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {appointment.status}
                  </span>
                  {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                    <button
                      onClick={() => void handleCancel(appointment._id)}
                      className="shrink-0 rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50 active:scale-95"
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
