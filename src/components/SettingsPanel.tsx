import React from 'react';
import { motion } from 'motion/react';
import { X, Settings2, RotateCcw, RefreshCw } from 'lucide-react';
import { AI_PROVIDERS, AIProviderKey, VOICES, getDynamicModelsList } from '../services/aiService';
import { TRANSLATIONS, QIRAAT } from '../constants';
import { RecitationSettings } from '../types';

interface SettingsPanelProps {
  show: boolean;
  onClose: () => void;
  provider: AIProviderKey;
  onProviderChange: (provider: AIProviderKey) => void;
  apiKeyInput: string;
  onApiKeyChange: (key: string) => void;
  selectedTranslation: string;
  onTranslationChange: (id: string) => void;
  selectedQiraat: string;
  onQiraatChange: (id: string) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  fontFamily: string;
  onFontFamilyChange: (family: string) => void;
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  ttsModel: string;
  onTtsModelChange: (model: string) => void;
  aiRecitationSettings: RecitationSettings;
  onAiRecitationSettingsChange: (settings: RecitationSettings) => void;
  humanRecitationSettings: RecitationSettings;
  onHumanRecitationSettingsChange: (settings: RecitationSettings) => void;
  onResetApp: () => void;
  onRefreshModels: () => Promise<void>;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  show,
  onClose,
  provider,
  onProviderChange,
  apiKeyInput,
  onApiKeyChange,
  selectedTranslation,
  onTranslationChange,
  selectedQiraat,
  onQiraatChange,
  fontSize,
  onFontSizeChange,
  fontFamily,
  onFontFamilyChange,
  selectedVoice,
  onVoiceChange,
  ttsModel,
  onTtsModelChange,
  aiRecitationSettings,
  onAiRecitationSettingsChange,
  humanRecitationSettings,
  onHumanRecitationSettingsChange,
  onResetApp,
  onRefreshModels
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [geminiModels, setGeminiModels] = React.useState<string[]>(() => {
    return getDynamicModelsList('gemini');
  });

  const [providerModels, setProviderModels] = React.useState<string[]>(() => {
    return getDynamicModelsList(provider);
  });
  const [selectedChatModel, setSelectedChatModel] = React.useState<string>(() => {
    return (
      localStorage.getItem('midad_model') ||
      localStorage.getItem(`ai_model_${provider}`) ||
      AI_PROVIDERS[provider]?.defaultModel ||
      'gemini-4-hydrogen'
    );
  });

  React.useEffect(() => {
    const list = getDynamicModelsList(provider);
    setProviderModels(list);
    setGeminiModels(getDynamicModelsList('gemini'));
    const saved =
      localStorage.getItem(`ai_model_${provider}`) ||
      (provider === 'gemini' ? localStorage.getItem('midad_model') : '') ||
      AI_PROVIDERS[provider]?.defaultModel ||
      list[0] ||
      '';
    if (saved) setSelectedChatModel(saved);
  }, [provider]);

  React.useEffect(() => {
    const handleUpdate = () => {
      setGeminiModels(getDynamicModelsList('gemini'));
      setProviderModels(getDynamicModelsList(provider));
    };
    window.addEventListener('models_updated', handleUpdate);
    return () => {
      window.removeEventListener('models_updated', handleUpdate);
    };
  }, [provider]);

  const ttsModels = React.useMemo(() => {
    if (provider === 'edge_tts') {
      return (AI_PROVIDERS.edge_tts as any).models || [];
    }
    const defaults = ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts', 'gemini-3.1-flash-tts-preview', 'gemini-2.5-flash', 'gemini-3-flash-preview'];
    return Array.from(new Set([...defaults, ...geminiModels]));
  }, [geminiModels, provider]);

  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [refreshMessage, setRefreshMessage] = React.useState<{ text: string; type: 'success' | 'error' | 'loading' } | null>(null);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshMessage({ text: 'جاري جلب وحفظ جميع نماذج الذكاء الاصطناعي من السحاب...', type: 'loading' });
    try {
      await onRefreshModels();
      const updatedGemini = getDynamicModelsList('gemini');
      const updatedProviderModels = getDynamicModelsList(provider);
      setGeminiModels(updatedGemini);
      setProviderModels(updatedProviderModels);
      setRefreshMessage({ text: `تم جلب وحفظ ${updatedProviderModels.length} نموذج (منها نماذج Gemini وGemma كافة) بنجاح!`, type: 'success' });
      setTimeout(() => setRefreshMessage(null), 4000);
    } catch (e: any) {
      console.error(e);
      setRefreshMessage({ text: `فشل تحديث النماذج: ${e.message || e || 'خطأ غير معروف'}`, type: 'error' });
      setTimeout(() => setRefreshMessage(null), 5000);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredVoices = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return VOICES;
    return VOICES.filter(v => 
      v.name.toLowerCase().includes(term) || 
      v.desc.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  if (!show) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -12 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className="p-5 sm:p-6 bg-white/95 dark:bg-[#171412]/95 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 shadow-sm relative"
    >
      <div className="flex justify-between items-center pb-4 mb-5 border-b border-amber-100/80 dark:border-amber-900/30">
        <div className="flex flex-col gap-1 text-right">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-amber-100/80 dark:bg-amber-900/40 rounded-xl flex items-center justify-center text-amber-700 dark:text-amber-300">
              <Settings2 size={18} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-amber-950 dark:text-amber-50 font-kufi">إعدادات المنصة</h3>
              <p className="text-xs text-amber-800/60 dark:text-amber-200/60">تخصيص التلاوة والقراءة والذكاء الاصطناعي</p>
            </div>
          </div>
          {refreshMessage && (
            <div className={`mt-2 text-xs font-sans px-3 py-1.5 rounded-xl border transition-all ${
              refreshMessage.type === 'loading' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/40' :
              refreshMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/40' :
              'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-900/40'
            }`}>
              {refreshMessage.text}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center bg-amber-50 hover:bg-amber-100 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl text-amber-700 dark:text-amber-300 transition-colors"
          aria-label="إغلاق الإعدادات"
        >
          <X size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-4 bg-amber-50/40 dark:bg-[#1e1a17]/70 p-4 sm:p-5 rounded-2xl border border-amber-200/40 dark:border-amber-900/30">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-amber-100/70 dark:border-amber-900/30">
            <h4 className="text-sm sm:text-base font-bold text-amber-950 dark:text-amber-100">
              إعدادات الذكاء الاصطناعي والصوت
            </h4>
            <button 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              className={`w-8 h-8 flex items-center justify-center bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 rounded-lg text-amber-800 dark:text-amber-200 transition-colors ${isRefreshing ? 'animate-spin opacity-60' : ''}`} 
              title="تحديث النماذج"
            >
              <RefreshCw size={15} />
            </button>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-amber-800 dark:text-amber-300">مزود الذكاء الاصطناعي</label>
            <select 
              value={provider} 
              onChange={(e) => onProviderChange(e.target.value as AIProviderKey)} 
              className="h-10 px-3 rounded-xl border border-amber-200 dark:border-amber-800/70 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none bg-white dark:bg-[#141210] text-amber-950 dark:text-amber-50 text-sm transition-colors"
            >
              {Object.entries(AI_PROVIDERS).map(([key, p]) => (
                <option key={key} value={key}>
                  {p.name} {p.isFree ? '(مجاني)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-amber-800 dark:text-amber-300 flex justify-between items-center">
              <span>النموذج النشط (شامل نماذج Gemini وGemma كافة)</span>
              <span className="text-[11px] text-amber-700/80 dark:text-amber-300/80 tabular-nums">{providerModels.length} نموذج</span>
            </label>
            <select
              value={selectedChatModel}
              onChange={(e) => {
                const newModel = e.target.value;
                setSelectedChatModel(newModel);
                localStorage.setItem('midad_model', newModel);
                localStorage.setItem('midad_provider', provider);
                localStorage.setItem(`ai_model_${provider}`, newModel);
              }}
              className="h-10 px-3 rounded-xl border border-amber-200 dark:border-amber-800/70 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none bg-white dark:bg-[#141210] text-amber-950 dark:text-amber-50 text-sm transition-colors"
              dir="ltr"
            >
              {providerModels.map(m => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-amber-800 dark:text-amber-300">نموذج الصوت (TTS)</label>
            <select 
              value={ttsModel} 
              onChange={(e) => onTtsModelChange(e.target.value)} 
              className="h-10 px-3 rounded-xl border border-amber-200 dark:border-amber-800/70 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none bg-white dark:bg-[#141210] text-amber-950 dark:text-amber-50 text-sm transition-colors"
            >
              {ttsModels.map(m => (
                <option key={m} value={m}>
                  {m === 'gemini-3.8-flash-lite-tts' ? 'Gemini 3.8 Flash Lite TTS' :
                   m === 'gemini-3.8-flash-tts' ? 'Gemini 3.8 Flash TTS' :
                   m === 'gemini-3.1-flash-tts-preview' ? 'Gemini 3.1 Flash TTS Preview' :
                   m === 'gemini-2.5-flash' ? 'Gemini 2.5 Flash' :
                   m === 'gemini-3-flash-preview' ? 'Gemini 3 Flash Preview' : m}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-amber-800 dark:text-amber-300 tabular-nums">سرعة الذكاء الاصطناعي: {aiRecitationSettings.rate.toFixed(1)}x</label>
              <input type="range" min="0.5" max="2.0" step="0.1" value={aiRecitationSettings.rate} onChange={(e) => onAiRecitationSettingsChange({...aiRecitationSettings, rate: parseFloat(e.target.value)})} className="w-full accent-amber-600" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-amber-800 dark:text-amber-300 tabular-nums">نبرة الذكاء الاصطناعي: {aiRecitationSettings.pitch.toFixed(1)}</label>
              <input type="range" min="0.5" max="2.0" step="0.1" value={aiRecitationSettings.pitch} onChange={(e) => onAiRecitationSettingsChange({...aiRecitationSettings, pitch: parseFloat(e.target.value)})} className="w-full accent-amber-600" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-amber-800 dark:text-amber-300 tabular-nums">سرعة التلاوة البشرية: {humanRecitationSettings.rate.toFixed(1)}x</label>
              <input type="range" min="0.5" max="2.0" step="0.1" value={humanRecitationSettings.rate} onChange={(e) => onHumanRecitationSettingsChange({...humanRecitationSettings, rate: parseFloat(e.target.value)})} className="w-full accent-amber-600" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-amber-800 dark:text-amber-300 tabular-nums">نبرة التلاوة البشرية: {humanRecitationSettings.pitch.toFixed(1)}</label>
              <input type="range" min="0.5" max="2.0" step="0.1" value={humanRecitationSettings.pitch} onChange={(e) => onHumanRecitationSettingsChange({...humanRecitationSettings, pitch: parseFloat(e.target.value)})} className="w-full accent-amber-600" />
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-amber-800 dark:text-amber-300 flex justify-between items-center">
              <span>صوت القارئ (الذكاء الاصطناعي)</span>
              {filteredVoices.length !== VOICES.length && (
                <span className="text-xs text-amber-700 dark:text-amber-300 tabular-nums">
                  {filteredVoices.length} من {VOICES.length}
                </span>
              )}
            </label>
            <input 
              type="text"
              placeholder="ابحث عن قارئ أو نمط صوتي (مثال: عمر، الخاشع، نجد)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 px-3 text-xs sm:text-sm rounded-xl border border-amber-200 dark:border-amber-800/70 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none bg-white dark:bg-[#141210] text-amber-950 dark:text-amber-50 placeholder:text-amber-900/40 dark:placeholder:text-amber-100/40"
            />
            <select 
              value={selectedVoice} 
              onChange={(e) => onVoiceChange(e.target.value)} 
              className="h-10 px-3 rounded-xl border border-amber-200 dark:border-amber-800/70 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none bg-white dark:bg-[#141210] text-amber-950 dark:text-amber-50 text-sm"
            >
              {filteredVoices.length === 0 ? (
                <option value="" disabled>لا يوجد نتائج تطابق بحثك</option>
              ) : (
                filteredVoices.map(v => (
                  <option key={v.id} value={v.id} title={v.desc}>{v.name} ({v.desc})</option>
                ))
              )}
            </select>
          </div>
          
          {provider !== 'edge_tts' && provider !== 'pollinations' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-800 dark:text-amber-300">مفتاح API</label>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${apiKeyInput.trim() ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                  {apiKeyInput.trim() ? '✓ مفتاحك الخاص مُعتمد تلقائياً' : '⚡ المفتاح المدمج التلقائي نشط'}
                </span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="password"
                  placeholder={`أدخل مفتاح ${AI_PROVIDERS[provider].name} (أو اتركه فارغاً للمفتاح المدمج)`}
                  value={apiKeyInput}
                  onChange={(e) => onApiKeyChange(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-xl border border-amber-200 dark:border-amber-800/70 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none bg-white dark:bg-[#141210] text-amber-950 dark:text-amber-50 placeholder:text-amber-900/30 dark:placeholder:text-amber-100/30"
                  dir="ltr"
                />
                {apiKeyInput.trim() && (
                  <button
                    type="button"
                    onClick={() => onApiKeyChange('')}
                    className="absolute right-2 px-2 py-1 text-[10px] font-bold rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 transition-colors"
                    title="مسح المفتاح والعودة للمفتاح المدمج"
                  >
                    مسح
                  </button>
                )}
              </div>
              <p className="text-xs text-amber-700/80 dark:text-amber-300/70 flex items-center gap-1">
                احصل على المفتاح من ← 
                <a 
                  href={
                    provider === 'gemini' ? 'https://aistudio.google.com/app/apikey' : 
                    provider === 'groq' ? 'https://console.groq.com/keys' : 
                    provider === 'deepseek' ? 'https://platform.deepseek.com/api_keys' : 
                    provider === 'openrouter' ? 'https://openrouter.ai/keys' : 
                    provider === 'mistral' ? 'https://console.mistral.ai' : 
                    provider === 'routeway' ? 'https://routeway.ai' : 
                    provider === 'stability' ? 'https://platform.stability.ai/account/keys' : 
                    'https://huggingface.co/settings/tokens'
                  } 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="underline font-bold hover:text-amber-900 dark:hover:text-amber-100"
                >
                  {AI_PROVIDERS[provider].name}
                </a>
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-amber-800 dark:text-amber-300 tabular-nums">حجم الخط ({fontSize}px)</label>
            <input 
              type="range" 
              min="12" 
              max="32" 
              value={fontSize} 
              onChange={(e) => onFontSizeChange(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-amber-200 dark:bg-amber-800 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
          </div>
        </div>

        <div className="space-y-4 bg-amber-50/40 dark:bg-[#1e1a17]/70 p-4 sm:p-5 rounded-2xl border border-amber-200/40 dark:border-amber-900/30 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-sm sm:text-base font-bold text-amber-950 dark:text-amber-100 pb-2 border-b border-amber-100/70 dark:border-amber-900/30">
              إعدادات العرض والقراءة
            </h4>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-amber-800 dark:text-amber-300">ترجمة معاني القرآن</label>
              <select 
                value={selectedTranslation} 
                onChange={(e) => onTranslationChange(e.target.value)} 
                className="w-full h-10 px-3 rounded-xl border border-amber-200 dark:border-amber-800/70 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none bg-white dark:bg-[#141210] text-amber-950 dark:text-amber-50 text-sm"
              >
                {TRANSLATIONS.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-amber-800 dark:text-amber-300">القراءة</label>
              <select 
                value={selectedQiraat} 
                onChange={(e) => onQiraatChange(e.target.value)} 
                className="w-full h-10 px-3 rounded-xl border border-amber-200 dark:border-amber-800/70 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none bg-white dark:bg-[#141210] text-amber-950 dark:text-amber-50 text-sm"
              >
                {QIRAAT.map(q => (
                  <option key={q.id} value={q.id}>{q.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-amber-800 dark:text-amber-300">نوع الخط</label>
              <select 
                value={fontFamily} 
                onChange={(e) => onFontFamilyChange(e.target.value)} 
                className="w-full h-10 px-3 rounded-xl border border-amber-200 dark:border-amber-800/70 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none bg-white dark:bg-[#141210] text-amber-950 dark:text-amber-50 text-sm"
              >
                <option value="font-amiri">أميري (Amiri)</option>
                <option value="font-sans">افتراضي (Sans)</option>
                <option value="font-mono">نصي (Mono)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 mt-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  if ('caches' in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map((k) => caches.delete(k)));
                  }
                  if ('serviceWorker' in navigator) {
                    const regs = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(regs.map((r) => r.unregister()));
                  }
                } catch {}
                const url = new URL(window.location.href);
                url.searchParams.set('refresh', String(Date.now()));
                window.location.replace(url.toString());
              }}
              className="w-full h-10 flex items-center justify-center gap-2 bg-amber-100/80 hover:bg-amber-200/80 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 rounded-xl border border-amber-300/70 dark:border-amber-800/60 transition-colors text-sm font-bold"
            >
              <RefreshCw size={15} />
              تصفير الكاش وتحديث التطبيق
            </button>

            <button 
              onClick={() => onResetApp()}
              className="w-full h-10 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/15 dark:hover:bg-red-900/25 text-red-700 dark:text-red-300 rounded-xl border border-red-200/70 dark:border-red-900/40 transition-colors text-sm font-bold"
            >
              <RotateCcw size={16} />
              إعادة تعيين التطبيق
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
