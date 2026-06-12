// Cultyra Service Worker — permite instalar la app y abrirla sin conexión
const CACHE = 'cultyra-v1';
const ARCHIVOS = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

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
