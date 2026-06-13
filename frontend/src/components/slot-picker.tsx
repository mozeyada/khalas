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
  
  // Calendar View State
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  useEffect(() => {
    if (availableDates.length > 0) {
      if (!availableDates.includes(selectedDateStr)) {
        setSelectedDateStr(availableDates[0]);
        setCurrentMonth(new Date(availableDates[0]));
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

  // --- Calendar Logic ---
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
  
  const monthName = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(currentMonth);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

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
        <h4 className="mb-3 text-sm font-bold text-zinc-500">{title}</h4>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
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
                className={`animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden rounded-md border py-2.5 text-center text-sm font-semibold transition-all hover:border-brand hover:text-brand active:scale-95 ${
                  isSelected
                    ? 'border-brand bg-brand text-white shadow-sm hover:text-white hover:bg-brand-hover'
                    : 'border-zinc-200 bg-white text-zinc-700'
                }`}
                style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'both' }}
              >
                {timeStr}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const weekdays = locale === 'ar' 
    ? ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      {/* Calendar Section */}
      <div className="w-full lg:w-[320px] shrink-0 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={prevMonth} type="button" className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-zinc-800 capitalize">{monthName}</span>
          <button onClick={nextMonth} type="button" className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekdays.map(day => (
            <div key={day} className="text-center text-xs font-semibold text-zinc-400 py-1">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-9 w-full" />
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNumber = i + 1;
            const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNumber);
            // Format to YYYY-MM-DD locally to match availableDates
            const dateStr = [
              dateObj.getFullYear(),
              String(dateObj.getMonth() + 1).padStart(2, '0'),
              String(dateObj.getDate()).padStart(2, '0')
            ].join('-');
            
            const isAvailable = availableDates.includes(dateStr);
            const isSelected = selectedDateStr === dateStr;
            const isToday = isSameDay(dateObj, new Date());

            return (
              <button
                key={dateStr}
                type="button"
                disabled={!isAvailable}
                onClick={() => isAvailable && setSelectedDateStr(dateStr)}
                className={`relative flex h-9 w-full items-center justify-center rounded-md text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-brand text-white font-bold shadow-sm'
                    : isAvailable
                      ? 'text-zinc-700 hover:bg-brand-light hover:text-brand'
                      : 'text-zinc-300 cursor-not-allowed'
                }`}
              >
                {dayNumber}
                {isToday && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots Section */}
      <div className="flex-1 min-w-0">
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
            {renderTimeBlock(locale === 'ar' ? 'الصباح' : 'Morning', morningSlots)}
            {renderTimeBlock(locale === 'ar' ? 'بعد الظهر' : 'Afternoon', afternoonSlots)}
            {renderTimeBlock(locale === 'ar' ? 'المساء' : 'Evening', eveningSlots)}
          </div>
        )}
      </div>
    </div>
  );
}
