export interface Surah {
  id: number;
  name: string;
  transliteration: string;
  translation: string;
  type: string;
  total_verses: number;
  verses: Verse[];
}

export interface Verse {
  id: number;
  text: string;
  translation: string;
  transliteration: string;
}

export interface Reciter {
  id: string;
  name: string;
}

export interface Tafsir {
  id: string;
  name: string;
}

export interface Translation {
  id: string;
  name: string;
  language: string;
}

export interface Qiraat {
  id: string;
  name: string;
}

export type ViewMode = 'search' | 'browse' | 'duas' | 'qibla' | 'tasbih' | 'ai-hub' | 'bookmarks' | 'calendar' | 'ai-chat' | 'image_generator';

export interface RecitationSettings {
  pitch: number;
  rate: number;
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
