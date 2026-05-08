// Service Worker voor Opnemen Gesprek (Blinqx)
// Versie verhogen om gebruikers te dwingen een nieuwe versie te laden
const CACHE_NAME = 'opnemen-gesprek-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Installeer: cache de basisbestanden
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => {
        console.warn('Cache add failed:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activeer: oude caches opruimen
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: probeer netwerk, val terug op cache
self.addEventListener('fetch', (event) => {
  // Alleen GET-verzoeken cachen
  if (event.request.method !== 'GET') return;

  // Skip externe requests (Google Speech API, etc.)
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache de response voor offline gebruik
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Geen netwerk: probeer cache
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/index.html');
        });
      })
  );
});
