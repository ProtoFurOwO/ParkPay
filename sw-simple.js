// Service Worker minimalista para ParkPay - Solo PWA básica
const CACHE_NAME = 'parkpay-v1.0.2';

console.log('🎯 Service Worker ParkPay - Modo DEBUG');

// Instalación simple
self.addEventListener('install', event => {
  console.log('✅ SW: Instalado sin problemas');
  self.skipWaiting();
});

// Activación simple  
self.addEventListener('activate', event => {
  console.log('✅ SW: Activado sin problemas');
  event.waitUntil(self.clients.claim());
});

// NO interceptar peticiones por ahora para evitar problemas
self.addEventListener('fetch', event => {
  // Dejar pasar todas las peticiones sin interceptar
  console.log('🌐 SW: Petición pasando sin interceptar:', event.request.url);
});

console.log('📱 PWA Service Worker cargado - Versión de DEBUG');