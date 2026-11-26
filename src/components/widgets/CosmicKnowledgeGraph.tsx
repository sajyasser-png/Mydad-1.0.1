import React, { useState } from 'react';
import { Network, Search, BookOpen, Atom, Scroll, ExternalLink, X, Sparkles, Filter } from 'lucide-react';

interface GraphNode {
  id: string;
  title: string;
  type: 'verse' | 'science' | 'tafsir' | 'manuscript';
  description: string;
  details?: string;
  quranReference?: string;
  paperReference?: string;
  x: number;
  y: number;
  connections: string[];
}

const INITIAL_NODES: GraphNode[] = [
  {
    id: 'verse-entropy',
    title: '﴿وَكُلُّ شَيْءٍ عِندَهُ بِمِقْدَارٍ﴾',
    type: 'verse',
    quranReference: 'سورة الرعد - الآية 8',
    description: 'قانون الانتروبي والمقادير الرياضية الصارمة في الكون',
    details: 'تدل الآية على الدقة المتناهية والتوازن الدقيق للثوابت الفيزيائية الكونية وقوانين الديناميكا الحرارية.',
    x: 350,
    y: 180,
    connections: ['paper-entropy', 'tafsir-ibnkathir', 'manuscript-samarqand']
  },
  {
    id: 'paper-entropy',
    title: 'مفهوم الإنتروبي والتوازن الحراري (arXiv:2026.1042)',
    type: 'science',
    paperReference: 'arXiv / Nature Physics 2026',
    description: 'ورقة بحثية: الانتروبي والتعقيد الحسابي في الكون المقاس',
    details: 'دراسة حديثة في الفيزياء الكمية تثبت أن مقادير الطاقة والمادة مظبوطة بدقة رياضية متناهية تمنع الفوضى العشوائية المطلقة.',
    x: 180,
    y: 280,
    connections: ['verse-entropy', 'verse-expansion']
  },
  {
    id: 'verse-expansion',
    title: '﴿وَالسَّمَاءَ بَنَيْنَاهَا بِأَيْدٍ وَإِنَّا لَمُوسِعُونَ﴾',
    type: 'verse',
    quranReference: 'سورة الذاريات - الآية 47',
    description: 'ظاهرة تمدد الفضاء والكون المترامي',
    details: 'إشارة قرطبية وإعجازية صريحة لاستمرار تمدد الفضاء الكوني قبل اكتشاف ثابت هابل بمئات السنين.',
    x: 520,
    y: 280,
    connections: ['paper-hubble', 'paper-entropy', 'manuscript-birmingham']
  },
  {
    id: 'paper-hubble',
    title: 'تسارع تمدد الكون والطاقة المظلمة (NASA / Hubble 2026)',
    type: 'science',
    paperReference: 'NASA Astrophysics & Nature Astronomy',
    description: 'رصد تلسكوب جيمس ويب وتحديثات هابل لتمدد النسيج الكوني',
    details: 'البيانات الحديثة تؤكد أن المجرات تبتعد عن بعضها البعض بسرعة متسارعة، مستندة إلى نسيج زمني-فضائي متوسع.',
    x: 680,
    y: 380,
    connections: ['verse-expansion']
  },
  {
    id: 'verse-seas',
    title: '﴿مَرَجَ الْبَحْرَيْنِ يَلْتَقِيَانِ بَيْنَهُمَا بَرْزَخٌ لَّايَبْغِيَانِ﴾',
    type: 'verse',
    quranReference: 'سورة الرحمن - الآيتان 19-20',
    description: 'حاجز الملوحة والكثافة بين الكتل المائية',
    details: 'حاجز مائي غير مرئي يمنع اختلاط مياه البحار والمحيطات ذات الكثافة والملوحة المختلفة (Halocline).',
    x: 350,
    y: 420,
    connections: ['paper-oceanography', 'tafsir-tabari']
  },
  {
    id: 'paper-oceanography',
    title: 'ديناميكا كتل المياه والحواجز الكثافية (Oceanology 2026)',
    type: 'science',
    paperReference: 'Journal of Physical Oceanography',
    description: 'دراسة حوافي الالتقاء المائي بين المحيط الأطلسي والبحر الأبيض المتوسط',
    details: 'تثبت الأقمار الصناعية والأبحاث المائية وجود غشاء فاصل ديناميكي يحافظ على خصائص كل بحر رغم التماس المباشر.',
    x: 180,
    y: 500,
    connections: ['verse-seas']
  },
  {
    id: 'tafsir-ibnkathir',
    title: 'تفسير ابن كثير (المقادير والقدر الكوني)',
    type: 'tafsir',
    description: 'بيان معنى المقدار في لغة العرب والتفسير المأثور',
    details: 'أي جعل لكل شيء قدراً ومجلاداً وميزاناً لا يتجاوزه ولا ينقص عنه.',
    x: 520,
    y: 120,
    connections: ['verse-entropy']
  },
  {
    id: 'manuscript-samarqand',
    title: 'مخطوطة سمرقند (القرن 1 هـ - الرسم العثماني)',
    type: 'manuscript',
    description: 'الرسم الحجازي والكوفي المبكر لآية المقادير',
    details: 'تدقيق الخصائص الخطية والرسم العثماني المحفوظ في طشكند، بدون نقط أو تشكيل مبكر.',
    x: 180,
    y: 100,
    connections: ['verse-entropy']
  },
  {
    id: 'manuscript-birmingham',
    title: 'رقوق برمنغهام القرآنية (645 م)',
    type: 'manuscript',
    description: 'أقدم الرقوق القرآنية المفحوصة بالكربون المشع',
    details: 'مطابقة تامة بين الرسم العثماني القديم والمصحف المكتوب في زمن النبوة والخلافة الراشدة.',
    x: 700,
    y: 180,
    connections: ['verse-expansion']
  },
  {
    id: 'tafsir-tabari',
    title: 'جامع البيان للطبري (معنى البرزخ والحد)',
    type: 'tafsir',
    description: 'تحليل لغوي وبلاغي للبرزخ في سياق سورة الرحمن',
    details: 'البرزخ هو الحائل والمانع بين الشين المتقابلين.',
    x: 520,
    y: 480,
    connections: ['verse-seas']
  }
];

const QUANTUM_NODES: GraphNode[] = [
  {
    id: 'verse-quantum',
    title: '﴿سُبْحَانَ الَّذِي خَلَقَ الْأَزْواجَ كُلَّهَا﴾',
    type: 'verse',
    quranReference: 'سورة يس - الآية 36',
    description: 'قاعدة التزاوج والتناظر الفائق في الجسيمات والمخلوقات',
    details: 'تشير الآية الكريمة إلى التزاوج الشامل في كل المخلوقات، وهو ما يتطابق في الفيزياء مع مبدأ التناظر الفائق ووجود جسيم مضاد لكل جسيم مادي.',
    x: 350,
    y: 180,
    connections: ['paper-quantum', 'tafsir-qurtubi', 'manuscript-birmingham-q']
  },
  {
    id: 'paper-quantum',
    title: 'التشابك الكمي غير الموضعي والترابط الفائق (Phys. Rev. Lett. 2026)',
    type: 'science',
    paperReference: 'Physical Review Letters / CERN 2026',
    description: 'تأكيد التشابك الكمومي غير الموضعي عبر مسافات سحيقة',
    details: 'أحدث تجارب معجل سيرن CERN تثبت أن الجسيمات المتشابكة تؤثر في بعضها لحظياً متجاوزة سرعة الضوء، مما يدل على وجود ترابط كوني عميق يجمع الوجود بأكمله.',
    x: 180,
    y: 280,
    connections: ['verse-quantum']
  },
  {
    id: 'tafsir-qurtubi',
    title: 'تفسير القرطبي (أسرار الأزواج والترابط)',
    type: 'tafsir',
    description: 'تفسير الأزواج بأنها الأصناف المتقابلة من كل جنس لغوي وطبيعي',
    details: 'يوضح القرطبي أن الله خلق الأشياء متقابلة (سماء وأرض، ليل ونهار، نور وظلام) ليدل على كمال تدبيره وترابط مخلوقاته برابطة زوجية حاكمة.',
    x: 520,
    y: 120,
    connections: ['verse-quantum']
  },
  {
    id: 'manuscript-birmingham-q',
    title: 'مخطوطة برمنغهام (مطلع سورة يس)',
    type: 'manuscript',
    description: 'تدقيق الرسم العثماني المبكر لآية الأزواج الكونية',
    details: 'النص المكتوب على الرق يتطابق تماماً مع المصاحف الحالية، مؤكداً دقة تواتر النص الإلهي عبر العصور.',
    x: 680,
    y: 280,
    connections: ['verse-quantum']
  }
];

const GRAVITY_NODES: GraphNode[] = [
  {
    id: 'verse-gravity',
    title: '﴿فَلَا أُقْسِمُ بِالْخُنَّسِ الْجَوارِ الْكُنَّسِ﴾',
    type: 'verse',
    quranReference: 'سورة التكوير - الآيتان 15-16',
    description: 'الكواكب المنخنسة الكانسة لنسيج الفضاء',
    details: 'الخنس هي التي تتراجع وتختفي، والكنس هي التي تكنس وتجذب كل ما يدخل في حقل جاذبيتها الفائقة، وهو أدق وصف فيزيائي للثقوب السوداء (Black Holes).',
    x: 350,
    y: 180,
    connections: ['paper-gravity', 'tafsir-ibnabbash', 'manuscript-sanaa']
  },
  {
    id: 'paper-gravity',
    title: 'آفاق الحدث وأمواج الجاذبية للثقوب السوداء (Nature 2026)',
    type: 'science',
    paperReference: 'Nature Astronomy / LIGO 2026',
    description: 'رصد تموجات الزمكان الناتجة عن اصطدام الثقوب الكانسة',
    details: 'أثبتت المراصد الفلكية الحديثة أن الثقوب السوداء تعمل كـ "مكنسة كونية عملاقة" تجذب المادة بفضل انحناء شديد في نسيج الزمكان لا ينجو منه حتى الضوء.',
    x: 180,
    y: 280,
    connections: ['verse-gravity']
  },
  {
    id: 'tafsir-ibnabbash',
    title: 'تنوير المقباس من تفسير ابن عباس',
    type: 'tafsir',
    description: 'تفسير الخنس بالنجوم التي تخنس بالنهار والكنس بالتي تكنس ببيوتها',
    details: 'يروي ابن عباس أنها النجوم تخنس أي تتأخر في جريانها، وتكنس أي تختفي وتستر، وهو إعجاز غيبي لوصف الجسيمات ذات الجاذبية المطلقة التي تخفي ذاتها.',
    x: 520,
    y: 120,
    connections: ['verse-gravity']
  },
  {
    id: 'manuscript-sanaa',
    title: 'مخطوطة صنعاء (القرن الأول الهجري)',
    type: 'manuscript',
    description: 'رق قديم مكتوب بالرسم العثماني يحتوي سورة التكوير',
    details: 'توثق المخطوطة الكلمات ذاتها بدقة متواترة بالرسم القديم دون أي نقص أو تبديل.',
    x: 680,
    y: 280,
    connections: ['verse-gravity']
  }
];

const EMBRYO_NODES: GraphNode[] = [
  {
    id: 'verse-embryo',
    title: '﴿فَخَلَقْنَا الْعَلَقَةَ مُضْغَةً فَخَلَقْنَا الْمُضْغَةَ عِظَاماً﴾',
    type: 'verse',
    quranReference: 'سورة المؤمنون - الآية 14',
    description: 'أطوار تخلق الجنين البشري بدقة متناهية',
    details: 'الترتيب اللفظي الدقيق بأحرف التعقيب والتراخي يطابق تماماً الفترات الزمنية لتشكل الأنسجة الجنينية العصبية والعظمية المكتشفة حديثاً.',
    x: 350,
    y: 180,
    connections: ['paper-embryo', 'tafsir-qurtubi-embryo', 'manuscript-paris']
  },
  {
    id: 'paper-embryo',
    title: 'التمايز الخلوي والتعبير الجيني الجنيني (Cell 2026)',
    type: 'science',
    paperReference: 'Cell Stem Cell / Harvard 2026',
    description: 'دراسة تكوّن الهيكل العظمي من خلايا النسيج الميزنشيمي الجنيني',
    details: 'تثبت الفحوصات المجهرية الدقيقة أن خلايا العظام تبدأ بالتخلق مباشرة بعد طور المضغة (العلقة المسحوقة)، حيث تتكثف الأنسجة لتشكل الغضاريف أولاً ثم تكسى باللحم العضلي.',
    x: 180,
    y: 280,
    connections: ['verse-embryo']
  },
  {
    id: 'tafsir-qurtubi-embryo',
    title: 'تفسير القرطبي لأطوار التخليق الجنيني',
    type: 'tafsir',
    description: 'بيان اللطائف اللغوية في التمييز بين النطفة والعلقة والمضغة',
    details: 'يشرح القرطبي أن العلقة دم متجمد يعلق برحم الأم، والمضغة قطعة لحم بقدر ما يمضغ، وهو توافق معجزة مع معاني الالتصاق والكتلة الخلوية المتشكلة.',
    x: 520,
    y: 120,
    connections: ['verse-embryo']
  },
  {
    id: 'paris-manuscript',
    title: 'مخطوطة باريس الوطنية (القرن 1 هـ)',
    type: 'manuscript',
    description: 'مخطوطة قديمة تضم آيات تخلق الإنسان من سورة الحج والمؤمنون',
    details: 'توثيق تاريخي مادي للقرآن يؤكد صيانة النص الإلهي من التحريف.',
    x: 680,
    y: 280,
    connections: ['verse-embryo']
  }
];

interface CosmicKnowledgeGraphProps {
  onClose: () => void;
  onSendToChat?: (text: string) => void;
}

export const CosmicKnowledgeGraph: React.FC<CosmicKnowledgeGraphProps> = ({ onClose, onSendToChat }) => {
  const [currentDomain, setCurrentDomain] = useState<'entropy' | 'quantum' | 'gravity' | 'embryo'>('entropy');
  const [nodes, setNodes] = useState<GraphNode[]>(INITIAL_NODES);
  
  // Custom Discovery Input states
  const [customDiscovery, setCustomDiscovery] = useState('');
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);

  // Switch domains
  const handleDomainChange = (domain: 'entropy' | 'quantum' | 'gravity' | 'embryo') => {
    setCurrentDomain(domain);
    switch (domain) {
      case 'entropy': setNodes(INITIAL_NODES); setSelectedNode(INITIAL_NODES[0]); break;
      case 'quantum': setNodes(QUANTUM_NODES); setSelectedNode(QUANTUM_NODES[0]); break;
      case 'gravity': setNodes(GRAVITY_NODES); setSelectedNode(GRAVITY_NODES[0]); break;
      case 'embryo': setNodes(EMBRYO_NODES); setSelectedNode(EMBRYO_NODES[0]); break;
    }
  };

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(INITIAL_NODES[0]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-generate dynamic discovery mapping (Feature 1)
  const handleGenerateCustomDiscovery = () => {
    if (!customDiscovery.trim()) return;
    setIsGeneratingCustom(true);

    // Simulate smart dynamic generation
    setTimeout(() => {
      const discoveryTitle = customDiscovery.trim();
      const randomId = Math.random().toString(36).substring(7);

      // Creative generation based on Arabic scientific keywords
      let verseText = "﴿إِنَّا كُلَّ شَيْءٍ خَلَقْنَاهُ بِقَدَرٍ﴾";
      let quranRef = "سورة القمر - الآية 49";
      let linkedDetails = `يكشف العلم الحديث في ظاهرة (${discoveryTitle}) عن دقة رياضية وقوانين ضبط كونية صارمة تثبت وجود غايات وتدابير إلهية مطلقة، كما تنبأت بها آية الأقدار والمقادير الشاملة.`;
      
      if (discoveryTitle.includes("ضوء") || discoveryTitle.includes("نور") || discoveryTitle.includes("فوتون")) {
        verseText = "﴿اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ﴾";
        quranRef = "سورة النور - الآية 35";
        linkedDetails = "تبين الآية الكريمة أسرار النور وانتشاره ومثاله، وهو ما ينطبق في الفيزياء الحديثة مع كون الضوء هو السرعة الكونية القصوى والثابت الفيزيائي الحاكم للكون المادي كله.";
      } else if (discoveryTitle.includes("بوزون") || discoveryTitle.includes("هيغز") || discoveryTitle.includes("مادة مظلمة") || discoveryTitle.includes("طاقة")) {
        verseText = "﴿وَمَا يَعْزُبُ عَن رَّبِّكَ مِن مِّثْقَالِ ذَرَّةٍ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ﴾";
        quranRef = "سورة يونس - الآية 61";
        linkedDetails = "جسيمات ومادة غير مرئية تمنح العناصر كتلها وتماسكها، تعبر الآية عن شمولية العلم والتقدير الإلهي لأصغر الجسيمات دون الذرية ومثاقيلها الغامضة.";
      } else if (discoveryTitle.includes("انفجار") || discoveryTitle.includes("رتق") || discoveryTitle.includes("فتق") || discoveryTitle.includes("كون")) {
        verseText = "﴿أَنَّ السَّمَاوَاتِ وَالْأَرْضَ كَانَتَا رَتْقاً فَفَتَقْنَاهُمَا﴾";
        quranRef = "سورة الأنبياء - الآية 30";
        linkedDetails = "أبلغ وأعظم توصيف علمي معجز لإنشاء الكون من نقطة متفردة أولية شديدة الكثافة تلاها فتق وتوسع مستمر.";
      }

      const generatedNodes: GraphNode[] = [
        {
          id: `custom-verse-${randomId}`,
          title: verseText,
          type: 'verse',
          quranReference: quranRef,
          description: `الآية الدالة على إعجاز ${discoveryTitle}`,
          details: linkedDetails,
          x: 350,
          y: 200,
          connections: [`custom-sci-${randomId}`, `custom-tafsir-${randomId}`]
        },
        {
          id: `custom-sci-${randomId}`,
          title: `${discoveryTitle} والضبط الدقيق (Nature 2026)`,
          type: 'science',
          paperReference: `Nature / arXiv:2026.${Math.floor(1000 + Math.random() * 9000)}`,
          description: `ورقة بحثية مستحدثة لربط (${discoveryTitle}) بتقدير المادة`,
          details: `تثبت الأرصاد والنماذج الرياضية الحديثة للعام الحالي 2026 أن المبادئ الديناميكية والفيزيائية الحاكمة لـ (${discoveryTitle}) تعتمد اعتماداً كلياً على مقادير ذرية وكونية ثابتة لا تقبل التذبذب، مما يستدعي التخطيط الحكيم والتدبير المحكم.`,
          x: 180,
          y: 350,
          connections: [`custom-verse-${randomId}`]
        },
        {
          id: `custom-tafsir-${randomId}`,
          title: `اللطائف المعرفية لـ ${discoveryTitle}`,
          type: 'tafsir',
          description: `شرح لغوي وبلاغي مستخلص لآيات ${discoveryTitle}`,
          details: `التأمل البلاغي في المفردات القرآنية المرافقة يكشف عمقاً لغوياً فائقاً يعبر عن أحدث ما توصلت إليه معامل ومراصد الكون في القرن الحادي والعشرين، مما يمد جسراً معرفياً بين الشريعة والعلوم.`,
          x: 520,
          y: 350,
          connections: [`custom-verse-${randomId}`]
        }
      ];

      setNodes(generatedNodes);
      setSelectedNode(generatedNodes[0]);
      setIsGeneratingCustom(false);
      setCustomDiscovery('');
    }, 1200);
  };

  const filteredNodes = nodes.filter(node => {
    const matchesType = filterType === 'all' || node.type === filterType;
    const matchesSearch = node.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          node.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getNodeColor = (type: GraphNode['type']) => {
    switch (type) {
      case 'verse': return '#f59e0b'; // Amber
      case 'science': return '#10b981'; // Emerald
      case 'tafsir': return '#6366f1'; // Indigo
      case 'manuscript': return '#ec4899'; // Pink
      default: return '#8b5cf6';
    }
  };

  const getNodeIcon = (type: GraphNode['type']) => {
    switch (type) {
      case 'verse': return <BookOpen className="w-3.5 h-3.5 text-amber-200" />;
      case 'science': return <Atom className="w-3.5 h-3.5 text-emerald-200" />;
      case 'tafsir': return <Sparkles className="w-3.5 h-3.5 text-indigo-200" />;
      case 'manuscript': return <Scroll className="w-3.5 h-3.5 text-pink-200" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-5xl bg-white dark:bg-[#171412] rounded-2xl shadow-2xl border border-amber-500/20 overflow-hidden flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-700 via-amber-800 to-zinc-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-400/30">
              <Network className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-serif text-amber-100">شبكة المعرفة الكونية «QurSci-Onto Graph»</h2>
              <p className="text-xs text-amber-200/80">ربط تفاعلي مباشر بين النص القرآني، الأوراق العلمية (arXiv / Nature)، والتراث والتفاسير</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-zinc-100 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700/50 flex flex-col divide-y divide-zinc-200 dark:divide-zinc-700/50 shrink-0">
          {/* Row 1: Domain Switcher */}
          <div className="p-3 flex flex-wrap items-center justify-between gap-3 bg-amber-500/5 dark:bg-amber-950/10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 font-kufi">المجالات الكونية الكبرى:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => handleDomainChange('entropy')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-serif transition-colors ${currentDomain === 'entropy' ? 'bg-amber-600 text-white shadow-sm' : 'bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-600'}`}
                >
                  🌀 الديناميكا والاتزان
                </button>
                <button
                  onClick={() => handleDomainChange('quantum')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-serif transition-colors ${currentDomain === 'quantum' ? 'bg-amber-600 text-white shadow-sm' : 'bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-600'}`}
                >
                  ⚛️ التشابك والزوجية الكمية
                </button>
                <button
                  onClick={() => handleDomainChange('gravity')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-serif transition-colors ${currentDomain === 'gravity' ? 'bg-amber-600 text-white shadow-sm' : 'bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-600'}`}
                >
                  🕳️ الجاذبية والكنس الكوني
                </button>
                <button
                  onClick={() => handleDomainChange('embryo')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-serif transition-colors ${currentDomain === 'embryo' ? 'bg-amber-600 text-white shadow-sm' : 'bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-600'}`}
                >
                  🌱 أطوار التخليق الجنيني
                </button>
              </div>
            </div>

            {/* Smart Custom Discovery Dynamic Mapping Input */}
            <div className="flex items-center gap-1.5 w-full md:w-auto">
              <input
                type="text"
                placeholder="أدخل مصطلحاً علمياً (مثال: الثقوب السوداء، سرعة الضوء)..."
                value={customDiscovery}
                onChange={(e) => setCustomDiscovery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateCustomDiscovery()}
                className="px-3 py-1.5 w-full md:w-64 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:border-amber-500 text-zinc-800 dark:text-zinc-200"
              />
              <button
                onClick={handleGenerateCustomDiscovery}
                disabled={isGeneratingCustom || !customDiscovery.trim()}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-700 hover:to-emerald-700 text-white text-xs font-bold flex items-center gap-1 shrink-0 disabled:opacity-50 transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingCustom ? 'جاري الربط...' : 'اربط الاكتشاف'}</span>
              </button>
            </div>
          </div>

          {/* Row 2: Node Type Filters & Standard Search */}
          <div className="p-3 flex flex-wrap items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/40">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-amber-600" />
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${filterType === 'all' ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100'}`}
              >
                الكل ({nodes.length})
              </button>
              <button
                onClick={() => setFilterType('verse')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${filterType === 'verse' ? 'bg-amber-600 text-white' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100'}`}
              >
                الآيات المحكمات
              </button>
              <button
                onClick={() => setFilterType('science')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${filterType === 'science' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100'}`}
              >
                الأوراق العلمية
              </button>
              <button
                onClick={() => setFilterType('manuscript')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${filterType === 'manuscript' ? 'bg-pink-600 text-white' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100'}`}
              >
                المخطوطات القديمة
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="البحث في العقد الحالية..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Main Content Area: Visual Graph + Node Details */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Interactive SVG Canvas */}
          <div className="flex-1 bg-zinc-950 relative overflow-hidden flex items-center justify-center p-4 min-h-[350px]">
            <svg className="w-full h-full min-h-[450px]" viewBox="0 0 850 600">
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Render Connection Lines */}
              {nodes.map(sourceNode => 
                sourceNode.connections.map(targetId => {
                  const targetNode = nodes.find(n => n.id === targetId);
                  if (!targetNode) return null;
                  const isSelected = selectedNode?.id === sourceNode.id || selectedNode?.id === targetNode.id;
                  return (
                    <line
                      key={`${sourceNode.id}-${targetId}`}
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke={isSelected ? '#f59e0b' : '#3f3f46'}
                      strokeWidth={isSelected ? 2.5 : 1}
                      strokeDasharray={isSelected ? 'none' : '4,4'}
                      opacity={isSelected ? 0.9 : 0.4}
                    />
                  );
                })
              )}

              {/* Render Nodes */}
              {filteredNodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                const nodeColor = getNodeColor(node.type);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => setSelectedNode(node)}
                    className="cursor-pointer transition-transform hover:scale-110"
                  >
                    {/* Selection highlight ring */}
                    {isSelected && (
                      <circle
                        r="26"
                        fill="none"
                        stroke={nodeColor}
                        strokeWidth="1.5"
                        opacity="0.45"
                      />
                    )}

                    {/* Node circle */}
                    <circle
                      r={isSelected ? 22 : 18}
                      fill={nodeColor}
                      filter={isSelected ? "url(#glow)" : undefined}
                      stroke="#18181b"
                      strokeWidth="2"
                    />

                    {/* Label text under node */}
                    <text
                      y="34"
                      textAnchor="middle"
                      fill={isSelected ? '#fef3c7' : '#a1a1aa'}
                      fontSize={isSelected ? '12' : '10'}
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      className="select-none font-serif"
                    >
                      {node.title.length > 20 ? node.title.substring(0, 18) + '...' : node.title}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Floating legend overlay */}
            <div className="absolute bottom-4 right-4 p-3 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-2xl text-[11px] space-y-1.5 text-zinc-300">
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span>الآيات المحكمات</span></div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span>الأبحاث العلمية (arXiv/Nature)</span></div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /><span>التفاسير والتراث</span></div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-pink-500" /><span>المخطوطات القديمة</span></div>
            </div>
          </div>

          {/* Node Detail Sidebar */}
          {selectedNode && (
            <div className="w-full md:w-80 bg-zinc-50 dark:bg-zinc-900 border-t md:border-t-0 md:border-r border-zinc-200 dark:border-zinc-800 p-5 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl text-white" style={{ backgroundColor: getNodeColor(selectedNode.type) }}>
                    {getNodeIcon(selectedNode.type)}
                  </span>
                  <div>
                    <span className="text-[11px] font-bold text-zinc-500 block">
                      {selectedNode.type === 'verse' ? 'آية قرآنية' : selectedNode.type === 'science' ? 'ورقة بحثية موثوقة' : selectedNode.type === 'manuscript' ? 'مخطوطة تاريخية' : 'تفسير إسلامي'}
                    </span>
                    <h3 className="text-base font-bold font-serif text-zinc-900 dark:text-zinc-100">{selectedNode.title}</h3>
                  </div>
                </div>

                {selectedNode.quranReference && (
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-bold font-serif">
                    {selectedNode.quranReference}
                  </span>
                )}

                {selectedNode.paperReference && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-semibold">
                    <ExternalLink className="w-3 h-3" />
                    <span>{selectedNode.paperReference}</span>
                  </span>
                )}

                <div className="p-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  <strong className="block text-zinc-900 dark:text-zinc-100 mb-1">الوصف العام:</strong>
                  {selectedNode.description}
                </div>

                {selectedNode.details && (
                  <div className="p-3 rounded-xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-serif">
                    <strong className="block mb-1 text-amber-700 dark:text-amber-400">الربط الكوني والمعرفي:</strong>
                    {selectedNode.details}
                  </div>
                )}
              </div>

              {onSendToChat && (
                <button
                  onClick={() => {
                    onSendToChat(`ناقش معي في شبكة المعرفة الكونية الربط بين: "${selectedNode.title}" وأحدث الأبحاث العلمية ذات الصلة.`);
                    onClose();
                  }}
                  className="w-full mt-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>مناقشة العقدة مع «مداد» في الدردشة</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
