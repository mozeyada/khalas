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

export function ProviderAppointments() {
  const t = useTranslations('ProviderAppointmentsPage');
  const locale = useLocale();
  const router = useRouter();
  const {isAuthenticated, isReady, user} = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);

  useEffect(() => {
    if (!isReady) {
      return;
    }

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
        cancellation_reason: status === 'cancelled' ? t('providerCancelledReason') : undefined
      });
      setAppointments((current) => current.map((item) => (item._id === updated._id ? updated : item)));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('genericError'));
    }
  }

  if (!isReady || isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-8 shadow-soft backdrop-blur-md">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-ink">Manage Appointments</h2>
        <button
          onClick={() => setIsWalkInModalOpen(true)}
          className="flex items-center gap-2 rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
        >
          <Calendar className="h-4 w-4" />
          New Walk-In
        </button>
      </div>

      {error ? (
        <div className="animate-in fade-in slide-in-from-top-4 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 backdrop-blur">
          {error}
        </div>
      ) : null}

      <WalkInModal 
        isOpen={isWalkInModalOpen} 
        onClose={() => setIsWalkInModalOpen(false)} 
        onSuccess={() => {
          setIsWalkInModalOpen(false);
          loadAppointments();
        }} 
      />

      {appointments.length === 0 ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col items-center justify-center rounded-[2.5rem] border border-[var(--border)] bg-[var(--card)] py-16 px-6 text-center shadow-soft backdrop-blur-xl">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-teal/5">
            <CalendarOff className="h-10 w-10 text-teal/40" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-ink">No Appointments</h3>
          <p className="max-w-sm text-sm text-ink/60 leading-relaxed">
            {t('empty')}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment, index) => {
            const dateObj = new Date(appointment.slot_datetime);
            const dateStr = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(dateObj);
            const timeStr = new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(dateObj);
            
            const isConfirmed = appointment.status === 'confirmed';
            const isCancelled = appointment.status === 'cancelled';

            return (
              <article
                key={appointment._id}
                className="group animate-in fade-in slide-in-from-bottom-4 duration-700 relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-soft backdrop-blur-md transition-all hover:-translate-y-1 hover:border-[var(--border-hover)] hover:shadow-xl"
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                
                <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest ${
                      isConfirmed ? 'bg-emerald-100/50 text-emerald-700' : 
                      isCancelled ? 'bg-rose-100/50 text-rose-700' : 
                      'bg-teal/10 text-teal'
                    }`}>
                      <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                        isConfirmed ? 'bg-emerald-500' : 
                        isCancelled ? 'bg-rose-500' : 
                        'bg-teal'
                      }`} />
                      {appointment.status}
                    </span>
                    
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
                      <div>
                        <h2 className="text-xl font-bold text-ink mb-1">
                          {appointment.patient_name || 'Online Booking'}
                        </h2>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-ink/80 font-medium">
                            <Calendar className="h-4 w-4 text-teal/70" />
                            <span>{dateStr}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-ink/70">
                            <Clock className="h-4 w-4 text-teal/50" />
                            <span className="text-sm">{timeStr}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-ink/60">
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="h-4 w-4" />
                        {t('priceLine', {price: formatPrice(appointment.price_at_booking, locale)})}
                      </span>
                      {appointment.notes && (
                        <span className="flex items-center gap-1.5 rounded-md bg-ink/5 px-2 py-0.5">
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
                        className="group/btn relative flex items-center gap-2 overflow-hidden rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-medium text-emerald-700 shadow-sm backdrop-blur transition-all hover:border-transparent hover:bg-emerald-500 hover:text-white hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle2 className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
                        {t('confirm')}
                      </button>
                    )}
                    
                    {appointment.status !== 'cancelled' && (
                      <button
                        type="button"
                        onClick={() => void handleStatusChange(appointment._id, 'cancelled')}
                        className="group/btn relative flex items-center gap-2 overflow-hidden rounded-full border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-medium text-rose-700 shadow-sm backdrop-blur transition-all hover:border-transparent hover:bg-rose-500 hover:text-white hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:-translate-y-0.5"
                      >
                        <XCircle className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
                        {t('cancel')}
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
