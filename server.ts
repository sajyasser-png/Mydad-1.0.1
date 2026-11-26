import { GoogleGenAI, Modality, ThinkingLevel, LiveServerMessage } from "@google/genai";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cors from "cors";
import { WebSocketServer } from "ws";
import { Communicate } from '@travisvn/edge-tts';
import jwt from 'jsonwebtoken';

const islamicTools = [{
  functionDeclarations: [
    {
      name: "get_quran_verse",
      description: "جلب آية قرآنية برواية معينة (ورش، حفص، إلخ) مع التجويد",
      parameters: {
        type: "OBJECT",
        properties: {
          verse_key: { type: "STRING", description: "مثلا 1:1" },
          edition: { type: "STRING", description: "الرواية المطلوبة (مثلا: ar.tajweed)" }
        },
        required: ["verse_key", "edition"]
      }
    },
    {
      name: "search_hadith",
      description: "البحث في كتب السنة النبوية والتحقق من صحة الحديث",
      parameters: {
        type: "OBJECT",
        properties: {
          query: { type: "STRING", description: "نص الحديث أو الموضوع" }
        },
        required: ["query"]
      }
    },
    {
      name: "control_app",
      description: "التحكم في واجهة التطبيق والقيام بإجراءات مثل تغيير السورة، تشغيل الصوت، فتح اتجاه القبلة، مواقيت الصلاة، إلخ.",
      parameters: {
        type: "OBJECT",
        properties: {
          action: { 
            type: "STRING", 
            description: "الإجراء المطلوب القيام به",
            enum: [
              "navigate_to_surah", 
              "toggle_audio", 
              "change_reciter", 
              "open_feature", 
              "change_theme",
              "search_quran",
              "change_qiraat",
              "change_tafsir"
            ]
          },
          params: {
            type: "OBJECT",
            description: "المعلمات الخاصة بالإجراء",
            properties: {
              surah: { type: "NUMBER", description: "رقم السورة (1-114)" },
              ayah: { type: "NUMBER", description: "رقم الآية" },
              reciterId: { 
                type: "STRING", 
                description: "معرف القارئ المطلوب. أمثلة: 'ar.alafasy' (العفاسي)، 'ar.husary' (الحصري)، 'ar.minshawi' (المنشاوي)، 'ar.abdulsamad' (عبد الباسط مجود)." 
              },
              qiraatId: {
                type: "STRING",
                description: "معرف القراءة/الرواية المطلوبة. أمثلة: 'hafs' (حفص عن عاصم)، 'warsh' (ورش عن نافع)، 'qaloon' (قالون عن نافع)."
              },
              tafsirId: {
                type: "STRING",
                description: "معرف التفسير المطلوب. أمثلة: 'ar.jalalayn' (الجلالين)، 'ar.muyassar' (الميسر)، 'ar.qurtubi' (القرطبي)."
              },
              feature: { 
                type: "STRING", 
                description: "اسم الميزة لفتحها",
                enum: ["qibla", "prayer_times", "tasbih", "calendar", "settings", "dua", "history"]
              },
              theme: { type: "STRING", enum: ["light", "dark", "noor"] },
              query: { type: "STRING", description: "نص البحث" }
            }
          }
        },
        required: ["action"]
      }
    }
  ]
}];

async function executeIslamicTool(name: string, args: any, clientWs?: any) {
  if (name === 'control_app') {
    // Send tool call event to client for UI execution
    if (clientWs) {
      // Merge params and args to handle both nested and flattened tool calls from different models
      const mergedParams = { ...(args.params || {}), ...args };
      // Remove action from params to keep it clean
      delete (mergedParams as any).action;
      
      clientWs.send(JSON.stringify({ 
        type: 'toolCall', 
        tool: 'control_app',
        action: args.action,
        params: mergedParams
      }));
    }
    return { status: "success", message: `تم تنفيذ إجراء ${args.action} بنجاح في الواجهة.` };
  }

  if (name === 'get_quran_verse') {
    let edition = args.edition || 'ar.tajweed';
    if (edition.includes('ورش')) edition = 'ar.warsh';
    if (edition.includes('حفص')) edition = 'ar.quran-uthmani';
    if (edition.includes('تجويد')) edition = 'ar.tajweed';
    
    try {
      const response = await fetch(`https://api.alquran.cloud/v1/ayah/${args.verse_key}/${edition}`);
      const data = await response.json();
      if (data.code === 200) {
        return { result: data.data.text };
      }
      return { error: 'Verse not found' };
    } catch(e) {
      return { error: 'API Error' };
    }
  } else if (name === 'search_hadith') {
      try {
        const response = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(args.query)}/all/ar`);
        const data = await response.json();
        if (data.code === 200 && data.data.count > 0) {
           return { results: data.data.matches.slice(0,3).map((m: any) => m.text) };
        }
        return { error: 'Not found' };
      } catch(e) {
        return { error: 'API Error' };
      }
  }
  return { error: 'Function not found' };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  const getEnvKey = (v: any) => (v && typeof v === 'string' && v.trim() !== '') ? v.trim() : '';

  const isValidKeyString = (val: any): val is string => {
    if (!val || typeof val !== 'string') return false;
    const v = val.trim();
    if (!v || v.length < 4) return false;
    if (v.startsWith('YOUR_') || v.startsWith('MY_') || v === 'undefined' || v === 'null') return false;
    return true;
  };

  const getBuiltInGeminiKey = (): string | undefined => {
    const env1 = process.env.GEMINI_API_KEY;
    if (isValidKeyString(env1)) return env1.trim();
    const env2 = process.env.API_KEY;
    if (isValidKeyString(env2)) return env2.trim();
    return undefined;
  };

  const getFinalKey = (apiKey: string | undefined): string | undefined => {
    if (isValidKeyString(apiKey)) return apiKey.trim();
    return getBuiltInGeminiKey();
  };

  const getCandidateKeys = (apiKey: string | undefined): string[] => {
    const keys: string[] = [];
    if (isValidKeyString(apiKey)) {
      keys.push(apiKey.trim());
    }
    const builtIn = getBuiltInGeminiKey();
    if (builtIn && !keys.includes(builtIn)) {
      keys.push(builtIn);
    }
    return keys;
  };

  const extractErrorMessage = (e: any, defaultMsg: string): string => {
    try {
      if (!e) return defaultMsg;
      
      let rawText = "";
      if (typeof e === 'string') rawText = e;
      else if (e.message) rawText = e.message;
      else if (typeof e === 'object') rawText = JSON.stringify(e);
      else rawText = String(e);

      const lowerText = rawText.toLowerCase();

      // Check for 429 / Quota / Rate limit
      if (
        lowerText.includes("429") || 
        lowerText.includes("quota") || 
        lowerText.includes("exhausted") || 
        lowerText.includes("resource_exhausted") ||
        e?.status === 429 ||
        e?.code === 429
      ) {
        let retryDelayMatch = rawText.match(/retry in ([\d\.]+)s/i) || rawText.match(/retryDelay.*?:.*?([\d\.]+)/i);
        let retrySeconds = retryDelayMatch ? Math.ceil(parseFloat(retryDelayMatch[1])) : null;
        let retryText = retrySeconds ? ` (يرجى الانتظار حوالي ${retrySeconds} ثانية)` : "";
        
        return `⚠️ تم تجاوز حد الطلبات أو الحصة المتاحة مؤقتاً لنموذج الذكاء الاصطناعي (429 Rate Limit).${retryText}`;
      }

      // Clean up any stringified prefix
      let cleanedMsg = rawText.replace(/^\[Stream\]\s*Model\s*[\w\.-]+\s*failed:\s*/i, '');

      return cleanedMsg || defaultMsg;
    } catch {
      return e?.message || defaultMsg;
    }
  };

  const createGeminiClient = (key: string) =>
    new GoogleGenAI({
      apiKey: key,
      apiVersion: 'v1beta',
      httpOptions: {
        apiVersion: 'v1beta',
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

  const CURATED_GEMINI_CHAT_MODELS = [
    'gemini-4-hydrogen',
    'gemini-4-neon',
    'gemini-4-argon',
    'gemini-4-carbon',
    'gemma-4-31b-it',
    'gemma-4-26b-a4b-it',
    'gemma-3-27b-it',
    'gemma-3-12b-it',
    'gemma-3-4b-it',
    'gemma-3-1b-it',
    'gemma-3n-e4b-it',
    'gemma-3n-e2b-it',
    'gemma-2-27b-it',
    'gemma-2-9b-it',
    'gemma-2-2b-it',
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-pro-preview',
    'gemini-3.1-pro-preview-customtools',
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite',
    'gemini-3.1-flash-lite-preview',
    'gemini-2.5-pro',
    'gemini-3.8-flash',
    'gemini-3.8-flash-lite',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-pro-latest',
    'gemini-robotics-er-2-preview',
    'gemini-robotics-er-2-streaming-preview'
  ];

  const isGemini4Model = (mName: string): boolean => mName.toLowerCase().startsWith('gemini-4');
  const isGemini3Model = (mName: string): boolean => mName.toLowerCase().startsWith('gemini-3');
  const isGemini25Model = (mName: string): boolean => mName.toLowerCase().startsWith('gemini-2.5');
  const isGemmaModel = (mName: string): boolean => mName.toLowerCase().startsWith('gemma-');
  const isRoboticsModel = (mName: string): boolean => mName.toLowerCase().includes('robotics');

  const isDeprecatedOrNonChatGeminiModel = (_mName: string): boolean => {
    return false;
  };

  const supportsThinking = (mName: string): boolean => {
    const m = mName.toLowerCase();
    if (isGemmaModel(m) || isRoboticsModel(m) || m.startsWith('gemini-3.5')) return false;
    return isGemini4Model(m) || isGemini3Model(m) || isGemini25Model(m);
  };

  const supportsNativeGoogleSearch = (mName: string): boolean => {
    const m = mName.toLowerCase();
    if (isGemmaModel(m)) return false;
    return m.startsWith('gemini-');
  };

  const normalizeModel = (rawModel: string): string => {
    if (!rawModel) return 'gemini-4-hydrogen';
    const trimmed = rawModel.trim().replace(/^models\//i, '');
    if (!trimmed) return 'gemini-4-hydrogen';
    if (trimmed.toLowerCase() === 'gemini-3-flash') return 'gemini-3-flash-preview';
    return trimmed;
  };

  interface WebSearchSnippet {
    title: string;
    uri: string;
    snippet: string;
  }

  const decodeHtmlEntities = (str: string): string =>
    str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/<[^>]+>/g, '')
      .trim();

  const performServerWebSearch = async (rawQuery: string): Promise<{
    contextText: string;
    groundingMetadata: {
      webSearchQueries: string[];
      groundingChunks: Array<{ web: { uri: string; title: string } }>;
    };
  } | null> => {
    const query = (rawQuery || '').replace(/\s+/g, ' ').trim().slice(0, 220);
    if (!query) return null;

    const results: WebSearchSnippet[] = [];
    const seenUris = new Set<string>();

    const addResult = (title: string, uri: string, snippet: string) => {
      const cleanUri = (uri || '').trim();
      const cleanTitle = decodeHtmlEntities(title || '');
      const cleanSnippet = decodeHtmlEntities(snippet || '');
      if (!cleanUri || !cleanUri.startsWith('http') || seenUris.has(cleanUri) || !cleanTitle) return;
      seenUris.add(cleanUri);
      results.push({ title: cleanTitle, uri: cleanUri, snippet: cleanSnippet });
    };

    const fetchWithTimeout = async (url: string, options: any = {}, timeoutMs = 3500) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        return await fetch(url, { ...options, signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }
    };

    await Promise.allSettled([
      // 1. DuckDuckGo HTML search
      (async () => {
        try {
          const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
          const resp = await fetchWithTimeout(ddgUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
            }
          });
          if (resp.ok) {
            const html = await resp.text();
            const blockRegex = /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>|<div[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/div>)/gi;
            let match;
            while ((match = blockRegex.exec(html)) !== null && results.length < 6) {
              let rawHref = match[1] || '';
              const uddgMatch = rawHref.match(/[?&]uddg=([^&]+)/);
              if (uddgMatch && uddgMatch[1]) {
                rawHref = decodeURIComponent(uddgMatch[1]);
              }
              addResult(match[2], rawHref, match[3] || match[4] || '');
            }
          }
        } catch {}
      })(),
      // 2. Google News RSS (Arabic & International)
      (async () => {
        try {
          const isArabic = /[\u0600-\u06FF]/.test(query);
          const rssUrl = isArabic
            ? `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ar&gl=SA&ceid=SA:ar`
            : `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
          const resp = await fetchWithTimeout(rssUrl);
          if (resp.ok) {
            const xml = await resp.text();
            const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
            let match;
            while ((match = itemRegex.exec(xml)) !== null && results.length < 8) {
              const itemXml = match[1];
              const title = (itemXml.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/<!\[CDATA\[|\]\]>/g, '');
              const link = (itemXml.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || '').trim();
              const pubDate = (itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] || '').trim();
              const desc = (itemXml.match(/<description>([\s\S]*?)<\/description>/i)?.[1] || '').replace(/<!\[CDATA\[|\]\]>/g, '');
              addResult(title, link, `${pubDate ? `[${pubDate}] ` : ''}${desc}`);
            }
          }
        } catch {}
      })(),
      // 3. Wikipedia Search API (Arabic / English)
      (async () => {
        try {
          const isArabic = /[\u0600-\u06FF]/.test(query);
          const lang = isArabic ? 'ar' : 'en';
          const wikiUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&srlimit=3`;
          const resp = await fetchWithTimeout(wikiUrl);
          if (resp.ok) {
            const data: any = await resp.json();
            const searchItems = data?.query?.search || [];
            for (const item of searchItems) {
              const pageUrl = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(String(item.title).replace(/ /g, '_'))}`;
              addResult(`${item.title} - ويكيبيديا`, pageUrl, item.snippet || '');
            }
          }
        } catch {}
      })()
    ]);

    if (results.length === 0) return null;

    const topResults = results.slice(0, 6);
    const contextLines = topResults.map(
      (r, idx) => `[${idx + 1}] العنوان: ${r.title}\nالرابط: ${r.uri}\nالملخص: ${r.snippet}`
    );
    const contextText = `نتائج البحث الحي المباشر من الويب حول استفسار المستخدم ("${query}"):\n\n${contextLines.join('\n\n')}\n\nاستخدم هذه المعلومات المحدثة من الويب للإجابة بدقة وشمولية.`;

    return {
      contextText,
      groundingMetadata: {
        webSearchQueries: [query],
        groundingChunks: topResults.map(r => ({
          web: {
            uri: r.uri,
            title: r.title
          }
        }))
      }
    };
  };

  interface AttemptConfig {
    model: string;
    enableWebSearch: boolean;
    useServerSearchFallback: boolean;
    enableDeepThinking: boolean;
  }

  const getAttempts = (rawModel: string, reqWebSearch: boolean, reqDeepThinking: boolean): AttemptConfig[] => {
    const requestedModel = normalizeModel(rawModel);
    const fallbackModels = reqWebSearch
      ? [
          requestedModel,
          'gemini-3.1-flash-lite',
          'gemini-3.1-flash-lite-preview',
          'gemini-robotics-er-2-preview',
          'gemini-flash-lite-latest',
          'gemini-3-flash-preview',
          'gemini-4-hydrogen'
        ]
      : [
          requestedModel,
          'gemini-3.1-flash-lite',
          'gemini-3.1-flash-lite-preview',
          'gemini-flash-lite-latest',
          'gemini-robotics-er-2-preview',
          'gemini-3-flash-preview',
          'gemini-4-hydrogen'
        ];

    const attempts: AttemptConfig[] = [];

    // 1. Always try the exact requested model first
    if (reqWebSearch) {
      if (supportsNativeGoogleSearch(requestedModel)) {
        attempts.push({
          model: requestedModel,
          enableWebSearch: true,
          useServerSearchFallback: false,
          enableDeepThinking: reqDeepThinking && supportsThinking(requestedModel)
        });
      }
      // Also queue the exact requested model with server-side web search grounding (in case native googleSearch tool fails or is unsupported)
      attempts.push({
        model: requestedModel,
        enableWebSearch: false,
        useServerSearchFallback: true,
        enableDeepThinking: reqDeepThinking && supportsThinking(requestedModel)
      });
    } else {
      attempts.push({
        model: requestedModel,
        enableWebSearch: false,
        useServerSearchFallback: false,
        enableDeepThinking: reqDeepThinking && supportsThinking(requestedModel)
      });
    }

    // 2. Add fallback models so the user ALWAYS gets a response even if a specific model hits 429/404/503
    for (const m of fallbackModels) {
      if (reqWebSearch) {
        if (supportsNativeGoogleSearch(m)) {
          attempts.push({
            model: m,
            enableWebSearch: true,
            useServerSearchFallback: false,
            enableDeepThinking: reqDeepThinking && supportsThinking(m)
          });
        }
        attempts.push({
          model: m,
          enableWebSearch: false,
          useServerSearchFallback: true,
          enableDeepThinking: reqDeepThinking && supportsThinking(m)
        });
      } else {
        attempts.push({
          model: m,
          enableWebSearch: false,
          useServerSearchFallback: false,
          enableDeepThinking: reqDeepThinking && supportsThinking(m)
        });
      }
    }

    const seen = new Set<string>();
    return attempts.filter(a => {
      const key = `${a.model}_${a.enableWebSearch}_${a.useServerSearchFallback}_${a.enableDeepThinking}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const buildGeminiContents = (messages: any[], extraSystemPrefix?: string, extraWebContext?: string) => {
    const rawContents = (Array.isArray(messages) ? messages : [])
      .filter((m: any) => m.role !== 'system')
      .map((m: any) => {
        const parts: any[] = [];
        if (m.attachments && Array.isArray(m.attachments)) {
          m.attachments.forEach((att: any) => {
            parts.push({
              inlineData: {
                data: att.data,
                mimeType: att.mimeType
              }
            });
          });
        } else if (m.inlineData) {
          parts.push({ inlineData: m.inlineData });
        }
        if (m.content) {
          parts.push({ text: m.content });
        }
        return {
          role: m.role === 'assistant' ? 'model' : 'user',
          parts
        };
      })
      .filter((c: any) => c.parts.length > 0);

    if ((extraSystemPrefix || extraWebContext) && rawContents.length > 0) {
      const cloned = rawContents.map(c => ({
        role: c.role,
        parts: c.parts.map((p: any) => ({ ...p }))
      }));
      if (extraSystemPrefix) {
        const firstUserIdx = cloned.findIndex(c => c.role === 'user');
        if (firstUserIdx !== -1) {
          const textPart = cloned[firstUserIdx].parts.find((p: any) => typeof p.text === 'string');
          if (textPart) {
            textPart.text = `${extraSystemPrefix}\n\n${textPart.text}`;
          } else {
            cloned[firstUserIdx].parts.unshift({ text: extraSystemPrefix });
          }
        }
      }
      if (extraWebContext) {
        let lastUserIdx = -1;
        for (let i = cloned.length - 1; i >= 0; i--) {
          if (cloned[i].role === 'user') {
            lastUserIdx = i;
            break;
          }
        }
        if (lastUserIdx !== -1) {
          const textPart = cloned[lastUserIdx].parts.find((p: any) => typeof p.text === 'string');
          if (textPart) {
            textPart.text = `${extraWebContext}\n\nسؤال المستخدم:\n${textPart.text}`;
          } else {
            cloned[lastUserIdx].parts.push({ text: extraWebContext });
          }
        }
      }
      return cloned;
    }

    return rawContents;
  };

  const extractLatestUserQuery = (messages: any[]): string => {
    if (!Array.isArray(messages)) return '';
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m && m.role === 'user' && typeof m.content === 'string' && m.content.trim()) {
        return m.content.trim();
      }
    }
    return '';
  };

  const contentsContainUrl = (contents: any[]): boolean =>
    contents.some(c =>
      c.parts?.some((p: any) => typeof p.text === 'string' && /https?:\/\/\S+/i.test(p.text))
    );

  const buildGeminiRequestConfig = (
    modelName: string,
    systemInstruction: string | undefined,
    config: any,
    attempt: { enableWebSearch: boolean; enableDeepThinking: boolean },
    contents: any[],
    includeUrlContext: boolean = true
  ) => {
    const geminiConfig: any = {};
    // Gemma models in v1beta reject systemInstruction in config ("Developer instruction is not enabled")
    if (systemInstruction && !isGemmaModel(modelName)) {
      geminiConfig.systemInstruction = systemInstruction;
    }

    // Do not pass temperature/sampling params to gemini-4-* models per Gemini API spec
    if (!isGemini4Model(modelName) && typeof config?.temperature === 'number') {
      geminiConfig.temperature = config.temperature;
    }

    if (typeof config?.maxOutputTokens === 'number' && config.maxOutputTokens > 0) {
      geminiConfig.maxOutputTokens = config.maxOutputTokens;
    }

    if (attempt.enableWebSearch && supportsNativeGoogleSearch(modelName)) {
      // Built-in Google Search grounding cannot be combined with responseMimeType: "application/json"
      const tools: any[] = [{ googleSearch: {} }];
      if (includeUrlContext && contentsContainUrl(contents)) {
        tools.push({ urlContext: {} });
      }
      geminiConfig.tools = tools;
    } else if (config?.responseMimeType && !isGemmaModel(modelName)) {
      geminiConfig.responseMimeType = config.responseMimeType;
    }

    if (attempt.enableDeepThinking && supportsThinking(modelName)) {
      if (isGemini4Model(modelName) || isGemini3Model(modelName)) {
        geminiConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      } else if (isGemini25Model(modelName)) {
        geminiConfig.thinkingConfig = { thinkingBudget: 8192 };
      }
    }

    return geminiConfig;
  };

  // Chatbase User Identity Verification Endpoint
  app.get("/api/chatbase/token", async (req, res) => {
    try {
      const secret = process.env.CHATBOT_IDENTITY_SECRET;
      if (!secret) {
        return res.json({ token: null, configured: false });
      }

      const userId = (req.query.user_id as string) || (req.query.userId as string) || "user_" + Math.random().toString(36).substring(2, 11);
      const email = (req.query.email as string) || undefined;

      const payload: Record<string, any> = {
        user_id: userId,
      };
      if (email) payload.email = email;

      const token = jwt.sign(payload, secret, { expiresIn: '1h' });
      return res.json({ token });
    } catch (error: any) {
      console.error("[Chatbase Token Error]", error);
      return res.status(500).json({ error: error.message || "Failed to generate token" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { message, apiKey, systemInstruction, history } = req.body;
      const candidateKeys = getCandidateKeys(apiKey);
      if (candidateKeys.length === 0) return res.status(401).json({ error: "Gemini API key is missing" });

      const chatModels = ['gemini-3.1-flash-lite', 'gemini-3.1-flash-lite-preview', 'gemini-flash-lite-latest', 'gemini-3-flash-preview', 'gemini-robotics-er-2-preview'];
      
      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
      if (history && Array.isArray(history)) {
        history.slice(-12).forEach((h: any) => {
          if (h.text && (h.sender === 'user' || h.sender === 'model')) {
            contents.push({
              role: h.sender === 'user' ? 'user' : 'model',
              parts: [{ text: h.text }]
            });
          }
        });
      }
      contents.push({ role: 'user', parts: [{ text: message }] });
      
      const refinedSystemInstruction = `أنت 'مداد الرحمن'، القارئ والمقرئ المجود خبير مخارج الحروف وصفاتها، وعالم جليل في القراءات العشر وعلوم التجويد والتفسير. 
لديك القدرة الكاملة على تلاوة وترتيل وقراءة آيات القرآن الكريم، وشرح أحكام التجويد ومخارج الحروف بدقة، والرد على أسئلة العلوم الشرعية. لا تقل أبداً أنك لا تملك القدرة على القراءة أو أن دورك يقتصر على اختيار قراء آخرين؛ بل أنت مقرئ ومعلم وقارئ مجود مبارك.
دورك الأساسي والمطلق هو إرشاد وتدريس القرآن الكريم، بيان مخارج الحروف (الجوف، الحلق، اللسان، الشفتان، والخيشوم)، شرح أحكام النون الساكنة والتنوين، المدود، الإدغام، الإخفاء، والوقف والابتداء بأسلوب أستاذ متقن وقور.
لديك ذاكرة ذكية وسجل متطور لجميع ما تم مناقشته في الجلسة، فاحتفظ بالسياق ولا تنس أبداً ما تم طرحه سابقاً.
يحذر تماماً ذكر أي عبارة تشير إلى أنك نموذج لغوي، برنامج حاسوبي، أو ذكاء اصطناعي. أنت شيخ ومقرئ قرآني مبارك.
لا تقم بتغيير إعدادات التطبيق أو السور تلقائياً إلا إذا طلب المستخدم ذلك صراحة وبوضوح تام.
${systemInstruction || ''}`;

      let replyText = "";
      let lastError: any = null;
      for (const activeKey of candidateKeys) {
        const ai = createGeminiClient(activeKey);
        for (const candidateModel of chatModels) {
          try {
            const isGemma = isGemmaModel(candidateModel);
            const modelContents = isGemma
              ? contents.map((c, idx) =>
                  idx === 0 && c.role === 'user'
                    ? { ...c, parts: [{ text: `${refinedSystemInstruction}\n\n${c.parts[0]?.text || ''}` }] }
                    : c
                )
              : contents;
            const response = await ai.models.generateContent({
              model: candidateModel,
              contents: modelContents,
              config: isGemma ? {} : { systemInstruction: refinedSystemInstruction }
            });
            if (response.text) {
              replyText = response.text;
              break;
            }
          } catch (apiErr: any) {
            lastError = apiErr;
            console.warn(`[Chat API] Model ${candidateModel} failed:`, apiErr?.message);
          }
        }
        if (replyText) break;
      }

      if (!replyText) {
        return res.status(500).json({ error: extractErrorMessage(lastError, "تعذر الحصول على رد من مداد الرحمن") });
      }

      if (replyText.includes('نموذج لغوي') || replyText.includes('ذكاء اصطناعي') || replyText.includes('Google') || replyText.includes('مساعد ذكي')) {
        replyText = replyText.replace(/نموذج لغوي/g, 'مقرئ').replace(/ذكاء اصطناعي/g, 'معلم').replace(/Google/g, 'مداد الرحمن').replace(/مساعد ذكي/g, 'شيخ المقارئ');
      }

      return res.json({ reply: replyText });
    } catch (e: any) {
      console.error("[Chat Error]", e);
      return res.status(500).json({ error: extractErrorMessage(e, "خطأ داخلي") });
    }
  });

  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const { apiKey, model, messages, config } = req.body;
      const candidateKeys = getCandidateKeys(apiKey);
      
      if (candidateKeys.length === 0) return res.status(401).json({ error: "Gemini API key is missing" });

      const requestedModel = model || 'gemini-4-hydrogen';
      const reqWebSearch = !!config?.enableWebSearch;
      const reqDeepThinking = !!config?.enableDeepThinking;

      const attempts = getAttempts(requestedModel, reqWebSearch, reqDeepThinking);
      const systemInstruction = (Array.isArray(messages) ? messages : [])
        .filter((m: any) => m.role === 'system')
        .map((m: any) => m.content)
        .join('\n\n') || config?.systemInstruction;

      let cachedServerSearch: Awaited<ReturnType<typeof performServerWebSearch>> | undefined = undefined;
      const getServerSearchData = async () => {
        if (cachedServerSearch !== undefined) return cachedServerSearch;
        const latestQuery = extractLatestUserQuery(messages);
        cachedServerSearch = await performServerWebSearch(latestQuery);
        return cachedServerSearch;
      };

      const normalizedRequested = normalizeModel(requestedModel);
      let lastError = null;
      const deadModelsByKey = new Map<string, Set<string>>();
      const invalidKeys = new Set<string>();
      for (const currentAttempt of attempts) {
        for (const activeKey of candidateKeys) {
          if (invalidKeys.has(activeKey)) continue;
          let deadModelsForKey = deadModelsByKey.get(activeKey);
          if (!deadModelsForKey) {
            deadModelsForKey = new Set<string>();
            deadModelsByKey.set(activeKey, deadModelsForKey);
          }
          if (deadModelsForKey.has(currentAttempt.model)) continue;
          const ai = createGeminiClient(activeKey);
          try {
            const searchData = currentAttempt.useServerSearchFallback ? await getServerSearchData() : null;
            const contents = buildGeminiContents(
              messages,
              isGemmaModel(currentAttempt.model) ? systemInstruction : undefined,
              searchData?.contextText
            );

            let response;
            const geminiConfig = buildGeminiRequestConfig(
              currentAttempt.model,
              systemInstruction,
              config,
              currentAttempt,
              contents,
              true
            );

            try {
              response = await ai.models.generateContent({
                model: currentAttempt.model,
                contents,
                config: geminiConfig
              });
            } catch (innerErr: any) {
              const innerMsg = String(innerErr?.message || innerErr);
              // If urlContext or thinkingConfig caused a 400 on a specific model, retry cleanly
              if (innerMsg.includes('400') && !innerMsg.toLowerCase().includes('not supported') && !innerMsg.toLowerCase().includes('not found')) {
                const cleanConfig = buildGeminiRequestConfig(
                  currentAttempt.model,
                   undefined,
                  config,
                  { enableWebSearch: currentAttempt.enableWebSearch, enableDeepThinking: false },
                  contents,
                  false
                );
                const fallbackContents = buildGeminiContents(
                  messages,
                  systemInstruction,
                  searchData?.contextText
                );
                response = await ai.models.generateContent({
                  model: currentAttempt.model,
                  contents: fallbackContents,
                  config: cleanConfig
                });
              } else {
                throw innerErr;
              }
            }

            if (!response.candidates?.[0]) throw new Error("Gemini returned no results.");
            const candidate = response.candidates[0];
            const content = response.text || "";
            const thought = candidate.content?.parts?.filter((p: any) => p.thought && p.text).map((p: any) => p.text).join('') || "";
            let groundingMetadata = candidate.groundingMetadata || searchData?.groundingMetadata;
            if (reqWebSearch && (!groundingMetadata || !groundingMetadata.groundingChunks?.length)) {
              const fallbackSearch = await getServerSearchData();
              if (fallbackSearch?.groundingMetadata) {
                groundingMetadata = fallbackSearch.groundingMetadata;
              }
            }

            const displayModel = currentAttempt.model !== normalizedRequested
              ? `${normalizedRequested} (تم التراجع إلى ${currentAttempt.model})`
              : currentAttempt.model;
            
            return res.json({ 
              content, 
              model: displayModel, 
              executedModel: currentAttempt.model,
              failedModel: currentAttempt.model !== normalizedRequested ? normalizedRequested : undefined,
              groundingMetadata,
              thought
            });
          } catch (e: any) {
            lastError = e;
            const errMsg = String(e?.message || e);
            console.warn(`[Generate] Model ${currentAttempt.model} (nativeSearch=${currentAttempt.enableWebSearch}, serverSearch=${currentAttempt.useServerSearchFallback}) failed:`, errMsg);
            if (
              errMsg.includes("404") ||
              errMsg.includes("429") ||
              errMsg.includes("503") ||
              errMsg.includes("NOT_FOUND") ||
              errMsg.includes("RESOURCE_EXHAUSTED") ||
              errMsg.toLowerCase().includes("no longer available") ||
              errMsg.toLowerCase().includes("is not found") ||
              errMsg.toLowerCase().includes("not supported for generatecontent")
            ) {
              deadModelsForKey.add(currentAttempt.model);
            }
            if (errMsg.includes("401") || errMsg.includes("API_KEY_INVALID")) {
              invalidKeys.add(activeKey);
            }
          }
        }
      }

      return res.status(500).json({ error: extractErrorMessage(lastError, "Failed to generate content") });
    } catch (globalError: any) {
      console.error("[Generate Global Error]", globalError);
      return res.status(500).json({ error: globalError?.message || "Internal server error during text generation" });
    }
  });

  app.post("/api/gemini/stream", async (req, res) => {
    try {
      const { apiKey, model, messages, config } = req.body;
      const candidateKeys = getCandidateKeys(apiKey);
      if (candidateKeys.length === 0) return res.status(401).json({ error: "Gemini API key is missing" });

      const requestedModel = model || 'gemini-4-hydrogen';
      const reqWebSearch = !!config?.enableWebSearch;
      const reqDeepThinking = !!config?.enableDeepThinking;

      const attempts = getAttempts(requestedModel, reqWebSearch, reqDeepThinking);
      const systemInstruction = (Array.isArray(messages) ? messages : [])
        .filter((m: any) => m.role === 'system')
        .map((m: any) => m.content)
        .join('\n\n') || config?.systemInstruction;

      let cachedServerSearch: Awaited<ReturnType<typeof performServerWebSearch>> | undefined = undefined;
      const getServerSearchData = async () => {
        if (cachedServerSearch !== undefined) return cachedServerSearch;
        const latestQuery = extractLatestUserQuery(messages);
        cachedServerSearch = await performServerWebSearch(latestQuery);
        return cachedServerSearch;
      };

      const normalizedRequested = normalizeModel(requestedModel);
      let lastError = null;
      const deadModelsByKey = new Map<string, Set<string>>();
      const invalidKeys = new Set<string>();
      for (const currentAttempt of attempts) {
        for (const activeKey of candidateKeys) {
          if (invalidKeys.has(activeKey)) continue;
          let deadModelsForKey = deadModelsByKey.get(activeKey);
          if (!deadModelsForKey) {
            deadModelsForKey = new Set<string>();
            deadModelsByKey.set(activeKey, deadModelsForKey);
          }
          if (deadModelsForKey.has(currentAttempt.model)) continue;
          const ai = createGeminiClient(activeKey);
          try {
            const searchData = currentAttempt.useServerSearchFallback ? await getServerSearchData() : null;
            const contents = buildGeminiContents(
              messages,
              isGemmaModel(currentAttempt.model) ? systemInstruction : undefined,
              searchData?.contextText
            );

            const geminiConfig = buildGeminiRequestConfig(
              currentAttempt.model,
              systemInstruction,
              config,
              currentAttempt,
              contents,
              true
            );

            let responseStream;
            try {
              responseStream = await ai.models.generateContentStream({
                model: currentAttempt.model,
                contents,
                config: geminiConfig
              });
            } catch (innerErr: any) {
              const innerMsg = String(innerErr?.message || innerErr);
              if (innerMsg.includes('400') && !innerMsg.toLowerCase().includes('not supported') && !innerMsg.toLowerCase().includes('not found')) {
                const cleanConfig = buildGeminiRequestConfig(
                  currentAttempt.model,
                  undefined,
                  config,
                  { enableWebSearch: currentAttempt.enableWebSearch, enableDeepThinking: false },
                  contents,
                  false
                );
                const fallbackContents = buildGeminiContents(
                  messages,
                  systemInstruction,
                  searchData?.contextText
                );
                responseStream = await ai.models.generateContentStream({
                  model: currentAttempt.model,
                  contents: fallbackContents,
                  config: cleanConfig
                });
              } else {
                throw innerErr;
              }
            }

            // Peek first chunk before sending SSE headers so if the stream rejects on first iteration (e.g., 429/404/503), we can transparently try the next attempt!
            const iterator = responseStream[Symbol.asyncIterator]();
            const firstStep = await iterator.next();

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const displayModel = currentAttempt.model !== normalizedRequested
              ? `${normalizedRequested} (تم التراجع إلى ${currentAttempt.model})`
              : currentAttempt.model;

            res.write("data: " + JSON.stringify({ model: displayModel, executedModel: currentAttempt.model }) + "\n\n");

            let sentGrounding = false;

            const processChunk = (chunk: any) => {
              const candidate = chunk?.candidates?.[0];
              const text = chunk?.text || "";
              const groundingMetadata = candidate?.groundingMetadata;
              if (groundingMetadata?.groundingChunks?.length) {
                sentGrounding = true;
              }
              const thought = candidate?.content?.parts?.filter((p: any) => p.thought && p.text).map((p: any) => p.text).join('') || "";
              
              if (text || groundingMetadata || thought) {
                res.write("data: " + JSON.stringify({ text, groundingMetadata, thought, model: displayModel }) + "\n\n");
              }
            };

            if (!firstStep.done && firstStep.value) {
              processChunk(firstStep.value);
            }

            while (true) {
              const step = await iterator.next();
              if (step.done) break;
              if (step.value) processChunk(step.value);
            }

            if (reqWebSearch && !sentGrounding) {
              const fallbackSearch = searchData || (await getServerSearchData());
              if (fallbackSearch?.groundingMetadata) {
                res.write("data: " + JSON.stringify({ text: "", groundingMetadata: fallbackSearch.groundingMetadata, thought: "", model: displayModel }) + "\n\n");
              }
            }

            res.write("data: [DONE]\n\n");
            res.end();
            return;
          } catch (e: any) {
            lastError = e;
            const errMsg = String(e?.message || e);
            console.warn(`[Stream] Model ${currentAttempt.model} (nativeSearch=${currentAttempt.enableWebSearch}, serverSearch=${currentAttempt.useServerSearchFallback}) failed:`, errMsg);
            if (res.headersSent) throw e;
            if (
              errMsg.includes("404") ||
              errMsg.includes("429") ||
              errMsg.includes("503") ||
              errMsg.includes("NOT_FOUND") ||
              errMsg.includes("RESOURCE_EXHAUSTED") ||
              errMsg.toLowerCase().includes("no longer available") ||
              errMsg.toLowerCase().includes("is not found") ||
              errMsg.toLowerCase().includes("not supported for generatecontent")
            ) {
              deadModelsForKey.add(currentAttempt.model);
            }
            if (errMsg.includes("401") || errMsg.includes("API_KEY_INVALID")) {
              invalidKeys.add(activeKey);
            }
          }
        }
      }

      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.write("data: " + JSON.stringify({ error: extractErrorMessage(lastError, "Stream failed") }) + "\n\n");
        res.end();
      }
    } catch (globalError: any) {
      console.error("[Stream Global Error]", globalError);
      try {
        res.write("data: " + JSON.stringify({ error: globalError?.message || "Internal server error during streaming" }) + "\n\n");
        res.end();
      } catch (e) {}
    }
  });

  app.post("/api/gemini/image", async (req, res) => {
    try {
      const { apiKey, model, prompt, config } = req.body;
      const finalKey = getFinalKey(apiKey);
      if (!finalKey) return res.status(401).json({ error: "Gemini API key is missing" });

      // Build the sequential fallback list of official Gemini image models
      const requestedModel = model || 'gemini-3.1-flash-lite-image';
      const modelsToTry = [requestedModel];
      const fallbackList = [
        'gemini-3.1-flash-lite-image',
        'gemini-nano-banana-2.1',
        'gemini-2.5-flash-image',
        'gemini-3-pro-image'
      ];

      for (const m of fallbackList) {
        if (!modelsToTry.includes(m)) {
          modelsToTry.push(m);
        }
      }

      let lastError = null;
      const ai = createGeminiClient(finalKey);

      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      for (let i = 0; i < modelsToTry.length; i++) {
        const currentModel = modelsToTry[i];
        try {
          let base64Image: string | undefined;
          
          if (currentModel.startsWith('imagen')) {
            const imageResponse = await ai.models.generateImages({
              model: currentModel,
              prompt: prompt,
              config: {
                aspectRatio: config?.aspectRatio || '1:1',
                outputMimeType: 'image/png'
              }
            });
            base64Image = imageResponse.generatedImages?.[0]?.image?.imageBytes;
          } else {
            const response = await ai.models.generateContent({
              model: currentModel,
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              config: {
                responseModalities: [Modality.IMAGE],
                imageConfig: {
                  aspectRatio: config?.aspectRatio || '1:1'
                }
              }
            });
            const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            base64Image = part?.inlineData?.data;
          }
          
          if (base64Image) {
            const buffer = Buffer.from(base64Image, 'base64');
            res.setHeader('Content-Type', 'image/png');
            return res.send(buffer);
          }
          
          throw new Error(`لم يتم استلام بيانات الصورة من ${currentModel}.`);
        } catch (e: any) {
          console.warn(`[ImageGen] Model ${currentModel} failed, trying next fallback:`, e);
          lastError = e;
          // If we have more models to try, sleep before next attempt
          if (i < modelsToTry.length - 1) {
            await sleep(2000); 
          }
        }
      }

      return res.status(500).json({ error: extractErrorMessage(lastError, "فشل توليد الصورة عبر Gemini") });
    } catch (globalError: any) {
      console.error("[ImageGen Global Error]", globalError);
      return res.status(500).json({ error: globalError?.message || "Internal server error during image generation" });
    }
  });

  app.post("/api/gemini/speech", async (req, res) => {
    const { apiKey, model, text, voiceName } = req.body;
    const finalKey = getFinalKey(apiKey);
    if (!finalKey) return res.status(401).json({ error: "Gemini API key is missing" });

    const requestedModel = model || 'gemini-3.8-flash-lite-tts';
    const modelsToTry = [requestedModel];
    const fallbackList = ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts', 'gemini-3.1-flash-tts-preview', 'gemini-2.5-flash'];
    for (const m of fallbackList) {
      if (!modelsToTry.includes(m)) {
        modelsToTry.push(m);
      }
    }

    let lastError = null;
    for (const currentModel of modelsToTry) {
      try {
        const ai = createGeminiClient(finalKey);
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: [{ parts: [{ text: text }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName as any },
              },
            },
          },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData?.data) {
          return res.json({ audioData: part.inlineData.data, mimeType: part.inlineData.mimeType });
        } else {
          console.warn(`[Speech] Model ${currentModel} returned content but no audio data. Response structure:`, JSON.stringify(response.candidates?.[0]?.content || {}, null, 2));
          throw new Error(`No audio data received from ${currentModel}`);
        }
      } catch (e: any) {
        console.warn(`[Speech] Model ${currentModel} failed, trying next fallback:`, e);
        lastError = e;
      }
    }

    res.status(500).json({ error: extractErrorMessage(lastError, "Failed to generate speech") });
  });

  app.post("/api/gemini/transcribe", async (req, res) => {
    try {
      const { apiKey, base64Audio, mimeType } = req.body;
      const finalKey = getFinalKey(apiKey);
      if (!finalKey) return res.status(401).json({ error: "Gemini API key is missing" });

      const ai = createGeminiClient(finalKey);
      
      const contents = {
        parts: [
          {
            inlineData: {
              data: base64Audio,
              mimeType: mimeType,
            },
          },
          {
            text: "قم بتفريغ هذا المقطع الصوتي إلى نص عربي بدقة. أعد النص فقط بدون أي إضافات أو تعليقات.",
          },
        ],
      };

      const modelsToTry = [
        'gemini-3.5-transcribe',
        'gemini-4-hydrogen',
        'gemini-3.8-flash',
        'gemini-3.1-flash-lite'
      ];
      let lastError = null;

      for (const m of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: m,
            contents,
          });
          return res.json({ text: response.text || '' });
        } catch (err: any) {
          console.warn(`[Transcribe] Model ${m} failed:`, err?.message || err);
          lastError = err;
        }
      }

      return res.status(500).json({ error: extractErrorMessage(lastError, "Failed to transcribe audio") });
    } catch (globalError: any) {
      console.error("[Transcribe Global Error]", globalError);
      return res.status(500).json({ error: globalError?.message || "Internal server error during transcription" });
    }
  });

  // Edge TTS Endpoint (OpenAI Compatible)
  app.post("/api/tts/edge", async (req, res) => {
    try {
      const { text, voice, response_format = 'mp3', speed = 1 } = req.body;
      if (!text) return res.status(400).json({ error: "Text is required" });

      // Adjust rate if needed (speed 1 = +0%, 0.5 = -50%, 1.5 = +50%)
      const rate = speed >= 1 ? `+${Math.round((speed - 1) * 100)}%` : `-${Math.round((1 - speed) * 100)}%`;

      const communicate = new Communicate(text, {
        voice: voice || 'ar-EG-SalmaNeural',
        rate: rate
      });

      let audioBuffer = Buffer.alloc(0);
      for await (const chunk of communicate.stream()) {
        if (chunk.type === 'audio' && chunk.data) {
          audioBuffer = Buffer.concat([audioBuffer, chunk.data]);
        }
      }

      if (audioBuffer.length === 0) {
        throw new Error("No audio data received from Edge TTS");
      }

      res.setHeader('Content-Type', `audio/${response_format}`);
      res.send(audioBuffer);
    } catch (error: any) {
      console.error("[EdgeTTS Error]", error);
      res.status(500).json({ error: "فشل توليد الصوت عبر Edge TTS" });
    }
  });

  // Proxy endpoint for fetching images to avoid CORS
  app.get("/api/proxy/image", async (req, res) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).send("URL is required");
    }
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        return res.status(response.status).send(`Failed to fetch image: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buffer);
    } catch (error: any) {
      res.status(500).send(error.message || "Failed to fetch image");
    }
  });

  // Proxy endpoint for fetching audio to avoid CORS and network blocks
  app.get("/api/proxy/audio", async (req, res) => {
    const audioUrl = req.query.url as string;
    if (!audioUrl) {
      return res.status(400).send("URL is required");
    }
    try {
      const response = await fetch(audioUrl);
      if (!response.ok) {
        return res.status(response.status).send(`Failed to fetch audio: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get('content-type') || 'audio/mpeg';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for up to 1 year since Quran audio is static
      res.send(buffer);
    } catch (error: any) {
      res.status(500).send(error.message || "Failed to fetch audio");
    }
  });

  // Fetch models dynamically from provider source
  app.post("/api/models/:provider", async (req, res) => {
    const { provider } = req.params;
    const { apiKey } = req.body;

    const serverKey = 
      provider === 'groq' ? getEnvKey(process.env.GROQ_API_KEY) :
      provider === 'openrouter' ? getEnvKey(process.env.OPENROUTER_API_KEY) :
      provider === 'mistral' ? getEnvKey(process.env.MISTRAL_API_KEY) :
      provider === 'routeway' ? getEnvKey(process.env.ROUTEWAY_API_KEY) :
      provider === 'deepseek' ? getEnvKey(process.env.DEEPSEEK_API_KEY) : 
      provider === 'gemini' ? (getEnvKey(process.env.API_KEY) || getEnvKey(process.env.GEMINI_API_KEY)) : '';

    const finalKey = getEnvKey(apiKey) || serverKey;

    if (!finalKey && provider !== 'gemini' && provider !== 'openrouter' && provider !== 'routeway') {
      return res.status(401).json({ error: "مفتاح API غير متوفر لتحديث النماذج" });
    }

    try {
      let models: string[] = [];

      if (provider === 'gemini') {
        const candidateKeys = getCandidateKeys(apiKey);
        if (candidateKeys.length === 0) {
          models = [...CURATED_GEMINI_CHAT_MODELS];
        } else {
          let fetched = false;
          for (const keyToTry of candidateKeys) {
            try {
              const allRawModels: any[] = [];
              let pageToken = '';
              do {
                const url = `https://generativelanguage.googleapis.com/v1beta/models?pageSize=100&key=${keyToTry}${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
                const response = await fetch(url);
                if (!response.ok) {
                  const errText = await response.text().catch(() => '');
                  throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
                }
                const data: any = await response.json();
                if (Array.isArray(data.models)) {
                  allRawModels.push(...data.models);
                }
                pageToken = data.nextPageToken || '';
              } while (pageToken);

              const apiModels = allRawModels
                .map((m: any) => (m.name || '').replace('models/', '').trim())
                .filter(Boolean);

              models = Array.from(new Set([
                ...CURATED_GEMINI_CHAT_MODELS,
                ...apiModels
              ]));
              fetched = true;
              break;
            } catch (fetchError: any) {
              console.warn("Gemini models fetch attempt failed, trying next key or curated list:", fetchError.message || fetchError);
            }
          }
          if (!fetched) {
            models = [...CURATED_GEMINI_CHAT_MODELS];
          }
        }
      } else if (provider === 'groq') {
        const response = await fetch(`https://api.groq.com/openai/v1/models`, {
          headers: { 'Authorization': `Bearer ${finalKey}` }
        });
        if (!response.ok) {
          throw new Error(`Groq API returned status ${response.status}`);
        }
        const data: any = await response.json();
        if (data.data) {
          models = data.data.map((m: any) => m.id);
        }
      } else if (provider === 'openrouter') {
        const response = await fetch(`https://openrouter.ai/api/v1/models`);
        if (!response.ok) {
          throw new Error(`OpenRouter API returned status ${response.status}`);
        }
        const data: any = await response.json();
        if (data.data) {
          models = data.data.map((m: any) => m.id);
        }
      } else if (provider === 'mistral') {
        const response = await fetch(`https://api.mistral.ai/v1/models`, {
          headers: { 'Authorization': `Bearer ${finalKey}` }
        });
        if (!response.ok) {
          throw new Error(`Mistral API returned status ${response.status}`);
        }
        const data: any = await response.json();
        if (data.data) {
          models = data.data.map((m: any) => m.id);
        }
      } else if (provider === 'deepseek') {
        const response = await fetch(`https://api.deepseek.com/v1/models`, {
          headers: { 'Authorization': `Bearer ${finalKey}` }
        });
        if (!response.ok) {
          throw new Error(`DeepSeek API returned status ${response.status}`);
        }
        const data: any = await response.json();
        if (data.data) {
          models = data.data.map((m: any) => m.id);
        }
      } else if (provider === 'routeway') {
        const response = await fetch(`https://api.routeway.ai/v1/models`, {
          headers: finalKey ? { 'Authorization': `Bearer ${finalKey}` } : {}
        });
        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          throw new Error(`Routeway API returned status ${response.status}: ${errText.substring(0, 100)}`);
        }
        const responseText = await response.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          throw new Error(`فشل تحليل استجابة Routeway (Invalid JSON).`);
        }
        if (data.data) {
          models = data.data.map((m: any) => m.id);
        }
      } else {
        return res.status(400).json({ error: "المزود غير مدعوم للتحديث التلقائي" });
      }

      // Filter empty and dedup (preserve curated priority order for Gemini)
      models = Array.from(new Set(models.filter(m => !!m)));
      if (provider !== 'gemini') {
        models.sort();
      }

      if (models.length === 0) {
        throw new Error("لم يتم العثور على أي نماذج نشطة للمزود");
      }

      res.status(200).json({ models });
    } catch (error: any) {
      console.error(`Error fetching models for ${provider}:`, error);
      res.status(500).json({ error: error.message || "فشل جلب النماذج من المصدر" });
    }
  });

  // Proxy endpoint for AI providers (Mistral, Groq, OpenRouter, Routeway, etc.)
  app.post("/api/proxy/:provider", async (req, res) => {
    const { provider } = req.params;
    const { baseURL, apiKey, endpoint, ...body } = req.body;

    if (!baseURL) {
      return res.status(400).json({ error: "baseURL is required" });
    }

    const serverKey = 
      provider === 'groq' ? getEnvKey(process.env.GROQ_API_KEY) :
      provider === 'openrouter' ? getEnvKey(process.env.OPENROUTER_API_KEY) :
      provider === 'mistral' ? getEnvKey(process.env.MISTRAL_API_KEY) :
      provider === 'routeway' ? getEnvKey(process.env.ROUTEWAY_API_KEY) :
      provider === 'deepseek' ? getEnvKey(process.env.DEEPSEEK_API_KEY) : 
      provider === 'stability' ? getEnvKey(process.env.STABILITY_API_KEY) :
      provider === 'gemini' ? getFinalKey(process.env.GEMINI_API_KEY) : undefined;
    
    const finalKey = provider === 'gemini' 
      ? (getFinalKey(apiKey) || serverKey) 
      : (getEnvKey(apiKey) || serverKey || (['openrouter', 'routeway', 'pollinations'].includes(provider) ? 'free-access-key' : undefined));

    if (!finalKey) {
      console.error(`Missing API key for provider: ${provider}. apiKey from client: ${!!apiKey}, serverKey from env: ${!!serverKey}`);
      return res.status(401).json({ error: { message: `API key for ${provider} not found on server or client.` } });
    }

    try {
      // Determine the full URL. If baseURL already contains the endpoint, use it.
      // Otherwise, default to /chat/completions for text models.
      const isImageRequest = !!body.prompt && !body.messages;
      const defaultEndpoint = endpoint || (isImageRequest ? '/images/generations' : '/chat/completions');
      
      const fullURL = baseURL.includes('/images/generations') || baseURL.includes('/chat/completions') || baseURL.includes('/completions') 
        ? baseURL 
        : `${baseURL}${defaultEndpoint}`;

      const response = await fetch(fullURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${finalKey}`,
          'HTTP-Referer': (req.headers.origin as string) || (req.headers.referer as string) || 'https://ai.studio',
          'X-Title': 'Midad Al Rahman',
          'Accept': 'image/*' // Add Accept header for image providers
        },
        body: JSON.stringify(body)
      });

      const contentType = response.headers.get('content-type');
      if (contentType && (contentType.includes('image/') || contentType.includes('application/octet-stream'))) {
        const buffer = await response.arrayBuffer();
        res.setHeader('Content-Type', contentType);
        res.send(Buffer.from(buffer));
        return;
      }

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`Failed to parse JSON from ${provider}:`, responseText.substring(0, 200));
        return res.status(response.status).json({ 
          error: { message: `استجابة غير صالحة من المزود (Invalid JSON). الحالة: ${response.status}` },
          rawResponse: responseText.substring(0, 500)
        });
      }
      
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error(`Proxy error for ${provider}:`, error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Deep Research Endpoint
  app.post("/api/research", async (req, res) => {
    try {
      const { prompt, apiKey } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const keyToUse = getFinalKey(apiKey);
      if (!keyToUse) {
        return res.status(400).json({ error: "Gemini API Key is required" });
      }

      const ai = createGeminiClient(keyToUse);
      const candidateAgents = [
        'deep-research-preview-04-2026',
        'deep-research-pro-preview',
        'deep-research-preview',
        'deep-research-agent'
      ];

      let lastError: any = null;
      let interaction: any = null;

      for (const agentName of candidateAgents) {
        try {
          interaction = await ai.interactions.create({
            agent: agentName,
            input: prompt,
            background: true
          });
          if (interaction && interaction.id) {
            break;
          }
        } catch (err) {
          lastError = err;
        }
      }

      if (interaction && interaction.id) {
        return res.status(200).json({ interactionId: interaction.id, status: interaction.status });
      }

      throw lastError || new Error("Deep research agent unavailable");
    } catch (error: any) {
      console.error("Deep Research API Error:", error);
      res.status(500).json({ error: extractErrorMessage(error, "فشل بدء البحث العميق"), canFallback: true });
    }
  });

  // Deep Research Status Endpoint
  app.get("/api/research/status", async (req, res) => {
    try {
      const { interactionId, apiKey } = req.query;
      if (!interactionId) {
        return res.status(400).json({ error: "Interaction ID is required" });
      }

      const keyToUse = getFinalKey(apiKey as string);
      if (!keyToUse) {
        return res.status(400).json({ error: "Gemini API Key is required" });
      }

      const ai = createGeminiClient(keyToUse);
      const interaction = await ai.interactions.get(interactionId as string) as any;

      let fullReport = "";
      if (interaction.status === "completed" && interaction.steps) {
        for (const step of interaction.steps) {
          if (step.type === 'model_output') {
            const textContent = step.content?.find((c: any) => c.type === 'text');
            if (textContent) fullReport += textContent.text;
          }
        }
      }

      res.status(200).json({ 
        status: interaction.status, 
        text: fullReport, 
        error: interaction.error 
      });
    } catch (error: any) {
      console.error("Deep Research Status Error:", error);
      res.status(500).json({ error: extractErrorMessage(error, "فشل جلب حالة البحث العميق") });
    }
  });

  // Explicit manifest endpoint for both dev and prod to ensure PWA installability behind auth proxies
  app.get(["/manifest.webmanifest", "/manifest.json"], (_req, res) => {
    res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.json({
      id: "/",
      name: "Mydad live",
      short_name: "Mydad live",
      description: "«مِـدَادُ الـرَّحْـمَـنِ»«مِـنَـصَّـةٌ قُـرْآنِـيَّـةٌ مُـتَـكَـامِـلَـةٌ تَـجْـمَـعُ بَـيْـنَ تِـلَاوَةِ الْـمُـصْـحَـفِ الـشَّـرِيفِ وَتَـفْـسِـيرِهِ، مَـعَ أَدَوَاتٍ يَـوْمِـيَّـةٍ مُـسَـاعِـدَةٍ تَـشْـمَـلُ مَـوَاقِـيـتَ الـصَّـلَاةِ، الْـقِـبْـلَـةَ، الْأَذْكَـارَ، الـسُّـبْـحَـةَ، وَالْـمُـفَـكِّـرَةَ الْـهِـجْـرِيَّـةَ.»",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#0c0a09",
      theme_color: "#101825",
      lang: "ar",
      dir: "rtl",
      orientation: "portrait-primary",
      icons: [
        {
          src: "/pwa-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any"
        },
        {
          src: "/pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any"
        },
        {
          src: "/pwa-maskable-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable"
        }
      ]
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const cwdDist = path.join(process.cwd(), 'dist');
    const distPath = fs.existsSync(path.join(cwdDist, 'index.html')) ? cwdDist : __dirname;
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.webmanifest')) {
          res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else if (
          filePath.endsWith('sw.js') ||
          filePath.endsWith('registerSW.js') ||
          filePath.endsWith('index.html') ||
          filePath.endsWith('pwa-192x192.png') ||
          filePath.endsWith('pwa-512x512.png') ||
          filePath.endsWith('pwa-maskable-512x512.png') ||
          filePath.endsWith('apple-touch-icon.png') ||
          filePath.endsWith('favicon.ico')
        ) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      },
    }));
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Attach WebSocket Server for Gemini Live Realtime Audio API
  const wss = new WebSocketServer({ server, path: "/api/live" });

  wss.on("connection", async (clientWs, req) => {
    const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const clientKey = urlObj.searchParams.get("apiKey");
    const voiceName = urlObj.searchParams.get("voice") || "Zephyr";
    const requestedModel = urlObj.searchParams.get("model") || "gemini-3.8-live";
    const finalKey = getFinalKey(clientKey || undefined);

    if (!finalKey) {
      clientWs.send(JSON.stringify({ type: 'error', error: "مفتاح Gemini API غير متاح على الخادم" }));
      clientWs.close();
      return;
    }

    const candidateModels = Array.from(new Set([
      requestedModel,
      "gemini-3.8-live",
      "gemini-3.8-live-extended-thinking",
      "gemini-3.1-flash-live-preview",
      "gemini-3.8-flash",
      "gemini-3.5-live-translate-preview"
    ].filter(Boolean)));

    let session: any = null;

    for (const modelName of candidateModels) {
      try {
        const ai = createGeminiClient(finalKey);

        session = await ai.live.connect({
          model: modelName,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName as any } }
            },
            systemInstruction: "أنت «مداد الرحمن» - القارئ والمقرئ المجود وخبير القراءات والتجويد والمكتبة الإسلامية. لديك القدرة الكاملة على تلاوة وترتيل وقراءة آيات القرآن الكريم، وشرح أحكام التجويد ومخارج الحروف، والرد على أسئلة العلوم الشرعية. لا تقل أبداً أنك لا تملك القدرة على القراءة أو أن دورك يقتصر على اختيار قراء آخرين؛ بل أنت مقرئ ومعلم وقارئ مجود مبارك. تتحدث بصوت فصيح ومطمئن باللغة العربية الفصحى. لديك القدرة الكاملة على رؤية شاشة المستخدم والتحكم في كل مفاصل التطبيق بدقة متناهية. \n\nعندما يطلب المستخدم تلاوة آية معينة أو تشغيل تلاوة لقارئ، يمكنك استخدام أداة control_app مع تحديد رقم السورة (surah) ورقم الآية (ayah) بدقة، وفي نفس الوقت قم بقراءة الآية وترتيلها بصوتك المقرئ الخاشع. \n\nمهامك تشمل:\n1. تلاوة وقراءة وترتيل آيات القرآن الكريم وشرح أحكام التجويد بدقة.\n2. تحليل شاشة المستخدم (إذا شاركها) ومساعدته في ما يقرأ.\n3. التحكم في التلاوة (تغيير السورة، الآية، القارئ).\n4. فتح الميزات (القبلة، المواقيت، التسبيح، إلخ).\n5. البحث في القرآن والحديث بذكاء.\n\nكن دقيقاً جداً في أرقام الآيات والسور. إذا طلب المستخدم تلاوة من الآية 13 من سورة معينة، تأكد من إرسال params: { surah: X, ayah: 13 }.",
            outputAudioTranscription: {},
            inputAudioTranscription: {},
            tools: islamicTools as any
          },
          callbacks: {
            onmessage: async (message: LiveServerMessage) => {
              if (message.toolCall) {
                const toolResponses: any[] = [];
                for (const call of message.toolCall.functionCalls) {
                  const result = await executeIslamicTool(call.name, call.args, clientWs);
                  toolResponses.push({
                    name: call.name,
                    id: call.id,
                    response: { result }
                  });
                }
                session.sendRealtimeInput({
                  toolResponse: { functionResponses: toolResponses }
                });
                return;
              }

              const parts = message.serverContent?.modelTurn?.parts;
              if (parts && parts.length > 0) {
                for (const part of parts) {
                  if (part.inlineData?.data) {
                    clientWs.send(JSON.stringify({ type: 'audio', audio: part.inlineData.data }));
                  }
                  if (part.text) {
                    clientWs.send(JSON.stringify({ type: 'text', text: part.text }));
                  }
                }
              }
              if (message.serverContent?.interrupted) {
                clientWs.send(JSON.stringify({ type: 'interrupted' }));
              }
              if (message.serverContent?.turnComplete) {
                clientWs.send(JSON.stringify({ type: 'turnComplete' }));
              }
            },
            onerror: (err: any) => {
              console.error("[WS Live Session Error]", err);
              clientWs.send(JSON.stringify({ type: 'error', error: err?.message || "حدث خطأ في جلسة Gemini Live" }));
            },
            onclose: () => {
              clientWs.send(JSON.stringify({ type: 'closed' }));
            }
          }
        });

        clientWs.send(JSON.stringify({ type: 'connected', model: modelName }));
        break;
      } catch (err: any) {
        console.warn(`[WS Live] Model ${modelName} failed to connect:`, err?.message || err);
      }
    }

    if (!session) {
      clientWs.send(JSON.stringify({ type: 'error', error: "تعذر بدء محادثة الصوت المباشرة عبر Gemini Live حالياً." }));
      clientWs.close();
      return;
    }

    clientWs.on("message", (rawData) => {
      try {
        const msg = JSON.parse(rawData.toString());
        if (msg.audio) {
          session.sendRealtimeInput({
            audio: { data: msg.audio, mimeType: "audio/pcm;rate=16000" }
          });
        } else if (msg.image) {
          // Handle screen sharing frames
          session.sendRealtimeInput({
            media: { data: msg.image, mimeType: "image/jpeg" }
          });
        } else if (msg.text) {
          session.sendRealtimeInput({
            text: msg.text
          });
        }
      } catch (e) {
        console.error("[WS Live] Client message parse error:", e);
      }
    });

    clientWs.on("close", () => {
      try {
        if (session) session.close();
      } catch (_) {}
    });
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
