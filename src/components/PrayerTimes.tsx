import { useState, useEffect } from 'react';
import { Coordinates, CalculationMethod, PrayerTimes, SunnahTimes } from 'adhan';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Clock, MapPin, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PRAYER_NAMES_AR: Record<string, string> = {
  fajr: 'الفجر',
  sunrise: 'الشروق',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
  imsak: 'الإمساك',
  midnight: 'منتصف الليل',
  lastthird: 'الثلث الأخير',
};

const MAJOR_CITIES = [
  { name: 'مكة المكرمة', country: 'السعودية', lat: 21.4225, lng: 39.8262 },
  { name: 'المدينة المنورة', country: 'السعودية', lat: 24.4672, lng: 39.6068 },
  { name: 'القاهرة', country: 'مصر', lat: 30.0444, lng: 31.2357 },
  { name: 'الدار البيضاء', country: 'المغرب', lat: 33.5731, lng: -7.5898 },
  { name: 'الجزائر', country: 'الجزائر', lat: 36.7538, lng: 3.0588 },
  { name: 'تونس', country: 'تونس', lat: 36.8065, lng: 10.1815 },
  { name: 'دبي', country: 'الإمارات', lat: 25.2048, lng: 55.2708 },
  { name: 'إسطنبول', country: 'تركيا', lat: 41.0082, lng: 28.9784 },
  { name: 'عمان', country: 'الأردن', lat: 31.9454, lng: 35.9284 },
  { name: 'بيروت', country: 'لبنان', lat: 33.8938, lng: 35.5018 },
  { name: 'بغداد', country: 'العراق', lat: 33.3152, lng: 44.3661 },
  { name: 'الكويت', country: 'الكويت', lat: 29.3759, lng: 47.9774 },
  { name: 'الدوحة', country: 'قطر', lat: 25.2854, lng: 51.5310 },
  { name: 'مسقط', country: 'عمان', lat: 23.5859, lng: 58.4059 },
  { name: 'المنامة', country: 'البحرين', lat: 26.2285, lng: 50.5860 },
  { name: 'القدس', country: 'فلسطين', lat: 31.7683, lng: 35.2137 },
];

export const PrayerTimesCard = () => {
  const [coords, setCoords] = useState<{ lat: number; lng: number; name?: string } | null>({ lat: 33.5731, lng: -7.5898, name: 'الدار البيضاء' });
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [sunnahTimes, setSunnahTimes] = useState<SunnahTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: Date } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCityMenu, setShowCityMenu] = useState(false);
  const [locationFallback, setLocationFallback] = useState(false);

  const detectLocation = () => {
    setLocationFallback(false);
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: 'موقعي الحالي'
          });
          setShowCityMenu(false);
        },
        () => {
          setLocationFallback(true);
          setCoords({ lat: 33.5731, lng: -7.5898, name: 'الدار البيضاء' });
        }
      );
    } else {
      setLocationFallback(true);
      setCoords({ lat: 33.5731, lng: -7.5898, name: 'الدار البيضاء' });
    }
  };

  useEffect(() => {
    detectLocation();
  }, []);

  useEffect(() => {
    if (!coords) return;

    const date = new Date();
    const coordinates = new Coordinates(coords.lat, coords.lng);
    const params = CalculationMethod.MuslimWorldLeague();
    const pt = new PrayerTimes(coordinates, date, params);
    const st = new SunnahTimes(pt);

    setPrayerTimes(pt);
    setSunnahTimes(st);

    const next = pt.nextPrayer();
    let activeNext: { name: string; time: Date };
    if (next !== 'none') {
      activeNext = {
        name: next,
        time: pt.timeForPrayer(next)!,
      };
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const ptTomorrow = new PrayerTimes(coordinates, tomorrow, params);
      activeNext = {
        name: 'fajr',
        time: ptTomorrow.fajr,
      };
    }
    setNextPrayer(activeNext);

    const interval = setInterval(() => {
      const now = new Date();
      if (now > activeNext.time) {
        const ptNew = new PrayerTimes(coordinates, now, params);
        setPrayerTimes(ptNew);
        const nextNew = ptNew.nextPrayer();
        if (nextNew !== 'none') {
          activeNext = { name: nextNew, time: ptNew.timeForPrayer(nextNew)! };
          setNextPrayer(activeNext);
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [coords]);

  if (!prayerTimes || !nextPrayer) return null;

  const prayers = [
    { id: 'fajr', time: prayerTimes.fajr },
    { id: 'sunrise', time: prayerTimes.sunrise },
    { id: 'dhuhr', time: prayerTimes.dhuhr },
    { id: 'asr', time: prayerTimes.asr },
    { id: 'maghrib', time: prayerTimes.maghrib },
    { id: 'isha', time: prayerTimes.isha },
  ];

  const shareSummary = `الصلاة القادمة هي صلاة ${PRAYER_NAMES_AR[nextPrayer.name]} في تمام الساعة ${format(nextPrayer.time, 'hh:mm a')} بتوقيت ${coords?.name || 'موقعي الحالي'}`;

  return (
    <div className="w-full h-full relative">
      <div className="h-full bg-white/95 dark:bg-[#171412]/95 rounded-2xl shadow-sm border border-amber-200/50 dark:border-amber-900/40 overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div
            className="flex-1 flex items-center justify-between gap-2 cursor-pointer min-w-0"
            onClick={() => {
              const newExpanded = !isExpanded;
              setIsExpanded(newExpanded);
              if (newExpanded) {
                window.dispatchEvent(new CustomEvent('log_spiritual_event', {
                  detail: {
                    content: `اطلعت على مواقيت الصلاة لمدينة ${coords?.name || 'موقعي الحالي'}`,
                    icon: '🕌',
                    type: 'prayer'
                  }
                }));
              }
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 bg-amber-100/80 dark:bg-amber-900/40 rounded-xl text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <Clock size={16} />
              </div>
              <div className="text-right min-w-0">
                <p className="text-[11px] text-amber-800/80 dark:text-amber-400/90 font-bold truncate">
                  الصلاة القادمة: {PRAYER_NAMES_AR[nextPrayer.name]}
                  <span aria-hidden="true"> · </span>
                  <span>{coords?.name}</span>
                </p>
                <div className="flex items-baseline gap-2 tabular-nums">
                  <span className="text-lg sm:text-xl font-bold text-amber-950 dark:text-amber-50 font-mono" dir="ltr">
                    {format(nextPrayer.time, 'hh:mm')} {format(nextPrayer.time, 'a') === 'AM' ? 'ص' : 'م'}
                  </span>
                  <span className="text-[11px] text-amber-700/70 dark:text-amber-300/70 truncate">
                    (بعد {formatDistanceToNow(nextPrayer.time, { locale: ar })})
                  </span>
                </div>
              </div>
            </div>

            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 shrink-0">
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 border-r border-amber-100 dark:border-amber-900/30 pr-1.5">
            <button
              onClick={() => setShowCityMenu(!showCityMenu)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${showCityMenu ? 'bg-amber-600 text-white' : 'text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40'}`}
              title={locationFallback ? 'اختيار المدينة (تم استخدام المدينة الافتراضية)' : 'اختيار المدينة'}
            >
              <Globe size={14} />
            </button>
          </div>
        </div>

        {/* Always-visible slim next-prayers summary strip */}
        {!isExpanded && !showCityMenu && (
          <div className="px-4 pb-2.5 pt-2 border-t border-amber-100/70 dark:border-amber-900/30 flex items-center justify-between gap-2 overflow-x-auto hide-scrollbar text-[11px] tabular-nums">
            {prayers.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-1 whitespace-nowrap shrink-0 ${nextPrayer.name === p.id ? 'text-amber-700 dark:text-amber-300 font-bold' : 'text-amber-900/65 dark:text-amber-200/60'}`}
              >
                <span>{PRAYER_NAMES_AR[p.id]}</span>
                <span className="font-mono" dir="ltr">{format(p.time, 'hh:mm')}</span>
              </div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {showCityMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-amber-50/60 dark:bg-amber-950/20 border-t border-amber-100 dark:border-amber-900/30 overflow-hidden"
            >
              <div className="p-3.5 max-h-56 overflow-y-auto grid grid-cols-2 gap-1.5 custom-scrollbar">
                <button
                  onClick={detectLocation}
                  className="col-span-2 py-2 px-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 mb-1 transition-colors"
                >
                  <MapPin size={14} /> تحديد تلقائي للموقع
                </button>
                {MAJOR_CITIES.map((city) => (
                  <button
                    key={city.name}
                    onClick={() => {
                      setCoords({ lat: city.lat, lng: city.lng, name: city.name });
                      setShowCityMenu(false);
                    }}
                    className={`p-2 rounded-xl text-xs text-right border transition-colors ${coords?.name === city.name ? 'border-amber-600 bg-amber-100 dark:bg-amber-900/40 font-bold text-amber-950 dark:text-amber-50' : 'border-amber-200/60 dark:border-amber-800/40 hover:bg-amber-100/70 dark:hover:bg-amber-900/20 text-amber-900 dark:text-amber-100'}`}
                  >
                    <div className="font-semibold">{city.name}</div>
                    <div className="text-[10px] opacity-65">{city.country}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-amber-100 dark:border-amber-900/30 overflow-hidden"
            >
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 p-4 tabular-nums">
                {prayers.map((p) => (
                  <div
                    key={p.id}
                    className={`p-2.5 rounded-xl text-center transition-colors ${nextPrayer.name === p.id ? 'bg-amber-700 text-white shadow-sm' : 'bg-amber-50/70 dark:bg-amber-900/25 text-amber-950 dark:text-amber-100'}`}
                  >
                    <p className="text-[11px] opacity-75 mb-0.5">{PRAYER_NAMES_AR[p.id]}</p>
                    <p className="text-xs font-bold font-mono" dir="ltr">
                      {format(p.time, 'hh:mm')} {format(p.time, 'a') === 'AM' ? 'ص' : 'م'}
                    </p>
                  </div>
                ))}
              </div>
              {sunnahTimes && (
                <div className="px-4 pb-3.5 flex justify-between text-[11px] text-amber-800/75 dark:text-amber-300/75 font-medium tabular-nums">
                  <span>
                    {PRAYER_NAMES_AR.lastthird}: <span className="font-mono" dir="ltr">{format(sunnahTimes.lastThirdOfTheNight, 'hh:mm')} {format(sunnahTimes.lastThirdOfTheNight, 'a') === 'AM' ? 'ص' : 'م'}</span>
                  </span>
                  <span>
                    {PRAYER_NAMES_AR.midnight}: <span className="font-mono" dir="ltr">{format(sunnahTimes.middleOfTheNight, 'hh:mm')} {format(sunnahTimes.middleOfTheNight, 'a') === 'AM' ? 'ص' : 'م'}</span>
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
