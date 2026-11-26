import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Star } from 'lucide-react';

interface Occasion {
  day: number;
  month: number;
  name: string;
  description?: string;
  type: 'holiday' | 'event' | 'sunnah';
}

const ISLAMIC_OCCASIONS: Occasion[] = [
  { day: 1, month: 1, name: 'رأس السنة الهجرية', type: 'holiday' },
  { day: 10, month: 1, name: 'يوم عاشوراء', type: 'sunnah' },
  { day: 12, month: 3, name: 'المولد النبوي الشريف', type: 'event' },
  { day: 27, month: 7, name: 'الإسراء والمعراج', type: 'event' },
  { day: 15, month: 8, name: 'ليلة النصف من شعبان', type: 'event' },
  { day: 1, month: 9, name: 'أول أيام رمضان المبارك', type: 'holiday' },
  { day: 17, month: 9, name: 'غزوة بدر الكبرى', type: 'event' },
  { day: 27, month: 9, name: 'ليلة القدر (تحري)', type: 'event' },
  { day: 1, month: 10, name: 'عيد الفطر السعيد', type: 'holiday' },
  { day: 8, month: 12, name: 'يوم التروية', type: 'event' },
  { day: 9, month: 12, name: 'يوم عرفة', type: 'holiday' },
  { day: 10, month: 12, name: 'عيد الأضحى المبارك', type: 'holiday' },
  { day: 11, month: 12, name: 'أيام التشريق', type: 'event' },
  { day: 12, month: 12, name: 'أيام التشريق', type: 'event' },
  { day: 13, month: 12, name: 'أيام التشريق', type: 'event' },
];

export const IslamicCalendar = () => {
  const [currentDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion | null>(null);

  const getHijriInfo = (date: Date) => {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    }).formatToParts(date);
    
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '0');
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
    
    const monthName = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      month: 'long'
    }).format(date);

    return { day, month, year, monthName };
  };

  const getOccasion = (hijriDay: number, hijriMonth: number) => {
    return ISLAMIC_OCCASIONS.find(o => o.day === hijriDay && o.month === hijriMonth);
  };

  const hijriToday = getHijriInfo(currentDate);
  const todayOccasion = getOccasion(hijriToday.day, hijriToday.month);

  const renderCalendarDays = () => {
    const days = [];
    const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    const startDay = startOfMonth.getDay();

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-14 md:h-16" />);
    }

    for (let d = 1; d <= endOfMonth.getDate(); d++) {
      const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
      const hijri = getHijriInfo(date);
      const occasion = getOccasion(hijri.day, hijri.month);
      const isToday = date.toDateString() === currentDate.toDateString();

      days.push(
        <button
          type="button"
          key={d}
          onClick={() => setSelectedOccasion(occasion || null)}
          className={`relative h-14 md:h-16 flex flex-col items-center justify-center rounded-xl border transition-colors p-1 tabular-nums ${
            isToday
              ? 'bg-amber-100 border-amber-500 dark:bg-amber-900/40 dark:border-amber-600'
              : 'bg-amber-50/30 border-amber-100/80 dark:bg-stone-900/50 dark:border-amber-900/30 hover:bg-amber-50 dark:hover:bg-stone-800/60'
          } ${occasion ? 'ring-1 ring-amber-500 bg-amber-50/90 dark:bg-amber-900/25 cursor-pointer' : 'cursor-default'}`}
        >
          <span className="text-[10px] text-amber-800/50 dark:text-amber-200/40 absolute top-1 right-1.5 font-mono">{d}</span>
          <span className="text-base font-bold text-amber-950 dark:text-amber-100">{hijri.day}</span>
          {occasion && (
            <span className={`mt-0.5 w-full text-[9px] font-semibold px-1 rounded truncate ${
              occasion.type === 'holiday'
                ? 'text-red-700 dark:text-red-300'
                : occasion.type === 'sunnah'
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-sky-700 dark:text-sky-300'
            }`}>
              {occasion.name}
            </span>
          )}
        </button>
      );
    }

    return days;
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const viewHijri = getHijriInfo(viewDate);

  return (
    <div className="w-full max-w-3xl mx-auto bg-white/95 dark:bg-[#171412]/95 rounded-2xl p-5 sm:p-6 border border-amber-200/50 dark:border-amber-900/40 shadow-sm space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100/80 dark:bg-amber-900/40 rounded-xl text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-amber-950 dark:text-amber-100 font-kufi">اليومية الإسلامية</h2>
            <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-400 tabular-nums">{viewHijri.monthName} {viewHijri.year} هـ</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-xl transition-colors text-amber-800 dark:text-amber-200" title="الشهر السابق">
            <ChevronRight size={18} />
          </button>
          <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-xl transition-colors text-amber-800 dark:text-amber-200" title="الشهر التالي">
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>

      {(todayOccasion || selectedOccasion) && (
        <div className="p-4 bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/70 dark:border-amber-800/50 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-600 rounded-xl text-white flex items-center justify-center shrink-0">
              <Star size={17} className="fill-white" />
            </div>
            <div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                {selectedOccasion ? 'تفاصيل المناسبة' : 'مناسبة اليوم'}
              </p>
              <h3 className="text-sm sm:text-base font-bold text-amber-950 dark:text-amber-100">
                {(selectedOccasion || todayOccasion)!.name}
              </h3>
            </div>
          </div>
          {selectedOccasion && (
            <button
              onClick={() => setSelectedOccasion(null)}
              className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline shrink-0"
            >
              إخفاء
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'].map(day => (
          <div key={day} className="text-center text-xs font-bold text-amber-700/80 dark:text-amber-400/80 py-1.5">
            {day}
          </div>
        ))}
        {renderCalendarDays()}
      </div>

      <div className="pt-4 border-t border-amber-100 dark:border-amber-900/30 space-y-3">
        <h3 className="text-sm sm:text-base font-bold text-amber-950 dark:text-amber-100">
          أهم المناسبات في {viewHijri.monthName}
        </h3>
        <div className="grid gap-2">
          {ISLAMIC_OCCASIONS.filter(o => o.month === viewHijri.month).map((o, idx) => (
            <div
              key={idx}
              className="px-4 py-3 bg-amber-50/60 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-900/30 rounded-xl flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-[11px] font-semibold shrink-0 ${
                  o.type === 'holiday' ? 'text-red-700 dark:text-red-400' : o.type === 'sunnah' ? 'text-emerald-700 dark:text-emerald-400' : 'text-sky-700 dark:text-sky-400'
                }`}>
                  {o.type === 'holiday' ? 'عطلة' : o.type === 'sunnah' ? 'سنة' : 'حدث'}
                </span>
                <span aria-hidden="true" className="text-amber-300 dark:text-amber-800">·</span>
                <span className="font-bold text-sm text-amber-950 dark:text-amber-100 truncate">{o.name}</span>
              </div>
              <span className="text-xs font-mono tabular-nums text-amber-800 dark:text-amber-300 shrink-0">
                {o.day} {viewHijri.monthName}
              </span>
            </div>
          ))}
          {ISLAMIC_OCCASIONS.filter(o => o.month === viewHijri.month).length === 0 && (
            <p className="text-center text-xs sm:text-sm text-amber-800/60 dark:text-amber-200/50 py-3">لا توجد مناسبات رئيسية في هذا الشهر</p>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-amber-100 dark:border-amber-900/30 flex flex-wrap justify-between items-center gap-2 text-xs text-amber-800/70 dark:text-amber-400/70">
        <span>عطلة رسمية · سنة نبوية · حدث تاريخي</span>
        <span className="font-medium">تقويم أم القرى</span>
      </div>
    </div>
  );
};
