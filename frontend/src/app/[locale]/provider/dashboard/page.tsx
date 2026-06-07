'use client';

import {useEffect, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {Link} from '@/i18n/navigation';
import {Calendar, Clock, CheckCircle2, XCircle, FileText, ArrowRight, TrendingUp, Users, PlusCircle, Settings, QrCode} from 'lucide-react';

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
      .then((response) => {
        setAppointments(response);
        setError(null);
      })
      .catch((caught) => {
        setError(caught instanceof ApiError ? caught.message : t('genericError'));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  async function handleStatusChange(appointmentId: string, status: 'confirmed' | 'cancelled') {
    try {
      const updated = await updateProviderAppointmentStatus(appointmentId, {
        status,
        cancellation_reason: status === 'cancelled' ? 'Provider cancelled' : undefined
      });
      setAppointments((current) => current.map((item) => (item._id === updated._id ? updated : item)));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('genericError'));
    }
  }

  if (!isReady || isLoading) {
    return (
      <SiteShell title="Dashboard">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-teal/30 border-t-teal" />
          <p className="text-sm font-medium text-[var(--text-3)]">{t('loading')}</p>
        </div>
      </SiteShell>
    );
  }

  // Calculate stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday as start

  const todaysAppointments = appointments.filter(app => {
    const d = new Date(app.slot_datetime);
    return d >= today && d < tomorrow;
  }).sort((a, b) => new Date(a.slot_datetime).getTime() - new Date(b.slot_datetime).getTime());

  const thisWeekAppointments = appointments.filter(app => {
    const d = new Date(app.slot_datetime);
    return d >= startOfWeek;
  });

  const revenueThisWeek = thisWeekAppointments
    .filter(a => a.status === 'confirmed' || a.status === 'completed')
    .reduce((sum, a) => sum + a.price_at_booking, 0);

  return (
    <SiteShell title={locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}>
      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* ── Quick Actions ──────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-4 gap-2">
        <button
          onClick={() => setIsWalkInModalOpen(true)}
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-teal/10 py-3 text-teal transition hover:bg-teal/20"
        >
          <PlusCircle className="h-6 w-6" />
          <span className="text-xs font-semibold">{locale === 'ar' ? 'إضافة موعد' : 'Add Walk-in'}</span>
        </button>
        <button
          onClick={() => setIsQrModalOpen(true)}
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-[var(--text-1)] py-3 text-white transition hover:bg-black/80"
        >
          <QrCode className="h-6 w-6" />
          <span className="text-xs font-semibold">{locale === 'ar' ? 'رمز QR' : 'Print QR'}</span>
        </button>
        <Link
          href="/provider/appointments"
          locale={locale}
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-black/[0.03] py-3 text-[var(--text-2)] transition hover:bg-black/[0.06]"
        >
          <Calendar className="h-6 w-6 text-[var(--text-3)]" />
          <span className="text-xs font-semibold">{locale === 'ar' ? 'كل المواعيد' : 'All Appts'}</span>
        </Link>
        <Link
          href="/provider/settings"
          locale={locale}
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-black/[0.03] py-3 text-[var(--text-2)] transition hover:bg-black/[0.06]"
        >
          <Settings className="h-6 w-6 text-[var(--text-3)]" />
          <span className="text-xs font-semibold">{locale === 'ar' ? 'الإعدادات' : 'Settings'}</span>
        </Link>
      </div>

      {/* ── Stats Strip ────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Users className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold text-[var(--text-1)]">{todaysAppointments.length}</p>
          <p className="text-xs font-medium text-[var(--text-3)]">{locale === 'ar' ? 'مواعيد اليوم' : 'Today\'s Appts'}</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <TrendingUp className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold text-[var(--text-1)]">
            {formatPrice(revenueThisWeek, locale)}
          </p>
          <p className="text-xs font-medium text-[var(--text-3)]">{locale === 'ar' ? 'إيرادات الأسبوع' : 'Week Revenue'}</p>
        </div>
        <div className="hidden sm:block rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-purple-600">
            <Calendar className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold text-[var(--text-1)]">{thisWeekAppointments.length}</p>
          <p className="text-xs font-medium text-[var(--text-3)]">{locale === 'ar' ? 'مواعيد الأسبوع' : 'Week Appts'}</p>
        </div>
      </div>

      {/* ── Today's Queue ──────────────────────────────────────── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text-1)]">{locale === 'ar' ? 'قائمة اليوم' : 'Today\'s Queue'}</h2>
          <Link
            href="/provider/appointments"
            locale={locale}
            className="text-sm font-semibold text-teal flex items-center gap-1"
          >
            {locale === 'ar' ? 'عرض الكل' : 'View all'}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>

        {todaysAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[2rem] border border-black/[0.06] bg-white py-12 text-center shadow-sm">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-black/[0.03]">
              <Calendar className="h-8 w-8 text-black/20" />
            </div>
            <p className="text-base font-semibold text-[var(--text-1)]">{locale === 'ar' ? 'لا توجد مواعيد اليوم' : 'No appointments today'}</p>
            <p className="mt-1 text-sm text-[var(--text-3)]">{locale === 'ar' ? 'استمتع بوقتك!' : 'Enjoy your day!'}</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {todaysAppointments.map((appointment) => {
              const dateObj = new Date(appointment.slot_datetime);
              const timeStr = new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(dateObj);
              const isConfirmed = appointment.status === 'confirmed';
              const isCancelled = appointment.status === 'cancelled';

              return (
                <article
                  key={appointment._id}
                  className="relative flex items-center justify-between gap-4 overflow-hidden rounded-[1.5rem] border border-black/[0.06] bg-white p-4 shadow-sm transition hover:border-black/10"
                >
                  <div className="flex items-center gap-4">
                    {/* Time block */}
                    <div className="flex flex-col items-center justify-center rounded-xl bg-[var(--surface-0)] px-3 py-2 text-center min-w-[70px]">
                      <span className="text-sm font-bold text-[var(--text-1)]">{timeStr.split(' ')[0]}</span>
                      <span className="text-[10px] font-semibold uppercase text-[var(--text-3)]">{timeStr.split(' ')[1]}</span>
                    </div>

                    {/* Info */}
                    <div>
                      <h3 className="text-base font-bold text-[var(--text-1)]">
                        {appointment.patient_name || (locale === 'ar' ? 'حجز إلكتروني' : 'Online Booking')}
                      </h3>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                          isConfirmed ? 'bg-emerald-100/50 text-emerald-700' : 
                          isCancelled ? 'bg-rose-100/50 text-rose-700' : 
                          'bg-amber-100/50 text-amber-700'
                        }`}>
                          {appointment.status}
                        </span>
                        {appointment.notes && (
                          <span className="flex items-center gap-1 text-[11px] text-[var(--text-3)]">
                            <FileText className="h-3 w-3" />
                            Note
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
                    {appointment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => void handleStatusChange(appointment._id, 'confirmed')}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition hover:bg-emerald-500 hover:text-white"
                          title="Confirm"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => void handleStatusChange(appointment._id, 'cancelled')}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-600 transition hover:bg-rose-500 hover:text-white"
                          title="Cancel"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <WalkInModal 
        isOpen={isWalkInModalOpen} 
        onClose={() => setIsWalkInModalOpen(false)} 
        onSuccess={() => {
          setIsWalkInModalOpen(false);
          loadAppointments();
        }} 
      />
      <VenueQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />
    </SiteShell>
  );
}
