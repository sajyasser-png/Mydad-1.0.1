import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Compass, MapPin, AlertCircle, Navigation, Share2 } from 'lucide-react';

export const QiblaSection = () => {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [qiblaAngle, setQiblaAngle] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [heading, setHeading] = useState<number>(0);

  const KAABA_COORDS = { lat: 21.4225, lng: 39.8262 };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ lat: latitude, lng: longitude });
          calculateQibla(latitude, longitude);
          window.dispatchEvent(new CustomEvent('log_spiritual_event', {
            detail: {
              content: `حددت اتجاه القبلة من موقعك الحالي`,
              icon: '🧭',
              type: 'qibla'
            }
          }));
        },
        () => {
          setError("يرجى تفعيل صلاحيات الموقع الجغرافي لتحديد القبلة.");
        }
      );
    } else {
      setError("متصفحك لا يدعم تحديد الموقع الجغرافي.");
    }

    // Handle device orientation if available with CPU/battery-friendly throttling
    let lastHeadingUpdate = 0;
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const now = Date.now();
      if (now - lastHeadingUpdate < 60) return; // Limit to max ~16 updates/sec
      lastHeadingUpdate = now;
      const webkitCompassHeading = (e as any).webkitCompassHeading;
      if (webkitCompassHeading !== undefined && webkitCompassHeading !== null) {
        setHeading(webkitCompassHeading);
      } else if (e.alpha !== null && e.alpha !== undefined) {
        setHeading(360 - e.alpha);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  const calculateQibla = (lat: number, lng: number) => {
    const φ1 = lat * Math.PI / 180;
    const λ1 = lng * Math.PI / 180;
    const φ2 = KAABA_COORDS.lat * Math.PI / 180;
    const λ2 = KAABA_COORDS.lng * Math.PI / 180;

    const y = Math.sin(λ2 - λ1);
    const x = Math.cos(φ1) * Math.tan(φ2) - Math.sin(φ1) * Math.cos(λ2 - λ1);
    let qibla = Math.atan2(y, x) * 180 / Math.PI;
    qibla = (qibla + 360) % 360;
    setQiblaAngle(qibla);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-4 bg-white/95 dark:bg-[#171412]/95 p-5 sm:p-6 rounded-2xl border border-amber-200/50 dark:border-amber-900/40 shadow-sm">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-amber-950 dark:text-amber-50 font-kufi">اتجاه القبلة</h2>
          <p className="text-xs sm:text-sm text-amber-800/70 dark:text-amber-300/70 mt-1">تحديد اتجاه القبلة بناءً على موقعك الحالي</p>
        </div>
        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && coords && qiblaAngle !== null && (
          <button
            onClick={() => {
              navigator.share({
                title: 'اتجاه القبلة',
                text: `موقعي الحالي: ${coords.lat.toFixed(4)}° N, ${coords.lng.toFixed(4)}° E\nزاوية القبلة: ${qiblaAngle.toFixed(1)}° من الشمال`
              }).catch(console.error);
            }}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors shrink-0"
            title="مشاركة اتجاه القبلة"
          >
            <Share2 size={17} />
          </button>
        )}
      </div>

      <div className="bg-white/95 dark:bg-[#171412]/95 p-6 sm:p-10 rounded-2xl shadow-sm border border-amber-200/50 dark:border-amber-900/40 flex flex-col items-center space-y-8 relative overflow-hidden">
        {error ? (
          <div className="flex flex-col items-center text-center space-y-3 text-red-600 dark:text-red-400 p-6 bg-red-50/70 dark:bg-red-900/10 rounded-2xl border border-red-200/60 dark:border-red-900/30 w-full">
            <AlertCircle size={36} />
            <p className="text-sm sm:text-base font-bold">{error}</p>
          </div>
        ) : !coords ? (
          <div className="flex flex-col items-center space-y-4 py-8">
            <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm sm:text-base text-amber-800 dark:text-amber-200 font-medium">جاري تحديد موقعك...</p>
          </div>
        ) : (
          <>
            <div className="relative w-64 h-64 sm:w-72 sm:h-72">
              <div className="absolute inset-0 border-4 border-amber-100 dark:border-amber-900/40 rounded-full"></div>

              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ rotate: -heading }}
                transition={{ type: 'spring', stiffness: 50 }}
              >
                <Compass size={220} className="text-amber-200 dark:text-amber-900/30" strokeWidth={0.6} />

                {qiblaAngle !== null && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ rotate: qiblaAngle }}
                  >
                    <div className="relative h-full w-1 flex justify-center">
                      <div className="absolute top-0 w-8 h-8 bg-amber-600 rounded-full shadow-md flex items-center justify-center -translate-y-3">
                        <Navigation size={15} className="text-white fill-current" />
                      </div>
                      <div className="w-1 h-1/2 bg-gradient-to-b from-amber-600 to-transparent"></div>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3.5 h-3.5 bg-amber-800 dark:bg-amber-200 rounded-full shadow z-10 border-2 border-white dark:border-stone-900"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full tabular-nums">
              <div className="p-4 bg-amber-50/70 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/40 text-center">
                <div className="text-xs text-amber-700 dark:text-amber-400 mb-1 flex items-center justify-center gap-1">
                  <MapPin size={12} /> موقعك الحالي
                </div>
                <div className="font-bold text-sm text-amber-950 dark:text-amber-100 font-mono" dir="ltr">
                  {coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E
                </div>
              </div>
              <div className="p-4 bg-amber-50/70 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/40 text-center">
                <div className="text-xs text-amber-700 dark:text-amber-400 mb-1">زاوية القبلة</div>
                <div className="font-bold text-sm text-amber-950 dark:text-amber-100 font-mono">
                  {qiblaAngle?.toFixed(1)}° من الشمال
                </div>
              </div>
            </div>

            <p className="text-center text-amber-800/70 dark:text-amber-300/60 text-xs">
              دقة البوصلة تعتمد على حساسات جهازك؛ يُنصح بتحريك الجهاز على شكل رقم (8) للمعايرة.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
