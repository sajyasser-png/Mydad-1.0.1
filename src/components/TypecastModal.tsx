import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Play } from 'lucide-react';

interface TypecastModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
}

export const TypecastModal: React.FC<TypecastModalProps> = ({ isOpen, onClose, text }) => {
  const [showText, setShowText] = useState(true);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="typecast-modal" 
          className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4" 
          dir="rtl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="relative w-full max-w-5xl h-[90vh] bg-white dark:bg-[#171412] rounded-2xl shadow-2xl border border-amber-200/60 dark:border-amber-900/50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200/50 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 z-10">
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="w-9 h-9 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-xl flex items-center justify-center transition-colors text-amber-800 dark:text-amber-200"
                  aria-label="إغلاق"
                >
                  <X size={18} />
                </button>
                <button
                  onClick={() => setShowText(!showText)}
                  className="h-9 px-3.5 bg-amber-100/80 dark:bg-amber-900/35 text-amber-900 dark:text-amber-200 rounded-xl text-xs font-bold hover:bg-amber-200/80 dark:hover:bg-amber-900/55 transition-colors"
                >
                  {showText ? 'إخفاء النص' : 'إظهار النص'}
                </button>
              </div>
              
              <a
                href="https://typecast.ai/text-to-speech/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-amber-950 dark:text-amber-100 font-bold hover:text-amber-700 dark:hover:text-amber-300 transition-colors text-sm sm:text-base"
              >
                <span>مساحة عمل Typecast.ai</span>
                <ExternalLink size={16} className="text-amber-600 dark:text-amber-400" />
              </a>
            </div>

            {/* Text Display */}
            <AnimatePresence>
              {showText && (
                <motion.div
                  key="typecast-text"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-amber-200/50 dark:border-amber-900/40 bg-white/95 dark:bg-[#171412]/95 z-10"
                >
                  <div className="p-3 sm:p-4 flex items-center gap-3">
                    <button 
                      onClick={() => {
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                          navigator.clipboard.writeText(text).catch(console.error);
                        }
                      }}
                      className="flex-shrink-0 h-10 flex items-center gap-2 px-4 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-sm"
                    >
                      <Play size={15} className="fill-current" />
                      <span>نسخ النص</span>
                    </button>
                    <div className="flex-1 p-2.5 bg-amber-50/50 dark:bg-black/25 rounded-xl text-xs sm:text-sm text-amber-950/85 dark:text-amber-100/85 max-h-24 overflow-y-auto border border-amber-200/50 dark:border-amber-900/40 leading-relaxed">
                      {text}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Iframe */}
            <div className="flex-1 w-full bg-amber-50/20 dark:bg-[#0c0a09] relative">
              <iframe
                src="https://typecast.ai/text-to-speech/"
                className="absolute inset-0 w-full h-full border-0"
                title="Typecast Workspace"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
