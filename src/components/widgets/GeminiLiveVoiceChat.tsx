import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Radio, Sparkles, X, RefreshCw, MessageSquare, Zap, Activity, Waves, Settings2, ShieldCheck, Cpu, Monitor, MonitorOff, Info, Minimize2 } from 'lucide-react';
import { getApiKey } from '../../services/aiService';

interface GeminiLiveVoiceChatProps {
  onClose: () => void;
  onSendToChat?: (text: string) => void;
  onToolCall?: (tool: string, action: string, params: any) => void;
  userApiKey?: string;
}

export const GeminiLiveVoiceChat: React.FC<GeminiLiveVoiceChatProps> = ({
  onClose,
  onSendToChat,
  onToolCall,
  userApiKey
}) => {
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [connectionMode, setConnectionMode] = useState<'websocket' | 'webspeech'>('websocket');
  const [isMicActive, setIsMicActive] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  
  const [selectedVoice, setSelectedVoice] = useState<string>('Zephyr');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.1-flash-live-preview');
  const [, setAvailableLiveModels] = useState<string[]>([
    'gemini-3.1-flash-live-preview',
    'gemini-2.5-flash-native-audio-latest',
    'gemini-3.5-live-translate-preview'
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [transcripts, setTranscripts] = useState<Array<{ sender: 'user' | 'model'; text: string; time: string }>>(() => {
    try {
      const saved = localStorage.getItem('midad_voice_chat_history');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('midad_voice_chat_history', JSON.stringify(transcripts));
    } catch (_) {}
  }, [transcripts]);
  const [currentModelText, setCurrentModelText] = useState<string>('');
  const [interimUserSpeech, setInterimUserSpeech] = useState<string>('');

  const wsRef = useRef<WebSocket | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenCaptureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [textInput, setTextInput] = useState<string>('');
  const [, setMicPermissionDenied] = useState<boolean>(false);

  // Fallback MediaRecorder for non-websocket REST mode
  const mediaRecorderRestRef = useRef<MediaRecorder | null>(null);
  const audioChunksRestRef = useRef<Blob[]>([]);
  const [, setIsRestRecording] = useState<boolean>(false);

  // Check and auto-update available live models from server
  useEffect(() => {
    fetchLiveModelsStatus();
  }, []);

  const fetchLiveModelsStatus = async () => {
    try {
      const activeApiKey = (userApiKey !== undefined ? userApiKey : getApiKey('gemini')).trim();
      const res = await fetch('/api/models/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: activeApiKey })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.models && Array.isArray(data.models)) {
          const liveModels = data.models.filter((m: string) => m.includes('live') || m.includes('flash'));
          if (liveModels.length > 0) {
            setAvailableLiveModels(Array.from(new Set(['gemini-3.1-flash-live-preview', ...liveModels])));
          }
        }
      }
    } catch (e) {
      console.warn("Could not auto-update models list:", e);
    }
  };

  // Connect WebSocket on mount or when reconnecting
  const startLiveSession = async () => {
    setErrorMessage(null);
    setConnectionState('connecting');

    // Clean up existing session
    stopLiveSession();

    try {
      const activeApiKey = (userApiKey !== undefined ? userApiKey : getApiKey('gemini')).trim();
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const keyParam = activeApiKey ? `&apiKey=${encodeURIComponent(activeApiKey)}` : '';
      const wsUrl = `${protocol}//${host}/api/live?voice=${selectedVoice}&model=${selectedModel}${keyParam}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const wsTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.warn("[Live Client] WebSocket connect timeout. Switching to Web Speech + REST mode.");
          enableWebSpeechFallback();
        }
      }, 4000);

      ws.onopen = () => {
        clearTimeout(wsTimeout);
        setConnectionState('connected');
        setConnectionMode('websocket');
        startMicrophoneCapture();
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'connected') {
            setSelectedModel(msg.model || selectedModel);
            setConnectionState('connected');
          } else if (msg.type === 'toolCall') {
            if (onToolCall) {
              onToolCall(msg.tool, msg.action, msg.params);
            }
          } else if (msg.type === 'audio' && msg.audio) {
            setIsSpeaking(true);
            playAudioChunk(msg.audio);
          } else if (msg.type === 'text' && msg.text) {
            setCurrentModelText((prev) => prev + msg.text);
          } else if (msg.type === 'turnComplete') {
            setIsSpeaking(false);
            setCurrentModelText((latestText) => {
              if (latestText.trim()) {
                setTranscripts((prev) => [
                  ...prev,
                  { sender: 'model', text: latestText.trim(), time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) }
                ]);
              }
              return '';
            });
          } else if (msg.type === 'interrupted') {
            setIsSpeaking(false);
            nextStartTimeRef.current = 0;
          } else if (msg.type === 'error') {
            console.warn("[Live Client] WebSocket error message received:", msg.error);
            enableWebSpeechFallback();
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };

      ws.onerror = (err) => {
        clearTimeout(wsTimeout);
        console.warn("WebSocket status warning:", err);
        enableWebSpeechFallback();
      };

      ws.onclose = () => {
        if (connectionMode === 'websocket' && connectionState === 'connecting') {
          enableWebSpeechFallback();
        } else {
          stopMicrophoneCapture();
        }
      };
    } catch (e: any) {
      console.warn("Failed to start WebSocket Live session, using Web Speech fallback:", e);
      enableWebSpeechFallback();
    }
  };

  // Web Speech API Fallback Mode
  const enableWebSpeechFallback = () => {
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (_) {}
      wsRef.current = null;
    }
    setConnectionMode('webspeech');
    setConnectionState('connected');
    setErrorMessage(null);
    initWebSpeechRecognition();
  };

  const initWebSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Web Speech API not supported in this browser.");
      setErrorMessage("المتصفح لا يدعم التعرّف الصوتي التلقائي. يمكنك إدخال الأسئلة كتابةً بالأسفل للتحدث صوتياً.");
      return;
    }

    try {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }

      const recognition = new SpeechRecognition();
      speechRecognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ar-SA';

      recognition.onstart = () => {
        setIsListening(true);
        setMicPermissionDenied(false);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (interim) {
          setInterimUserSpeech(interim);
          setIsListening(true);
        }

        if (final.trim()) {
          setInterimUserSpeech('');
          handleUserVoiceMessage(final.trim());
        }
      };

      recognition.onerror = (e: any) => {
        console.warn("Speech Recognition error:", e?.error);
        if (e?.error === 'not-allowed') {
          setMicPermissionDenied(true);
          setErrorMessage("إذن الميكروفون غير مسموح. يمكنك تفعيل الميكروفون من إعدادات المتصفح أو الكتابة بالحقل السفلي.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (isMicActive && connectionMode === 'webspeech') {
          setTimeout(() => {
            try { recognition.start(); } catch (_) {}
          }, 1000);
        }
      };

      if (isMicActive) {
        recognition.start();
      }
    } catch (e: any) {
      console.warn("Error starting Web Speech Recognition:", e);
    }
  };

  const handleUserVoiceMessage = async (userText: string) => {
    if (!userText.trim()) return;

    setTranscripts((prev) => [
      ...prev,
      { sender: 'user', text: userText, time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) }
    ]);

    setIsSpeaking(true);
    setCurrentModelText('جاري إعداد الرد الصوتي...');

    try {
      const activeApiKey = (userApiKey !== undefined ? userApiKey : getApiKey('gemini')).trim();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          apiKey: activeApiKey,
          history: transcripts,
          systemInstruction: "أنت «مداد الرحمن» - القارئ والمقرئ المجود وخبير القراءات والتجويد والمكتبة الإسلامية. لديك القدرة الكاملة على تلاوة وترتيل وقراءة آيات القرآن الكريم، وشرح أحكام التجويد ومخارج الحروف، والرد على أسئلة العلوم الشرعية. لا تقل أبداً أنك لا تملك القدرة على القراءة أو أن دورك يقتصر على اختيار قراء آخرين؛ بل أنت مقرئ ومعلم وقارئ مجود مبارك. أجب بإيجاز وفصاحة ورخامة باللغة العربية."
        })
      });

      if (!res.ok) throw new Error("API call failed");
      const data = await res.json();
      const reply = data.reply || "أهلاً بك، أنا مداد الرحمن المساعد الذكي للمكتبة الإسلامية.";

      setCurrentModelText(reply);

      setTranscripts((prev) => [
        ...prev,
        { sender: 'model', text: reply, time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) }
      ]);

      // Speak response out loud using Web Speech Synthesis TTS
      speakTextAloud(reply);
    } catch (e) {
      console.error("AI response error:", e);
      setCurrentModelText("تعذر جلب الرد حالياً. يمكنك إعادة المحاولة.");
      setIsSpeaking(false);
    }
  };

  const speakTextAloud = (text: string) => {
    if (isMuted) {
      setIsSpeaking(false);
      setCurrentModelText('');
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const arabicVoice = voices.find(v => v.lang.startsWith('ar')) || voices[0];
      if (arabicVoice) utterance.voice = arabicVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        setCurrentModelText('');
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setCurrentModelText('');
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
      setCurrentModelText('');
    }
  };

  const stopLiveSession = () => {
    stopMicrophoneCapture();
    stopScreenSharing();
    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch (_) {}
      speechRecognitionRef.current = null;
    }
    if (mediaRecorderRestRef.current && mediaRecorderRestRef.current.state !== 'inactive') {
      try { mediaRecorderRestRef.current.stop(); } catch (_) {}
    }
    mediaRecorderRestRef.current = null;
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (_) {}
      wsRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setConnectionState('disconnected');
    setIsSpeaking(false);
    setIsListening(false);
  };

  const startMicrophoneCapture = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicPermissionDenied(true);
        enableWebSpeechFallback();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 }
      });
      mediaStreamRef.current = stream;
      setMicPermissionDenied(false);

      const inputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputAudioCtx;

      const source = inputAudioCtx.createMediaStreamSource(stream);
      const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!isMicActive) return;

        const float32Array = e.inputBuffer.getChannelData(0);
        
        let sum = 0;
        for (let i = 0; i < float32Array.length; i++) {
          sum += float32Array[i] * float32Array[i];
        }
        const rms = Math.sqrt(sum / float32Array.length);
        setIsListening(rms > 0.015);

        const pcm16 = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
          const s = Math.max(-1, Math.min(1, float32Array[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        const bytes = new Uint8Array(pcm16.buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Audio = btoa(binary);

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ audio: base64Audio }));
        }
      };

      source.connect(processor);
      processor.connect(inputAudioCtx.destination);
    } catch (e: any) {
      console.warn("Microphone access notice:", e?.message || e);
      setMicPermissionDenied(true);
      enableWebSpeechFallback();
    }
  };

  const handleSendTextPrompt = () => {
    if (!textInput.trim()) return;
    const userText = textInput.trim();
    setTextInput('');

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setTranscripts((prev) => [
        ...prev,
        { sender: 'user', text: userText, time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) }
      ]);
      wsRef.current.send(JSON.stringify({ text: userText }));
    } else {
      handleUserVoiceMessage(userText);
    }
  };

  const stopMicrophoneCapture = () => {
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const startScreenSharing = async () => {
    if (connectionMode !== 'websocket') {
      setErrorMessage("ميزة مشاركة الشاشة متاحة فقط في وضع Gemini Live. جاري التحويل...");
      startLiveSession();
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      setErrorMessage("عذراً، متصفحك أو جهازك لا يدعم مشاركة الشاشة حالياً. يرجى استخدام متصفح حديث على الحاسوب.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 5 },
        audio: false
      });
      screenStreamRef.current = stream;
      setIsScreenSharing(true);

      // Setup hidden video element to process frames
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      screenVideoRef.current = video;

      const canvas = document.createElement('canvas');
      
      // Initial canvas setup
      canvas.width = 640;
      canvas.height = Math.floor(640 * (video.videoHeight / video.videoWidth));
      const ctx = canvas.getContext('2d');

      // Send a frame every 1.5 seconds to avoid overloading
      screenCaptureIntervalRef.current = setInterval(() => {
        if (!ctx || !video || video.paused || video.ended) return;
        
        // Ensure canvas matches video aspect ratio dynamically
        if (canvas.width !== 640 || canvas.height !== Math.floor(640 * (video.videoHeight / video.videoWidth))) {
            canvas.width = 640;
            canvas.height = Math.floor(640 * (video.videoHeight / video.videoWidth));
        }
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Quality 0.6 to keep payload small
        const base64Image = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
        
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ 
            type: 'input_media_chunk',
            mime_type: 'image/jpeg',
            data: base64Image 
          }));
        }
      }, 1500);

      stream.getVideoTracks()[0].onended = () => {
        stopScreenSharing();
      };

    } catch (err) {
      console.error("Error sharing screen:", err);
      setIsScreenSharing(false);
      setErrorMessage("تعذر البدء بمشاركة الشاشة: قد لا يدعم متصفحك أو جهازك مشاركة الشاشة في هذا الوضع.");
    }
  };

  const stopScreenSharing = () => {
    if (screenCaptureIntervalRef.current) {
      clearInterval(screenCaptureIntervalRef.current);
      screenCaptureIntervalRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    if (screenVideoRef.current) {
      screenVideoRef.current.pause();
      screenVideoRef.current.srcObject = null;
      screenVideoRef.current = null;
    }
    setIsScreenSharing(false);
  };

  const playAudioChunk = (base64PcmData: string) => {
    if (isMuted) return;

    if (!outputAudioCtxRef.current) {
      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = outputAudioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const binary = atob(base64PcmData);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16 = new Int16Array(bytes.buffer);

    const buffer = ctx.createBuffer(1, int16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < int16.length; i++) {
      channelData[i] = int16[i] / 32768.0;
    }

    const sourceNode = ctx.createBufferSource();
    sourceNode.buffer = buffer;
    sourceNode.connect(ctx.destination);

    const currentTime = ctx.currentTime;
    const startTime = Math.max(currentTime, nextStartTimeRef.current);
    sourceNode.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;
  };

  // Audio Canvas Visualizer Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let step = 0;
    const draw = () => {
      step++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      if (isSpeaking) {
        for (let i = 1; i <= 4; i++) {
          const r = 30 + i * 15 + Math.sin(step * 0.1 + i) * 10;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(245, 158, 11, ${0.8 - i * 0.15})`;
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      } else if (isListening) {
        for (let i = 1; i <= 3; i++) {
          const r = 25 + i * 18 + Math.cos(step * 0.12 + i) * 8;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(16, 185, 129, ${0.7 - i * 0.18})`;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      } else if (connectionState === 'connected') {
        const r = 35 + Math.sin(step * 0.05) * 5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.fillStyle = !isMicActive ? '#71717a' : isSpeaking ? '#f59e0b' : isListening ? '#10b981' : '#d97706';
      ctx.fill();
      ctx.shadowBlur = 15;
      ctx.shadowColor = !isMicActive ? '#71717a' : isSpeaking ? '#f59e0b' : isListening ? '#10b981' : '#d97706';

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSpeaking, isListening, connectionState, isMicActive]);

  useEffect(() => {
    startLiveSession();
    return () => {
      stopLiveSession();
    };
  }, []);

  const startRestRecording = async () => {
    try {
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch (_) {}
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRestRef.current = mediaRecorder;
      audioChunksRestRef.current = [];
      setIsRestRecording(true);
      setIsListening(true);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRestRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsRestRecording(false);
        setIsListening(false);
        
        if (audioChunksRestRef.current.length === 0) return;
        
        const audioBlob = new Blob(audioChunksRestRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          const base64Audio = base64data.split(',')[1];
          try {
            setCurrentModelText("جاري تحويل صوتك إلى نص عبر تفريغ ذكي...");
            setIsSpeaking(true);
            
            const { transcribeAudio } = await import('../../services/aiService');
            const transcript = await transcribeAudio(base64Audio, 'audio/webm');
            
            if (transcript && transcript.trim()) {
              handleUserVoiceMessage(transcript);
            } else {
              setCurrentModelText("");
              setIsSpeaking(false);
            }
          } catch (error) {
            console.error("Transcription fallback failed:", error);
            setCurrentModelText("فشل التعرف على الصوت، يرجى إعادة المحاولة.");
            setIsSpeaking(false);
          }
        };
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
    } catch (err) {
      console.warn("MediaRecorder start failed, trying Web Speech API...", err);
      initWebSpeechRecognition();
    }
  };

  const stopRestRecordingAndSend = () => {
    if (mediaRecorderRestRef.current && mediaRecorderRestRef.current.state !== 'inactive') {
      try {
        mediaRecorderRestRef.current.stop();
      } catch (e) {
        console.warn("Error stopping mediaRecorderRest:", e);
      }
      mediaRecorderRestRef.current = null;
    }
    setIsRestRecording(false);
    setIsListening(false);
  };

  const toggleMic = () => {
    const nextState = !isMicActive;
    setIsMicActive(nextState);

    if (connectionMode === 'webspeech') {
      if (nextState) {
        startRestRecording();
      } else {
        stopRestRecordingAndSend();
      }
    }
  };

  if (isMinimized) {
    return (
      <div 
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-24 left-6 z-[160] flex items-center gap-3 px-4 py-3 bg-zinc-900/95 border border-amber-500/40 rounded-2xl shadow-2xl backdrop-blur-xl animate-fade-in text-white cursor-pointer hover:border-amber-400 transition-all group"
        title="انقر للاستعادة الفورية"
      >
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <Radio className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-serif text-amber-200">مداد الرحمن (مباشر)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-semibold">يعمل في الخلفية</span>
          </div>
          <p className="text-[10px] text-zinc-400">{isSpeaking ? 'يتحدث الآن...' : isListening ? 'يستمع...' : 'متصل وجاهز'}</p>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
          className="ml-2 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors shadow-md flex items-center gap-1"
        >
          <span>استعادة</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-950 via-zinc-900 to-emerald-950 border-b border-amber-500/20 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300">
              <Radio className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-serif text-amber-100">محادثة Gemini Live المباشرة</h2>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{connectionMode === 'websocket' ? 'بث صوتي ثنائي الاتجاه' : 'المحرك الصوتي المباشر'}</span>
                </span>
              </div>
              <p className="text-xs text-amber-200/80">تواصل صوتي لحظي مباشر مع «مداد الرحمن»</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMinimized(true)} 
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 transition-colors flex items-center justify-center"
              title="تصغير للعمل في الخلفية"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 transition-colors flex items-center justify-center" title="إغلاق وإنهاء الجلسة">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visualizer & Orb Area */}
        <div className="p-2 bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-900 border-b border-zinc-800 flex flex-col items-center justify-center relative flex-grow min-h-0 overflow-y-auto">
          <div 
            onClick={toggleMic} 
            className="cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 relative group my-1"
            title="انقر لتشغيل/إيقاف مؤقت للميكروفون"
          >
            <canvas ref={canvasRef} width={180} height={120} className="w-full max-w-[180px] h-[120px]" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 rounded-full pointer-events-none">
              <span className="bg-zinc-900/90 text-amber-300 text-[10px] px-2 py-1 rounded-xl border border-amber-500/20 shadow-md">
                {isMicActive ? 'انقر للكتم' : 'انقر للتفعيل'}
              </span>
            </div>
          </div>

          {/* Connection badge */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700 backdrop-blur-md">
            <span className={`w-2 h-2 rounded-full ${connectionState === 'connected' ? 'bg-emerald-500' : connectionState === 'connecting' ? 'bg-amber-500' : 'bg-rose-500'}`} />
            <span className="text-[10px] font-bold text-zinc-300">
              {connectionState === 'connected' 
                ? (isSpeaking ? 'يتحدث...' : isListening ? 'يستمع...' : 'متصل') 
                : connectionState === 'connecting' ? 'جاري الاتصال...' : 'غير متصل'}
            </span>
          </div>

          {/* Active Voice & Model info */}
          <div className="absolute bottom-1 left-2 right-2 flex flex-wrap items-center justify-between text-[10px] text-zinc-400 bg-zinc-900/60 px-2 py-1 rounded-lg border border-zinc-800 backdrop-blur-sm">
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-amber-400" />
              <span>{connectionMode === 'websocket' ? selectedModel : 'Gemini'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>{selectedVoice}</span>
            </div>
          </div>
        </div>

        {/* Configuration Row */}
        <div className="p-3 bg-zinc-900/90 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-amber-500" />
            <span className="text-zinc-400 font-bold">اختيار نبرة الصوت:</span>
            <select
              value={selectedVoice}
              onChange={(e) => {
                setSelectedVoice(e.target.value);
                startLiveSession();
              }}
              className="bg-zinc-800 text-amber-200 border border-zinc-700 rounded-lg px-2.5 py-1 font-semibold focus:outline-none focus:border-amber-500"
            >
              <option value="Zephyr">Zephyr (صوت هادئ وفصيح)</option>
              <option value="Kore">Kore (صوت وقور ورخيم)</option>
              <option value="Puck">Puck (صوت واضح وسريع)</option>
              <option value="Charon">Charon (صوت عميق وحكيم)</option>
              <option value="Fenrir">Fenrir (صوت قوي وحازم)</option>
            </select>
          </div>

          <button
            onClick={startLiveSession}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 transition-colors"
            title="إعادة تنشيط الاتصال المباشر"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>إعادة الاتصال</span>
          </button>
        </div>

        {/* Live Subtitles / Transcripts Box */}
        <div className="p-3 flex-1 overflow-y-auto space-y-2 min-h-[100px] max-h-[150px] bg-zinc-950/50">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">تنبيه الجلسة المباشرة:</p>
                  <p className="mt-0.5">{errorMessage}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={startLiveSession}
                  className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] transition-colors"
                >
                  إعادة الاتصال بالأوضاع المباشرة
                </button>
              </div>
            </div>
          )}

          {transcripts.length === 0 && !currentModelText && !interimUserSpeech && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
              <Waves className="w-8 h-8 text-amber-500/40 mb-2" />
              <p className="text-xs">تحدث مباشرة مع «مداد الرحمن» بصوتك أو اكتب سؤالك بالأسفل. سيظهر التفريغ والرد الصوتي المباشر لحظياً.</p>
            </div>
          )}

          {transcripts.map((t, idx) => (
            <div key={idx} className={`flex flex-col ${t.sender === 'user' ? 'items-start' : 'items-end'}`}>
              <div className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${t.sender === 'user' ? 'bg-emerald-950/60 text-emerald-100 border border-emerald-800/40' : 'bg-amber-950/60 text-amber-100 border border-amber-800/40 font-serif'}`}>
                <span className="font-bold text-[10px] block opacity-70 mb-0.5">{t.sender === 'user' ? 'أنت' : 'مداد الرحمن (Gemini Live)'} • {t.time}</span>
                <p>{t.text}</p>
              </div>
            </div>
          ))}

          {interimUserSpeech && (
            <div className="flex flex-col items-start animate-fade-in">
              <div className="p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed bg-emerald-900/40 text-emerald-200 border border-emerald-700/50 italic">
                <span className="font-bold text-[10px] block text-emerald-400 mb-0.5">أنت (تتحدث الآن...)</span>
                <p>{interimUserSpeech}</p>
              </div>
            </div>
          )}

          {currentModelText && (
            <div className="flex flex-col items-end animate-fade-in">
              <div className="p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed bg-amber-900/40 text-amber-100 border border-amber-700/50 font-serif">
                <span className="font-bold text-[10px] block text-amber-400 mb-0.5">مداد الرحمن (يتحدث الآن...)</span>
                <p>{currentModelText}</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Text Input for Live Communication */}
        <div className="px-4 py-2 bg-zinc-900/90 border-t border-zinc-800 flex items-center gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendTextPrompt()}
            placeholder="أدخل رسالتك المباشرة هنا للتحدث مع مداد الرحمن..."
            className="flex-1 bg-zinc-950 text-amber-100 placeholder-zinc-500 border border-zinc-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={handleSendTextPrompt}
            className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>إرسال</span>
          </button>
        </div>

        {/* Control Action Buttons */}
        <div className="p-2 bg-zinc-900 border-t border-zinc-800 flex items-center justify-center gap-1 flex-wrap">
          <button
            onClick={toggleMic}
            className={`p-2.5 rounded-xl font-bold text-[10px] flex items-center gap-1.5 transition-all ${isMicActive ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}
          >
            {isMicActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            <span>{isMicActive ? 'نشط' : 'مكتوم'}</span>
          </button>

          <button
            onClick={() => {
              const nextMute = !isMuted;
              setIsMuted(nextMute);
              if (nextMute && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
              }
            }}
            className={`p-2.5 rounded-xl font-bold text-[10px] flex items-center gap-1.5 transition-all ${!isMuted ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30' : 'bg-rose-950/50 text-rose-300 border border-rose-800/40'}`}
          >
            {!isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{!isMuted ? 'صوت' : 'صامت'}</span>
          </button>

          {(connectionState === 'connected' || connectionState === 'connecting') && (
            <button
              onClick={isScreenSharing ? stopScreenSharing : startScreenSharing}
              disabled={connectionState !== 'connected'}
              className={`p-2.5 rounded-xl font-bold text-[10px] flex items-center gap-1.5 transition-all border ${isScreenSharing ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-zinc-800 text-indigo-400 border-indigo-900/50 hover:bg-zinc-700'} ${connectionState !== 'connected' ? 'opacity-50' : ''}`}
            >
              {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
              <span>{isScreenSharing ? 'إيقاف' : 'شاشة'}</span>
            </button>
          )}

          <button
            onClick={() => {
              const msg = "يا مداد، ما هي الأدوات التي يمكنك التحكم بها في التطبيق؟";
              setTextInput(msg);
              handleSendTextPrompt();
            }}
            className="p-2.5 rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-all font-bold text-[10px] flex items-center gap-1.5"
          >
            <Info className="w-4 h-4" />
            <span>الأدوات</span>
          </button>

          {onSendToChat && transcripts.length > 0 && (
            <button
              onClick={() => {
                const summaryText = transcripts.map(t => `${t.sender === 'user' ? 'المستخدم' : 'مداد'}: ${t.text}`).join('\n');
                onSendToChat(`تفاصيل الجلسة الصوتية المباشرة (Gemini Live):\n\n${summaryText}`);
                onClose();
              }}
              className="p-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold text-[10px] shadow-md flex items-center gap-1.5 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>حفظ</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

