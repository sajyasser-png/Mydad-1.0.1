import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        useCredentials: true,
        includeAssets: [],
        manifest: {
          id: '/',
          name: 'Mydad live',
          short_name: 'Mydad live',
          description: '«مِـدَادُ الـرَّحْـمَـنِ»«مِـنَـصَّـةٌ قُـرْآنِـيَّـةٌ مُـتَـكَـامِـلَـةٌ تَـجْـمَـعُ بَـيْـنَ تِـلَاوَةِ الْـمُـصْـحَـفِ الـشَّـرِيفِ وَتَـفْـسِـيرِهِ، مَـعَ أَدَوَاتٍ يَـوْمِـيَّـةٍ مُـسَـاعِـدَةٍ تَـشْـمَـلُ مَـوَاقِـيـتَ الـصَّـلَاةِ، الْـقِـبْـلَـةَ، الْأَذْكَـارَ، الـسُّـبْـحَـةَ، وَالْـمُـفَـكِّـرَةَ الْـهِـجْـرِيَّـةَ.»',
          theme_color: '#101825',
          background_color: '#0c0a09',
          display: 'standalone',
          orientation: 'portrait-primary',
          dir: 'rtl',
          lang: 'ar',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png?v=3',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png?v=3',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png?v=3',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          cacheId: 'midad-live-v3',
          globPatterns: ['**/*.{js,css,ico,png,svg,woff,woff2}'],
          ignoreURLParametersMatching: [/^v$/, /^refresh$/],
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          navigateFallback: null,
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'midad-pages-v3',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 5,
                  maxAgeSeconds: 60 * 60 * 24,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/api\.alquran\.cloud\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'alquran-api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    define: {
      'process.env.ROUTEWAY_API_KEY': JSON.stringify(env.ROUTEWAY_API_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
