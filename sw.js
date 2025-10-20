// Service Worker para ParkPay PWA
const CACHE_NAME = 'parkpay-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/inicio.html',
  '/estacionamiento.html',
  '/css/style.css',
  '/css/dashboard.css',
  '/js/auth.js',
  '/js/estacionamiento.js',
  '/js/mapa.js',
  '/js/pagos.js',
  '/js/script.js',
  '/manifest.json',
  // Iconos
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Fuentes y recursos externos críticos
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js'
];

// URLs que siempre deben ir a la red (datos en tiempo real)
const networkOnlyUrls = [
  'https://parkpay-backend-1ti1.onrender.com/api/',
  '/api/'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('🔧 Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Service Worker: Cacheando archivos');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker: Instalación completada');
        return self.skipWaiting(); // Activar inmediatamente
      })
      .catch(error => {
        console.error('❌ Service Worker: Error en instalación:', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: Activando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker: Activación completada');
      return self.clients.claim(); // Tomar control inmediatamente
    })
  );
});

// Intercepción de peticiones de red
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // Estrategia Network-Only para APIs (datos en tiempo real)
  if (networkOnlyUrls.some(url => event.request.url.includes(url))) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          console.log('🌐 SW: Network-only response para:', event.request.url);
          return response;
        })
        .catch(error => {
          console.log('❌ SW: Error en network-only:', error);
          // Retornar respuesta offline para APIs
          return new Response(
            JSON.stringify({ 
              error: 'Sin conexión', 
              message: 'No hay conexión a internet. Funcionalidad limitada.',
              offline: true 
            }),
            { 
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Estrategia Cache-First para recursos estáticos
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si está en cache, devolverlo
        if (response) {
          console.log('📦 SW: Serving from cache:', event.request.url);
          return response;
        }

        // Si no está en cache, ir a la red
        console.log('🌐 SW: Fetching from network:', event.request.url);
        return fetch(event.request)
          .then(response => {
            // Verificar si es una respuesta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar la respuesta porque es un stream que solo se puede usar una vez
            const responseToCache = response.clone();

            // Agregar al cache si es un recurso cacheable
            if (event.request.method === 'GET') {
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                  console.log('💾 SW: Cached new resource:', event.request.url);
                });
            }

            return response;
          })
          .catch(error => {
            console.log('❌ SW: Network error:', error);
            
            // Si es una página HTML, mostrar página offline
            if (event.request.destination === 'document') {
              return caches.match('/offline.html') || 
                     new Response(getOfflineHTML(), {
                       headers: { 'Content-Type': 'text/html' }
                     });
            }
            
            // Para otros recursos, intentar encontrar algo similar en cache
            return caches.match('/') || new Response('Recurso no disponible offline');
          });
      })
  );
});

// Manejo de mensajes desde la aplicación
self.addEventListener('message', event => {
  console.log('💬 SW: Mensaje recibido:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Notificaciones Push (preparado para futuras implementaciones)
self.addEventListener('push', event => {
  console.log('🔔 SW: Push notification recibida');
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de ParkPay',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalles',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icons/close.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('ParkPay', options)
  );
});

// Clic en notificación
self.addEventListener('notificationclick', event => {
  console.log('🔔 SW: Click en notificación:', event.notification.tag);
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/inicio.html')
    );
  }
});

// HTML para página offline
function getOfflineHTML() {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ParkPay - Sin conexión</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 20px;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
            }
            .offline-container {
                text-align: center;
                background: rgba(255,255,255,0.1);
                padding: 40px;
                border-radius: 20px;
                backdrop-filter: blur(10px);
                max-width: 400px;
            }
            .offline-icon {
                font-size: 4rem;
                margin-bottom: 20px;
            }
            .retry-btn {
                background: #007bff;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 25px;
                font-size: 1rem;
                cursor: pointer;
                margin-top: 20px;
                transition: all 0.3s ease;
            }
            .retry-btn:hover {
                background: #0056b3;
                transform: translateY(-2px);
            }
        </style>
    </head>
    <body>
        <div class="offline-container">
            <div class="offline-icon">🚫</div>
            <h1>Sin conexión</h1>
            <p>No tienes conexión a internet en este momento.</p>
            <p>Verifica tu conexión e intenta de nuevo.</p>
            <button class="retry-btn" onclick="window.location.reload()">
                Intentar de nuevo
            </button>
        </div>
    </body>
    </html>
  `;
}

console.log('🎯 Service Worker cargado: ParkPay PWA');