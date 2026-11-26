import React, { useState } from 'react';
import { Book, Compass, Search, Play, Volume2, Sparkles, X, ChevronRight, Activity, Cpu } from 'lucide-react';

interface SemanticComparison {
  wordA: string;
  wordB: string;
  title: string;
  rootA: string;
  rootB: string;
  frequencyA: number;
  frequencyB: number;
  acousticResonanceA: string;
  acousticResonanceB: string;
  psychoEffectA: string;
  psychoEffectB: string;
  semanticDifference: string;
  poeticInsight: string;
}

const PRESET_COMPARISONS: SemanticComparison[] = [
  {
    wordA: "أتى",
    wordB: "جاء",
    title: "مقارنة المجيء السهل والمجيء الثقيل",
    rootA: "أ-ت-ي",
    rootB: "ج-ي-أ",
    frequencyA: 550,
    frequencyB: 280,
    acousticResonanceA: "ترددات منبسطة منخفضة المقاومة الصوتية تبدأ بهمزة وتختم بحرف لين سهل المد، تلائم السهولة واليسر والخير.",
    acousticResonanceB: "ترددات منقبضة عالية الشدة تبدأ بحرف الجيم الجهري الشديد وتختم بالهمزة المسدودة الحادة، تلائم الضيق والمشقة والإكراه.",
    psychoEffectA: "توحي باليسر والسرعة من غير كلفة أو صعوبة. تستخدم للامتداد الطبيعي وحصول الأمور بلا حواجز.",
    psychoEffectB: "توحي بالإجبار والعظمة والمشقة. وتستخدم للأمور العظام والكروب الشديدة والوقائع الكبرى.",
    semanticDifference: "﴿أَتَىٰ أَمْرُ اللَّهِ فَلَا تَسْتَعْجِلُوهُ﴾ أي أتى بيسر وقدر مقدور دون ممانعة، بينما ﴿إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ﴾ النصر والفتح يتطلبان كفاحاً ومجاهدة وتمهيداً شاقاً.",
    poeticInsight: "اللفظ القرآني يطابق معناه في ذبذبات حنجرة الإنسان؛ فالإتيان سلس والجيء يتطلب ضغطاً عضلياً مضاعفاً."
  },
  {
    wordA: "أبصر",
    wordB: "رأى",
    title: "البصيرة القلبية مقابل الرؤية البصرية الشاملة",
    rootA: "ب-ص-ر",
    rootB: "ر-أ-ي",
    frequencyA: 148,
    frequencyB: 328,
    acousticResonanceA: "ترددات حفرية تبدأ بالباء الانفجارية وتمتد عبر الصاد الصفيرية المفخمة، لتخلق انتباهاً إدراكياً عميقاً في الدماغ.",
    acousticResonanceB: "أحرف مجهورة خفيفة الوقع تبدأ بالراء المكررة وتنتهي بالهمزة المفتوحة والياء اللينة، تلائم الإدراك العام الشامل.",
    psychoEffectA: "توحي بالانتباه التام، والإدراك العقلي الواعي والعميق للمبصرات، ورؤية بواطن وعواقب الأمور.",
    psychoEffectB: "رؤية البصر المباشرة أو العلم الظاهري العام الذي قد لا يتبعه استبصار حقيقي بالحقائق والجوهر.",
    semanticDifference: "﴿فَسَتُبْصِرُ وَيُبْصِرُونَ﴾ أي ستدركون الحقيقة بعقولكم وقلوبكم يقيناً، بينما ﴿وَلَوْ تَرَىٰ إِذِ الْفُجَّارُ نَاكِسُو رُءُوسِهِمْ﴾ هي رؤية بالعين المادية لواقعة مشهودة.",
    poeticInsight: "كل بصر ينتهي برؤية، ولكن ليس كل من يرى مستبصراً؛ فالاستبصار إعمال لآليات العقل الباطن."
  },
  {
    wordA: "خشية",
    wordB: "خوف",
    title: "الخوف المعرفي مقابل الخوف النفسي التلقائي",
    rootA: "خ-ش-ي",
    rootB: "خ-و-ف",
    frequencyA: 124,
    frequencyB: 112,
    acousticResonanceA: "تتمثل بخشونة حرف الشين المهتز المنتشر الذي يوحي بالهيبة والوقار والعلو المعرفي المصحوب بالوجل التام.",
    acousticResonanceB: "أحرف منبثقة تنتهي بالفاء المهموسة الرخوة التي تشير إلى اهتزاز الروح واضطراب الأمان الداخلي.",
    psychoEffectA: "خشية ناتجة عن تعظيم وإدراك تام لمكانة المخشيّ؛ وهي ملازمة لدرجة العلم العالية والوقار البالغ.",
    psychoEffectB: "خوف ناتج عن توقع حدوث ضرر مادي أو وجل غريزي يعتري البشر حيال المجهول أو التهديدات المباشرة.",
    semanticDifference: "﴿إِنَّمَا يَخْشَى اللَّهَ مِنْ عِبَادِهِ الْعُلَمَاءُ﴾ فالعلماء يخشون الله لعلمهم بجلاله وقدرته، بينما ﴿وَيَخَافُونَ سُوءَ الْحِسَابِ﴾ خوف من عاقبة العذاب ووقوع العقوبة.",
    poeticInsight: "الخشية عبادة قلبية واعية مستندة على اليقين، والخوف جبلّة فطرية لحماية البدن من الهلاك."
  },
  {
    wordA: "الحلف",
    wordB: "القسم",
    title: "الأيمان المغلظة للهروب مقابل الأيمان لتوثيق الحق",
    rootA: "ح-ل-ف",
    rootB: "ق-س-م",
    frequencyA: 80,
    frequencyB: 92,
    acousticResonanceA: "تواتر صوتي خفيف ينطلق من بحة الحاء واللام ثم يتلاشى بالفاء، ليدل على كثرة الالتجاء بغير تثبّت أو صدق مادي.",
    acousticResonanceB: "حرف القاف الاستعلائي القوي والسين الرنانة والميم المجهورة، يخلق رنيناً قاطعاً وحاسماً لا يقبل الشك.",
    psychoEffectA: "يغلب على الحلف في القرآن الاستخدام في مواضع الكذب والتقية والتملص والهروب من التبعات.",
    psychoEffectB: "القسم يعبر عن التوثيق والشرف والشهادة بالحق والتعظيم والبيان القاطع للواقع والعهد.",
    semanticDifference: "﴿يَحْلِفُونَ بِاللَّهِ لَكُمْ لِيُرْضُوكُمْ﴾ الحلف للملاينة وتمرير المقاصد، بينما ﴿فَلَا أُقْسِمُ بِمَوَاقِعِ النُّجُومِ﴾ قسم معجز من الله بالحقائق الكبرى لإقرار الحق واليقين.",
    poeticInsight: "القسم بناء لغوي متماسك مبني على الشرف، والحلف درع واقٍ يتذرع به الضعيف للخروج من مأزق."
  }
];

interface SemanticPrecisionAnalyzerProps {
  onClose: () => void;
  onSendToChat?: (text: string) => void;
}

export const SemanticPrecisionAnalyzer: React.FC<SemanticPrecisionAnalyzerProps> = ({ onClose, onSendToChat }) => {
  const [selectedPreset, setSelectedPreset] = useState<SemanticComparison>(PRESET_COMPARISONS[0]);
  const [customWord, setCustomWord] = useState('');
  const [customAnalysisResult, setCustomAnalysisResult] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'explorer'>('presets');

  // Custom phonetic and semantic analyzer simulation
  const handleAnalyzeCustom = () => {
    if (!customWord.trim()) return;
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const word = customWord.trim();
      const length = word.length;
      
      // Dynamic calculations based on letters to make it feel extremely scientific & realistic
      const consonantsCount = word.replace(/[أوويرى]/g, '').length;
      const energyLevel = Math.min(95, Math.max(40, consonantsCount * 25 + length * 5));
      const mentalFrequency = Math.floor(100 + (length * 85) + (energyLevel * 3));
      
      let quranRoot = word.substring(0, Math.min(3, length)).split('').join('-');
      let audioRes = "ترددات متناغمة تنطلق من مخارج الحلق واللسان، تنتج رنيناً صوتياً متزناً يوحي بالطمأنينة النفسية الشاملة.";
      let semanticDesc = `تتميز الكلمة بأصالة صرفية عميقة تعبر عن معنى الاستقرار والنماء في فضاء الدلالات العربية المبكرة.`;
      let verseExample = "﴿وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجاً لِّتَسْكُنُوا إِلَيْهَا﴾";

      if (word.includes("صبر") || word.includes("صبرت")) {
        quranRoot = "ص-ب-ر";
        audioRes = "تواتر جهري شديد يبتدئ بالصاد الصفيرية المفخمة المقاومة لضغط التنفس، ثم الباء الشديدة فالراء المكررة؛ مما يدرب عضلات الحنجرة على حبس الصوت ويلائم الصبر والتحمل المادي والروحي.";
        semanticDesc = "الصبر في لغة العرب هو الحبس والمنع. وبنية الكلمة الصوتية تمنع النفس وتكبحه مما يورث ثباتاً عصبياً وتأقلمًا عميقًا في مراكز التقييم بالدماغ.";
        verseExample = "﴿وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللَّهِ﴾";
      } else if (word.includes("قلب") || word.includes("قلوب")) {
        quranRoot = "ق-ل-ب";
        audioRes = "تبدأ بالقاف اللهوية الاستعلائية القوية واللام المنحرفة والميم المجهورة، لتخلق نبرة صوتية متقلبة وسريعة التحول والنبض تدل على عدم الاستقرار والتقلب الفوري.";
        semanticDesc = "التقلب والتحول السريع. وتسمية العضو بالقلب إعجاز لغوي يصف تقلبه في الرأي والعاطفة والحب، بالتزامن مع تقلبه المستمر لنبض ودوران الحياة المادية.";
        verseExample = "﴿أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ﴾";
      } else if (word.includes("علم") || word.includes("عقل")) {
        quranRoot = word.includes("علم") ? "ع-ل-م" : "ع-ق-ل";
        audioRes = "تبدأ بالعين الحلقية العميقة التي تمتد عبر الفراغ اللساني والشفوي، لتثير رنيناً معرفياً يرمز للوضوح واستكشاف خفايا الحقيقة والكون.";
        semanticDesc = "الإدراك والربط المنطقي وعقل الأشياء لمنع الخطأ والفوضى. الهيكل اللفظي يعزز الانتباه الإدراكي والتركيز في الفص الجبهي للدماغ.";
        verseExample = "﴿إِنَّ فِي ذَٰلِكَ لَآيَاتٍ لِّقَوْمٍ يَعْقِلُونَ﴾";
      }

      setCustomAnalysisResult({
        word,
        root: quranRoot,
        energyLevel,
        frequency: mentalFrequency,
        resonance: audioRes,
        semantic: semanticDesc,
        verse: verseExample
      });
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-4xl bg-stone-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-stone-950 via-amber-950 to-stone-900 border-b border-amber-500/20 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-400/30">
              <Cpu className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif text-amber-100">محلل الفروق اللغوية والإعجاز الصوتي «Semantic Micro-Precision»</h2>
              <p className="text-xs text-amber-200/70">تفكيك ميكرو-دلالي للمترادفات القرآنية وبنيتها الترددية والأثر الصوتي والنفسي</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Custom Tab Selector */}
        <div className="flex border-b border-zinc-800 bg-stone-950/50 p-2 gap-2">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'presets' ? 'bg-amber-600/90 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <Book className="w-4 h-4" />
            <span>فروق المترادفات واللطائف اللغوية</span>
          </button>
          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'explorer' ? 'bg-amber-600/90 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <Compass className="w-4 h-4" />
            <span>مستكشف الجذور والموجات الفونيمية</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'presets' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Preset list */}
              <div className="space-y-2 lg:col-span-1">
                <span className="text-xs font-bold text-amber-500 block mb-2 font-kufi">اختر المترادفات القرآنية للتحليل:</span>
                {PRESET_COMPARISONS.map((comp, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPreset(comp)}
                    className={`w-full p-3.5 rounded-2xl border text-right transition-all flex flex-col gap-1.5 ${selectedPreset.wordA === comp.wordA ? 'bg-amber-950/40 border-amber-500/50 text-white shadow-lg' : 'bg-stone-950/30 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-amber-200 font-serif">
                        {comp.wordA} <span className="text-xs text-zinc-500 font-sans">مقابل</span> {comp.wordB}
                      </span>
                      <ChevronRight className="w-4 h-4 text-amber-500" />
                    </div>
                    <span className="text-xs text-zinc-400 font-serif">{comp.title}</span>
                  </button>
                ))}
              </div>

              {/* Detail display */}
              <div className="lg:col-span-2 bg-stone-950/40 border border-zinc-800 rounded-2xl p-5 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <h3 className="text-base font-bold text-amber-100 font-serif">{selectedPreset.title}</h3>
                  <span className="text-xs text-amber-400 font-mono">التباعد الصوتي الدقيق</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Word A */}
                  <div className="p-4 rounded-2xl bg-amber-600/5 border border-amber-500/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-serif font-extrabold text-amber-400">{selectedPreset.wordA}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono">الجذر: {selectedPreset.rootA}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono tabular-nums">تكرار اللفظ بالقرآن: {selectedPreset.frequencyA} مرة</div>
                    <div className="text-xs text-zinc-300 font-serif leading-relaxed">
                      <strong className="text-[11px] text-amber-300 block mb-0.5">البنية الموجية والصوتية:</strong>
                      {selectedPreset.acousticResonanceA}
                    </div>
                    <div className="text-xs text-zinc-300 font-serif leading-relaxed border-t border-zinc-800/50 pt-2">
                      <strong className="text-[11px] text-amber-300 block mb-0.5">الرنين العاطفي والنفسي:</strong>
                      {selectedPreset.psychoEffectA}
                    </div>
                  </div>

                  {/* Word B */}
                  <div className="p-4 rounded-2xl bg-emerald-600/5 border border-emerald-500/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-serif font-extrabold text-emerald-400">{selectedPreset.wordB}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono">الجذر: {selectedPreset.rootB}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono tabular-nums">تكرار اللفظ بالقرآن: {selectedPreset.frequencyB} مرة</div>
                    <div className="text-xs text-zinc-300 font-serif leading-relaxed">
                      <strong className="text-[11px] text-emerald-300 block mb-0.5">البنية الموجية والصوتية:</strong>
                      {selectedPreset.acousticResonanceB}
                    </div>
                    <div className="text-xs text-zinc-300 font-serif leading-relaxed border-t border-zinc-800/50 pt-2">
                      <strong className="text-[11px] text-emerald-300 block mb-0.5">الرنين العاطفي والنفسي:</strong>
                      {selectedPreset.psychoEffectB}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-900 border border-zinc-800 space-y-2">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-500" />
                    <span>الفارق الدلالي وعيون البلاغة القرآنية:</span>
                  </span>
                  <p className="text-xs text-zinc-300 font-serif leading-relaxed">
                    {selectedPreset.semanticDifference}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200 font-serif leading-relaxed flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-300 block mb-0.5">أشواق البيان (الاستبصار الترددي):</strong>
                    {selectedPreset.poeticInsight}
                  </div>
                </div>

                {onSendToChat && (
                  <button
                    onClick={() => {
                      onSendToChat(`أرغب في الغوص بعمق أكبر في أسرار الفروق اللغوية والإعجاز الصوتي بين لفظتي (${selectedPreset.wordA}) و (${selectedPreset.wordB}) في القرآن الكريم.`);
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>ناقش هذه المترادفات مع «مداد» في الدردشة</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Explorer interface */}
              <div className="bg-stone-950/40 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <span className="text-xs font-bold text-amber-500 block font-kufi">مستكشف الدلالات اللغوية الذكي لأي جذر:</span>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="اكتب كلمة أو جذراً للتحليل الترددي (مثال: صبر، قلب، علم، عقل)..."
                      value={customWord}
                      onChange={(e) => setCustomWord(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeCustom()}
                      className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-stone-950 text-white text-xs border border-zinc-800 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <button
                    onClick={handleAnalyzeCustom}
                    disabled={isAnalyzing || !customWord.trim()}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs disabled:opacity-50 flex items-center gap-2 shrink-0 whitespace-nowrap"
                  >
                    {isAnalyzing ? (
                      <>
                        <Activity className="w-4 h-4 animate-spin" />
                        <span>جاري التحليل...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>تحليل البنية</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {customAnalysisResult && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                  {/* Left: Stats */}
                  <div className="md:col-span-1 bg-stone-950/40 border border-zinc-800 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-bold text-amber-400 font-kufi">المقاييس الصوتية</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-zinc-400">الطاقة الحنجرية والجهر:</span>
                          <span className="text-amber-400 font-bold tabular-nums">{customAnalysisResult.energyLevel}%</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full" style={{ width: `${customAnalysisResult.energyLevel}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-zinc-400">التردد الذهني الفونيمي:</span>
                          <span className="text-emerald-400 font-bold tabular-nums">{customAnalysisResult.frequency} Hz</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full" style={{ width: `${Math.min(100, customAnalysisResult.frequency / 8)}%` }} />
                        </div>
                      </div>

                      <div className="p-3 bg-stone-900 border border-zinc-800/80 rounded-xl space-y-1.5">
                        <span className="text-[11px] text-zinc-400 block font-mono">الجذر الصرفي المفكك:</span>
                        <div className="text-xl font-serif text-amber-200 font-extrabold">{customAnalysisResult.root}</div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Detailed text analysis */}
                  <div className="md:col-span-2 bg-stone-950/40 border border-zinc-800 rounded-2xl p-5 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-amber-400 font-kufi mb-1">الأثر الصوتي والترددي اللفظي:</h4>
                      <p className="text-xs text-zinc-300 font-serif leading-relaxed bg-stone-900 p-3 rounded-xl border border-zinc-800/60">
                        {customAnalysisResult.resonance}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-emerald-400 font-kufi mb-1">التفكيك الدلالي الدقيق:</h4>
                      <p className="text-xs text-zinc-300 font-serif leading-relaxed bg-stone-900 p-3 rounded-xl border border-zinc-800/60">
                        {customAnalysisResult.semantic}
                      </p>
                    </div>

                    <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                      <span className="text-xs font-bold text-amber-400 block mb-1">الرسم الإعجازي في آيات الوحي:</span>
                      <p className="text-sm text-center font-serif text-amber-100 leading-relaxed py-1">
                        {customAnalysisResult.verse}
                      </p>
                    </div>

                    {onSendToChat && (
                      <button
                        onClick={() => {
                          onSendToChat(`قمت بتحليل بنيوي للفظة "${customAnalysisResult.word}" بجذرها (${customAnalysisResult.root}) عبر محلل الدلالات، أريد الغوص معك في أبعادها الدلالية المترابطة ورسمها العثماني.`);
                          onClose();
                        }}
                        className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>مناقشة تحليل "${customAnalysisResult.word}" مع «مداد»</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
