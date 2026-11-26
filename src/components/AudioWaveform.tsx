import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Volume2 } from 'lucide-react';

interface AudioWaveformProps {
  isListening: boolean;
  stream?: MediaStream | null;
  barCount?: number;
  className?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isListening,
  stream,
  barCount = 16,
  className = ''
}) => {
  const [volumes, setVolumes] = useState<number[]>(() => Array(barCount).fill(15));
  const [micLevel, setMicLevel] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!isListening) {
      setVolumes(Array(barCount).fill(10));
      setMicLevel(0);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      return;
    }

    let isSubscribed = true;

    // Try real AudioContext analysis if stream is provided or request audio stream volume
    const setupRealAudio = async () => {
      try {
        let activeStream = stream;
        if (!activeStream && navigator?.mediaDevices?.getUserMedia) {
          activeStream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
        }

        if (activeStream && isSubscribed) {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            analyser.smoothingTimeConstant = 0.7;
            const source = ctx.createMediaStreamSource(activeStream);
            source.connect(analyser);

            audioCtxRef.current = ctx;
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const updateRealVolume = () => {
              if (!isSubscribed) return;
              analyser.getByteFrequencyData(dataArray);

              let sum = 0;
              const newVols: number[] = [];
              const step = Math.floor(dataArray.length / barCount) || 1;

              for (let i = 0; i < barCount; i++) {
                const val = dataArray[i * step] || 0;
                sum += val;
                // Scale value to range 15% - 100%
                const scaled = Math.max(12, Math.min(100, (val / 255) * 100 * 1.5));
                newVols.push(scaled);
              }

              const avg = sum / dataArray.length;
              setMicLevel(Math.min(100, Math.round((avg / 255) * 100)));
              setVolumes(newVols);

              animFrameRef.current = requestAnimationFrame(updateRealVolume);
            };

            updateRealVolume();
            return;
          }
        }
      } catch (err) {
        console.warn("Real audio context setup failed, fallback to simulated waves", err);
      }

      // Simulated realistic wave pattern fallback
      const simulateWave = () => {
        if (!isSubscribed) return;
        const time = Date.now() / 150;
        const newVols = Array.from({ length: barCount }, (_, i) => {
          const base = Math.sin(time + i * 0.5) * 35 + 45;
          const noise = Math.random() * 20;
          return Math.max(15, Math.min(95, base + noise));
        });
        setVolumes(newVols);
        setMicLevel(Math.round(40 + Math.sin(time) * 30));
        animFrameRef.current = requestAnimationFrame(simulateWave);
      };

      simulateWave();
    };

    setupRealAudio();

    return () => {
      isSubscribed = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [isListening, stream, barCount]);

  if (!isListening) return null;

  return (
    <div className={`flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-rose-500/10 dark:bg-rose-950/30 border border-rose-500/20 backdrop-blur-sm ${className}`} dir="rtl">
      {/* Recording status dot */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
        </span>
        <span className="text-xs font-bold text-rose-600 dark:text-rose-300 hidden sm:inline">
          جاري التقاط الصوت...
        </span>
      </div>

      {/* Waveform visualizer bars */}
      <div className="flex items-end justify-center gap-1 h-7 min-w-[120px] px-1">
        {volumes.map((vol, idx) => (
          <motion.div
            key={idx}
            className="w-1 sm:w-1.5 rounded-full bg-gradient-to-t from-rose-600 via-amber-500 to-amber-300 shadow-sm"
            animate={{
              height: `${vol}%`,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
              mass: 0.5
            }}
          />
        ))}
      </div>

      {/* Mic DB indicator */}
      <div className="flex items-center gap-1 text-xs font-mono tabular-nums text-rose-700 dark:text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded-lg shrink-0">
        <Volume2 size={12} />
        <span>{micLevel}%</span>
      </div>
    </div>
  );
};
