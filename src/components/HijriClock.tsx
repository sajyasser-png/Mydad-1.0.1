import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

export const HijriClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hijriDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(time);

  const gregorianDate = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(time);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const ampm = hours >= 12 ? 'م' : 'ص';
  const hours12 = hours % 12 || 12;

  const padZero = (num: number) => num.toString().padStart(2, '0');
  const timeString = `${padZero(hours12)}:${padZero(minutes)}:${padZero(seconds)}`;

  return (
    <div className="w-full h-full bg-white/95 dark:bg-[#171412]/95 rounded-2xl px-4 py-3.5 border border-amber-200/50 dark:border-amber-900/40 shadow-sm flex flex-col justify-between gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-amber-950 dark:text-amber-100">
          <div className="w-8 h-8 rounded-xl bg-amber-100/80 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Clock size={16} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-800/75 dark:text-amber-300/75 block">التوقيت المحلي</span>
            <div className="flex items-baseline gap-1 tabular-nums" dir="ltr">
              <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight">{timeString}</span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{ampm}</span>
            </div>
          </div>
        </div>

        <div className="text-left flex flex-col items-end">
          <div className="flex items-center gap-1.5 text-amber-950 dark:text-amber-100 font-bold text-xs sm:text-sm">
            <span>{hijriDate}</span>
            <CalendarIcon size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
          </div>
          <span className="text-[11px] text-amber-800/65 dark:text-amber-300/65 font-medium mt-0.5">
            {gregorianDate} م
          </span>
        </div>
      </div>
    </div>
  );
};
