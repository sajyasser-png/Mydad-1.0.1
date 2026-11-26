import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Settings2, Moon, Sun, Share2, Copy } from 'lucide-react';
import { ReadAloud } from './ReadAloud';

const NAMES_OF_ALLAH = [
  "الرحمن", "الرحيم", "الملك", "القدوس", "السلام", "المؤمن", "المهيمن", "العزيز", "الجبار", "المتكبر",
  "الخالق", "البارئ", "المصور", "الغفار", "القهار", "الوهاب", "الرزاق", "الفتاح", "العليم", "القابض",
  "الباسط", "الخافض", "الرافع", "المعز", "المذل", "السميع", "البصير", "الحكم", "العدل", "اللطيف",
  "الخبير", "الحليم", "العظيم", "الغفور", "الشكور", "العلي", "الكبير", "الحفيظ", "المقيت", "الحسيب",
  "الجليل", "الكريم", "الرقيب", "المجيب", "الواسع", "الحكيم", "الودود", "المجيد", "الباعث", "الشهيد",
  "الحق", "الوكيل", "القوي", "المتين", "الولي", "الحميد", "المحصي", "المبدئ", "المعيد", "المحيي",
  "المميت", "الحي", "القيوم", "الواجد", "الماجد", "الواحد", "الأحد", "الصمد", "القادر", "المقتدر",
  "المقدم", "المؤخر", "الأول", "الآخر", "الظاهر", "الباطن", "الوالي", "المتعالي", "البر", "التواب",
  "المنتقم", "العفو", "الرؤوف", "مالك الملك", "ذو الجلال والإكرام", "المقسط", "الجامع", "الغني", "المغني", "المانع",
  "الضار", "النافع", "النور", "الهادي", "البديع", "الباقي", "الوارث", "الرشيد", "الصبور"
];

const TASBIH_PHRASES = [
  "سبحان الله", "سبحان الله وبحمده", "سبحان الله العظيم", "سبحان الله وبحمده عدد خلقه",
  "سبحان الله وبحمده رضا نفسه", "سبحان الله وبحمده زنة عرشه", "سبحان الله وبحمده مداد كلماته",
  "سبحان الله الملك القدوس", "سبحان الله ذي الملكوت", "سبحان الله ذي العزة والجبروت",
  "سبحان الله ذي الكبرياء والعظمة", "سبحان الله والحمد لله", "سبحان الله بكرة وأصيلاً",
  "سبحان الله العلي العظيم", "سبحان الله رب العالمين", "سبحان الله رب العرش العظيم",
  "سبحان الله عدد ما خلق", "سبحان الله ملء ما خلق", "سبحان الله عدد ما في الأرض والسماء",
  "سبحان الله ملء ما في الأرض والسماء", "سبحان الله عدد ما أحصى كتابه", "سبحان الله ملء ما أحصى كتابه",
  "سبحان الله عدد كل شيء", "سبحان الله ملء كل شيء", "سبحان الملك القدوس", "سبحان ذي الجبروت والملكوت",
  "سبحان ذي العزة والقدرة", "سبحان الله وبحمده في كل وقت", "سبحان الله وبحمده في كل حين",
  "سبحان الله وبحمده أبد الأبدين", "سبحان الله وبحمده دائم الأيام", "سبحان الله وبحمده عدد الرمل والحصى",
  "سبحان الله وبحمده عدد قطر المطر", "سبحان الله وبحمده عدد ورق الشجر", "سبحان الله وبحمده عدد ما أظلم عليه الليل",
  "سبحان الله وبحمده عدد ما أشرق عليه النهار", "سبحان الله وبحمده عدد أنفاس الخلائق", "سبحان الله وبحمده عدد ما سبح به المسبحون",
  "سبحان الله وبحمده عدد ما غفل عن ذكره الغافلون", "سبحان الله وبحمده عدد كلمات ربي", "سبحان الله وبحمده ملء ميزان ربي",
  "سبحان الله وبحمده منتهى علم ربي", "سبحان الله وبحمده مبلغ ثناء ربي", "سبحان الله وبحمده عدد خلقه ورضا نفسه",
  "سبحان الله وبحمده زنة عرشه ومداد كلماته", "سبحان الله وبحمده في السموات والأرض", "سبحان الله وبحمده في البر والبحر",
  "سبحان الله وبحمده في الدنيا والآخرة", "سبحان الله وبحمده في كل لمحة ونفس", "سبحان الله وبحمده عدد ما وسعه علم الله",
  "سبحان الله وبحمده ملء ما وسعه علم الله", "سبحان الله وبحمده عدد ما جرى به القلم", "سبحان الله وبحمده ملء ما جرى به القلم",
  "سبحان الله وبحمده عدد ما كان وما يكون", "سبحان الله وبحمده عدد الحركات والسكون", "سبحان الله وبحمده عدد الذرات والمجرات",
  "سبحان الله وبحمده عدد النجوم والكواكب", "سبحان الله وبحمده عدد البحار والأنهار", "سبحان الله وبحمده عدد الجبال والتلال",
  "سبحان الله وبحمده عدد الطيور والحيوانات", "سبحان الله وبحمده عدد النباتات والأزهار", "سبحان الله وبحمده عدد البشر والملائكة",
  "سبحان الله وبحمده عدد الجن والشياطين", "سبحان الله وبحمده عدد ما في الجنة والنار", "سبحان الله وبحمده عدد ما في اللوح المحفوظ",
  "سبحان الله وبحمده عدد ما في العرش والكرسي", "سبحان الله وبحمده عدد ما في السموات السبع", "سبحان الله وبحمده عدد ما في الأرضين السبع",
  "سبحان الله وبحمده عدد ما في المشرق والمغرب", "سبحان الله وبحمده عدد ما في الشمال والجنوب", "سبحان الله وبحمده عدد ما في الماضي والحاضر",
  "سبحان الله وبحمده عدد ما في المستقبل والأزل", "سبحان الله وبحمده عدد ما في الأبد والخلود", "سبحان الله وبحمده عدد ما في الغيب والشهادة",
  "سبحان الله وبحمده عدد ما في السر والعلن", "سبحان الله وبحمده عدد ما في القلوب والصدور", "سبحان الله وبحمده عدد ما في العقول والأفكار",
  "سبحان الله وبحمده عدد ما في الأرواح والنفوس", "سبحان الله وبحمده عدد ما في الوجود والعدم", "سبحان الله وبحمده عدد ما في الحق والباطل",
  "سبحان الله وبحمده عدد ما في النور والظلمة", "سبحان الله وبحمده عدد ما في الخير والشر", "سبحان الله وبحمده عدد ما في الرحمة والعذاب",
  "سبحان الله وبحمده عدد ما في النعيم والجحيم", "سبحان الله وبحمده عدد ما في الدنيا الفانية", "سبحان الله وبحمده عدد ما في الآخرة الباقية",
  "سبحان الله وبحمده عدد ما في ملك الله الواسع", "سبحان الله وبحمده عدد ما في قدرة الله العظيمة", "سبحان الله وبحمده عدد ما في مشيئة الله النافذة",
  "سبحان الله وبحمده عدد ما في حكمة الله البالغة", "سبحان الله وبحمده عدد ما في عدل الله المطلق", "سبحان الله وبحمده عدد ما في فضل الله العميم",
  "سبحان الله وبحمده عدد ما في جود الله الوافر", "سبحان الله وبحمده عدد ما في كرم الله الواسع", "سبحان الله وبحمده عدد ما في حلم الله العظيم",
  "سبحان الله وبحمده عدد ما في عفو الله الشامل", "سبحان الله وبحمده عدد ما في ستر الله الجميل", "سبحان الله وبحمده عدد ما في لطف الله الخفي"
];

const ISTIGHFAR_PHRASES = [
  "أستغفر الله", "أستغفر الله العظيم", "أستغفر الله وأتوب إليه", "أستغفر الله الذي لا إله إلا هو الحي القيوم وأتوب إليه",
  "اللهم اغفر لي", "اللهم إني ظلمت نفسي فاغفر لي", "رب اغفر لي وتب علي", "اللهم اغفر لي ولوالدي",
  "اللهم اغفر للمؤمنين والمؤمنات", "اللهم اغفر للمسلمين والمسلمات", "اللهم اغفر لي خطيئتي وجهلي", "اللهم اغفر لي ما قدمت وما أخرت",
  "اللهم اغفر لي ما أسررت وما أعلنت", "اللهم اغفر لي ما أنت أعلم به مني", "اللهم اغفر لي ذنبي كله", "اللهم اغفر لي دقه وجله",
  "اللهم اغفر لي أوله وآخره", "اللهم اغفر لي علانيته وسره", "اللهم اغفر لي ذنبي واشرح لي صدري", "اللهم اغفر لي ذنبي ويسر لي أمري",
  "اللهم اغفر لي ذنبي وطهر قلبي", "اللهم اغفر لي ذنبي وحصن فرجي", "اللهم اغفر لي ذنبي ونور قبري", "اللهم اغفر لي ذنبي وثقل ميزاني",
  "اللهم اغفر لي ذنبي وبيض وجهي", "اللهم اغفر لي ذنبي وارفع درجتي", "اللهم اغفر لي ذنبي وتقبل توبتي", "اللهم اغفر لي ذنبي وأجب دعوتي",
  "اللهم اغفر لي ذنبي واقض حاجتي", "اللهم اغفر لي ذنبي وفرج همي", "اللهم اغفر لي ذنبي واكشف غمي", "اللهم اغفر لي ذنبي ونفس كربي",
  "اللهم اغفر لي ذنبي وأصلح بالي", "اللهم اغفر لي ذنبي واهد قلبي", "اللهم اغفر لي ذنبي وسدد لساني", "اللهم اغفر لي ذنبي وبارك لي في رزقي",
  "اللهم اغفر لي ذنبي وبارك لي في عمري", "اللهم اغفر لي ذنبي وبارك لي في أهلي", "اللهم اغفر لي ذنبي وبارك لي في ولدي", "اللهم اغفر لي ذنبي وبارك لي في عملي",
  "اللهم اغفر لي ذنبي وبارك لي في علمي", "اللهم اغفر لي ذنبي وبارك لي في ديني", "اللهم اغفر لي ذنبي وبارك لي في دنياي", "اللهم اغفر لي ذنبي وبارك لي في آخرتي",
  "اللهم اغفر لي ذنبي وبارك لي في كل شأني", "أستغفر الله عدد خلقه", "أستغفر الله رضا نفسه", "أستغفر الله زنة عرشه",
  "أستغفر الله مداد كلماته", "أستغفر الله عدد ما خلق", "أستغفر الله ملء ما خلق", "أستغفر الله عدد ما في الأرض والسماء",
  "أستغفر الله ملء ما في الأرض والسماء", "أستغفر الله عدد ما أحصى كتابه", "أستغفر الله ملء ما أحصى كتابه", "أستغفر الله عدد كل شيء",
  "أستغفر الله ملء كل شيء", "أستغفر الله من كل ذنب", "أستغفر الله من كل خطيئة", "أستغفر الله من كل معصية",
  "أستغفر الله من كل زلة", "أستغفر الله من كل غفلة", "أستغفر الله من كل سيئة", "أستغفر الله من كل ما يغضب الله",
  "أستغفر الله من كل ما لا يرضي الله", "أستغفر الله من كل ما يبعد عن الله", "أستغفر الله من كل ما يحجب عن الله", "أستغفر الله من كل ما يظلم القلب",
  "أستغفر الله من كل ما يقسي القلب", "أستغفر الله من كل ما يمرض القلب", "أستغفر الله من كل ما يميت القلب", "أستغفر الله من كل ما يفسد العمل",
  "أستغفر الله من كل ما ينقص الأجر", "أستغفر الله من كل ما يذهب البركة", "أستغفر الله من كل ما يجلب النقمة", "أستغفر الله من كل ما يمنع الرحمة",
  "أستغفر الله من كل ما يقطع الصلة بالله", "أستغفر الله من كل ما يوجب سخط الله", "أستغفر الله من كل ما يستحق عقاب الله", "أستغفر الله من كل ما يخالف أمر الله",
  "أستغفر الله من كل ما يضاد شرع الله", "أستغفر الله من كل ما ينافي توحيد الله", "أستغفر الله من كل ما يخدش إيمان الله", "أستغفر الله من كل ما يضعف يقين الله",
  "أستغفر الله من كل ما يشوش فكر الله", "أستغفر الله من كل ما يشتت شمل الله", "أستغفر الله من كل ما يفرق جمع الله", "أستغفر الله من كل ما يوهن عزم الله",
  "أستغفر الله من كل ما يثبط همة الله", "أستغفر الله من كل ما يقلل خشية الله", "أستغفر الله من كل ما يذهب حياء الله", "أستغفر الله من كل ما يفسد خلق الله",
  "أستغفر الله من كل ما يضر عباد الله", "أستغفر الله من كل ما يسيء لخلق الله", "أستغفر الله من كل ما يظلم أنفسنا", "أستغفر الله من كل ما يظلم غيرنا",
  "أستغفر الله من كل ما ندمنا عليه", "أستغفر الله من كل ما سنندم عليه", "أستغفر الله دائماً وأبداً", "أستغفر الله في كل حين"
];

const TAZEEM_PHRASES = [
  "الله أكبر", "لا إله إلا الله", "لا حول ولا قوة إلا بالله", "الحمد لله حمداً كثيراً",
  "الله أكبر كبيراً", "والحمد لله كثيراً", "وسبحان الله بكرة وأصيلاً", "لا إله إلا الله وحده لا شريك له",
  "له الملك وله الحمد", "وهو على كل شيء قدير", "لا إله إلا الله الملك الحق المبين", "لا إله إلا الله العظيم الحليم",
  "لا إله إلا الله رب العرش العظيم", "لا إله إلا الله رب السموات ورب الأرض", "ورب العرش الكريم", "يا حي يا قيوم",
  "يا ذا الجلال والإكرام", "يا بديع السموات والأرض", "يا نور السموات والأرض", "يا قيوم السموات والأرض",
  "يا مالك الملك", "يا من له الأسماء الحسنى", "يا من له الصفات العلى", "يا من له الكبرياء في السموات والأرض",
  "يا من هو العلي العظيم", "يا من هو الغفور الرحيم", "يا من هو التواب الكريم", "يا من هو اللطيف الخبير",
  "يا من هو السميع البصير", "يا من هو الواحد الأحد", "يا من هو الصمد الذي لم يلد ولم يولد", "ولم يكن له كفواً أحد",
  "تعالى الله عما يشركون", "تعالى الله الملك الحق", "سبحان الله عما يصفون", "الحمد لله رب العالمين",
  "الحمد لله الذي هدانا لهذا", "الحمد لله الذي بنعمته تتم الصالحات", "الحمد لله على كل حال", "الحمد لله في السراء والضراء",
  "الحمد لله عدد خلقه", "الحمد لله رضا نفسه", "الحمد لله زنة عرشه", "الحمد لله مداد كلماته",
  "الله أكبر عدد ما خلق", "الله أكبر ملء ما خلق", "الله أكبر عدد ما في الأرض والسماء", "الله أكبر ملء ما في الأرض والسماء",
  "لا إله إلا الله عدد ما أحصى كتابه", "لا إله إلا الله ملء ما أحصى كتابه", "لا حول ولا قوة إلا بالله عدد كل شيء", "لا حول ولا قوة إلا بالله ملء كل شيء",
  "عظم الله شأنه", "جل جلاله", "تقدست أسماؤه", "تبارك اسمه",
  "وتعالى جده", "ولا إله غيره", "عز وجل", "سبحانه وتعالى",
  "ما شاء الله لا قوة إلا بالله", "حسبي الله ونعم الوكيل", "نعم المولى ونعم النصير", "توكلت على الله",
  "اعتصمت بالله", "استعنت بالله", "فوضت أمري إلى الله", "إن الله بصير بالعباد",
  "يا رب لك الحمد كما ينبغي لجلال وجهك", "ولعظيم سلطانك", "رضيت بالله رباً", "وبالإسلام ديناً",
  "وبمحمد صلى الله عليه وسلم نبياً ورسولاً", "اللهم أنت ربي لا إله إلا أنت", "خلقتني وأنا عبدك", "وأنا على عهدك ووعدك ما استطعت",
  "أعوذ بك من شر ما صنعت", "أبوء لك بنعمتك علي", "وأبوء بذنبي فاغفر لي", "فإنه لا يغفر الذنوب إلا أنت",
  "اللهم صل وسلم على نبينا محمد", "اللهم بارك على نبينا محمد", "اللهم عظم قدر نبينا محمد", "اللهم ارفع ذكر نبينا محمد",
  "يا الله يا رحمن", "يا رحيم يا ملك", "يا قدوس يا سلام", "يا مؤمن يا مهيمن",
  "يا عزيز يا جبار", "يا متكبر يا خالق", "يا بارئ يا مصور", "يا غفار يا قهار",
  "يا وهاب يا رزاق", "يا فتاح يا عليم", "يا قابض يا باسط", "يا خافض يا رافع",
  "يا معز يا مذل", "يا سميع يا بصير", "يا حكم يا عدل", "يا لطيف يا خبير",
  "يا حليم يا عظيم", "يا غفور يا شكور", "يا علي يا كبير", "يا حفيظ يا مقيت"
];

type TasbihMode = 'names' | 'tasbih' | 'istighfar' | 'tazeem';

export const TasbihSection: React.FC = () => {
  const [mode, setMode] = useState<TasbihMode>('names');
  const [count, setCount] = useState(0);
  const [shuffledList, setShuffledList] = useState<string[]>([]);
  const [currentItem, setCurrentItem] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const shuffle = (array: string[]) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const initList = useCallback((targetMode: TasbihMode) => {
    let list: string[] = [];
    switch (targetMode) {
      case 'names': list = NAMES_OF_ALLAH; break;
      case 'tasbih': list = TASBIH_PHRASES; break;
      case 'istighfar': list = ISTIGHFAR_PHRASES; break;
      case 'tazeem': list = TAZEEM_PHRASES; break;
    }
    const shuffled = shuffle(list);
    setShuffledList(shuffled);
    setCurrentItem(shuffled[0]);
    setCount(0);
  }, []);

  useEffect(() => {
    initList(mode);
  }, [mode, initList]);

  const handlePress = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    const nextCount = count + 1;
    if (nextCount >= 99) {
      // Reset or cycle
      setCount(0);
      initList(mode);
      window.dispatchEvent(new CustomEvent('log_spiritual_event', {
        detail: {
          content: `أتممت دورة تسبيح كاملة (99 مرة) في وضع ${mode === 'names' ? 'الأسماء الحسنى' : mode === 'tasbih' ? 'التسبيح' : mode === 'istighfar' ? 'الاستغفار' : 'التعظيم'}`,
          icon: '📿',
          type: 'tasbih'
        }
      }));
    } else {
      setCount(nextCount);
      setCurrentItem(shuffledList[nextCount]);
    }

    setTimeout(() => setIsAnimating(false), 300);
  };

  const reset = () => {
    initList(mode);
  };

  // Calculate rotation for sun/moon cycle
  const rotation = (count / 99) * 360;
  const isDay = count < 50;

  return (
    <div className="flex flex-col items-center justify-center py-6 sm:py-10 px-3 relative">
      {/* Header Controls */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-8 bg-white/95 dark:bg-[#171412]/95 p-4 sm:p-5 rounded-2xl border border-amber-200/50 dark:border-amber-900/40 shadow-sm">
        <div className="flex gap-1.5">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-colors ${showSettings ? 'bg-amber-700 border-amber-700 text-white' : 'bg-amber-50 dark:bg-amber-900/30 border-amber-200/50 dark:border-amber-800/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100'}`}
            title="اختر نوع الذكر"
          >
            <Settings2 size={17} />
          </button>
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              onClick={() => {
                navigator.share({
                  title: 'السبحة الإلكترونية',
                  text: currentItem,
                }).catch(console.error);
              }}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200/50 dark:border-amber-800/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100 transition-colors"
              title="مشاركة"
            >
              <Share2 size={17} />
            </button>
          )}
        </div>

        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-amber-950 dark:text-amber-50 font-kufi">السبحة الإلكترونية</h2>
          <p className="text-[11px] text-amber-700/75 dark:text-amber-300/70">
            {mode === 'names' ? 'أسماء الله الحسنى' : mode === 'tasbih' ? 'التسبيح' : mode === 'istighfar' ? 'الاستغفار' : 'التعظيم'}
          </p>
        </div>

        <button
          onClick={reset}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200/50 dark:border-amber-800/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100 transition-colors"
          title="إعادة ضبط"
        >
          <RefreshCw size={17} className={isAnimating ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Mode Selector Strip (always easy 1-tap switch or toggled) */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full max-w-xl mb-8 overflow-hidden"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-white/95 dark:bg-[#171412]/95 rounded-2xl border border-amber-200/50 dark:border-amber-900/40 shadow-sm">
              {[
                { id: 'names', label: 'الأسماء الحسنى' },
                { id: 'tasbih', label: 'تسبيح' },
                { id: 'istighfar', label: 'استغفار' },
                { id: 'tazeem', label: 'تعظيم' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setMode(m.id as TasbihMode); setShowSettings(false); }}
                  className={`py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm transition-colors ${mode === m.id ? 'bg-amber-700 text-white' : 'bg-amber-50/70 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 hover:bg-amber-100'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Responsive Tasbih Display (fits 375px+ mobile screens cleanly) */}
      <div className="relative w-[300px] h-[300px] sm:w-[340px] sm:h-[340px] flex items-center justify-center mb-12">
        <div className="absolute inset-2 rounded-full border-2 border-dashed border-amber-900/10 dark:border-amber-100/10" />

        {Array.from({ length: 33 }).map((_, i) => {
          const angle = (i / 33) * 360 + rotation;
          const isActive = i === Math.floor(count % 33);
          const radius = 136;
          return (
            <div
              key={i}
              className={`absolute w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-transform duration-200 ${isActive ? 'bg-amber-600 scale-150 z-20 ring-2 ring-white dark:ring-stone-900 shadow-md' : 'bg-amber-800/25 dark:bg-amber-200/20'}`}
              style={{
                left: `calc(50% + ${Math.cos((angle * Math.PI) / 180) * radius}px - 7px)`,
                top: `calc(50% + ${Math.sin((angle * Math.PI) / 180) * radius}px - 7px)`,
              }}
            />
          );
        })}

        <motion.div
          className="relative w-52 h-52 sm:w-60 sm:h-60 rounded-full bg-white/95 dark:bg-[#171412]/95 shadow-lg flex flex-col items-center justify-center p-6 text-center cursor-pointer border-4 border-amber-100/80 dark:border-amber-900/40 group overflow-hidden select-none"
          onClick={handlePress}
          whileTap={{ scale: 0.95 }}
        >
          <div className="absolute top-4 right-4 text-amber-500/15 dark:text-amber-300/10 pointer-events-none">
            {isDay ? <Sun size={72} /> : <Moon size={72} />}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentItem}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="z-10 flex flex-col items-center gap-3"
            >
              <h3 className="text-2xl sm:text-3xl font-bold text-amber-950 dark:text-amber-50 font-amiri leading-snug">
                {currentItem}
              </h3>

              <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                <ReadAloud
                  text={currentItem}
                  buttonClassName="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(currentItem)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors"
                  title="نسخ"
                >
                  <Copy size={14} />
                </button>
                {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                  <button
                    onClick={() => {
                      navigator.share({
                        title: 'الذكر الحكيم',
                        text: currentItem,
                      }).catch(console.error);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors"
                    title="مشاركة"
                  >
                    <Share2 size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <div className="absolute -bottom-5 bg-amber-800 dark:bg-amber-700 text-white px-5 py-1.5 rounded-xl font-bold text-lg shadow-md tabular-nums flex items-baseline gap-1.5 z-30">
          <span>{count + 1}</span>
          <span className="text-xs opacity-70">/ 99</span>
        </div>
      </div>

      <p className="text-center text-amber-900/60 dark:text-amber-200/50 text-xs sm:text-sm max-w-md">
        انقر على الدائرة للتسبيح؛ تتجدد الأذكار تلقائياً دون تكرار حتى اكتمال الدورة.
      </p>
    </div>
  );
};
