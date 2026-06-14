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

function getStatusLabel(status: string, locale: string) {
  if (locale === 'ar') {
    if (status === 'pending') return 'قيد الانتظار';
    if (status === 'confirmed') return 'مؤكد';
    if (status === 'completed') return 'مكتمل';
    if (status === 'cancelled') return 'ملغي';
  }
  return status;
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
    <div data-theme="patient" className="space-y-6 max-w-5xl mx-auto w-full">
      {/* ── Hero Banner ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 text-white bg-gradient-to-r from-blue-600 to-blue-800 rtl:from-blue-800 rtl:to-blue-600">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-10 left-1/4 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative z-10">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest drop-shadow-sm">
            <Calendar className="h-3 w-3" />
            {new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight drop-shadow-sm">
            {greeting}{user?.name_ar || user?.name_en ? `، ${locale === 'ar' ? user.name_ar.replace(/^المريض\s+/i, '') : user.name_en.replace(/^Patient\s+/i, '')}` : ''}
          </h1>
          <p className="mt-1 md:mt-2 max-w-lg text-sm md:text-base text-white/90 drop-shadow-sm">
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
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 mb-4 relative overflow-hidden animate-fade-in-up stagger-1">
          {/* Status Badge floating top-left (RTL) */}
          <div className="absolute top-4 left-4 bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-bold rtl:left-4 rtl:right-auto z-10 shadow-sm border border-amber-100">
            {getStatusLabel(nextAppt.status, locale)}
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            {locale === 'ar' ? 'موعدك القادم' : 'Next Appointment'}
          </p>

          <div className="flex items-center gap-4">
            {/* Calendar Block */}
            <div className="flex flex-col items-center justify-center bg-slate-50 rounded-xl p-3 min-w-[70px] border border-slate-100">
              <span className="text-2xl font-black leading-none text-slate-800">
                {new Date(nextAppt.slot_datetime).getDate()}
              </span>
              <span className="text-xs font-bold uppercase mt-1 text-slate-500">
                {new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(nextAppt.slot_datetime))}
              </span>
            </div>
            
            {/* Details */}
            <div className="flex flex-col items-start min-w-0 flex-1">
              <h2 className="text-lg md:text-xl font-black tracking-tight text-slate-800">
                {new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(new Date(nextAppt.slot_datetime))}
              </h2>
              <div className="flex items-center gap-1.5 text-sm font-semibold mt-1 text-slate-500">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{(nextAppt as any).venue_name || (locale === 'ar' ? 'عيادة' : 'Clinic')}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold mt-1 text-slate-400">
                <CreditCard className="h-3.5 w-3.5 shrink-0" />
                <span dir="ltr">{formatPrice(nextAppt.price_at_booking, locale)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="mt-5 pt-4 border-t border-slate-50 flex flex-col md:flex-row-reverse gap-3 items-center">
            {/* Primary Action (Send Files) */}
            {(nextAppt.status === 'pending' || nextAppt.status === 'confirmed') && (
              <button
                onClick={() => router.push(`/${locale}/dashboard/dossier/${nextAppt._id}`)}
                className="w-full md:w-auto md:flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 py-3 px-6 text-sm font-bold text-white shadow-sm transition-colors flex justify-center items-center gap-2"
              >
                <Paperclip className="h-4 w-4" />
                {locale === 'ar' ? 'أرسل ملفاتك للطبيب' : 'Send your files'}
              </button>
            )}
            
            {/* Secondary Action (Cancel) */}
            {(nextAppt.status === 'pending' || nextAppt.status === 'confirmed') && (
              <button
                onClick={() => void handleCancel(nextAppt._id)}
                className="w-full md:w-auto text-red-500 hover:bg-red-50 px-4 py-2.5 rounded-xl transition-colors text-sm font-semibold flex justify-center items-center"
              >
                {t('cancel')}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* ── No Upcoming ── */
        <div 
          onClick={() => router.push(`/${locale}/search`)}
          className="border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-400 hover:shadow-md rounded-[24px] flex flex-col items-center justify-center p-8 lg:p-12 text-slate-500 hover:text-blue-600 transition-all cursor-pointer group mb-4 animate-fade-in-up stagger-1"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 group-hover:bg-blue-50 transition-colors">
            <Search className="h-8 w-8 text-slate-400 group-hover:text-blue-600 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <h3 className="mb-2 text-xl font-black tracking-tight text-slate-800 group-hover:text-blue-600 transition-colors">{t('noAppointments')}</h3>
          <p className="text-sm text-slate-500 leading-relaxed max-w-sm text-center mb-4">{t('empty')}</p>
          <span className="font-bold text-blue-600">{locale === 'ar' ? 'احجز موعداً جديداً' : 'Book a New Appointment'}</span>
        </div>
      )}

      {/* ── Quick Book Button (when they do have appointments) ───── */}
      {nextAppt && (
        <div 
          onClick={() => router.push(`/${locale}/search`)}
          className="border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-400 hover:shadow-md rounded-[24px] flex items-center justify-between p-4 px-5 text-slate-500 hover:text-blue-600 transition-all cursor-pointer group mb-4 animate-fade-in-up stagger-2"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-blue-50 transition-colors">
              <Search className="h-5 w-5 text-slate-400 group-hover:text-blue-600 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="text-start">
              <p className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                {locale === 'ar' ? 'احجز موعداً جديداً' : 'Book a New Appointment'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {locale === 'ar' ? 'ابحث عن عيادة أو طبيب' : 'Find a clinic or doctor near you'}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
        </div>
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
                  className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm transition-colors hover:border-[var(--text-3)] card-lift"
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
                    <div className="text-xs font-semibold text-[var(--text-3)] mt-0.5 flex items-center gap-1">
                      <span>{timeStr}</span>
                      <span>·</span>
                      <span dir="ltr" className="whitespace-nowrap inline-flex">{formatPrice(appointment.price_at_booking, locale)}</span>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-center ${
                    appointment.status === 'completed' ? 'bg-emerald-100 text-emerald-800'
                    : appointment.status === 'cancelled' ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-100 text-slate-800'
                  }`}>
                    {getStatusLabel(appointment.status, locale)}
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
                  className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm transition hover:shadow-md hover:border-[var(--text-3)] card-lift"
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
                    <div className="text-xs font-semibold text-[var(--text-3)] mt-0.5 flex items-center gap-1">
                      <span>{timeStr}</span>
                      <span>·</span>
                      <span dir="ltr" className="whitespace-nowrap inline-flex">{formatPrice(appointment.price_at_booking, locale)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <span className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-center ${
                      appointment.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {getStatusLabel(appointment.status, locale)}
                    </span>
                    {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                      <button
                        onClick={() => void handleCancel(appointment._id)}
                        className="shrink-0 rounded-full border border-rose-200 px-4 py-1.5 text-xs font-bold text-rose-600 bg-transparent transition hover:bg-rose-50 active:scale-95 text-center"
                      >
                        {t('cancel')}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
