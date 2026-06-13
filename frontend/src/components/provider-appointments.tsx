'use client';

import {useEffect, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {Calendar, Clock, CreditCard, CalendarOff, CheckCircle2, XCircle, FileText} from 'lucide-react';

import {useSession} from '@/components/session-provider';
import {WalkInModal} from '@/components/walkin-modal';
import {ApiError, getProviderAppointments, updateProviderAppointmentStatus} from '@/lib/api';
import {formatPrice} from '@/lib/format';
import {Appointment} from '@/lib/types';

type FilterType = 'all' | 'today' | 'tomorrow' | 'week';

export function ProviderAppointments() {
  const t = useTranslations('ProviderAppointmentsPage');
  const locale = useLocale();
  const router = useRouter();
  const {isAuthenticated, isReady, user} = useSession();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);

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

  const filteredAppointments = appointments.filter((app) => {
    if (filter === 'all') return true;
    
    const appDate = new Date(app.slot_datetime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (filter === 'today') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return appDate >= today && appDate < tomorrow;
    }
    
    if (filter === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextDay = new Date(tomorrow);
      nextDay.setDate(nextDay.getDate() + 1);
      return appDate >= tomorrow && appDate < nextDay;
    }
    
    if (filter === 'week') {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return appDate >= today && appDate < nextWeek;
    }
    
    return true;
  }).sort((a, b) => new Date(a.slot_datetime).getTime() - new Date(b.slot_datetime).getTime());

  if (!isReady || isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-bold text-[var(--text-1)]">
          {locale === 'ar' ? 'إدارة المواعيد' : 'Manage Appointments'}
        </h2>
        <button
          onClick={() => setIsWalkInModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 active:scale-95"
        >
          <Calendar className="h-4 w-4" />
          {locale === 'ar' ? 'إضافة موعد مباشر' : 'New Walk-In'}
        </button>
      </div>

      {/* Date Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'all', label: locale === 'ar' ? 'الكل' : 'All' },
          { id: 'today', label: locale === 'ar' ? 'اليوم' : 'Today' },
          { id: 'tomorrow', label: locale === 'ar' ? 'غداً' : 'Tomorrow' },
          { id: 'week', label: locale === 'ar' ? 'هذا الأسبوع' : 'This Week' }
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as FilterType)}
            className={`shrink-0 rounded-sm px-4 py-2 text-sm font-semibold transition-all ${
              filter === f.id
                ? 'bg-ink text-white'
                : 'bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="animate-in fade-in slide-in-from-top-4 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 backdrop-blur">
          {error}
        </div>
      )}

      <WalkInModal 
        isOpen={isWalkInModalOpen} 
        onClose={() => setIsWalkInModalOpen(false)} 
        onSuccess={() => {
          setIsWalkInModalOpen(false);
          loadAppointments();
        }} 
      />

      {filteredAppointments.length === 0 ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col items-center justify-center rounded-lg border border-zinc-200 bg-white py-16 px-6 text-center shadow-sm">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-50 border border-zinc-100">
            <CalendarOff className="h-10 w-10 text-zinc-400" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-ink">
            {locale === 'ar' ? 'لا توجد مواعيد' : 'No Appointments'}
          </h3>
          <p className="max-w-sm text-sm text-zinc-500 leading-relaxed">
            {filter === 'all' 
              ? (locale === 'ar' ? 'لا توجد مواعيد محجوزة حتى الآن.' : 'You have no booked appointments yet.')
              : (locale === 'ar' ? 'لا توجد مواعيد في هذه الفترة.' : 'No appointments found for this period.')}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAppointments.map((appointment, index) => {
            const dateObj = new Date(appointment.slot_datetime);
            const dateStr = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(dateObj);
            const timeStr = new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(dateObj);
            
            const isConfirmed = appointment.status === 'confirmed';
            const isCancelled = appointment.status === 'cancelled';

            return (
              <article
                key={appointment._id}
                className="group animate-in fade-in slide-in-from-bottom-4 duration-700 relative overflow-hidden rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
              >
                
                <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-sm border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                      isConfirmed ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 
                      isCancelled ? 'bg-rose-50 border-rose-100 text-rose-700' : 
                      'bg-amber-50 border-amber-100 text-amber-700'
                    }`}>
                      <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                        isConfirmed ? 'bg-emerald-500' : 
                        isCancelled ? 'bg-rose-500' : 
                        'bg-amber-500'
                      }`} />
                      {appointment.status}
                    </span>
                    
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-ink mb-1">
                          {appointment.patient_name || (locale === 'ar' ? 'حجز إلكتروني' : 'Online Booking')}
                        </h2>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1.5 text-zinc-600 font-medium text-sm">
                            <Calendar className="h-4 w-4 text-zinc-400" />
                            <span>{dateStr}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-zinc-600 text-sm">
                            <Clock className="h-4 w-4 text-zinc-400" />
                            <span>{timeStr}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-3)]">
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="h-4 w-4" />
                        {formatPrice(appointment.price_at_booking, locale)}
                      </span>
                      {appointment.notes && (
                        <span className="flex items-center gap-1.5 rounded-md bg-black/5 px-2 py-0.5 text-black/70">
                          <FileText className="h-3.5 w-3.5" />
                          {appointment.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {appointment.status !== 'confirmed' && (
                      <button
                        type="button"
                        onClick={() => void handleStatusChange(appointment._id, 'confirmed')}
                        disabled={isCancelled}
                        className="group/btn relative flex items-center gap-2 overflow-hidden rounded-md border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {locale === 'ar' ? 'تأكيد' : 'Confirm'}
                      </button>
                    )}
                    
                    {appointment.status !== 'cancelled' && (
                      <button
                        type="button"
                        onClick={() => void handleStatusChange(appointment._id, 'cancelled')}
                        className="group/btn relative flex items-center gap-2 overflow-hidden rounded-md border border-rose-200 bg-rose-50 px-5 py-2 text-sm font-semibold text-rose-700 shadow-sm transition-all hover:bg-rose-100 active:scale-95"
                      >
                        <XCircle className="h-4 w-4" />
                        {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
