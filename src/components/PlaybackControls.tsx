import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Square, SkipBack, SkipForward, Download, Share2 } from 'lucide-react';
import { downloadAudio, shareAudio } from '../services/audioCacheService';

interface PlaybackControlsProps {
  isPlaying: boolean;
  activeAyah: { surah: number; ayah: number } | null;
  quranData: any[] | null;
  audioProgress: number;
  currentAudioData: Uint8Array | null;
  currentMimeType: string;
  togglePlayPause: () => void;
  stopRecitation: () => void;
  skipForward: () => void;
  skipBackward: () => void;
}

export const PlaybackControls = ({
  isPlaying,
  activeAyah,
  quranData,
  audioProgress,
  currentAudioData,
  currentMimeType,
  togglePlayPause,
  stopRecitation,
  skipForward,
  skipBackward,
}: PlaybackControlsProps) => {
  const surahName = quranData?.find(s => s.id === activeAyah?.surah)?.name || '';
  const ayahNumber = activeAyah?.ayah === 0 ? 1 : activeAyah?.ayah;

  return (
    <AnimatePresence>
      {(isPlaying || activeAyah) && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-xl z-[90]"
          dir="rtl"
        >
          <div className="bg-white/95 dark:bg-[#171412]/95 backdrop-blur-xl px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-2xl shadow-xl border border-amber-200/60 dark:border-amber-900/50 flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={skipBackward}
                className="w-8 h-8 flex items-center justify-center bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                title="السابق"
              >
                <SkipForward size={15} />
              </button>
              <button
                onClick={togglePlayPause}
                className="w-10 h-10 flex items-center justify-center bg-amber-700 text-white rounded-xl hover:bg-amber-800 transition-colors shadow-sm active:scale-95"
                title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
              >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              </button>
              <button
                onClick={skipForward}
                className="w-8 h-8 flex items-center justify-center bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                title="التالي"
              >
                <SkipBack size={15} />
              </button>
              <button
                onClick={stopRecitation}
                className="w-8 h-8 flex items-center justify-center bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                title="إيقاف"
              >
                <Square size={14} fill="currentColor" />
              </button>
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-100 gap-2 tabular-nums">
                <span className="truncate font-kufi">{surahName}</span>
                <span className="text-amber-700 dark:text-amber-400 shrink-0">آية {ayahNumber}</span>
              </div>
              <div className="relative h-1.5 bg-amber-100 dark:bg-amber-900/40 rounded-full overflow-hidden">
                <motion.div
                  className="absolute top-0 right-0 h-full bg-amber-600 rounded-full"
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => {
                  if (currentAudioData && activeAyah) {
                    const fileName = `recitation_${activeAyah.surah}_${activeAyah.ayah}.wav`;
                    downloadAudio(currentAudioData, fileName, currentMimeType);
                  }
                }}
                disabled={!currentAudioData}
                className="w-8 h-8 flex items-center justify-center bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-40"
                title="تحميل التلاوة"
              >
                <Download size={15} />
              </button>
              <button
                onClick={() => {
                  if (currentAudioData && activeAyah) {
                    const fileName = `recitation_${activeAyah.surah}_${activeAyah.ayah}.wav`;
                    shareAudio(currentAudioData, fileName, currentMimeType);
                  }
                }}
                disabled={!currentAudioData}
                className="w-8 h-8 flex items-center justify-center bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-40"
                title="مشاركة التلاوة"
              >
                <Share2 size={15} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
