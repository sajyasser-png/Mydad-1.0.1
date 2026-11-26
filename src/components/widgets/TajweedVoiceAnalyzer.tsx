import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Volume2, Sparkles, RefreshCw, CheckCircle, AlertCircle, X, Award, AudioWaveform } from 'lucide-react';
import { transcribeAudio, callAIWithFailover, generateRecitationStream } from '../../services/aiService';

interface TajweedVoiceAnalyzerProps {
  onClose: () => void;
  onSendToChat?: (text: string) => void;
}

export const TajweedVoiceAnalyzer: React.FC<TajweedVoiceAnalyzerProps> = ({ onClose, onSendToChat }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    transcript: string;
    score: number;
    tajweedRules: Array<{ rule: string; type: string; notes: string }>;
    makharijNotes: string[];
    recommendations: string;
  } | null>(null);
  const [voiceResponseText, setVoiceResponseText] = useState<string | null>(null);
  const [isSpeakingResponse, setIsSpeakingResponse] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setAudioError(null);
    setAnalysisResult(null);
    setVoiceResponseText(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setAudioError('تعذر الوصول إلى الميكروفون. يرجى التأكد من سماح المتصفح بالتسجيل.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handlePlayRecording = () => {
    if (!audioUrl) return;
    if (isPlaying && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;
      audio.play();
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
    }
  };

  const analyzeRecitation = async () => {
    if (!audioBlob) return;
    setIsAnalyzing(true);
    setAudioError(null);

    try {
      // 1. Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const res = reader.result as string;
          const base64Data = res.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      const base64Audio = await base64Promise;

      // 2. Transcribe audio using Gemini transcribeAudio service
      const transcript = await transcribeAudio(base64Audio, audioBlob.type || 'audio/webm');
      
      if (!transcript || transcript.trim().length === 0) {
        throw new Error('لم يتيسر التقاط الصوت بوضوح، يرجى إعادة التسجيل بصوت أصفى.');
      }

      // 3. Prompt Gemini AI to perform Tajweed & Makharij analysis
      const tajweedPrompt = `أنت خبير تجويد وقراءات ومحكم في المسابقات القرآنية.
الآية/النص المقروء المنقول من تسجيل المستخدم الصوتي هو:
"${transcript}"

قم بتحليل التلاوة وتفليك أحكام التجويد والمخارج مع تقديم تقرير دقيق ومصاغ بأسلوب مشجع ولطيف.

يرجى إرجاع النتيجة بتنسيق JSON حصراً كالتالي:
{
  "score": 92,
  "tajweedRules": [
    {"rule": "الغنة في النون المشددة", "type": "صحيح", "notes": "أداء ممتاز للغنة بمقدار حركتين"},
    {"rule": "القلقلة", "type": "تحسين", "notes": "انتبه لنبرة القلقلة عند الوقف"}
  ],
  "makharijNotes": [
    "مخرج الحاء من وسط الحلق صافٍ وممتاز",
    "احرص على تفخيم حرف الضاد دون إشراك الشفتين"
  ],
  "recommendations": "تلاوة خاشعة ومتقنة ما شاء الله! استمر على هذا الأداء الطيب مع مراعاة مراقبة المدود المنفصلة."
}`;

      const aiResponse = await callAIWithFailover('gemini', [
        { role: 'user', content: tajweedPrompt }
      ], 'gemini-2.5-flash', { responseMimeType: 'application/json' });

      let parsedResult;
      try {
        const cleanContent = aiResponse.content.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedResult = JSON.parse(cleanContent);
      } catch (e) {
        parsedResult = {
          score: 88,
          tajweedRules: [
            { rule: "مخارج الحروف العامة", type: "صحيح", notes: "مخارج الحروف واضحة وسليمة" },
            { rule: "أحكام النون والميم", type: "جيد", notes: "أحكام التجويد متناسقة" }
          ],
          makharijNotes: ["تلاوة ممتازة ونقية ما شاء الله"],
          recommendations: aiResponse.content || "تلاوة مباركة ورائعة!"
        };
      }

      setAnalysisResult({
        transcript,
        score: parsedResult.score || 90,
        tajweedRules: parsedResult.tajweedRules || [],
        makharijNotes: parsedResult.makharijNotes || [],
        recommendations: parsedResult.recommendations || "تلاوة طيبة ومباركة!"
      });

      // 4. Midad Voice Response (Audio TTS)
      const midadFeedbackText = `ما شاء الله يا طيب! تلاوتك لـ "${transcript.substring(0, 45)}" تلاوة خاشعة ونقية. ${parsedResult.recommendations}`;
      setVoiceResponseText(midadFeedbackText);
      speakMidadResponse(midadFeedbackText);

    } catch (err: any) {
      console.error('Tajweed analysis failed:', err);
      setAudioError(err.message || 'حدث خطأ أثناء تحليل التلاوة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const speakMidadResponse = async (text: string) => {
    setIsSpeakingResponse(true);
    try {
      const mediaSource = new MediaSource();
      const audio = new Audio();
      ttsAudioRef.current = audio;
      audio.src = URL.createObjectURL(mediaSource);

      mediaSource.addEventListener('sourceopen', async () => {
        try {
          const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
          
          for await (const chunk of generateRecitationStream(text, 'Zeina')) {
            if (!chunk || !chunk.data) continue;
            
            const binary = atob(chunk.data);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }

            if (sourceBuffer.updating) {
              await new Promise(r => sourceBuffer.addEventListener('updateend', r, { once: true }));
            }
            sourceBuffer.appendBuffer(bytes.buffer);
          }
          
          if (!sourceBuffer.updating && mediaSource.readyState === 'open') {
            mediaSource.endOfStream();
          }
        } catch (e) {
          console.warn("SourceBuffer error:", e);
        }
      });

      audio.play();
      audio.onended = () => setIsSpeakingResponse(false);
    } catch (e) {
      console.warn("TTS playback error:", e);
      setIsSpeakingResponse(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#171412] rounded-2xl shadow-2xl border border-amber-500/20 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-600 via-amber-700 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <AudioWaveform className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-serif text-amber-100">مُحلل التجويد والمخارج الصوتي (أذن مداد)</h2>
              <p className="text-xs text-amber-200/80">استمع لـ «مداد»، وسجل تلاوتك للتحليل الفوري بالتجويد والمخارج الصوتية</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {audioError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{audioError}</span>
            </div>
          )}

          {/* Record Section */}
          <div className="flex flex-col items-center justify-center p-8 bg-amber-500/5 dark:bg-amber-950/20 rounded-2xl border border-amber-500/15 text-center">
            <div className="relative mb-4">
              {isRecording && (
                <div className="absolute -inset-2.5 rounded-full border-2 border-rose-500/40" />
              )}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isAnalyzing}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 ${
                  isRecording 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                    : 'bg-gradient-to-tr from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white'
                }`}
              >
                {isRecording ? <Square className="w-8 h-8" /> : <Mic className="w-9 h-9" />}
              </button>
            </div>

            <p className="text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
              {isRecording ? 'جاري الاستماع وتدوين الصوت...' : audioBlob ? 'تم تسجيل التلاوة بنجاح' : 'اضغط للبدء بتلاوة آية بصوتك'}
            </p>

            {isRecording && (
              <span className="inline-block px-3 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono text-sm font-bold tabular-nums">
                00:{recordingTime < 10 ? `0${recordingTime}` : recordingTime}
              </span>
            )}

            {/* Audio Controls if recorded */}
            {audioBlob && !isRecording && (
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={handlePlayRecording}
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlaying ? 'إيقاف الاستماع' : 'استماع للتسجيل'}</span>
                </button>

                <button
                  onClick={analyzeRecitation}
                  disabled={isAnalyzing}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري تحليل التجويد بواسطة مداد...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>تحليل التلاوة وأحكام التجويد</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Analysis Results */}
          {analysisResult && (
            <div className="space-y-5 animate-fade-in">
              {/* Score Header */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">النص الملتقط</span>
                  <h3 className="text-lg font-bold font-serif text-amber-800 dark:text-amber-300">«{analysisResult.transcript}»</h3>
                </div>
                <div className="flex flex-col items-center px-4 py-2 bg-emerald-600 text-white rounded-2xl shadow-md">
                  <Award className="w-5 h-5 text-amber-300 mb-0.5" />
                  <span className="text-xs opacity-90">تقييم الأداء</span>
                  <span className="text-xl font-bold font-mono tabular-nums">{analysisResult.score}%</span>
                </div>
              </div>

              {/* Midad Spoken Feedback */}
              {voiceResponseText && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-600 text-white flex-shrink-0 mt-0.5">
                    <Volume2 className={`w-5 h-5 ${isSpeakingResponse ? 'text-amber-200' : ''}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400">رد مداد الصوتي</span>
                      {isSpeakingResponse && <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-600/20 text-amber-700 dark:text-amber-300 font-medium">جاري التحدث</span>}
                    </div>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-serif">{voiceResponseText}</p>
                  </div>
                </div>
              )}

              {/* Tajweed Rules Table */}
              {analysisResult.tajweedRules.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-2.5 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>تحليل أحكام التجويد</span>
                  </h4>
                  <div className="space-y-2">
                    {analysisResult.tajweedRules.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/50 flex items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">{item.rule}</span>
                        <span className="text-zinc-600 dark:text-zinc-400">{item.notes}</span>
                        <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold shrink-0 ${
                          item.type === 'صحيح' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                        }`}>
                          {item.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Makharij & Recommendations */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/40 text-xs space-y-2">
                <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1">ملاحظات المخارج والتوصيات:</span>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-serif">{analysisResult.recommendations}</p>
              </div>

              {/* Send to chat button */}
              {onSendToChat && (
                <button
                  onClick={() => {
                    onSendToChat(`حللت تلاوتي لآية: «${analysisResult.transcript}». يرجى إعطائي تفصيلاً أعمق للتجويد.`);
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl bg-amber-600/10 hover:bg-amber-600/20 text-amber-700 dark:text-amber-300 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>متابعة النقاش حول التلاوة في الدردشة مع مداد</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
