'use client';

import { useMemo, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarSearch, Loader2, CalendarX2 } from 'lucide-react';
import { Slot } from '@/lib/types';

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
  const t = useTranslations('StaffPage'); 

  const groupedSlots = useMemo(() => {
    const groups: Record<string, Slot[]> = {};
    for (const slot of slots) {
      const dateKey = slot.slot_datetime.split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(slot);
    }
    return groups;
  }, [slots]);

  const availableDates = Object.keys(groupedSlots).sort();
  const [selectedDate, setSelectedDate] = useState<string>('');

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
      <div className="flex min-h-[15rem] flex-col items-center justify-center gap-4 rounded-md border border-dashed border-white/10 bg-white/5">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        <p className="text-sm font-semibold text-zinc-400 animate-pulse">{t('loadingSlots')}</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="flex min-h-[15rem] flex-col items-center justify-center gap-4 rounded-md border border-dashed border-white/10 bg-white/5">
        <CalendarX2 className="h-8 w-8 text-zinc-500" />
        <p className="text-sm font-semibold text-zinc-400">{t('noSlots')}</p>
      </div>
    );
  }

  const activeSlots = selectedDate ? groupedSlots[selectedDate] : [];

  return (
    <div className="space-y-6">
      {/* Date Carousel */}
      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-200">{t('loadSlots')}</p>
          {!selectedDate && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 animate-pulse">
              <CalendarSearch className="h-3 w-3" />
              {t('loadingSlots')}
            </span>
          )}
        </div>
        
        {/* Horizontal scroll fade effect */}
        
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide relative z-0">
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
                className={`group relative flex min-w-[5rem] flex-col items-center justify-center overflow-hidden rounded-md border p-3 transition-all duration-300 active:scale-95 ${
                  isSelected
                    ? 'border-white bg-white text-ink shadow-sm'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-slate-200'
                }`}
              >
                <span className="relative z-10 text-xs uppercase font-semibold tracking-wider opacity-80 mb-1">{dayName}</span>
                <span className="relative z-10 text-2xl font-bold leading-none">{dayNumber}</span>
                <span className="relative z-10 text-[10px] uppercase font-bold tracking-widest opacity-80 mt-1">{monthName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Grid with Predictive Cascading Entry */}
      {selectedDate && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <p className="mb-3 text-sm font-semibold text-slate-200">{t('slotMeta')}</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {activeSlots.map((slot, index) => {
              const isSelected = selectedSlot === slot.slot_datetime;
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
                  className={`animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden rounded-sm border py-3 text-center text-sm font-semibold transition-all duration-300 active:scale-95 ${
                    isSelected
                      ? 'border-white bg-white text-ink scale-[1.02]'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30 hover:bg-white/10'
                  }`}
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
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
