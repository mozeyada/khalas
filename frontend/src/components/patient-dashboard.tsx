'use client';

import {useEffect, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';

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
    return <p className="rounded-3xl bg-white/70 px-4 py-5 text-sm text-ink/70 shadow-soft">{t('loading')}</p>;
  }

  return (
    <div className="space-y-4">
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {appointments.length === 0 ? (
        <div className="rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 text-sm text-ink/70 shadow-soft">
          {t('empty')}
        </div>
      ) : (
        appointments.map((appointment) => (
          <article
            key={appointment._id}
            className="rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 shadow-soft backdrop-blur"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">{appointment.status}</p>
                <h2 className="mt-2 text-xl font-semibold text-ink">{formatDateTime(appointment.slot_datetime, locale)}</h2>
                <p className="mt-2 text-sm text-ink/70">
                  {t('priceLine', {price: formatPrice(appointment.price_at_booking, locale)})}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void handleCancel(appointment._id)}
                className="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
              >
                {t('cancel')}
              </button>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
