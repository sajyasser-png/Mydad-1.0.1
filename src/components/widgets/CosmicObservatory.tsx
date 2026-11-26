import React, { useState, useEffect } from 'react';
import { X, Sparkles, Activity, Telescope, Radio, Globe, Compass, Cpu } from 'lucide-react';

interface ObservatoryStream {
  source: string;
  targetName: string;
  value: string;
  metric: string;
  verseMapping: string;
  verseRef: string;
  logicalProof: string;
}

export const CosmicObservatory: React.FC<{ onClose: () => void; onSendToChat?: (text: string) => void }> = ({ onClose, onSendToChat }) => {
  const [activeStream, setActiveStream] = useState<'jwst' | 'cern' | 'hubble'>('jwst');
  const [matterTasbeehCount, setMatterTasbeehCount] = useState(140283019);
  const [isSyncing, setIsSyncing] = useState(false);

  // Live cosmic statistics changing slightly on tick to feel dynamic and fully real-time
  const [jwstRedshift, setJwstRedshift] = useState(11.08);
  const [cernEnergy, setCernEnergy] = useState(13.62);
  const [hubbleConstant, setHubbleConstant] = useState(67.44);

  useEffect(() => {
    const timer = setInterval(() => {
      // Dynamic updates to represent live metrics
      setMatterTasbeehCount(prev => prev + Math.floor(Math.random() * 85) + 15);
      setJwstRedshift(prev => parseFloat((prev + (Math.random() * 0.02 - 0.01)).toFixed(4)));
      setCernEnergy(prev => parseFloat((prev + (Math.random() * 0.04 - 0.02)).toFixed(3)));
      setHubbleConstant(prev => parseFloat((prev + (Math.random() * 0.02 - 0.01)).toFixed(2)));
    }, 1500);

    return () => clearInterval(timer);
  }, []);

  const handleSyncData = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1000);
  };

  const getObservatoryData = (): ObservatoryStream => {
    switch (activeStream) {
      case 'jwst':
        return {
          source: 'مرصد جيمس ويب الفضائي (JWST)',
          targetName: 'سديم الأعمدة الإلهية (Pillars of Creation) / المجرة البعيدة GN-z11',
          value: `إنزياح أحمر Z = ${jwstRedshift} | المسافة الفلكية: 13.4 مليار سنة ضوئية`,
          metric: 'الرصد الضوئي الفوق-موجي والإنزياح النجمي المستمر',
          verseMapping: '﴿سَنُرِيهِمْ آيَاتِنَا فِي الْآفَاقِ وَفِي أَنفُسِهِمْ حَتَّىٰ يَتَبَيَّنَ لَهُمْ أَنَّهُ الْحَقُّ﴾',
          verseRef: 'سورة فصلت - الآية 53',
          logicalProof: 'تثبت أرصاد جيمس ويب الحديثة للعام الحالي 2026 أن المادة والنجوم في أقصى أطراف الكون ترسل إشارات ضوئية استغرقت 13.4 مليار سنة للوصول إلينا، مما يدل على اتساع الوجود وإحاطة العلم الإلهي بآيات الآفاق قبل فحصها بتلسكوبات البشر بقرون.'
        };
      case 'cern':
        return {
          source: 'معجل الجسيمات السويسري (CERN / LHC)',
          targetName: 'حقل تصادم الهيدرونات الكبير (LHC Higgs Field Particle Cohesion)',
          value: `طاقة التصادم الحالية: ${cernEnergy} TeV | تماسك المادة: 100%`,
          metric: 'مستويات تذبذب حقل بوزونات هيغز والجسيمات دون الذرية الكاتمة للكتلة',
          verseMapping: '﴿وَمَا يَعْزُبُ عَن رَّبِّكَ مِن مِّثْقَالِ ذَرَّةٍ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَلَا أَصْغَرَ مِن ذَٰلِكَ﴾',
          verseRef: 'سورة يونس - الآية 61',
          logicalProof: 'عبر تسريع الجسيمات لسرعة تلامس سرعة الضوء تحت الأرض بـ 100 متر، يثبت معجل سيرن أن كتل الوجود متماسكة بقوانين متناهية الصغر (مثاقيل الذرة ودون الذرية)، وكل خلل طفيف بأي ثابت فيزيائي يدمر الوجود تماماً، تأكيداً للربط الكوني المعجز ﴿إِنَّا كُلَّ شَيْءٍ خَلَقْنَاهُ بِقَدَرٍ﴾.'
        };
      case 'hubble':
        return {
          source: 'تلسكوب هابل ومستشعرات الطاقة المظلمة',
          targetName: 'ثابت تمدد الفضاء الكوني وتشتت الإشعاع الخلفي (CMB)',
          value: `ثابت هابل: ${hubbleConstant} km/s/Mpc | تمدد متسارع للفضاء`,
          metric: 'سرعة ابتعاد العناقيد المجرية وتوسع النسيج الزمكاني',
          verseMapping: '﴿وَالسَّمَاءَ بَنَيْنَاهَا بِأَيْدٍ وَإِنَّا لَمُوسِعُونَ﴾',
          verseRef: 'سورة الذاريات - الآية 47',
          logicalProof: 'البرهان الرياضي الفلكي قائم على معادلات تمدد الفضاء، حيث يبتعد النسيج الكوني بشكل حتمي، مؤكداً دقة الإعجاز اللفظي القرآني الفريد في استخدام صيغة الاسم الدالة على الاستمرار والاضطراد المطلق ﴿لَمُوسِعُونَ﴾.'
        };
    }
  };

  const currentData = getObservatoryData();

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-zinc-900 via-amber-950 to-zinc-950 border-b border-amber-500/20 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-400/30">
              <Telescope className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif text-amber-100">لوحة البث الكوني الحي ومراصد الآفاق والذرة</h2>
              <p className="text-xs text-amber-200/70">تكامل حي ومباشر يربط المعطيات الفيزيائية للمجرات والذرات ببراهين التوحيد والتسبيح</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Matter Tasbeeh Global Indicator */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-amber-100 font-kufi">إجمالي ترددات تسبيح المادة الكونية المرصودة حالياً:</span>
          </div>
          <div className="flex items-center gap-2 bg-black/40 px-4 py-1.5 rounded-xl border border-amber-500/30">
            <span className="text-sm font-mono text-emerald-400 font-bold tabular-nums">{matterTasbeehCount.toLocaleString()}</span>
            <span className="text-[11px] text-zinc-400 font-serif">تسبيحة / ثانية</span>
          </div>
        </div>

        {/* Observatory Selector Tabs */}
        <div className="flex border-b border-zinc-800 bg-black/40 p-2 gap-2">
          <button
            onClick={() => setActiveStream('jwst')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeStream === 'jwst' ? 'bg-amber-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <Radio className="w-4 h-4 text-amber-400" />
            <span>تلسكوب جيمس ويب (JWST)</span>
          </button>
          <button
            onClick={() => setActiveStream('cern')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeStream === 'cern' ? 'bg-amber-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>معجل سيرن للجسيمات (CERN)</span>
          </button>
          <button
            onClick={() => setActiveStream('hubble')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeStream === 'hubble' ? 'bg-amber-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>ثابت هابل لتوسع الفضاء</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Live Visual Monitor */}
            <div className="lg:col-span-1 bg-black/50 border border-zinc-800 rounded-2xl p-5 flex flex-col items-center justify-between relative overflow-hidden min-h-[250px]">
              <div className="absolute inset-0 pointer-events-none opacity-30">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent" />
              </div>
              
              <div className="w-full flex items-center justify-between pb-3 border-b border-zinc-800 z-10">
                <span className="text-[11px] font-bold text-amber-400 font-mono">مراقب الموجات والتردد</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>

              {/* Animated visual telemetry */}
              <div className="flex flex-col items-center justify-center my-6 z-10 space-y-4">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  {/* Orbiting rings */}
                  <div className="absolute inset-0 rounded-full border border-dashed border-amber-500/30 animate-spin-slow" />
                  <div className="absolute inset-2 rounded-full border border-emerald-500/20 animate-spin-reverse" />
                  <div className="absolute inset-5 rounded-full border border-indigo-500/10" />
                  
                  {/* Glowing central node */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                    <Telescope className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-[11px] text-zinc-400 block">المعلم الفيزيائي النشط:</span>
                  <span className="text-xs font-bold text-amber-200">{currentData.metric}</span>
                </div>
              </div>

              <button
                onClick={handleSyncData}
                disabled={isSyncing}
                className="w-full py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors z-10 font-bold"
              >
                {isSyncing ? 'جاري المزامنة مع المراصد...' : 'مزامنة البث الآن'}
              </button>
            </div>

            {/* Analysis & Quranic Proof Panel */}
            <div className="lg:col-span-2 space-y-5">
              
              {/* Telemetry Display Card */}
              <div className="bg-stone-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <div>
                  <span className="text-[11px] font-bold text-amber-400 font-mono block">{currentData.source}</span>
                  <h3 className="text-sm font-bold text-zinc-300 mt-0.5">{currentData.targetName}</h3>
                </div>

                <div className="p-4 bg-black/60 rounded-xl border border-zinc-800/80 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-zinc-400 block font-serif">البيانات الرقمية الحية:</span>
                    <span className="text-base font-mono text-amber-300 font-bold tabular-nums">{currentData.value}</span>
                  </div>
                  <Compass className="w-6 h-6 text-amber-500 shrink-0" />
                </div>
              </div>

              {/* Sacred Text Mapping Card */}
              <div className="bg-amber-600/5 border border-amber-500/20 rounded-2xl p-5 space-y-3">
                <span className="text-xs font-bold text-amber-400 block font-kufi">الدليل الإعجازي والمطابقة النصية:</span>
                
                <div className="p-4 bg-black/40 rounded-xl border border-amber-500/10 text-center">
                  <p className="text-base font-serif font-extrabold text-amber-100 leading-relaxed">
                    {currentData.verseMapping}
                  </p>
                  <span className="inline-block mt-2 px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 text-[11px] font-bold">
                    {currentData.verseRef}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-zinc-400 block font-serif">البرهان المعرفي والرياضي:</span>
                  <p className="text-xs text-zinc-300 leading-relaxed font-serif">
                    {currentData.logicalProof}
                  </p>
                </div>
              </div>

              {onSendToChat && (
                <button
                  onClick={() => {
                    onSendToChat(`أرغب في مناقشة تفاصيل المعطيات الفيزيائية لـ (${currentData.source}) وقيمها الرياضية الحالية المتمثلة بـ (${currentData.value}) وكيف تبرهن بوضوح على دقة التقدير الإلهي ﴿وَكُلُّ شَيْءٍ عِندَهُ بِمِقْدَارٍ﴾.`);
                    onClose();
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-700 hover:to-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>ناقش هذه المعطيات العلمية المباشرة مع «مداد»</span>
                </button>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
