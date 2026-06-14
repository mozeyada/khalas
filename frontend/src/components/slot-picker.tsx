'use client';

import { useMemo, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarSearch, Loader2, CalendarX2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Slot } from '@/lib/types';

type SlotPickerProps = {
  slots: Slot[];
  isLoading: boolean;
  selectedSlot: string;
  onSelectSlot: (slotDatetime: string) => void;
  locale: string;
};

// Helper to check if two dates are the same day
function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

export function SlotPicker({
  slots,
  isLoading,
  selectedSlot,
  onSelectSlot,
  locale
}: SlotPickerProps) {
  const t = useTranslations('StaffPage'); 

  // Group slots by date string YYYY-MM-DD
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
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  
  useEffect(() => {
    if (availableDates.length > 0) {
      if (!availableDates.includes(selectedDateStr)) {
        setSelectedDateStr(availableDates[0]);
      }
    } else {
      setSelectedDateStr('');
    }
  }, [availableDates, selectedDateStr]);

  if (isLoading) {
    return (
      <div className="flex min-h-[15rem] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-zinc-200 bg-zinc-50">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        <p className="text-sm font-semibold text-zinc-500 animate-pulse">{t('loadingSlots')}</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="flex min-h-[15rem] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-zinc-200 bg-zinc-50">
        <CalendarX2 className="h-8 w-8 text-zinc-400" />
        <p className="text-sm font-semibold text-zinc-500">{t('noSlots')}</p>
      </div>
    );
  }

  // --- Time Block Logic ---
  const activeSlots = selectedDateStr ? groupedSlots[selectedDateStr] : [];
  
  const morningSlots = activeSlots.filter(s => {
    const h = new Date(s.slot_datetime).getHours();
    return h < 12;
  });
  const afternoonSlots = activeSlots.filter(s => {
    const h = new Date(s.slot_datetime).getHours();
    return h >= 12 && h < 17;
  });
  const eveningSlots = activeSlots.filter(s => {
    const h = new Date(s.slot_datetime).getHours();
    return h >= 17;
  });

  const renderTimeBlock = (title: string, blockSlots: Slot[]) => {
    if (blockSlots.length === 0) return null;
    return (
      <div className="mb-6 last:mb-0">
        <h4 className="mb-3 text-sm font-bold text-slate-500">{title}</h4>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {blockSlots.map((slot, index) => {
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
                className={`py-3 rounded-xl border text-sm font-semibold text-center cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-600 hover:text-blue-600'
                }`}
              >
                {timeStr}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Horizontal Dates Scroller */}
      <div className="flex overflow-x-auto flex-nowrap gap-3 pb-4 scrollbar-hide w-full mb-2">
        {availableDates.map((dateStr) => {
          const dateObj = new Date(dateStr);
          const isSelected = selectedDateStr === dateStr;
          const dayName = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(dateObj);
          const dayNum = dateObj.getDate();
          const monthName = new Intl.DateTimeFormat(locale, { month: 'short' }).format(dateObj);

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDateStr(dateStr)}
              className={`flex flex-col items-center justify-center min-w-[72px] h-[88px] rounded-2xl border cursor-pointer transition-all shrink-0 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md border-blue-600 font-bold scale-105 transform'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
              }`}
            >
              <span className={`text-xs uppercase ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>{monthName}</span>
              <span className={`text-2xl font-black leading-none my-1 ${isSelected ? 'text-white' : 'text-slate-800'}`}>{dayNum}</span>
              <span className={`text-xs font-semibold ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>{dayName}</span>
            </button>
          )
        })}
      </div>

      {/* Time Slots Section */}
      <div className="w-full">
        {!selectedDateStr ? (
          <div className="flex h-full min-h-[15rem] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center">
            <CalendarSearch className="mb-3 h-8 w-8 text-zinc-400" />
            <p className="text-sm font-semibold text-zinc-500">{t('loadSlots')}</p>
          </div>
        ) : activeSlots.length === 0 ? (
          <div className="flex h-full min-h-[15rem] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center">
            <p className="text-sm font-semibold text-zinc-500">{t('noSlots')}</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-base font-bold text-slate-800 mb-4">{locale === 'ar' ? 'المواعيد المتاحة' : 'Available Slots'}</h3>
            {renderTimeBlock(locale === 'ar' ? 'الصباح' : 'Morning', morningSlots)}
            {renderTimeBlock(locale === 'ar' ? 'بعد الظهر' : 'Afternoon', afternoonSlots)}
            {renderTimeBlock(locale === 'ar' ? 'المساء' : 'Evening', eveningSlots)}
          </div>
        )}
      </div>
    </div>
  );
}
