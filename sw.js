/**
 * ClimaTrack - Service Worker
 * Soporte Offline-First para Frío Industrial, HVAC y Guardias Críticas en Subsuelos
 */

const CACHE_NAME = 'climatrack-cache-v1.0.02';
const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './version.json',
  './src/main.js',
  './src/sw-register.js',
  './src/core/gasRefrigerantEngine.js',
  './src/core/slaEmergencyDispatcher.js',
  './src/core/compressorHealthScoring.js',
  './src/services/serviceOrderService.js',
  './src/services/dualCurrencyContractService.js',
  './src/services/exportService.js',
  './src/services/climaTrackCache.service.js',
  './src/services/whatsAppClimaNotifier.service.js',
  './src/utils/cryptoSeal.js',
  './src/utils/formatters.js',
  './src/utils/sanitizer.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key.startsWith('climatrack-cache-') && key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return null;
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isHtmlOrVersion =
    event.request.mode === 'navigate' ||
    event.request.headers.get('accept')?.includes('text/html') ||
    url.pathname.endsWith('/version.json') ||
    url.pathname.endsWith('/index.html');

  if (isHtmlOrVersion) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
