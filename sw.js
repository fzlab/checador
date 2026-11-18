const CACHE_NAME = 'checador-t0151-v1.1';
const ASSETS_TO_CACHE = [
  './index.html',
  './src/fonts.css',
  './src/fonts/Geist-Regular.ttf',
  './src/fonts/Geist-SemiBold.ttf',
  './src/icons/checador.svg',
  './src/icons/checador-96.png',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@1.72.0',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Instalación del Service Worker y almacenamiento en caché estático
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activación y limpieza de cachés antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia de red con respaldo en caché (Network First / Stale While Revalidate)
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones que no sean GET o que provengan de Supabase/Storage (para evitar interferir con la sincronización offline)
  if (event.request.method !== 'GET' || event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, clonarla y actualizar la caché
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, buscar en la caché
        return caches.match(event.request);
      })
  );
});
