export const getSurahDisplayName = (name: string) => {
  if (!name || typeof name !== 'string') return '';
  return name.includes('سورة') || name.includes('سُورَة') ? name : `سورة ${name}`;
};

export const safeLocalStorageGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.error("Failed to read from localStorage:", e);
    return null;
  }
};

export const safeLocalStorageSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.error("Failed to save to localStorage:", e);
    if ((e as any).name === 'QuotaExceededError') {
      try {
        // Try to clear up space by pruning midad_all_chats instead of wiping everything
        const allChatsStr = localStorage.getItem('midad_all_chats');
        if (allChatsStr) {
          const chats = JSON.parse(allChatsStr);
          if (Array.isArray(chats) && chats.length > 5) {
            const pinned = chats.filter((c: any) => c.pinned);
            const unpinned = chats.filter((c: any) => !c.pinned);
            // Keep only pinned chats plus the 3 most recent unpinned chats
            const pruned = [...pinned, ...unpinned.slice(0, 3)].slice(0, 8);
            localStorage.setItem('midad_all_chats', JSON.stringify(pruned));
            
            // Try saving the key again
            localStorage.setItem(key, value);
            return;
          }
        }
      } catch (innerErr) {
        console.error("Failed to prune chats to recover localStorage space:", innerErr);
      }

      // If we still fail, clear only specific non-critical keys
      try {
        const nonCriticalKeys = ['midad_speech_voice', 'midad_custom_instructions'];
        nonCriticalKeys.forEach(k => localStorage.removeItem(k));
        localStorage.setItem(key, value);
        return;
      } catch (innerErr) {}

      // Absolute last resort fallback: do NOT clear everything if we don't have to,
      // but if we must, warn the developer and only clear history keys
      console.warn("localStorage quota exceeded, performing soft clear of history keys only");
      try {
        localStorage.removeItem('midad_alrahman_history');
        localStorage.setItem(key, value);
      } catch (lastErr) {
        console.error("Complete localStorage failure:", lastErr);
      }
    }
  }
};

export const parseAIJson = <T>(text: string, defaultValue: T): T => {
  if (!text) return defaultValue;
  try {
    // Attempt direct parse
    return JSON.parse(text) as T;
  } catch (e) {
    try {
      // Clean up markdown block wrappers and leading/trailing spaces
      let cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      // Sometimes LLMs output additional conversational text before or after the JSON block.
      // Use regex to find the first '{' and the last '}' or first '[' and last ']'
      const objMatch = cleanText.match(/\{[\s\S]*\}/);
      const arrMatch = cleanText.match(/\[[\s\S]*\]/);
      
      if (objMatch && arrMatch) {
         // Determine which one encompasses the other or comes first
         if (objMatch[0].length > arrMatch[0].length) {
            cleanText = objMatch[0];
         } else {
            cleanText = arrMatch[0];
         }
      } else if (objMatch) {
        cleanText = objMatch[0];
      } else if (arrMatch) {
        cleanText = arrMatch[0];
      }

      return JSON.parse(cleanText) as T;
    } catch (innerError) {
      console.warn("Failed to parse AI JSON output:", innerError, "Text was:", text.substring(0, 100));
      return defaultValue;
    }
  }
};

export const SURAH_START_PAGES: Record<number, number> = {
  1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177, 9: 187, 10: 208,
  11: 221, 12: 235, 13: 249, 14: 255, 15: 262, 16: 267, 17: 282, 18: 293, 19: 305, 20: 312,
  21: 322, 22: 332, 23: 342, 24: 350, 25: 359, 26: 367, 27: 377, 28: 385, 29: 396, 30: 404,
  31: 411, 32: 415, 33: 418, 34: 428, 35: 434, 36: 440, 37: 446, 38: 453, 39: 458, 40: 467,
  41: 477, 42: 483, 43: 489, 44: 496, 45: 499, 46: 502, 47: 507, 48: 511, 49: 515, 50: 518,
  51: 520, 52: 523, 53: 526, 54: 528, 55: 531, 56: 534, 57: 537, 58: 542, 59: 545, 60: 549,
  61: 551, 62: 553, 63: 554, 64: 556, 65: 558, 66: 560, 67: 562, 68: 564, 69: 566, 70: 568,
  71: 570, 72: 572, 73: 574, 74: 575, 75: 577, 76: 578, 77: 580, 78: 582, 79: 583, 80: 585,
  81: 586, 82: 587, 83: 587, 84: 589, 85: 590, 86: 591, 87: 591, 88: 592, 89: 593, 90: 594,
  91: 595, 92: 595, 93: 596, 94: 596, 95: 597, 96: 597, 97: 598, 98: 598, 99: 599, 100: 599,
  101: 600, 102: 600, 103: 601, 104: 601, 105: 601, 106: 602, 107: 602, 108: 602, 109: 603, 110: 603,
  111: 603, 112: 604, 113: 604, 114: 604
};

export function getSurahAndAyahFromMadinaPage(pageNum: number, quranData?: any[]): { surahId: number; ayahNum: number } {
  const p = Math.max(1, Math.min(604, pageNum));
  
  let targetSurahId = 1;
  for (let id = 114; id >= 1; id--) {
    if (SURAH_START_PAGES[id] && p >= SURAH_START_PAGES[id]) {
      targetSurahId = id;
      break;
    }
  }

  const startP = SURAH_START_PAGES[targetSurahId];
  const endP = (targetSurahId < 114 && SURAH_START_PAGES[targetSurahId + 1]) ? SURAH_START_PAGES[targetSurahId + 1] - 1 : 604;
  
  const surahObj = quranData ? quranData.find(s => Number(s.id) === targetSurahId) : null;
  const totalVerses = surahObj ? surahObj.verses.length : 100;

  if (p === endP) {
    return { surahId: targetSurahId, ayahNum: totalVerses };
  } else if (p === startP) {
    return { surahId: targetSurahId, ayahNum: 1 };
  } else {
    const totalPagesInSurah = Math.max(1, endP - startP + 1);
    const pageIndexInSurah = p - startP;
    const progress = (pageIndexInSurah + 0.5) / totalPagesInSurah;
    const calculatedAyah = Math.max(1, Math.min(totalVerses, Math.round(progress * totalVerses)));
    return { surahId: targetSurahId, ayahNum: calculatedAyah };
  }
}

export function extractQuranNavigationDetails(text: string): { surah?: string | number; ayah?: number; page?: number; autoPlay?: boolean; isLastPage?: boolean; isLastAyah?: boolean } | null {
  if (!text || typeof text !== 'string') return null;

  const parseArabicNum = (str: string): number => {
    const arabicDigits: Record<string, string> = {
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    };
    const converted = str.replace(/[٠-٩]/g, w => arabicDigits[w] || w);
    return parseInt(converted, 10);
  };

  let page: number | undefined;
  let surah: string | number | undefined;
  let ayah: number | undefined;
  let autoPlay = false;
  let isLastPage = false;
  let isLastAyah = false;

  if (text.includes('تلاوة') || text.includes('تشغيل') || text.includes('استمع') || text.includes('صوت')) {
    autoPlay = true;
  }

  if (text.includes('آخر صفحة') || text.includes('الصفحة الأخيرة') || text.includes('اخر صفحة') || text.includes('اخر صفحه') || text.includes('آخر صفحه')) {
    isLastPage = true;
    if (!page) page = 604;
  }

  if (text.includes('آخر آية') || text.includes('الآية الأخيرة') || text.includes('اخر اية') || text.includes('اخر آية') || text.includes('نهاية السورة')) {
    isLastAyah = true;
  }

  const pageMatch = text.match(/(?:الصفحة|صفحة|ص)\s*(?:رقم\s*)?\(?\s*([٠-٩0-9]+)\s*\)?/i);
  if (pageMatch) {
    page = parseArabicNum(pageMatch[1]);
  }

  const surahsList = ['الفاتحة', 'البقرة', 'آل عمران', 'النساء', 'المائدة', 'الأنعام', 'الأعراف', 'الأنفال', 'التوبة', 'يونس', 'هود', 'يوسف', 'الرعد', 'إبراهيم', 'الحجر', 'النحل', 'الإسراء', 'الكهف', 'مريم', 'طه', 'الأنبياء', 'الحج', 'المؤمنون', 'النور', 'الفرقان', 'الشعراء', 'النمل', 'القصص', 'العنكبوت', 'الروم', 'لقمان', 'السجدة', 'سبأ', 'فاطر', 'يس', 'الصافات', 'ص', 'الزمر', 'غافر', 'فصلت', 'الشورى', 'الزخرف', 'الدخان', 'الجاثية', 'الأحقاف', 'محمد', 'الفتح', 'الحجرات', 'ق', 'الذاريات', 'الطور', 'النجم', 'القمر', 'الرحمن', 'الواقعة', 'الحديد', 'المجادلة', 'الحشر', 'الممتحنة', 'الصف', 'الجمعة', 'المنافقون', 'التغابن', 'الطلاق', 'التحريم', 'الملك', 'القلم', 'الحاقة', 'المعارج', 'نوح', 'الجن', 'المزمل', 'المدثر', 'القيامة', 'الإنسان', 'المرسلات', 'النبأ', 'النازعات', 'عبس', 'التكوير', 'الانفطار', 'المطففين', 'الانشقاق', 'البروج', 'الطارق', 'الأعلى', 'الغاشية', 'الفجر', 'البلد', 'الشمس', 'الليل', 'الضحى', 'الشرح', 'التين', 'العلق', 'القدر', 'البينة', 'الزلزلة', 'العاديات', 'القارعة', 'التكاثر', 'العصر', 'الهمزة', 'الفيل', 'قريش', 'الماعون', 'الكوثر', 'الكافرون', 'النصر', 'المسد', 'الإخلاص', 'الفلق', 'الناس'];

  for (const sName of surahsList) {
    if (text.includes(sName)) {
      surah = sName;
      break;
    }
  }

  if (!surah) {
    const surahMatch = text.match(/سورة\s+([\u0600-\u06FF]+)/i);
    if (surahMatch) {
      surah = surahMatch[1].trim();
    }
  }

  const ayahMatch = text.match(/(?:الآية|آية)\s*\(?\s*([٠-٩0-9]+)\s*\)?/i);
  if (ayahMatch) {
    ayah = parseArabicNum(ayahMatch[1]);
  }

  if (page || surah || ayah || isLastPage || isLastAyah) {
    return { page, surah, ayah, autoPlay, isLastPage, isLastAyah };
  }

  return null;
}

