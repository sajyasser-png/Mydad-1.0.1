import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Globe, Brain, Loader2, Image as ImageIcon, Maximize2, Edit2, 
  RefreshCw, Check, Copy, Share2, StopCircle, Volume2, Download, Sparkles, Zap, Cpu,
  Book, ChevronRight
} from 'lucide-react';
import { AIMessage } from '../../services/aiService';
import { saveImageToCache, getImageFromCache } from '../../lib/imageCache';
import { AdvancedReadAloud } from '../AdvancedReadAloud';
import { extractQuranNavigationDetails } from '../../lib/utils';
import { ChatMarkdownRenderer } from './ChatMarkdownRenderer';

export const MessageItem = React.memo(({ 
  m, 
  index,
  handleAIRecitation, 
  stopRecitation,
  isGeneratingAudio,
  sendMessage, 
  copyToClipboard, 
  shareMessage,
  copyFeedback,
  audioUrl,
  downloadAudioFile,
  selectedVoice,
  onRegenerate,
  onEdit,
  selectedModel,
  providerName,
  isStreaming = false
}: { 
  m: AIMessage, 
  index: number,
  handleAIRecitation: (text: string, id: number) => void, 
  stopRecitation: () => void,
  isGeneratingAudio: string | null,
  sendMessage: (text: string) => void,
  copyToClipboard: (text: string, id: string) => void,
  shareMessage: (text: string) => void,
  copyFeedback: string | null,
  audioUrl?: string,
  downloadAudioFile: (url: string, prefix: string) => void,
  selectedVoice: string,
  onRegenerate: (index: number) => void,
  onEdit: (index: number) => void,
  selectedModel: string,
  providerName: string,
  isStreaming?: boolean
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [localImageUrl, setLocalImageUrl] = useState<string>('');

  useEffect(() => {
    if (!m.imageUrl) {
      setLocalImageUrl('');
      setImgLoaded(false);
      setImgError(false);
      return;
    }

    let isMounted = true;
    let objectUrl = '';

    const handleLoadImage = async () => {
      try {
        setImgError(false);
        setImgLoaded(false);

        if (!m.imageUrl) return;

        // Skip network fetch / IndexedDB caching for local blob and data URLs
        if (m.imageUrl.startsWith('blob:') || m.imageUrl.startsWith('data:')) {
          if (isMounted) {
            setLocalImageUrl(m.imageUrl);
            setImgLoaded(true);
          }
          return;
        }

        const cachedBlob = await getImageFromCache(m.imageUrl);
        if (cachedBlob && isMounted) {
          objectUrl = URL.createObjectURL(cachedBlob);
          setLocalImageUrl(objectUrl);
          setImgLoaded(true);
          return;
        }

        const res = await fetch(m.imageUrl);
        if (!res.ok) throw new Error('Failed to load image');
        const blob = await res.blob();

        await saveImageToCache(m.imageUrl, blob);

        if (isMounted) {
          objectUrl = URL.createObjectURL(blob);
          setLocalImageUrl(objectUrl);
          setImgLoaded(true);
        }
      } catch (err) {
        console.warn("Local caching of image failed, using direct image URL:", err);
        if (isMounted) {
          setLocalImageUrl(m.imageUrl!);
        }
      }
    };

    handleLoadImage();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [m.imageUrl]);

  return (
    <div 
      className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
    >
      <div className={`relative group transition-colors duration-150 ${
        m.role === 'user'
          ? 'px-4 py-2.5 rounded-2xl rounded-tr-sm bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/60 dark:to-amber-900/30 text-amber-950 dark:text-amber-100 max-w-[85%] border border-amber-200/50 dark:border-amber-800/30 shadow-xs'
          : 'w-full px-3.5 py-3 sm:px-5 sm:py-4 rounded-2xl rounded-tl-sm bg-white/95 dark:bg-[#181614]/95 backdrop-blur-sm text-amber-950 dark:text-amber-50 border border-amber-200/40 dark:border-amber-900/40 shadow-xs'
      }`}>
        {m.role === 'assistant' && (m.groundingMetadata || m.thought) && (
          <div className="absolute -top-2 -left-2 flex gap-1 z-10">
            {m.groundingMetadata && (
              <motion.div 
                initial={{ scale: 0, rotate: -20 }} 
                animate={{ scale: 1, rotate: 0 }}
                className="bg-emerald-600 text-white p-1.5 rounded-xl border-2 border-white dark:border-[#1c1917] shadow-lg flex items-center gap-1" 
                title="تم التحقق عبر بحث غوغل"
              >
                <Globe size={10} />
                <span className="text-[8px] font-bold">بحث</span>
              </motion.div>
            )}
            {m.thought && (
              <motion.div 
                initial={{ scale: 0, rotate: 20 }} 
                animate={{ scale: 1, rotate: 0 }}
                className="bg-amber-600 text-white p-1.5 rounded-xl border-2 border-white dark:border-[#1c1917] shadow-lg flex items-center gap-1" 
                title="تأمل عميق مفعل"
              >
                <Brain size={10} />
                <span className="text-[8px] font-bold">تأمل</span>
              </motion.div>
            )}
          </div>
        )}
        
        {m.role === 'assistant' && m.thought && (
          <div className="mb-4 p-3.5 bg-amber-50/40 dark:bg-amber-950/25 border border-amber-200/60 dark:border-amber-800/40 rounded-xl text-[13px] text-amber-800/80 dark:text-amber-200/75 font-sans" dir="rtl">
            <div className="flex items-center gap-1.5 mb-2 font-bold text-amber-700 dark:text-amber-400">
              <Brain size={14} />
              <span>تأملات عميقة</span>
            </div>
            <div className="opacity-85">
              <ChatMarkdownRenderer content={m.thought} />
            </div>
          </div>
        )}

        {m.attachments && m.attachments.length > 0 ? (
          <div className="flex flex-wrap gap-2 my-2 max-w-2xl" dir="rtl">
            {m.attachments.map((att, attIdx) => (
              <div key={attIdx} className="p-2 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 rounded-xl overflow-hidden max-w-[280px] flex-shrink-0">
                {att.mimeType.startsWith('image/') ? (
                  <img 
                    src={`data:${att.mimeType};base64,${att.data}`} 
                    alt={att.filename || 'مرفق صورة'} 
                    className="max-h-40 w-auto rounded-lg object-contain shadow-sm mx-auto border border-amber-200/40"
                  />
                ) : att.mimeType.startsWith('video/') ? (
                  <video 
                    src={`data:${att.mimeType};base64,${att.data}`} 
                    controls 
                    className="max-h-40 w-full rounded-lg shadow-sm"
                  />
                ) : att.mimeType.startsWith('audio/') ? (
                  <audio 
                    src={`data:${att.mimeType};base64,${att.data}`} 
                    controls 
                    className="max-h-16 w-full rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200 font-sans p-1">
                    <span className="text-base">📎</span>
                    <span className="truncate font-medium max-w-[200px]">{att.filename || 'ملف مرفق'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : m.inlineData ? (
          <div className="my-2 p-2 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 rounded-xl overflow-hidden max-w-sm" dir="rtl">
            {m.inlineData.mimeType.startsWith('image/') ? (
              <img 
                src={`data:${m.inlineData.mimeType};base64,${m.inlineData.data}`} 
                alt={m.inlineData.filename || 'مرفق صورة'} 
                className="max-h-60 w-auto rounded-lg object-contain shadow-sm"
              />
            ) : m.inlineData.mimeType.startsWith('video/') ? (
              <video 
                src={`data:${m.inlineData.mimeType};base64,${m.inlineData.data}`} 
                controls 
                className="max-h-60 w-full rounded-lg shadow-sm"
              />
            ) : m.inlineData.mimeType.startsWith('audio/') ? (
              <audio 
                src={`data:${m.inlineData.mimeType};base64,${m.inlineData.data}`} 
                controls 
                className="max-h-16 w-full rounded-lg shadow-sm"
              />
            ) : (
              <div className="flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200 font-sans p-1">
                <span className="text-base">📎</span>
                <span className="truncate font-medium">{m.inlineData.filename || 'ملف مرفق'}</span>
              </div>
            )}
          </div>
        ) : null}

        {(() => {
          const rawText = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
          return (
            <div className="prose dark:prose-invert prose-amber max-w-none leading-relaxed text-right font-sans message-bubble" dir="rtl">
              <ChatMarkdownRenderer
                content={rawText}
                isUserMessage={m.role === 'user'}
                isStreaming={isStreaming}
              />
            </div>
          );
        })()}

        {m.role === 'assistant' && (
          <div className="flex items-center flex-wrap gap-2 mt-2 text-[9px] text-amber-600/60 dark:text-amber-400/60 font-mono" dir="ltr">
            <span className="inline-flex items-center gap-1">
              <Cpu size={8} /> {m.model || selectedModel.split('|')[1] || selectedModel}
            </span>
            <span className="inline-flex items-center gap-1">
              <Brain size={8} /> {providerName}
            </span>
          </div>
        )}

        {m.imageUrl && (
          <div className={`mt-4 overflow-hidden rounded-2xl border border-amber-100/50 dark:border-amber-900/40 shadow-sm group/img relative bg-amber-50/50 dark:bg-black/20 flex flex-col items-center justify-center ${!imgLoaded && !imgError ? 'h-[240px]' : ''}`}>
            {!imgLoaded && !imgError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-amber-50/70 dark:bg-black/30">
                <Loader2 className="w-7 h-7 text-amber-600 dark:text-amber-400 animate-spin" />
                <span className="text-xs text-amber-800/70 dark:text-amber-200/70 font-sans">تجلّي الصورة الروحية...</span>
              </div>
            )}
            {imgError ? (
              <div className="p-4 text-center flex flex-col items-center gap-2 text-amber-800/60 dark:text-amber-200/60">
                <ImageIcon size={32} className="opacity-50" />
                <span className="text-xs font-sans">تعذر تحميل الصورة المعبرة</span>
              </div>
            ) : (
              <img 
                src={localImageUrl || m.imageUrl} 
                alt="صورة روحية معبرة" 
                decoding="async"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                className={`w-full max-h-[400px] object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100 relative' : 'opacity-0 absolute inset-0 h-full'}`}
                referrerPolicy="no-referrer"
              />
            )}
            {imgLoaded && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3">
                <span className="text-white text-xs font-sans font-medium">صورة مستوحاة من فيض المعنى</span>
                <a 
                  href={localImageUrl || m.imageUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="p-1 rounded-lg bg-white/20 hover:bg-white/40 text-white transition-colors"
                  title="فتح الصورة بحجم كامل"
                >
                  <Maximize2 size={14} />
                </a>
              </div>
            )}
            <div className="absolute bottom-1 right-1 text-[8px] text-white/50 bg-black/30 px-1 rounded-sm" dir="ltr">
              Generated by {m.imageModel || providerName} ({m.model || selectedModel.split('|')[1] || selectedModel})
            </div>
          </div>
        )}
        
        <div className={`flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-2 border-t border-amber-100/60 dark:border-amber-900/30 ${m.role === 'user' ? 'justify-end' : 'justify-between'}`}>
          <div className="flex flex-wrap items-center gap-0.5">
            {m.role === 'user' && (
              <button 
                onClick={() => onEdit(index)} 
                className="p-1.5 rounded-lg hover:bg-amber-200/70 dark:hover:bg-amber-800/60 text-amber-700 dark:text-amber-400 transition-colors"
                title="تعديل الرسالة"
              >
                <Edit2 size={14} />
              </button>
            )}
            
            {m.role === 'assistant' && (
              <button 
                onClick={() => onRegenerate(index)} 
                className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 transition-colors"
                title="إعادة توليد"
              >
                <RefreshCw size={14} />
              </button>
            )}

            <button 
              onClick={() => copyToClipboard(m.content, index.toString())} 
              className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 transition-colors" 
              title="نسخ النص"
            >
              {copyFeedback === index.toString() ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            </button>
            
            <button 
              onClick={() => shareMessage(m.content)} 
              className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 transition-colors" 
              title="مشاركة"
            >
              <Share2 size={14} />
            </button>

            {m.role === 'assistant' && (
              <>
                <button 
                  onClick={() => isGeneratingAudio === index.toString() ? stopRecitation() : handleAIRecitation(m.content, index)} 
                  className={`p-1.5 rounded-lg transition-colors ${isGeneratingAudio === index.toString() ? 'bg-amber-600 text-white' : 'hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400'}`}
                  title="تلاوة احترافية"
                >
                  {isGeneratingAudio === index.toString() ? <StopCircle size={14} /> : <Volume2 size={14} />}
                </button>

                {audioUrl && (
                  <button 
                    onClick={() => downloadAudioFile(audioUrl, `midad_recitation_${index}`)}
                    className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 transition-colors"
                    title="تنزيل التلاوة"
                  >
                    <Download size={14} />
                  </button>
                )}

                <button 
                  onClick={() => sendMessage(`واصل المدد في هذه النقطة بالتحديد: ${m.content.substring(0, 500)}...`)}
                  className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 transition-colors"
                  title="واصل المدد"
                >
                  <Sparkles size={14} />
                </button>
                <button 
                  onClick={() => sendMessage(`لخص لي هذه الرسالة بأسلوب بسيط وميسر: ${m.content.substring(0, 500)}...`)}
                  className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 transition-colors"
                  title="تبسيط المعنى"
                >
                  <Zap size={14} />
                </button>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('open_spiritual_vision', { detail: { text: m.content } }))}
                  className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 transition-colors" 
                  title="رؤية بصرية"
                >
                  <ImageIcon size={14} />
                </button>
              </>
            )}

            <div className="flex items-center">
              <AdvancedReadAloud 
                text={m.content} 
                voiceName={selectedVoice}
                className="gap-1"
                buttonClassName="p-1.5 rounded-lg text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {m.role === 'assistant' && !isStreaming && (() => {
        const navDetails = extractQuranNavigationDetails(m.content);
        if (!navDetails) return null;
        return (
          <motion.div 
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 w-full max-w-[95%] bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-emerald-500/10 dark:from-amber-900/40 dark:via-amber-800/40 dark:to-emerald-950/40 border border-amber-400/40 dark:border-amber-700/60 rounded-2xl p-3 shadow-sm flex items-center justify-between gap-3"
            dir="rtl"
          >
            <div className="flex items-center gap-2.5 text-amber-950 dark:text-amber-100">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300">
                <Book size={18} />
              </div>
              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">الانتقال التفاعلي للمصحف الشريف</span>
                <span className="text-sm font-bold text-amber-950 dark:text-amber-100">
                  {navDetails.surah ? `سورة ${navDetails.surah}` : ''} {navDetails.ayah ? `- الآية ${navDetails.ayah}` : ''} {navDetails.page ? `(صفحة ${navDetails.page})` : ''}
                </span>
              </div>
            </div>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('navigate_quran', { detail: navDetails }))}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1 shrink-0"
            >
              <span>افتح المصحف</span>
              <ChevronRight size={16} />
            </button>
          </motion.div>
        );
      })()}

      {m.role === 'assistant' && m.suggestions && m.suggestions.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 w-full max-w-[95%] bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40 rounded-2xl p-3 shadow-sm"
          dir="rtl"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 mb-2">
            <Sparkles size={14} className="text-amber-500" />
            <span>محاور وأسئلة لإثراء الحوار وإدامة التدبر:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {m.suggestions.map((sug, sIdx) => (
              <button
                key={sIdx}
                onClick={() => sendMessage(sug)}
                className="text-xs bg-white dark:bg-[#171412] hover:bg-amber-600 hover:text-white dark:hover:bg-amber-600 text-amber-950 dark:text-amber-100 border border-amber-200/60 dark:border-amber-800/60 rounded-xl px-3 py-1.5 transition-colors duration-150 shadow-xs text-right font-medium"
              >
                {sug}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {m.role === 'assistant' && m.groundingMetadata && (() => {
        const chunks = m.groundingMetadata.groundingChunks || [];
        const sources = chunks.map((c: any) => ({
          title: c.web?.title || c.title || 'مصدر ويب',
          uri: c.web?.uri || c.uri || ''
        })).filter((s: any) => s.uri);

        const queries = m.groundingMetadata.webSearchQueries || [];
        if (sources.length === 0 && queries.length === 0) return null;

        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 w-full max-w-[95%] bg-amber-50/40 dark:bg-amber-900/5 backdrop-blur-md rounded-2xl border border-amber-200/40 dark:border-amber-800/30 overflow-hidden shadow-sm p-4" 
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-200/30 dark:border-amber-800/20">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100 font-bold text-sm">
                <Globe size={16} className="text-emerald-600" />
                <span>المصادر والمراجع الموثقة</span>
              </div>
            </div>

            {queries.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-[11px] text-amber-700/70 dark:text-amber-400/70 font-medium">عمليات البحث:</span>
                {queries.map((q: string, idx: number) => (
                  <span key={idx} className="bg-amber-100/60 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 border border-amber-200/40 dark:border-amber-800/30">
                    {q}
                  </span>
                ))}
              </div>
            )}

            {sources.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sources.map((src: any, idx: number) => {
                  const cleanTitle = src.title.length > 75 ? src.title.substring(0, 72) + '...' : src.title;
                  let domain = '';
                  try {
                    domain = new URL(src.uri).hostname.replace('www.', '');
                  } catch (e) {}

                  return (
                    <a
                      key={idx}
                      href={src.uri}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start gap-3 p-2.5 rounded-xl bg-white/60 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all border border-amber-100/40 dark:border-amber-900/20 hover:border-emerald-300 dark:hover:border-emerald-800 group/link shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                    >
                      <div className="flex items-center justify-center text-[11px] w-6 h-6 bg-emerald-600 text-white rounded-lg shrink-0 font-bold shadow-md shadow-emerald-900/10">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[12px] leading-tight text-amber-950 dark:text-amber-50 group-hover/link:text-emerald-700 dark:group-hover/link:text-emerald-400 transition-colors text-right">
                          {cleanTitle}
                        </div>
                        {domain && (
                          <div className="text-[9px] text-amber-800/50 dark:text-amber-400/50 font-mono mt-1 text-right">
                            {domain}
                          </div>
                        )}
                      </div>
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-2 text-amber-800/40 dark:text-amber-400/40 text-xs italic">
                جاري استحضار المصادر...
              </div>
            )}
          </motion.div>
        );
      })()}
    </div>
  );
}, (prev, next) => (
  prev.m === next.m &&
  prev.m.model === next.m.model &&
  prev.m.content === next.m.content &&
  prev.m.thought === next.m.thought &&
  prev.m.groundingMetadata === next.m.groundingMetadata &&
  prev.index === next.index &&
  prev.isStreaming === next.isStreaming &&
  prev.audioUrl === next.audioUrl &&
  prev.selectedVoice === next.selectedVoice &&
  prev.selectedModel === next.selectedModel &&
  prev.providerName === next.providerName &&
  (prev.isGeneratingAudio === prev.index.toString()) === (next.isGeneratingAudio === next.index.toString()) &&
  (prev.copyFeedback === prev.index.toString()) === (next.copyFeedback === next.index.toString())
));

