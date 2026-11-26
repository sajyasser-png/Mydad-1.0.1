import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import {
  Maximize2,
  X,
  ExternalLink,
  Image as ImageIcon,
  Film,
  Loader2,
  Play,
  Code2,
} from 'lucide-react';

export type MediaType = 'image' | 'video' | 'youtube' | 'vimeo' | 'audio' | 'link';

export interface DetectedMedia {
  type: MediaType;
  url: string;
  embedUrl?: string;
}

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif|jfif|apng|ico)(\?.*|#.*)?$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|m4v|ogv|3gp|mkv)(\?.*|#.*)?$/i;
const AUDIO_EXTENSIONS = /\.(mp3|wav|m4a|aac|ogg|flac)(\?.*|#.*)?$/i;

export function unescapeHtml(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function isSafeHttpOrDataUrl(rawUrl: string): boolean {
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;
  return (
    /^https?:\/\//i.test(trimmed) ||
    /^data:(image|video|audio)\//i.test(trimmed) ||
    /^blob:/i.test(trimmed)
  );
}

export function extractYouTubeId(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{6,20}$/.test(id) ? id : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (parsed.pathname === '/watch') {
        const v = parsed.searchParams.get('v');
        return v && /^[a-zA-Z0-9_-]{6,20}$/.test(v) ? v : null;
      }
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length >= 2 && ['shorts', 'embed', 'live', 'v'].includes(parts[0])) {
        return /^[a-zA-Z0-9_-]{6,20}$/.test(parts[1]) ? parts[1] : null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function extractVimeoId(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    if (host === 'vimeo.com') {
      const match = parsed.pathname.match(/^\/(\d+)/);
      return match ? match[1] : null;
    }
    if (host === 'player.vimeo.com') {
      const match = parsed.pathname.match(/^\/video\/(\d+)/);
      return match ? match[1] : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function detectMediaUrl(rawUrl?: string): DetectedMedia | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const url = unescapeHtml(rawUrl.trim()).replace(/[.,;،؛!?]+$/, '');
  if (!isSafeHttpOrDataUrl(url)) return null;

  if (/^data:image\//i.test(url)) return { type: 'image', url };
  if (/^data:video\//i.test(url)) return { type: 'video', url };
  if (/^data:audio\//i.test(url)) return { type: 'audio', url };

  const ytId = extractYouTubeId(url);
  if (ytId) {
    return {
      type: 'youtube',
      url,
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?rel=0`,
    };
  }

  const vimeoId = extractVimeoId(url);
  if (vimeoId) {
    return {
      type: 'vimeo',
      url,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
    };
  }

  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const host = parsed.hostname.toLowerCase();
    const search = parsed.search.toLowerCase();

    if (VIDEO_EXTENSIONS.test(pathname) || /[?&](mime|type)=video/i.test(search)) {
      return { type: 'video', url };
    }

    if (AUDIO_EXTENSIONS.test(pathname) || /[?&](mime|type)=audio/i.test(search)) {
      return { type: 'audio', url };
    }

    if (
      IMAGE_EXTENSIONS.test(pathname) ||
      /[?&](format|fm|ext)=(jpg|jpeg|png|gif|webp|avif|svg)/i.test(search) ||
      /[?&](mime|type)=image/i.test(search)
    ) {
      return { type: 'image', url };
    }

    // Known dynamic image CDN hosts that often serve images without file extensions
    if (
      host === 'image.pollinations.ai' ||
      (host.endsWith('pollinations.ai') && pathname.startsWith('/p/')) ||
      (host === 'images.unsplash.com' && pathname.startsWith('/photo-')) ||
      host === 'images.pexels.com' ||
      host === 'lh3.googleusercontent.com' ||
      (host === 'pbs.twimg.com' && pathname.startsWith('/media/')) ||
      host === 'oaidalleapiprodscus.blob.core.windows.net' ||
      (host === 'upload.wikimedia.org' &&
        pathname.includes('/wikipedia/commons/') &&
        !/\.(pdf|html|txt)$/i.test(pathname))
    ) {
      return { type: 'image', url };
    }
  } catch {
    return null;
  }

  return { type: 'link', url };
}

const MediaImage: React.FC<{ src: string; alt?: string }> = memo(({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setError(false);
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    } else {
      setLoaded(false);
    }
  }, [src]);

  if (error) {
    return (
      <span className="my-2 inline-flex items-center gap-2 rounded-xl border border-amber-300/40 bg-amber-50/60 dark:bg-zinc-800/60 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
        <ImageIcon className="w-4 h-4 shrink-0 opacity-70" />
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="underline break-all hover:text-amber-600 dark:hover:text-amber-300"
        >
          {alt || src}
        </a>
      </span>
    );
  }

  return (
    <>
      <span className="block my-3 overflow-hidden rounded-2xl border border-amber-200/50 dark:border-amber-800/40 bg-amber-50/40 dark:bg-black/30 shadow-sm relative group/media-img max-w-xl w-full">
        <span
          className={`block relative w-full overflow-hidden bg-black/5 dark:bg-black/30 ${
            !loaded ? 'h-[240px]' : ''
          }`}
        >
          {!loaded && (
            <span className="absolute inset-0 flex items-center justify-center gap-2 px-4 text-xs text-amber-800/75 dark:text-amber-200/75 pointer-events-none">
              <Loader2 className="w-5 h-5 animate-spin text-amber-600 dark:text-amber-400" />
              <span>جاري تحميل الصورة...</span>
            </span>
          )}
          <img
            ref={imgRef}
            src={src}
            alt={alt || 'صورة'}
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            onClick={() => setLightboxOpen(true)}
            className={`w-full max-h-[420px] object-contain cursor-zoom-in transition-opacity duration-200 block ${
              loaded ? 'opacity-100 relative' : 'opacity-0 absolute inset-0 h-full'
            }`}
          />
        </span>
        <span className="flex items-center justify-between gap-2 px-3 h-8 bg-black/5 dark:bg-white/5 text-[11px] text-amber-900/80 dark:text-amber-200/80 border-t border-amber-200/30 dark:border-white/10">
          <span className="truncate">{alt && alt !== src ? alt : 'صورة'}</span>
          <span className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="p-1 rounded-md hover:bg-amber-200/50 dark:hover:bg-white/10 transition-colors"
              title="تكبير الصورة"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-md hover:bg-amber-200/50 dark:hover:bg-white/10 transition-colors"
              title="فتح في تبويب جديد"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </span>
        </span>
      </span>

      {lightboxOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={src}
            alt={alt || 'صورة'}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body
      )}
    </>
  );
});

const MediaVideo: React.FC<{ src: string; title?: string }> = memo(({ src, title }) => {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  if (error) {
    return (
      <span className="my-2 inline-flex items-center gap-2 rounded-xl border border-amber-300/40 bg-amber-50/60 dark:bg-zinc-800/60 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
        <Film className="w-4 h-4 shrink-0 opacity-70" />
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="underline break-all hover:text-amber-600 dark:hover:text-amber-300"
        >
          {title || src}
        </a>
      </span>
    );
  }

  return (
    <span className="block my-3 overflow-hidden rounded-2xl border border-amber-200/50 dark:border-amber-800/40 bg-black shadow-lg max-w-xl w-full">
      <video
        src={src}
        controls
        playsInline
        preload="metadata"
        onError={() => setError(true)}
        className="w-full aspect-video max-h-[420px] object-contain bg-black block"
      />
      <span className="flex items-center justify-between gap-2 px-3 h-8 bg-zinc-900/90 text-[11px] text-amber-200/90 border-t border-zinc-800">
        <span className="flex items-center gap-1.5 truncate">
          <Play className="w-3 h-3 shrink-0 text-amber-400" />
          <span className="truncate">{title && title !== src ? title : 'فيديو'}</span>
        </span>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 rounded-md hover:bg-white/10 transition-colors shrink-0"
          title="فتح الفيديو في تبويب جديد"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </span>
    </span>
  );
});

const MediaIframeEmbed: React.FC<{
  embedUrl: string;
  originalUrl: string;
  title?: string;
}> = memo(({ embedUrl, originalUrl, title }) => (
  <span className="block my-3 overflow-hidden rounded-2xl border border-amber-200/50 dark:border-amber-800/40 bg-black shadow-lg max-w-xl w-full">
    <span className="block relative w-full aspect-video">
      <iframe
        src={embedUrl}
        title={title || 'فيديو'}
        className="absolute inset-0 w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </span>
    <span className="flex items-center justify-between gap-2 px-3 h-8 bg-zinc-900/90 text-[11px] text-amber-200/90 border-t border-zinc-800">
      <span className="flex items-center gap-1.5 truncate">
        <Film className="w-3 h-3 shrink-0 text-amber-400" />
        <span className="truncate">{title && title !== originalUrl ? title : 'مشغل الفيديو'}</span>
      </span>
      <a
        href={originalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-white/10 transition-colors shrink-0"
      >
        <span>فتح الرابط</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </span>
  </span>
));

const MediaAudio: React.FC<{ src: string; title?: string }> = memo(({ src, title }) => (
  <span className="block my-3 p-3 rounded-2xl border border-amber-200/50 dark:border-amber-800/40 bg-amber-50/60 dark:bg-zinc-900/80 shadow-sm max-w-xl w-full">
    {title && title !== src && (
      <span className="block text-xs font-bold text-amber-900 dark:text-amber-200 mb-2 truncate">
        {title}
      </span>
    )}
    <audio src={src} controls preload="metadata" className="w-full h-10" />
  </span>
));

const MediaEmbed: React.FC<{ media: DetectedMedia; label?: string }> = memo(({ media, label }) => {
  switch (media.type) {
    case 'image':
      return <MediaImage src={media.url} alt={label} />;
    case 'video':
      return <MediaVideo src={media.url} title={label} />;
    case 'youtube':
    case 'vimeo':
      return media.embedUrl ? (
        <MediaIframeEmbed embedUrl={media.embedUrl} originalUrl={media.url} title={label} />
      ) : null;
    case 'audio':
      return <MediaAudio src={media.url} title={label} />;
    default:
      return null;
  }
});

export const HtmlPreviewBlock: React.FC<{ code: string }> = memo(({ code }) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = useState<number>(180);
  const [ready, setReady] = useState<boolean>(false);

  const cleanCode = unescapeHtml(code.trim());

  const fullIframeDoc = useMemo(
    () => `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script>
    window.onerror = function() { return true; };
    window.addEventListener('unhandledrejection', function(e) { if (e && e.preventDefault) e.preventDefault(); });
  </script>
  <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Cairo:wght@400;600;700;800&family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      height: auto !important;
      min-height: 0 !important;
      background: transparent !important;
      font-family: 'Cairo', 'Tajawal', sans-serif;
      overflow: hidden;
    }
    #midad-html-root {
      display: flow-root;
      width: 100%;
    }
    img, video {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
    }
  </style>
</head>
<body>
  <div id="midad-html-root">${cleanCode}</div>
  <script>
    (function() {
      var lastSent = 0;
      function sendHeight() {
        try {
          var root = document.getElementById('midad-html-root');
          if (!root) return;
          var rectHeight = Math.ceil(root.getBoundingClientRect().height);
          var h = Math.max(rectHeight, root.scrollHeight || 0);
          if (h > 0 && Math.abs(h - lastSent) > 2 && window.parent) {
            lastSent = h;
            window.parent.postMessage({ type: 'midad-iframe-height', height: h }, '*');
          }
        } catch (err) {}
      }
      try {
        var rootEl = document.getElementById('midad-html-root');
        if (window.ResizeObserver && rootEl) {
          new ResizeObserver(sendHeight).observe(rootEl);
        }
      } catch (err) {}
      window.addEventListener('load', sendHeight);
      try {
        document.querySelectorAll('img').forEach(function(img) {
          img.setAttribute('referrerpolicy', 'no-referrer');
          img.addEventListener('load', sendHeight);
          img.addEventListener('error', sendHeight);
        });
      } catch (err) {}
      setTimeout(sendHeight, 60);
      setTimeout(sendHeight, 350);
    })();
  </script>
</body>
</html>`,
    [cleanCode]
  );

  const syncHeightFromDom = () => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      const root = doc.getElementById('midad-html-root');
      if (!root) return;
      const measured = Math.ceil(Math.max(root.getBoundingClientRect().height, root.scrollHeight || 0));
      if (measured > 0) {
        setHeight((prev) => (Math.abs(prev - measured) > 2 ? measured : prev));
        setReady(true);
      }
    } catch {
      setReady(true);
    }
  };

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (
        e.source === iframeRef.current?.contentWindow &&
        e.data?.type === 'midad-iframe-height' &&
        typeof e.data.height === 'number' &&
        e.data.height > 0
      ) {
        const next = Math.ceil(e.data.height);
        setHeight((prev) => (Math.abs(prev - next) > 2 ? next : prev));
        setReady(true);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <div className="my-2 w-full overflow-hidden relative" dir="rtl">
      {!ready && (
        <div className="h-[180px] rounded-2xl border border-amber-200/40 dark:border-amber-800/30 bg-amber-50/30 dark:bg-black/20 flex items-center justify-center gap-2 text-xs text-amber-800/70 dark:text-amber-200/70">
          <Loader2 className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400" />
          <span>جاري تجهيز العرض...</span>
        </div>
      )}
      <iframe
        ref={iframeRef}
        srcDoc={fullIframeDoc}
        title="محتوى بصري"
        onLoad={syncHeightFromDom}
        style={{ height: `${height}px` }}
        className={`w-full border-0 bg-transparent block overflow-hidden transition-opacity duration-200 ${
          ready ? 'opacity-100' : 'opacity-0 absolute top-0 left-0 pointer-events-none'
        }`}
        scrolling="no"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
});

function isSimpleMediaHtml(code: string): boolean {
  const lower = unescapeHtml(code).trim().toLowerCase();
  const hasMediaTag =
    /<img\b/i.test(lower) || /<video\b/i.test(lower) || /<audio\b/i.test(lower);
  const hasComplexLayout =
    /<(div|section|article|table|svg|style|script|header|footer|main|nav|ul|ol|form|canvas|figure|blockquote)\b/i.test(
      lower
    );
  return hasMediaTag && !hasComplexLayout;
}

function isHtmlLike(lang: string, codeStr: string): boolean {
  if (lang === 'html' || lang === 'svg' || lang === 'xml') return true;
  const unescaped = unescapeHtml(codeStr).toLowerCase().trim();
  return (
    unescaped.includes('<div') ||
    unescaped.includes('</div>') ||
    unescaped.includes('<span') ||
    unescaped.includes('</span>') ||
    unescaped.includes('<style') ||
    unescaped.includes('</style>') ||
    unescaped.includes('<svg') ||
    unescaped.includes('</svg>') ||
    unescaped.includes('<img') ||
    unescaped.includes('<video') ||
    unescaped.includes('<audio') ||
    unescaped.includes('<iframe') ||
    unescaped.includes('<figure') ||
    unescaped.includes('<section') ||
    unescaped.includes('<article') ||
    unescaped.includes('<table') ||
    unescaped.includes('<blockquote') ||
    unescaped.includes('<canvas') ||
    unescaped.includes('<ul') ||
    unescaped.includes('</ul>') ||
    unescaped.includes('<li') ||
    unescaped.includes('</li>') ||
    unescaped.includes('<p') ||
    unescaped.includes('</p>') ||
    unescaped.includes('<a ') ||
    unescaped.includes('style=') ||
    unescaped.includes('class=') ||
    (unescaped.startsWith('<') && unescaped.includes('>'))
  );
}

function extractMediaFromText(text: string): DetectedMedia[] {
  const matches = text.match(/https?:\/\/[^\s"'`<>()[\]]+/gi) || [];
  const seen = new Set<string>();
  const results: DetectedMedia[] = [];
  for (const raw of matches) {
    const detected = detectMediaUrl(raw);
    if (detected && detected.type !== 'link' && !seen.has(detected.url)) {
      seen.add(detected.url);
      results.push(detected);
    }
  }
  return results;
}

function isPurelyUrlsOrMarkdownMedia(lang: string, codeStr: string): boolean {
  if (lang === 'markdown' || lang === 'md') return true;
  const nonEmptyLines = codeStr
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (nonEmptyLines.length === 0) return false;

  const isMediaOrLinkLine = (line: string) =>
    /^https?:\/\/\S+$/i.test(line) ||
    /^!?\[[^\]]*\]\(https?:\/\/[^)]+\)$/i.test(line);

  if (nonEmptyLines.every(isMediaOrLinkLine)) {
    return nonEmptyLines.some((line) => extractMediaFromText(line).length > 0);
  }

  if (
    (!lang || lang === 'text' || lang === 'txt') &&
    /!?\[[^\]]*\]\(https?:\/\/[^)]+\)/i.test(codeStr) &&
    !/[{}]|=>|;\s*$/m.test(codeStr) &&
    extractMediaFromText(codeStr).length > 0
  ) {
    return true;
  }

  return false;
}

function preprocessMarkdown(raw: string, isStreaming: boolean): { text: string; unclosedStreamingFence: boolean } {
  // Separate Arabic letters or punctuation stuck immediately before https:// so remarkGfm autolinks them reliably
  let text = raw.replace(/([\u0600-\u06FF:،؛])(https?:\/\/)/g, '$1 $2');
  let unclosedStreamingFence = false;

  if (isStreaming) {
    // Detect unclosed trailing fenced code block while streaming so we don't remount an iframe or split markdown mid-block
    const fenceMatches = text.match(/^```/gm);
    if (fenceMatches && fenceMatches.length % 2 === 1) {
      unclosedStreamingFence = true;
      const lastFenceIdx = text.lastIndexOf('```');
      if (lastFenceIdx !== -1) {
        const fenceBlock = text.slice(lastFenceIdx);
        const firstNewline = fenceBlock.indexOf('\n');
        const langLine = firstNewline !== -1 ? fenceBlock.slice(3, firstNewline).trim().toLowerCase() : fenceBlock.slice(3).trim().toLowerCase();
        // Replace trailing unclosed HTML/SVG/MD code block with a stable non-iframe placeholder marker
        if (!langLine || langLine === 'html' || langLine === 'svg' || langLine === 'xml' || langLine === 'markdown' || langLine === 'md') {
          text = text.slice(0, lastFenceIdx) + '\n```midad-streaming-block\n' + (firstNewline !== -1 ? fenceBlock.slice(firstNewline + 1) : '') + '\n```\n';
        }
      }
    }

    // While streaming, prevent partial URLs at the very tail of the response from loading mid-token
    text = text.replace(/(^|\s)(https?:\/\/[^\s"'`<>()[\]]+)$/i, '$1`$2`');
  }

  return { text, unclosedStreamingFence };
}

function createMarkdownComponents(isUserMessage: boolean, isNested: boolean) {
  const MarkdownLink = ({ href, children, ...props }: any) => {
    const media = detectMediaUrl(href);
    const childText =
      typeof children === 'string'
        ? children
        : Array.isArray(children)
          ? children.map((c) => (typeof c === 'string' ? c : '')).join('')
          : undefined;

    if (media && media.type !== 'link') {
      return <MediaEmbed media={media} label={childText} />;
    }

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`underline underline-offset-2 break-all ${
          isUserMessage
            ? 'text-amber-100 hover:text-white'
            : 'text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100'
        }`}
        {...props}
      >
        {children}
      </a>
    );
  };

  const MarkdownImg = ({ src, alt }: any) => {
    if (!src || typeof src !== 'string') return null;
    const media = detectMediaUrl(src);
    if (media && media.type !== 'image' && media.type !== 'link') {
      return <MediaEmbed media={media} label={alt} />;
    }
    if (!isSafeHttpOrDataUrl(src)) return null;
    return <MediaImage src={src} alt={alt} />;
  };

  const MarkdownVideo = ({ src, children, title }: any) => {
    let resolvedSrc = src;
    if (!resolvedSrc && children) {
      for (const ch of React.Children.toArray(children)) {
        if (React.isValidElement(ch) && (ch.props as any)?.src) {
          resolvedSrc = (ch.props as any).src;
          break;
        }
      }
    }
    if (!resolvedSrc || !isSafeHttpOrDataUrl(resolvedSrc)) return null;
    return <MediaVideo src={resolvedSrc} title={title} />;
  };

  const MarkdownAudio = ({ src, children, title }: any) => {
    let resolvedSrc = src;
    if (!resolvedSrc && children) {
      for (const ch of React.Children.toArray(children)) {
        if (React.isValidElement(ch) && (ch.props as any)?.src) {
          resolvedSrc = (ch.props as any).src;
          break;
        }
      }
    }
    if (!resolvedSrc || !isSafeHttpOrDataUrl(resolvedSrc)) return null;
    return <MediaAudio src={resolvedSrc} title={title} />;
  };

  const MarkdownIframe = ({ src, title }: any) => {
    if (!src || typeof src !== 'string') return null;
    const ytId = extractYouTubeId(src);
    const vimeoId = extractVimeoId(src);
    if (ytId) {
      return (
        <MediaIframeEmbed
          embedUrl={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0`}
          originalUrl={src}
          title={title}
        />
      );
    }
    if (vimeoId) {
      return (
        <MediaIframeEmbed
          embedUrl={`https://player.vimeo.com/video/${vimeoId}`}
          originalUrl={src}
          title={title}
        />
      );
    }
    return null;
  };

  const MarkdownPre = ({ children, ...props }: any) => {
    const codeElement = React.Children.toArray(children).find((ch) =>
      React.isValidElement(ch)
    ) as React.ReactElement<any> | undefined;

    if (codeElement && codeElement.props) {
      const className = codeElement.props.className || '';
      const match = /language-([\w-]+)/.exec(className);
      const lang = match ? match[1].toLowerCase() : '';
      const codeStr = String(codeElement.props.children || '').replace(/\n$/, '');

      if (lang === 'midad-streaming-block') {
        return (
          <div
            className="my-2 p-4 rounded-2xl border border-amber-200/40 dark:border-amber-800/30 bg-amber-50/40 dark:bg-black/20 flex items-center gap-2.5 text-xs text-amber-800/80 dark:text-amber-200/80 h-[72px]"
            dir="rtl"
          >
            <Loader2 className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400 shrink-0" />
            <Code2 className="w-4 h-4 text-amber-600/70 dark:text-amber-400/70 shrink-0" />
            <span>جاري إعداد وتنسيق المعاينة البصرية...</span>
          </div>
        );
      }

      if (!isNested && (lang === 'markdown' || lang === 'md' || isPurelyUrlsOrMarkdownMedia(lang, codeStr))) {
        return (
          <div className="my-2">
            <ChatMarkdownRenderer
              content={codeStr}
              isUserMessage={isUserMessage}
              isNested
            />
          </div>
        );
      }

      if (isHtmlLike(lang, codeStr)) {
        if (!isNested && isSimpleMediaHtml(codeStr)) {
          return (
            <div className="my-2">
              <ChatMarkdownRenderer
                content={unescapeHtml(codeStr)}
                isUserMessage={isUserMessage}
                isNested
              />
            </div>
          );
        }
        return <HtmlPreviewBlock code={codeStr} />;
      }

      const embeddedMedia = extractMediaFromText(codeStr);
      if (embeddedMedia.length > 0) {
        return (
          <div className="my-3 space-y-2">
            <pre className="p-4 rounded-xl bg-zinc-950 text-amber-200 text-xs font-mono overflow-x-auto" dir="ltr" {...props}>
              {children}
            </pre>
            <div className="space-y-2">
              {embeddedMedia.map((media, idx) => (
                <MediaEmbed key={`${media.url}-${idx}`} media={media} />
              ))}
            </div>
          </div>
        );
      }
    }

    return (
      <pre className="p-4 rounded-xl bg-zinc-950 text-amber-200 text-xs font-mono overflow-x-auto" dir="ltr" {...props}>
        {children}
      </pre>
    );
  };

  const MarkdownCode = ({ className, children, ...props }: any) => {
    const codeStr = String(children).replace(/\n$/, '');
    const trimmed = codeStr.trim();

    if (!className && !codeStr.includes('\n')) {
      const directMedia = detectMediaUrl(trimmed);
      if (directMedia && directMedia.type !== 'link') {
        return <MediaEmbed media={directMedia} />;
      }

      const mdMediaMatch = /^(!?)\[([^\]]*)\]\((https?:\/\/[^)]+)\)$/i.exec(trimmed);
      if (mdMediaMatch) {
        const mdMedia = detectMediaUrl(mdMediaMatch[3]);
        if (mdMedia && mdMedia.type !== 'link') {
          return <MediaEmbed media={mdMedia} label={mdMediaMatch[2]} />;
        }
        if (mdMediaMatch[1] === '!' && isSafeHttpOrDataUrl(mdMediaMatch[3])) {
          return <MediaImage src={mdMediaMatch[3]} alt={mdMediaMatch[2]} />;
        }
      }

      const htmlSrcMatch = /<(img|video|audio|iframe)\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i.exec(
        unescapeHtml(trimmed)
      );
      if (htmlSrcMatch) {
        const tag = htmlSrcMatch[1].toLowerCase();
        const src = htmlSrcMatch[2];
        const media = detectMediaUrl(src);
        if (media && media.type !== 'link') {
          return <MediaEmbed media={media} />;
        }
        if (tag === 'img' && isSafeHttpOrDataUrl(src)) {
          return <MediaImage src={src} />;
        }
        if (tag === 'video' && isSafeHttpOrDataUrl(src)) {
          return <MediaVideo src={src} />;
        }
      }
    }

    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  };

  return {
    a: MarkdownLink,
    img: MarkdownImg,
    video: MarkdownVideo,
    audio: MarkdownAudio,
    iframe: MarkdownIframe,
    pre: MarkdownPre,
    code: MarkdownCode,
  };
}

// Stable module-level component maps so ReactMarkdown NEVER remounts media/embed trees across renders
const ASSISTANT_COMPONENTS = createMarkdownComponents(false, false);
const USER_COMPONENTS = createMarkdownComponents(true, false);
const NESTED_ASSISTANT_COMPONENTS = createMarkdownComponents(false, true);
const NESTED_USER_COMPONENTS = createMarkdownComponents(true, true);
const REMARK_PLUGINS = [remarkGfm];
const REHYPE_PLUGINS = [rehypeRaw];

interface ChatMarkdownRendererProps {
  content: string;
  isUserMessage?: boolean;
  isNested?: boolean;
  isStreaming?: boolean;
}

export const ChatMarkdownRenderer: React.FC<ChatMarkdownRendererProps> = memo(
  ({ content, isUserMessage = false, isNested = false, isStreaming = false }) => {
    const { text: processedContent } = useMemo(
      () => preprocessMarkdown(content, isStreaming),
      [content, isStreaming]
    );

    const components = isNested
      ? isUserMessage
        ? NESTED_USER_COMPONENTS
        : NESTED_ASSISTANT_COMPONENTS
      : isUserMessage
        ? USER_COMPONENTS
        : ASSISTANT_COMPONENTS;

    return (
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={REHYPE_PLUGINS}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    );
  }
);
