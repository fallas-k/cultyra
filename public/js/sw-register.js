// Registro del Service Worker (permite instalar la app y uso offline)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(()=>{/* archivo no disponible: la app funciona igual */});
  });
}
