'use client';

import {useMemo, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';

import {useSession} from '@/components/session-provider';
import {ApiError, createAppointment, getStaffSlots} from '@/lib/api';
import {formatDateTime, formatPrice} from '@/lib/format';
import {PublicService, PublicStaff, PublicVenue, Slot} from '@/lib/types';

export function BookingPanel({
  locale,
  venue,
  staff,
  services
}: {
  locale: string;
  venue: PublicVenue;
  staff: PublicStaff;
  services: PublicService[];
}) {
  const t = useTranslations('StaffPage');
  const router = useRouter();
  const {accessToken, user} = useSession();
  const activeLocale = useLocale();

  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?._id ?? '');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedService = useMemo(
    () => services.find((service) => service._id === selectedServiceId) ?? null,
    [selectedServiceId, services]
  );

  async function loadSlots(serviceId: string) {
    setSelectedSlot('');
    setError(null);
    setIsLoadingSlots(true);

    try {
      const response = await getStaffSlots(staff._id, serviceId);
      setSlots(response.slots);
    } catch (caught) {
      setSlots([]);
      setError(caught instanceof ApiError ? caught.message : t('genericError'));
    } finally {
      setIsLoadingSlots(false);
    }
  }

  async function handleBook() {
    if (!selectedServiceId || !selectedSlot || !accessToken) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const appointment = await createAppointment(accessToken, {
        service_id: selectedServiceId,
        slot_datetime: selectedSlot,
        notes: notes || undefined
      });

      const params = new URLSearchParams({
        appointmentId: appointment._id,
        venue: locale === 'ar' ? venue.name_ar : venue.name_en,
        staff: locale === 'ar' ? staff.name_ar : staff.name_en,
        service: locale === 'ar' ? selectedService?.name_ar ?? '' : selectedService?.name_en ?? '',
        slot: appointment.slot_datetime
      });
      router.push(`/${locale}/book/confirm?${params.toString()}`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('genericError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="space-y-5 rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 shadow-soft backdrop-blur sm:p-8">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-teal">{t('overviewEyebrow')}</p>
          <h2 className="text-2xl font-semibold text-ink">{locale === 'ar' ? staff.name_ar : staff.name_en}</h2>
          <p className="mt-2 text-sm leading-6 text-ink/70">
            {locale === 'ar' ? staff.bio_ar ?? t('emptyBio') : staff.bio_en ?? t('emptyBio')}
          </p>
        </div>

        <div className="rounded-3xl border border-black/10 bg-white/75 p-4">
          <p className="text-sm font-medium text-ink">{t('clinicLabel')}</p>
          <p className="mt-1 text-sm text-ink/70">{locale === 'ar' ? venue.name_ar : venue.name_en}</p>
          <p className="mt-2 text-sm text-ink/70">
            {locale === 'ar' ? venue.governorate : venue.area} · {locale === 'ar' ? venue.address_ar : venue.address_en}
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-ink">{t('servicesTitle')}</h3>
          <div className="grid gap-3">
            {services.map((service) => {
              const isSelected = service._id === selectedServiceId;
              return (
                <button
                  key={service._id}
                  type="button"
                  onClick={() => {
                    setSelectedServiceId(service._id);
                    void loadSlots(service._id);
                  }}
                  className={`rounded-3xl border p-4 text-start transition ${
                    isSelected ? 'border-teal bg-teal/5' : 'border-black/10 bg-white/75 hover:bg-black/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-ink">{locale === 'ar' ? service.name_ar : service.name_en}</p>
                      <p className="mt-1 text-sm text-ink/65">
                        {locale === 'ar' ? service.description_ar ?? t('emptyDescription') : service.description_en ?? t('emptyDescription')}
                      </p>
                    </div>
                    <div className="text-end text-sm text-ink/75">
                      <p>{formatPrice(service.price, activeLocale)}</p>
                      <p className="mt-1">
                        {t('serviceMeta', {
                          duration: service.duration_minutes,
                          buffer: service.buffer_minutes
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-slate-950 p-6 text-slate-50 shadow-soft sm:p-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">{t('bookingEyebrow')}</p>
        <h3 className="text-2xl font-semibold">{t('bookingTitle')}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-300">{t('bookingBody')}</p>

        {!selectedServiceId ? (
          <p className="mt-6 rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">{t('selectServiceFirst')}</p>
        ) : null}

        {selectedServiceId ? (
          <div className="mt-6 space-y-4">
            <button
              type="button"
              onClick={() => void loadSlots(selectedServiceId)}
              className="rounded-full bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
            >
              {isLoadingSlots ? t('loadingSlots') : t('loadSlots')}
            </button>

            <div className="grid max-h-[25rem] gap-3 overflow-y-auto pr-1">
              {slots.map((slot) => (
                <button
                  key={slot.slot_datetime}
                  type="button"
                  onClick={() => setSelectedSlot(slot.slot_datetime)}
                  className={`rounded-2xl border px-4 py-3 text-start transition ${
                    selectedSlot === slot.slot_datetime
                      ? 'border-emerald-300 bg-emerald-300/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <p className="font-medium">{formatDateTime(slot.slot_datetime, activeLocale)}</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {t('slotMeta', {
                      duration: slot.duration_minutes,
                      buffer: slot.buffer_minutes
                    })}
                  </p>
                </button>
              ))}
              {!isLoadingSlots && slots.length === 0 ? (
                <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">{t('noSlots')}</p>
              ) : null}
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-white">{t('notesLabel')}</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300"
                placeholder={t('notesPlaceholder')}
              />
            </label>

            <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">{t('cashNote')}</p>
            {error ? <p className="rounded-2xl bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

            {user?.role !== 'patient' ? (
              <button
                type="button"
                onClick={() => router.push(`/${locale}/auth/login`)}
                className="w-full rounded-2xl bg-amber-400 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-amber-300"
              >
                {t('loginToBook')}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleBook}
                disabled={!selectedSlot || isSubmitting}
                className="w-full rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? t('bookingNow') : t('confirmBooking')}
              </button>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}
