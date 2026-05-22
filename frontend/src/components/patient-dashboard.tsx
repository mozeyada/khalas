'use client';

import {useEffect, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {Calendar, Clock, CreditCard, CalendarX, ArrowRight} from 'lucide-react';

import {useSession} from '@/components/session-provider';
import {ApiError, cancelAppointment, getMyAppointments} from '@/lib/api';
import {formatDateTime, formatPrice} from '@/lib/format';
import {Appointment} from '@/lib/types';

export function PatientDashboard() {
  const t = useTranslations('DashboardPage');
  const locale = useLocale();
  const router = useRouter();
  const {isAuthenticated, isReady, user} = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isAuthenticated || user?.role !== 'patient') {
      router.push(`/${locale}/auth/login`);
      return;
    }

    void getMyAppointments()
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
  }, [isAuthenticated, isReady, locale, router, t, user?.role]);

  async function handleCancel(appointmentId: string) {
    try {
      const updated = await cancelAppointment(appointmentId, t('cancelReasonDefault'));
      setAppointments((current) => current.filter((item) => item._id !== updated._id));
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
      {error ? (
        <div className="animate-in fade-in slide-in-from-top-4 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 backdrop-blur">
          {error}
        </div>
      ) : null}

      {appointments.length === 0 ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col items-center justify-center rounded-[2.5rem] border border-[var(--border)] bg-[var(--card)] py-16 px-6 text-center shadow-soft backdrop-blur-xl">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-teal/5">
            <CalendarX className="h-10 w-10 text-teal/40" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-ink">No Appointments</h3>
          <p className="mb-8 max-w-sm text-sm text-ink/60 leading-relaxed">
            {t('empty')}
          </p>
          <button
            onClick={() => router.push(`/${locale}/search`)}
            className="group flex items-center gap-2 rounded-full bg-teal px-6 py-3 text-sm font-medium text-white transition-all hover:bg-teal/90 hover:shadow-[0_0_20px_rgba(15,118,110,0.4)] hover:-translate-y-0.5"
          >
            Book Now
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment, index) => {
            const dateObj = new Date(appointment.slot_datetime);
            const dateStr = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(dateObj);
            const timeStr = new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(dateObj);

            return (
              <article
                key={appointment._id}
                className="group animate-in fade-in slide-in-from-bottom-4 duration-700 relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-soft backdrop-blur-md transition-all hover:-translate-y-1 hover:border-[var(--border-hover)] hover:shadow-xl"
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
              >
                {/* Subtle gradient glow behind the card content */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                
                <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-teal">
                      <div className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
                      {appointment.status}
                    </span>
                    
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
                      <div className="flex items-center gap-2 text-ink">
                        <Calendar className="h-5 w-5 text-teal/70" />
                        <h2 className="text-lg font-medium">{dateStr}</h2>
                      </div>
                      <div className="flex items-center gap-2 text-ink/70">
                        <Clock className="h-4 w-4 text-teal/50" />
                        <span className="text-sm">{timeStr}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-ink/60">
                      <CreditCard className="h-4 w-4" />
                      {t('priceLine', {price: formatPrice(appointment.price_at_booking, locale)})}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleCancel(appointment._id)}
                    className="relative overflow-hidden rounded-full border border-rose-200 bg-white/50 px-5 py-2.5 text-sm font-medium text-rose-600 shadow-sm backdrop-blur transition-all hover:bg-rose-500 hover:text-white hover:border-transparent hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:-translate-y-0.5"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
