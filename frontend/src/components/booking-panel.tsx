'use client';

import {useEffect, useMemo, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';

import {useSession} from '@/components/session-provider';
import {ApiError, createAppointment, getStaffSlots} from '@/lib/api';
import {formatPrice} from '@/lib/format';
import {PublicService, PublicStaff, PublicVenue, Slot} from '@/lib/types';
import {SlotPicker} from '@/components/slot-picker';

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
  const {user} = useSession();
  const activeLocale = useLocale();

  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?._id ?? '');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-load slots when a service is selected
  useEffect(() => {
    if (selectedServiceId) {
      void loadSlots(selectedServiceId);
    }
  }, [selectedServiceId, staff._id]);

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
    if (!selectedServiceId || !selectedSlot) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const appointment = await createAppointment({
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
                    // auto-loading handled by useEffect
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
          <div className="mt-6 space-y-8">
            
            <SlotPicker
              slots={slots}
              isLoading={isLoadingSlots}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
              locale={activeLocale}
            />

            {selectedSlot && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-4 pt-4 border-t border-white/10">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-white">{t('notesLabel')}</span>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className="min-h-24 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300"
                    placeholder={t('notesPlaceholder')}
                  />
                </label>

                <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">{t('cashNote')}</p>
                {error ? <p className="rounded-2xl bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

                {user?.role !== 'patient' ? (
                  <button
                    type="button"
                    onClick={() => router.push(`/${locale}/auth/login`)}
                    className="w-full rounded-2xl bg-amber-400 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.3)]"
                  >
                    {t('loginToBook')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleBook}
                    disabled={isSubmitting}
                    className="w-full rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 shadow-[0_0_20px_rgba(110,231,183,0.3)]"
                  >
                    {isSubmitting ? t('bookingNow') : t('confirmBooking')}
                  </button>
                )}
              </div>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}
