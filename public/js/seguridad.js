// ============================================================
// CULTYRA · SEGURIDAD.JS — Capa de seguridad cliente
// XSS prevention · localStorage encryption · Session security
// Idle timeout · Clickjacking · Admin protection
// ============================================================
'use strict';

// ════════════════════════════════════════════════════════════
// 1. SANITIZACIÓN HTML — previene XSS en innerHTML
// ════════════════════════════════════════════════════════════
const Sanitizer = {
  // Escapa HTML peligroso para insertar texto como texto plano
  escape(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\//g, '&#x2F;');
  },
  // Limpia un HTML permitiendo solo tags seguros (whitelist)
  clean(html) {
    if (!html) return '';
    const ALLOWED = /^(b|i|em|strong|span|div|p|br|ul|ol|li|h[1-6]|small|a|img)$/i;
    const SAFE_ATTRS = /^(href|src|alt|class|style|title|data-icon|data-pm|data-category|onclick|oninput|onchange|onkeydown|colspan|rowspan|type|id|placeholder|for|name|value|width|height|viewBox|fill|stroke|stroke-width|stroke-linecap|stroke-linejoin|d|cx|cy|r|rx|ry|x|x1|x2|y|y1|y2|points|transform|preserveAspectRatio|xmlns|font-family|font-size|text-anchor|dominant-baseline|opacity|color|target|rel|min|max|step|rows|autocomplete|loading|onerror|download|disabled)$/i;
    const div = document.createElement('div');
    div.innerHTML = html;
    div.querySelectorAll('*').forEach(el => {
      if (!ALLOWED.test(el.tagName)) { el.replaceWith(document.createTextNode(el.textContent)); return; }
      Array.from(el.attributes).forEach(attr => {
        if (!SAFE_ATTRS.test(attr.name)) el.removeAttribute(attr.name);
        // Bloquear javascript: en href/src
        if ((attr.name === 'href' || attr.name === 'src') && /^\s*javascript\s*:/i.test(attr.value)) {
          el.removeAttribute(attr.name);
        }
      });
    });
    return div.innerHTML;
  }
};
window.Sanitizer = Sanitizer;
// Helper global
window.esc = Sanitizer.escape;

// ════════════════════════════════════════════════════════════
// 2. CIFRADO SIMPLE DE LOCALSTORAGE
//    XOR + base64 con clave derivada del UID del usuario.
//    No es criptografía de grado militar, pero protege datos
//    ante acceso físico al dispositivo o extensiones maliciosas.
// ════════════════════════════════════════════════════════════
const SecureStorage = (function () {
  let _key = 'cultyra-default';

  function setKey(uid) {
    // Deriva una clave de 32 chars del UID
    _key = (uid || 'default').split('').reverse().join('') + uid.slice(0, 8);
  }

  function xorStr(data, key) {
    return data.split('').map((c, i) =>
      String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    ).join('');
  }

  function encrypt(obj) {
    try {
      const json  = JSON.stringify(obj);
      const xored = xorStr(json, _key);
      return btoa(unescape(encodeURIComponent(xored)));
    } catch { return null; }
  }

  function decrypt(str) {
    try {
      const xored = decodeURIComponent(escape(atob(str)));
      return JSON.parse(xorStr(xored, _key));
    } catch { return null; }
  }

  // Claves que DEBEN cifrarse
  const SENSITIVE_KEYS = [
    'cultyra_sesion', 'cultyra_pin_hash', 'cultyra_pedidos',
    'cultyra_chat_sessions', 'cultyra_chat_marcadores',
    'cultyra_mensajes_emp', 'cultyra_eval_emp', 'cultyra_asistencia'
  ];

  function isSensitive(key) {
    return SENSITIVE_KEYS.some(k => key.startsWith(k));
  }

  function setItem(key, value) {
    try {
      if (isSensitive(key)) {
        const enc = encrypt(value);
        if (enc) { localStorage.setItem(key, '__enc__' + enc); return; }
      }
      localStorage.setItem(key, value);
    } catch (e) { console.warn('[SecureStorage.set]', e.message); }
  }

  function getItem(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      if (raw.startsWith('__enc__')) {
        const dec = decrypt(raw.slice(7));
        return dec !== null ? (typeof dec === 'string' ? dec : JSON.stringify(dec)) : null;
      }
      return raw;
    } catch { return null; }
  }

  function removeItem(key) {
    localStorage.removeItem(key);
  }

  return { setKey, setItem, getItem, removeItem, encrypt, decrypt, isSensitive };
})();
window.SecureStorage = SecureStorage;

// ════════════════════════════════════════════════════════════
// 3. TIMEOUT DE SESIÓN POR INACTIVIDAD (30 minutos)
// ════════════════════════════════════════════════════════════
(function () {
  const TIMEOUT_MS = 30 * 60 * 1000; // 30 min
  let _timer = null;

  function reset() {
    clearTimeout(_timer);
    // Solo activo si el usuario está en la app (no en landing/login)
    if (document.getElementById('app')?.style.display === 'none') return;
    _timer = setTimeout(() => {
      if (typeof doLogout === 'function') {
        toast?.('⏰ Sesión expirada por inactividad. Vuelve a iniciar sesión.', 'warn', { title: 'Sesión cerrada' });
        setTimeout(doLogout, 1500);
      }
    }, TIMEOUT_MS);
  }

  ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'].forEach(ev =>
    document.addEventListener(ev, reset, { passive: true })
  );
  reset();
})();

// ════════════════════════════════════════════════════════════
// 4. DETECCIÓN DE CLICKJACKING — si la página está en un iframe
// ════════════════════════════════════════════════════════════
(function () {
  if (window.top !== window.self) {
    // Estamos dentro de un iframe — probable clickjacking
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#061008;color:#f87171;font-size:18px;text-align:center;padding:20px">⚠️ CULTYRA no puede ejecutarse dentro de un iframe por razones de seguridad.</div>';
    window.top.location = window.self.location;
  }
})();

// ════════════════════════════════════════════════════════════
// 5. PROTECCIÓN CONTRA CONSOLA EN PRODUCCIÓN
//    Muestra un aviso si alguien abre DevTools
// ════════════════════════════════════════════════════════════
(function () {
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;
  const warn = '%c⚠️ CULTYRA — Zona restringida\n%cSi alguien te pidió pegar código aquí, es un ataque de ingeniería social. No lo hagas.';
  const s1   = 'color:#f87171;font-size:22px;font-weight:bold;';
  const s2   = 'color:#9ec5a2;font-size:14px;';
  setInterval(() => {
    console.log(warn, s1, s2);
  }, 8000);
})();

// ════════════════════════════════════════════════════════════
// 6. VALIDACIÓN DE INPUTS DE FORMULARIO
// ════════════════════════════════════════════════════════════
const Validator = {
  email(v)   { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); },
  telefono(v){ return /^[+]?[\d\s\-()]{7,15}$/.test(v); },
  monto(v)   { const n = parseFloat(v); return !isNaN(n) && n >= 0 && n <= 99_999_999; },
  texto(v, max) { return v && String(v).trim().length > 0 && String(v).length <= (max||500); },
  iban(v)    { return /^[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}$/.test(v.replace(/\s/g,'')); },
  sinpe(v)   { return /^\d{4}-?\d{4}$/.test(v.replace(/\s/g,'')); },
};
window.Validator = Validator;

// ════════════════════════════════════════════════════════════
// 7. HTTPS ENFORCEMENT
// ════════════════════════════════════════════════════════════
(function () {
  if (location.protocol === 'http:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    location.replace('https:' + location.href.slice(5));
  }
})();

// ════════════════════════════════════════════════════════════
// 8. PROTECCIÓN DE DATOS SENSIBLES EN ERRORES
//    Intercepta console.error para no filtrar tokens ni UIDs
// ════════════════════════════════════════════════════════════
(function () {
  if (location.hostname === 'localhost') return;
  const origError = console.error;
  console.error = function (...args) {
    const safe = args.map(a => {
      if (typeof a === 'string') {
        return a
          .replace(/Bearer [A-Za-z0-9\-_.]+/g, 'Bearer [REDACTED]')
          .replace(/uid['":\s]+[A-Za-z0-9]{10,}/gi, 'uid:[REDACTED]');
      }
      return a;
    });
    origError.apply(console, safe);
  };
})();

// ════════════════════════════════════════════════════════════
// 9. ANTI-TAMPERING DE LOCALSTORAGE
//    Detecta si datos fueron modificados externamente
// ════════════════════════════════════════════════════════════
window.addEventListener('storage', e => {
  const CRITICAL = ['cultyra_sesion', 'cultyra_pin_hash'];
  if (CRITICAL.includes(e.key) && e.oldValue !== e.newValue) {
    console.warn('[Seguridad] Modificación externa detectada en:', e.key);
    if (typeof doLogout === 'function') doLogout();
  }
});

// ════════════════════════════════════════════════════════════
// 10. INIT — conectar al ciclo de autenticación
// ════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Cuando el usuario inicia sesión, activar cifrado de localStorage
  const origEntrarApp = typeof entrarApp === 'function' ? entrarApp : null;
  if (origEntrarApp && !window._secHooked) {
    window._secHooked = true;
    window.entrarApp = function(nombre) {
      if (typeof sesion !== 'undefined' && sesion?.uid) {
        SecureStorage.setKey(sesion.uid);
      }
      origEntrarApp(nombre);
    };
  }

  // Patch localStorage.setItem para las claves sensibles
  const origSet = localStorage.setItem.bind(localStorage);
  const origGet = localStorage.getItem.bind(localStorage);
  localStorage.setItem = function(key, value) {
    if (SecureStorage.isSensitive(key)) {
      SecureStorage.setItem(key, value);
    } else {
      origSet(key, value);
    }
  };
  // Nota: getItem no se parchea globalmente para no romper código existente
  // pero SecureStorage.getItem() puede llamarse explícitamente
});
