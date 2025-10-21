// Service Worker para ParkPay PWA
const CACHE_NAME = 'parkpay-v2'; // ⬅️ CAMBIADO PARA FORZAR ACTUALIZACIÓN
const urlsToCache = [
  '/',
  '/index.html',
  '/inicio.html',
  '/estacionamiento.html',
  '/entrada.html',
  '/salida-scanner.html',
  '/tickets.html',
  '/perfil.html',
  '/recuperar.html',
  '/logo.png',
  '/css/styles.css',
  '/js/auth.js',
  '/js/app.js'
];

// Instalación - cachear recursos
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cacheando archivos');
        return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'})))
          .catch(err => {
            console.error('[Service Worker] Error al cachear:', err);
          });
      })
  );
  self.skipWaiting();
});

// Activación - limpiar caches antiguos
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - estrategia Network First, luego Cache
self.addEventListener('fetch', event => {
  // Ignorar requests que no sean GET
  if (event.request.method !== 'GET') return;
  
  // Ignorar API calls (siempre ir a la red)
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('render.com') ||
      event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la respuesta es válida, actualizar cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, usar cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // Si no hay cache, mostrar página offline
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Mensajes del cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
