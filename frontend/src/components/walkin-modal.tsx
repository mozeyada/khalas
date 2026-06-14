'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { CalendarSearch, X, User, Phone, CheckCircle2, Loader2, FileText } from 'lucide-react';
import { 
  createProviderWalkInAppointment, 
  getStaffServices, 
  getStaffSlots, 
  getVenueStaff, 
  ApiError,
  apiBaseUrl
} from '@/lib/api';
import { SlotPicker } from '@/components/slot-picker';
import { PublicService, PublicStaff, PublicVenue, Slot } from '@/lib/types';

type WalkInModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function WalkInModal({ isOpen, onClose, onSuccess }: WalkInModalProps) {
  const t = useTranslations('ProviderAppointmentsPage');
  const locale = useLocale();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [staffList, setStaffList] = useState<PublicStaff[]>([]);
  const [services, setServices] = useState<PublicService[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [notes, setNotes] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch context (venues -> staff -> services)
  useEffect(() => {
    if (!isOpen) return;
    
    async function fetchContext() {
      setIsLoadingContext(true);
      setError(null);
      try {
        // 1. Fetch provider venues using the authenticated BFF proxy
        // Since getProviderVenues isn't in api.ts yet, we do it directly here
        const vRes = await fetch('/api/proxy/provider/venues');
        const vData = await vRes.json();
        if (!vRes.ok) throw new Error(vData.detail || 'Failed to load venues');
        const venues = vData.data as PublicVenue[];
        
        if (venues.length === 0) {
          throw new Error('No venues found for this provider');
        }
        
        // 2. Fetch staff for the first venue
        const staffData = await getVenueStaff(venues[0].slug);
        setStaffList(staffData);
        
        if (staffData.length === 0) {
          throw new Error('No staff found for this venue');
        }
        
        // 3. Fetch services for the first staff member
        const servicesData = await getStaffServices(staffData[0]._id);
        setServices(servicesData);
        
        if (servicesData.length > 0) {
          setSelectedService(servicesData[0]._id);
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred loading clinic data');
      } finally {
        setIsLoadingContext(false);
      }
    }
    
    fetchContext();
  }, [isOpen]);

  // Fetch slots when service changes
  useEffect(() => {
    if (!selectedService || staffList.length === 0) return;
    
    async function loadSlots() {
      setIsLoadingSlots(true);
      try {
        const slotData = await getStaffSlots(staffList[0]._id, selectedService);
        setSlots(slotData.slots);
      } catch (err: any) {
        console.error(err);
      } finally {
        setIsLoadingSlots(false);
      }
    }
    
    loadSlots();
  }, [selectedService, staffList]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedService || !selectedSlot || !patientName) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await createProviderWalkInAppointment({
        service_id: selectedService,
        slot_datetime: selectedSlot,
        patient_name: patientName,
        patient_phone: patientPhone || undefined,
        notes: notes || undefined
      });
      onSuccess();
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : 'Failed to create walk-in appointment');
      setIsSubmitting(false);
    }
  }

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setPatientName('');
      setPatientPhone('');
      setNotes('');
      setSelectedSlot('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <h2 className="text-xl font-bold text-ink">New Walk-In Booking</h2>
          <button onClick={onClose} className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto p-6">
          {error && (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {isLoadingContext ? (
            <div className="flex py-12 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-teal" />
            </div>
          ) : step === 1 ? (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-ink">Select Service</label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink"
                >
                  {services.map(s => (
                    <option key={s._id} value={s._id}>
                      {locale === 'ar' ? s.name_ar : s.name_en} - {s.price} EGP
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <SlotPicker
                  slots={slots}
                  isLoading={isLoadingSlots}
                  selectedSlot={selectedSlot}
                  onSelectSlot={setSelectedSlot}
                  locale={locale}
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  disabled={!selectedSlot}
                  onClick={() => setStep(2)}
                  className="rounded-md bg-brand px-8 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-hover active:scale-95 disabled:opacity-50"
                >
                  Next Details
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-ink">
                  <User className="h-4 w-4 text-teal" /> Patient Name *
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-ink"
                  placeholder="E.g. Ahmed Hassan"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-ink">
                  <Phone className="h-4 w-4 text-teal" /> Phone Number
                </label>
                <input
                  type="tel"
                  dir="auto"
                  value={patientPhone}
                  onChange={e => setPatientPhone(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm text-left outline-none focus:border-ink"
                  placeholder="Optional, for WhatsApp reminders"
                />
              </div>
              
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-ink">
                  <FileText className="h-4 w-4 text-teal" /> Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-ink"
                  placeholder="Optional notes"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-md border border-zinc-300 bg-white px-8 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-zinc-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !patientName}
                  className="flex items-center gap-2 rounded-md bg-brand px-8 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-hover active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Confirm Booking
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
