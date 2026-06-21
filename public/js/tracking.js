// ============================================================
// CULTYRA · TRACKING — Registro de actividad del usuario
// Envía eventos al servidor de forma silenciosa y sin bloquear.
// ============================================================

const Tracking = (function () {
  let _uid = null, _email = '', _nombre = '';
  const BATCH_MS   = 8000;   // enviar cada 8s
  const MAX_QUEUE  = 30;
  let _queue = [];
  let _batchTimer = null;

  // ---------- CONFIG ----------
  function init(uid, email, nombre) {
    _uid    = uid;
    _email  = email || '';
    _nombre = nombre || '';
    _flush(); // enviar lo que haya en cola de sesiones anteriores
  }

  // ---------- REGISTRAR EVENTO ----------
  function track(seccion, accion, meta) {
    if (!_uid) return;
    _queue.push({ seccion: seccion || '', accion: accion || '', meta: meta || '' });
    if (_queue.length >= MAX_QUEUE) { _flush(); return; }
    clearTimeout(_batchTimer);
    _batchTimer = setTimeout(_flush, BATCH_MS);
  }

  // ---------- ENVIAR AL SERVIDOR ----------
  async function _flush() {
    if (!_uid || !_queue.length) return;
    const eventos = _queue.splice(0);
    const base = typeof API_URL !== 'undefined' ? API_URL : '';
    if (!base) return;
    const token = typeof getToken === 'function' ? await getToken().catch(() => null) : null;
    if (!token) { _queue.unshift(...eventos); return; }

    // Enviamos el evento más reciente (el servidor lo guarda)
    const ultimo = eventos[eventos.length - 1];
    try {
      await fetch(base + '/api/actividad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ ...ultimo, nombre: _nombre }),
        keepalive: true
      });
    } catch { /* silencioso */ }
  }

  // Enviar al cerrar la pestaña
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') _flush();
  });

  return { init, track };
})();

// ---------- HOOKS AUTOMÁTICOS ----------
// Intercepta showSection para trackear cambios de sección
document.addEventListener('DOMContentLoaded', () => {
  const orig = typeof showSection === 'function' ? showSection : null;
  if (orig && !window._trackingHooked) {
    window._trackingHooked = true;
    window.showSection = function (id, btn) {
      orig(id, btn);
      Tracking.track(id, 'nav');
    };
  }
});

// Eventos globales de acciones clave
document.addEventListener('click', e => {
  if (!e.target) return;
  const btn = e.target.closest('button,a');
  if (!btn) return;
  const txt = btn.textContent?.trim().slice(0, 40);
  const onclick = btn.getAttribute('onclick') || '';

  if (onclick.includes('addToCart'))          Tracking.track('productos', 'addToCart', txt);
  else if (onclick.includes('realizarPedido') || onclick.includes('procesarPago'))
                                              Tracking.track('checkout', 'pago_iniciado');
  else if (onclick.includes('openFincaModal'))Tracking.track('cultivo', 'abrir_modal_finca');
  else if (onclick.includes('addFinca'))      Tracking.track('cultivo', 'agregar_finca');
  else if (onclick.includes('addRegistro'))   Tracking.track('registros', 'agregar_registro');
  else if (onclick.includes('sendMessage') || onclick.includes('enviarMensaje'))
                                              Tracking.track('ia', 'consulta_cultyra');
}, { passive: true });
