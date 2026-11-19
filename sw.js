const CACHE_NAME = 'checador-t0151-v1.6';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './src/fonts/fonts.css',
  './src/fonts/Geist-Regular.ttf',
  './src/fonts/Geist-SemiBold.ttf',
  './src/icons/checador.svg',
  './src/icons/checador512.png',
  './src/icons/checador192.png',
  './src/icons/checador180.png',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@1.72.0',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of ASSETS_TO_CACHE) {
        try {
          const req = new Request(url, { cache: 'reload' });
          const res = await fetch(req);
          if (res && (res.ok || res.type === 'opaque')) {
            await cache.put(url, res);
          }
        } catch (err) {
          console.warn('[SW] No se pudo precachear:', url, err);
        }
      }
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && (response.status === 200 || response.type === 'opaque')) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
