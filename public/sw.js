// Cultyra Service Worker — permite instalar la app y abrirla sin conexión
const CACHE = 'cultyra-v12';
const ARCHIVOS = [
  './index.html', './manifest.json', './css/styles.css?v=6', './img/logo.png',
  './img/icon-192.png', './img/icon-512.png',
  './js/ui.js','./js/storage.js','./js/auth.js','./js/clima.js','./js/fincas.js',
  './js/tareas.js','./js/ia.js','./js/tienda.js','./js/registros.js',
  './js/dashboard.js','./js/landing.js','./js/init.js','./js/sw-register.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Red primero (clima y APIs siempre frescos); caché como respaldo sin conexión
  e.respondWith(
    fetch(e.request).then(r => {
      if (e.request.method === 'GET' && r.ok && e.request.url.startsWith(self.location.origin)) {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia));
      }
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
