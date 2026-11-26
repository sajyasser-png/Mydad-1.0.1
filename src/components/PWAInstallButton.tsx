import React, { useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'icon' | 'button';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'button' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={
          variant === 'icon'
            ? 'h-7 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors active:scale-95 flex items-center gap-1 font-semibold text-[11px] whitespace-nowrap shrink-0'
            : 'h-7 flex items-center gap-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-sm transition-colors active:scale-95 whitespace-nowrap shrink-0'
        }
        title="تثبيت التطبيق على الجهاز"
        aria-label="تثبيت التطبيق"
      >
        <Download size={13} />
        <span className="hidden sm:inline">تثبيت</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          dir="rtl"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1c1917] p-6 shadow-2xl border border-amber-200 dark:border-amber-800/40 text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <img src="/pwa-192x192.png" alt="Mydad live" className="w-10 h-10 rounded-xl border border-amber-300/40" />
                <h3 className="text-base font-bold text-amber-950 dark:text-amber-50">
                  تثبيت Mydad live على جهازك
                </h3>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                aria-label="إغلاق"
              >
                <X size={16} />
              </button>
            </div>
            {isIOS ? (
              <div className="space-y-3 text-sm text-amber-900/80 dark:text-amber-100/80 leading-relaxed">
                <p className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-bold text-xs shrink-0">
                    1
                  </span>
                  <span>
                    اضغط على زر <strong>المشاركة</strong> <Share size={14} className="inline mx-1" /> في شريط متصفح Safari.
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-bold text-xs shrink-0">
                    2
                  </span>
                  <span>
                    مرّر للأسفل واختر <strong>إضافة إلى الصفحة الرئيسية</strong> <PlusSquare size={14} className="inline mx-1" />.
                  </span>
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-amber-900/80 dark:text-amber-100/80 leading-relaxed">
                <p className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-bold text-xs shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    افتح رابط التطبيق المنشور في تبويب مستقل خارج المعاينة، ثم اضغط على قائمة المتصفح <strong>(⋮ ثلاث نقاط)</strong> أعلى الشاشة.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-bold text-xs shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    اختر <strong>«تثبيت التطبيق» (Install app)</strong> أو <strong>«الإضافة إلى الشاشة الرئيسية» (Add to Home screen)</strong>.
                  </span>
                </p>
              </div>
            )}
            <button
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full rounded-xl bg-amber-700 hover:bg-amber-800 py-2.5 text-sm font-bold text-white transition-colors"
            >
              حسناً
            </button>
          </div>
        </div>
      )}
    </>
  );
};
