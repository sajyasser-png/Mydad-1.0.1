import { useState, useEffect } from 'react';
import { Volume2, Square, Heart, Search, Copy, Share2, Sparkles, Loader2 } from 'lucide-react';
import { ReadAloud } from './ReadAloud';
import { generateDua } from '../services/aiService';
import { safeLocalStorageGet, safeLocalStorageSet } from '../lib/utils';

interface Dua {
  id: number | string;
  title: string;
  arabic: string;
  translation: string;
  source: string;
  category: string;
}

const DUAS: Dua[] = [
  {
    id: 1,
    category: 'أذكار الصباح',
    title: 'سيد الاستغفار',
    arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ.',
    translation: 'O Allah, You are my Lord, none has the right to be worshipped except You, You created me and I am Your servant and I abide to Your covenant and promise as best I can, I take refuge in You from the evil which I have committed. I acknowledge Your favour upon me and I acknowledge my sin, so forgive me, for verily none can forgive sin except You.',
    source: 'صحيح البخاري'
  },
  {
    id: 2,
    category: 'أذكار المساء',
    title: 'دعاء الكرب',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ السَّمَواتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ.',
    translation: 'There is no deity but Allah, the Great, the Forbearing. There is no deity but Allah, Lord of the Magnificent Throne. There is no deity but Allah, Lord of the heavens and Lord of the earth and Lord of the Noble Throne.',
    source: 'صحيح البخاري ومسلم'
  },
  {
    id: 3,
    category: 'الاستغفار والتوبة',
    title: 'دعاء يونس عليه السلام',
    arabic: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ.',
    translation: 'None has the right to be worshipped but You (O Allah), Glorified (and Exalted) are You (above all that they associate with You). Truly, I have been of the wrong-doers.',
    source: 'جامع الترمذي'
  },
  {
    id: 4,
    category: 'الحماية والتحصين',
    title: 'الاستعاذة من الهم والحزن',
    arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ، وَغَلَبَةِ الرِّجَالِ.',
    translation: 'O Allah, I take refuge in You from anxiety and sorrow, weakness and laziness, miserliness and cowardice, the burden of debts and from being overpowered by men.',
    source: 'صحيح البخاري'
  },
  {
    id: 5,
    category: 'أذكار الصباح',
    title: 'بسم الله الذي لا يضر مع اسمه شيء',
    arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاء وَهُوَ السَّمِيعُ الْعَلِيمُ.',
    translation: 'In the Name of Allah, Who with His Name nothing can cause harm in the earth nor in the heavens, and He is the All-Hearing, the All-Knowing.',
    source: 'سنن أبي داود والترمذي'
  },
  {
    id: 6,
    category: 'أذكار النوم',
    title: 'باسمك ربي وضعت جنبي',
    arabic: 'بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ.',
    translation: 'In Your name my Lord, I lie down and in Your name I rise, so if You should take my soul then have mercy upon it, and if You should return my soul then protect it in the manner You do for Your righteous servants.',
    source: 'صحيح البخاري ومسلم'
  },
  {
    id: 7,
    category: 'أذكار النوم',
    title: 'اللهم قني عذابك',
    arabic: 'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ.',
    translation: 'O Allah, protect me from Your punishment on the day You resurrect Your servants.',
    source: 'سنن أبي داود والترمذي'
  },
  {
    id: 8,
    category: 'أذكار المساء',
    title: 'أمسينا وأمسى الملك لله',
    arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ.',
    translation: 'We have reached the evening and at this very time unto Allah belongs all sovereignty, and all praise is for Allah. None has the right to be worshipped except Allah, alone, without partner, to Him belongs all sovereignty and praise and He is over all things omnipotent.',
    source: 'صحيح مسلم'
  },
  {
    id: 9,
    category: 'أذكار الصباح',
    title: 'اللهم بك أصبحنا',
    arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ.',
    translation: 'O Allah, by You we enter the morning and by You we enter the evening, by You we live and by You we die, and to You is the Final Return.',
    source: 'سنن الترمذي'
  },
  {
    id: 10,
    category: 'أذكار المساء',
    title: 'اللهم بك أمسينا',
    arabic: 'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ.',
    translation: 'O Allah, by You we enter the evening and by You we enter the morning, by You we live and by You we die, and to You is the final return.',
    source: 'سنن الترمذي'
  },
  {
    id: 11,
    category: 'أذكار النوم',
    title: 'آية الكرسي',
    arabic: 'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۚ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ.',
    translation: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer of [all] existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is [presently] before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills. His Kursi extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great.',
    source: 'سورة البقرة - آية 255'
  },
  {
    id: 12,
    category: 'تيسير الأمور',
    title: 'دعاء تيسير الأمور',
    arabic: 'اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا، وَأَنْتَ تَجْعَلُ الْحَزَنَ إِذَا شِئْتَ سَهْلًا.',
    translation: 'O Allah, there is no ease except in that which You have made easy, and You make the difficulty, if You wish, easy.',
    source: 'صحيح ابن حبان'
  },
  {
    id: 13,
    category: 'طلب العلم',
    title: 'دعاء طلب العلم',
    arabic: 'رَبِّ زِدْنِي عِلْمًا.',
    translation: 'My Lord, increase me in knowledge.',
    source: 'سورة طه - آية 114'
  },
  {
    id: 14,
    category: 'الوالدين',
    title: 'دعاء الوالدين',
    arabic: 'رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا.',
    translation: 'My Lord, forgive me and my parents and have mercy on them as they brought me up when I was small.',
    source: 'سورة الإسراء - آية 24'
  },
  {
    id: 15,
    category: 'طلب الرزق',
    title: 'دعاء الرزق',
    arabic: 'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ.',
    translation: 'O Allah, suffice me with what You have allowed instead of what You have forbidden, and make me independent of all others besides You.',
    source: 'جامع الترمذي'
  },
  {
    id: 16,
    category: 'الثبات على الدين',
    title: 'دعاء الثبات',
    arabic: 'يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ.',
    translation: 'O Turner of the hearts, keep my heart firm upon Your religion.',
    source: 'جامع الترمذي'
  }
];

export const DuaSection = ({ speakText, stopSpeaking, isSpeaking }: { speakText: (t: string) => void, stopSpeaking: () => void, isSpeaking: boolean }) => {
  const [search, setSearch] = useState(() => safeLocalStorageGet('dua_search_draft') || '');
  const [activeDua, setActiveDua] = useState<number | string | null>(null);
  const [duaOfTheDay, setDuaOfTheDay] = useState<Dua | null>(null);
  const [isGeneratingDua, setIsGeneratingDua] = useState(false);

  useEffect(() => {
    safeLocalStorageSet('dua_search_draft', search);
  }, [search]);

  const fetchDuaOfTheDay = async () => {
    setIsGeneratingDua(true);
    try {
      const generated = await generateDua('gemini');
      setDuaOfTheDay({
        id: Date.now(),
        ...generated,
        category: 'دعاء اليوم'
      });
    } catch (e) {
      console.error("Failed to generate dua:", e);
    } finally {
      setIsGeneratingDua(false);
    }
  };

  useEffect(() => {
    fetchDuaOfTheDay();
  }, []);

  const getCurrentTimeCategory = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'أذكار الصباح';
    if (hour >= 12 && hour < 17) return 'الاستغفار والتوبة';
    if (hour >= 17 && hour < 22) return 'أذكار المساء';
    return 'أذكار النوم';
  };

  const timeCategory = getCurrentTimeCategory();

  const allDuas = duaOfTheDay ? [duaOfTheDay, ...DUAS] : DUAS;

  const filteredDuas = allDuas.filter(d => 
    (d.title && typeof d.title === 'string' && d.title.includes(search)) || 
    (d.arabic && typeof d.arabic === 'string' && d.arabic.includes(search)) || 
    (d.category && typeof d.category === 'string' && d.category.includes(search))
  ).sort((a, b) => {
    if (a.category === 'دعاء اليوم') return -1;
    if (b.category === 'دعاء اليوم') return 1;
    if (a.category === timeCategory && b.category !== timeCategory) return -1;
    if (a.category !== timeCategory && b.category === timeCategory) return 1;
    return 0;
  });

  const handleRandomDua = () => {
    const randomDua = allDuas[Math.floor(Math.random() * allDuas.length)];
    setSearch(randomDua.title);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/95 dark:bg-[#171412]/95 p-5 sm:p-6 rounded-2xl border border-amber-200/50 dark:border-amber-900/40 shadow-sm">
        <div className="text-right">
          <h2 className="text-2xl sm:text-3xl font-bold text-amber-950 dark:text-amber-50 font-kufi">الأدعية المأثورة</h2>
          <p className="text-xs sm:text-sm text-amber-800/70 dark:text-amber-300/70 mt-1">من صحيح السنة النبوية والمصادر الموثوقة</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={fetchDuaOfTheDay}
            disabled={isGeneratingDua}
            className="h-10 inline-flex items-center gap-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors active:scale-95 font-semibold text-xs sm:text-sm disabled:opacity-50 whitespace-nowrap"
          >
            {isGeneratingDua ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
            <span>دعاء اليوم</span>
          </button>
          <button
            onClick={handleRandomDua}
            className="h-10 inline-flex items-center gap-2 px-4 bg-amber-700 hover:bg-amber-800 text-white rounded-xl transition-colors active:scale-95 font-semibold text-xs sm:text-sm whitespace-nowrap"
          >
            <Sparkles size={16} />
            <span>دعاء عشوائي</span>
          </button>
        </div>
      </div>

      <div className="relative max-w-2xl mx-auto">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-600/70 dark:text-amber-400/70 pointer-events-none">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="ابحث عن دعاء بالاسم أو المحتوى..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pr-11 pl-4 py-3 bg-white/95 dark:bg-[#171412]/95 rounded-xl shadow-sm border border-amber-200/60 dark:border-amber-900/50 text-base text-amber-950 dark:text-amber-50 font-medium text-right focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-colors placeholder:text-amber-900/40 dark:placeholder:text-amber-100/35"
          dir="rtl"
          lang="ar"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {filteredDuas.map((dua) => (
          <div
            key={dua.id}
            className="bg-white/95 dark:bg-[#171412]/95 p-5 sm:p-6 rounded-2xl shadow-sm border border-amber-200/50 dark:border-amber-900/40 flex flex-col justify-between gap-4 transition-colors hover:border-amber-300/70 dark:hover:border-amber-800/60"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-700/80 dark:text-amber-400/80">
                    <span>{dua.category}</span>
                    {dua.category === timeCategory && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">مناسب للوقت الحالي</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-amber-950 dark:text-amber-50 leading-snug">{dua.title}</h3>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <ReadAloud
                    text={dua.arabic}
                    buttonClassName="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800/50 transition-colors"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(dua.arabic)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800/50 transition-colors"
                    title="نسخ الدعاء"
                  >
                    <Copy size={15} />
                  </button>
                  {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                    <button
                      onClick={() => navigator.share({
                        title: dua.title,
                        text: `${dua.arabic}\n\n${dua.translation}`,
                      }).catch(console.error)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800/50 transition-colors"
                      title="مشاركة الدعاء"
                    >
                      <Share2 size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (isSpeaking && activeDua === dua.id) {
                        stopSpeaking();
                        setActiveDua(null);
                      } else {
                        speakText(dua.arabic);
                        setActiveDua(dua.id);
                        window.dispatchEvent(new CustomEvent('log_spiritual_event', {
                          detail: {
                            content: `قرأت دعاء: ${dua.title}`,
                            icon: '🤲',
                            type: 'dua'
                          }
                        }));
                      }
                    }}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isSpeaking && activeDua === dua.id ? 'bg-amber-700 text-white' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800/50'}`}
                    title={isSpeaking && activeDua === dua.id ? 'إيقاف' : 'استماع'}
                  >
                    {isSpeaking && activeDua === dua.id ? <Square size={15} /> : <Volume2 size={15} />}
                  </button>
                </div>
              </div>

              <p className="text-2xl sm:text-3xl font-quran leading-[2.1] text-right text-amber-950 dark:text-amber-50" dir="rtl">
                {dua.arabic}
              </p>
            </div>

            <div className="pt-4 border-t border-amber-100/80 dark:border-amber-900/30 space-y-3">
              <div className="flex items-start gap-3">
                <p className="text-sm sm:text-base text-amber-900/75 dark:text-amber-200/70 italic leading-relaxed flex-1 text-left" dir="ltr">
                  {dua.translation}
                </p>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => navigator.clipboard.writeText(dua.translation)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-50/80 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors"
                    title="نسخ الترجمة"
                  >
                    <Copy size={14} />
                  </button>
                  <ReadAloud text={dua.translation} lang="en-US" buttonClassName="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-50/80 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-amber-800/65 dark:text-amber-300/60 font-medium">
                <Heart size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span>المصدر: {dua.source}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
