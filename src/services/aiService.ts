import { safeLocalStorageGet, safeLocalStorageSet, parseAIJson } from "../lib/utils";

export const AI_PROVIDERS = {
  gemini: { 
    name: 'Google Gemini', 
    keyName: 'gemini_api_key', 
    baseURL: 'https://generativelanguage.googleapis.com/v1beta', 
    defaultModel: 'gemini-3-flash-preview',
    isFree: true,
    models: [
      'gemini-3-flash-preview',
      'gemini-4-hydrogen',
      'gemini-4-neon',
      'gemini-4-argon',
      'gemini-4-carbon',
      'gemini-3.8-flash',
      'gemini-3.7-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.1-flash-lite-preview',
      'gemini-3.1-pro-preview',
      'gemini-3.1-pro-preview-customtools',
      'gemma-4-31b-it',
      'gemma-4-26b-a4b-it',
      'gemini-flash-latest',
      'gemini-flash-lite-latest',
      'gemini-pro-latest',
      'gemini-robotics-er-2-preview'
    ]
  },
  groq: { 
    name: 'Groq', 
    keyName: 'groq_api_key', 
    baseURL: 'https://api.groq.com/openai/v1', 
    defaultModel: 'llama-3.3-70b-versatile',
    isFree: true,
    models: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'llama-3.1-70b-versatile',
      'llama-3.2-1b-preview',
      'llama-3.2-3b-preview',
      'llama-3.2-11b-vision-preview',
      'llama-3.2-90b-vision-preview',
      'deepseek-r1-distill-llama-70b',
      'deepseek-r1-distill-qwen-32b',
      'mixtral-8x7b-32768',
      'gemma2-9b-it'
    ]
  },
  deepseek: { 
    name: 'DeepSeek', 
    keyName: 'deepseek_api_key', 
    baseURL: 'https://api.deepseek.com/v1', 
    defaultModel: 'deepseek-chat',
    isFree: false,
    models: ['deepseek-chat', 'deepseek-reasoner']
  },
  openrouter: { 
    name: 'OpenRouter (Free Models)', 
    keyName: 'openrouter_api_key', 
    baseURL: 'https://openrouter.ai/api/v1', 
    defaultModel: 'google/gemini-2.0-flash-lite-preview-02-05:free',
    isFree: true,
    models: [
      'google/gemini-2.0-flash-lite-preview-02-05:free',
      'google/gemma-2-9b-it:free',
      'microsoft/phi-3-mini-128k-instruct:free',
      'qwen/qwen-2.5-7b-instruct:free',
      'huggingfaceh4/zephyr-7b-beta:free'
    ]
  },
  routeway: {
    name: 'Routeway (Free Models)',
    keyName: 'routeway_api_key',
    baseURL: 'https://api.routeway.ai/v1',
    defaultModel: 'step-3.5-flash:free',
    isFree: true,
    models: [
      'step-3.5-flash:free',
      'arcee-ai/trinity-large-preview:free',
      'nvidia/nemotron-3-nano-30b-a3b:free',
      'mistral/devstral-2-2512:free',
      'minimax/minimax-m2:free',
      'nvidia/nemotron-nano-9b-v2:free',
      'deepseek/r1-distill-qwen-32b:free',
      'meta/llama-3.3-70b-instruct:free',
      'meta/llama-3.2-3b-instruct:free',
      'meta/llama-3.2-1b-instruct:free',
      'meta/llama-3.1-8b-instruct:free',
      'mistral/mistral-nemo-instruct:free',
      'moonshotai/kimi-k2-0905:free',
      'openai/gpt-oss-120b:free',
      'z-ai/glm-4.5-air:free',
      'deepseek-r1:free',
      'deepseek-v3:free'
    ]
  },
  pollinations: {
    name: 'Pollinations (Free)',
    keyName: '',
    baseURL: 'https://image.pollinations.ai/prompt',
    defaultModel: 'flux',
    isFree: true,
    models: ['flux', 'flux-realism', 'flux-anime', 'flux-3d', 'turbo', 'sana']
  },
  stability: {
    name: 'Stability AI',
    keyName: 'stability_api_key',
    baseURL: 'https://api.stability.ai/v2beta',
    defaultModel: 'stable-diffusion-3.5-large',
    isFree: false,
    models: [
      'stable-diffusion-3.5-large',
      'stable-diffusion-3.5-large-turbo',
      'stable-diffusion-3.5-medium',
      'stable-diffusion-3-large',
      'stable-diffusion-3-medium',
      'stable-video-diffusion-xt-1-1',
      'stability-core'
    ]
  },
  mistral: { 
    name: 'Mistral', 
    keyName: 'mistral_api_key', 
    baseURL: 'https://api.mistral.ai/v1', 
    defaultModel: 'mistral-small-latest',
    isFree: false,
    models: [
      'mistral-small-latest',
      'mistral-medium-latest',
      'mistral-large-latest',
      'open-mistral-7b',
      'open-mixtral-8x7b'
    ]
  },
  huggingface: { 
    name: 'Hugging Face', 
    keyName: 'hf_api_key', 
    baseURL: 'https://api-inference.huggingface.co/models', 
    defaultModel: 'microsoft/DialoGPT-medium',
    isFree: true,
    models: ['microsoft/DialoGPT-medium']
  },
  edge_tts: {
    name: 'Edge TTS (Free & Fast)',
    keyName: '',
    baseURL: '/api/tts/edge',
    defaultModel: 'ar-EG-SalmaNeural',
    isFree: true,
    models: [
      'ar-EG-SalmaNeural', 'ar-EG-ShakirNeural', 
      'ar-SA-ZariyahNeural', 'ar-SA-HamedNeural',
      'ar-MA-MounaNeural', 'ar-MA-JamalNeural',
      'ar-DZ-AminaNeural', 'ar-DZ-IsmaelNeural',
      'ar-LB-LaylaNeural', 'ar-LB-RamiNeural',
      'ar-SY-AmanyNeural', 'ar-SY-LaithNeural',
      'ar-AE-FatimaNeural', 'ar-AE-HamdanNeural',
      'ar-TN-ReemNeural', 'ar-TN-HediNeural',
      'en-US-AriaNeural', 'en-US-GuyNeural',
      'en-GB-SoniaNeural', 'en-GB-RyanNeural'
    ]
  }
};

export type AIProviderKey = keyof typeof AI_PROVIDERS;


export const VOICES = (() => {
  const FIRST_NAMES = [
    'طارق', 'ليلى', 'سليم', 'بدر', 'نور', 'فجر', 'وسيم', 'زهراء', 'جلال', 'أمل',
    'رامي', 'نورة', 'حسن', 'سلمى', 'حمزة', 'لينا', 'عمر', 'مارية', 'زيد', 'هدى',
    'يحيى', 'عائشة', 'علي', 'فاطمة', 'خالد', 'سارة', 'إبراهيم', 'منى', 'يوسف', 'داليا',
    'حميد', 'رانيا', 'سامي', 'أميرة', 'فارس', 'ندى', 'كريم', 'جنى', 'ماجد', 'ليان',
    'فادي', 'أنس', 'مريم', 'بلال', 'خديجة', 'عبد الرحمن', 'رقية', 'جعفر', 'زينب', 'حذيفة',
    'سمية', 'سلمان', 'أسماء', 'سعد', 'صفية', 'مالك', 'تسنيم', 'ياسر', 'غالية', 'معاذ',
    'غيث', 'إلياس', 'أروى', 'حسام', 'ريما', 'صالح', 'منى', 'طلال', 'نادية', 'زياد'
  ];

  const STYLES = [
    'الحجازي', 'النجدي', 'الشامي', 'المصري', 'المغربي', 'العراقي', 'اليمني', 'القرطبي',
    'الأندلسي', 'الخاشع', 'الوقور', 'النديم', 'الصافي', 'الجهوري', 'الرخيم', 'العذب',
    'الوديع', 'المطمئن', 'المرشد', 'الرشيد', 'البليغ', 'التعليمي', 'الهادئ', 'السلس',
    'المرتل', 'المجود', 'السريع', 'البطيء', 'المتزن', 'المهيب', 'الرحيم', 'الودود',
    'الحكيم', 'المشرق', 'الروحي', 'الباكي', 'المنشاوي النبرة', 'الحصري الأداء', 'البنا المحاكي',
    'الندى الصافي', 'الترتيل المريح'
  ];

  const DESCRIPTIONS = [
    'نبرة هادئة تلامس القلوب، مثالية للتلاوة الطويلة وتدبر الآيات.',
    'وضوح فائق في مخارج الحروف والصفات، ممتاز لتعليم القرآن وحفظ الآيات.',
    'صوت جهوري يملأ النفس مهابة وخشوعاً عند تلاوة آيات الوعيد والوعد.',
    'ترتيل سلس ومريح للأذن، مثالي للاستماع المتواصل أثناء العمل أو الراحة.',
    'نغمة روحانية دافئة بنبرة وقورة تجمع بين السكينة والإتقان المتناهي.',
    'صوت عذب نقي كنسيم الفجر، يبعث الأمل والطمأنينة في النفس.',
    'أداء كلاسيكي فخم بنبرة مهيبة تحاكي أسلوب كبار قراء الحرمين الشريفين.',
    'صوت رقيق وهادئ جداً، ممتاز للاستماع قبل النوم أو في خلوات العبادة.',
    'قراءة حدر سريعة متزنة، ممتازة لمراجعة الحفظ اليومي وتثبيت الآيات والسور.',
    'ترتيل متقن بمخارج حروف واضحة جداً ونبرة دافئة قريبة من القلب.',
    'صوت وقور بنبرة عميقة، يجسد الخشوع والتدبر في كل كلمة وآية.',
    'صوت حيوي ممتلئ بالطاقة والنقاء، يعطي نشاطاً وحيوية أثناء الاستماع.',
    'أداء متمكن يجمع بين عذوبة الصوت وقوة النبرة، مناسب لجميع السور.',
    'نبرة مطمئنة تحمل السكينة والسلام، تريح البال وتذهب الحزن والهم.',
    'صوت خاشع يميل إلى التباكي والتدبر، يؤثر في النفوس ويزيد الخشوع.',
    'تلاوة ندية ناصعة النقاء، تبرز جمال اللحن القرآني ومخارج الحروف بدقة.',
    'أداء تقليدي عريق بروح من عبق التاريخ والقرون الأولى، يملأ الصدر إيماناً.',
    'صوت عذب انسيابي كجريان الماء، مريح للغاية ومناسب لتكرار الآيات.',
    'صوت جهوري رصين ومحكم، يبث القوة والوقار في تلاوة سور القرآن الكريم.',
    'ترتيل تعليمي متزن مع وقفات دقيقة تتيح للمستمع ترديد الآيات والتعلم.',
    'نبرة صافية ممتدة الأصوات، تناسب المقامات الروحية الهادئة والمريحة.',
    'تلاوة وقورة بنبرة متوسطة تجمع بين السرعة والتدبر، مثالية للورد اليومي.',
    'صوت عذب ذو صدى طبيعي رائع، يملأ أركان الغرفة بالبهجة والسكينة.',
    'أداء مميز بنكهة مشرقية أصيلة، يجذب الأسماع والقلوب من أول آية.',
    'نبرة دافئة ومحببة جداً للأطفال، تشجعهم على الاستماع والمحاكاة والحفظ.',
    'صوت شجي يجمع بين الرقة والقوة، يعبر عن جمال وإعجاز الكلمات القرآنية.',
    'ترتيل هادئ بمستويات صوت متزنة وبدون تذبذب، يعين على التركيز العميق.',
    'صوت وقور يناسب السور المكية وآيات القصص والتدبر العميق في الكون.',
    'تلاوة منعشة وصافية بنبرة حيوية تبث النشاط والراحة في ذات الوقت.',
    'أداء فخم ومخارج حروف ذهبية، تليق بعظمة ومكانة كلام رب العالمين.'
  ];

  const baseVoices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Aoede', 'Leda', 'Zephyr'];
  
  const voicesList = [
    { id: 'Zephyr', name: 'Zephyr', desc: 'متوازن وعصري', baseVoice: 'Zephyr' },
    { id: 'Kore', name: 'Kore', desc: 'لطيف ودافئ', baseVoice: 'Kore' },
    { id: 'Puck', name: 'Puck', desc: 'احترافي وواضح', baseVoice: 'Puck' },
    { id: 'Charon', name: 'Charon', desc: 'قوي وعميق', baseVoice: 'Charon' },
    { id: 'Fenrir', name: 'Fenrir', desc: 'رنان ومؤثر', baseVoice: 'Fenrir' },
    { id: 'Aoede', name: 'Aoede', desc: 'ناعم ومتطور', baseVoice: 'Aoede' },
    { id: 'Leda', name: 'Leda', desc: 'حيوي ونقي', baseVoice: 'Leda' },
    { id: 'Tariq', name: 'Tariq', desc: 'قوي وحكيم - مستوحى من وقار التلاوات التقليدية', baseVoice: 'Charon' },
    { id: 'Layl', name: 'Layl', desc: 'هادئ ليلي - مثالي للتلاوة الخاشعة والتأمل', baseVoice: 'Aoede' },
    { id: 'Safa', name: 'Safa', desc: 'عالي ونقي - مناسب للقراءات السريعة والواضحة', baseVoice: 'Puck' },
    { id: 'Badr', name: 'Badr', desc: 'قوي ورنان - صوت جهوري يعطي هيبة للتلاوة', baseVoice: 'Fenrir' },
    { id: 'Noor', name: 'Noor', desc: 'لطيف ودافئ - نبرة مطمئنة تلامس القلوب', baseVoice: 'Kore' },
    { id: 'Fajr', name: 'Fajr', desc: 'نقي وحيوي - بداية مشرقة ومنعشة للتلاوة', baseVoice: 'Leda' },
    { id: 'Waseem', name: 'Waseem', desc: 'احترافي - أداء منضبط ومناسب للتعليم', baseVoice: 'Puck' },
    { id: 'Zahra', name: 'Zahra', desc: 'متطور - لمسة عصرية في الأداء', baseVoice: 'Aoede' },
    { id: 'Jalal', name: 'Jalal', desc: 'عميق - صوت يملأ المكان بالخشوع', baseVoice: 'Fenrir' },
    { id: 'Amal', name: 'Amal', desc: 'مليء بالأمل - صوت يبعث الراحة والسكينة', baseVoice: 'Kore' },
    { id: 'Rami', name: 'Rami', desc: 'حيوي - أداء نشط وقوي', baseVoice: 'Charon' },
    { id: 'Noura', name: 'Noura', desc: 'ناعم - رقة في الأداء', baseVoice: 'Leda' },
    { id: 'Hassan', name: 'Hassan', desc: 'ودود - صوت قريب من القلب', baseVoice: 'Puck' },
    { id: 'Salma', name: 'Salma', desc: 'رقيق - عذوبة في التلاوة', baseVoice: 'Aoede' },
    { id: 'Hamza', name: 'Hamza', desc: 'قوي - صوت جبل ثابت', baseVoice: 'Fenrir' },
    { id: 'Lina', name: 'Lina', desc: 'صافي - نقاء عالٍ في الصوت', baseVoice: 'Kore' },
    { id: 'Omar', name: 'Omar', desc: 'وقور - هيبة وخشوع', baseVoice: 'Charon' },
    { id: 'Marya', name: 'Marya', desc: 'مؤثر - عاطفة في الأداء', baseVoice: 'Aoede' },
    { id: 'Zaid', name: 'Zaid', desc: 'رصين - أداء متزن', baseVoice: 'Puck' },
    { id: 'Huda', name: 'Huda', desc: 'مرشد - توضيح مخارج الحروف', baseVoice: 'Leda' },
    { id: 'Yahya', name: 'Yahya', desc: 'حيوي - طاقة في القراءة', baseVoice: 'Fenrir' },
    { id: 'Aisha', name: 'Aisha', desc: 'لطيف - نعومة ووضوح', baseVoice: 'Kore' },
    { id: 'Ali', name: 'Ali', desc: 'واضح - دقة في الأداء', baseVoice: 'Puck' },
    { id: 'Fatima', name: 'Fatima', desc: 'خشوع - ترتيل خاشع', baseVoice: 'Aoede' },
    { id: 'Khalid', name: 'Khalid', desc: 'رخيم - صوت مريح للأذن', baseVoice: 'Charon' },
    { id: 'Sarah', name: 'Sarah', desc: 'عذب - سلاسة في التلاوة', baseVoice: 'Kore' },
    { id: 'Ibrahim', name: 'Ibrahim', desc: 'رزين - وقار وثبات', baseVoice: 'Fenrir' },
    { id: 'Mona', name: 'Mona', desc: 'مطمئن - سكينة في الصوت', baseVoice: 'Kore' },
    { id: 'Yusuf', name: 'Yusuf', desc: 'جذاب - أداء يشد الانتباه', baseVoice: 'Zephyr' },
    { id: 'Layla', name: 'Layla', desc: 'رقيق - هدوء وسلام', baseVoice: 'Aoede' },
    { id: 'Mustafa', name: 'Mustafa', desc: 'متمكن - أداء قوي', baseVoice: 'Charon' },
    { id: 'Dalia', name: 'Dalia', desc: 'صافي - وضوح تام', baseVoice: 'Leda' },
    { id: 'Hamid', name: 'Hamid', desc: 'وديع - طمأنينة', baseVoice: 'Kore' },
    { id: 'Rania', name: 'Rania', desc: 'دافئ - عاطفة نبيلة', baseVoice: 'Aoede' },
    { id: 'Sami', name: 'Sami', desc: 'سلس - أداء انسيابي', baseVoice: 'Puck' },
    { id: 'Amira', name: 'Amira', desc: 'راقي - أداء فخم', baseVoice: 'Leda' },
    { id: 'Faris', name: 'Faris', desc: 'حماسي - قوة وشجاعة', baseVoice: 'Fenrir' },
    { id: 'Nada', name: 'Nada', desc: 'لطيف - رقة وجمال', baseVoice: 'Kore' },
    { id: 'Kareem', name: 'Kareem', desc: 'كريم - صوت سخي', baseVoice: 'Charon' },
    { id: 'Jana', name: 'Jana', desc: 'براق - إشراق في الصوت', baseVoice: 'Leda' },
    { id: 'Majid', name: 'Majid', desc: 'مهيب - جلال في القراءة', baseVoice: 'Fenrir' },
    { id: 'Layan', name: 'Layan', desc: 'ناعم - انسيابية كاملة', baseVoice: 'Aoede' },
    { id: 'Fadi', name: 'Fadi', desc: 'صريح - وضوح مباشر', baseVoice: 'Puck' }
  ];

  const generatedIds = new Set(voicesList.map(v => v.id.toLowerCase()));

  // Add Edge TTS specific voices to the main list if not already present
  const edgeVoices = [
    { id: 'edge-salma', name: 'سلمى (Edge)', desc: 'صوت مصري دافئ وواضح جداً', baseVoice: 'ar-EG-SalmaNeural', provider: 'edge_tts' },
    { id: 'edge-shakir', name: 'شاكر (Edge)', desc: 'صوت مصري وقور ومميز', baseVoice: 'ar-EG-ShakirNeural', provider: 'edge_tts' },
    { id: 'edge-zariyah', name: 'زرية (Edge)', desc: 'صوت سعودي نقي وهادئ', baseVoice: 'ar-SA-ZariyahNeural', provider: 'edge_tts' },
    { id: 'edge-hamed', name: 'حامد (Edge)', desc: 'صوت سعودي فخم ومهيب', baseVoice: 'ar-SA-HamedNeural', provider: 'edge_tts' },
    { id: 'edge-mouna', name: 'منى (Edge)', desc: 'صوت مغربي عذب وأصيل', baseVoice: 'ar-MA-MounaNeural', provider: 'edge_tts' },
    { id: 'edge-jamal', name: 'جمال (Edge)', desc: 'صوت مغربي رجولي قوي', baseVoice: 'ar-MA-JamalNeural', provider: 'edge_tts' },
    { id: 'edge-layla', name: 'ليلى (Edge)', desc: 'صوت لبناني رقيق وانسيابي', baseVoice: 'ar-LB-LaylaNeural', provider: 'edge_tts' },
    { id: 'edge-amina', name: 'أمينة (Edge)', desc: 'صوت جزائري هادئ ومطمئن', baseVoice: 'ar-DZ-AminaNeural', provider: 'edge_tts' },
  ];

  edgeVoices.forEach(v => {
    if (!generatedIds.has(v.id.toLowerCase())) {
      voicesList.push(v as any);
      generatedIds.add(v.id.toLowerCase());
    }
  });

  let index = 1;
  while (voicesList.length < 1000) {
    const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
    const style = STYLES[(index * 3) % STYLES.length];
    const baseVoice = baseVoices[(index * 7) % baseVoices.length];
    const desc = DESCRIPTIONS[(index * 13) % DESCRIPTIONS.length];

    const voiceName = `${firstName} ${style}`;
    const id = `Voice_${index}`;

    if (!generatedIds.has(id.toLowerCase())) {
      voicesList.push({
        id,
        name: voiceName,
        desc: `${desc} (صوت أساسي: ${baseVoice})`,
        baseVoice
      });
      generatedIds.add(id.toLowerCase());
    }
    index++;
  }

  return voicesList;
})();

export const isDeprecatedOrNonChatGeminiModel = (_name: string): boolean => {
  return false;
};

export const normalizeGeminiChatModel = (name?: string | null): string => {
  if (!name || typeof name !== 'string') return 'gemini-3-flash-preview';
  const trimmed = name.trim().replace(/^models\//i, '');
  if (!trimmed) {
    return 'gemini-3-flash-preview';
  }
  return trimmed;
};

export const getDynamicModelsList = (provider: AIProviderKey): string[] => {
  let models = (AI_PROVIDERS[provider] as any).models || [(AI_PROVIDERS[provider] as any).defaultModel];
  const cached = safeLocalStorageGet(`dynamic_models_${provider}`);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        models = Array.from(new Set(parsed));
      }
    } catch (e) {
      console.error("Error parsing dynamic models from localStorage:", e);
    }
  }
  
  if (provider === 'gemini') {
    const validCached = (models as string[]).filter(
      m => typeof m === 'string' && m.trim().length > 0
    );
    const merged = Array.from(new Set([...validCached, ...AI_PROVIDERS.gemini.models]));
    if (merged.includes('gemini-3-flash-preview')) {
      return ['gemini-3-flash-preview', ...merged.filter(m => m !== 'gemini-3-flash-preview')];
    }
    return merged;
  }
  
  return models as string[];
};

export const getDynamicImageModelsList = (provider: AIProviderKey): string[] => {
  if (provider === 'gemini') {
    const defaultModels = [
      'gemini-3.1-flash-lite-image',
      'gemini-nano-banana-2.1',
      'gemini-2.5-flash-image',
      'gemini-3-pro-image'
    ];
    let models = [...defaultModels];
    const cached = safeLocalStorageGet(`dynamic_models_${provider}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          models = Array.from(new Set([...defaultModels, ...parsed.filter((m: string) => m.includes('image') || m.includes('imagen'))]));
        }
      } catch (e) {
        // ignore
      }
    }
    return models;
  }
  if (provider === 'pollinations') {
    return ['flux', 'flux-realism', 'flux-anime', 'flux-3d', 'turbo', 'sana'];
  }
  if (provider === 'routeway') {
    return ['step-3.5-flash:free'];
  }
  // Fallback for other providers like openrouter
  return getDynamicModelsList(provider);
};

export const fetchAndUpdateModels = async (provider: AIProviderKey, apiKey?: string): Promise<string[]> => {
  const resolvedKey = apiKey !== undefined ? apiKey.trim() : getApiKey(provider);

  const response = await fetch(`/api/models/${provider}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ apiKey: resolvedKey })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    if (provider === 'gemini') {
      const fallbackGemini = AI_PROVIDERS.gemini.models;
      safeLocalStorageSet(`dynamic_models_gemini`, JSON.stringify(fallbackGemini));
      window.dispatchEvent(new CustomEvent('models_updated', { detail: { provider: 'gemini', models: fallbackGemini } }));
      return fallbackGemini;
    }
    throw new Error(errData.error || `خطأ من الخادم: ${response.status}`);
  }

  const data = await response.json();
  if (Array.isArray(data.models) && data.models.length > 0) {
    const mergedModels = provider === 'gemini'
      ? Array.from(new Set([
          ...(data.models.includes('gemini-3-flash-preview') ? ['gemini-3-flash-preview'] : []),
          ...data.models
        ]))
      : data.models;
    const now = Date.now();
    const updatedAt = typeof data.updatedAt === 'number' ? data.updatedAt : now;
    const nextUpdateAt = typeof data.nextUpdateAt === 'number' ? data.nextUpdateAt : (updatedAt + MODELS_REFRESH_INTERVAL_MS);
    safeLocalStorageSet(`dynamic_models_${provider}`, JSON.stringify(mergedModels));
    safeLocalStorageSet(`dynamic_models_updated_at_${provider}`, String(updatedAt));
    safeLocalStorageSet(`dynamic_models_next_update_${provider}`, String(nextUpdateAt));
    window.dispatchEvent(new CustomEvent('models_updated', { detail: { provider, models: mergedModels, updatedAt, nextUpdateAt } }));
    return mergedModels;
  }
  throw new Error("لم يتم العثور على أي نماذج نشطة لهذا المزود");
};

const MODELS_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
let lastFetchTime = 0;
let cachedResults: Record<string, string[]> | null = null;
let didInitModelUpdater = false;
let dailyModelRefreshTimer: ReturnType<typeof setTimeout> | null = null;

const isModelsCacheExpired = (provider: AIProviderKey = 'gemini'): boolean => {
  const updatedAtRaw = safeLocalStorageGet(`dynamic_models_updated_at_${provider}`);
  const nextUpdateRaw = safeLocalStorageGet(`dynamic_models_next_update_${provider}`);
  const cachedModelsRaw = safeLocalStorageGet(`dynamic_models_${provider}`);
  if (!updatedAtRaw || !cachedModelsRaw) return true;
  const now = Date.now();
  const nextUpdateAt = Number(nextUpdateRaw) || (Number(updatedAtRaw) + MODELS_REFRESH_INTERVAL_MS);
  return now >= nextUpdateAt;
};

const scheduleNextDailyModelSync = () => {
  if (typeof window === 'undefined') return;
  if (dailyModelRefreshTimer) {
    clearTimeout(dailyModelRefreshTimer);
    dailyModelRefreshTimer = null;
  }
  const updatedAtRaw = safeLocalStorageGet('dynamic_models_updated_at_gemini');
  const nextUpdateRaw = safeLocalStorageGet('dynamic_models_next_update_gemini');
  const now = Date.now();
  const nextUpdateAt = Number(nextUpdateRaw) || (updatedAtRaw ? Number(updatedAtRaw) + MODELS_REFRESH_INTERVAL_MS : now + MODELS_REFRESH_INTERVAL_MS);
  const delayMs = Math.max(60 * 1000, Math.min(MODELS_REFRESH_INTERVAL_MS, nextUpdateAt - now));

  dailyModelRefreshTimer = setTimeout(async () => {
    try {
      await fetchAllProvidersModels(true);
    } catch (err) {
      console.warn('Scheduled 24-hour model auto-update failed:', err);
    } finally {
      scheduleNextDailyModelSync();
    }
  }, delayMs);
};

export const initModelUpdater = () => {
  if (typeof window === 'undefined' || didInitModelUpdater) return;
  didInitModelUpdater = true;

  const checkAndRefreshIfNeeded = async (forceInitial: boolean = false) => {
    if (forceInitial || isModelsCacheExpired('gemini')) {
      try {
        await fetchAllProvidersModels(true);
      } catch (err) {
        console.warn('Auto-fetch all API models failed:', err);
      }
    }
    scheduleNextDailyModelSync();
  };

  // Run immediately if cache is missing/stale or has fewer than 30 Gemini models (e.g. first visit or after 24h)
  const cachedGemini = getDynamicModelsList('gemini');
  const needsImmediateSync = isModelsCacheExpired('gemini') || cachedGemini.length < 30;
  checkAndRefreshIfNeeded(needsImmediateSync);

  // Automatically re-check and save newly added models when the user opens the app again the next day
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isModelsCacheExpired('gemini')) {
      checkAndRefreshIfNeeded(true);
    }
  });
  window.addEventListener('focus', () => {
    if (isModelsCacheExpired('gemini')) {
      checkAndRefreshIfNeeded(true);
    }
  });
};

export const fetchAllProvidersModels = async (force: boolean = true): Promise<Record<string, string[]>> => {
  const now = Date.now();
  if (!force && cachedResults && (now - lastFetchTime < MODELS_REFRESH_INTERVAL_MS)) {
    return cachedResults;
  }

  const updatableProviders: AIProviderKey[] = ['gemini', 'groq', 'openrouter', 'routeway', 'deepseek', 'mistral'];
  const results: Record<string, string[]> = {};

  await Promise.all(
    updatableProviders.map(async (provider) => {
      try {
        const key = getApiKey(provider);
        const models = await fetchAndUpdateModels(provider, key);
        results[provider] = models;
      } catch (e) {
        if (provider === 'gemini') {
          const existing = getDynamicModelsList('gemini');
          results.gemini = existing.length > 0 ? existing : AI_PROVIDERS.gemini.models;
        }
        console.warn(`Failed to fetch models for ${provider}:`, e);
      }
    })
  );

  lastFetchTime = Date.now();
  cachedResults = results;
  scheduleNextDailyModelSync();
  window.dispatchEvent(new CustomEvent('models_updated', { detail: { results } }));
  return results;
};

export interface ImageGenerationConfig {
  width?: number;
  height?: number;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  seed?: number;
  model?: string;
}

export const generateImage = async (prompt: string, preferredProvider: AIProviderKey, config?: ImageGenerationConfig): Promise<string> => {
  // 1. ALWAYS use Gemini 3 to derive and refine the visual prompt description first
  const refinementMessages: AIMessage[] = [{
    role: 'user',
    content: `You are an expert prompt engineer. Rewrite the following user prompt into a rich, vivid, high-quality, and aesthetic image generation prompt.
    Follow these strict constraints:
    - No humans or faces.
    - No text, signatures, or watermarks.
    - Clean, elegant composition, safe representation.
    - Add descriptive visual details, lighting, atmosphere, and artistic texture to create a masterpiece.
    
    User prompt: "${prompt}"
    
    Return ONLY the final, polished image prompt. Nothing else.`
  }];

  let processedPrompt = prompt;
  try {
    const refinementResult = await callAIWithFailover('gemini', refinementMessages, 'gemini-3.1-flash-lite', {
      systemInstruction: "You are an expert prompt engineer for image generation."
    });
    if (refinementResult && refinementResult.content) {
      processedPrompt = refinementResult.content.trim();
    }
  } catch (e) {
    console.warn("Failed to refine prompt with Gemini 3, using original prompt:", e);
    processedPrompt = prompt;
  }
  
  // Add premium quality enhancement tokens if prompt doesn't already contain them
  const qualityTokens = ", detailed masterpiece, stunning aesthetic, high resolution, 8k, photorealistic";
  if (!processedPrompt.toLowerCase().includes("masterpiece") && !processedPrompt.toLowerCase().includes("detailed")) {
    processedPrompt = `${processedPrompt}${qualityTokens}`;
  }
  
  // Automatically truncate the visual prompt to 500 characters max
  if (processedPrompt.length > 500) {
    processedPrompt = processedPrompt.substring(0, 500);
  }

  const imageCapableProviders: AIProviderKey[] = ['gemini', 'routeway', 'pollinations', 'stability'];
  
  // Validate preferred provider for image generation
  const actualPreferred = imageCapableProviders.includes(preferredProvider) 
    ? preferredProvider 
    : 'gemini';

  let model = config?.model;
  const imageModels = getDynamicImageModelsList(actualPreferred);
  if (!model || !imageModels.includes(model)) {
    model = imageModels[0] || (AI_PROVIDERS[actualPreferred] as any)?.defaultModel;
  }

  // Directly call the provider chosen by the user (with retries for rate limits on the SAME provider)
  let attempt = 0;
  const MAX_IMAGE_RETRIES = 2;
  let lastError = null;

  while (attempt <= MAX_IMAGE_RETRIES) {
    try {
      return await generateImageWithProvider(processedPrompt, actualPreferred, { ...config, model });
    } catch (error: any) {
      lastError = error;
      const errorMessage = error.message || "";
      
      // Check for rate limiting
      if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("تجاوز حد الاستخدام")) {
        attempt++;
        if (attempt <= MAX_IMAGE_RETRIES) {
          let delay = Math.pow(2, attempt) * 2000 + Math.random() * 1000;
          const retryMatch = errorMessage.match(/retry in ([\d\.]+)s/i);
          if (retryMatch && retryMatch[1]) {
            delay = parseFloat(retryMatch[1]) * 1000 + 1000;
          }
          console.warn(`Rate limited on ${actualPreferred} for image gen. Retrying in ${delay.toFixed(0)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      console.error(`Image generation failed for ${actualPreferred} with model ${model}:`, error);
      break;
    }
  }

  // Safe fallback to Pollinations if preferred provider fails or hits quota limit
  if (actualPreferred !== 'pollinations') {
    try {
      console.warn(`Preferred provider (${actualPreferred}) failed or hit rate limit. Falling back to Pollinations...`);
      return await generateImageWithProvider(processedPrompt, 'pollinations', { ...config, model: 'flux' });
    } catch (fallbackErr) {
      console.error("Pollinations fallback failed:", fallbackErr);
    }
  }

  throw lastError || new Error(`فشل توليد الصورة باستخدام المزود المحدد (${actualPreferred}).`);
};

const generateImageWithProvider = async (prompt: string, provider: AIProviderKey, config?: ImageGenerationConfig): Promise<string> => {
  const providerConfig = AI_PROVIDERS[provider] as any;
  const model = config?.model || providerConfig.defaultModel;
  const apiKey = getApiKey(provider) || undefined;

  if (provider === 'gemini') {
    const response = await fetch('/api/gemini/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, model, prompt, config })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || response.statusText || "Gemini image generation failed.");
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('image/')) {
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }

    const text = await response.text();
    const data = parseAIJson<any>(text, null);
    if (!data) {
      // If we got a 200 OK but invalid JSON, it's weird. If we got an error, the text IS the error.
      if (!response.ok) {
        throw new Error(`Gemini image generation failed (${response.status}): ${text.substring(0, 200)}`);
      }
      throw new Error(`Invalid JSON in Gemini image (${response.status}): ${text.substring(0, 100)}`);
    }
    
    if (data.error) {
       throw new Error(data.error.message || data.error || "Unknown Gemini image error");
    }
    
    if (data.data) {
      return data.data;
    }
    throw new Error("لم يتم استلام بيانات الصورة من Gemini.");
  }

  if (provider === 'pollinations') {
    const seed = config?.seed || Math.floor(Math.random() * 1000000);
    const width = config?.width || 1024;
    const height = config?.height || 1024;
    const encodedPrompt = encodeURIComponent(prompt);
    const cleanModel = model.split(':')[0];
    // If the prompt is already highly detailed/optimized (e.g. from smart mode or is quite long),
    // we set enhance=false to prevent pollinations from scrambling it or adding weird text.
    const shouldEnhance = prompt.length < 60;
    const url = `${providerConfig.baseURL}/${encodedPrompt}?width=${width}&height=${height}&model=${cleanModel}&seed=${seed}&nologo=true&enhance=${shouldEnhance}`;
    
    return url;
  }

  if (provider === 'routeway') {
    const response = await fetch('/api/proxy/routeway', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseURL: 'https://api.routeway.ai',
        endpoint: '/v1/images/generations',
        apiKey: apiKey,
        model: model,
        prompt: prompt,
        size: `${config?.width || 1024}x${config?.height || 1024}`,
        n: 1,
        response_format: 'b64_json'
      })
    });

    const text = await response.text();
    const data = parseAIJson<any>(text, null);
    if (!data) {
      if (!response.ok) {
        throw new Error(`Routeway Error (${response.status}): ${text.substring(0, 200)}`);
      }
      throw new Error(`Routeway Error: Invalid JSON response (${response.status}): ${text.substring(0, 100)}`);
    }

    if (!response.ok) {
      const errorMessage = data?.error?.message || data?.message || data?.error || response.statusText || "Unknown Error";
      throw new Error(`Routeway Error: ${errorMessage}`);
    }

    if (data.data?.[0]?.b64_json) {
      return `data:image/png;base64,${data.data[0].b64_json}`;
    }
    if (data.data?.[0]?.url) {
      return data.data[0].url;
    }
    throw new Error("No image data received from Routeway.");
  }

  if (provider === 'stability') {
    const response = await fetch('/api/proxy/stability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseURL: providerConfig.baseURL,
        endpoint: `/v2beta/stable-image/generate/sd3`,
        apiKey: apiKey,
        model: model,
        prompt: prompt,
        aspect_ratio: config?.aspectRatio || '1:1',
        output_format: 'jpeg'
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Stability AI Error (${response.status}): ${errorText}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  throw new Error(`Provider ${provider} does not support image generation yet.`);
};

export const generateSmartPrompt = async (userInput: string, provider: AIProviderKey, model: string): Promise<string> => {
  const systemPrompt = `You are an expert Image Prompt Engineer for models like Midjourney, Flux, and DALL-E.
Your task is to transform a simple user description into a precise, concise, and professional English prompt.
Focus on lighting, composition, and key artistic details without hyperbole, over-exaggeration, or unnecessary complexity.
The prompt must be highly accurate, straightforward, and easy for image generation models to execute.
IMPORTANT:
- Keep the prompt concise, under 50 words to prevent errors or execution failures.
- Output ONLY the English prompt.
- DO NOT include any Arabic text.
- DO NOT include any conversational filler or introductions.
- If the input is in Arabic, translate the core concept to English precisely.
- Ensure the output is a single paragraph of descriptive, precise, and non-exaggerated English text.`;

  const promptModels = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.1-flash-lite-preview'];
  let lastError = null;

  for (const promptModel of promptModels) {
    try {
      const response = await callAIWithFailover('gemini', [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput }
      ], promptModel);

      let result = response.content.trim();
      // Basic cleanup to remove common AI filler if it persists
      result = result.replace(/^(Here is your prompt:|Prompt:|الوصف:)\s*/i, '');
      return result;
    } catch (err) {
      console.warn(`[SmartPrompt] Model ${promptModel} failed, trying next fallback...`, err);
      lastError = err;
    }
  }

  // Fallback to original provider & model as a last resort
  try {
    const response = await callAIWithFailover(provider, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userInput }
    ], model);
    let result = response.content.trim();
    result = result.replace(/^(Here is your prompt:|Prompt:|الوصف:)\s*/i, '');
    return result;
  } catch (err) {
    throw lastError || err;
  }
};

export const generateShortArabicSummary = async (userInput: string, provider: AIProviderKey, model: string): Promise<string> => {
  const systemPrompt = `أنت خبير في تلخيص الأوصاف البصرية.
مهمتك هي تحويل وصف المستخدم إلى جملة قصيرة ومركزة باللغة العربية الفصحى تصف الصورة.
يجب ألا تتجاوز الجملة 7 كلمات.
أعد الجملة فقط، بدون أي مقدمات أو تعليقات.`;

  const promptModels = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.1-flash-lite-preview'];
  let lastError = null;

  for (const promptModel of promptModels) {
    try {
      const response = await callAIWithFailover('gemini', [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput }
      ], promptModel);
      return response.content.trim().split(/\s+/).slice(0, 7).join(' ');
    } catch (err) {
      console.warn(`[ArabicSummary] Model ${promptModel} failed, trying next fallback...`, err);
      lastError = err;
    }
  }

  // Fallback to original provider & model
  try {
    const response = await callAIWithFailover(provider, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userInput }
    ], model);
    return response.content.trim().split(/\s+/).slice(0, 7).join(' ');
  } catch (err) {
    throw lastError || err;
  }
};

export const generateDua = async (provider: AIProviderKey): Promise<{ title: string; arabic: string; translation: string; source: string }> => {
  const systemPrompt = `أنت خبير في الأدعية المأثورة والشرعية.
مهمتك هي توليد دعاء يومي جديد، أصيل، يوافق القرآن والسنة، ويلتزم بالشرع.
يجب أن يكون الدعاء:
1. عنواناً معبراً (title).
2. نصاً عربياً فصيحاً (arabic).
3. ترجمة إنجليزية دقيقة (translation).
4. مصدراً شرعياً عاماً أو سياقاً (source).
يجب ألا تكرر أدعية سابقة.
أعد النتيجة بصيغة JSON فقط:
{
  "title": "...",
  "arabic": "...",
  "translation": "...",
  "source": "..."
}`;

  const response = await callAIWithFailover(provider, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: "أريد دعاء اليوم الجديد." }
  ]);

  try {
    const responseText = response.content.trim();
    return parseAIJson<{ title: string; arabic: string; translation: string; source: string }>(responseText, {
      title: "دعاء اليوم",
      arabic: "اللهم اجعل هذا اليوم يوماً مباركاً مليئاً بالخير والبركة.",
      translation: "O Allah, make this day a blessed day full of goodness and blessings.",
      source: "دعاء عام"
    });
  } catch (e) {
    console.error("Failed to parse generated dua:", e);
    return {
      title: "دعاء اليوم",
      arabic: "اللهم اجعل هذا اليوم يوماً مباركاً مليئاً بالخير والبركة.",
      translation: "O Allah, make this day a blessed day full of goodness and blessings.",
      source: "دعاء عام"
    };
  }
};

export type AIMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  imageUrl?: string;
  imageModel?: string;
  groundingMetadata?: any;
  thought?: string;
  isDeepResearch?: boolean;
  suggestions?: string[];
  inlineData?: { data: string, mimeType: string, filename?: string };
  attachments?: Array<{ data: string, mimeType: string, filename?: string }>;
};

export interface AIResponse {
  content: string;
  model: string;
  groundingMetadata?: any;
  thought?: string;
}

export const mergeGroundingMetadata = (prevMeta: any, nextMeta: any): any => {
  if (!nextMeta) return prevMeta;
  if (!prevMeta) return nextMeta;
  const mergedQueries = Array.from(new Set([
    ...(Array.isArray(prevMeta.webSearchQueries) ? prevMeta.webSearchQueries : []),
    ...(Array.isArray(nextMeta.webSearchQueries) ? nextMeta.webSearchQueries : [])
  ]));
  const prevChunks = Array.isArray(prevMeta.groundingChunks) ? prevMeta.groundingChunks : [];
  const nextChunks = Array.isArray(nextMeta.groundingChunks) ? nextMeta.groundingChunks : [];
  const seenUris = new Set<string>();
  const mergedChunks: any[] = [];
  for (const chunk of [...prevChunks, ...nextChunks]) {
    const uri = chunk?.web?.uri || chunk?.uri || '';
    if (uri) {
      if (seenUris.has(uri)) continue;
      seenUris.add(uri);
    }
    mergedChunks.push(chunk);
  }
  return {
    ...prevMeta,
    ...nextMeta,
    webSearchQueries: mergedQueries.length > 0 ? mergedQueries : undefined,
    groundingChunks: mergedChunks.length > 0 ? mergedChunks : undefined,
  };
};

export type AIConfig = {
  responseMimeType?: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  enableWebSearch?: boolean;
  enableDeepThinking?: boolean;
  allowProviderFallback?: boolean;
};

export const getSystemInstruction = (): string => {
  const now = new Date();
  let dateStr = "";
  try {
    dateStr = now.toLocaleDateString('ar-EG', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      timeZoneName: 'short'
    });
  } catch (e) {
    dateStr = now.toString();
  }

  return `
تعليمات هامة للنموذج:
1. تجنب التكرار: لا تكرر المعلومات التي سبق ذكرها في المحادثة أو ضمن نفس الإجابة.
2. العمق والتفصيل: استخدم خوارزميات متقدمة لتقديم شروحات معمقة ومفصلة وشاملة. تجاوز الإجابات السطحية.
3. الحفاظ على السياق: حافظ دائماً على سياق المحادثة كاملاً، حتى لو تغير النموذج. ابنِ على النقاط السابقة.
4. الدقة والضبط: قدم أوصافاً ومعلومات دقيقة ومضبوطة في جميع الأوقات.
5. الأسلوب الروحاني والعلمي: حافظ على أسلوب محترم وروحاني وعلمي يليق بتطبيق قرآني.
6. الزمن الفعلي للمستخدم: التاريخ والوقت الفعلي الحالي الآن هو: ${dateStr}. استخدم هذه المعلومة الزمنية إذا سألك المستخدم عن الوقت، التاريخ، اليوم، أو أحداث مرتبطة بالزمن الحالي لتجيب بدقة زمنية تامة وبطريقة طبيعية.
`;
};

export const enhanceMessages = (messages: AIMessage[]): AIMessage[] => {
  const instruction = getSystemInstruction().trim();
  const enhanced = messages.map(m => {
    if (m.role === 'system') {
      const contentStr = typeof m.content === 'string' ? m.content : '';
      if (contentStr.includes("تعليمات هامة للنموذج") || contentStr.includes("تجنب التكرار")) {
        return m;
      }
      return { ...m, content: `${instruction}\n\n${m.content}` };
    }
    return m;
  });
  if (!enhanced.some(m => m.role === 'system')) {
    enhanced.unshift({ role: 'system', content: instruction });
  }
  return enhanced;
};

const activeProviderKeys: Partial<Record<AIProviderKey, string>> = {};
let keyRefreshTimer: ReturnType<typeof setTimeout> | null = null;

const isPlaceholderKey = (val: string): boolean => {
  const v = val.trim();
  if (!v) return true;
  if (['undefined', 'null', 'MY_GEMINI_API_KEY'].includes(v)) return true;
  if (v.startsWith('YOUR_') || v.startsWith('MY_')) return true;
  return false;
};

export const getApiKey = (provider: AIProviderKey): string => {
  if (Object.prototype.hasOwnProperty.call(activeProviderKeys, provider)) {
    const memKey = activeProviderKeys[provider] || '';
    return isPlaceholderKey(memKey) ? '' : memKey.trim();
  }

  const providerConfig = AI_PROVIDERS[provider] as any;
  const primaryKey = providerConfig?.keyName ? safeLocalStorageGet(providerConfig.keyName) : null;
  let localKey = (primaryKey && !isPlaceholderKey(primaryKey)) ? primaryKey : '';
  if (!localKey && provider === 'gemini') {
    localKey = safeLocalStorageGet('midad_gemini_key') || '';
  }

  const trimmed = (localKey || '').trim();
  if (trimmed && !isPlaceholderKey(trimmed)) {
    activeProviderKeys[provider] = trimmed;
    return trimmed;
  }
  activeProviderKeys[provider] = '';
  return '';
};

export const setProviderApiKey = (provider: AIProviderKey, rawKey: string): string => {
  const trimmed = (rawKey || '').trim();
  const cleanKey = isPlaceholderKey(trimmed) ? '' : trimmed;
  activeProviderKeys[provider] = cleanKey;

  const providerConfig = AI_PROVIDERS[provider] as any;
  const keyName = providerConfig?.keyName;
  if (keyName) {
    safeLocalStorageSet(keyName, cleanKey);
  }
  if (provider === 'gemini') {
    safeLocalStorageSet('gemini_api_key', cleanKey);
    safeLocalStorageSet('midad_gemini_key', cleanKey);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('api_key_updated', { detail: { provider, apiKey: cleanKey } }));
    if (keyRefreshTimer) clearTimeout(keyRefreshTimer);
    keyRefreshTimer = setTimeout(() => {
      fetchAndUpdateModels(provider, cleanKey).catch(() => {});
    }, 400);
  }

  return cleanKey;
};

export const callAIWithFailover = async (preferredProvider: AIProviderKey, messages: AIMessage[], customModel?: string, config?: AIConfig): Promise<AIResponse> => {
  // Safety check for provider
  if (!preferredProvider || !AI_PROVIDERS[preferredProvider]) {
    console.warn(`Provider ${preferredProvider} not found or not specified, falling back to gemini`);
    preferredProvider = 'gemini';
  }

  const enhancedMessages = enhanceMessages(messages);

  const providers: AIProviderKey[] = [preferredProvider];
  
  // Only fall back to providers that actually have a key configured or are built-in (gemini)
  if (config?.allowProviderFallback) {
    const fallbackList: AIProviderKey[] = ['gemini', 'routeway', 'openrouter', 'groq', 'mistral'];
    for (const p of fallbackList) {
      if (!providers.includes(p) && (p === 'gemini' || !!getApiKey(p))) {
        providers.push(p);
      }
    }
  }
  
  let lastError = null;

  for (const provider of providers) {
    // Gemini server proxy handles multi-key, v1/v1beta, search fallback, and model attempts natively without client sleeps
    const maxAttempts = provider === 'gemini' ? 1 : 2;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const modelToUse = provider === preferredProvider ? customModel : undefined;
        const result = await callAI(provider, enhancedMessages, modelToUse, config);
        return result;
      } catch (error: any) {
        lastError = error;
        console.warn(`Provider ${provider} attempt ${attempt + 1} failed:`, error);
        if (attempt < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, 600));
        }
      }
    }
  }
  
  throw lastError || new Error("فشل الاتصال بالنموذج المطلوب.");
};

export const callAI = async (provider: AIProviderKey, messages: AIMessage[], customModel?: string, config?: AIConfig): Promise<AIResponse> => {
  const enhancedMessages = enhanceMessages(messages);
  const providerConfig = AI_PROVIDERS[provider] as any;
  const apiKey = getApiKey(provider);
  
  // If apiKey is empty, we proceed anyway because the server might have it in environment variables
  // The server proxy will handle the 401 if it's missing there too

  const rawRequestedModel = customModel || providerConfig.defaultModel;
  const requestedModel = provider === 'gemini' ? normalizeGeminiChatModel(rawRequestedModel) : rawRequestedModel;
  const modelsToTry = [requestedModel];
  let lastModelError = null;


  for (const model of modelsToTry) {
    try {
      if (provider === 'gemini') {
        const response = await fetch('/api/gemini/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, model, messages: enhancedMessages, config })
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || response.statusText || "Gemini text generation failed.");
        }
        const text = await response.text();
        const data = parseAIJson<any>(text, null);
        if (!data) {
          throw new Error(`Invalid JSON in Gemini text (${response.status}): ${text.substring(0, 100)}`);
        }
        if (!data.content && data.error) {
          throw new Error(data.error);
        }
        return { content: data.content || "", model: data.model || model, groundingMetadata: data.groundingMetadata, thought: data.thought };
      }

      // For OpenAI-compatible providers, combine system messages into one
      const systemMessages = enhancedMessages.filter(m => m.role === 'system');
      const otherMessages = enhancedMessages.filter(m => m.role !== 'system');
      
      if (otherMessages.length === 0) {
        otherMessages.push({ role: 'user', content: 'مرحباً' });
      }
      
      const finalMessages = [];
      const combinedSystemContent = systemMessages.map(m => m.content).join('\n\n');

      if (provider === 'routeway') {
        // Routeway might not support system messages, prepend to first user message
        if (otherMessages.length > 0 && combinedSystemContent) {
          finalMessages.push({
            role: otherMessages[0].role,
            content: `${combinedSystemContent}\n\n${otherMessages[0].content}`
          });
          finalMessages.push(...otherMessages.slice(1).map(m => ({
            role: m.role,
            content: m.content
          })));
        } else {
          finalMessages.push(...otherMessages.map(m => ({
            role: m.role,
            content: m.content
          })));
        }
      } else {
        if (combinedSystemContent) {
          finalMessages.push({
            role: 'system',
            content: combinedSystemContent
          });
        }
        finalMessages.push(...otherMessages.map(m => ({
          role: m.role,
          content: m.content
        })));
      }

      // Use proxy for all non-Gemini providers to avoid CORS and keep keys secure
      const requestBody = {
        baseURL: providerConfig.baseURL,
        apiKey: apiKey, // Pass the key (from localStorage or empty if using server-side env)
        model: model,
        messages: finalMessages,
        response_format: config?.responseMimeType === 'application/json' ? { type: 'json_object' } : undefined,
        temperature: config?.temperature,
        max_tokens: config?.maxOutputTokens
      };

      const response = await fetch(`/api/proxy/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        let message = errorText;
        try {
          const errorData = JSON.parse(errorText);
          message = errorData.error?.message || errorData.message || errorText;
        } catch (e) {
          // Not JSON
        }
        throw new Error(`خطأ من المزود ${providerConfig.name} (${response.status}): ${message}`);
      }

      const data = await response.json();
      
      // Check for provider-specific error objects even on 200 OK
      if (data.error) {
        throw new Error(`خطأ من المزود ${providerConfig.name}: ${data.error.message || JSON.stringify(data.error)}`);
      }

      if (!data.choices || data.choices.length === 0) {
        console.error(`Empty choices from ${providerConfig.name}:`, data);
        throw new Error(`استجابة غير متوقعة من المزود ${providerConfig.name}: لم يتم العثور على خيارات (choices).`);
      }
      
      const content = data.choices[0].message?.content;
      if (content === undefined || content === null) {
        throw new Error(`استجابة غير متوقعة من المزود ${providerConfig.name}: محتوى الرسالة فارغ.`);
      }
      
      return { content, model: data.model || model };
    } catch (error) {
      console.warn(`Model ${model} on ${providerConfig.name} failed:`, error);
      lastModelError = error;
      
      // If it's an authentication error (401), skip retries and move to next provider immediately
      if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string' && (error as any).message.includes('401')) {
        console.warn(`Authentication error (401) on ${providerConfig.name}, skipping provider...`);
        throw error; // This will be caught by callAIWithFailover and move to next provider
      }

      // If it's a "Provider error" from Routeway, it's likely a provider-wide issue
      // skip other models and move to the next provider
      if (provider === 'routeway' && error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string' && (error as any).message.includes('Provider error')) {
        console.warn(`Routeway provider-wide error detected, skipping to next provider...`);
        throw error;
      }

      // If we have more models to try, continue the loop
      if (modelsToTry.length > 1) {
        continue;
      }
      throw error;
    }
  }
  throw lastModelError || new Error(`فشلت جميع النماذج المتاحة لدى ${providerConfig.name}`);
};

export const callAIStream = async (provider: AIProviderKey, messages: AIMessage[], customModel?: string, config?: AIConfig, onChunk?: (chunk: string, groundingMetadata?: any, thought?: string, modelName?: string) => void): Promise<string> => {
  if (provider !== 'gemini') {
    throw new Error("Streaming is only supported for Gemini currently.");
  }

  const enhancedMessages = enhanceMessages(messages);
  const providerConfig = AI_PROVIDERS[provider] as any;
  const requestedModel = normalizeGeminiChatModel(customModel || providerConfig.defaultModel);
  const apiKey = getApiKey(provider);

  const modelsToTry = [requestedModel];
  let lastModelError = null;

  for (const model of modelsToTry) {
    try {
      const response = await fetch('/api/gemini/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, model, messages: enhancedMessages, config })
      });

      if (!response.ok) {
        let err: any = {};
        const text = await response.text();
        try { err = JSON.parse(text); } catch (e) { err = { error: text }; }
        throw new Error(err.error?.message || err.error || response.statusText || "Failed to connect to stream");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let buffer = '';
      let executedModel = requestedModel;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process full SSE messages
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n\n')) >= 0) {
          const sseMessage = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 2);
          
          if (sseMessage.startsWith('data: ')) {
            const dataStr = sseMessage.slice(6);
            if (dataStr === '[DONE]') {
              return executedModel;
            }
            
            let data;
            try {
              data = JSON.parse(dataStr);
            } catch (e) {
              // Ignore incomplete JSON
              continue;
            }
            
            if (data.model) {
              executedModel = data.model;
            }
            if (data.error) {
              throw new Error(data.error);
            }
            if (onChunk) {
              onChunk(data.text || "", data.groundingMetadata, data.thought, executedModel);
            }
          }
        }
      }
      return executedModel;
    } catch (error: any) {
      lastModelError = error;
      const msg = error.message || "";
      if (msg.includes("429") || msg.includes("503") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("high demand") || msg.includes("Too Many Requests")) {
        console.warn(`Model ${model} stream failed with quota error. Trying next...`);
        continue;
      }
      throw error;
    }
  }
  throw lastModelError || new Error("فشل الاتصال بالنموذج المطلوب.");
};

function splitTextIntoChunks(text: string, maxLength: number = 500): string[] {
  const chunks: string[] = [];
  let currentChunk = '';

  // Clean the text from markdown formatting that might confuse TTS
  const cleanText = text.replace(/[*_~`#]/g, '');
  
  // Split by sentences or newlines
  const sentences = cleanText.split(/(?<=[.?!؟\n])\s+/);

  for (const sentence of sentences) {
    if (!sentence.trim()) continue;
    
    if ((currentChunk + ' ' + sentence).length <= maxLength) {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      
      // If a single sentence is longer than maxLength, split it by words
      if (sentence.length > maxLength) {
        const words = sentence.split(' ');
        let tempChunk = '';
        for (const word of words) {
          if ((tempChunk + ' ' + word).length <= maxLength) {
            tempChunk += (tempChunk ? ' ' : '') + word;
          } else {
            if (tempChunk) chunks.push(tempChunk);
            tempChunk = word;
          }
        }
        currentChunk = tempChunk;
      } else {
        currentChunk = sentence;
      }
    }
  }
  if (currentChunk) chunks.push(currentChunk);
  
  return chunks;
}

export const generateRecitationStream = async function* (text: string, voiceName: string, apiKey?: string) {
  const foundVoice = VOICES.find(v => v.id === voiceName || v.baseVoice === voiceName);
  
  // Edge TTS Handling in Stream
  const fVoice = foundVoice as any;
  if (fVoice && fVoice.provider === 'edge_tts') {
    const chunks = splitTextIntoChunks(text, 1000); // Smaller chunks for faster start
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i].trim();
      if (!chunkText) continue;

      const response = await fetch('/api/tts/edge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: chunkText, 
          voice: foundVoice.baseVoice,
          speed: 1 
        })
      });

      if (!response.ok) throw new Error("فشل توليد الصوت عبر Edge TTS");
      
      const blob = await response.blob();
      
      // Fast base64 conversion
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          resolve(res.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      yield {
        data: base64,
        pcmData: base64,
        mimeType: blob.type || 'audio/mpeg',
        chunkIndex: i,
        totalChunks: chunks.length
      };
    }
    return;
  }

  const finalKey = (apiKey !== undefined && apiKey.trim() !== '') ? apiKey.trim() : getApiKey('gemini');
  const chunks = splitTextIntoChunks(text, 5000);
  const actualVoiceName = foundVoice ? foundVoice.baseVoice : voiceName;

  const selectedTtsModel = safeLocalStorageGet('ai_tts_model') || 'gemini-3.8-flash-lite-tts';
  const officialTtsModels = [
    'gemini-3.8-flash-lite-tts',
    'gemini-3.8-flash-tts',
    'gemini-3.1-flash-tts-preview',
    'gemini-2.5-flash-preview-tts'
  ];
  let ttsModels = [...officialTtsModels];
  if (selectedTtsModel && selectedTtsModel.includes('-tts')) {
    ttsModels = [selectedTtsModel, ...officialTtsModels.filter(m => m !== selectedTtsModel)];
  }
  let currentModelIndex = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunkText = chunks[i].trim();
    if (!chunkText) continue;
    
    let retries = ttsModels.length + 1;
    let success = false;
    let delay = 500;

    while (retries > 0 && !success) {
      try {
        const response = await fetch('/api/gemini/speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            apiKey: finalKey, 
            model: ttsModels[currentModelIndex], 
            text: chunkText, 
            voiceName: actualVoiceName 
          })
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || response.statusText);
        }
        
        const data = await response.json();
        if (!data.audioData) {
          console.warn(`No audio data received for chunk ${i + 1}`);
          retries--;
          continue;
        }
        
        const audioData = data.audioData;
        const mimeType = data.mimeType || 'audio/wav';
        
        // Decode base64 to binary
        const binaryString = atob(audioData);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let j = 0; j < len; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }

        // Check if the audio data already has a WAV header (starts with 'RIFF')
        const hasWavHeader = len >= 4 && 
                             bytes[0] === 0x52 && // R
                             bytes[1] === 0x49 && // I
                             bytes[2] === 0x46 && // F
                             bytes[3] === 0x46;   // F

        let finalBase64 = audioData;
        let finalMimeType = mimeType;

        if (!hasWavHeader) {
          // Add WAV header to each chunk so it can be played independently
          const wavHeader = new ArrayBuffer(44);
          const view = new DataView(wavHeader);
          view.setUint32(0, 0x52494646, false); // RIFF
          view.setUint32(4, 36 + len, true); // file length
          view.setUint32(8, 0x57415645, false); // WAVE
          view.setUint32(12, 0x666d7420, false); // fmt 
          view.setUint32(16, 16, true); // format chunk length
          view.setUint16(20, 1, true); // sample format (raw)
          view.setUint16(22, 1, true); // channel count
          view.setUint32(24, 24000, true); // sample rate
          view.setUint32(28, 24000 * 2, true); // byte rate
          view.setUint16(32, 2, true); // block align
          view.setUint16(34, 16, true); // bits per sample
          view.setUint32(36, 0x64617461, false); // data
          view.setUint32(40, len, true); // data chunk length
          
          const combined = new Uint8Array(44 + len);
          combined.set(new Uint8Array(wavHeader), 0);
          combined.set(bytes, 44);
          
          // Convert to base64
          let binary = '';
          const chunkSize = 8192;
          for (let j = 0; j < combined.length; j += chunkSize) {
            binary += String.fromCharCode.apply(null, Array.from(combined.slice(j, j + chunkSize)));
          }
          finalBase64 = btoa(binary);
          finalMimeType = 'audio/wav';
        }

        yield {
          data: finalBase64,
          pcmData: audioData,
          mimeType: finalMimeType,
          chunkIndex: i,
          totalChunks: chunks.length
        };
        
        success = true;
        
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        let errorObj = error;
        try {
          if (typeof error === 'string') {
            errorObj = JSON.parse(error);
          } else if (error instanceof Error) {
            try {
              errorObj = JSON.parse(error.message);
            } catch (e) {}
          }
        } catch (e) {}
        
        errorObj = (errorObj as any).error || errorObj;
        
        const isQuotaExceeded = 
          (errorObj as any).status === 'RESOURCE_EXHAUSTED' || 
          (errorObj as any).code == 429 || 
          (errorObj as any).status == 429 ||
          ((errorObj as any).name === 'ApiError' && (errorObj as any).status == 429);
          
        const errorMessage = (errorObj as any).message || String(error);
        const isHardQuotaLimit = isQuotaExceeded && errorMessage && typeof errorMessage === 'string' && errorMessage.includes('check your plan and billing details') && !errorMessage.includes('retry in');
        const isInvalidModel = (errorObj as any).status === 'INVALID_ARGUMENT' && errorMessage && typeof errorMessage === 'string' && (errorMessage.includes('supports text output') || errorMessage.includes('response modalities: audio'));
        
        // Smart fallback: If hard quota limit, permission denied, or invalid model, switch immediately
        const isPermissionDenied = (errorObj as any).status === 'PERMISSION_DENIED' || (errorObj as any).status == 403;
        if (isHardQuotaLimit || (errorObj as any).status === 'NOT_FOUND' || isInvalidModel || isPermissionDenied) {
          if (currentModelIndex < ttsModels.length - 1) {
            console.warn(`Model ${ttsModels[currentModelIndex]} failed (${(errorObj as any).status || 'ERROR'}). Switching to next model...`);
            currentModelIndex++;
            retries = 8; // Reset retries for the new model
            continue;
          }
          console.warn(`All models failed or hard quota limit reached on chunk ${i + 1}.`);
          throw new Error("HARD_QUOTA_LIMIT");
        }

        console.error(`Gemini TTS Error on chunk ${i + 1}:`, error);
        
        retries--;
        if (isQuotaExceeded && retries > 0) {
          const retryMatch = errorMessage.match(/retry in ([\d\.]+)s/i);
          if (retryMatch && retryMatch[1]) {
            delay = parseFloat(retryMatch[1]) * 1000 + 1000;
          }
          console.warn(`Quota exceeded, retrying chunk ${i + 1} in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * 1.5, 60000); // Exponential backoff max 60s
        } else if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          console.warn(`Giving up on chunk ${i + 1} after retries.`);
          throw new Error("CHUNK_FAILED");
        }
      }
    }
  }
};

export const generateRecitation = async (text: string, voiceName: string, apiKey?: string) => {
  const foundVoice = VOICES.find(v => v.id === voiceName || v.baseVoice === voiceName);
  
  // Edge TTS Handling
  const fVoice = foundVoice as any;
  if (fVoice && fVoice.provider === 'edge_tts') {
    const response = await fetch('/api/tts/edge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text, 
        voice: foundVoice.baseVoice,
        speed: 1 
      })
    });
    if (!response.ok) throw new Error("فشل توليد الصوت عبر Edge TTS");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    return url;
  }

  const finalKey = (apiKey !== undefined && apiKey.trim() !== '') ? apiKey.trim() : getApiKey('gemini');
  const actualVoiceName = foundVoice ? foundVoice.baseVoice : voiceName;

  const chunks = splitTextIntoChunks(text, 5000);

  const selectedTtsModel = safeLocalStorageGet('ai_tts_model') || 'gemini-3.8-flash-lite-tts';
  const officialTtsModels = [
    'gemini-3.8-flash-lite-tts',
    'gemini-3.8-flash-tts',
    'gemini-3.1-flash-tts-preview',
    'gemini-2.5-flash-preview-tts'
  ];
  let ttsModels = [...officialTtsModels];
  if (selectedTtsModel && selectedTtsModel.includes('-tts')) {
    ttsModels = [selectedTtsModel, ...officialTtsModels.filter(m => m !== selectedTtsModel)];
  }
  let currentModelIndex = 0;

  let combinedPcmBytes = new Uint8Array(0);
  let finalMimeType = 'audio/wav';

  for (let i = 0; i < chunks.length; i++) {
    const chunkText = chunks[i].trim();
    if (!chunkText) continue;
    
    let retries = ttsModels.length + 1;
    let success = false;
    let delay = 500;

    while (retries > 0 && !success) {
      try {
        const response = await fetch('/api/gemini/speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            apiKey: finalKey, 
            model: ttsModels[currentModelIndex], 
            text: chunkText, 
            voiceName: actualVoiceName 
          })
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || response.statusText);
        }

        const data = await response.json();
        if (!data.audioData) {
          console.warn(`No audio data received for chunk ${i + 1}`);
          retries--;
          continue;
        }
        
        const audioData = data.audioData;
        const mimeType = data.mimeType || 'audio/wav';
        
        // Decode base64 to binary
        const binaryString = atob(audioData);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let j = 0; j < len; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }

        // If it's the first chunk, save the mimeType
        if (i === 0) finalMimeType = mimeType;

        // Check if the audio data already has a WAV header (starts with 'RIFF')
        const hasWavHeader = len >= 44 && 
                             bytes[0] === 0x52 && // R
                             bytes[1] === 0x49 && // I
                             bytes[2] === 0x46 && // F
                             bytes[3] === 0x46;   // F

        // If it has a WAV header, strip the 44-byte header to get raw PCM
        const pcmBytes = hasWavHeader ? bytes.slice(44) : bytes;

        // Append to combined bytes
        const newCombined = new Uint8Array(combinedPcmBytes.length + pcmBytes.length);
        newCombined.set(combinedPcmBytes, 0);
        newCombined.set(pcmBytes, combinedPcmBytes.length);
        combinedPcmBytes = newCombined;
        
        success = true;
        
        // Add a delay between successful chunks to avoid rate limits
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        let errorObj = error;
        try {
          if (typeof error === 'string') {
            errorObj = JSON.parse(error);
          } else if (error instanceof Error) {
            try {
              errorObj = JSON.parse(error.message);
            } catch (e) {}
          }
        } catch (e) {}
        
        errorObj = (errorObj as any).error || errorObj;
        
        const isQuotaExceeded = 
          (errorObj as any).status === 'RESOURCE_EXHAUSTED' || 
          (errorObj as any).code == 429 || 
          (errorObj as any).status == 429 ||
          ((errorObj as any).name === 'ApiError' && (errorObj as any).status == 429);
        
        const isInternalError = 
          (errorObj as any).status === 'INTERNAL' || 
          (errorObj as any).code == 500 || 
          (errorObj as any).status == 500;
          
        const errorMessage = (errorObj as any).message || String(error);
        const isHardQuotaLimit = isQuotaExceeded && errorMessage && typeof errorMessage === 'string' && errorMessage.includes('check your plan and billing details') && !errorMessage.includes('retry in');
        const isInvalidModel = (errorObj as any).status === 'INVALID_ARGUMENT' && errorMessage && typeof errorMessage === 'string' && (errorMessage.includes('supports text output') || errorMessage.includes('response modalities: audio'));
        
        const isPermissionDenied = (errorObj as any).status === 'PERMISSION_DENIED' || (errorObj as any).status == 403;
        if (isHardQuotaLimit || (errorObj as any).status === 'NOT_FOUND' || isInvalidModel || isPermissionDenied) {
          if (currentModelIndex < ttsModels.length - 1) {
            console.warn(`Model ${ttsModels[currentModelIndex]} failed (${(errorObj as any).status || 'ERROR'}). Trying next model...`);
            currentModelIndex++;
            retries = 8; // Reset retries for the new model
            continue;
          }
          console.warn(`Hard quota limit reached on chunk ${i + 1}. Falling back immediately.`);
          if (i === 0) return null;
          break;
        }

        console.error(`Gemini TTS Error on chunk ${i + 1}:`, error);
        
        retries--;
        if ((isQuotaExceeded || isInternalError) && retries > 0) {
          const retryMatch = errorMessage.match(/retry in ([\d\.]+)s/i);
          if (retryMatch && retryMatch[1]) {
            delay = parseFloat(retryMatch[1]) * 1000 + 1000;
          }
          console.warn(`${isQuotaExceeded ? 'Quota exceeded' : 'Internal error'}, retrying chunk ${i + 1} in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * 1.5, 60000); // Exponential backoff max 60s
        } else if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else if (isQuotaExceeded && i === 0) {
          return null; // Fail gracefully if first chunk fails due to quota
        } else if (isQuotaExceeded && i > 0) {
          console.warn(`Giving up on chunk ${i + 1} after retries. Returning partial audio.`);
          break; // Break the loop and return what we have so far
        }
      }
    }
    
    // If a chunk failed completely and we broke the loop, stop processing further chunks
    if (!success) {
      break;
    }
  }

  if (combinedPcmBytes.length === 0) {
    return null;
  }

  // Add WAV header to the combined PCM bytes
  let finalAudioData = '';
  if (finalMimeType && typeof finalMimeType === 'string' && (finalMimeType.includes('pcm') || !finalMimeType.includes('mpeg'))) {
    try {
      const len = combinedPcmBytes.length;
      const wavHeader = new ArrayBuffer(44);
      const view = new DataView(wavHeader);
      
      /* RIFF identifier */
      view.setUint32(0, 0x52494646, false);
      /* file length */
      view.setUint32(4, 36 + len, true);
      /* RIFF type */
      view.setUint32(8, 0x57415645, false);
      /* format chunk identifier */
      view.setUint32(12, 0x666d7420, false);
      /* format chunk length */
      view.setUint32(16, 16, true);
      /* sample format (raw) */
      view.setUint16(20, 1, true);
      /* channel count */
      view.setUint16(22, 1, true);
      /* sample rate */
      view.setUint32(24, 24000, true);
      /* byte rate (sample rate * block align) */
      view.setUint32(28, 24000 * 2, true);
      /* block align (channel count * bytes per sample) */
      view.setUint16(32, 2, true);
      /* bits per sample */
      view.setUint16(34, 16, true);
      /* data chunk identifier */
      view.setUint32(36, 0x64617461, false);
      /* data chunk length */
      view.setUint32(40, len, true);
      
      const combined = new Uint8Array(44 + len);
      combined.set(new Uint8Array(wavHeader), 0);
      combined.set(combinedPcmBytes, 44);
      
      // Convert back to base64 in chunks to avoid call stack size exceeded
      let binary = '';
      const chunk_size = 0x8000;
      for (let i = 0; i < combined.length; i += chunk_size) {
        binary += String.fromCharCode.apply(null, Array.from(combined.subarray(i, i + chunk_size)));
      }
      finalAudioData = btoa(binary);
      finalMimeType = 'audio/wav';
    } catch (e) {
      console.error("Error adding WAV header:", e);
      // Fallback to raw base64 if header fails
      let binary = '';
      const chunk_size = 0x8000;
      for (let i = 0; i < combinedPcmBytes.length; i += chunk_size) {
        binary += String.fromCharCode.apply(null, Array.from(combinedPcmBytes.subarray(i, i + chunk_size)));
      }
      finalAudioData = btoa(binary);
    }
  } else {
    // If it's not PCM (e.g., mp3), we can't just concatenate bytes easily without decoding.
    // But Gemini TTS currently returns PCM. If it returns something else, this might produce invalid audio.
    let binary = '';
    const chunk_size = 0x8000;
    for (let i = 0; i < combinedPcmBytes.length; i += chunk_size) {
      binary += String.fromCharCode.apply(null, Array.from(combinedPcmBytes.subarray(i, i + chunk_size)));
    }
    finalAudioData = btoa(binary);
  }

  return {
    data: finalAudioData,
    mimeType: finalMimeType
  };
};

export const transcribeAudio = async (
  base64Audio: string,
  mimeType: string,
  apiKey?: string
): Promise<string> => {
  const finalKey = (apiKey !== undefined && apiKey.trim() !== '') ? apiKey.trim() : getApiKey('gemini');

  try {
    const response = await fetch('/api/gemini/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        apiKey: finalKey,
        base64Audio,
        mimeType
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || response.statusText);
    }

    const data = await response.json();
    return data.text?.trim() || "";
  } catch (error) {
    console.warn('Audio transcription error:', error);
    throw error;
  }
};

export const startDeepResearch = async (prompt: string, apiKey?: string): Promise<string> => {
  const finalKey = (apiKey !== undefined && apiKey.trim() !== '') ? apiKey.trim() : getApiKey('gemini');
  
  try {
    const response = await fetch('/api/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, apiKey: finalKey })
    });
    
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || response.statusText);
    }
    
    const data = await response.json();
    return data.interactionId;
  } catch (error) {
    console.error("Failed to start deep research:", error);
    throw error;
  }
};

export const getDeepResearchStatus = async (interactionId: string, apiKey?: string): Promise<{status: string, text: string, error?: string}> => {
  const finalKey = (apiKey !== undefined && apiKey.trim() !== '') ? apiKey.trim() : getApiKey('gemini');
  
  try {
    const response = await fetch(`/api/research/status?interactionId=${encodeURIComponent(interactionId)}${finalKey ? `&apiKey=${encodeURIComponent(finalKey)}` : ''}`);
    
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || response.statusText);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to get deep research status:", error);
    throw error;
  }
};

export const generateContextualSuggestions = async (
  lastUserQuery: string,
  lastAssistantResponse: string
): Promise<string[]> => {
  if (!lastAssistantResponse || lastAssistantResponse.trim().length < 10) {
    return [];
  }

  const prompt = `أنت مساعد تدبر إيماني ومستشار قرآني ذكي. بناءً على الحوار التالي:
سؤال المستخدم: "${lastUserQuery.slice(0, 300)}"
إجابة المساعد: "${lastAssistantResponse.slice(0, 800)}"

صغ 3 إلى 4 اقتراحات تفاعلية أو أسئلة متابعة ذكية ومثيرة للاهتمام باللغة العربية (كل اقتراح من 4 إلى 10 كلمات) لإثراء الحوار ومتابعة النقاش (مثل: مواضع تدبر، تساؤلات إيمانية، ربط بآيات أخرى، أو تطبيق عملي).

أخرج الإجابة فقط بصيغة JSON كمصفوفة من النصوص بدون أي نص إضافي أو شرح:
["اقتراح 1", "اقتراح 2", "اقتراح 3"]`;

  try {
    const res = await callAIWithFailover(
      'gemini',
      [{ role: 'user', content: prompt }],
      'gemini-3.5-flash-lite'
    );

    const parsed = parseAIJson<string[] | null>(res.content, null);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item: any) => String(item).trim()).filter(Boolean).slice(0, 4);
    }

    const lines = res.content
      .split('\n')
      .map(l => l.replace(/^[-*•\d.\s"']+|["']+$|\[|\]/g, '').trim())
      .filter(l => l.length >= 4 && l.length <= 80);

    return lines.slice(0, 4);
  } catch (err) {
    console.warn("Failed to generate contextual suggestions:", err);
    return [];
  }
};
