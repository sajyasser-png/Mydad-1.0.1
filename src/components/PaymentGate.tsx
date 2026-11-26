import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Unlock } from 'lucide-react';

interface PaymentGateProps {
  onUnlock: () => void;
}

const GATE_DHIKR = "الحمد لله وحده والصلاة والسلام على رسول الله";

export const PaymentGate: React.FC<PaymentGateProps> = ({ onUnlock }) => {
  const [clickedWords, setClickedWords] = useState<Set<string>>(new Set());

  const allWords = useMemo(
    () => GATE_DHIKR.split(' ').map((word, i) => ({ id: `w_${i}`, word })),
    []
  );

  const handleWordClick = (id: string) => {
    const newClicked = new Set(clickedWords);
    newClicked.add(id);
    setClickedWords(newClicked);

    if (newClicked.size === allWords.length) {
      setTimeout(() => {
        onUnlock();
      }, 400);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0a0705] text-white p-4 overflow-y-auto select-none">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03] islamic-pattern" />
      </div>

      <motion.div
        key="prayer"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full bg-[#171412]/95 backdrop-blur-xl p-6 sm:p-10 rounded-2xl shadow-2xl border border-amber-900/40 text-center relative z-10"
      >
        <div className="mb-8">
          <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-4">
            <Unlock className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-amber-100 font-kufi mb-2">
            بوابة المداد
          </h2>
          <p className="text-amber-200/60 text-sm">
            المس كلمات الذكر لفتح البوابة
          </p>
        </div>

        <div className="text-2xl sm:text-4xl font-quran leading-relaxed" dir="rtl">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-5">
            {allWords.map(({ id, word }) => {
              const isClicked = clickedWords.has(id);
              return (
                <motion.button
                  key={id}
                  whileHover={{ scale: isClicked ? 1 : 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleWordClick(id)}
                  className={`transition-all duration-300 relative ${
                    isClicked
                      ? 'text-amber-300 font-bold'
                      : 'text-white/35 hover:text-white/70 cursor-pointer'
                  }`}
                >
                  {word}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="mt-10 max-w-md mx-auto">
          <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400"
              initial={{ width: 0 }}
              animate={{ width: `${(clickedWords.size / allWords.length) * 100}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-3 text-amber-300/70 text-xs font-bold tabular-nums">
            <span>اكتمال الذكر</span>
            <span>{Math.round((clickedWords.size / allWords.length) * 100)}%</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

