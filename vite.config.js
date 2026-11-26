import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// Public content tables cached for offline reading; private tables (submissions, RSVPs, draws, admin)
// are never cached.
const OFFLINE_TABLES = 'tenures|tenure_roles|divisions|sub_divisions|members|events|galleries|forms|faqs|brand_assets|page_settings|daily_devotions|worship_songs|easy_worship_schedules';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['icons/apple-touch-icon.png', 'assets/mandiri-club-bapekkris-original.png', 'assets/mandiri-club-bapekkris-white.png'],
      manifest: {
        name: 'Bapekkris Bank Mandiri',
        short_name: 'Bapekkris',
        description: 'Renungan harian, Alkitab, kidung pujian, jadwal ibadah, dan pelayanan Bapekkris PT Bank Mandiri (Persero) Tbk.',
        lang: 'id',
        start_url: '/?source=pwa#home',
        scope: '/',
        display: 'standalone',
        background_color: '#f7f3ea',
        theme_color: '#0b2545',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        shortcuts: [
          { name: 'Renungan Harian', url: '/#renungan', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Alkitab', url: '/#alkitab', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Kidung & Lagu', url: '/#lagu', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        // Admin-only and on-demand chunks (PDF export, QR scanner, admin portal, stats) are not needed
        // offline; they load from the network when used, keeping the first install light.
        globIgnores: ['**/exportPdf-*.js', '**/index.es-*.js', '**/purify.es-*.js', '**/jsQR-*.js', '**/AdminPortal-*.js', '**/EventRegistrationStats-*.js', 'assets/Danantara/**', 'assets/Mandiri/**'],
        // The hymnal (~770 KB) and PDF export (~600 KB) chunks are large but must work offline too.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/sitemap\.xml$/, /^\/robots\.txt$/],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Latest data when online; the last copy when offline.
            urlPattern: new RegExp(`^https://[a-z0-9]+\\.supabase\\.co/rest/v1/(${OFFLINE_TABLES})(\\?|$)`),
            handler: 'NetworkFirst',
            method: 'GET',
            options: { cacheName: 'konten-publik', networkTimeoutSeconds: 4, expiration: { maxEntries: 120, maxAgeSeconds: 30 * 24 * 3600 } }
          },
          {
            // Bible books (Terjemahan Baru dataset) never change.
            urlPattern: /^https:\/\/(cdn\.jsdelivr\.net\/gh\/tobiasagyasta|raw\.githubusercontent\.com\/tobiasagyasta)\//,
            handler: 'CacheFirst',
            options: { cacheName: 'alkitab-tb', expiration: { maxEntries: 80, maxAgeSeconds: 365 * 24 * 3600 }, cacheableResponse: { statuses: [0, 200] } }
          },
          {
            urlPattern: /^https:\/\/bible-api\.com\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'alkitab-en', expiration: { maxEntries: 200, maxAgeSeconds: 365 * 24 * 3600 } }
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 3600 }, cacheableResponse: { statuses: [0, 200] } }
          },
          {
            urlPattern: /^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'media', expiration: { maxEntries: 150, maxAgeSeconds: 30 * 24 * 3600 }, cacheableResponse: { statuses: [0, 200] } }
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/storage-proxy': {
        target: 'https://zkvjudumhhnwxchhakjl.supabase.co/storage/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/storage-proxy/, '')
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-icons': ['lucide-react']
        }
      }
    }
  }
});
