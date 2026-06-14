'use client';

import {useEffect, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {Link} from '@/i18n/navigation';
import {
  Calendar, Clock, CheckCircle2, XCircle, FileText, ArrowRight,
  TrendingUp, Users, PlusCircle, Settings, QrCode, Activity,
  CreditCard, Repeat, ChevronRight, Stethoscope, ShieldCheck, Paperclip
} from 'lucide-react';

import {useSession} from '@/components/session-provider';
import {WalkInModal} from '@/components/walkin-modal';
import {VenueQrModal} from '@/components/venue-qr-modal';
import {SiteShell} from '@/components/site-shell';
import {ApiError, getProviderAppointments, updateProviderAppointmentStatus} from '@/lib/api';
import {formatPrice} from '@/lib/format';
import {Appointment} from '@/lib/types';

export default function ProviderDashboardPage() {
  const t = useTranslations('ProviderDashboardPage');
  const locale = useLocale();
  const router = useRouter();
  const {isAuthenticated, isReady, user} = useSession();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated || user?.role !== 'provider') {
      router.push(`/${locale}/auth/login`);
      return;
    }
    loadAppointments();
  }, [isAuthenticated, isReady, locale, router, user?.role]);

  function loadAppointments() {
    setIsLoading(true);
    getProviderAppointments()
      .then(response => { setAppointments(response); setError(null); })
      .catch(caught => { setError(caught instanceof ApiError ? caught.message : t('genericError')); })
      .finally(() => { setIsLoading(false); });
  }

  async function handleStatusChange(appointmentId: string, status: 'confirmed' | 'cancelled') {
    try {
      const updated = await updateProviderAppointmentStatus(appointmentId, {
        status,
        cancellation_reason: status === 'cancelled' ? 'Provider cancelled' : undefined
      });
      setAppointments(current => current.map(item => item._id === updated._id ? updated : item));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('genericError'));
    }
  }

  if (!isReady || isLoading) {
    return (
      <SiteShell>
        <div className="space-y-6">
          <div className="h-40 rounded-3xl skeleton" />
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl skeleton" />)}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl skeleton" />)}
          </div>
        </div>
      </SiteShell>
    );
  }

  // ── Calculate stats ──────────────────────────────────────────────────────
  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay());
  const startOfLastWeek = new Date(startOfWeek); startOfLastWeek.setDate(startOfWeek.getDate() - 7);

  const todaysAppointments = appointments
    .filter(a => { const d = new Date(a.slot_datetime); return d >= today && d < tomorrow; })
    .sort((a, b) => new Date(a.slot_datetime).getTime() - new Date(b.slot_datetime).getTime());

  const thisWeekAppts = appointments.filter(a => {
    const d = new Date(a.slot_datetime);
    return d >= startOfWeek;
  });
  const lastWeekAppts = appointments.filter(a => {
    const d = new Date(a.slot_datetime);
    return d >= startOfLastWeek && d < startOfWeek;
  });

  const revenueThisWeek = thisWeekAppts
    .filter(a => a.status === 'confirmed' || a.status === 'completed')
    .reduce((sum, a) => sum + a.price_at_booking, 0);
  const revenueLastWeek = lastWeekAppts
    .filter(a => a.status === 'confirmed' || a.status === 'completed')
    .reduce((sum, a) => sum + a.price_at_booking, 0);

  const revenueTrend = revenueLastWeek === 0
    ? null
    : Math.round(((revenueThisWeek - revenueLastWeek) / revenueLastWeek) * 100);

  // Unique patients this week
  const uniquePatientsThisWeek = new Set(thisWeekAppts.map(a => (a as any).patient_id).filter(Boolean)).size;

  // Pending count for urgency
  const pendingCount = todaysAppointments.filter(a => a.status === 'pending').length;

  // ── Recent activity feed (last 5 appointments across all time) ───────────
  const recentFeed = [...appointments]
    .sort((a, b) => new Date(b.slot_datetime).getTime() - new Date(a.slot_datetime).getTime())
    .slice(0, 5);

  const hour = now.getHours();
  const greeting = locale === 'ar'
    ? (hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء النور')
    : (hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening');

  return (
    <SiteShell>
      <div data-theme="provider" className="space-y-6">

      {/* ── Hero Banner ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl px-6 py-8 text-white" style={{background: 'var(--grad-provider)'}}>
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-32 w-32 rounded-full bg-teal-500/20" />
        <div className="relative">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
            <Stethoscope className="h-3 w-3" />
            {new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(now)}
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            {greeting}{user?.name_ar || user?.name_en ? `, ${locale === 'ar' ? user.name_ar : user.name_en}` : ''}
          </h1>
          <p className="mt-1 text-sm text-white/70">
            {locale === 'ar' ? 'نظرة عامة على مواعيدك ونشاط العيادة اليوم.' : "Overview of your appointments and clinic activity today."}
          </p>
        </div>
      </div>

      {/* ── Error ───────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 animate-fade-in">
          <XCircle className="inline h-4 w-4 mb-0.5 me-1" />{error}
        </div>
      )}

      {/* ── Quick Actions ────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2 animate-fade-in-up stagger-1">
        <button onClick={() => setIsWalkInModalOpen(true)}
          className="relative flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-[var(--text-1)] py-3 text-white transition active:scale-95 shadow-sm card-lift">
          {pendingCount > 0 && (
            <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white dot-pulse">
              {pendingCount}
            </span>
          )}
          <PlusCircle className="h-6 w-6" />
          <span className="text-xs font-semibold">{locale === 'ar' ? 'إضافة موعد' : 'Add Walk-in'}</span>
        </button>
        {user?.provider_type === 'doctor' ? (
          <Link href="/provider/patients" locale={locale}
            className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-brand/10 border border-brand/20 py-3 text-brand transition hover:bg-brand/20 card-lift">
            <Users className="h-6 w-6" />
            <span className="text-xs font-semibold">{locale === 'ar' ? 'مرضاي' : 'My Patients'}</span>
          </Link>
        ) : (
          <button onClick={() => setIsQrModalOpen(true)}
            className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-white border border-[var(--border)] py-3 text-[var(--text-2)] transition hover:bg-[var(--surface-0)] active:scale-95 card-lift">
            <QrCode className="h-6 w-6 text-[var(--text-2)]" />
            <span className="text-xs font-semibold">{locale === 'ar' ? 'رمز QR' : 'Print QR'}</span>
          </button>
        )}
        <Link href="/provider/appointments" locale={locale}
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-white border border-[var(--border)] py-3 text-[var(--text-2)] transition hover:bg-[var(--surface-0)] card-lift">
          <Calendar className="h-6 w-6 text-[var(--text-3)]" />
          <span className="text-xs font-semibold">{locale === 'ar' ? 'كل المواعيد' : 'All Appts'}</span>
        </Link>
        <Link href="/provider/settings" locale={locale}
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-white border border-[var(--border)] py-3 text-[var(--text-2)] transition hover:bg-[var(--surface-0)] card-lift">
          <Settings className="h-6 w-6 text-[var(--text-3)]" />
          <span className="text-xs font-semibold">{locale === 'ar' ? 'الإعدادات' : 'Settings'}</span>
        </Link>
      </div>

      {/* ── Stats Strip ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {icon: Users, v: todaysAppointments.length, label_en: "Today's Appts", label_ar: 'مواعيد اليوم', c: 'bg-zinc-100 text-zinc-700', delay: 'stagger-2'},
          {icon: CreditCard, v: formatPrice(revenueThisWeek, locale), label_en: 'Week Revenue', label_ar: 'إيرادات الأسبوع', c: 'bg-emerald-50 text-emerald-600', delay: 'stagger-3', trend: revenueTrend},
          {icon: Calendar, v: thisWeekAppts.length, label_en: 'Week Appts', label_ar: 'مواعيد الأسبوع', c: 'bg-blue-50 text-blue-600', delay: 'stagger-4'},
          {icon: Repeat, v: uniquePatientsThisWeek, label_en: 'Unique Patients', label_ar: 'مرضى هذا الأسبوع', c: 'bg-purple-50 text-purple-600', delay: 'stagger-5', hidden: 'hidden sm:block'},
        ].map((k: any) => (
          <div key={k.label_en} className={`card-lift animate-fade-in-up ${k.delay} ${k.hidden || ''} rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm`}>
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${k.c}`}>
              <k.icon className="h-4 w-4" />
            </div>
            <p className="stat-num text-2xl font-black text-[var(--text-1)]">{k.v}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <p className="text-xs font-semibold text-[var(--text-3)]">{locale === 'ar' ? k.label_ar : k.label_en}</p>
              {k.trend !== undefined && k.trend !== null && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${k.trend >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {k.trend >= 0 ? '+' : ''}{k.trend}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Today's Queue ────────────────────────────────────────── */}
      <div className="animate-fade-in-up stagger-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[var(--text-1)]">
              {locale === 'ar' ? 'قائمة اليوم' : "Today's Queue"}
            </h2>
            {pendingCount > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 dot-pulse" />
                {pendingCount} {locale === 'ar' ? 'بانتظار التأكيد' : 'pending'}
              </span>
            )}
          </div>
          <Link href="/provider/appointments" locale={locale}
            className="text-sm font-semibold text-[var(--text-2)] flex items-center gap-1 hover:text-[var(--text-1)] transition">
            {locale === 'ar' ? 'عرض الكل' : 'View all'}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>

        {todaysAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-[var(--border)] py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-1)]">
              <Calendar className="h-8 w-8 text-[var(--text-3)]" />
            </div>
            <p className="text-base font-bold text-[var(--text-1)]">
              {locale === 'ar' ? 'لا توجد مواعيد اليوم' : 'No appointments today'}
            </p>
            <p className="mt-1 text-sm text-[var(--text-3)]">
              {locale === 'ar' ? 'استمتع بوقتك! 🎉' : 'Enjoy your day! 🎉'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {todaysAppointments.map(appointment => {
              const dateObj = new Date(appointment.slot_datetime);
              const timeStr = new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(dateObj);
              const isNow = dateObj > now && dateObj < new Date(now.getTime() + 60 * 60 * 1000); // within 1hr
              const isConfirmed = appointment.status === 'confirmed';
              const isCancelled = appointment.status === 'cancelled';

              return (
                <article
                  key={appointment._id}
                  className={`relative flex items-center gap-4 overflow-hidden rounded-2xl border p-4 transition card-lift ${
                    isNow
                      ? 'border-[var(--text-1)]/20 bg-[var(--text-1)] text-white shadow-float'
                      : 'border-[var(--border)] bg-white shadow-sm'
                  }`}
                >
                  {/* Time block */}
                  <div className={`flex min-w-[64px] flex-col items-center justify-center rounded-xl px-2 py-2 text-center ${
                    isNow ? 'bg-white/10' : 'bg-[var(--surface-0)]'
                  }`}>
                    <span className={`text-base font-black ${isNow ? 'text-white' : 'text-[var(--text-1)]'}`}>
                      {timeStr.split(' ')[0]}
                    </span>
                    {timeStr.split(' ')[1] && (
                      <span className={`text-[9px] font-bold uppercase ${isNow ? 'text-white/60' : 'text-[var(--text-3)]'}`}>
                        {timeStr.split(' ')[1]}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-bold truncate ${isNow ? 'text-white' : 'text-[var(--text-1)]'}`}>
                      {appointment.patient_name || (locale === 'ar' ? 'حجز إلكتروني' : 'Online Booking')}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                        isNow ? 'bg-white/20 text-white' :
                        isConfirmed ? 'bg-emerald-100 text-emerald-700' :
                        isCancelled ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          isNow ? 'bg-white animate-pulse' :
                          isConfirmed ? 'bg-emerald-500 animate-pulse' :
                          isCancelled ? 'bg-rose-500' : 'bg-amber-500'
                        }`} />
                        {appointment.status}
                      </span>
                      {appointment.notes && (
                        <span className={`flex items-center gap-1 text-[11px] ${isNow ? 'text-white/60' : 'text-[var(--text-3)]'}`}>
                          <FileText className="h-3 w-3" />
                          Note
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {appointment.status === 'pending' && (
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        onClick={() => void handleStatusChange(appointment._id, 'confirmed')}
                        className={`flex h-9 w-9 items-center justify-center rounded-full transition ${isNow ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white'}`}
                        title="Confirm"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => void handleStatusChange(appointment._id, 'cancelled')}
                        className={`flex h-9 w-9 items-center justify-center rounded-full transition ${isNow ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white'}`}
                        title="Cancel"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Activity Feed ────────────────────────────────────────── */}
      {recentFeed.length > 0 && (
        <div className="animate-fade-in-up stagger-5">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-[var(--text-3)]" />
            <h2 className="text-base font-bold text-[var(--text-1)]">
              {locale === 'ar' ? 'آخر النشاطات' : 'Recent Activity'}
            </h2>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white shadow-sm overflow-hidden">
            {recentFeed.map((appt, i) => {
              const dateObj = new Date(appt.slot_datetime);
              const label = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(dateObj);
              return (
                <div
                  key={appt._id}
                  className={`flex items-center gap-3 px-5 py-3.5 ${i < recentFeed.length - 1 ? 'border-b border-[var(--border)]' : ''}`}
                >
                  <div className={`h-2 w-2 shrink-0 rounded-full ${
                    appt.status === 'confirmed' ? 'bg-emerald-500' :
                    appt.status === 'cancelled' ? 'bg-rose-500' :
                    appt.status === 'completed' ? 'bg-blue-500' :
                    'bg-amber-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--text-1)]">
                      {appt.patient_name || (locale === 'ar' ? 'حجز إلكتروني' : 'Online Booking')}
                    </p>
                    <p className="text-xs text-[var(--text-3)]">{label}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    appt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                    appt.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                    appt.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {appt.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <WalkInModal
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        onSuccess={() => { setIsWalkInModalOpen(false); loadAppointments(); }}
      />
      <VenueQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />

      {/* ── Data Portability Badge (Doctor only) ─────────────── */}
      {user?.provider_type === 'doctor' && (
        <div className="animate-fade-in-up stagger-6 mt-4 flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-white px-5 py-4 shadow-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/10">
            <ShieldCheck className="h-4 w-4 text-brand" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[var(--text-1)]">
              {locale === 'ar' ? '🔒 بياناتك ملكك' : '🔒 Your Data is Yours'}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-3)]">
              {locale === 'ar'
                ? 'بياناتك وملفات مرضاك ملكك الخاص. يمكنك في أي وقت طلب تصدير كامل لبياناتك عبر التواصل مع فريق خلاص. نحن لا نحجز بياناتك لحسابنا.'
                : 'Your patient history and records belong to you. You can request a full data export at any time by contacting the Khalas team. We will never hold your data hostage.'}
            </p>
          </div>
        </div>
      )}
      </div>
    </SiteShell>
  );
}
