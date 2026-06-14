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
  }

  function handleSelectSlot(slot: string) {
    setSelectedSlot(slot);
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

  /* ─── Shared: booking action button ─────────────────────────── */
  const BookButton = () => {
    const base = 'group relative flex w-full items-center justify-center gap-2 overflow-hidden px-6 py-4 font-bold text-lg transition-all active:scale-[0.98] disabled:cursor-not-allowed';

    if (user?.role !== 'patient') {
      return (
        <button
          type="button"
          onClick={() => {
            const redirectUrl = encodeURIComponent(`${pathname}?serviceId=${selectedServiceId}&slot=${selectedSlot}`);
            router.push(`/${locale}/auth/login?redirect=${redirectUrl}`);
          }}
          className={`${base} rounded-2xl lg:rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 shadow-lg lg:shadow-none`}
        >
          {t('loginToBook')}
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={handleBook}
        disabled={isSubmitting || isSuccess}
        className={`${base} rounded-2xl lg:rounded-xl shadow-lg lg:shadow-none ${
          isSuccess
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isSubmitting ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : isSuccess ? (
          <>
            <CheckCircle2 className="h-6 w-6" />
            {t('bookingConfirmed')}
          </>
        ) : (
          <>
            {locale === 'ar' ? 'تأكيد الحجز' : 'Confirm Booking'}
          </>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8 items-start max-w-7xl mx-auto w-full">
      {/* Column 1: Doctor Profile & Services (Desktop: col-span-4 or 5) */}
      <div className="w-full lg:col-span-5 flex flex-col gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 text-blue-600">
              <UserCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{locale === 'ar' ? staff.name_ar : staff.name_en}</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">
                {locale === 'ar' ? staff.specialty_ar ?? t('emptySpecialty') : staff.specialty_en ?? t('emptySpecialty')}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50 flex items-start gap-2">
            <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-slate-700">{locale === 'ar' ? venue.name_ar : venue.name_en}</p>
              <p className="text-sm text-slate-500 mt-0.5">
                {locale === 'ar' ? venue.governorate : venue.area} ·{' '}
                {locale === 'ar' ? venue.address_ar : venue.address_en}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold tracking-wide text-slate-800 mb-4">{t('servicesTitle')}</h3>
          <div className="grid gap-3">
            {services.map((service) => {
              const isSelected = service._id === selectedServiceId;
              return (
                <button
                  key={service._id}
                  type="button"
                  onClick={() => handleSelectService(service._id)}
                  className={`group relative text-start transition-all w-full ${
                    isSelected
                      ? 'border-2 border-blue-600 bg-blue-50/50 rounded-2xl p-4 scale-[1.01]'
                      : 'border-2 border-transparent bg-white hover:bg-slate-50 rounded-2xl p-4'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className={`font-bold transition-colors ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                        {locale === 'ar' ? service.name_ar : service.name_en}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {locale === 'ar'
                          ? service.description_ar ?? t('emptyDescription')
                          : service.description_en ?? t('emptyDescription')}
                      </p>
                    </div>
                    <div className="shrink-0 text-end">
                      <p className={`font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                        {formatPrice(service.price, activeLocale)}
                      </p>
                      <p className="mt-1 flex items-center justify-end gap-1 text-xs text-slate-500">
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

      {/* Column 2: The Booking Interface (Desktop: col-span-7) */}
      <div className="w-full lg:col-span-7">
        <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100 mb-24 lg:mb-0">
          {!selectedServiceId ? (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <div className="mb-4 rounded-full bg-white border border-slate-100 p-4 text-slate-400 shadow-sm">
                <Sparkles className="h-8 w-8" />
              </div>
              <p className="text-lg font-bold text-slate-500">{t('selectServiceFirst')}</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
              <SlotPicker
                slots={slots}
                isLoading={isLoadingSlots}
                selectedSlot={selectedSlot}
                onSelectSlot={handleSelectSlot}
                locale={activeLocale}
              />
              
              {selectedSlot && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-5 border-t border-slate-100 pt-6 mt-6">
                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">{t('notesLabel')}</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[90px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                      placeholder={t('notesPlaceholder')}
                    />
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-sm text-slate-500">{t('cashNote')}</p>
                  </div>
                  {error && (
                    <div className="animate-in zoom-in-95 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 font-medium">
                      {error}
                    </div>
                  )}

                  {/* Desktop CTA (hidden on mobile) */}
                  <div className="hidden lg:block w-full mt-8">
                     <BookButton />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile FAB CTA */}
      {selectedServiceId && selectedSlot && (
        <div className="lg:hidden fixed bottom-[80px] left-4 right-4 z-30 animate-in slide-in-from-bottom-4">
           <BookButton />
        </div>
      )}
    </div>
  );
}
