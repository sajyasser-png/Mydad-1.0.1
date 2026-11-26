import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, Mic, Sparkles, Navigation, Monitor } from 'lucide-react';

interface UserGuideProps {
  show: boolean;
  onClose: () => void;
}

export const UserGuide = ({ show, onClose }: UserGuideProps) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 12, opacity: 0 }}
            className="bg-white dark:bg-[#171412] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl border border-amber-200/50 dark:border-amber-900/40"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-amber-100 dark:border-amber-900/30 flex justify-between items-center bg-amber-50/50 dark:bg-[#1e1a17]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-xl flex items-center justify-center">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-amber-950 dark:text-amber-100 font-kufi">دليل استخدام المنصة</h2>
                  <p className="text-xs text-amber-800/60 dark:text-amber-200/60">دليل سريع لأهم الأدوات والخصائص المتاحة</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-xl transition-colors text-amber-800 dark:text-amber-200"
                aria-label="إغلاق الدليل"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 sm:p-6 overflow-y-auto max-h-[calc(85vh-82px)] custom-scrollbar text-right space-y-6" dir="rtl">
              <section>
                <h3 className="text-base sm:text-lg font-bold text-amber-950 dark:text-amber-100 mb-2">مرحباً بك في «مداد الرحمن»</h3>
                <p className="text-sm sm:text-base leading-relaxed text-amber-950/80 dark:text-amber-100/80 font-vazir">
                  منصة قرآنية متكاملة تجمع بين تلاوة المصحف الشريف وتفسيره، مع أدوات يومية مساعدة تشمل مواقيت الصلاة، القبلة، الأذكار، السبحة، والمفكرة الهجرية.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-amber-950 dark:text-amber-100">أبرز الميزات والأدوات</h3>

                <div className="grid gap-3">
                  <div className="bg-amber-50/50 dark:bg-[#1e1a17] p-4 rounded-xl border border-amber-200/50 dark:border-amber-900/30 flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                      <Sparkles size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm sm:text-base text-amber-950 dark:text-amber-100 mb-1">المساعد الذكي ومداد الرحمن</h4>
                      <p className="text-xs sm:text-sm text-amber-900/75 dark:text-amber-200/70 leading-relaxed">
                        اطرح أسئلتك حول معاني الآيات، أسباب النزول، وأحكام التجويد، أو افتح لوحة المساعد الذكي بملء الشاشة لمتابعة الحوار بوضوح.
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-50/50 dark:bg-[#1e1a17] p-4 rounded-xl border border-amber-200/50 dark:border-amber-900/30 flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#141210] text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-center shrink-0">
                      <Navigation size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm sm:text-base text-amber-950 dark:text-amber-100 mb-1">قائمة الخيارات السريعة للآية</h4>
                      <p className="text-xs sm:text-sm text-amber-900/75 dark:text-amber-200/70 leading-relaxed">
                        اضغط مطولاً أو بزر الفأرة الأيمن على أي آية أثناء القراءة لتحليل القراءات العشر، فتح التفسير الفوري، أو النسخ والمشاركة.
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-50/50 dark:bg-[#1e1a17] p-4 rounded-xl border border-amber-200/50 dark:border-amber-900/30 flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#141210] text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-center shrink-0">
                      <Mic size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm sm:text-base text-amber-950 dark:text-amber-100 mb-1">البحث الصوتي والنصي</h4>
                      <p className="text-xs sm:text-sm text-amber-900/75 dark:text-amber-200/70 leading-relaxed">
                        ابحث باسم السورة أو بجزء من الآية نصياً أو صوتياً مع إمكانية تشغيل التلاوة مباشرة بالقارئ الذي تختاره.
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-50/50 dark:bg-[#1e1a17] p-4 rounded-xl border border-amber-200/50 dark:border-amber-900/30 flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#141210] text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-center shrink-0">
                      <Monitor size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm sm:text-base text-amber-950 dark:text-amber-100 mb-1">المصحف والتجويد الملون</h4>
                      <p className="text-xs sm:text-sm text-amber-900/75 dark:text-amber-200/70 leading-relaxed">
                        تصفح السور مع تفعيل أحكام التجويد الملونة، اختيار التفسير أو الترجمة، وتعديل نوع الخط وحجمه من الإعدادات.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-amber-950 dark:text-amber-100">اختصارات ونصائح</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-amber-50/40 dark:bg-amber-900/15 rounded-xl border border-amber-200/40 dark:border-amber-900/30">
                    <p className="text-sm font-bold text-amber-950 dark:text-amber-100 mb-1">تغيير الخط والحجم</p>
                    <p className="text-xs text-amber-900/70 dark:text-amber-200/65">من قائمة الإعدادات يمكنك ضبط حجم الخط واختيار الخط المريح للقراءة.</p>
                  </div>
                  <div className="p-3.5 bg-amber-50/40 dark:bg-amber-900/15 rounded-xl border border-amber-200/40 dark:border-amber-900/30">
                    <p className="text-sm font-bold text-amber-950 dark:text-amber-100 mb-1">الوضع الليلي والنهاري</p>
                    <p className="text-xs text-amber-900/70 dark:text-amber-200/65">بدّل بين الوضع النهاري والليلي أو التلقائي من شريط الأدوات العلوي.</p>
                  </div>
                  <div className="p-3.5 bg-amber-50/40 dark:bg-amber-900/15 rounded-xl border border-amber-200/40 dark:border-amber-900/30">
                    <p className="text-sm font-bold text-amber-950 dark:text-amber-100 mb-1">المحفوظات</p>
                    <p className="text-xs text-amber-900/70 dark:text-amber-200/65">احفظ أي آية بنقرة على النجمة للعودة إليها لاحقاً من تبويب المحفوظات.</p>
                  </div>
                  <div className="p-3.5 bg-amber-50/40 dark:bg-amber-900/15 rounded-xl border border-amber-200/40 dark:border-amber-900/30">
                    <p className="text-sm font-bold text-amber-950 dark:text-amber-100 mb-1">البحث السريع (Ctrl+K)</p>
                    <p className="text-xs text-amber-900/70 dark:text-amber-200/65">انتقل فوراً إلى خانة البحث القرآني في أي وقت باستخدام الاختصار.</p>
                  </div>
                </div>
              </section>

              <div className="bg-amber-50/70 dark:bg-amber-900/15 p-5 rounded-2xl text-center border border-amber-200/50 dark:border-amber-900/30">
                <p className="text-xl sm:text-2xl font-bold text-amber-900 dark:text-amber-100 mb-1.5 font-quran">
                  «خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ»
                </p>
                <p className="text-xs sm:text-sm text-amber-800/70 dark:text-amber-200/70">
                  نسأل الله أن ينفع بهذا العمل ويجعله خالصاً لوجهه الكريم.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
