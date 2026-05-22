'use client';

import { useMemo, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Slot } from '@/lib/types';
import { formatDateTime } from '@/lib/format';

type SlotPickerProps = {
  slots: Slot[];
  isLoading: boolean;
  selectedSlot: string;
  onSelectSlot: (slotDatetime: string) => void;
  locale: string;
};

export function SlotPicker({
  slots,
  isLoading,
  selectedSlot,
  onSelectSlot,
  locale
}: SlotPickerProps) {
  const t = useTranslations('StaffPage'); // Re-use staff page translations for now, or move to common

  // Group slots by date (YYYY-MM-DD)
  const groupedSlots = useMemo(() => {
    const groups: Record<string, Slot[]> = {};
    for (const slot of slots) {
      // Extract date part from ISO string (e.g., "2026-05-25")
      const dateKey = slot.slot_datetime.split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(slot);
    }
    return groups;
  }, [slots]);

  const availableDates = Object.keys(groupedSlots).sort();
  
  // Selected date state
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Auto-select the first available date when slots load
  useEffect(() => {
    if (availableDates.length > 0) {
      if (!availableDates.includes(selectedDate)) {
        setSelectedDate(availableDates[0]);
      }
    } else {
      setSelectedDate('');
    }
  }, [availableDates, selectedDate]);

  if (isLoading) {
    return (
      <div className="flex min-h-[15rem] items-center justify-center rounded-2xl bg-white/5 border border-white/10">
        <p className="text-sm text-slate-300 animate-pulse">{t('loadingSlots')}</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="flex min-h-[15rem] items-center justify-center rounded-2xl bg-white/5 border border-white/10">
        <p className="text-sm text-slate-300">{t('noSlots')}</p>
      </div>
    );
  }

  const activeSlots = selectedDate ? groupedSlots[selectedDate] : [];

  return (
    <div className="space-y-6">
      {/* Date Carousel */}
      <div>
        <p className="mb-3 text-sm font-medium text-white">Select a Date</p>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {availableDates.map((date) => {
            const isSelected = selectedDate === date;
            const dateObj = new Date(date);
            const dayName = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(dateObj);
            const dayNumber = new Intl.DateTimeFormat(locale, { day: 'numeric' }).format(dateObj);
            const monthName = new Intl.DateTimeFormat(locale, { month: 'short' }).format(dateObj);

            return (
              <button
                key={date}
                type="button"
                onClick={() => setSelectedDate(date)}
                className={`flex min-w-[4.5rem] flex-col items-center justify-center rounded-2xl border p-3 transition-all ${
                  isSelected
                    ? 'border-emerald-300 bg-emerald-300/10 text-emerald-300 shadow-[0_0_15px_rgba(110,231,183,0.15)]'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <span className="text-xs uppercase opacity-80 mb-1">{dayName}</span>
                <span className="text-xl font-bold leading-none">{dayNumber}</span>
                <span className="text-[10px] uppercase opacity-80 mt-1">{monthName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Grid */}
      {selectedDate && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="mb-3 text-sm font-medium text-white">Select a Time</p>
          <div className="grid grid-cols-3 gap-2">
            {activeSlots.map((slot) => {
              const isSelected = selectedSlot === slot.slot_datetime;
              
              // Format time (e.g. 9:00 AM)
              const timeObj = new Date(slot.slot_datetime);
              const timeStr = new Intl.DateTimeFormat(locale, {
                hour: 'numeric',
                minute: '2-digit',
              }).format(timeObj);

              return (
                <button
                  key={slot.slot_datetime}
                  type="button"
                  onClick={() => onSelectSlot(slot.slot_datetime)}
                  className={`rounded-xl border py-3 text-center text-sm font-medium transition-all ${
                    isSelected
                      ? 'border-emerald-300 bg-emerald-300 text-slate-950 shadow-md scale-[1.02]'
                      : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {timeStr}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
