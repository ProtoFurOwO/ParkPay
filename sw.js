// Service Worker para ParkPay PWA - Versión Simplificada
const CACHE_NAME = 'parkpay-v1.0.1';
const urlsToCache = [
  '/',
  '/index.html',
  '/inicio.html',
  '/estacionamiento.html',
  '/css/styles.css',
  '/js/auth.js',
  '/js/jwt-utils.js',
  '/js/parking.js',
  '/manifest.json'
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
        console.log('📦 Service Worker: Cacheando archivos básicos');
        // Solo cachear archivos que seguro existen
        return cache.addAll([
          '/',
          '/index.html',
          '/manifest.json'
        ]);
      })
      .then(() => {
        console.log('✅ Service Worker: Instalación completada');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Service Worker: Error en instalación:', error);
        // No fallar completamente si hay errores de cache
        return self.skipWaiting();
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

// Intercepción de peticiones de red - Versión simplificada
self.addEventListener('fetch', event => {
  // Solo interceptar requests GET para evitar problemas con API calls
  if (event.request.method !== 'GET') {
    return;
  }
  
  // No interceptar requests a APIs externas para evitar problemas
  if (event.request.url.includes('parkpay-backend-1ti1.onrender.com') || 
      event.request.url.includes('/api/')) {
    return;
  }
  
  // Estrategia Network-First simple para todo lo demás
  event.respondWith(
    fetch(event.request)
      .then(response => {
        console.log('🌐 SW: Network response para:', event.request.url);
        return response;
      })
      .catch(error => {
        console.log('❌ SW: Network error, intentando cache:', event.request.url);
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              console.log('� SW: Serving from cache:', event.request.url);
              return cachedResponse;
            }
            return new Response('Recurso no disponible offline');
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