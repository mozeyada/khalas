'use client';

import {useEffect, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';

import {useSession} from '@/components/session-provider';
import {ApiError, getProviderAppointments, updateProviderAppointmentStatus} from '@/lib/api';
import {formatDateTime, formatPrice} from '@/lib/format';
import {Appointment} from '@/lib/types';

export function ProviderAppointments() {
  const t = useTranslations('ProviderAppointmentsPage');
  const locale = useLocale();
  const router = useRouter();
  const {accessToken, isAuthenticated, isReady, user} = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isAuthenticated || user?.role !== 'provider' || !accessToken) {
      router.push(`/${locale}/auth/login`);
      return;
    }

    void getProviderAppointments(accessToken)
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
  }, [accessToken, isAuthenticated, isReady, locale, router, t, user?.role]);

  async function handleStatusChange(appointmentId: string, status: 'confirmed' | 'cancelled') {
    if (!accessToken) {
      return;
    }

    try {
      const updated = await updateProviderAppointmentStatus(accessToken, appointmentId, {
        status,
        cancellation_reason: status === 'cancelled' ? t('providerCancelledReason') : undefined
      });
      setAppointments((current) => current.map((item) => (item._id === updated._id ? updated : item)));
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
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">{appointment.status}</p>
                <h2 className="mt-2 text-xl font-semibold text-ink">{formatDateTime(appointment.slot_datetime, locale)}</h2>
                <p className="mt-2 text-sm text-ink/70">
                  {t('priceLine', {price: formatPrice(appointment.price_at_booking, locale)})}
                </p>
                {appointment.notes ? <p className="mt-2 text-sm text-ink/70">{appointment.notes}</p> : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleStatusChange(appointment._id, 'confirmed')}
                  className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
                >
                  {t('confirm')}
                </button>
                <button
                  type="button"
                  onClick={() => void handleStatusChange(appointment._id, 'cancelled')}
                  className="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
