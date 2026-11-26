import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, Download, Image as ImageIcon, Settings2, RefreshCw, Wand2, ChevronDown, Trash2, ExternalLink, X, Minimize, Maximize, Copy } from 'lucide-react';
import { AI_PROVIDERS, AIProviderKey, generateImage, generateSmartPrompt, generateShortArabicSummary, ImageGenerationConfig, fetchAllProvidersModels, getDynamicImageModelsList } from '../services/aiService';
import { safeLocalStorageSet, safeLocalStorageGet } from '../lib/utils';

const IMAGE_PROVIDERS: AIProviderKey[] = ['gemini', 'pollinations', 'routeway', 'openrouter', 'stability'];

export const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState(() => safeLocalStorageGet('image_gen_prompt_draft') || '');

  useEffect(() => {
    safeLocalStorageSet('image_gen_prompt_draft', prompt);
  }, [prompt]);
  const [provider, setProvider] = useState<AIProviderKey>('gemini');
  const [model, setModel] = useState('gemini-3.1-flash-lite-image');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '9:16' | '16:9'>('1:1');
  const [isSmartMode, setIsSmartMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ url: string; prompt: string; provider: string; model: string; timestamp: number; arabicSummary?: string }[]>(() => {
    const saved = localStorage.getItem('image_gen_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; prompt: string; arabicSummary?: string } | null>(null);
  const [isExpandedPreview, setIsExpandedPreview] = useState(false);
  const [isUpdatingModels, setIsUpdatingModels] = useState(false);
  const [modelsUpdatedMessage, setModelsUpdatedMessage] = useState<string | null>(null);
  const [, setModelsRefreshCounter] = useState(0);

  useEffect(() => {
    // Automatically fetch models on mount
    fetchAllProvidersModels(true).catch(console.error);

    const handleModelsUpdated = () => setModelsRefreshCounter(c => c + 1);
    window.addEventListener('models_updated', handleModelsUpdated);
    return () => window.removeEventListener('models_updated', handleModelsUpdated);
  }, []);

  const handleRefreshModels = async () => {
    setIsUpdatingModels(true);
    setModelsUpdatedMessage(null);
    try {
      const results = await fetchAllProvidersModels();
      const totalUpdated = Object.values(results).reduce((acc, models) => acc + models.length, 0);
      setModelsUpdatedMessage(`تم تحديث ${totalUpdated} نموذج بنجاح.`);
      
      const providerModels = results[provider] || getDynamicImageModelsList(provider);
      if (provider !== 'gemini' && providerModels.length > 0 && !providerModels.includes(model)) {
        const defaultModel = AI_PROVIDERS[provider].defaultModel;
        setModel(providerModels.includes(defaultModel) ? defaultModel : providerModels[0]);
      }
      setTimeout(() => setModelsUpdatedMessage(null), 3000);
    } catch (err: any) {
      setModelsUpdatedMessage(`فشل التحديث.`);
      setTimeout(() => setModelsUpdatedMessage(null), 3000);
    } finally {
      setIsUpdatingModels(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadImage = async (url: string, prompt: string) => {
    try {
      let blobUrl;
      if (url.startsWith('data:')) {
        const parts = url.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        blobUrl = URL.createObjectURL(blob);
      } else {
        const proxyUrl = `/api/proxy/image?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('Proxy fetch failed');
        const blob = await response.blob();
        blobUrl = URL.createObjectURL(blob);
      }
      
      const link = document.createElement('a');
      const safeName = prompt.substring(0, 30).replace(/[^a-zA-Z0-9\u0600-\u06FF\s-]/g, '_').trim() || 'midad-art';
      link.download = `${safeName}.png`;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      console.error('Download failed:', err);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = 'midad-art.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };


  useEffect(() => {
    try {
      safeLocalStorageSet('image_gen_history', JSON.stringify(history.slice(0, 10)));
    } catch (e) {
      console.error("Failed to save history:", e);
      if ((e as any).name === 'QuotaExceededError') {
        localStorage.removeItem('image_gen_history');
        setHistory([]);
      }
    }
  }, [history]);

  useEffect(() => {
    const handleTrigger = (e: any) => {
      if (e.detail?.prompt) {
        setPrompt(e.detail.prompt);
        // Small delay to ensure state is updated before triggering generate
        setTimeout(() => {
          const btn = document.getElementById('generate-image-btn');
          if (btn) btn.click();
        }, 300);
      }
    };
    window.addEventListener('trigger_image_gen', handleTrigger);
    return () => window.removeEventListener('trigger_image_gen', handleTrigger);
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      let finalPrompt = prompt;
      let shortArabicSummary = prompt.substring(0, 30) + (prompt.length > 30 ? '...' : '');
      
      try {
        shortArabicSummary = await generateShortArabicSummary(prompt, provider, model);
      } catch (summaryErr) {
        console.warn("Failed to generate short Arabic summary, using fallback:", summaryErr);
      }
      
      if (isSmartMode) {
        try {
          finalPrompt = await generateSmartPrompt(prompt, provider, model);
        } catch (smartErr) {
          console.warn("Failed to generate smart prompt, using original prompt:", smartErr);
        }
      }

      const getResolution = (ratio: string) => {
        switch (ratio) {
          case '1:1': return { width: 1024, height: 1024 };
          case '3:4': return { width: 768, height: 1024 };
          case '4:3': return { width: 1024, height: 768 };
          case '9:16': return { width: 768, height: 1344 };
          case '16:9': return { width: 1344, height: 768 };
          default: return { width: 1024, height: 1024 };
        }
      };

      const { width, height } = getResolution(aspectRatio);

      const config: ImageGenerationConfig = {
        model,
        aspectRatio,
        width,
        height,
      };

      const url = await generateImage(finalPrompt, provider, config);
      
      const timestamp = Date.now();
      const newEntry = {
        url,
        prompt: finalPrompt,
        provider: AI_PROVIDERS[provider].name,
        model,
        timestamp,
        arabicSummary: shortArabicSummary
      };

      setHistory(prev => [newEntry, ...prev]);
      setPreviewImage({ url, prompt: finalPrompt, arabicSummary: shortArabicSummary });
    } catch (err: any) {
      console.error(err);
      if (err && err.message && typeof err.message === 'string' && (err.message.includes('404') || err.message.includes('Requested entity was not found'))) {
        setError('النموذج المختار غير متاح حالياً أو مفتاح API غير صالح. يرجى تجربة نموذج آخر أو التحقق من الإعدادات.');
      } else {
        setError(err.message || 'حدث خطأ أثناء توليد الصورة.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFromHistory = (index: number) => {
    setHistory(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={`flex flex-col h-full p-2 sm:p-4 md:p-6 mx-auto w-full transition-all duration-500 ${isExpanded ? 'expanded-view p-8 md:p-16' : 'max-w-7xl'}`} dir="rtl">
      {/* Header with Smart Buttons */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-amber-100 dark:bg-amber-900/50 rounded-2xl flex items-center justify-center">
            <ImageIcon size={24} className="text-amber-700 dark:text-amber-300" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-50 tracking-tight">المولد الفني الذكي</h2>
            <p className="text-xs sm:text-sm text-amber-800/65 dark:text-amber-400/65 font-medium">حوّل كلماتك إلى لوحات فنية روحانية</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open_ai_chat'))}
            className="w-10 h-10 bg-white dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/40 transition-colors border border-amber-200/70 dark:border-amber-800/50 shadow-sm flex items-center justify-center"
            title="المساعد الذكي"
          >
            <Sparkles size={18} />
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="w-10 h-10 bg-white dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/40 border border-amber-200/70 dark:border-amber-800/50 shadow-sm transition-colors flex items-center justify-center"
            title={isExpanded ? "تصغير" : "ملء الشاشة"}
          >
            {isExpanded ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 lg:min-h-0 overflow-y-auto lg:overflow-hidden custom-scrollbar pb-8">
        {/* Left Column: Input & Settings */}
        <div className="lg:col-span-5 flex flex-col gap-5 lg:overflow-y-auto custom-scrollbar pb-4">
          {/* Main Input Area */}
          <div className="bg-white/95 dark:bg-[#171412]/95 p-5 rounded-2xl border border-amber-200/70 dark:border-amber-900/50 shadow-sm flex flex-col gap-4 relative">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                <Wand2 size={17} className="text-amber-600" />
                ماذا تريد أن ترسم؟
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-700/70 dark:text-amber-300/60">تحسين ذكي</span>
                <button 
                  onClick={() => setIsSmartMode(!isSmartMode)}
                  className={`w-10 h-5 rounded-full transition-all relative ${isSmartMode ? 'bg-amber-600' : 'bg-amber-200 dark:bg-white/15'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isSmartMode ? 'right-6' : 'right-1'}`} />
                </button>
              </div>
            </div>

            <div className="w-full relative z-10 flex flex-col gap-3.5">
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="عبر عن خيالك الفني هنا... (مثال: نخلة وسط الصحراء عند الغروب)"
                className="w-full min-h-[140px] p-4 bg-amber-50/40 dark:bg-black/25 rounded-xl border border-amber-200/70 dark:border-amber-900/50 text-base text-amber-950 dark:text-amber-50 outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500 transition-all resize-y placeholder:text-amber-900/45 dark:placeholder:text-amber-100/40"
                dir="rtl"
              />

              <button 
                id="generate-image-btn"
                onClick={handleGenerate}
                disabled={isLoading || !prompt.trim()}
                className={`w-full h-11 rounded-xl font-bold text-base flex items-center justify-center gap-2.5 transition-colors shadow-sm ${isLoading || !prompt.trim() ? 'bg-amber-100 dark:bg-white/5 text-amber-400 dark:text-white/25 cursor-not-allowed' : 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800'}`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={19} />
                    <span>جاري التوليد...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={19} />
                    <span>توليد اللوحة</span>
                  </>
                )}
              </button>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/70 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs font-medium flex items-center justify-between gap-2">
                  <span>{error}</span>
                  <button onClick={() => setError(null)} className="shrink-0 text-red-500 hover:text-red-700">
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Settings Section */}
          <div className="bg-white/95 dark:bg-[#171412]/95 p-5 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 size={17} className="text-amber-600" />
              <h3 className="text-sm font-bold text-amber-950 dark:text-amber-100">إعدادات التوليد</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-800/75 dark:text-amber-300/75 px-1">المزود</label>
                  <div className="relative">
                    <select 
                      value={provider}
                      onChange={(e) => {
                        const newProvider = e.target.value as AIProviderKey;
                        setProvider(newProvider);
                        const defaultModel = newProvider === 'gemini' ? 'gemini-3.1-flash-lite-image' : (newProvider === 'pollinations' ? 'flux' : (newProvider === 'routeway' ? 'step-3.5-flash:free' : (AI_PROVIDERS[newProvider] as any).defaultModel));
                        setModel(defaultModel);
                      }}
                      className="w-full h-10 appearance-none px-3 rounded-xl bg-amber-50/50 dark:bg-black/25 border border-amber-200/60 dark:border-amber-900/40 text-xs outline-none focus:ring-2 focus:ring-amber-500/30 transition-all dark:text-amber-100 cursor-pointer"
                    >
                      {IMAGE_PROVIDERS.map(p => (
                        <option key={p} value={p}>{AI_PROVIDERS[p]?.name || p}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-amber-600" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-xs font-bold text-amber-800/75 dark:text-amber-300/75">النموذج</label>
                    <button
                      onClick={handleRefreshModels}
                      disabled={isUpdatingModels}
                      className="text-xs text-amber-600 hover:text-amber-800 dark:text-amber-400 flex items-center gap-1 disabled:opacity-50"
                      title="تحديث النماذج"
                    >
                      {isUpdatingModels ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    </button>
                  </div>
                  {modelsUpdatedMessage && (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 px-1">{modelsUpdatedMessage}</div>
                  )}
                  <div className="relative">
                    <select 
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full h-10 appearance-none px-3 rounded-xl bg-amber-50/50 dark:bg-black/25 border border-amber-200/60 dark:border-amber-900/40 text-xs outline-none focus:ring-2 focus:ring-amber-500/30 transition-all dark:text-amber-100 cursor-pointer"
                    >
                      {getDynamicImageModelsList(provider).map((m: string) => (
                        <option key={m} value={m}>{m.split('/').pop()?.replace(':free', '') || m}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-amber-600" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-amber-800/75 dark:text-amber-300/75 px-1">نسبة العرض</label>
                <div className="flex gap-2">
                  {(['1:1', '3:4', '4:3', '9:16', '16:9'] as const).map(ratio => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`flex-1 h-9 rounded-xl text-xs font-bold tabular-nums transition-colors border ${aspectRatio === ratio ? 'bg-amber-600 text-white border-transparent shadow-sm' : 'bg-amber-50/50 dark:bg-black/25 text-amber-800 dark:text-amber-200 border-amber-200/60 dark:border-amber-900/40 hover:bg-amber-100/70'}`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preview & History */}
        <div className="lg:col-span-7 flex flex-col gap-5 lg:min-h-0 min-h-[460px]">
          <div className="flex-1 bg-white/95 dark:bg-[#171412]/95 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 shadow-sm overflow-hidden relative flex flex-col">
            <AnimatePresence mode="wait">
              {previewImage ? (
                <motion.div 
                  key={previewImage.url}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative flex-1 group"
                >
                  <img 
                    src={previewImage.url} 
                    alt={previewImage.prompt}
                    className="w-full h-full object-contain bg-black/5"
                    referrerPolicy="no-referrer"
                  />
                  
                  <div className="absolute bottom-4 right-4 left-4 flex justify-between items-end gap-3">
                    <div className="bg-black/70 backdrop-blur-md p-3.5 rounded-xl border border-white/10 max-w-[75%]">
                      <p className="text-white text-sm font-bold line-clamp-2 mb-0.5" dir="rtl">{previewImage.arabicSummary || previewImage.prompt}</p>
                      <p className="text-white/55 text-[11px] font-mono truncate" dir="ltr">{previewImage.prompt}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => setIsExpandedPreview(true)}
                        className="w-10 h-10 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-xl border border-white/20 flex items-center justify-center transition-colors"
                        title="تكبير اللوحة"
                      >
                        <Maximize size={18} />
                      </button>
                      <button 
                        onClick={() => downloadImage(previewImage.url, previewImage.prompt)}
                        className="w-10 h-10 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md flex items-center justify-center transition-colors"
                        title="تحميل الصورة"
                      >
                        <Download size={18} />
                      </button>
                      <button 
                        onClick={() => copyToClipboard(previewImage.prompt)}
                        className="w-10 h-10 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-xl border border-white/20 flex items-center justify-center transition-colors"
                        title="نسخ الأمر"
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="w-20 h-20 bg-amber-100/80 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <ImageIcon size={36} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-amber-950 dark:text-amber-100">بانتظار إبداعك</h3>
                    <p className="text-xs sm:text-sm text-amber-800/70 dark:text-amber-300/65 max-w-xs mx-auto mt-1.5 leading-relaxed">اكتب وصفاً في المربع الجانبي واضغط على &quot;توليد اللوحة&quot; لتبدأ</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-28 flex gap-3 overflow-x-auto custom-scrollbar pb-1">
            {history.map((item, idx) => (
              <div
                key={item.timestamp}
                className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all relative group cursor-pointer ${previewImage?.url === item.url ? 'border-amber-600 shadow-md' : 'border-amber-200/50 dark:border-amber-900/40 hover:border-amber-400'}`}
                onClick={() => setPreviewImage({ url: item.url, prompt: item.prompt, arabicSummary: item.arabicSummary })}
              >
                <img src={item.url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  <button 
                    onClick={(e) => { e.stopPropagation(); downloadImage(item.url, item.prompt); }}
                    className="w-7 h-7 bg-white/25 hover:bg-white/40 text-white rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Download size={14} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteFromHistory(idx); }}
                    className="w-7 h-7 bg-red-600/85 hover:bg-red-600 text-white rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <div className="flex-1 flex items-center justify-center border border-dashed border-amber-200/70 dark:border-amber-900/40 rounded-2xl text-amber-800/40 dark:text-amber-200/30 text-xs font-bold">
                سجل التوليد فارغ
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Preview Modal */}
      <AnimatePresence>
        {isExpandedPreview && previewImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
          >
            <button 
              onClick={() => setIsExpandedPreview(false)}
              className="absolute top-5 right-5 w-10 h-10 text-white/75 hover:text-white transition-colors bg-white/10 rounded-xl flex items-center justify-center"
            >
              <X size={20} />
            </button>
            
            <div className="relative max-w-4xl w-full flex flex-col items-center justify-center gap-5">
              <img 
                src={previewImage.url} 
                alt={previewImage.prompt}
                className="max-w-full max-h-[65vh] object-contain rounded-2xl shadow-2xl"
                referrerPolicy="no-referrer"
              />
              
              <div className="bg-[#171412]/90 backdrop-blur-md p-5 rounded-2xl border border-white/10 w-full max-w-2xl text-center space-y-3">
                <h3 className="text-lg font-bold text-white" dir="rtl">{previewImage.arabicSummary || "لوحة فنية ذكية"}</h3>
                <p className="text-white/65 text-xs sm:text-sm leading-relaxed" dir="ltr">{previewImage.prompt}</p>
                <div className="flex flex-wrap justify-center gap-2.5 pt-2">
                  <button 
                    onClick={() => downloadImage(previewImage.url, previewImage.prompt)}
                    className="h-10 flex items-center gap-2 px-5 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-colors"
                  >
                    <Download size={16} />
                    تحميل اللوحة (PNG)
                  </button>
                  {!previewImage.url.startsWith('data:') && (
                    <a 
                      href={previewImage.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 flex items-center gap-2 px-5 bg-sky-600 text-white rounded-xl font-bold text-sm hover:bg-sky-700 transition-colors"
                    >
                      <ExternalLink size={16} />
                      رابط مباشر
                    </a>
                  )}
                  <button 
                    onClick={() => copyToClipboard(previewImage.prompt)}
                    className="h-10 flex items-center gap-2 px-5 bg-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-colors border border-white/10"
                  >
                    <Copy size={16} />
                    نسخ الأمر
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
