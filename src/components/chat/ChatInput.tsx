import React, { useState, useRef, useEffect, useImperativeHandle } from 'react';
import { Send, RefreshCw, MicOff, Mic, Paperclip, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AudioWaveform } from '../AudioWaveform';
import { safeLocalStorageGet, safeLocalStorageSet } from '../../lib/utils';

export interface ChatInputRef {
  append: (text: string) => void;
  clear: () => void;
  get: () => string;
  set: (text: string) => void;
}

export interface AttachmentType {
  data: string;
  mimeType: string;
  filename: string;
}

export const ChatInput = React.memo(React.forwardRef<ChatInputRef, { 
  onSendMessage: (text: string, attachments?: AttachmentType[]) => void, 
  isLoading: boolean, 
  isListening?: boolean, 
  isProcessingAudio?: boolean,
  toggleListening?: () => void,
  draftKey?: string
}>(({ 
  onSendMessage, 
  isLoading, 
  isListening = false, 
  isProcessingAudio = false,
  toggleListening,
  draftKey = 'midad_chat_input_draft'
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localInput, setLocalInput] = useState(() => {
    return draftKey ? safeLocalStorageGet(draftKey) || '' : '';
  });
  const [attachments, setAttachments] = useState<AttachmentType[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: FileList | File[]) => {
    const newAttachments: AttachmentType[] = [];
    let loadedCount = 0;
    const fileArray = Array.from(files);
    
    if (fileArray.length === 0) return;

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Str = (reader.result as string).split(',')[1];
        newAttachments.push({ data: base64Str, mimeType: file.type, filename: file.name });
        loadedCount++;
        
        if (loadedCount === fileArray.length) {
          setAttachments(prev => [...prev, ...newAttachments]);
          // Reset the input value so that the same files can be selected again if needed
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.onerror = (err) => {
        console.error("Error reading file:", file.name, err);
        loadedCount++;
        if (loadedCount === fileArray.length && newAttachments.length > 0) {
          setAttachments(prev => [...prev, ...newAttachments]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  useEffect(() => {
    if (draftKey) {
      safeLocalStorageSet(draftKey, localInput);
    }
  }, [localInput, draftKey]);

  useImperativeHandle(ref, () => ({
    append: (text: string) => {
      setLocalInput(prev => {
        const next = prev + (prev ? ' ' : '') + text;
        if (draftKey) safeLocalStorageSet(draftKey, next);
        return next;
      });
    },
    clear: () => {
      setLocalInput('');
      if (draftKey) safeLocalStorageSet(draftKey, '');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    },
    get: () => localInput,
    set: (text: string) => {
      setLocalInput(text);
      if (draftKey) safeLocalStorageSet(draftKey, text);
    }
  }));

  const handleSend = () => {
    if ((localInput.trim() || attachments.length > 0) && !isLoading && !isProcessingAudio) {
      onSendMessage(localInput, attachments.length > 0 ? attachments : undefined);
      setLocalInput('');
      setAttachments([]);
      if (draftKey) safeLocalStorageSet(draftKey, '');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  return (
    <div className="w-full flex flex-col gap-1.5">
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="w-full flex justify-center"
          >
            <AudioWaveform isListening={isListening} className="w-full justify-between shadow-sm" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Attachments List */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="flex flex-wrap gap-1.5 p-1.5 bg-amber-50/70 dark:bg-amber-950/20 rounded-xl border border-amber-200/50 dark:border-amber-800/40 max-h-24 overflow-y-auto w-fit"
            dir="rtl"
          >
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-[#1a1816] text-amber-900 dark:text-amber-100 rounded-lg max-w-[200px] overflow-hidden text-xs border border-amber-200/50 dark:border-amber-800/50 shrink-0"
              >
                {att.mimeType.startsWith('image/') ? (
                  <img
                    src={`data:${att.mimeType};base64,${att.data}`}
                    alt={att.filename}
                    className="w-5 h-5 rounded object-cover border border-amber-200"
                  />
                ) : att.mimeType.startsWith('video/') ? (
                  <span className="text-xs" title="فيديو">🎥</span>
                ) : att.mimeType.startsWith('audio/') ? (
                  <span className="text-xs" title="ملف صوتي">🎵</span>
                ) : (
                  <span className="text-xs" title="ملف">📎</span>
                )}
                <span className="truncate max-w-[110px] font-medium" title={att.filename}>{att.filename}</span>
                <button
                  type="button"
                  onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 p-0.5 rounded-full transition-colors"
                  title="إزالة المرفق"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`w-full flex items-end gap-1.5 bg-white/95 dark:bg-[#181614]/95 backdrop-blur-md px-2 py-1.5 rounded-2xl border transition-all duration-200 relative ${
          dragActive
            ? 'border-dashed border-2 border-amber-500 bg-amber-50/60 dark:bg-amber-950/30'
            : 'border-amber-200/70 dark:border-amber-800/50 shadow-sm focus-within:border-amber-400 dark:focus-within:border-amber-600 focus-within:shadow-md'
        }`}
      >
        {dragActive && (
          <div className="absolute inset-0 bg-amber-500/10 dark:bg-amber-500/20 backdrop-blur-[2px] rounded-2xl flex items-center justify-center border-2 border-dashed border-amber-500 pointer-events-none z-30">
            <p className="text-amber-800 dark:text-amber-200 font-bold text-xs flex items-center gap-1.5">
              <span>📥</span>
              <span>ألقِ الملفات هنا</span>
            </p>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*,audio/*,application/pdf,text/*"
          multiple
        />

        <div className="flex items-center gap-0.5 shrink-0 pb-0.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isProcessingAudio}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-amber-700 dark:text-amber-400 hover:bg-amber-100/80 dark:hover:bg-amber-900/40 transition-colors disabled:opacity-40"
            title="إرفاق ملف"
          >
            <Paperclip size={16} />
          </button>

          {toggleListening && (
            <button
              type="button"
              onClick={toggleListening}
              disabled={isProcessingAudio}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                isProcessingAudio
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-500 cursor-wait'
                  : isListening
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-amber-700 dark:text-amber-400 hover:bg-amber-100/80 dark:hover:bg-amber-900/40'
              }`}
              title={isProcessingAudio ? 'جاري معالجة الصوت...' : isListening ? 'إيقاف الاستماع' : 'تحدث بالصوت'}
            >
              {isProcessingAudio ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : isListening ? (
                <MicOff size={16} />
              ) : (
                <Mic size={16} />
              )}
            </button>
          )}
        </div>

        <div className="flex flex-col flex-1 relative min-w-0">
          <textarea
            ref={textareaRef}
            value={localInput}
            onChange={(e) => {
              setLocalInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              isProcessingAudio
                ? 'جاري تحويل الصوت...'
                : isListening
                  ? 'تحدث الآن...'
                  : 'اكتب رسالتك هنا...'
            }
            className="w-full py-2 px-1.5 bg-transparent border-none outline-none text-amber-950 dark:text-amber-50 resize-none min-h-[38px] max-h-[140px] placeholder:text-amber-900/45 dark:placeholder:text-amber-100/35 leading-6 block text-sm custom-scrollbar"
            dir="rtl"
            rows={1}
            disabled={isProcessingAudio}
          />
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={isLoading || (!localInput.trim() && attachments.length === 0)}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs active:scale-95 shrink-0 mb-0.5"
          title="إرسال"
        >
          <Send size={16} className="rtl:-scale-x-100" />
        </button>
      </div>
    </div>
  );
}));
