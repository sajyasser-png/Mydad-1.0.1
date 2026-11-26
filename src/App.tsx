import { useState, useEffect, useRef, useMemo, useCallback, ChangeEvent, lazy, Suspense } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Mic, Square, Play, Moon, Sun, Volume2, BookOpen, Search, ChevronRight, ChevronLeft, Info, X, Settings2, Sparkles, Monitor, Copy, Share2, Navigation, Star, Image as ImageIcon, Loader2, Layout, Hash, Type, Maximize, Minimize, Terminal, PenTool, Heart, Compass, Bookmark, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RECITERS, TAFASIR, TRANSLATIONS, SURAH_AYAH_COUNTS, QIRAAT, QURAN_TEXT_URLS } from './constants';
import { ViewMode, Surah, Verse, RecitationSettings } from './types';
import { PrayerTimesCard } from './components/PrayerTimes';
import { HijriClock } from './components/HijriClock';
import { DuaSection } from './components/DuaSection';
import { QiblaSection } from './components/QiblaSection';
import { TasbihSection } from './components/TasbihSection';
import { ReadAloud } from './components/ReadAloud';
import { SettingsPanel } from './components/SettingsPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PlaybackControls } from './components/PlaybackControls';
import { UserGuide } from './components/UserGuide';
import { PaymentGate } from './components/PaymentGate';
import { AudioWaveform } from './components/AudioWaveform';
import { Octagram } from './components/Octagram';
import { AI_PROVIDERS, AIProviderKey, callAI, callAIWithFailover, generateRecitation, transcribeAudio, fetchAllProvidersModels, initModelUpdater, getApiKey, setProviderApiKey } from './services/aiService';
import { generateAudioId, getCachedAudio } from './services/audioCacheService';
import { applyTajweed, TAJWEED_RULES } from './services/tajweedService';
import { useTheme } from './hooks/useTheme';
import { safeLocalStorageSet, safeLocalStorageGet, getSurahDisplayName, parseAIJson, SURAH_START_PAGES, getSurahAndAyahFromMadinaPage } from './lib/utils';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';

// Lazy loaded components for better performance
const AIHub = lazy(() => import('./components/AIHub').then(module => ({ default: module.AIHub })));
const MidadAlRahman = lazy(() => import('./components/MidadAlRahman').then(module => ({ default: module.MidadAlRahman })));
const IslamicCalendar = lazy(() => import('./components/IslamicCalendar').then(module => ({ default: module.IslamicCalendar })));
const TypecastModal = lazy(() => import('./components/TypecastModal').then(module => ({ default: module.TypecastModal })));
const SpiritualVision = lazy(() => import('./components/SpiritualVision').then(module => ({ default: module.SpiritualVision })));

// --- Utility Functions ---

const getGlobalAyahNumber = (surahNum: number, ayahNum: number) => {
  let total = 0;
  for (let i = 0; i < surahNum - 1; i++) {
    total += SURAH_AYAH_COUNTS[i];
  }
  return total + ayahNum;
};

const calculateMetadata = (verses: Verse[]) => {
  let words = 0;
  let letters = 0;
  let harakaat = 0;
  
  // Precise Quranic Diacritics and Marks (Harakaat)
  // Includes: Fathatan, Dammatan, Kasratan, Fatha, Damma, Kasra, Shadda, Sukun (064B-0652)
  // Superscript Alif / Dagger Alif (0670)
  // Maddah, Hamza Above/Below (0653-0655)
  // Small high signs and Quranic marks (0610-061A, 06D6-06DC, 06DF-06E4, 06E7-06E8, 06EA-06ED, 0656-065F)
  const harakaatRegex = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED]/g;
  
  // Arabic Letters: Basic alphabet (0621-064A) + Alif Wasla (0671) + Small Ya/Waw (06E5-06E6)
  const lettersRegex = /[\u0621-\u064A\u0671\u06E5\u06E6]/g;

  verses.forEach(v => {
    const text = v.text.trim();
    if (text) {
      // Words: split by whitespace and filter empty strings
      words += text.split(/\s+/).filter(w => w.length > 0).length;
      
      // Harakaat: count all diacritic marks and Quranic signs
      const hMatches = text.match(harakaatRegex);
      if (hMatches) harakaat += hMatches.length;
      
      // Letters: count base alphabet characters and spoken small letters
      const lMatches = text.match(lettersRegex);
      if (lMatches) letters += lMatches.length;
    }
  });
  
  return { words, letters, harakaat };
};

const openIndexedDB = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  const req = indexedDB.open('TarteelDB', 1);
  req.onupgradeneeded = (e: any) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains('quran')) {
      db.createObjectStore('quran');
    }
  };
  req.onsuccess = (e: any) => resolve(e.target.result);
  req.onerror = (e: any) => reject(e.target.error);
});

const saveToDB = async (db: IDBDatabase, key: string, value: any) => {
  const tx = db.transaction('quran', 'readwrite');
  tx.objectStore('quran').put(value, key);
};

const getFromDB = async (db: IDBDatabase, key: string): Promise<any> => {
  return new Promise((resolve) => {
    const tx = db.transaction('quran', 'readonly');
    const req = tx.objectStore('quran').get(key);
    req.onsuccess = () => resolve(req.result);
  });
};

const DailyInspiration = () => {
  const [verse, setVerse] = useState<{text: string, translation: string, surah: string, ayah: number} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDailyVerse = async () => {
      try {
        // Random verse selection (simplified for now, could be based on date)
        const surahNum = Math.floor(Math.random() * 114) + 1;
        const ayahCount = SURAH_AYAH_COUNTS[surahNum - 1];
        const ayahNum = Math.floor(Math.random() * ayahCount) + 1;
        
        const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surahNum}:${ayahNum}/ar.alafasy`);
        const data = await response.json();
        const transResponse = await fetch(`https://api.alquran.cloud/v1/ayah/${surahNum}:${ayahNum}/en.asad`);
        const transData = await transResponse.json();
        
        setVerse({
          text: data.data.text,
          translation: transData.data.text,
          surah: data.data.surah.name,
          ayah: data.data.numberInSurah
        });
      } catch (e) {
        console.error("Failed to fetch daily verse", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDailyVerse();
  }, []);

  if (loading) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full p-4 rounded-2xl bg-white/95 dark:bg-[#171412]/95 border border-amber-200/50 dark:border-amber-900/40 shadow-sm"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
          <div className="flex items-center gap-1.5">
            <Star size={13} fill="currentColor" />
            <span>آية اليوم للتدبر</span>
          </div>
          {verse && (
            <span className="text-[11px] font-bold text-amber-800/80 dark:text-amber-300/80 font-kufi bg-amber-50 dark:bg-amber-900/30 px-2.5 py-0.5 rounded-lg border border-amber-200/50 dark:border-amber-800/40">
              {getSurahDisplayName(verse.surah)} · آية {verse.ayah}
            </span>
          )}
        </div>
        
        {verse && (
          <div className="text-center space-y-1.5 pt-1">
            <p className="text-lg sm:text-xl md:text-2xl font-quran leading-relaxed text-amber-950 dark:text-amber-50">
              {verse.text}
            </p>
            <p className="text-xs sm:text-sm text-amber-900/65 dark:text-amber-200/60 font-sans leading-relaxed max-w-3xl mx-auto">
              {verse.translation}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const QuranVerse = () => (
  <span className="text-amber-700 dark:text-amber-300 font-quran text-lg sm:text-xl md:text-2xl font-bold">
    وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا
  </span>
);

const TajweedText = ({ text, isTajweed }: { text: string; isTajweed: boolean }) => {
  if (!isTajweed) return <span className="font-amiri">{text}</span>;

  const processedText = applyTajweed(text);

  return (
    <span 
      className="font-amiri" 
      dangerouslySetInnerHTML={{ __html: processedText }} 
    />
  );
};

// --- Utility Components ---

const CommandActionButton = ({ 
  onClick, 
  className = "", 
  title = "أمر ذكي سريع", 
  size = 14
}: { 
  onClick: () => void; 
  className?: string; 
  title?: string;
  size?: number;
}) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`w-7 h-7 rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-colors flex items-center justify-center shrink-0 ${className}`}
    title={title}
    aria-label={title}
  >
    <Terminal size={size} />
  </button>
);

const SmartActionButton = ({ 
  onClick, 
  className = "", 
  title = "المساعد الذكي", 
  icon: Icon = Sparkles,
  size = 14
}: { 
  onClick: () => void; 
  className?: string; 
  title?: string;
  icon?: any;
  size?: number;
}) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`w-7 h-7 rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors flex items-center justify-center shrink-0 ${className}`}
    title={title}
    aria-label={title}
  >
    <Icon size={size} />
  </button>
);

function App() {
  // --- Factory Reset ---
  if (typeof window !== 'undefined') {
    try {
      if (localStorage.getItem('midad_factory_reset_done_v13') !== 'true') {
        localStorage.clear();
        localStorage.setItem('midad_factory_reset_done_v13', 'true');
        try {
          indexedDB.deleteDatabase('TarteelDB');
        } catch (dbErr) {
          console.error("Failed to delete IndexedDB:", dbErr);
        }
        window.location.reload();
      }
    } catch (e) {
      console.error("Factory reset failed or storage is blocked:", e);
    }
  }

  // --- State ---
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (safeLocalStorageGet('quran_viewMode') as ViewMode) || 'search';
  });
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return safeLocalStorageGet('quran_app_unlocked_v2') === 'true';
  });
  const { themeMode, toggleTheme } = useTheme();
  const [recentSurahs, setRecentSurahs] = useState<number[]>(() => {
    try {
      const saved = safeLocalStorageGet('recentSurahs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse recentSurahs:", e);
      return [];
    }
  });
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = safeLocalStorageGet('quran_fontSize');
    return saved ? parseInt(saved, 10) : 17;
  });
  const [fontFamily, setFontFamily] = useState<string>(() => {
    return safeLocalStorageGet('fontFamily') || 'font-amiri';
  });
  const [bookmarks, setBookmarks] = useState<{ surah: number; ayah: number; text: string; surahName: string }[]>(() => {
    try {
      const saved = safeLocalStorageGet('quran_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse bookmarks:", e);
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [quranData, setQuranData] = useState<Surah[] | null>(null);
  
  // Search Mode State
  const [searchText, setSearchText] = useState(() => safeLocalStorageGet('quran_searchTextDraft') || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const searchInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    safeLocalStorageSet('quran_searchTextDraft', searchText);
  }, [searchText]);

  useEffect(() => {
    safeLocalStorageSet('quran_viewMode', viewMode);
    setIsExpanded(false); // Reset expansion when changing views
  }, [viewMode]);

  useEffect(() => {
    safeLocalStorageSet('quran_fontSize', fontSize.toString());
  }, [fontSize]);

  const getReciterFolder = (reciter: string) => {
    const reciterMapping: Record<string, string> = {
      'ar.alafasy': 'Alafasy_128kbps',
      'ar.abdullahbasfar': 'Abdullah_Basfar_64kbps',
      'ar.abdurrahmaansudais': 'Abdurrahmaan_As-Sudais_192kbps',
      'ar.mahermuaiqly': 'Maher_AlMuaiqly_64kbps',
      'ar.husary': 'Husary_128kbps',
      'ar.husarymujawwad': 'Husary_Mujawwad_64kbps',
      'ar.minshawi': 'Minshawy_Murattal_128kbps',
      'ar.minshawimujawwad': 'Minshawy_Mujawwad_192kbps',
      'ar.shaatree': 'Abu_Bakr_Ash-Shaatree_128kbps',
      'ar.ahmedajamy': 'Ahmed_bin_Ali_Al-Ajmy_128kbps_64kbps',
      'ar.saoodshuraym': 'Saood_ash-Shuraym_128kbps',
      'ar.hudhaify': 'Hudhaify_128kbps',
      'ar.abdulbasitmurattal': 'Abdul_Basit_Murattal_192kbps',
      'ar.abdulsamad': 'Abdul_Basit_Mujawwad_128kbps',
      'ar.muhammadayyoub': 'Muhammad_Ayyoub_128kbps',
      'ar.muhammadjibreel': 'Muhammad_Jibreel_128kbps',
      'ar.aymanswoaid': 'Ayman_Sowaid_64kbps',
      'ar.hanirifai': 'Hani_Rifai_192kbps',
      'ar.ibrahimakhbar': 'Ibrahim_Al_Akhdar_128kbps',
      'ar.parhizgar': 'Parhizgar_48kbps',
      'ar.yasseraddussary': 'Yasser_Ad-Dussary_128kbps',
      'ar.faresabbad': 'Fares_Abbad_64kbps',
      'ar.nasseralqatami': 'Nasser_Alqatami_128kbps',
      'ar.salahalbudair': 'Salah_Al_Budair_128kbps',
      'ar.alijaber': 'Ali_Jaber_64kbps',
      'ar.mahmoudalialbanna': 'Mahmoud_Ali_Al_Banna_32kbps',
      'ar.mustafaismail': 'Mustafa_Ismail_48kbps',
      'en.walk': 'MultiLanguage/English/Ibrahim_Walk_192kbps_TR',
      'fa.hedayatfarfooladvand': 'MultiLanguage/Persian/Hedayatfar_40kbps',
      'fr.leclerc': 'French/Leclerc_128kbps',
      'ru.kuliev-audio': 'Russian/Russian_128kbps',
      'ur.khan': 'MultiLanguage/Urdu/Shamshad_Ali_Khan_48kbps',
      'zh.chinese': 'Chinese/Chinese_128kbps',
    };
    return reciterMapping[reciter];
  };

  const getReciterBitrate = (reciter: string) => {
    const bitrates: Record<string, string> = {
      'ar.abdullahbasfar': '192',
      'ar.abdurrahmaansudais': '192',
      'ar.minshawimujawwad': '64',
      'ar.saoodshuraym': '64',
      'ar.abdulbasitmurattal': '192',
      'ar.abdulsamad': '64',
      'ar.aymanswoaid': '64',
      'ar.hanirifai': '192',
      'ar.ibrahimakhbar': '32',
      'ar.parhizgar': '48',
      'en.walk': '192',
      'fa.hedayatfarfooladvand': '40',
      'ur.khan': '64',
    };
    return bitrates[reciter] || '128';
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime += 5;
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime -= 5;
    }
  };

  const addRecentSurah = (surahId: number) => {
    setRecentSurahs(prev => {
      const updated = [surahId, ...prev.filter(id => id !== surahId)].slice(0, 5);
      return updated;
    });
  };

  const handleSurahSelect = (surah: Surah) => {
    addRecentSurah(surah.id);
    setSelectedSurah(surah);
    setCurrentPage(1);
    setAIContext({ surah: surah.name, timestamp: Date.now() });
    logAIEvent(`تصفح ${getSurahDisplayName(surah.name)}`, '📖', 'browse');
    stopRecitation();
    setViewMode('browse');
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setSearchText(value);
    setActiveSuggestionIndex(-1);

    if (value.length > 1 && quranData) {
      const filtered = quranData
        .map(s => s.name)
        .filter(name => (name && typeof name === 'string' && name.includes(value.trim())) || (value && typeof value === 'string' && value.trim().includes(name)));
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
        e.preventDefault();
        setSearchText(suggestions[activeSuggestionIndex]);
        setSuggestions([]);
        setActiveSuggestionIndex(-1);
      } else if (e.key === 'Escape') {
        setSuggestions([]);
        setActiveSuggestionIndex(-1);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearchAndCorrect();
    }
  };
  const [searchResult, setSearchResult] = useState<{ 
    type: 'surah' | 'ayah' | 'text', 
    data?: any, 
    contextVerses?: any[],
    text?: string, 
    explanation?: string,
    qiraatDifferences?: string,
    metadata?: {
      surahName?: string;
      juz?: number;
      hizb?: number;
      asbab?: string;
      words?: number;
      letters?: number;
      harakaat?: number;
      revelationType?: string;
      verseCount?: number;
      order?: number;
      translation?: string;
    }
  } | null>(null);
  const [showTajweedInfo, setShowTajweedInfo] = useState(false);
  const [showQiraatInfo, setShowQiraatInfo] = useState<{ surah: number; ayah: number; text: string; info: string } | null>(null);
  const [isTypecastOpen, setIsTypecastOpen] = useState(false);
  const [typecastText, setTypecastText] = useState(() => safeLocalStorageGet('quran_typecastDraft') || '');
  const [visionText, setVisionText] = useState<string | null>(null);
  const [lastSearchedText, setLastSearchedText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    safeLocalStorageSet('quran_typecastDraft', typecastText);
  }, [typecastText]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Browse Mode State
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(() => {
    const saved = safeLocalStorageGet('quran_currentPage');
    return saved ? parseInt(saved, 10) : 1;
  });
  const VERSES_PER_PAGE = 20;
  const [surahSearch, setSurahSearch] = useState(() => safeLocalStorageGet('quran_surahSearchDraft') || '');
  const [isTajweed, setIsTajweed] = useState(() => {
    return safeLocalStorageGet('quran_isTajweed') !== 'false';
  });

  useEffect(() => {
    safeLocalStorageSet('quran_currentPage', currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    safeLocalStorageSet('quran_surahSearchDraft', surahSearch);
  }, [surahSearch]);
  
  // Audio & Playback State
  const [selectedReciter, setSelectedReciter] = useState(() => {
    return safeLocalStorageGet('quran_selectedReciter') || 'ar.alafasy';
  });
  const [selectedQiraat, setSelectedQiraat] = useState(() => {
    return safeLocalStorageGet('quran_selectedQiraat') || 'hafs';
  });
  const [selectedTafsir, setSelectedTafsir] = useState(() => {
    return safeLocalStorageGet('quran_selectedTafsir') || 'ar.muyassar';
  });
  const [selectedTranslation, setSelectedTranslation] = useState(() => {
    return safeLocalStorageGet('quran_selectedTranslation') || 'en.sahih';
  });

  useEffect(() => {
    safeLocalStorageSet('quran_isTajweed', isTajweed.toString());
    safeLocalStorageSet('quran_selectedReciter', selectedReciter);
    safeLocalStorageSet('quran_selectedQiraat', selectedQiraat);
    safeLocalStorageSet('quran_selectedTafsir', selectedTafsir);
    safeLocalStorageSet('quran_selectedTranslation', selectedTranslation);
  }, [isTajweed, selectedReciter, selectedQiraat, selectedTafsir, selectedTranslation]);
  const [translationsData, setTranslationsData] = useState<{ [key: number]: string }>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAyah, setActiveAyah] = useState<{ surah: number; ayah: number; targetAyah?: number } | null>(() => {
    try {
      const saved = safeLocalStorageGet('quran_activeAyah');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (activeAyah) {
      safeLocalStorageSet('quran_activeAyah', JSON.stringify(activeAyah));
    }
  }, [activeAyah]);

  const [audioProgress, setAudioProgress] = useState(0);
  const [currentAudioData, setCurrentAudioData] = useState<Uint8Array | null>(null);
  const [currentMimeType, setCurrentMimeType] = useState<string>('audio/wav');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAnalyzingQiraat, setIsAnalyzingQiraat] = useState(false);
  const [showAIHub, setShowAIHub] = useState<boolean>(() => safeLocalStorageGet('quran_showAIHub') === 'true');
  const [aiHubInitialInput, setAiHubInitialInput] = useState(() => safeLocalStorageGet('quran_aiHubDraft') || '');

  useEffect(() => {
    safeLocalStorageSet('quran_showAIHub', showAIHub ? 'true' : 'false');
  }, [showAIHub]);

  useEffect(() => {
    safeLocalStorageSet('quran_aiHubDraft', aiHubInitialInput);
  }, [aiHubInitialInput]);

  const openAIHubWithCommand = (command: string = '/') => {
    setAiHubInitialInput(command);
    setShowAIHub(true);
  };

  const [showMidadAlRahman, setShowMidadAlRahman] = useState<boolean>(() => safeLocalStorageGet('quran_showMidadAlRahman') === 'true');

  useEffect(() => {
    safeLocalStorageSet('quran_showMidadAlRahman', showMidadAlRahman ? 'true' : 'false');
  }, [showMidadAlRahman]);
  const [selectedVoice, setSelectedVoice] = useState<string>(() => {
    return safeLocalStorageGet('ai_recitation_voice') || 'Zephyr';
  });
  const [ttsModel, setTtsModel] = useState<string>(() => {
    const saved = safeLocalStorageGet('ai_tts_model');
    if (!saved || saved.startsWith('gemini-2.0')) return 'gemini-3.8-flash-lite-tts';
    return saved;
  });
  const [aiRecitationSettings, setAiRecitationSettings] = useState<RecitationSettings>(() => {
    const saved = safeLocalStorageGet('ai_recitation_settings');
    return saved ? JSON.parse(saved) : { pitch: 1.0, rate: 1.0 };
  });
  const [humanRecitationSettings, setHumanRecitationSettings] = useState<RecitationSettings>(() => {
    const saved = safeLocalStorageGet('human_recitation_settings');
    return saved ? JSON.parse(saved) : { pitch: 1.0, rate: 1.0 };
  });

  useEffect(() => {
    fetchAllProvidersModels().catch(console.error);
  }, []);

  useEffect(() => {
    safeLocalStorageSet('ai_recitation_voice', selectedVoice);
    safeLocalStorageSet('ai_tts_model', ttsModel);
    safeLocalStorageSet('ai_recitation_settings', JSON.stringify(aiRecitationSettings));
    safeLocalStorageSet('human_recitation_settings', JSON.stringify(humanRecitationSettings));
  }, [selectedVoice, ttsModel, aiRecitationSettings, humanRecitationSettings]);

  const [ayahContextMenu, setAyahContextMenu] = useState<{ 
    x: number; 
    y: number; 
    visible: boolean; 
    surahId: number; 
    ayahId: number; 
    text: string 
  } | null>(null);

  const playAudioWithSettings = (audio: HTMLAudioElement, settings: RecitationSettings) => {
    audio.playbackRate = settings.rate;
    return audio.play();
  };
  const [aiContext, setAIContext] = useState<{ 
    surah?: string; 
    ayah?: number; 
    text?: string;
    tafsir?: string;
    tafsirRequest?: string;
    timestamp?: number;
  } | undefined>(() => {
    try {
      const saved = safeLocalStorageGet('ai_context_memory');
      return saved ? JSON.parse(saved) : undefined;
    } catch (e) {
      console.error("Failed to parse ai_context_memory:", e);
      return undefined;
    }
  });

  useEffect(() => {
    const handleLogEvent = (e: any) => {
      const { content, icon, type } = e.detail;
      logAIEvent(content, icon, type);
    };
    const handleOpenTypecast = (e: any) => {
      const { text } = e.detail;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(console.error);
      }
      setTypecastText(text || '');
      setIsTypecastOpen(true);
    };
    const handleOpenVision = (e: any) => {
      const { text } = e.detail;
      if (text) setVisionText(text);
    };
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setViewMode('search');
        setTimeout(() => {
          document.getElementById('quran-search-input')?.focus();
        }, 100);
      }
    };
    window.addEventListener('log_spiritual_event', handleLogEvent);
    window.addEventListener('open_typecast', handleOpenTypecast);
    window.addEventListener('open_spiritual_vision', handleOpenVision);
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('log_spiritual_event', handleLogEvent);
      window.removeEventListener('open_typecast', handleOpenTypecast);
      window.removeEventListener('open_spiritual_vision', handleOpenVision);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  const logAIEvent = (content: string, icon?: string, type: 'search' | 'browse' | 'listen' | 'bookmark' | 'tafsir' | 'tasbih' | 'dua' | 'qibla' | 'prayer' | 'event' | 'settings' = 'event') => {
    let history: any[] = [];
    try {
      const saved = safeLocalStorageGet('ai_chat_history');
      history = saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse ai_chat_history:", e);
      history = [];
    }
    const event = {
      id: `event-${Date.now()}`,
      role: 'assistant',
      content: typeof content === 'string' ? content : JSON.stringify(content),
      timestamp: Date.now(),
      type: 'event',
      eventType: type,
      eventIcon: icon
    };
    const updated = [...history, event].slice(-100); // Keep last 100 items for better memory
    safeLocalStorageSet('ai_chat_history', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('refresh_ai_history'));
  };

  const getEnrichedAIContext = (surahObj: any, ayahObj: any) => {
    let enrichedText = ayahObj.text;
    const wordCount = enrichedText.split(/\s+/).length;
    
    // If the verse is short (less than 7 words), include previous and next verses for context
    if (wordCount < 7 && surahObj && surahObj.verses) {
      const ayahIndex = surahObj.verses.findIndex((v: any) => v.id === ayahObj.id);
      if (ayahIndex !== -1) {
        const prevAyah = surahObj.verses[ayahIndex - 1];
        const nextAyah = surahObj.verses[ayahIndex + 1];
        
        let contextText = enrichedText;
        if (prevAyah) contextText = `[الآية السابقة: ${prevAyah.text}] ` + contextText;
        if (nextAyah) contextText = contextText + ` [الآية التالية: ${nextAyah.text}]`;
        enrichedText = contextText;
      }
    }
    
    return { surah: surahObj.name, ayah: ayahObj.id, text: enrichedText, timestamp: Date.now() };
  };

  useEffect(() => {
    if (aiContext) {
      safeLocalStorageSet('ai_context_memory', JSON.stringify(aiContext));
    }
  }, [aiContext]);

  useEffect(() => {
    safeLocalStorageSet('quran_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // AI Provider State
  const [showSettings, setShowSettings] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [provider, setProvider] = useState<AIProviderKey>('gemini');
  const [apiKeyInput, setApiKeyInput] = useState(() => getApiKey('gemini'));

  useEffect(() => {
    const handleKeySync = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.provider === provider) {
        setApiKeyInput(detail.apiKey || '');
      }
    };
    window.addEventListener('api_key_updated', handleKeySync);
    return () => window.removeEventListener('api_key_updated', handleKeySync);
  }, [provider]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const virtuosoRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const playbackModeRef = useRef<'continuous' | 'single'>('single');
  const currentRecitationId = useRef<number>(0);

  // --- Effects ---
  
  useEffect(() => {
    if (selectedSurah) {
      safeLocalStorageSet('quran_selectedSurahId', selectedSurah.id.toString());
    }
  }, [selectedSurah]);

  const initialSurahLoaded = useRef(false);

  useEffect(() => {
    if (quranData) {
      if (!initialSurahLoaded.current) {
        const savedSurahId = safeLocalStorageGet('quran_selectedSurahId');
        if (savedSurahId) {
          const surah = quranData.find(s => s.id === parseInt(savedSurahId, 10));
          if (surah) {
            setSelectedSurah(surah);
          }
        }
        initialSurahLoaded.current = true;
      } else if (selectedSurah) {
        // Update selectedSurah if quranData changes (e.g. Qiraat change)
        const updatedSurah = quranData.find(s => s.id === selectedSurah.id);
        if (updatedSurah && updatedSurah !== selectedSurah) {
          setSelectedSurah(updatedSurah);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quranData]);

  useEffect(() => {
    const loadQuran = async () => {
      try {
        const db = await openIndexedDB();
        const cacheKey = `fullQuran_v2_${selectedQiraat}`;
        const saved = await getFromDB(db, cacheKey);
        if (saved) {
          setQuranData(saved);
          return;
        }

        setIsLoading(true);
        const url = QURAN_TEXT_URLS[selectedQiraat] || QURAN_TEXT_URLS['hafs'];
        
        // Show warning if not hafs
        if (selectedQiraat !== 'hafs') {
          setError('ملاحظة: النص المعروض هو النص العثماني القياسي (رواية حفص)، حيث لا تتوفر نصوص منفصلة حالياً لبقية الروايات.');
        }

        let data;
        try {
          const res = await fetch(url);
          const text = await res.text();
          try {
            data = JSON.parse(text);
          } catch (e) {
            console.error('Failed to parse JSON for URL:', url, 'Text snippet:', text.substring(0, 50));
            throw e;
          }
        } catch (e) {
          console.error('Failed to load Qiraat, falling back to Hafs:', e);
          try {
            const res = await fetch(QURAN_TEXT_URLS['hafs']);
            const text = await res.text();
            data = JSON.parse(text);
            if (selectedQiraat !== 'hafs') {
              setSelectedQiraat('hafs');
            }
          } catch (e2) {
            console.error('Failed to load Hafs fallback:', e2);
            throw e2;
          }
        }
        
        let normalized: Surah[];

        if (selectedQiraat === 'hafs') {
          // The new structure is already in Surah[] format
          normalized = data as Surah[];
        } else {
          // Normalize data to match our Surah[] interface
          // The structure is a flat array of verses
          const surahsMap: Record<number, any> = {};
          
          // Ensure data is iterable
          const verses = Array.isArray(data) ? data : (data.verses || []);
          
          verses.forEach((v: any) => {
            if (!surahsMap[v.sura_no]) {
              surahsMap[v.sura_no] = {
                id: v.sura_no,
                name: v.sura_name_ar,
                transliteration: v.sura_name_en,
                translation: '',
                type: '',
                total_verses: 0,
                verses: []
              };
            }
            surahsMap[v.sura_no].verses.push({
              id: v.aya_no,
              text: v.aya_no === 1 && v.sura_no !== 9 && (v.sura_no !== 1 || selectedQiraat === 'warsh') && v.aya_text && typeof v.aya_text === 'string' && v.aya_text.startsWith('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ') ? v.aya_text.replace('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', '').trim() : v.aya_text,
              translation: '',
              transliteration: ''
            });
          });

          // Convert map to array and set total_verses
          normalized = Object.values(surahsMap).map((s: any) => ({
            ...s,
            total_verses: s.verses.length
          }));
        }
        
        setQuranData(normalized);
        await saveToDB(db, cacheKey, normalized);
      } catch (e) {
        console.error('فشل تحميل القرآن', e);
        setError('فشل تحميل قاعدة بيانات القرآن. يرجى التحقق من الاتصال.');
      } finally {
        setIsLoading(false);
      }
    };
    loadQuran();
  }, [selectedQiraat]);

  useEffect(() => {
    safeLocalStorageSet('recentSurahs', JSON.stringify(recentSurahs));
    safeLocalStorageSet('fontFamily', fontFamily);
  }, [recentSurahs, fontFamily]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let lastProgress = -1;
    const handleTimeUpdate = () => {
      if (audio.duration) {
        const progress = Math.floor((audio.currentTime / audio.duration) * 100);
        if (progress !== lastProgress) {
          lastProgress = progress;
          setAudioProgress(progress);
        }
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      
      if (activeAyah?.ayah === 0) {
        // Just finished Basmalah, play the target ayah (default to 1 if not specified)
        const targetAyah = activeAyah.targetAyah || 1;
        playRealRecitation(activeAyah.surah, targetAyah, false);
        return;
      }

      playNextAyah();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [selectedSurah, activeAyah, viewMode, selectedReciter, selectedTafsir, searchResult]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setActiveAyah(null);
    setAudioProgress(0);
  }, [viewMode]);

  useEffect(() => {
    if (activeAyah && activeAyah.ayah > 0) {
      fetchTafsir(activeAyah.surah, activeAyah.ayah);
    }
  }, [selectedTafsir]);

  useEffect(() => {
    if (activeAyah && selectedSurah && activeAyah.surah === selectedSurah.id) {
      if (virtuosoRef.current) {
        const indexToScroll = Math.max(0, activeAyah.ayah - 1);
        virtuosoRef.current.scrollToIndex({
          index: indexToScroll,
          align: 'center',
          behavior: 'smooth'
        });
      }
    }
  }, [activeAyah, selectedSurah]);

  useEffect(() => {
    if (selectedSurah) {
      fetchTranslation(selectedSurah.id);
    } else if (searchResult?.type === 'surah') {
      fetchTranslation(searchResult.data.id);
    }
  }, [selectedSurah, selectedTranslation, searchResult]);

  // --- Logic Functions ---

  const fetchTranslation = async (surahNum: number) => {
    if (selectedTranslation === 'none') {
      setTranslationsData({});
      return;
    }
    try {
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNum}/${selectedTranslation}`);
      const data = await res.json();
      if (data.code === 200) {
        const transMap: { [key: number]: string } = {};
        data.data.ayahs.forEach((ayah: any) => {
          transMap[ayah.numberInSurah] = ayah.text;
        });
        setTranslationsData(transMap);
      }
    } catch (e) {
      console.error('فشل جلب الترجمة', e);
    }
  };

  const fetchAyahTranslation = async (surahNum: number, ayahNum: number) => {
    if (selectedTranslation === 'none') return null;
    try {
      const res = await fetch(`https://api.alquran.cloud/v1/ayah/${surahNum}:${ayahNum}/${selectedTranslation}`);
      const data = await res.json();
      if (data.code === 200) {
        return data.data.text;
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  const fetchTafsir = async (surahNum: number, ayahNum: number) => {
    try {
      const surahObj = quranData?.find(s => s.id === surahNum);
      const ayahObj = surahObj?.verses.find(v => v.id === ayahNum);
      const surahName = surahObj?.name || surahNum;
      
      if (selectedTafsir === 'ai.explanation') {
        const prompt = `اشرح الآية رقم ${ayahNum} من ${getSurahDisplayName(surahName.toString())} شرحاً ميسراً ومختصراً باللغة العربية. الآية هي: ${ayahObj?.text}`;
        const aiTafsir = await callAI(provider, [{ role: 'user', content: prompt }]);
        setAIContext({ 
          surah: surahName.toString(), 
          ayah: ayahNum, 
          text: ayahObj?.text, 
          tafsir: aiTafsir.content,
          timestamp: Date.now() 
        });
        logAIEvent(`توليد تفسير ذكي للآية ${ayahNum} من ${getSurahDisplayName(surahName.toString())}`, '🤖', 'tafsir');
        return;
      }
      const res = await fetch(`https://api.alquran.cloud/v1/ayah/${surahNum}:${ayahNum}/${selectedTafsir}`);
      const data = await res.json();
      if (data.code === 200) {
        setAIContext({ 
          surah: surahName.toString(), 
          ayah: ayahNum, 
          text: ayahObj?.text, 
          tafsir: data.data.text,
          timestamp: Date.now() 
        });
        logAIEvent(`قراءة تفسير الآية ${ayahNum} من ${getSurahDisplayName(surahName.toString())}`, '📝');
      }
    } catch (e) {
      console.error("Failed to fetch tafsir:", e);
    }
  };

  const playNextAyah = () => {
    if (playbackModeRef.current === 'single') {
      stopRecitation();
      return;
    }

    const isSurahMode = viewMode === 'browse' || (viewMode === 'search' && searchResult?.type === 'surah');
    const currentSurahObj = viewMode === 'browse' ? selectedSurah : (searchResult?.type === 'surah' ? searchResult.data : null);

    if (isSurahMode && currentSurahObj && activeAyah) {
      // Auto-play next ayah
      const nextAyahId = activeAyah.ayah + 1;
      if (nextAyahId <= currentSurahObj.verses.length) {
        playRealRecitation(currentSurahObj.id, nextAyahId, false);
      } else {
        stopRecitation();
      }
    } else {
      stopRecitation();
    }
  };

  const speakText = (text: string, onEnd?: () => void) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    
    const startSpeech = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to find a high-quality Arabic voice
      const voices = window.speechSynthesis.getVoices();
      const arabicVoice = voices.find(v => v.lang && typeof v.lang === 'string' && v.lang.startsWith('ar')) || voices.find(v => v.lang && typeof v.lang === 'string' && v.lang.includes('ar'));
      if (arabicVoice) {
        utterance.voice = arabicVoice;
      }

      utterance.lang = 'ar-SA';
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };
      utterance.onerror = (e) => {
        console.error("Speech synthesis error:", e);
        setIsSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
    };

    // Chrome/Safari sometimes need a small delay for voices to load
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        startSpeech();
        window.speechSynthesis.onvoiceschanged = null;
      };
    } else {
      startSpeech();
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const analyzeQiraat = async (surah: number, ayah: number, text: string) => {
    if (!text || isAnalyzingQiraat) return;
    setIsAnalyzingQiraat(true);
    try {
      const prompt = `أنت خبير في القراءات العشر. اشرح باختصار أهم الاختلافات في القراءات العشر لهذه الآية الكريمة: 
      سورة رقم ${surah}، آية رقم ${ayah}
      النص: ${text}
      
      اذكر الاختلافات الرئيسية بين القراءات المشهورة (حفص، ورش، قالون، إلخ).`;
      
      const result = await callAIWithFailover('gemini', [
        { role: 'system', content: 'أنت خبير في القراءات العشر والقرآن الكريم.' },
        { role: 'user', content: prompt }
      ]);
      
      setSearchResult({
        type: 'text',
        text: text,
        qiraatDifferences: result.content,
        metadata: {
          surahName: selectedSurah?.name || ''
        }
      });
      setViewMode('search');
    } catch (error) {
      console.error('Qiraat analysis error:', error);
    } finally {
      setIsAnalyzingQiraat(false);
    }
  };

  const playAIRecitation = async (surahNum: number, ayahNum: number, includeBasmalah = false, retryCount = 0) => {
    if (!quranData) return;
    
    const surah = quranData.find(s => s.id === surahNum);
    if (!surah) return;
    
    const ayah = surah.verses.find(v => v.id === ayahNum);
    if (!ayah) return;

    setIsLoading(true);
    setError('');
    
    const userKey = getApiKey('gemini');
    
    // Increment and capture recitation ID
    currentRecitationId.current += 1;
    const recitationId = currentRecitationId.current;

    let textToRead = ayah.text;
    if (includeBasmalah && ayahNum === 1 && (surahNum !== 1 || selectedQiraat === 'warsh') && surahNum !== 9) {
      textToRead = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ " + textToRead;
    }

    try {
      // Use the new audio cache service
      const audioId = generateAudioId(surahNum, ayahNum, `ai-${selectedVoice}`);
      const cachedData = await getCachedAudio(audioId);
      
      let audioData: Uint8Array;
      let mimeType: string;

      if (cachedData) {
        audioData = cachedData.data;
        mimeType = cachedData.mimeType;
        setCurrentAudioData(audioData);
        setCurrentMimeType(mimeType);
      } else {
        const recitationData = await generateRecitation(textToRead, selectedVoice, userKey || undefined);
        if (currentRecitationId.current !== recitationId) return; // Abort if superseded
        
        if (!recitationData) {
          console.warn("AI Recitation generation failed, falling back to browser TTS.");
          setError("تم تجاوز حصة الذكاء الاصطناعي. جاري التبديل إلى القارئ الصوتي المدمج في المتصفح...");
          setIsPlaying(true);
          setActiveAyah({ surah: surahNum, ayah: ayahNum });
          fetchTafsir(surahNum, ayahNum);
          speakText(textToRead, playNextAyah);
          setIsLoading(false);
          return;
        }
        
        // Convert base64 to Uint8Array
        const rData = recitationData as any;
        const binaryString = atob(rData.data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        audioData = bytes;
        mimeType = rData.mimeType;
        setCurrentAudioData(audioData);
        setCurrentMimeType(mimeType);
      }

      let blob: Blob;
      if (mimeType && typeof mimeType === 'string' && mimeType.includes('pcm')) {
        // This shouldn't happen now as generateRecitation adds the header, but for safety:
        const header = new ArrayBuffer(44);
        const view = new DataView(header);
        const sampleRate = 24000;
        
        view.setUint32(0, 0x52494646, false); // "RIFF"
        view.setUint32(4, 36 + audioData.length, true);
        view.setUint32(8, 0x57415645, false); // "WAVE"
        view.setUint32(12, 0x666d7420, false); // "fmt "
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        view.setUint32(36, 0x64617461, false); // "data"
        view.setUint32(40, audioData.length, true);
        
        blob = new Blob([header, audioData], { type: 'audio/wav' });
      } else {
        blob = new Blob([audioData], { type: mimeType });
      }
      
      const audioUrl = URL.createObjectURL(blob);

      if (currentRecitationId.current !== recitationId) return; // Abort if superseded

      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        
        audioRef.current.src = audioUrl;
        audioRef.current.load();
        
        try {
          const playPromise = playAudioWithSettings(audioRef.current, aiRecitationSettings);
          if (playPromise !== undefined) {
            await playPromise;
            setIsPlaying(true);
            setActiveAyah({ surah: surahNum, ayah: ayahNum });
            fetchTafsir(surahNum, ayahNum);

            // Pre-fetch next ayah
            const nextAyahId = ayahNum + 1;
            const nextAyah = surah.verses.find(v => v.id === nextAyahId);
            if (nextAyah) {
              const nextAudioId = generateAudioId(surahNum, nextAyahId, `ai-${selectedVoice}`);
              getCachedAudio(nextAudioId).then((cached: any) => {
                if (!cached) {
                  generateRecitation(nextAyah.text, selectedVoice, userKey || undefined);
                }
              });
            }
          }
        } catch (playError: any) {
          if (playError.name !== 'AbortError') {
            console.error("Playback failed:", playError);
            setError("فشل تشغيل الصوت. يرجى المحاولة مرة أخرى.");
          }
        }
      }
    } catch (e: any) {
      console.error("AI Recitation error:", e);
      
      const errorMessage = e.message || JSON.stringify(e);
      const isRateLimit = errorMessage && typeof errorMessage === 'string' && (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED'));
      const isInternalError = errorMessage && typeof errorMessage === 'string' && (errorMessage.includes('500') || errorMessage.includes('INTERNAL'));

      // Retry logic for 500 errors or empty responses, but NOT for rate limits
      if (retryCount < 2 && !isRateLimit) {
        setTimeout(() => {
          playAIRecitation(surahNum, ayahNum, includeBasmalah, retryCount + 1);
        }, 1000);
        return;
      }

      if (isRateLimit) {
        setError("تم تجاوز حصة الذكاء الاصطناعي. جاري التبديل إلى القارئ الصوتي المدمج في المتصفح...");
        setIsPlaying(true);
        setActiveAyah({ surah: surahNum, ayah: ayahNum });
        fetchTafsir(surahNum, ayahNum);
        speakText(textToRead, playNextAyah);
      } else if (isInternalError) {
        setError("عذراً، خادم الذكاء الاصطناعي مشغول حالياً. يرجى المحاولة بعد قليل.");
      } else {
        setError("عذراً، حدث خطأ أثناء توليد صوت الذكاء الاصطناعي.");
      }
    } finally {
      if (currentRecitationId.current === recitationId) {
        if (retryCount === 0 || error) {
          setIsLoading(false);
        }
      }
    }
  };

  const getCachedAudioUrl = async (url: string, fallbackUrl?: string, prefetchOnly: boolean = false): Promise<string> => {
    try {
      if (!('caches' in window)) return url;
      const cache = await caches.open('quran-audio-cache');
      
      // Try primary cache
      let cachedResponse = await cache.match(url);
      if (!cachedResponse && fallbackUrl) {
        // Try fallback cache
        cachedResponse = await cache.match(fallbackUrl);
      }

      if (cachedResponse) {
        if (prefetchOnly) return url;
        const blob = await cachedResponse.blob();
        return URL.createObjectURL(blob);
      }
      
      // Fetch and cache with retry
      const fetchWithRetry = async (targetUrl: string) => {
        let response;
        for (let i = 0; i < 2; i++) {
          try {
            response = await fetch(targetUrl);
            if (response.ok) return response;
          } catch (err) {
            if (i === 1) throw err;
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        if (response && !response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
      };

      // If not in cache, try to fetch from multiple sources
      const sources = [url];
      if (fallbackUrl) sources.push(fallbackUrl);
      
      // Add mirrors and variations
      const additionalSources: string[] = [];
      for (const s of sources) {
        if (s.includes('everyayah.com')) {
          additionalSources.push(s.replace('everyayah.com', 'mirrors.quranicaudio.com/everyayah'));
          
          // Try MultiLanguage variations for foreign reciters
          if (s.includes('/English/') || s.includes('/French/') || s.includes('/Russian/') || 
              s.includes('/Urdu/') || s.includes('/Chinese/') || s.includes('/Persian/')) {
            if (s.includes('MultiLanguage/')) {
              additionalSources.push(s.replace('MultiLanguage/', ''));
              additionalSources.push(s.replace('everyayah.com/data/MultiLanguage/', 'mirrors.quranicaudio.com/everyayah/'));
            } else {
              additionalSources.push(s.replace('data/', 'data/MultiLanguage/'));
              additionalSources.push(s.replace('everyayah.com/data/', 'mirrors.quranicaudio.com/everyayah/MultiLanguage/'));
            }
          }
        }
      }
      sources.push(...additionalSources);

      // Add backend proxied versions for all sources as robust, CORS-safe fallbacks
      const proxiedSources = sources.map(s => `/api/proxy/audio?url=${encodeURIComponent(s)}`);
      sources.push(...proxiedSources);

      for (const source of sources) {
        try {
          const response = await fetchWithRetry(source);
          if (response && response.ok) {
            try {
              cache.put(url, response.clone());
            } catch (cacheErr) {
              console.warn("Failed to cache audio:", cacheErr);
            }
            if (prefetchOnly) return source;
            const blob = await response.blob();
            return URL.createObjectURL(blob);
          }
        } catch (err) {
          console.warn(`Fetch failed for source: ${source}`, err);
          continue;
        }
      }
    } catch (e) {
      console.warn("Audio fetch/cache system failed:", e);
    }
    // Return proxied final URL as a robust fallback to bypass CORS completely
    const finalFallback = fallbackUrl || url;
    return `/api/proxy/audio?url=${encodeURIComponent(finalFallback)}`;
  };

  const handleTripleClick = async (surah: any, ayah: any) => {
    try {
      setStatus('جاري توليد وصف لسان حال الآية...');
      
      const prompt = `أنت خبير في علوم القرآن وتدبره. قم بتوليد وصف بليغ ومختصر جداً (لسان حال الآية) يعبر عن جوهر الآية وسياقها في القرآن الكريم. اجعل الوصف مؤثراً وكأنه لسان حال الآية نفسها تخاطب القارئ. لا تزد عن جملتين.
الآية: "${ayah.text}" من ${getSurahDisplayName(surah.name)}.`;

      const response = await callAIWithFailover(provider, [
        { role: 'system', content: 'أنت مساعد ذكي متخصص في البلاغة القرآنية والتدبر العميق.' },
        { role: 'user', content: prompt }
      ]);

      if (response && response.content) {
        const description = response.content.trim();
        
        // Dispatch event to update Image Generator and switch tab
        window.dispatchEvent(new CustomEvent('trigger_image_gen', { detail: { prompt: description } }));
        
        // Open AI Hub automatically
        setShowAIHub(true);
        
        await navigator.clipboard.writeText(description);
        setStatus('تم نقل لسان حال الآية إلى المولد الفني!');
        logAIEvent(`توليد وصف لسان حال الآية ${ayah.id} من ${getSurahDisplayName(surah.name)}`, '✨');
        
        // Auto-clear status after 3 seconds
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (err: any) {
      console.error("Triple click AI error:", err);
      setError('فشل في توليد الوصف التلقائي.');
      setStatus('');
    }
  };

  const playRealRecitation = async (surahNum: number, ayahNum: number = 1, playBasmalah = false) => {
    // Stop any other audio
    window.speechSynthesis.cancel();
    // Dispatch event to stop AI Hub audio
    window.dispatchEvent(new CustomEvent('stop_all_audio'));

    currentRecitationId.current += 1;
    const recitationId = currentRecitationId.current;

    const isForeign = selectedReciter.startsWith('en.') || 
                      selectedReciter.startsWith('fr.') || 
                      selectedReciter.startsWith('ru.') || 
                      selectedReciter.startsWith('ur.') || 
                      selectedReciter.startsWith('zh.') || 
                      selectedReciter.startsWith('fa.');

    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (selectedReciter === 'ai.reciter.free') {
      const surah = quranData?.find(s => s.id === surahNum);
      const ayah = surah?.verses.find(v => v.id === ayahNum);
      if (ayah) {
        let textToRead = ayah.text;
        if (playBasmalah && ayahNum === 1 && (surahNum !== 1 || selectedQiraat === 'warsh') && surahNum !== 9) {
          textToRead = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ " + textToRead;
        }
        setIsPlaying(true);
        setActiveAyah({ surah: surahNum, ayah: ayahNum });
        fetchTafsir(surahNum, ayahNum);
        speakText(textToRead, playNextAyah);
      }
      return;
    }

    if (selectedReciter === 'ai.reciter.pro') {
      await playAIRecitation(surahNum, ayahNum, playBasmalah);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const bitrate = getReciterBitrate(selectedReciter);
      if (playBasmalah && ayahNum === 1 && (surahNum !== 1 || selectedQiraat === 'warsh') && surahNum !== 9) {
        let basmalahUrl = `https://cdn.islamic.network/quran/audio/${bitrate}/${selectedReciter}/1.mp3`;
        let basmalahFallback = '';
        const folder = getReciterFolder(selectedReciter);
        if (folder) {
          basmalahFallback = `https://everyayah.com/data/${folder}/001001.mp3`;
        }

        if (isForeign && basmalahFallback) {
          const temp = basmalahUrl;
          basmalahUrl = basmalahFallback;
          basmalahFallback = temp;
        }

        if (audioRef.current) {
          audioRef.current.pause();
          if (audioRef.current.src.startsWith('blob:')) {
            URL.revokeObjectURL(audioRef.current.src);
          }
          const finalUrl = await getCachedAudioUrl(basmalahUrl, basmalahFallback);
          if (recitationId !== currentRecitationId.current) {
            if (finalUrl.startsWith('blob:')) URL.revokeObjectURL(finalUrl);
            return;
          }
          audioRef.current.src = finalUrl;
          
          // Add error listener for Basmalah
          audioRef.current.onerror = () => {
            if (!audioRef.current) return;
            const currentSrc = audioRef.current.src;
            let nextSrc = '';
            
            if (currentSrc !== basmalahFallback && basmalahFallback) {
              nextSrc = basmalahFallback;
            } else if (currentSrc.includes('everyayah.com')) {
              nextSrc = currentSrc.replace('everyayah.com', 'mirrors.quranicaudio.com/everyayah');
            }
            
            if (nextSrc && nextSrc !== currentSrc) {
              console.warn(`Basmalah source failed (${currentSrc}), trying next: ${nextSrc}`);
              audioRef.current.src = nextSrc;
              audioRef.current.load();
              audioRef.current.play().catch(() => {
                // If all Basmalah sources fail, skip to actual ayah
                playRealRecitation(surahNum, ayahNum, false);
              });
            } else {
              // If Basmalah fails completely, skip to actual ayah
              playRealRecitation(surahNum, ayahNum, false);
            }
          };

          audioRef.current.load();
          try {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
              await playPromise;
              setIsPlaying(true);
              setActiveAyah({ surah: surahNum, ayah: 0, targetAyah: ayahNum }); // 0 represents Basmalah, store target
            }
          } catch (playError: any) {
            if (playError.name !== 'AbortError') {
              console.error("Basmalah play error:", playError);
              // If Basmalah fails, skip to the actual ayah
              playRealRecitation(surahNum, ayahNum, false);
            }
          }
        }
        return;
      }

      const globalAyah = getGlobalAyahNumber(surahNum, ayahNum);
      let audioUrl = `https://cdn.islamic.network/quran/audio/${bitrate}/${selectedReciter}/${globalAyah}.mp3`;
      
      // Construct fallback URL for common reciters
      let fallbackUrl = '';
      const surahPadded = String(surahNum).padStart(3, '0');
      const ayahPadded = String(ayahNum).padStart(3, '0');
      const folder = getReciterFolder(selectedReciter);
      if (folder) {
        fallbackUrl = `https://everyayah.com/data/${folder}/${surahPadded}${ayahPadded}.mp3`;
      }

      // For foreign reciters (translations), prefer everyayah.com as it's more reliable for these
      if (isForeign && fallbackUrl) {
        const temp = audioUrl;
        audioUrl = fallbackUrl;
        fallbackUrl = temp;
      }

      if (!audioUrl || (audioUrl && typeof audioUrl === 'string' && audioUrl.includes('undefined'))) {
        console.warn("Invalid audio URL:", audioUrl);
        setError("عذراً، لا يتوفر ملف صوتي لهذا القارئ.");
        setIsLoading(false);
        return;
      }

      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        const finalUrl = await getCachedAudioUrl(audioUrl, fallbackUrl);
        if (recitationId !== currentRecitationId.current) {
          if (finalUrl.startsWith('blob:')) URL.revokeObjectURL(finalUrl);
          return;
        }
        audioRef.current.src = finalUrl;
        
        // Add error listener for debugging and fallback
        audioRef.current.onerror = () => {
          if (!audioRef.current) return;
          
          const currentSrc = audioRef.current.src;
          let nextSrc = '';
          
          if (currentSrc !== fallbackUrl && fallbackUrl) {
            nextSrc = fallbackUrl;
          } else if (currentSrc.includes('everyayah.com')) {
            nextSrc = currentSrc.replace('everyayah.com', 'mirrors.quranicaudio.com/everyayah');
          }
          
          if (nextSrc && nextSrc !== currentSrc) {
            console.warn(`Audio source failed (${currentSrc}), trying next source: ${nextSrc}`);
            audioRef.current.src = nextSrc;
            audioRef.current.load();
            audioRef.current.play().catch(err => {
              if (err.name !== 'AbortError') {
                console.warn("Next audio source also failed:", err);
                setError("تعذر تشغيل الصوت من جميع المصادر. يرجى التحقق من الاتصال.");
                setIsLoading(false);
              }
            });
          } else {
            console.warn("All audio sources failed (Real Recitation)");
            setError("تعذر تشغيل الصوت. يرجى التأكد من اتصال الإنترنت.");
            setIsLoading(false);
          }
        };

        audioRef.current.load();
        try {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
            setIsPlaying(true);
            setActiveAyah({ surah: surahNum, ayah: ayahNum });
            fetchTafsir(surahNum, ayahNum);

            // Pre-fetch next ayah
            const surah = quranData?.find(s => s.id === surahNum);
            const nextAyahId = ayahNum + 1;
            const nextAyah = surah?.verses.find(v => v.id === nextAyahId);
            if (nextAyah) {
              const bitrate = getReciterBitrate(selectedReciter);
              const globalNextAyah = getGlobalAyahNumber(surahNum, nextAyahId);
              let nextAudioUrl = `https://cdn.islamic.network/quran/audio/${bitrate}/${selectedReciter}/${globalNextAyah}.mp3`;
              let nextFallback = '';
              const folder = getReciterFolder(selectedReciter);
              if (folder) {
                const sp = String(surahNum).padStart(3, '0');
                const ap = String(nextAyahId).padStart(3, '0');
                nextFallback = `https://everyayah.com/data/${folder}/${sp}${ap}.mp3`;
              }

              if (isForeign && nextFallback) {
                const temp = nextAudioUrl;
                nextAudioUrl = nextFallback;
                nextFallback = temp;
              }

              // Pre-fetch
              getCachedAudioUrl(nextAudioUrl, nextFallback, true);
            }
          }
        } catch (playError: any) {
          if (playError.name !== 'AbortError') {
            console.warn("Play interrupted (Real Recitation):", playError);
            setError("تعذر تشغيل التلاوة. يرجى المحاولة مرة أخرى.");
          }
        }
      } else {
        setError("مشغل الصوت غير متوفر حالياً.");
      }
    } catch (e) {
      console.warn("Playback error (Real Recitation):", e);
      setError("عذراً، لم نتمكن من تشغيل التلاوة.");
    } finally {
      if (currentRecitationId.current === recitationId) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const handleStopAll = () => {
      stopRecitation();
    };
    window.addEventListener('stop_all_audio', handleStopAll);
    return () => window.removeEventListener('stop_all_audio', handleStopAll);
  }, []);

  useEffect(() => {
    const handleNavigateQuran = (e: any) => {
      const details = e.detail || {};
      const { page, surah, ayah, autoPlay, playSurah, isLastPage, isLastAyah } = details;
      if (!quranData || quranData.length === 0) return;

      let targetSurahObj: any = undefined;
      let targetAyahNum: number | undefined = ayah ? Number(ayah) : undefined;

      // 1. Identify Surah if specified
      if (surah) {
        if (typeof surah === 'number' || !isNaN(Number(surah))) {
          targetSurahObj = quranData.find(s => Number(s.id) === Number(surah));
        } else if (typeof surah === 'string') {
          const cleanName = getSurahDisplayName(surah.replace(/سورة|سوره/g, '').trim());
          targetSurahObj = quranData.find(s => s.name.includes(cleanName) || cleanName.includes(s.name));
        }
      }

      // 2. If no surah was found or specified, but a standard Madina page number (1..604) or isLastPage is provided:
      if (!targetSurahObj && page) {
        const pageNum = Number(page);
        if (pageNum >= 1 && pageNum <= 604) {
          const mapped = getSurahAndAyahFromMadinaPage(pageNum, quranData);
          targetSurahObj = quranData.find(s => Number(s.id) === mapped.surahId);
          if (!targetAyahNum) targetAyahNum = mapped.ayahNum;
        }
      } else if (!targetSurahObj && isLastPage) {
        targetSurahObj = quranData.find(s => Number(s.id) === 114) || quranData[quranData.length - 1];
      }

      if (!targetSurahObj) {
        targetSurahObj = selectedSurah || quranData[0];
      }

      // 3. Determine targetAyahNum if not explicitly provided
      if (isLastAyah || (isLastPage && surah)) {
        targetAyahNum = targetSurahObj.verses.length;
      } else if (!targetAyahNum) {
        if (page) {
          const pageNum = Number(page);
          const sId = Number(targetSurahObj.id);
          const startP = SURAH_START_PAGES[sId] || 1;
          const endP = (sId < 114 && SURAH_START_PAGES[sId + 1]) ? SURAH_START_PAGES[sId + 1] - 1 : 604;

          if (pageNum >= startP && pageNum <= endP) {
            // Provided page is a standard Madina Mushaf page number for this surah
            if (pageNum === endP) {
              targetAyahNum = targetSurahObj.verses.length;
            } else if (pageNum === startP) {
              targetAyahNum = 1;
            } else {
              const totalP = Math.max(1, endP - startP + 1);
              const pIdx = pageNum - startP;
              const progress = (pIdx + 0.5) / totalP;
              targetAyahNum = Math.max(1, Math.min(targetSurahObj.verses.length, Math.round(progress * targetSurahObj.verses.length)));
            }
          } else if (pageNum >= 1 && pageNum <= Math.ceil(targetSurahObj.verses.length / 20)) {
            // App-internal page number within this surah (1..N)
            targetAyahNum = (pageNum - 1) * 20 + 1;
          } else {
            targetAyahNum = 1;
          }
        } else {
          targetAyahNum = 1;
        }
      }

      targetAyahNum = Math.max(1, Math.min(targetSurahObj.verses.length, targetAyahNum));

      // 4. Update state & UI
      setSelectedSurah(targetSurahObj);

      const VERSES_PER_PAGE = 20;
      const calcPage = Math.max(1, Math.min(Math.ceil(targetSurahObj.verses.length / VERSES_PER_PAGE), Math.ceil(targetAyahNum / VERSES_PER_PAGE)));
      setCurrentPage(calcPage);

      setViewMode('browse');
      setShowMidadAlRahman(false);
      setShowAIHub(false);

      setActiveAyah({ surah: Number(targetSurahObj.id), ayah: targetAyahNum });

      if (playSurah) {
        playbackModeRef.current = 'continuous';
        playRealRecitation(Number(targetSurahObj.id), 1, true);
      } else if (autoPlay) {
        playbackModeRef.current = 'single';
        playRealRecitation(Number(targetSurahObj.id), targetAyahNum, false);
      }

      setTimeout(() => {
        const element = document.getElementById(`ayah-${targetAyahNum}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('bg-amber-100', 'dark:bg-amber-900/40');
          setTimeout(() => element.classList.remove('bg-amber-100', 'dark:bg-amber-900/40'), 2500);
        }
      }, 300);
    };

    window.addEventListener('navigate_quran', handleNavigateQuran);
    return () => window.removeEventListener('navigate_quran', handleNavigateQuran);
  }, [quranData, selectedReciter, selectedSurah]);

  const stopRecitation = () => {
    currentRecitationId.current += 1;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPlaying(false);
    setActiveAyah(null);
    setAudioProgress(0);
    setIsLoading(false);
  };

  const handleToolCall = useCallback((tool: string, action: string, params: any) => {
    if (tool !== 'control_app') return;

    switch (action) {
      case 'navigate_to_surah':
        if (params.surah) {
          const surah = quranData?.find(s => s.id === params.surah);
          if (surah) {
            setSelectedSurah(surah);
            setViewMode('browse');
            setShowMidadAlRahman(false);
            if (params.ayah) {
              setActiveAyah({ surah: params.surah, ayah: params.ayah });
            }
          }
        }
        break;
      case 'toggle_audio':
        if (params.surah) {
          const surah = quranData?.find(s => Number(s.id) === Number(params.surah));
          if (surah) {
            setSelectedSurah(surah);
            if (params.ayah) {
              const ayahNum = Number(params.ayah);
              setActiveAyah({ surah: Number(surah.id), ayah: ayahNum });
              playRealRecitation(Number(surah.id), ayahNum, true);
            } else {
              playRealRecitation(Number(surah.id), activeAyah?.ayah || 1, true);
            }
          }
        } else if (isPlaying) {
          stopRecitation();
        } else if (selectedSurah) {
          playRealRecitation(selectedSurah.id, activeAyah?.ayah || 1, true);
        }
        break;
      case 'change_reciter':
        // Try all possible parameter names for reciter ID
        const rId = params.reciterId || params.reciter_id || params.reciter || params.id;
        if (rId) {
          setSelectedReciter(rId);
          // Restart recitation with new reciter if it was playing
          if (isPlaying && selectedSurah) {
            setTimeout(() => {
              playRealRecitation(selectedSurah.id, activeAyah?.ayah || 1, false);
            }, 100);
          }
        } else {
          console.warn(`[Midad ToolCall] change_reciter called without reciterId`, params);
        }
        break;
      case 'open_feature':
        if (params.feature) {
          setShowMidadAlRahman(false);
          switch (params.feature) {
            case 'qibla': setViewMode('qibla'); break;
            case 'prayer_times': setViewMode('prayer_times' as any); break;
            case 'tasbih': setViewMode('tasbih'); break;
            case 'calendar': setViewMode('calendar'); break;
            case 'settings': setShowSettings(true); break;
            case 'dua': setViewMode('duas'); break;
            case 'history': setViewMode('history' as any); break;
          }
        }
        break;
      case 'change_theme':
        // Only toggle if requested, as we don't have direct setThemeMode exported here
        toggleTheme();
        break;
      case 'search_quran':
        if (params.query) {
          setSearchText(params.query);
          setViewMode('search');
          setShowMidadAlRahman(false);
        }
        break;
      case 'change_qiraat':
        if (params.qiraatId) {
          setSelectedQiraat(params.qiraatId);
        }
        break;
      case 'change_tafsir':
        if (params.tafsirId) {
          setSelectedTafsir(params.tafsirId);
        }
        break;
    }
  }, [quranData, isPlaying, selectedSurah, activeAyah, toggleTheme, stopRecitation, playRealRecitation, setSelectedQiraat, setSelectedTafsir]);

  const togglePlayPause = () => {
    if (isLoading) return;

    if (isSpeaking || window.speechSynthesis.speaking) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsSpeaking(true);
        setIsPlaying(true);
      } else {
        window.speechSynthesis.pause();
        setIsSpeaking(false);
        setIsPlaying(false);
      }
      return;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(e => {
          if (e.name !== 'AbortError') {
            console.error("Play error:", e);
            setError("تعذر تشغيل الصوت.");
          }
        });
      }
    }
  };

  const startVoiceInput = async () => {
    if (isListening) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      } else {
        recognitionRef.current?.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    // Try Web Speech API first
    if (SpeechRecognition && recognitionRef.current !== null) {
      try {
        if (!recognitionRef.current) {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.lang = 'ar-SA';
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          
          let currentFinalTranscript = searchText;
          
          recognitionRef.current.onstart = () => {
            setIsListening(true);
            setError('');
          };
          
          recognitionRef.current.onend = () => {
            setIsListening(false);
          };
          
          recognitionRef.current.onerror = (e: any) => {
            console.warn("Speech recognition error:", e.error);
            if (e.error === 'network') {
              setError('تعذر الاتصال بخدمة التعرف على الصوت (خطأ في الشبكة). يرجى المحاولة مرة أخرى لاستخدام البديل.');
              recognitionRef.current = null; // Disable Web Speech API so next click uses MediaRecorder
            } else if (e.error !== 'no-speech') {
              setError('حدث خطأ أثناء التعرف على الصوت: ' + e.error);
            }
            setIsListening(false);
          };

          recognitionRef.current.onresult = (e: any) => {
            let interimTranscript = '';
            let newFinal = '';
            
            for (let i = e.resultIndex; i < e.results.length; ++i) {
              if (e.results[i].isFinal) {
                newFinal += e.results[i][0].transcript;
              } else {
                interimTranscript += e.results[i][0].transcript;
              }
            }
            
            if (newFinal) {
              currentFinalTranscript += (currentFinalTranscript ? ' ' : '') + newFinal;
            }
            
            setSearchText(currentFinalTranscript + (interimTranscript ? ' ' + interimTranscript : ''));
          };
        }
        
        recognitionRef.current.start();
        return;
      } catch (err) {
        console.warn("Failed to start speech recognition, falling back to MediaRecorder", err);
      }
    }

    // Fallback to MediaRecorder + Gemini
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          const base64Audio = base64data.split(',')[1];
          try {
            setIsProcessingAudio(true);
            const apiKey = getApiKey('gemini') || undefined;
            const transcript = await transcribeAudio(base64Audio, 'audio/webm', apiKey);
            setSearchText(prev => prev + (prev ? ' ' : '') + transcript);
          } catch (error) {
            console.error("Transcription failed:", error);
            setError('فشل التعرف على الصوت عبر الذكاء الاصطناعي.');
          } finally {
            setIsProcessingAudio(false);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
      setError('');
    } catch (error) {
      console.warn("Error accessing microphone:", error);
      setError('تعذر الوصول إلى الميكروفون. يرجى التحقق من الصلاحيات.');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText.trim() && searchText.trim() !== lastSearchedText && !isLoading && viewMode === 'search') {
        handleSearchAndCorrect();
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [searchText, lastSearchedText, isLoading, viewMode]);

  const handleSearchAndCorrect = async (query?: string) => {
    const textToSearch = query || searchText;
    if (!textToSearch.trim() || (textToSearch.trim() === lastSearchedText && !query)) return;
    setIsLoading(true);
    setError('');
    if (!query) setLastSearchedText(textToSearch.trim());
    logAIEvent(`بحث عن: ${textToSearch.trim()}`, '🔍', 'search');

    try {
      const prompt = `أنت خبير في القرآن الكريم وعلوم اللغة العربية. 
إذا كان الإدخال اسم سورة، أعد بياناتها.
إذا كان آية أو جزء من آية، صححها وأكملها بالتشكيل الصحيح.
إذا لم يكن نصاً قرآنياً، صححه لغوياً.

يجب أن يكون الرد بتنسيق JSON فقط كالتالي:
{
  "corrected": "النص المصحح بالتشكيل",
  "isQuran": true/false,
  "surahId": رقم السورة (إن وجد كعدد),
  "ayahId": رقم الآية (إن وجد كعدد),
  "explanation": "تفسير ميسر ومختصر جداً للنص",
  "qiraatDifferences": "ذكر أهم الاختلافات في القراءات العشر لهذه الآية إن وجدت باختصار",
  "metadata": {
    "surahName": "اسم السورة",
    "juz": رقم الجزء,
    "hizb": رقم الحزب,
    "asbab": "سبب النزول باختصار",
    "words": عدد الكلمات,
    "chars": عدد الحروف,
    "revelationType": "مكية / مدنية",
    "verseCount": عدد آيات السورة,
    "order": ترتيب السورة
  },
  "error": "رسالة خطأ في حال كان الإدخال غير واضح أو ناقص (مثل ذكر كلمة سورة دون اسم)"
}

الإدخال: ${textToSearch}`;
      
      const aiResponse = await callAI(provider, [{ role: 'user', content: prompt }], undefined, { responseMimeType: 'application/json' });
      const responseText = aiResponse.content;
      
      const fallbackResult = { corrected: responseText, isQuran: false, explanation: "", metadata: {}, error: undefined };
      let aiResult = parseAIJson<any>(responseText, null);
      
      if (!aiResult) {
        // Fallback for non-JSON responses
        if (responseText && typeof responseText === 'string' && responseText.includes("سورة") && responseText.length < 200) {
          setError(responseText);
          setIsLoading(false);
          return;
        }
        aiResult = fallbackResult;
      }
      
      if (aiResult.error && !aiResult.corrected) {
        setError(aiResult.error);
        setIsLoading(false);
        return;
      }

      if (quranData) {
        const stripTashkeel = (str: string) => str.replace(/[\u0617-\u061A\u064B-\u0652]/g, '').replace(/[^\u0600-\u06FF]/g, '').trim();
        
        let foundSurah = aiResult.surahId ? Number(aiResult.surahId) : null;
        let foundAyah = aiResult.ayahId ? Number(aiResult.ayahId) : null;
        let isFullSurah = (aiResult.isQuran || !!foundSurah) && !foundAyah && foundSurah;

        if (!foundSurah || !foundAyah) {
          const cleanCorrected = stripTashkeel(aiResult.corrected);
          if (cleanCorrected.length > 5) {
            for (const s of quranData) {
              for (const v of s.verses) {
                const cleanVerse = stripTashkeel(v.text);
                if ((cleanCorrected && typeof cleanCorrected === 'string' && cleanCorrected.includes(cleanVerse)) || (cleanVerse && typeof cleanVerse === 'string' && cleanVerse.includes(cleanCorrected))) {
                  foundSurah = Number(s.id);
                  foundAyah = Number(v.id);
                  break;
                }
              }
              if (foundSurah) break;
            }
          }
        }

        if (isFullSurah && foundSurah) {
          const s = quranData.find(s => Number(s.id) === foundSurah);
          const metadata = s ? calculateMetadata(s.verses) : undefined;
          setSearchResult({ type: 'surah', data: s, explanation: aiResult.explanation, qiraatDifferences: aiResult.qiraatDifferences, metadata: { ...aiResult.metadata, ...metadata } });
          playbackModeRef.current = 'continuous';
          playRealRecitation(foundSurah, 1, true);
        } else if (foundSurah && foundAyah) {
          const s = quranData.find(s => Number(s.id) === foundSurah);
          const v = s?.verses.find(v => Number(v.id) === foundAyah);
          
          let contextVerses: any[] = [];
          if (v && s) {
            const wordCount = v.text.split(/\s+/).length;
            if (wordCount < 7) {
              const ayahIndex = s.verses.findIndex(verse => verse.id === v.id);
              if (ayahIndex !== -1) {
                if (ayahIndex > 0) contextVerses.push(s.verses[ayahIndex - 1]);
                contextVerses.push(v);
                if (ayahIndex < s.verses.length - 1) contextVerses.push(s.verses[ayahIndex + 1]);
              }
            }
          }
          
          // Fetch translation for this specific ayah
          const translation = await fetchAyahTranslation(foundSurah, foundAyah);
          const metadata = v ? calculateMetadata([v]) : { words: 0, letters: 0, harakaat: 0 };
          
          setSearchResult({ 
            type: 'ayah', 
            data: { surah: s, ayah: v }, 
            contextVerses: contextVerses.length > 0 ? contextVerses : undefined,
            explanation: aiResult.explanation, 
            qiraatDifferences: aiResult.qiraatDifferences,
            metadata: { ...aiResult.metadata, ...metadata, translation } 
          });
          playbackModeRef.current = 'single';
          playRealRecitation(foundSurah, foundAyah, false);
        } else {
          setSearchResult({ type: 'text', text: aiResult.corrected, explanation: aiResult.explanation, qiraatDifferences: aiResult.qiraatDifferences, metadata: aiResult.metadata });
        }
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء المعالجة بالذكاء الاصطناعي.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleClick = () => setAyahContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleTafsirSelect = async (tafsirId: string, surahId: number, ayahId: number) => {
    const surah = quranData?.find(s => s.id === surahId);
    const ayah = surah?.verses.find(v => v.id === ayahId);
    const surahName = surah?.name || surahId;
    const ayahText = ayah?.text || '';

    setSelectedTafsir(tafsirId);
    
    // Set context for AI Hub
    setAIContext({
      surah: surahName.toString(),
      ayah: ayahId,
      text: ayahText,
      tafsirRequest: tafsirId, // New field to trigger AI Hub
      timestamp: Date.now()
    });

    setShowAIHub(true);
    setAyahContextMenu(null);
    
    // We still fetch it if it's not AI, but we'll let AI Hub handle the display
    if (tafsirId !== 'ai.explanation') {
      try {
        const res = await fetch(`https://api.alquran.cloud/v1/ayah/${surahId}:${ayahId}/${tafsirId}`);
        const data = await res.json();
        if (data.code === 200) {
          // Update context with the actual content
          setAIContext(prev => ({
            ...prev!,
            tafsir: data.data.text,
            timestamp: Date.now()
          }));
        }
      } catch (e) {
        console.error("Error fetching tafsir:", e);
      }
    }
  };

  const toggleThemeMode = () => {
    toggleTheme();
  };

  const filteredSurahs = useMemo(() => {
    if (!quranData) return [];
    return quranData.filter(s => 
      (s.name && typeof s.name === 'string' && s.name.includes(surahSearch)) || 
      (s.id && typeof s.id === 'number' && s.id.toString().includes(surahSearch))
    );
  }, [quranData, surahSearch]);

  // --- Render ---

  const handleAIAction = (action: string, data?: any) => {
    switch (action) {
      case 'GOTO_PAGE': {
        const pageNum = (data === 'last' || data === 'الأخيرة' || data === 'اخر') ? 604 : parseInt(data, 10);
        if (!isNaN(pageNum)) {
          window.dispatchEvent(new CustomEvent('navigate_quran', { detail: { page: pageNum, isLastPage: pageNum === 604 } }));
        }
        break;
      }
      case 'NAVIGATE': {
        if (typeof data === 'string') {
          const parts = data.split(':');
          const s = parts[0]?.trim();
          const a = parts[1] ? parseInt(parts[1], 10) : undefined;
          const p = parts[2] ? parseInt(parts[2], 10) : undefined;
          window.dispatchEvent(new CustomEvent('navigate_quran', { detail: { surah: s, ayah: a, page: p } }));
        }
        break;
      }
      case 'BROWSE_SURAH':
        if (typeof data === 'string' && data.includes(':')) {
          const parts = data.split(':');
          const s = parts[0]?.trim();
          const a = parts[1] ? parseInt(parts[1], 10) : 1;
          window.dispatchEvent(new CustomEvent('navigate_quran', { detail: { surah: s, ayah: a } }));
        } else {
          const surah = quranData?.find(s => s.id === parseInt(data) || (s.name && typeof s.name === 'string' && s.name.includes(data)));
          if (surah) {
            handleSurahSelect(surah);
            setShowAIHub(false);
          } else if (data) {
            window.dispatchEvent(new CustomEvent('navigate_quran', { detail: { surah: data } }));
          }
        }
        break;
      case 'SEARCH':
        setSearchText(data);
        handleSearchAndCorrect(data);
        setViewMode('search');
        setShowAIHub(false);
        break;
      case 'VIEW':
        if (data && typeof data === 'string' && ['bookmarks', 'qibla', 'tasbih', 'calendar', 'duas', 'image_generator', 'midad'].includes(data)) {
          if (data === 'midad') {
            setShowMidadAlRahman(true);
            setShowAIHub(false);
          } else {
            setViewMode(data as ViewMode);
            setShowAIHub(false);
          }
        } else if (data === 'settings') {
          setShowAIHub(true);
        }
        break;
      case 'PLAY':
        if (data && typeof data === 'string' && data.includes(':')) {
          const [sNum, aNum] = data.split(':');
          playRealRecitation(parseInt(sNum), parseInt(aNum));
        } else if (data) {
          playRealRecitation(parseInt(data), 1);
        }
        break;
      case 'STOP':
        stopRecitation();
        break;
      case 'SET_RECITER':
        setSelectedReciter(data);
        logAIEvent(`تغيير القارئ إلى ${data}`, '🎙️', 'settings');
        break;
      case 'SET_QIRAAT':
        setSelectedQiraat(data);
        logAIEvent(`تغيير الرواية إلى ${data}`, '📖', 'settings');
        break;
      case 'TOGGLE_TAJWEED':
        setIsTajweed(!isTajweed);
        logAIEvent(`تبديل التجويد الملون`, '🎨', 'settings');
        break;
      case 'SET_FONT_SIZE':
        const size = parseInt(data);
        if (!isNaN(size)) setFontSize(size);
        break;
      case 'GENERATE_IMAGE':
        setViewMode('image_generator');
        setShowAIHub(false);
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('trigger_image_gen', { detail: { prompt: data } }));
        }, 500);
        break;
    }
  };

  const handleProviderChange = (newProvider: AIProviderKey) => {
    setProvider(newProvider);
    setApiKeyInput(getApiKey(newProvider));
  };

  const handleApiKeyChange = (newKey: string) => {
    setApiKeyInput(newKey);
    setProviderApiKey(provider, newKey);
  };

  return (
    <ErrorBoundary>
      <OfflineIndicator />
        <>
          <Suspense fallback={null}>
            <SpiritualVision 
              text={visionText} 
              onClose={() => setVisionText(null)} 
            />
          </Suspense>
          <Suspense fallback={null}>
            <TypecastModal 
              isOpen={isTypecastOpen} 
              onClose={() => setIsTypecastOpen(false)} 
              text={typecastText} 
            />
          </Suspense>
      {!isUnlocked ? (
        <PaymentGate onUnlock={() => {
          setIsUnlocked(true);
          safeLocalStorageSet('quran_app_unlocked_v2', 'true');
        }} />
      ) : !quranData && isLoading ? (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdf8ee] dark:bg-[#0c0a09]">
          <Loader2 className="w-10 h-10 animate-spin text-amber-600 mb-4" />
          <p className="text-amber-900 dark:text-amber-100 font-bold text-lg">جاري تحميل المصحف الشريف...</p>
        </div>
      ) : (
      <div className={`min-h-screen-dynamic transition-colors duration-300 font-vazir relative overflow-x-hidden islamic-pattern ${themeMode === 'dark' ? 'dark bg-[#0c0a09]' : 'bg-[#fdf8ee] noor-mode'}`} style={{ fontSize: `${fontSize}px` }} dir="rtl">
        {/* Top App Bar */}
        {viewMode !== 'ai-chat' && (
          <header className="sticky top-0 z-50 h-12 bg-white/95 dark:bg-[#141210]/95 backdrop-blur-md border-b border-amber-200/50 dark:border-amber-900/40">
            <div className="max-w-6xl mx-auto h-full px-3 sm:px-6 flex items-center justify-between gap-2">
              <button
                onClick={() => { setViewMode('search'); setShowMidadAlRahman(false); setSelectedSurah(null); }}
                className="flex items-center gap-2 text-amber-950 dark:text-amber-50 hover:opacity-85 transition-opacity shrink-0"
              >
                <span className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-sm">
                  <BookOpen size={15} />
                </span>
                <span className="font-kufi font-bold text-sm sm:text-base whitespace-nowrap">مداد الرحمن</span>
              </button>

              <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto hide-scrollbar">
                <PWAInstallButton />
                <button 
                  onClick={() => setShowUserGuide(true)} 
                  className="w-7 h-7 rounded-lg bg-amber-50/80 dark:bg-amber-900/25 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-800/40 border border-amber-200/50 dark:border-amber-800/40 flex items-center justify-center transition-colors shrink-0"
                  title="دليل المستخدم"
                  aria-label="دليل المستخدم"
                >
                  <Info size={14} />
                </button>
                <button 
                  onClick={() => setShowSettings(!showSettings)} 
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${showSettings ? 'bg-amber-700 text-white border-amber-700' : 'bg-amber-50/80 dark:bg-amber-900/25 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-800/40 border-amber-200/50 dark:border-amber-800/40'}`}
                  title="الإعدادات"
                  aria-label="الإعدادات"
                >
                  <Settings2 size={14} />
                </button>
                <button 
                  onClick={toggleThemeMode} 
                  className="w-7 h-7 rounded-lg bg-amber-50/80 dark:bg-amber-900/25 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-800/40 border border-amber-200/50 dark:border-amber-800/40 flex items-center justify-center transition-colors shrink-0"
                  title={
                    themeMode === 'dark' ? "الوضع الليلي" : 
                    themeMode === 'light' ? "الوضع النهاري" : 
                    "تلقائي (حسب النظام)"
                  }
                  aria-label="تغيير المظهر"
                >
                  {themeMode === 'dark' ? <Moon size={14} /> : 
                   themeMode === 'light' ? <Sun size={14} /> : 
                   <Monitor size={14} />}
                </button>
              </div>
            </div>
          </header>
        )}

        <div className={`relative z-10 ${viewMode === 'ai-chat' ? 'max-w-7xl h-screen-dynamic flex flex-col p-3 sm:p-5' : 'max-w-6xl px-3 sm:px-6 pt-3 pb-24 space-y-3.5'} mx-auto`}>

          {viewMode !== 'ai-chat' && (
            <section className="space-y-3.5">
              {/* Hero Banner with Octagram and Basmala */}
              <div className="rounded-2xl bg-white/95 dark:bg-[#171412]/95 border border-amber-200/50 dark:border-amber-900/40 shadow-sm p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-right space-y-1.5 flex-1">
                  <h1 className="font-bold text-amber-950 dark:text-amber-50">
                    <QuranVerse />
                  </h1>
                  <p className="text-lg sm:text-xl text-amber-800/90 dark:text-amber-300/90 font-quran">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </p>
                </div>
                <div className="shrink-0 flex justify-center">
                  <Octagram />
                </div>
              </div>

              {/* Balanced 2-Column Time & Prayer Essentials */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-stretch">
                <HijriClock />
                <PrayerTimesCard />
              </div>

              {/* Daily Verse Inspiration */}
              <DailyInspiration />
            </section>
          )}

          {/* Workspace Navigation Strip */}
          <nav aria-label="أقسام المنصة" className={`${viewMode === 'ai-chat' ? 'mb-2' : ''}`}>
            <div className="rounded-xl bg-white/95 dark:bg-[#171412]/95 border border-amber-200/50 dark:border-amber-900/40 shadow-sm p-1 overflow-x-auto hide-scrollbar">
              <div className="flex items-center gap-1 min-w-max lg:justify-center">
                <button 
                  onClick={() => { setViewMode('search'); setShowMidadAlRahman(false); }} 
                  className={`h-8 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${viewMode === 'search' && !showMidadAlRahman ? 'bg-amber-700 text-white shadow-sm' : 'text-amber-900/80 dark:text-amber-100/80 hover:bg-amber-100/70 dark:hover:bg-amber-900/30'}`}
                >
                  <Search size={14} />
                  <span>البحث</span>
                </button>

                <button 
                  onClick={() => { setViewMode('browse'); setShowMidadAlRahman(false); }} 
                  className={`h-8 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${viewMode === 'browse' && !showMidadAlRahman ? 'bg-amber-700 text-white shadow-sm' : 'text-amber-900/80 dark:text-amber-100/80 hover:bg-amber-100/70 dark:hover:bg-amber-900/30'}`}
                >
                  <BookOpen size={14} />
                  <span>المصحف</span>
                </button>

                <button 
                  onClick={() => setShowMidadAlRahman(true)} 
                  className={`h-8 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${showMidadAlRahman ? 'bg-amber-800 text-white shadow-sm' : 'text-amber-900/80 dark:text-amber-100/80 hover:bg-amber-100/70 dark:hover:bg-amber-900/30'}`}
                >
                  <PenTool size={14} />
                  <span>مداد الرحمن</span>
                </button>

                <button 
                  onClick={() => { setViewMode('ai-chat'); setShowMidadAlRahman(false); }} 
                  className={`h-8 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${viewMode === 'ai-chat' && !showMidadAlRahman ? 'bg-sky-700 text-white shadow-sm' : 'text-sky-700 dark:text-sky-300 hover:bg-sky-100/70 dark:hover:bg-sky-900/30'}`}
                >
                  <Sparkles size={14} />
                  <span>المساعد</span>
                </button>

                <div className="w-px h-4 bg-amber-200 dark:bg-amber-800/60 mx-0.5 shrink-0" />

                <button 
                  onClick={() => { setViewMode('duas'); setShowMidadAlRahman(false); }} 
                  className={`h-8 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${viewMode === 'duas' && !showMidadAlRahman ? 'bg-amber-700 text-white shadow-sm' : 'text-amber-900/80 dark:text-amber-100/80 hover:bg-amber-100/70 dark:hover:bg-amber-900/30'}`}
                >
                  <Heart size={14} />
                  <span>الأدعية</span>
                </button>

                <button 
                  onClick={() => { setViewMode('qibla'); setShowMidadAlRahman(false); }} 
                  className={`h-8 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${viewMode === 'qibla' && !showMidadAlRahman ? 'bg-amber-700 text-white shadow-sm' : 'text-amber-900/80 dark:text-amber-100/80 hover:bg-amber-100/70 dark:hover:bg-amber-900/30'}`}
                >
                  <Compass size={14} />
                  <span>القبلة</span>
                </button>

                <button 
                  onClick={() => { setViewMode('tasbih'); setShowMidadAlRahman(false); }} 
                  className={`h-8 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${viewMode === 'tasbih' && !showMidadAlRahman ? 'bg-amber-700 text-white shadow-sm' : 'text-amber-900/80 dark:text-amber-100/80 hover:bg-amber-100/70 dark:hover:bg-amber-900/30'}`}
                >
                  <Hash size={14} />
                  <span>السبحة</span>
                </button>

                <button 
                  onClick={() => { setViewMode('bookmarks'); setShowMidadAlRahman(false); }} 
                  className={`h-8 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${viewMode === 'bookmarks' && !showMidadAlRahman ? 'bg-amber-700 text-white shadow-sm' : 'text-amber-900/80 dark:text-amber-100/80 hover:bg-amber-100/70 dark:hover:bg-amber-900/30'}`}
                >
                  <Bookmark size={14} />
                  <span>المحفوظات</span>
                </button>

                <button 
                  onClick={() => { setViewMode('calendar'); setShowMidadAlRahman(false); }} 
                  className={`h-8 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${viewMode === 'calendar' && !showMidadAlRahman ? 'bg-amber-700 text-white shadow-sm' : 'text-amber-900/80 dark:text-amber-100/80 hover:bg-amber-100/70 dark:hover:bg-amber-900/30'}`}
                >
                  <Calendar size={14} />
                  <span>اليومية</span>
                </button>
              </div>
            </div>
          </nav>

        <main className="space-y-4">
          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <SettingsPanel
                show={showSettings}
                onClose={() => setShowSettings(false)}
                provider={provider}
                apiKeyInput={apiKeyInput}
                selectedTranslation={selectedTranslation}
                selectedQiraat={selectedQiraat}
                fontSize={fontSize}
                fontFamily={fontFamily}
                onProviderChange={handleProviderChange}
                onApiKeyChange={handleApiKeyChange}
                onTranslationChange={setSelectedTranslation}
                onQiraatChange={setSelectedQiraat}
                onFontSizeChange={setFontSize}
                onFontFamilyChange={setFontFamily}
                selectedVoice={selectedVoice}
                onVoiceChange={setSelectedVoice}
                ttsModel={ttsModel}
                onTtsModelChange={setTtsModel}
                aiRecitationSettings={aiRecitationSettings}
                onAiRecitationSettingsChange={setAiRecitationSettings}
                humanRecitationSettings={humanRecitationSettings}
                onHumanRecitationSettingsChange={setHumanRecitationSettings}
                onResetApp={() => {
                  localStorage.removeItem('quran_app_unlocked_v2');
                  localStorage.removeItem('app_unlocked');
                  setIsUnlocked(false);
                  setShowSettings(false);
                }}
                onRefreshModels={async () => {
                  await fetchAllProvidersModels(true);
                }}
              />
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {viewMode === 'search' ? (
              <motion.div key="search" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-3.5">
                {/* Recent Surahs */}
                {recentSurahs.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar px-1">
                    <span className="text-[11px] font-bold text-amber-800/75 dark:text-amber-300/75 whitespace-nowrap shrink-0">آخر ما قرأت:</span>
                    {recentSurahs.map(surahId => {
                      const surah = quranData?.find(s => s.id === surahId);
                      return surah ? (
                        <button
                          key={surahId}
                          onClick={() => handleSurahSelect(surah)}
                          className="h-7 px-2.5 bg-white/90 dark:bg-[#171412]/90 text-amber-900 dark:text-amber-100 border border-amber-200/60 dark:border-amber-800/40 rounded-lg whitespace-nowrap shrink-0 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-800/50 transition-colors"
                        >
                          {surah.name}
                        </button>
                      ) : null;
                    })}
                  </div>
                )}

                {/* Search Composer - Primary Action Immediately Accessible */}
                <div className="relative" role="search">
                  <div className="bg-white dark:bg-[#171412] rounded-2xl shadow-sm overflow-hidden border border-amber-200/60 dark:border-amber-900/50">
                    <label htmlFor="quran-search-input" className="sr-only">البحث في القرآن الكريم</label>
                    <textarea
                      ref={searchInputRef}
                      id="quran-search-input"
                      value={searchText}
                      onChange={handleTextChange}
                      onKeyDown={handleKeyDown}
                      placeholder="ابحث في آيات الذكر الحكيم... اكتب آيةً كريمة، أو طرفاً منها، أو اسم السورة (Ctrl+K)"
                      aria-label="خانة البحث في القرآن الكريم"
                      className="w-full h-20 sm:h-24 px-4 py-3 text-lg sm:text-xl text-right bg-transparent border-none focus:ring-0 focus:outline-none resize-none font-quran leading-relaxed text-amber-950 dark:text-amber-50 placeholder:text-amber-900/45 dark:placeholder:text-amber-100/35"
                      dir="rtl"
                      lang="ar"
                      aria-autocomplete="list"
                      aria-controls="search-suggestions"
                      aria-expanded={suggestions.length > 0}
                      aria-haspopup="listbox"
                      aria-activedescendant={activeSuggestionIndex >= 0 ? `suggestion-${activeSuggestionIndex}` : undefined}
                    />
                    
                    {suggestions.length > 0 && (
                      <ul 
                        id="search-suggestions"
                        className="w-full bg-amber-50/70 dark:bg-[#1e1a17] border-t border-amber-200/60 dark:border-amber-900/40 max-h-48 overflow-auto" 
                        dir="rtl" 
                        role="listbox"
                        aria-label="اقتراحات البحث"
                      >
                        {suggestions.map((sug, i) => (
                          <li
                            key={i}
                            id={`suggestion-${i}`}
                            role="option"
                            aria-selected={i === activeSuggestionIndex}
                            className={`px-4 py-2.5 text-base sm:text-lg font-quran cursor-pointer text-amber-900 dark:text-amber-100 transition-colors border-b border-amber-100/60 dark:border-amber-900/20 last:border-b-0 ${i === activeSuggestionIndex ? 'bg-amber-200/70 dark:bg-amber-800/60' : 'hover:bg-amber-100/70 dark:hover:bg-amber-900/40'}`}
                            onClick={() => {
                              setSearchText(sug);
                              setSuggestions([]);
                              setActiveSuggestionIndex(-1);
                            }}
                          >
                            {sug}
                          </li>
                        ))}
                      </ul>
                    )}

                    {isListening && (
                      <div className="px-4 py-1.5 bg-rose-500/10 border-t border-rose-500/20">
                        <AudioWaveform isListening={isListening} className="w-full justify-between" />
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 bg-amber-50/50 dark:bg-[#1e1a17] border-t border-amber-100 dark:border-amber-900/40">
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={startVoiceInput} 
                          disabled={isProcessingAudio}
                          aria-label={isProcessingAudio ? 'جاري معالجة الصوت...' : isListening ? 'إيقاف الاستماع' : 'تحدث بالصوت'}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isProcessingAudio ? 'bg-amber-200 text-amber-600 cursor-wait' : isListening ? 'bg-rose-600 text-white' : 'bg-white dark:bg-[#141210] text-amber-800 dark:text-amber-200 border border-amber-200/70 dark:border-amber-800/50 hover:bg-amber-100'}`}
                          title={isProcessingAudio ? 'جاري معالجة الصوت...' : isListening ? 'إيقاف الاستماع' : 'تحدث بالصوت'}
                        >
                          {isProcessingAudio ? <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /> : <Mic size={15} />}
                        </button>
                        {searchText.trim().length > 0 && (
                          <button 
                            onClick={() => { setSearchText(''); setSuggestions([]); }} 
                            aria-label="مسح النص"
                            title="مسح النص"
                            className="w-8 h-8 rounded-lg bg-white dark:bg-[#141210] text-amber-800 dark:text-amber-200 border border-amber-200/70 dark:border-amber-800/50 hover:bg-amber-100 flex items-center justify-center transition-colors"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-1 justify-end min-w-[200px]">
                        <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                          <label htmlFor="reciter-select" className="text-[11px] font-bold text-amber-800 dark:text-amber-300 whitespace-nowrap hidden sm:inline">القارئ:</label>
                          <select 
                            id="reciter-select"
                            value={selectedReciter} 
                            onChange={(e) => setSelectedReciter(e.target.value)} 
                            className="w-full sm:w-48 h-8 bg-white dark:bg-[#141210] border border-amber-200 dark:border-amber-800/60 rounded-lg px-2.5 text-xs text-amber-950 dark:text-amber-50 font-bold focus:ring-2 focus:ring-amber-500/30 outline-none"
                          >
                            {RECITERS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                        </div>
                        <button 
                          onClick={() => handleSearchAndCorrect()} 
                          disabled={isLoading || !searchText.trim()} 
                          aria-label="بدء التلاوة والبحث"
                          className="h-8 px-4 bg-amber-700 hover:bg-amber-800 text-white rounded-lg shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 font-bold text-xs whitespace-nowrap shrink-0"
                        >
                          {isLoading ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Play size={13} fill="currentColor" /><span>بحث وتلاوة</span></>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Corrected Result */}
                <div aria-live="polite">
                  {searchResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className={`bg-white/95 dark:bg-[#171412]/95 p-4 sm:p-6 rounded-2xl shadow-sm border border-amber-200/60 dark:border-amber-900/40 relative ${isExpanded ? 'expanded-view' : ''}`}
                    >
                      <div className="flex flex-wrap justify-between items-center gap-2 pb-3 mb-4 border-b border-amber-100 dark:border-amber-900/30">
                        <h2 className="text-base sm:text-lg font-bold text-amber-950 dark:text-amber-50 flex items-center gap-2 font-kufi">
                          <span className="w-7 h-7 rounded-lg bg-amber-100/80 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                            <BookOpen size={15} />
                          </span>
                          <span>نتائج البحث</span>
                        </h2>
                        <div className="flex items-center gap-1.5">
                          <SmartActionButton onClick={() => setShowAIHub(true)} />
                          <button 
                            onClick={() => {
                              if (isPlaying) {
                                stopRecitation();
                              } else if (searchResult.type === 'ayah') {
                                playbackModeRef.current = 'single';
                                playRealRecitation(searchResult.data.surah.id, searchResult.data.ayah.id);
                              } else if (searchResult.type === 'surah') {
                                playbackModeRef.current = 'continuous';
                                playRealRecitation(searchResult.data.id, 1);
                              } else {
                                speakText(searchResult.text || '');
                              }
                            }} 
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isPlaying ? 'bg-red-600 text-white' : 'bg-amber-50/80 dark:bg-amber-900/25 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-800/40 border border-amber-200/50 dark:border-amber-800/40'}`}
                            title={isPlaying ? "إيقاف الاستماع" : "استماع"}
                            aria-label={isPlaying ? "إيقاف الاستماع" : "استماع"}
                          >
                            {isPlaying ? <Square size={13} fill="currentColor" /> : <Volume2 size={14} />}
                          </button>
                          <button 
                            onClick={() => {
                              const textToCopy = searchResult.type === 'text' ? searchResult.text : (searchResult.type === 'surah' ? searchResult.data.verses.map((v: any) => v.text).join(' ') : searchResult.data.ayah.text);
                              navigator.clipboard.writeText(textToCopy || '');
                            }} 
                            className="w-7 h-7 rounded-lg bg-amber-50/80 dark:bg-amber-900/25 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-800/40 border border-amber-200/50 dark:border-amber-800/40 flex items-center justify-center transition-colors"
                            title="نسخ النص"
                            aria-label="نسخ النص"
                          >
                            <Copy size={13} />
                          </button>
                          <button 
                            onClick={() => setIsExpanded(!isExpanded)} 
                            className="w-7 h-7 rounded-lg bg-amber-50/80 dark:bg-amber-900/25 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-800/40 border border-amber-200/50 dark:border-amber-800/40 flex items-center justify-center transition-colors"
                            title={isExpanded ? "تصغير" : "ملء الشاشة"}
                            aria-label={isExpanded ? "تصغير" : "ملء الشاشة"}
                          >
                            {isExpanded ? <Minimize size={13} /> : <Maximize size={13} />}
                          </button>
                        </div>
                      </div>
                      
                      {searchResult.explanation && (
                        <div className="bg-emerald-50/60 dark:bg-emerald-950/25 p-3.5 sm:p-4 rounded-xl border border-emerald-200/70 dark:border-emerald-800/40 mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-1.5">
                              <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
                              <span>التفسير الميسر</span>
                            </h4>
                            <button 
                              onClick={() => isSpeaking ? stopSpeaking() : speakText(searchResult.explanation || "")}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700/50 flex items-center justify-center transition-colors"
                              aria-label="قراءة التفسير"
                            >
                              {isSpeaking ? <Square size={13} className="text-red-500" /> : <Volume2 size={13} />}
                            </button>
                          </div>
                          <p className="text-xs sm:text-sm text-emerald-950/90 dark:text-emerald-50/90 leading-relaxed font-sans">
                            {searchResult.explanation}
                          </p>
                        </div>
                      )}

                      {searchResult.qiraatDifferences && (
                        <div className="bg-sky-50/60 dark:bg-sky-950/25 p-3.5 sm:p-4 rounded-xl border border-sky-200/70 dark:border-sky-800/40 mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs sm:text-sm font-bold text-sky-900 dark:text-sky-100 flex items-center gap-1.5">
                              <Layout size={14} className="text-sky-600 dark:text-sky-400" />
                              <span>اختلاف القراءات</span>
                            </h4>
                            <button 
                              onClick={() => isSpeaking ? stopSpeaking() : speakText(searchResult.qiraatDifferences || "")}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-sky-900/50 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-700/50 flex items-center justify-center transition-colors"
                              aria-label="قراءة القراءات"
                            >
                              {isSpeaking ? <Square size={13} className="text-red-500" /> : <Volume2 size={13} />}
                            </button>
                          </div>
                          <p className="text-xs sm:text-sm text-sky-950/90 dark:text-sky-50/90 leading-relaxed font-sans">
                            {searchResult.qiraatDifferences}
                          </p>
                        </div>
                      )}

                      {searchResult.metadata && Object.keys(searchResult.metadata).length > 0 && (
                        <div className="mb-4 grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {[
                            { label: 'السورة', value: searchResult.metadata.surahName, icon: <BookOpen size={12} /> },
                            { label: 'الجزء', value: searchResult.metadata.juz, icon: <Layout size={12} /> },
                            { label: 'الحزب', value: searchResult.metadata.hizb, icon: <Hash size={12} /> },
                            { label: 'النزول', value: searchResult.metadata.revelationType, icon: <Sparkles size={12} /> },
                            { label: 'الكلمات', value: searchResult.metadata.words, icon: <Type size={12} /> },
                            { label: 'الحروف', value: searchResult.metadata.letters, icon: <Type size={12} /> },
                            { label: 'الحركات', value: searchResult.metadata.harakaat, icon: <Type size={12} /> },
                            { label: 'الآيات', value: searchResult.metadata.verseCount, icon: <Hash size={12} /> },
                            { label: 'الترتيب', value: searchResult.metadata.order, icon: <Hash size={12} /> },
                          ].filter(item => item.value).map((item, idx) => (
                            <div 
                              key={idx}
                              className="bg-amber-50/60 dark:bg-[#1e1a17] p-2 rounded-xl border border-amber-200/40 dark:border-amber-900/30 flex flex-col items-center text-center"
                            >
                              <span className="text-[11px] font-medium text-amber-700/80 dark:text-amber-300/80 mb-0.5 flex items-center gap-1">
                                {item.icon}
                                {item.label}
                              </span>
                              <span className="font-bold text-amber-950 dark:text-amber-100 text-xs sm:text-sm tabular-nums">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {searchResult.metadata?.asbab && (
                        <div className="bg-sky-50/60 dark:bg-sky-950/25 p-3.5 sm:p-4 rounded-xl border border-sky-200/70 dark:border-sky-800/40 mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs sm:text-sm font-bold text-sky-900 dark:text-sky-100 flex items-center gap-1.5">
                              <Info size={14} className="text-sky-600 dark:text-sky-400" />
                              <span>سبب النزول</span>
                            </h4>
                            <button 
                              onClick={() => isSpeaking ? stopSpeaking() : speakText(searchResult.metadata?.asbab || '')}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-sky-900/50 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-700/50 flex items-center justify-center transition-colors"
                              aria-label="قراءة سبب النزول"
                            >
                              {isSpeaking ? <Square size={13} className="text-red-500" /> : <Volume2 size={13} />}
                            </button>
                          </div>
                          <p className="text-xs sm:text-sm text-sky-950/90 dark:text-sky-50/90 leading-relaxed font-sans">
                            {searchResult.metadata.asbab}
                          </p>
                        </div>
                      )}

                      {searchResult.type === 'surah' && searchResult.data && (
                        <div className="space-y-4">
                          <div className="text-center pb-3 border-b border-amber-100 dark:border-amber-900/30">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-amber-950 dark:text-amber-50 font-quran mb-1">
                              {searchResult.data.name}
                            </h2>
                            <p className="text-xs font-medium text-amber-800/75 dark:text-amber-200/75 tabular-nums">
                              {searchResult.data.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} · {searchResult.data.verses.length} آية
                              {searchResult.metadata?.order ? ` · ترتيب النزول: ${searchResult.metadata.order}` : ''}
                            </p>
                          </div>

                          {Number(searchResult.data.id) !== 9 && (
                            <div className="text-center py-3.5 bg-amber-50/50 dark:bg-[#1e1a17]/60 rounded-xl border border-amber-100 dark:border-amber-900/30">
                              <p className="font-quran text-xl sm:text-2xl text-amber-900 dark:text-amber-100">
                                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                              </p>
                            </div>
                          )}
                          
                          <Virtuoso
                            useWindowScroll
                            data={searchResult.data.verses}
                            itemContent={(_index, ayah: any) => (
                              <div className="pb-3">
                                <div 
                                  key={ayah.id} 
                                  onClick={(e) => { 
                                    if (e.detail === 3) {
                                      handleTripleClick(searchResult.data, ayah);
                                    } else {
                                      playbackModeRef.current = 'single'; 
                                      playRealRecitation(searchResult.data.id, ayah.id, ayah.id === 1); 
                                      setAIContext(getEnrichedAIContext(searchResult.data, ayah));
                                      logAIEvent(`الاستماع للآية ${ayah.id} من ${getSurahDisplayName(searchResult.data.name)}`, '🔊');
                                    }
                                  }}
                                  className={`p-4 sm:p-5 rounded-xl cursor-pointer transition-colors group border ${isPlaying && (activeAyah?.ayah === ayah.id || (activeAyah?.ayah === 0 && ayah.id === 1)) ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600' : 'bg-white dark:bg-[#1c1815] border-amber-200/50 dark:border-amber-900/40 hover:border-amber-300 dark:hover:border-amber-700'}`}
                                >
                                  <div className="flex flex-col gap-2.5">
                                    <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-amber-100/60 dark:border-amber-900/25">
                                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300 font-kufi tabular-nums">
                                        آية {ayah.id}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <ReadAloud text={ayah.text} />
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(ayah.text);
                                          }}
                                          className="w-7 h-7 rounded-lg bg-amber-50/80 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 hover:bg-amber-100 flex items-center justify-center transition-colors"
                                          title="نسخ الآية"
                                        >
                                          <Copy size={13} />
                                        </button>
                                        {navigator.share && (
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              navigator.share({
                                                title: `${getSurahDisplayName(searchResult.data.name)} - آية ${ayah.id}`,
                                                text: `${ayah.text}\n[${getSurahDisplayName(searchResult.data.name)} - آية ${ayah.id}]`,
                                              }).catch(console.error);
                                            }}
                                            className="w-7 h-7 rounded-lg bg-amber-50/80 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 hover:bg-amber-100 flex items-center justify-center transition-colors"
                                            title="مشاركة الآية"
                                          >
                                            <Share2 size={13} />
                                          </button>
                                        )}
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setAIContext(getEnrichedAIContext(searchResult.data, ayah));
                                            logAIEvent(`طلب مساعدة ذكية للآية ${ayah.id} من سورة ${searchResult.data.name}`, '✨');
                                            setShowAIHub(true);
                                          }}
                                          className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-200 hover:bg-sky-100 flex items-center justify-center transition-colors"
                                          title="اسأل الذكاء الاصطناعي"
                                        >
                                          <Sparkles size={13} />
                                        </button>
                                      </div>
                                    </div>

                                    <p className="text-right font-quran text-amber-950 dark:text-amber-50" style={{ fontSize: `${fontSize * 1.6}px`, lineHeight: '2.25' }} dir="rtl">
                                      <TajweedText text={ayah.text} isTajweed={isTajweed} />
                                      <span className="inline-flex items-center justify-center w-7 h-7 mx-1.5 text-xs border border-amber-400/70 dark:border-amber-700 rounded-full text-amber-800 dark:text-amber-200 font-bold bg-amber-50/70 dark:bg-amber-900/40 tabular-nums">
                                        {ayah.id}
                                      </span>
                                    </p>

                                    {selectedTranslation !== 'none' && translationsData[ayah.id] && (
                                      <div className="text-left font-sans text-xs sm:text-sm text-amber-900/80 dark:text-amber-100/75 leading-relaxed p-3 bg-amber-50/60 dark:bg-[#141210]/70 rounded-xl border border-amber-200/40 dark:border-amber-900/30 flex items-start justify-between gap-2">
                                        <span className="flex-1" dir="ltr">{translationsData[ayah.id]}</span>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            isSpeaking ? stopSpeaking() : speakText(translationsData[ayah.id]);
                                          }}
                                          className="w-7 h-7 rounded-lg bg-white dark:bg-amber-900/40 text-amber-700 dark:text-amber-200 flex items-center justify-center shrink-0"
                                          title="قراءة الترجمة"
                                        >
                                          {isSpeaking ? <Square size={13} className="text-red-600" /> : <Volume2 size={13} />}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          />
                        </div>
                      )}

                      {searchResult.type === 'ayah' && searchResult.data && (
                        <div className="space-y-3.5">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-amber-50/70 dark:bg-[#1e1a17] p-3.5 sm:p-4 rounded-xl border border-amber-200/50 dark:border-amber-900/40">
                            <div className="flex items-center gap-3 text-right">
                              <div className="w-9 h-9 bg-amber-700 rounded-xl flex items-center justify-center text-white text-sm font-bold tabular-nums shrink-0">
                                {searchResult.data.surah.id}
                              </div>
                              <div>
                                <h3 className="text-lg sm:text-xl font-bold text-amber-950 dark:text-amber-50 font-quran">
                                  {getSurahDisplayName(searchResult.data.surah.name)}
                                </h3>
                                <p className="text-xs font-medium text-amber-800/75 dark:text-amber-200/75 tabular-nums">
                                  آية {searchResult.data.ayah.id} · {searchResult.data.surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} · {searchResult.data.surah.verses.length} آية
                                </p>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                playbackModeRef.current = 'single'; 
                                playRealRecitation(searchResult.data.surah.id, searchResult.data.ayah.id, searchResult.data.ayah.id === 1); 
                                setAIContext(getEnrichedAIContext(searchResult.data.surah, searchResult.data.ayah));
                                logAIEvent(`البحث عن آية في ${getSurahDisplayName(searchResult.data.surah.name)}`, '🔍');
                              }}
                              className="w-full sm:w-auto h-8 px-4 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shrink-0"
                            >
                              <Play size={14} fill="currentColor" />
                              <span>استماع للآية</span>
                            </button>
                          </div>

                          {searchResult.data.ayah.id === 1 && searchResult.data.surah.id !== 9 && (
                            <div className="text-center py-3 bg-amber-50/40 dark:bg-[#1e1a17]/50 rounded-xl border border-amber-100 dark:border-amber-900/30">
                              <p className="font-quran text-xl sm:text-2xl text-amber-900/80 dark:text-amber-100/80">
                                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                              </p>
                            </div>
                          )}

                          <div 
                            className={`p-4 sm:p-6 rounded-xl border transition-colors ${isPlaying && (activeAyah?.ayah === searchResult.data.ayah.id || (activeAyah?.ayah === 0 && searchResult.data.ayah.id === 1)) ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600' : 'bg-white dark:bg-[#1c1815] border-amber-200/60 dark:border-amber-900/40'}`}
                          >
                            <div className="flex items-center justify-end gap-1 mb-2.5 pb-2 border-b border-amber-100/70 dark:border-amber-900/30">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(searchResult.data.ayah.text);
                                }}
                                className="w-7 h-7 rounded-lg bg-amber-50/80 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 hover:bg-amber-100 flex items-center justify-center transition-colors"
                                title="نسخ الآية"
                              >
                                <Copy size={13} />
                              </button>
                              {navigator.share && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.share({
                                      title: `${getSurahDisplayName(searchResult.data.surah.name)} - آية ${searchResult.data.ayah.id}`,
                                      text: `${searchResult.data.ayah.text}\n[${getSurahDisplayName(searchResult.data.surah.name)} - آية ${searchResult.data.ayah.id}]`,
                                    }).catch(console.error);
                                  }}
                                  className="w-7 h-7 rounded-lg bg-amber-50/80 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 hover:bg-amber-100 flex items-center justify-center transition-colors"
                                  title="مشاركة الآية"
                                >
                                  <Share2 size={13} />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const isBookmarked = bookmarks.some(b => b.surah === searchResult.data.surah.id && b.ayah === searchResult.data.ayah.id);
                                  if (isBookmarked) {
                                    setBookmarks(prev => prev.filter(b => !(b.surah === searchResult.data.surah.id && b.ayah === searchResult.data.ayah.id)));
                                  } else {
                                    setBookmarks(prev => [...prev, {
                                      surah: searchResult.data.surah.id,
                                      ayah: searchResult.data.ayah.id,
                                      text: searchResult.data.ayah.text,
                                      surahName: searchResult.data.surah.name
                                    }]);
                                  }
                                }}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                  bookmarks.some(b => b.surah === searchResult.data.surah.id && b.ayah === searchResult.data.ayah.id)
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-amber-50/80 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 hover:bg-amber-100'
                                }`}
                                title={bookmarks.some(b => b.surah === searchResult.data.surah.id && b.ayah === searchResult.data.ayah.id) ? "إزالة من المحفوظات" : "حفظ الآية"}
                              >
                                <Star size={13} className={bookmarks.some(b => b.surah === searchResult.data.surah.id && b.ayah === searchResult.data.ayah.id) ? "fill-current" : ""} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAIContext(getEnrichedAIContext(searchResult.data.surah, searchResult.data.ayah));
                                  logAIEvent(`طلب مساعدة ذكية للآية ${searchResult.data.ayah.id} من سورة ${searchResult.data.surah.name}`, '✨');
                                  setShowAIHub(true);
                                }}
                                className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-200 hover:bg-sky-100 flex items-center justify-center transition-colors"
                                title="اسأل الذكاء الاصطناعي"
                              >
                                <Sparkles size={13} />
                              </button>
                            </div>

                            {searchResult.contextVerses ? (
                              <div className="text-right font-quran text-amber-950 dark:text-amber-50" style={{ fontSize: `${fontSize * 1.6}px`, lineHeight: '2.35' }} dir="rtl">
                                {searchResult.contextVerses.map((v: any) => (
                                  <span key={v.id} className={v.id === searchResult.data.ayah.id ? "text-amber-900 dark:text-amber-100 font-bold" : "opacity-55 hover:opacity-100 transition-opacity"}>
                                    <TajweedText text={v.text} isTajweed={isTajweed} />
                                    <span className={`inline-flex items-center justify-center w-7 h-7 mx-1.5 text-xs border rounded-full tabular-nums ${v.id === searchResult.data.ayah.id ? 'border-amber-600 bg-amber-600 text-white' : 'border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'}`}>
                                      {v.id}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-right font-quran text-amber-950 dark:text-amber-50" style={{ fontSize: `${fontSize * 1.8}px`, lineHeight: '2.4' }} dir="rtl">
                                <TajweedText text={searchResult.data.ayah.text} isTajweed={isTajweed} />
                                <span className="inline-flex items-center justify-center w-8 h-8 mx-2 text-xs border-2 border-amber-500/70 rounded-full text-amber-800 dark:text-amber-200 font-bold bg-amber-50 dark:bg-amber-900/40 tabular-nums">
                                  {searchResult.data.ayah.id}
                                </span>
                              </p>
                            )}
                          </div>

                          {/* Translation Section */}
                          {selectedTranslation !== 'none' && searchResult.metadata?.translation && (
                            <div className="p-3.5 sm:p-4 rounded-xl bg-sky-50/60 dark:bg-sky-950/25 border border-sky-200/60 dark:border-sky-800/40">
                              <div className="flex items-center justify-between mb-1.5">
                                <h4 className="text-xs font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                                  <BookOpen size={13} />
                                  <span>الترجمة</span>
                                </h4>
                                <div className="flex items-center gap-1">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(searchResult.metadata?.translation || "");
                                    }}
                                    className="w-7 h-7 rounded-lg bg-white dark:bg-sky-900/40 text-sky-700 dark:text-sky-200 flex items-center justify-center"
                                    title="نسخ الترجمة"
                                  >
                                    <Copy size={13} />
                                  </button>
                                  <ReadAloud 
                                    text={searchResult.metadata?.translation || ""} 
                                    lang="en-US" 
                                    buttonClassName="w-7 h-7 rounded-lg bg-white dark:bg-sky-900/40 text-sky-700 dark:text-sky-200 flex items-center justify-center"
                                  />
                                </div>
                              </div>
                              <p className="font-sans text-xs sm:text-sm text-sky-950 dark:text-sky-50 leading-relaxed text-left" dir="ltr">
                                {searchResult.metadata?.translation || ""}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {searchResult.type === 'text' && searchResult.text && (
                        <div className="bg-amber-50/40 dark:bg-[#1e1a17] p-4 sm:p-6 rounded-xl border border-amber-200/50 dark:border-amber-900/40">
                          <div className="space-y-3 text-right font-quran text-amber-950 dark:text-amber-50" style={{ fontSize: `${fontSize * 1.6}px`, lineHeight: '2.25' }} dir="rtl">
                            {searchResult.text.split('\n').map((line, lIdx) => (
                              <p key={lIdx} className="leading-relaxed">
                                <TajweedText text={line} isTajweed={isTajweed} />
                              </p>
                            ))}
                          </div>
                          <div className="mt-3 pt-2.5 border-t border-amber-200/50 dark:border-amber-900/30 text-center">
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                              نص مصحح ومدقق لغوياً
                            </span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
          ) : viewMode === 'browse' ? (
              <motion.div key="browse" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
                {!selectedSurah ? (
                  <div className="space-y-5">
                    {/* Surah Search Header */}
                    <div className="bg-white/95 dark:bg-[#171412]/95 p-4 sm:p-5 rounded-2xl border border-amber-200/50 dark:border-amber-900/40 shadow-sm">
                      <div className="relative max-w-xl mx-auto">
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-600/70 dark:text-amber-400/70 pointer-events-none">
                          <Search size={18} />
                        </div>
                        <label htmlFor="surah-search-input" className="sr-only">البحث عن سورة</label>
                        <input 
                          id="surah-search-input"
                          type="text" 
                          placeholder="ابحث عن سورة بالاسم أو الرقم..." 
                          value={surahSearch}
                          onChange={(e) => setSurahSearch(e.target.value)}
                          className="w-full h-11 pr-10 pl-10 bg-amber-50/50 dark:bg-[#141210] rounded-xl border border-amber-200/70 dark:border-amber-800/60 text-sm sm:text-base text-amber-950 dark:text-amber-50 font-bold text-right focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none placeholder:text-amber-900/40 dark:placeholder:text-amber-100/35"
                          dir="rtl"
                          lang="ar"
                        />
                        {surahSearch && (
                          <button 
                            onClick={() => setSurahSearch('')}
                            aria-label="مسح البحث"
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600/70 hover:text-amber-800 dark:text-amber-400/70"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Natural Responsive Surah Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {filteredSurahs.map((surah) => (
                        <button
                          key={surah.id}
                          onClick={() => handleSurahSelect(surah)}
                          className="p-4 bg-white/95 dark:bg-[#171412]/95 hover:bg-amber-50/70 dark:hover:bg-[#1e1a17] rounded-2xl shadow-sm border border-amber-200/50 dark:border-amber-900/40 hover:border-amber-300 dark:hover:border-amber-700 text-right flex items-center justify-between gap-3 transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-amber-100/80 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 flex items-center justify-center text-sm font-bold tabular-nums shrink-0 border border-amber-200/50 dark:border-amber-800/40">
                              {surah.id}
                            </div>
                            <div className="min-w-0">
                              <div className="text-base sm:text-lg font-kufi font-bold text-amber-950 dark:text-amber-50 truncate group-hover:text-amber-700 dark:group-hover:text-amber-300">
                                {surah.name}
                              </div>
                              <div className="text-xs text-amber-800/65 dark:text-amber-300/60 tabular-nums">
                                {surah.total_verses} آية
                              </div>
                            </div>
                          </div>
                          <ChevronLeft size={16} className="text-amber-600/50 group-hover:text-amber-700 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Structured Surah Reader Toolbar */}
                    <div className="bg-white/95 dark:bg-[#171412]/95 p-4 sm:p-5 rounded-2xl shadow-sm border border-amber-200/60 dark:border-amber-900/40 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-100 dark:border-amber-900/30">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button 
                            onClick={(e) => { 
                              e.preventDefault();
                              try { stopRecitation(); } catch (err) { console.error(err); }
                              localStorage.removeItem('quran_selectedSurahId');
                              setSelectedSurah(null); 
                            }} 
                            className="h-8 px-3 bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition-colors font-bold text-xs inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                          >
                            <ChevronRight size={14} />
                            <span>السور</span>
                          </button>
                          
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              if (isPlaying && playbackModeRef.current === 'continuous') {
                                stopRecitation();
                              } else {
                                playbackModeRef.current = 'continuous';
                                playRealRecitation(selectedSurah.id, 1, true);
                              }
                            }} 
                            className={`h-8 px-3 rounded-lg transition-colors font-bold text-xs inline-flex items-center gap-1 whitespace-nowrap shrink-0 ${isPlaying && playbackModeRef.current === 'continuous' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                          >
                            {isPlaying && playbackModeRef.current === 'continuous' ? <Square fill="currentColor" size={12} /> : <Play fill="currentColor" size={12} />}
                            <span>{isPlaying && playbackModeRef.current === 'continuous' ? 'إيقاف' : 'تشغيل السورة'}</span>
                          </button>
                          
                          {navigator.share && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                navigator.share({
                                  title: `${getSurahDisplayName(selectedSurah.name)}`,
                                  text: `اقرأ واستمع إلى ${getSurahDisplayName(selectedSurah.name)} من القرآن الكريم.`,
                                  url: window.location.href,
                                }).catch(console.error);
                              }}
                              className="w-8 h-8 bg-sky-50 dark:bg-sky-900/30 hover:bg-sky-100 text-sky-700 dark:text-sky-200 rounded-lg transition-colors flex items-center justify-center shrink-0"
                              title="مشاركة السورة"
                            >
                              <Share2 size={14} />
                            </button>
                          )}
                        </div>

                        <div id="surah-header" className="text-right sm:text-center flex-1">
                          <h2 className="text-xl sm:text-2xl font-bold text-amber-950 dark:text-amber-50 font-quran">{selectedSurah.name}</h2>
                          <p className="text-[11px] font-medium text-amber-800/75 dark:text-amber-200/70 tabular-nums">
                            {selectedSurah.type === 'Meccan' ? 'مكية' : 'مدنية'} · {selectedSurah.total_verses} آية · {QIRAAT.find(q => q.id === selectedQiraat)?.name}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 justify-end">
                          <SmartActionButton onClick={() => setShowAIHub(true)} />
                          <button 
                            onClick={() => setIsExpanded(!isExpanded)} 
                            className="w-7 h-7 rounded-lg bg-amber-50/80 dark:bg-amber-900/25 text-amber-800 dark:text-amber-200 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center transition-colors"
                            title={isExpanded ? "تصغير" : "ملء الشاشة"}
                          >
                            {isExpanded ? <Minimize size={13} /> : <Maximize size={13} />}
                          </button>
                        </div>
                      </div>

                      {/* Controls Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 items-end">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-amber-800 dark:text-amber-300 font-bold">القارئ</label>
                          <select value={selectedReciter} onChange={(e) => setSelectedReciter(e.target.value)} className="h-9 bg-amber-50/40 dark:bg-[#141210] border border-amber-200 dark:border-amber-800/60 rounded-xl px-2.5 text-xs sm:text-sm text-amber-950 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-amber-500/30">
                            {RECITERS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-amber-800 dark:text-amber-300 font-bold">التفسير</label>
                          <select value={selectedTafsir} onChange={(e) => setSelectedTafsir(e.target.value)} className="h-9 bg-amber-50/40 dark:bg-[#141210] border border-amber-200 dark:border-amber-800/60 rounded-xl px-2.5 text-xs sm:text-sm text-amber-950 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-amber-500/30">
                            <option value="">بدون تفسير</option>
                            {TAFASIR.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-amber-800 dark:text-amber-300 font-bold">الترجمة</label>
                          <select value={selectedTranslation} onChange={(e) => setSelectedTranslation(e.target.value)} className="h-9 bg-amber-50/40 dark:bg-[#141210] border border-amber-200 dark:border-amber-800/60 rounded-xl px-2.5 text-xs sm:text-sm text-amber-950 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-amber-500/30">
                            <option value="none">بدون ترجمة</option>
                            {TRANSLATIONS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-amber-800 dark:text-amber-300 font-bold">القراءة</label>
                          <select value={selectedQiraat} onChange={(e) => setSelectedQiraat(e.target.value)} className="h-9 bg-amber-50/40 dark:bg-[#141210] border border-amber-200 dark:border-amber-800/60 rounded-xl px-2.5 text-xs sm:text-sm text-amber-950 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-amber-500/30">
                            {QIRAAT.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                          </select>
                        </div>
                        <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                          <button 
                            onClick={() => setIsTajweed(!isTajweed)} 
                            className={`flex-1 h-9 px-3 rounded-xl border transition-colors font-bold text-xs sm:text-sm whitespace-nowrap ${isTajweed ? 'bg-amber-700 border-amber-700 text-white' : 'bg-white dark:bg-[#141210] border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200'}`}
                          >
                            تجويد ملون
                          </button>
                          <button 
                            onClick={() => setShowTajweedInfo(true)} 
                            className="w-9 h-9 rounded-xl border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center justify-center bg-white dark:bg-[#141210] shrink-0"
                            title="معلومات التجويد"
                          >
                            <Info size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Reading Sheet */}
                    <div className={`bg-white/95 dark:bg-[#171412]/95 p-5 sm:p-8 md:p-10 rounded-2xl shadow-sm border border-amber-200/60 dark:border-amber-900/40 relative quran-bg ${isExpanded ? 'expanded-view' : ''}`}>
                      <div className="max-w-4xl mx-auto">
                        {/* Basmala */}
                        {currentPage === 1 && Number(selectedSurah.id) !== 9 && (Number(selectedSurah.id) !== 1 || selectedQiraat === 'warsh') && (
                          <div className="text-center mb-8 pb-6 border-b border-amber-100 dark:border-amber-900/30">
                            <p className="text-2xl sm:text-3xl md:text-4xl font-quran text-amber-900 dark:text-amber-200">
                              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                            </p>
                          </div>
                        )}

                        <div 
                          className="font-quran text-amber-950 dark:text-amber-50" 
                          style={{ 
                            fontSize: `${fontSize * 1.95}px`, 
                            lineHeight: selectedTranslation === 'none' ? '2.25' : '2.4',
                            textAlign: selectedTranslation === 'none' ? 'justify' : 'right',
                            textJustify: selectedTranslation === 'none' ? 'inter-word' : 'auto'
                          }} 
                          dir="rtl"
                        >
                          {selectedTranslation === 'none' ? (
                            <div className="leading-loose" style={{ textJustify: 'inter-word' }}>
                              {selectedSurah.verses.slice((currentPage - 1) * VERSES_PER_PAGE, currentPage * VERSES_PER_PAGE).map((ayah) => (
                                <span 
                                  key={ayah.id}
                                  id={`ayah-${ayah.id}`}
                                  onClick={(e) => { 
                                    if (e.detail === 3) {
                                      handleTripleClick(selectedSurah, ayah);
                                    } else {
                                      playbackModeRef.current = 'single'; 
                                      playRealRecitation(selectedSurah.id, ayah.id); 
                                      setAIContext(getEnrichedAIContext(selectedSurah, ayah));
                                      logAIEvent(`الاستماع للآية ${ayah.id} من سورة ${selectedSurah.name}`, '🔊');
                                    }
                                  }}
                                  onContextMenu={(e) => { 
                                    e.preventDefault(); 
                                    setAyahContextMenu({
                                      x: e.clientX,
                                      y: e.clientY,
                                      visible: true,
                                      surahId: selectedSurah.id,
                                      ayahId: ayah.id,
                                      text: ayah.text
                                    });
                                  }}
                                  onTouchStart={(e) => {
                                    const touch = e.touches[0];
                                    const timer = setTimeout(() => {
                                      setAyahContextMenu({
                                        x: touch.clientX,
                                        y: touch.clientY,
                                        visible: true,
                                        surahId: selectedSurah.id,
                                        ayahId: ayah.id,
                                        text: ayah.text
                                      });
                                    }, 600);
                                    (e.currentTarget as any)._longPressTimer = timer;
                                  }}
                                  onTouchEnd={(e) => clearTimeout((e.currentTarget as any)._longPressTimer)}
                                  onTouchMove={(e) => clearTimeout((e.currentTarget as any)._longPressTimer)}
                                  className={`cursor-pointer transition-colors duration-200 ${activeAyah?.surah === selectedSurah.id && (activeAyah?.ayah === ayah.id || (activeAyah?.ayah === 0 && ayah.id === 1)) ? 'text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-900/40 rounded-lg px-1' : 'hover:text-amber-700 dark:hover:text-amber-300'}`}
                                >
                                  <TajweedText text={ayah.text} isTajweed={isTajweed} />
                                  <span className="inline-flex items-center justify-center mx-1.5 text-[0.42em] border border-amber-600/50 rounded-full text-amber-800/80 dark:text-amber-300/80 font-bold bg-amber-50/70 dark:bg-amber-900/25 tabular-nums" style={{ width: '2em', height: '2em', transform: 'translateY(-0.15em)' }}>
                                    {ayah.id}
                                  </span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-4">
                              {selectedSurah.verses.slice((currentPage - 1) * VERSES_PER_PAGE, currentPage * VERSES_PER_PAGE).map((ayah) => (
                                <div 
                                  key={ayah.id}
                                  id={`ayah-${ayah.id}`}
                                  onClick={(e) => { 
                                    if (e.detail === 3) {
                                      handleTripleClick(selectedSurah, ayah);
                                    } else {
                                      playbackModeRef.current = 'single'; 
                                      playRealRecitation(selectedSurah.id, ayah.id); 
                                      setAIContext(getEnrichedAIContext(selectedSurah, ayah));
                                      logAIEvent(`الاستماع للآية ${ayah.id} من سورة ${selectedSurah.name}`, '🔊');
                                    }
                                  }}
                                  onContextMenu={(e) => { 
                                    e.preventDefault(); 
                                    setAyahContextMenu({
                                      x: e.clientX,
                                      y: e.clientY,
                                      visible: true,
                                      surahId: selectedSurah.id,
                                      ayahId: ayah.id,
                                      text: ayah.text
                                    });
                                  }}
                                  onTouchStart={(e) => {
                                    const touch = e.touches[0];
                                    const timer = setTimeout(() => {
                                      setAyahContextMenu({
                                        x: touch.clientX,
                                        y: touch.clientY,
                                        visible: true,
                                        surahId: selectedSurah.id,
                                        ayahId: ayah.id,
                                        text: ayah.text
                                      });
                                    }, 600);
                                    (e.currentTarget as any)._longPressTimer = timer;
                                  }}
                                  onTouchEnd={(e) => clearTimeout((e.currentTarget as any)._longPressTimer)}
                                  onTouchMove={(e) => clearTimeout((e.currentTarget as any)._longPressTimer)}
                                  className={`group cursor-pointer p-4 sm:p-5 rounded-2xl border transition-colors ${activeAyah?.surah === selectedSurah.id && (activeAyah?.ayah === ayah.id || (activeAyah?.ayah === 0 && ayah.id === 1)) ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600' : 'bg-amber-50/20 dark:bg-[#1c1815] border-amber-100 dark:border-amber-900/30 hover:border-amber-300 dark:hover:border-amber-700'}`}
                                >
                                  <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-amber-100/70 dark:border-amber-900/25">
                                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300 font-kufi tabular-nums">آية {ayah.id}</span>
                                      <div className="flex items-center gap-1 flex-wrap">
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); analyzeQiraat(selectedSurah.id, ayah.id, ayah.text); }}
                                          className="w-7 h-7 rounded-lg bg-amber-50/80 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 hover:bg-amber-100 flex items-center justify-center transition-colors"
                                          title="تحليل القراءات"
                                        >
                                          <BookOpen size={13} />
                                        </button>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleTafsirSelect(selectedTafsir, selectedSurah.id, ayah.id); }}
                                          className="w-7 h-7 rounded-lg bg-amber-50/80 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 hover:bg-amber-100 flex items-center justify-center transition-colors"
                                          title="تفسير"
                                        >
                                          <Info size={13} />
                                        </button>
                                        <ReadAloud text={ayah.text} />
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(ayah.text); }}
                                          className="w-7 h-7 rounded-lg bg-amber-50/80 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 hover:bg-amber-100 flex items-center justify-center transition-colors"
                                          title="نسخ الآية"
                                        >
                                          <Copy size={13} />
                                        </button>
                                        {navigator.share && (
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              navigator.share({
                                                title: `${getSurahDisplayName(selectedSurah.name)} - آية ${ayah.id}`,
                                                text: `${ayah.text}\n[${getSurahDisplayName(selectedSurah.name)} - آية ${ayah.id}]`,
                                              }).catch(console.error);
                                            }}
                                            className="w-7 h-7 rounded-lg bg-amber-50/80 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 hover:bg-amber-100 flex items-center justify-center transition-colors"
                                            title="مشاركة الآية"
                                          >
                                            <Share2 size={13} />
                                          </button>
                                        )}
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const isBookmarked = bookmarks.some(b => b.surah === selectedSurah.id && b.ayah === ayah.id);
                                            if (isBookmarked) {
                                              setBookmarks(prev => prev.filter(b => !(b.surah === selectedSurah.id && b.ayah === ayah.id)));
                                            } else {
                                              setBookmarks(prev => [...prev, { surah: selectedSurah.id, ayah: ayah.id, text: ayah.text, surahName: selectedSurah.name }]);
                                            }
                                          }}
                                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${bookmarks.some(b => b.surah === selectedSurah.id && b.ayah === ayah.id) ? 'bg-amber-600 text-white' : 'bg-amber-50/80 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 hover:bg-amber-100'}`}
                                          title="حفظ الآية"
                                        >
                                          <Star size={13} fill={bookmarks.some(b => b.surah === selectedSurah.id && b.ayah === ayah.id) ? 'currentColor' : 'none'} />
                                        </button>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setAIContext(getEnrichedAIContext(selectedSurah, ayah));
                                            logAIEvent(`طلب مساعدة ذكية للآية ${ayah.id} من سورة ${selectedSurah.name}`, '✨');
                                            setShowAIHub(true);
                                          }}
                                          className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-200 hover:bg-sky-100 flex items-center justify-center transition-colors"
                                          title="اسأل الذكاء الاصطناعي"
                                        >
                                          <Sparkles size={13} />
                                        </button>
                                      </div>
                                    </div>

                                    <div className="text-right leading-[2.4]">
                                      <TajweedText text={ayah.text} isTajweed={isTajweed} />
                                      <span className="inline-flex items-center justify-center w-8 h-8 mx-2 text-xs border border-amber-500/70 rounded-full text-amber-800 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-900/30 tabular-nums">
                                        {ayah.id}
                                      </span>
                                    </div>

                                    {selectedTranslation !== 'none' && translationsData[ayah.id] && (
                                      <div className={`text-left ${fontFamily} text-sm sm:text-base text-amber-900/80 dark:text-amber-100/75 leading-relaxed p-3.5 bg-amber-50/60 dark:bg-[#141210]/70 rounded-xl border border-amber-200/40 dark:border-amber-900/30 flex items-start justify-between gap-2`}>
                                        <span className="flex-1" dir="ltr">{translationsData[ayah.id]}</span>
                                        <div className="flex gap-1 shrink-0">
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(translationsData[ayah.id]); }}
                                            className="w-7 h-7 rounded-lg bg-white dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center"
                                            title="نسخ الترجمة"
                                          >
                                            <Copy size={13} />
                                          </button>
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); isSpeaking ? stopSpeaking() : speakText(translationsData[ayah.id]); }}
                                            className="w-7 h-7 rounded-lg bg-white dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center"
                                            title="قراءة الترجمة"
                                          >
                                            {isSpeaking ? <Square size={13} className="text-red-600" /> : <Volume2 size={13} />}
                                          </button>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setAIContext(getEnrichedAIContext(selectedSurah, ayah));
                                              logAIEvent(`طلب مساعدة ذكية للآية ${ayah.id} من ${getSurahDisplayName(selectedSurah.name)}`, '✨');
                                              setShowAIHub(true);
                                            }}
                                            className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-900/40 text-sky-700 dark:text-sky-200 flex items-center justify-center"
                                            title="اسأل الذكاء الاصطناعي"
                                          >
                                            <Sparkles size={13} />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Pagination Controls */}
                        {selectedSurah.verses.length > VERSES_PER_PAGE && (
                          <div className="flex justify-center items-center gap-3 mt-8 pt-6 border-t border-amber-100 dark:border-amber-900/30" dir="rtl">
                            <button
                              onClick={() => {
                                setCurrentPage(p => Math.min(Math.ceil(selectedSurah.verses.length / VERSES_PER_PAGE), p + 1));
                                document.getElementById('surah-header')?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              disabled={currentPage === Math.ceil(selectedSurah.verses.length / VERSES_PER_PAGE)}
                              className="h-9 flex items-center gap-1.5 px-4 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 disabled:opacity-45 hover:bg-amber-200 transition-colors font-bold text-xs sm:text-sm"
                            >
                              <span>التالي</span>
                              <ChevronLeft size={16} />
                            </button>
                            
                            <span className="text-xs sm:text-sm text-amber-900 dark:text-amber-100 font-bold bg-amber-50 dark:bg-amber-900/20 px-3.5 py-1.5 rounded-xl border border-amber-200/60 dark:border-amber-800/40 tabular-nums">
                              {currentPage} / {Math.ceil(selectedSurah.verses.length / VERSES_PER_PAGE)}
                            </span>

                            <button
                              onClick={() => {
                                setCurrentPage(p => Math.max(1, p - 1));
                                document.getElementById('surah-header')?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              disabled={currentPage === 1}
                              className="h-9 flex items-center gap-1.5 px-4 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 disabled:opacity-45 hover:bg-amber-200 transition-colors font-bold text-xs sm:text-sm"
                            >
                              <ChevronRight size={16} />
                              <span>السابق</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : viewMode === 'duas' ? (
              <motion.div key="duas" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <DuaSection speakText={speakText} stopSpeaking={stopSpeaking} isSpeaking={isSpeaking} />
              </motion.div>
            ) : viewMode === 'qibla' ? (
              <motion.div key="qibla" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <QiblaSection />
              </motion.div>
            ) : viewMode === 'tasbih' ? (
              <motion.div key="tasbih" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <TasbihSection />
              </motion.div>
            ) : viewMode === 'bookmarks' ? (
              <motion.div key="bookmarks" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <div className="space-y-5 max-w-4xl mx-auto">
                  <div className="bg-white/95 dark:bg-[#171412]/95 rounded-2xl border border-amber-200/50 dark:border-amber-900/40 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-amber-950 dark:text-amber-50 font-kufi">الآيات المحفوظة</h2>
                      <p className="text-xs sm:text-sm text-amber-800/70 dark:text-amber-200/65 mt-0.5">الآيات التي قمت بحفظها للرجوع إليها سريعاً</p>
                    </div>
                    {bookmarks.length > 0 && (
                      <div className="flex items-center gap-2">
                        {navigator.share && (
                          <button
                            onClick={() => {
                              const text = bookmarks.map(b => `${b.text}\n[${getSurahDisplayName(b.surahName)} - آية ${b.ayah}]`).join('\n\n');
                              navigator.share({
                                title: 'آياتي المحفوظة',
                                text: text,
                              }).catch(console.error);
                            }}
                            className="h-9 px-3.5 rounded-xl bg-amber-100/80 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 hover:bg-amber-200/70 transition-colors inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold whitespace-nowrap"
                          >
                            <Share2 size={15} />
                            <span>مشاركة الكل</span>
                          </button>
                        )}
                        <button
                          onClick={() => setBookmarks([])}
                          className="h-9 px-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200/60 dark:border-red-900/40 hover:bg-red-100 transition-colors inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold whitespace-nowrap"
                        >
                          <X size={15} />
                          <span>مسح الكل</span>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {bookmarks.length === 0 ? (
                    <div className="bg-white/95 dark:bg-[#171412]/95 p-10 rounded-2xl shadow-sm border border-amber-200/50 dark:border-amber-900/40 text-center">
                      <Star size={36} className="mx-auto text-amber-400 dark:text-amber-500 mb-3" />
                      <h3 className="text-lg font-bold text-amber-950 dark:text-amber-100 mb-1">لا توجد آيات محفوظة بعد</h3>
                      <p className="text-sm text-amber-800/70 dark:text-amber-300/65">اضغط على أيقونة النجمة بجانب أي آية لحفظها هنا.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3.5">
                      {bookmarks.map((bookmark, index) => (
                        <div 
                          key={`${bookmark.surah}-${bookmark.ayah}-${index}`}
                          className="bg-white/95 dark:bg-[#171412]/95 p-5 rounded-2xl shadow-sm border border-amber-200/50 dark:border-amber-900/40"
                        >
                          <div className="flex justify-between items-center pb-3 mb-3 border-b border-amber-100/70 dark:border-amber-900/30">
                            <span className="text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5 font-kufi tabular-nums">
                              <BookOpen size={15} className="text-amber-600 dark:text-amber-400" />
                              {getSurahDisplayName(bookmark.surahName)} · آية {bookmark.ayah}
                            </span>
                            <button 
                              onClick={() => setBookmarks(prev => prev.filter(b => !(b.surah === bookmark.surah && b.ayah === bookmark.ayah)))}
                              className="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="إزالة من المحفوظات"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          
                          <div className="text-right font-quran text-xl sm:text-2xl leading-[2.2] text-amber-950 dark:text-amber-50 mb-4">
                            <TajweedText text={bookmark.text} isTajweed={isTajweed} />
                          </div>
                          
                          <div className="flex gap-1 justify-end pt-2.5 border-t border-amber-100/70 dark:border-amber-900/30">
                            <ReadAloud 
                              text={bookmark.text} 
                            />
                            <button
                              onClick={() => {
                                const surahObj = quranData?.find(s => s.id === bookmark.surah);
                                if (surahObj) {
                                  setSelectedSurah(surahObj);
                                  setCurrentPage(Math.ceil(bookmark.ayah / VERSES_PER_PAGE));
                                  setViewMode('browse');
                                  setTimeout(() => {
                                    const element = document.getElementById(`ayah-${bookmark.ayah}`);
                                    if (element) {
                                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                      element.classList.add('bg-amber-100', 'dark:bg-amber-900/40');
                                      setTimeout(() => element.classList.remove('bg-amber-100', 'dark:bg-amber-900/40'), 2000);
                                    }
                                  }, 100);
                                }
                              }}
                              className="w-7 h-7 rounded-lg bg-amber-50/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 flex items-center justify-center transition-colors"
                              title="الذهاب للآية"
                            >
                              <Navigation size={13} />
                            </button>
                            <button 
                              onClick={() => navigator.clipboard.writeText(bookmark.text)}
                              className="w-7 h-7 rounded-lg bg-amber-50/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 flex items-center justify-center transition-colors"
                              title="نسخ الآية"
                            >
                              <Copy size={13} />
                            </button>
                            {navigator.share && (
                              <button 
                                onClick={() => {
                                  navigator.share({
                                    title: `${getSurahDisplayName(bookmark.surahName)} - آية ${bookmark.ayah}`,
                                    text: `${bookmark.text}\n[${getSurahDisplayName(bookmark.surahName)} - آية ${bookmark.ayah}]`,
                                  }).catch(console.error);
                                }}
                                className="w-7 h-7 rounded-lg bg-amber-50/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 flex items-center justify-center transition-colors"
                                title="مشاركة الآية"
                              >
                                <Share2 size={13} />
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                setAIContext({ surah: bookmark.surahName, ayah: bookmark.ayah, text: bookmark.text });
                                logAIEvent(`طلب مساعدة ذكية للآية ${bookmark.ayah} من ${getSurahDisplayName(bookmark.surahName)}`, '✨');
                                setShowAIHub(true);
                              }}
                              className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-200 hover:bg-sky-100 flex items-center justify-center transition-colors"
                              title="مساعدة ذكية"
                            >
                              <Sparkles size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : viewMode === 'calendar' ? (
              <motion.div key="calendar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <Suspense fallback={null}>
                  <IslamicCalendar />
                </Suspense>
              </motion.div>
            ) : viewMode === 'ai-chat' ? (
              <div key="ai-chat" className="hidden" />
            ) : null}
          </AnimatePresence>
        </main>

        {/* Full-Screen Smart Assistant */}
        {viewMode === 'ai-chat' && (
          <Suspense fallback={null}>
            <AIHub 
              isOpen={true} 
              onClose={() => setViewMode('search')} 
              provider={provider} 
              currentContext={aiContext}
              isFullScreen={true}
              onAction={handleAIAction}
              selectedVoice={selectedVoice}
              viewMode={viewMode}
              lastSearchedText={lastSearchedText}
              selectedReciter={selectedReciter}
              selectedQiraat={selectedQiraat}
              selectedTafsir={selectedTafsir}
              selectedTranslation={selectedTranslation}
            />
          </Suspense>
        )}

        {/* Midad Al-Rahman - Moved to end for better stacking context */}
        <AnimatePresence>
          {showMidadAlRahman && (
            <Suspense fallback={null}>
              <MidadAlRahman 
                onClose={() => setShowMidadAlRahman(false)} 
                selectedVoice={selectedVoice} 
                aiRecitationSettings={aiRecitationSettings}
                onToolCall={handleToolCall}
              />
            </Suspense>
          )}
        </AnimatePresence>

        {/* Hidden Audio Element - Must remain in DOM */}
        <audio ref={audioRef} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} className="hidden" />

        {/* Global Audio Bar */}
        <PlaybackControls
          isPlaying={isPlaying}
          activeAyah={activeAyah}
          quranData={quranData}
          audioProgress={audioProgress}
          currentAudioData={currentAudioData}
          currentMimeType={currentMimeType}
          togglePlayPause={togglePlayPause}
          stopRecitation={stopRecitation}
          skipForward={skipForward}
          skipBackward={skipBackward}
        />

        {/* Status Toasts */}
        <AnimatePresence>
          {status && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-[#171412]/95 text-sky-800 dark:text-sky-200 px-5 py-3 rounded-2xl shadow-xl border border-sky-200/70 dark:border-sky-900/50 backdrop-blur-md text-center z-[110] flex items-center gap-3 max-w-[92vw]"
            >
              <Sparkles className="text-sky-600 dark:text-sky-400 shrink-0" size={18} />
              <span className="text-sm font-bold">{status}</span>
              <button
                onClick={() => setStatus('')}
                className="w-7 h-7 flex items-center justify-center hover:bg-sky-100 dark:hover:bg-sky-900/40 rounded-lg transition-colors shrink-0"
                aria-label="إغلاق التنبيه"
              >
                <X size={15} />
              </button>
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-[#171412]/95 text-red-700 dark:text-red-300 px-5 py-3.5 rounded-2xl shadow-xl border border-red-200/80 dark:border-red-900/50 backdrop-blur-md text-center z-[110] flex flex-col items-center gap-2.5 max-w-[92vw]"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold">{error}</span>
                <button
                  onClick={() => setError('')}
                  className="w-7 h-7 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors shrink-0"
                  aria-label="إغلاق الخطأ"
                >
                  <X size={15} />
                </button>
              </div>
              {(typeof error === 'string' && (error.includes('تجاوز الحد') || error.includes('مفتاح API'))) && (
                <button 
                  onClick={() => {
                    setShowSettings(true);
                    setError('');
                  }}
                  className="h-9 flex items-center gap-2 px-4 bg-amber-700 text-white rounded-xl text-xs font-bold hover:bg-amber-800 transition-colors"
                >
                  <Settings2 size={15} />
                  فتح الإعدادات لإضافة مفتاحك الخاص
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Hub Component */}
        <Suspense fallback={null}>
          <AIHub 
            isOpen={showAIHub} 
            onClose={() => {
              setShowAIHub(false);
              setAiHubInitialInput('');
            }} 
            currentContext={aiContext}
            provider={provider}
            onAction={handleAIAction}
            selectedVoice={selectedVoice}
            viewMode={viewMode}
            lastSearchedText={lastSearchedText}
            selectedReciter={selectedReciter}
            selectedQiraat={selectedQiraat}
            selectedTafsir={selectedTafsir}
            selectedTranslation={selectedTranslation}
            initialInput={aiHubInitialInput}
          />
        </Suspense>

        {/* User Guide Modal */}
        <Suspense fallback={null}>
          <UserGuide show={showUserGuide} onClose={() => setShowUserGuide(false)} />
        </Suspense>

        {/* Qiraat Info Modal */}
        <AnimatePresence>
          {isAnalyzingQiraat && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4"
            >
              <div className="bg-white dark:bg-[#171412] px-7 py-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3.5 border border-amber-200/60 dark:border-amber-900/50">
                <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-base font-bold text-amber-950 dark:text-amber-100">جاري تحليل القراءات العشر...</p>
              </div>
            </motion.div>
          )}
          {showQiraatInfo && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowQiraatInfo(null)}
            >
              <motion.div 
                initial={{ scale: 0.96, y: 12, opacity: 0 }} 
                animate={{ scale: 1, y: 0, opacity: 1 }} 
                exit={{ scale: 0.96, y: 12, opacity: 0 }}
                className="bg-white dark:bg-[#171412] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl border border-amber-200/60 dark:border-amber-900/50 flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-5 py-4 border-b border-amber-200/50 dark:border-amber-900/40 flex justify-between items-center bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-xl flex items-center justify-center shrink-0">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-amber-950 dark:text-amber-100">اختلاف القراءات العشر</h2>
                      <p className="text-xs text-amber-800/70 dark:text-amber-200/70 tabular-nums">{selectedSurah?.name} - آية {showQiraatInfo.ayah}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowQiraatInfo(null)}
                    className="w-9 h-9 flex items-center justify-center hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-xl transition-colors text-amber-800 dark:text-amber-200"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar text-right space-y-5" dir="rtl">
                  <div className="p-4 sm:p-5 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200/50 dark:border-amber-900/40 text-center">
                    <p className="text-2xl sm:text-3xl font-quran text-amber-950 dark:text-amber-100 leading-relaxed">
                      {showQiraatInfo.text}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-amber-900 dark:text-amber-200">البيان والتحليل</h3>
                      <button 
                        onClick={() => isSpeaking ? stopSpeaking() : speakText(showQiraatInfo.info)}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${isSpeaking ? 'bg-red-100 dark:bg-red-900/40 text-red-600' : 'bg-amber-100/70 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 hover:bg-amber-200/70'}`}
                        title={isSpeaking ? "إيقاف القراءة" : "قراءة التحليل"}
                      >
                        {isSpeaking ? <Square size={16} /> : <Volume2 size={18} />}
                      </button>
                    </div>
                    <p className="text-base sm:text-lg text-amber-950/90 dark:text-amber-100/90 leading-relaxed whitespace-pre-wrap">
                      {showQiraatInfo.info}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tajweed Info Modal */}
        <AnimatePresence>
          {showTajweedInfo && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm" 
              onClick={() => setShowTajweedInfo(false)}
            >
              <motion.div 
                initial={{ scale: 0.96, y: 12 }} 
                animate={{ scale: 1, y: 0 }} 
                exit={{ scale: 0.96, y: 12 }} 
                className="bg-white dark:bg-[#171412] rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-amber-200/60 dark:border-amber-900/50" 
                onClick={e => e.stopPropagation()} 
                dir="rtl"
              >
                <div className="flex justify-between items-center mb-4 border-b border-amber-200/50 dark:border-amber-900/40 pb-3.5">
                  <h3 className="text-lg font-bold text-amber-950 dark:text-amber-100 font-quran">دليل ألوان التجويد</h3>
                  <button
                    onClick={() => setShowTajweedInfo(false)}
                    className="w-9 h-9 flex items-center justify-center text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors bg-amber-50 dark:bg-amber-900/20 rounded-xl"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="space-y-2.5 max-h-[65vh] overflow-y-auto custom-scrollbar">
                  {TAJWEED_RULES.map(rule => (
                    <div key={rule.id} className="flex items-start gap-3.5 p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-900/30">
                      <div className={`w-4 h-4 mt-1 rounded-md flex-shrink-0 ${rule.class.replace(/text-/g, 'bg-')}`} />
                      <div className="min-w-0">
                        <p className={`font-bold text-base font-quran ${rule.class}`}>{rule.name}</p>
                        <p className="text-xs text-amber-900/75 dark:text-amber-100/70 mt-0.5 leading-relaxed">{rule.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ayah Context Menu */}
        <AnimatePresence>
          {ayahContextMenu && ayahContextMenu.visible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              style={{ 
                position: 'fixed', 
                top: Math.min(Math.max(ayahContextMenu.y, 16), window.innerHeight - 360),
                left: Math.min(Math.max(ayahContextMenu.x, 16), window.innerWidth - 296),
                zIndex: 300 
              }}
              className="bg-white/95 dark:bg-[#171412]/95 backdrop-blur-md border border-amber-200/80 dark:border-amber-900/60 rounded-2xl shadow-2xl overflow-hidden w-[272px]"
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
            >
              {/* Header */}
              <div className="bg-amber-50/70 dark:bg-amber-950/30 px-4 py-3 border-b border-amber-200/50 dark:border-amber-900/40 flex items-center justify-between">
                <span className="text-amber-950 dark:text-amber-100 font-bold text-sm">خيارات الآية</span>
                <button
                  onClick={() => setAyahContextMenu(null)}
                  className="w-7 h-7 flex items-center justify-center hover:bg-amber-200/50 dark:hover:bg-amber-800/50 rounded-lg transition-colors"
                >
                  <X size={15} className="text-amber-800 dark:text-amber-200" />
                </button>
              </div>

              <div className="p-2.5 space-y-1">
                <button
                  onClick={() => {
                    analyzeQiraat(ayahContextMenu.surahId, ayahContextMenu.ayahId, ayahContextMenu.text);
                    setAyahContextMenu(null);
                  }}
                  className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors flex items-center gap-2.5 text-amber-950 dark:text-amber-100 text-sm font-bold"
                >
                  <BookOpen size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>تحليل القراءات</span>
                </button>
                
                <button
                  onClick={() => {
                    setVisionText(ayahContextMenu.text);
                    setAyahContextMenu(null);
                  }}
                  className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors flex items-center gap-2.5 text-emerald-950 dark:text-emerald-100 text-sm font-bold"
                >
                  <ImageIcon size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>رؤية بصرية</span>
                </button>
                
                <div className="h-px bg-amber-200/50 dark:bg-amber-900/40 my-1.5" />
                
                <div className="px-3 py-1 text-xs text-amber-700 dark:text-amber-400 font-bold">التفسير</div>
                
                <div className="max-h-[190px] overflow-y-auto custom-scrollbar space-y-0.5">
                  {TAFASIR.map((tafsir) => (
                    <button
                      key={tafsir.id}
                      onClick={() => handleTafsirSelect(tafsir.id, ayahContextMenu.surahId, ayahContextMenu.ayahId)}
                      className="w-full text-right px-3 py-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/35 transition-colors flex items-center gap-2.5 text-amber-950/90 dark:text-amber-100/90 text-xs font-medium"
                    >
                      {tafsir.id === 'ai.explanation' ? (
                        <Sparkles size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                      ) : (
                        <BookOpen size={14} className="text-amber-500/80 dark:text-amber-400/70 shrink-0" />
                      )}
                      <span className="truncate">{tafsir.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="px-3 py-2 bg-amber-50/50 dark:bg-amber-950/20 border-t border-amber-200/40 dark:border-amber-900/30 text-center">
                <span className="text-[11px] text-amber-900/50 dark:text-amber-100/50 font-quran">مداد الرحمن - المساعد الذكي</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
      )}
      </>
    </ErrorBoundary>
  );
}

export default App;
