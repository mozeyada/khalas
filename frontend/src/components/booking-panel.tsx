'use client';

import {useEffect, useMemo, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter, useSearchParams, usePathname} from 'next/navigation';
import {
  MapPin, Clock, Sparkles, UserCircle2, ArrowRight,
  Loader2, CheckCircle2, ChevronDown, ChevronRight,
} from 'lucide-react';

import {useSession} from '@/components/session-provider';
import {ApiError, createAppointment, getStaffSlots} from '@/lib/api';
import {formatPrice} from '@/lib/format';
import {PublicService, PublicStaff, PublicVenue, Slot} from '@/lib/types';
import {SlotPicker} from '@/components/slot-picker';

/* ─── Mobile Step Indicator ────────────────────────────────────── */
function StepBadge({n, active, done}: {n: number; active: boolean; done: boolean}) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
        done
          ? 'bg-teal text-white'
          : active
            ? 'bg-teal/15 text-teal ring-2 ring-teal/40'
            : 'bg-black/8 text-ink/40'
      }`}
    >
      {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : n}
    </span>
  );
}

export function BookingPanel({
  locale,
  venue,
  staff,
  services,
}: {
  locale: string;
  venue: PublicVenue;
  staff: PublicStaff;
  services: PublicService[];
}) {
  const t = useTranslations('StaffPage');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {user} = useSession();
  const activeLocale = useLocale();

  // Initialize from searchParams if present to restore progress
  const initialServiceId = searchParams?.get('serviceId') || '';
  const initialSlot = searchParams?.get('slot') || '';

  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialServiceId);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>(initialSlot);
  const [notes, setNotes] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Mobile stepper: which step is expanded */
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(initialSlot ? 3 : initialServiceId ? 2 : 1);

  useEffect(() => {
    // Auto-select if there is exactly 1 service and nothing is selected
    if (!selectedServiceId && services.length === 1) {
      setSelectedServiceId(services[0]._id);
      setMobileStep(2);
    }
  }, [services, selectedServiceId]);

  useEffect(() => {
    if (selectedServiceId) {
      void loadSlots(selectedServiceId);
    }
  }, [selectedServiceId, staff._id]);

  const selectedService = useMemo(
    () => services.find((s) => s._id === selectedServiceId) ?? null,
    [selectedServiceId, services],
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

  function handleSelectService(id: string) {
    setSelectedServiceId(id);
    setSelectedSlot('');
    // Auto-advance to step 2 on mobile after a brief delay (feels intentional)
    setTimeout(() => setMobileStep(2), 200);
  }

  function handleSelectSlot(slot: string) {
    setSelectedSlot(slot);
    setTimeout(() => setMobileStep(3), 200);
  }

  async function handleBook() {
    if (!selectedServiceId || !selectedSlot) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const appointment = await createAppointment({
        service_id: selectedServiceId,
        slot_datetime: selectedSlot,
        notes: notes || undefined,
      });
      setIsSuccess(true);
      const params = new URLSearchParams({
        appointmentId: appointment._id,
        venue: locale === 'ar' ? venue.name_ar : venue.name_en,
        staff: locale === 'ar' ? staff.name_ar : staff.name_en,
        service: locale === 'ar' ? selectedService?.name_ar ?? '' : selectedService?.name_en ?? '',
        slot: appointment.slot_datetime,
      });
      setTimeout(() => {
        router.push(`/${locale}/book/confirm?${params.toString()}`);
      }, 800);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('genericError'));
      setIsSubmitting(false);
    }
  }

  /* ─── Shared: service cards ─────────────────────────────────── */
  const ServiceList = () => (
    <div className="grid gap-3">
      {services.map((service) => {
        const isSelected = service._id === selectedServiceId;
        return (
          <button
            key={service._id}
            type="button"
            onClick={() => handleSelectService(service._id)}
            className={`group relative overflow-hidden rounded-md border p-4 text-start transition-all duration-300 sm:p-5 ${
              isSelected
                ? 'border-ink bg-zinc-50 shadow-sm scale-[1.01]'
                : 'border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300'
            }`}
          >
            {isSelected && <div className="absolute left-0 top-0 h-full w-1 rounded-l-md bg-brand" />}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className={`font-semibold transition-colors ${isSelected ? 'text-ink' : 'text-zinc-700'}`}>
                  {locale === 'ar' ? service.name_ar : service.name_en}
                </p>
                <p className="mt-1 line-clamp-1 text-sm text-ink/60">
                  {locale === 'ar'
                    ? service.description_ar ?? t('emptyDescription')
                    : service.description_en ?? t('emptyDescription')}
                </p>
              </div>
              <div className="shrink-0 text-end">
                <p className={`font-bold ${isSelected ? 'text-ink' : 'text-zinc-700'}`}>
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
  );

  /* ─── Shared: booking action button ─────────────────────────── */
  const BookButton = ({dark = false}: {dark?: boolean}) => {
    const base = 'group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-md px-6 py-4 text-sm font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed';

    if (user?.role !== 'patient') {
      return (
        <button
          type="button"
          onClick={() => {
            const redirectUrl = encodeURIComponent(`${pathname}?serviceId=${selectedServiceId}&slot=${selectedSlot}`);
            router.push(`/${locale}/auth/login?redirect=${redirectUrl}`);
          }}
          className={`${base} bg-zinc-100 text-ink hover:bg-zinc-200 border border-zinc-200`}
        >
          {t('loginToBook')}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={handleBook}
        disabled={isSubmitting || isSuccess}
        className={`${base} ${
          isSuccess
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            : dark
              ? 'bg-white text-ink hover:bg-zinc-100'
              : 'bg-brand text-white hover:bg-brand-hover'
        }`}
      >
        {isSubmitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isSuccess ? (
          <>
            <CheckCircle2 className="h-5 w-5" />
            {t('bookingConfirmed')}
          </>
        ) : (
          <>
            {t('confirmBooking')}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>
    );
  };

  /* ─── Desktop: classic two-column layout (lg+) ──────────────── */
  const DesktopLayout = () => (
    <div className="hidden lg:grid lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-6">
      {/* Left: context + services */}
      <section className="relative overflow-hidden rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="relative z-10">
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
            <Sparkles className="h-4 w-4" />
            {t('overviewEyebrow')}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-zinc-50 border border-zinc-100 text-ink">
              <UserCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-ink">{locale === 'ar' ? staff.name_ar : staff.name_en}</h2>
              <p className="text-sm text-ink/60">
                {locale === 'ar' ? staff.bio_ar ?? t('emptyBio') : staff.bio_en ?? t('emptyBio')}
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3 rounded-md border border-zinc-200 bg-[#FAFAFA] p-4">
            <div className="rounded-sm bg-white border border-zinc-200 p-2 text-ink shadow-sm">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{locale === 'ar' ? venue.name_ar : venue.name_en}</p>
              <p className="text-xs text-ink/70">
                {locale === 'ar' ? venue.governorate : venue.area} ·{' '}
                {locale === 'ar' ? venue.address_ar : venue.address_en}
              </p>
            </div>
          </div>

          <div className="mt-10 space-y-4">
            <h3 className="text-sm font-bold tracking-wide text-ink">{t('servicesTitle')}</h3>
            <ServiceList />
          </div>
        </div>
      </section>

      {/* Right: slot picker + confirm */}
      <div className="relative">
        {!selectedServiceId ? (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
            <div className="mb-4 rounded-md bg-white border border-zinc-200 p-4 text-zinc-400 shadow-sm">
              <Sparkles className="h-8 w-8" />
            </div>
            <p className="text-lg font-medium text-ink/60">{t('selectServiceFirst')}</p>
          </div>
        ) : (
          <section className="animate-in fade-in slide-in-from-right-8 duration-500 rounded-lg border border-slate-800 bg-slate-950 p-8 text-slate-50 shadow-md">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">{t('bookingEyebrow')}</p>
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
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[90px] w-full rounded-md border border-white/10 bg-white/5 px-5 py-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-white focus:bg-white/10"
                      placeholder={t('notesPlaceholder')}
                    />
                  </div>
                  <div className="rounded-md bg-white/5 border border-white/10 p-4">
                    <p className="text-sm text-slate-300">{t('cashNote')}</p>
                  </div>
                  {error && (
                    <div className="animate-in zoom-in-95 rounded-md border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
                      {error}
                    </div>
                  )}
                  <BookButton dark />
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );

  /* ─── Mobile: 3-step stepper (< lg) ─────────────────────────── */
  const MobileLayout = () => (
    <div className="lg:hidden space-y-3">

      {/* Doctor + Venue summary strip */}
      <div className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-zinc-50 border border-zinc-100 text-ink">
          <UserCircle2 className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{locale === 'ar' ? staff.name_ar : staff.name_en}</p>
          <p className="truncate text-xs text-zinc-500">
            {locale === 'ar' ? venue.name_ar : venue.name_en} ·{' '}
            {locale === 'ar' ? venue.governorate : venue.area}
          </p>
        </div>
      </div>

      {/* STEP 1: Choose service */}
      <div className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setMobileStep(1)}
          className="flex w-full items-center gap-3 px-5 py-4 text-start"
        >
          <StepBadge n={1} active={mobileStep === 1} done={!!selectedServiceId} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${mobileStep === 1 ? 'text-ink' : 'text-ink/60'}`}>
              {locale === 'ar' ? 'اختر الخدمة' : 'Choose a service'}
            </p>
            {selectedService && mobileStep !== 1 && (
              <p className="truncate text-xs text-teal font-medium mt-0.5">
                {locale === 'ar' ? selectedService.name_ar : selectedService.name_en}
                {' · '}{formatPrice(selectedService.price, activeLocale)}
              </p>
            )}
          </div>
          {mobileStep === 1 ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-ink/40" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-ink/20" />
          )}
        </button>

        {mobileStep === 1 && (
          <div className="animate-in slide-in-from-top-2 fade-in duration-300 border-t border-[var(--border)] px-4 pb-5 pt-4">
            <ServiceList />
          </div>
        )}
      </div>

      {/* STEP 2: Choose slot */}
      <div className={`overflow-hidden rounded-md border shadow-sm transition-all duration-300 ${
        selectedServiceId
          ? 'border-slate-800 bg-slate-950'
          : 'border-zinc-200 bg-zinc-50 opacity-50 pointer-events-none'
      }`}>
        <button
          type="button"
          onClick={() => selectedServiceId && setMobileStep(2)}
          className="flex w-full items-center gap-3 px-5 py-4 text-start"
        >
          <StepBadge n={2} active={mobileStep === 2} done={!!selectedSlot} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${mobileStep === 2 ? 'text-slate-100' : 'text-slate-400'}`}>
              {locale === 'ar' ? 'اختر الموعد' : 'Pick a time slot'}
            </p>
            {selectedSlot && mobileStep !== 2 && (
              <p className="text-xs text-emerald-400 font-medium mt-0.5">
                {new Intl.DateTimeFormat(activeLocale, {
                  weekday: 'short', day: 'numeric', month: 'short',
                  hour: 'numeric', minute: '2-digit',
                }).format(new Date(selectedSlot))}
              </p>
            )}
          </div>
          {mobileStep === 2 ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-700" />
          )}
        </button>

        {mobileStep === 2 && (
          <div className="animate-in slide-in-from-top-2 fade-in duration-300 border-t border-white/10 px-4 pb-6 pt-4">
            <SlotPicker
              slots={slots}
              isLoading={isLoadingSlots}
              selectedSlot={selectedSlot}
              onSelectSlot={handleSelectSlot}
              locale={activeLocale}
            />
          </div>
        )}
      </div>

      {/* STEP 3: Confirm */}
      <div className={`overflow-hidden rounded-md border shadow-sm transition-all duration-300 ${
        selectedSlot
          ? 'border-slate-800 bg-slate-950'
          : 'border-zinc-200 bg-zinc-50 opacity-50 pointer-events-none'
      }`}>
        <button
          type="button"
          onClick={() => selectedSlot && setMobileStep(3)}
          className="flex w-full items-center gap-3 px-5 py-4 text-start"
        >
          <StepBadge n={3} active={mobileStep === 3} done={isSuccess} />
          <p className={`flex-1 text-sm font-bold ${mobileStep === 3 ? 'text-slate-100' : 'text-slate-400'}`}>
            {locale === 'ar' ? 'تأكيد الحجز' : 'Confirm booking'}
          </p>
          {mobileStep === 3 ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-700" />
          )}
        </button>

        {mobileStep === 3 && (
          <div className="animate-in slide-in-from-top-2 fade-in duration-300 border-t border-white/10 px-4 pb-6 pt-4 space-y-4">
            {/* Booking summary */}
            <div className="space-y-2 rounded-md bg-white/5 border border-white/10 p-4 text-sm text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">{locale === 'ar' ? 'الخدمة' : 'Service'}</span>
                <span className="font-medium text-slate-100">
                  {locale === 'ar' ? selectedService?.name_ar : selectedService?.name_en}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{locale === 'ar' ? 'الموعد' : 'Time'}</span>
                <span className="font-medium text-slate-100">
                  {selectedSlot
                    ? new Intl.DateTimeFormat(activeLocale, {
                        weekday: 'short', day: 'numeric', month: 'short',
                        hour: 'numeric', minute: '2-digit',
                      }).format(new Date(selectedSlot))
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2">
                <span className="text-slate-500">{locale === 'ar' ? 'السعر' : 'Price'}</span>
                <span className="font-bold text-emerald-300">
                  {selectedService ? formatPrice(selectedService.price, activeLocale) : '-'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">{t('notesLabel')}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all focus:border-white focus:bg-white/10"
                placeholder={t('notesPlaceholder')}
              />
            </div>

            <div className="rounded-md bg-white/5 border border-white/10 px-4 py-3">
              <p className="text-xs text-slate-300">{t('cashNote')}</p>
            </div>

            {error && (
              <div className="rounded-md border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {error}
              </div>
            )}

            <BookButton dark />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <MobileLayout />
      <DesktopLayout />
    </>
  );
}
