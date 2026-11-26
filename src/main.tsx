// Safe localStorage sandboxing/polyfill for iframes and third-party-cookie-blocked browsers
try {
  const testKey = '__storage_test__';
  window.localStorage.setItem(testKey, testKey);
  window.localStorage.removeItem(testKey);
} catch (e) {
  console.warn("localStorage is blocked or disabled in this environment. Using secure in-memory backup to prevent crash.", e);
  const memoryStore: Record<string, string> = {};
  const mockStorage: Storage = {
    get length() {
      return Object.keys(memoryStore).length;
    },
    clear: () => {
      for (const k in memoryStore) {
        delete memoryStore[k];
      }
    },
    getItem: (key: string) => {
      return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
    },
    key: (index: number) => {
      return Object.keys(memoryStore)[index] || null;
    },
    removeItem: (key: string) => {
      delete memoryStore[key];
    },
    setItem: (key: string, value: string) => {
      memoryStore[key] = String(value);
    }
  };
  try {
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
      enumerable: true
    });
  } catch (err) {
    console.error("Could not override localStorage:", err);
  }
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App.tsx';
import './index.css';

const APP_CACHE_VERSION = '2026-11-26-v3';

try {
  const prevCacheVersion = window.localStorage.getItem('midad_cache_version');
  if (prevCacheVersion !== APP_CACHE_VERSION) {
    window.localStorage.setItem('midad_cache_version', APP_CACHE_VERSION);
    if ('caches' in window) {
      caches.keys().then((keys) => {
        return Promise.all(
          keys
            .filter((k) => !k.includes('quran-audio-cache'))
            .map((k) => caches.delete(k))
        );
      }).catch(() => {});
    }
  }

  let hasReloadedForSW = false;
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hasReloadedForSW) return;
      hasReloadedForSW = true;
      window.location.reload();
    });
  }

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        registration.update().catch(() => {});
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {});
          }
        });
        setInterval(() => {
          registration.update().catch(() => {});
        }, 15 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn('Service Worker registration error:', error);
    },
  });
} catch (err) {
  console.warn('Service Worker registration skipped:', err);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
