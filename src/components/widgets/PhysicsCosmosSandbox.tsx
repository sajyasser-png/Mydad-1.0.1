import React, { useState, useEffect, useRef } from 'react';
import { Sliders, Play, Pause, X, Sparkles, Compass, Waves, Orbit, Flame, Globe } from 'lucide-react';

type SimMode = 'entropy' | 'expansion' | 'seas' | 'orbits';

interface PhysicsCosmosSandboxProps {
  onClose: () => void;
  onSendToChat?: (text: string) => void;
}

const PARTICLE_COUNT = 60;
const GALAXY_COUNT = 12;

export const PhysicsCosmosSandbox: React.FC<PhysicsCosmosSandboxProps> = ({ onClose, onSendToChat }) => {
  const [mode, setMode] = useState<SimMode>('entropy');
  const [isPlaying, setIsPlaying] = useState(true);

  // Simulation parameters
  const [entropyOrder, setEntropyOrder] = useState<number>(75); // 0 = Pure chaos, 100 = Perfect Order
  const [temperature, setTemperature] = useState<number>(50);
  const [hubbleConstant, setHubbleConstant] = useState<number>(65); // Spacetime expansion rate
  const [haloclineTension, setHaloclineTension] = useState<number>(90);
  const [orbitalSpeed, setOrbitalSpeed] = useState<number>(50);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let frame = 0;

    // Particle objects for entropy mode
    const particles = Array.from({ length: 100 }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      targetX: (i % 10) * (canvas.width / 10) + 20,
      targetY: Math.floor(i / 10) * (canvas.height / 10) + 20,
      radius: 3 + Math.random() * 2
    }));

    // Galaxy points for expansion mode
    const galaxies = Array.from({ length: 25 }, () => ({
      angle: Math.random() * Math.PI * 2,
      distance: 20 + Math.random() * 150,
      size: 4 + Math.random() * 6
    }));

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dark Cosmic Canvas Background
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (mode === 'entropy') {
        // Mode 1: Entropy & Order
        const chaos = (100 - entropyOrder) / 100;
        const tempFactor = temperature / 50;

        ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }

        particles.slice(0, PARTICLE_COUNT).forEach((p, idx) => {
          if (chaos < 0.1) {
            p.x += (p.targetX - p.x) * 0.05;
            p.y += (p.targetY - p.y) * 0.05;
          } else {
            p.x += (p.vx * tempFactor) + (Math.random() - 0.5) * chaos * 3;
            p.y += (p.vy * tempFactor) + (Math.random() - 0.5) * chaos * 3;

            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = idx % 2 === 0 ? '#f59e0b' : '#10b981';
          ctx.fill();

          ctx.shadowBlur = 8;
          ctx.shadowColor = idx % 2 === 0 ? '#f59e0b' : '#10b981';
        });
        ctx.shadowBlur = 0;

      } else if (mode === 'expansion') {
        // Mode 2: Expanding Universe
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const scale = 1 + ((frame * (hubbleConstant / 1000)) % 2);

        ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.lineWidth = 1;

        for (let r = 20; r < 300; r += 30) {
          ctx.beginPath();
          ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
          ctx.stroke();
        }

        galaxies.slice(0, GALAXY_COUNT).forEach((g, i) => {
          const currentDist = (g.distance * scale) % (canvas.width / 2);
          const x = cx + Math.cos(g.angle) * currentDist;
          const y = cy + Math.sin(g.angle) * currentDist;

          ctx.beginPath();
          ctx.arc(x, y, g.size, 0, Math.PI * 2);
          ctx.fillStyle = i % 3 === 0 ? '#ec4899' : i % 2 === 0 ? '#8b5cf6' : '#3b82f6';
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(x, y);
          ctx.strokeStyle = 'rgba(236, 72, 153, 0.15)';
          ctx.stroke();
        });

      } else if (mode === 'seas') {
        // Mode 3: Merging Seas Halocline Barrier
        const midX = canvas.width / 2;

        // Sea 1 (Freshwater / Mediterranean)
        const grad1 = ctx.createLinearGradient(0, 0, midX, 0);
        grad1.addColorStop(0, '#0284c7');
        grad1.addColorStop(1, '#0369a1');
        ctx.fillStyle = grad1;
        ctx.fillRect(0, 0, midX, canvas.height);

        // Sea 2 (Dense Saltwater / Atlantic)
        const grad2 = ctx.createLinearGradient(midX, 0, canvas.width, 0);
        grad2.addColorStop(0, '#0f766e');
        grad2.addColorStop(1, '#115e59');
        ctx.fillStyle = grad2;
        ctx.fillRect(midX, 0, canvas.width - midX, canvas.height);

        // Halocline Barrier Line
        ctx.beginPath();
        const waveAmp = (100 - haloclineTension) / 5;
        for (let y = 0; y <= canvas.height; y += 5) {
          const x = midX + Math.sin(y * 0.05 + frame * 0.05) * waveAmp;
          if (y === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#f59e0b';
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#fef3c7';
        ctx.font = 'bold 12px font-serif';
        ctx.fillText('بحر عذب / كثافة أقل', 30, 30);
        ctx.fillText('بحر مالح / كثافة أعلى', canvas.width - 160, 30);
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('البرزخ الفاصل ﴿بَيْنَهُمَا بَرْزَخٌ﴾', midX - 70, canvas.height - 20);

      } else if (mode === 'orbits') {
        // Mode 4: Gravitational Orbits
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // Central Star
        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#f59e0b';

        const orbits = [60, 110, 160, 210];
        orbits.forEach((r, idx) => {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.stroke();

          const angle = (frame * (orbitalSpeed / 2000) * (4 - idx)) + idx;
          const px = cx + Math.cos(angle) * r;
          const py = cy + Math.sin(angle) * r;

          ctx.beginPath();
          ctx.arc(px, py, 6 + idx * 2, 0, Math.PI * 2);
          ctx.fillStyle = idx === 0 ? '#38bdf8' : idx === 1 ? '#4ade80' : idx === 2 ? '#f43f5e' : '#c084fc';
          ctx.fill();
        });
        ctx.shadowBlur = 0;
      }

      if (isPlaying) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode, isPlaying, entropyOrder, temperature, hubbleConstant, haloclineTension, orbitalSpeed]);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#171412] rounded-2xl shadow-2xl border border-amber-500/20 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-800 via-amber-800 to-zinc-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-400/30">
              <Compass className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-serif text-amber-100">مختبر المحاكاة التفاعلي (Physics &amp; Cosmos Sandbox)</h2>
              <p className="text-xs text-amber-200/80">محاكاة تفاعلية مباشرة للسنن والظواهر الكونية المرتبطة بالقرآن العظيم</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="p-3 bg-zinc-100 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700/50 flex flex-wrap gap-2">
          <button
            onClick={() => setMode('entropy')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${mode === 'entropy' ? 'bg-amber-600 text-white shadow-md' : 'bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'}`}
          >
            <Flame className="w-4 h-4" />
            <span>الإنتروبي والنظام ﴿بِمِقْدَارٍ﴾</span>
          </button>
          <button
            onClick={() => setMode('expansion')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${mode === 'expansion' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'}`}
          >
            <Globe className="w-4 h-4" />
            <span>تمدد الكون ﴿وَإِنَّا لَمُوسِعُونَ﴾</span>
          </button>
          <button
            onClick={() => setMode('seas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${mode === 'seas' ? 'bg-teal-600 text-white shadow-md' : 'bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'}`}
          >
            <Waves className="w-4 h-4" />
            <span>البرزخ المائي ﴿بَيْنَهُمَا بَرْزَخٌ﴾</span>
          </button>
          <button
            onClick={() => setMode('orbits')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${mode === 'orbits' ? 'bg-rose-600 text-white shadow-md' : 'bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'}`}
          >
            <Orbit className="w-4 h-4" />
            <span>الأفلاك ﴿فِي فَلَكٍ يَسْبَحُونَ﴾</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 flex flex-col md:flex-row gap-5 overflow-y-auto flex-1">
          {/* Canvas Rendering Box */}
          <div className="flex-1 bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center relative min-h-[300px]">
            <canvas ref={canvasRef} width={500} height={320} className="w-full h-full object-cover" />
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="absolute top-3 right-3 p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-amber-400 border border-zinc-700 backdrop-blur-md transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>

          {/* Controls & Quranic Reflection */}
          <div className="w-full md:w-80 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block">الآية الموجهة للمحاكاة</span>
                <p className="text-base font-bold font-serif text-amber-900 dark:text-amber-200 mt-1">
                  {mode === 'entropy' && '﴿وَكُلُّ شَيْءٍ عِندَهُ بِمِقْدَارٍ﴾'}
                  {mode === 'expansion' && '﴿وَالسَّمَاءَ بَنَيْنَاهَا بِأَيْدٍ وَإِنَّا لَمُوسِعُونَ﴾'}
                  {mode === 'seas' && '﴿مَرَجَ الْبَحْرَيْنِ يَلْتَقِيَانِ بَيْنَهُمَا بَرْزَخٌ لَّايَبْغِيَانِ﴾'}
                  {mode === 'orbits' && '﴿لا الشَّمْسُ يَنبَغِي لَهَا أَن تُدْرِكَ الْقَمَرَ وَلا اللَّيْلُ سَابِقُ النَّهَارِ وَكُلٌّ فِي فَلَكٍ يَسْبَحُونَ﴾'}
                </p>
              </div>

              {/* Controls */}
              <div className="space-y-3 bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700/50">
                <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-600" />
                  <span>متغيرات الفيزياء والكون:</span>
                </h4>

                {mode === 'entropy' && (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                        <span>مستوى النظام والضبط الكمي</span>
                        <span className="font-mono tabular-nums">{entropyOrder}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={entropyOrder}
                        onChange={(e) => setEntropyOrder(Number(e.target.value))}
                        className="w-full accent-amber-600 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                        <span>درجة الحرارة والطاقة الحركية</span>
                        <span className="font-mono tabular-nums">{temperature} K</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={temperature}
                        onChange={(e) => setTemperature(Number(e.target.value))}
                        className="w-full accent-amber-600 cursor-pointer"
                      />
                    </div>
                  </>
                )}

                {mode === 'expansion' && (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                        <span>معدل التمدد (ثابت هابل H₀)</span>
                        <span className="font-mono">{hubbleConstant} km/s/Mpc</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="150"
                        value={hubbleConstant}
                        onChange={(e) => setHubbleConstant(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </>
                )}

                {mode === 'seas' && (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                        <span>قوة التوتر السطحي للبرزخ</span>
                        <span className="font-mono">{haloclineTension}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={haloclineTension}
                        onChange={(e) => setHaloclineTension(Number(e.target.value))}
                        className="w-full accent-teal-600 cursor-pointer"
                      />
                    </div>
                  </>
                )}

                {mode === 'orbits' && (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                        <span>سرعة الدوران المداري</span>
                        <span className="font-mono">{orbitalSpeed}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={orbitalSpeed}
                        onChange={(e) => setOrbitalSpeed(Number(e.target.value))}
                        className="w-full accent-rose-600 cursor-pointer"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {onSendToChat && (
              <button
                onClick={() => {
                  onSendToChat(`أجريت محاكاة تفاعلية في مختبر الفيزياء لنموذج: ${mode === 'entropy' ? 'الانتروبي والمقادير' : mode === 'expansion' ? 'تمدد الكون' : mode === 'seas' ? 'البرزخ المائي' : 'الأفلاك والمدارات'}. يرجى إعطائي تفصيلاً علمياً وقرآنياً شمولياً.`);
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                <span>مناقشة نتائج المحاكاة مع «مداد»</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
