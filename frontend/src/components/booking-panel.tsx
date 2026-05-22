'use client';

import {useEffect, useMemo, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {MapPin, Clock, Sparkles, UserCircle2, ArrowRight, Loader2, CheckCircle2} from 'lucide-react';

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

  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      setIsSuccess(true);
      
      const params = new URLSearchParams({
        appointmentId: appointment._id,
        venue: locale === 'ar' ? venue.name_ar : venue.name_en,
        staff: locale === 'ar' ? staff.name_ar : staff.name_en,
        service: locale === 'ar' ? selectedService?.name_ar ?? '' : selectedService?.name_en ?? '',
        slot: appointment.slot_datetime
      });
      
      // Delay routing slightly to show the success state morphing
      setTimeout(() => {
        router.push(`/${locale}/book/confirm?${params.toString()}`);
      }, 800);
      
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('genericError'));
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] items-start">
      {/* Left Column: Context & Service Selection (Liquid Glass) */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-soft backdrop-blur-xl sm:p-8">
        {/* Subtle decorative background gradient */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal/5 blur-3xl" />
        
        <div className="relative z-10">
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal">
            <Sparkles className="h-4 w-4" />
            {t('overviewEyebrow')}
          </p>
          
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal/20 to-teal/5 text-teal">
              <UserCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-ink">{locale === 'ar' ? staff.name_ar : staff.name_en}</h2>
              <p className="text-sm text-ink/60">
                {locale === 'ar' ? staff.bio_ar ?? t('emptyBio') : staff.bio_en ?? t('emptyBio')}
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/40 p-4 backdrop-blur-sm">
            <div className="rounded-xl bg-teal/10 p-2 text-teal">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{locale === 'ar' ? venue.name_ar : venue.name_en}</p>
              <p className="text-xs text-ink/70">
                {locale === 'ar' ? venue.governorate : venue.area} · {locale === 'ar' ? venue.address_ar : venue.address_en}
              </p>
            </div>
          </div>

          <div className="mt-10 space-y-4">
            <h3 className="text-sm font-bold tracking-wide text-ink">{t('servicesTitle')}</h3>
            <div className="grid gap-3">
              {services.map((service) => {
                const isSelected = service._id === selectedServiceId;
                return (
                  <button
                    key={service._id}
                    type="button"
                    onClick={() => setSelectedServiceId(service._id)}
                    className={`group relative overflow-hidden rounded-[1.5rem] border p-5 text-start transition-all duration-300 ${
                      isSelected 
                        ? 'border-teal bg-teal/5 shadow-[0_8px_30px_rgba(15,118,110,0.12)] scale-[1.02]' 
                        : 'border-[var(--border)] bg-white/50 hover:bg-white/80 hover:shadow-md'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 h-full w-1.5 bg-teal" />
                    )}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`font-semibold transition-colors ${isSelected ? 'text-teal' : 'text-ink'}`}>
                          {locale === 'ar' ? service.name_ar : service.name_en}
                        </p>
                        <p className="mt-1 text-sm text-ink/60 line-clamp-2">
                          {locale === 'ar' ? service.description_ar ?? t('emptyDescription') : service.description_en ?? t('emptyDescription')}
                        </p>
                      </div>
                      <div className="text-end shrink-0">
                        <p className={`font-bold ${isSelected ? 'text-teal' : 'text-ink'}`}>
                          {formatPrice(service.price, activeLocale)}
                        </p>
                        <p className="mt-1 flex items-center justify-end gap-1 text-xs text-ink/50">
                          <Clock className="h-3 w-3" />
                          {service.duration_minutes}m
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Right Column: Predictive Booking Panel */}
      <div className="relative">
        {!selectedServiceId ? (
          <div className="animate-in fade-in duration-700 flex h-full min-h-[400px] flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-ink/10 bg-white/20 p-8 text-center backdrop-blur-sm">
            <div className="mb-4 rounded-full bg-teal/5 p-4 text-teal/40">
              <Sparkles className="h-8 w-8" />
            </div>
            <p className="text-lg font-medium text-ink/60">{t('selectServiceFirst')}</p>
          </div>
        ) : (
          <section className="animate-in fade-in slide-in-from-right-8 duration-700 rounded-[2.5rem] border border-slate-800/50 bg-slate-950 p-6 text-slate-50 shadow-2xl sm:p-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-400">{t('bookingEyebrow')}</p>
            <h3 className="text-2xl font-bold">{t('bookingTitle')}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{t('bookingBody')}</p>

            <div className="mt-8 space-y-8">
              <SlotPicker
                slots={slots}
                isLoading={isLoadingSlots}
                selectedSlot={selectedSlot}
                onSelectSlot={setSelectedSlot}
                locale={activeLocale}
              />

              {selectedSlot && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-5 border-t border-white/10 pt-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200">{t('notesLabel')}</label>
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      className="min-h-[100px] w-full rounded-[1.25rem] border border-white/10 bg-white/5 px-5 py-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-emerald-400 focus:bg-white/10 focus:ring-4 focus:ring-emerald-400/10"
                      placeholder={t('notesPlaceholder')}
                    />
                  </div>

                  <div className="rounded-[1.25rem] bg-emerald-400/10 p-4">
                    <p className="text-sm text-emerald-200/80">{t('cashNote')}</p>
                  </div>
                  
                  {error ? (
                    <div className="animate-in zoom-in-95 rounded-[1.25rem] bg-rose-500/10 p-4 text-sm text-rose-300 border border-rose-500/20">
                      {error}
                    </div>
                  ) : null}

                  {user?.role !== 'patient' ? (
                    <button
                      type="button"
                      onClick={() => router.push(`/${locale}/auth/login`)}
                      className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-[1.25rem] bg-amber-400 px-6 py-4 text-sm font-bold text-slate-950 transition-all hover:bg-amber-300 hover:shadow-[0_0_30px_rgba(251,191,36,0.3)] active:scale-[0.98]"
                    >
                      {t('loginToBook')}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleBook}
                      disabled={isSubmitting || isSuccess}
                      className={`group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-[1.25rem] px-6 py-4 text-sm font-bold text-slate-950 transition-all active:scale-[0.98] disabled:cursor-not-allowed ${
                        isSuccess 
                          ? 'bg-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.5)]' 
                          : 'bg-emerald-300 hover:bg-emerald-200 hover:shadow-[0_0_30px_rgba(110,231,183,0.3)]'
                      }`}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : isSuccess ? (
                        <>
                          <CheckCircle2 className="h-5 w-5" />
                          Confirmed
                        </>
                      ) : (
                        <>
                          {t('confirmBooking')}
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
