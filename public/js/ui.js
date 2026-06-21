// ============================================================
// CULTYRA · UI
// ============================================================

// ===== NAVIGATION =====
function showSection(id, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if(btn) btn.classList.add('active');
  window.scrollTo(0, 0);
  if(id === 'cultivo') { initMapaGeneral(); setTimeout(() => { if(window.mapaGeneral) window.mapaGeneral.invalidateSize(); }, 350); }
  if(id === 'dashboard') renderDashboard();
  if(id === 'registros') renderRegistros();
  if(id === 'calendario') renderCalendario();
  if(id === 'comparar') renderComparar();
  if(id === 'cultivo') renderBitacora();
}

// ===== UTILIDADES =====
function fechaRelativa(fechaStr) {
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const fecha = new Date(fechaStr + 'T12:00'); fecha.setHours(0,0,0,0);
  const diff = Math.round((fecha - hoy) / 86400000);
  const fechaFmt = new Date(fechaStr + 'T12:00').toLocaleDateString('es-CR', {day:'numeric', month:'short'});
  if (diff === 0) return `${fechaFmt} · ⚠️ Vence hoy`;
  if (diff === 1) return `${fechaFmt} · Vence mañana`;
  if (diff > 1) return `${fechaFmt} · Vence en ${diff} días`;
  if (diff === -1) return `${fechaFmt} · Venció ayer`;
  return `${fechaFmt} · Venció hace ${Math.abs(diff)} días`;
}


function toggleNavMenu() {
  try {
    const panel   = document.getElementById('nav-menu-panel');
    const overlay = document.getElementById('nav-menu-overlay');
    const burger  = document.getElementById('nav-burger');
    if (!panel || !overlay || !burger) {
      toast('Error de menú: falta panel/overlay/burger en el HTML', 'error');
      return;
    }
    panel.classList.toggle('open');
    overlay.classList.toggle('open');
    burger.classList.toggle('open');
  } catch (e) {
    toast('Error al abrir el menú: ' + e.message, 'error');
  }
}

// ===== TEMA (modo oscuro) =====
function toggleTema() {
  document.body.classList.toggle('dark');
  const oscuro = document.body.classList.contains('dark');
  document.getElementById('btn-tema').textContent = oscuro ? '☀️ Modo claro' : '🌙 Modo oscuro';
  try { localStorage.setItem('cultyra_tema', oscuro ? 'dark' : 'light'); } catch(e){}
}
(function(){
  try {
    if (localStorage.getItem('cultyra_tema') === 'dark') {
      document.body.classList.add('dark');
      const b = document.getElementById('btn-tema');
      if (b) b.textContent = '☀️ Modo claro';
    }
  } catch(e){}
})();

// ===== SPLASH =====
window.addEventListener('load', () => {
  setTimeout(() => {
    const s = document.getElementById('splash');
    if (s) { s.classList.add('fuera'); setTimeout(()=>s.remove(), 700); }
  }, 1100);
});

// ===== CONTADOR ANIMADO =====
function animarNumero(el, hasta, sufijo) {
  hasta = parseFloat(hasta) || 0;
  const dur = 700, inicio = performance.now();
  function paso(t) {
    const p = Math.min(1, (t - inicio) / dur);
    const val = hasta * (1 - Math.pow(1 - p, 3));
    el.textContent = (Number.isInteger(hasta) ? Math.round(val) : val.toFixed(1)) + (sufijo || '');
    if (p < 1) requestAnimationFrame(paso);
  }
  requestAnimationFrame(paso);
}

// ===== ONBOARDING (tour de bienvenida) =====
const ONB_PASOS = [
  {icon:'🌱', titulo:'¡Bienvenido a Cultyra!', texto:'Tu finca, tu equipo y el clima, todo en un solo lugar. Te mostramos lo esencial en 4 pasos rápidos.'},
  {icon:'🗺️', titulo:'1 · Dibuja tu finca', texto:'En "Mi Cultivo" → Agregar Finca: elige provincia, cantón y distrito, y dibuja tu terreno en el mapa. Las hectáreas se calculan solas.'},
  {icon:'🌦️', titulo:'2 · Revisa el clima', texto:'En "Clima" verás el pronóstico hora a hora de tu finca y recibirás alertas de helada o lluvia fuerte en tu Inicio.'},
  {icon:'👷', titulo:'3 · Asigna tareas', texto:'Registra a tus empleados y reparte el trabajo. Con el "Plan de cultivo" las etapas se generan automáticamente con fechas.'},
  {icon:'💰', titulo:'4 · Anota cosechas y gastos', texto:'En "Registros" lleva el control de kilos cosechados, ventas y gastos para saber cuánto está ganando tu finca. ¡Listo para empezar!'}
];
let onbPaso = 0;
function mostrarOnboarding() {
  onbPaso = 0;
  pintarOnb();
  document.getElementById('onb-overlay').classList.add('open');
}
function pintarOnb() {
  const p = ONB_PASOS[onbPaso];
  document.getElementById('onb-icon').textContent = p.icon;
  document.getElementById('onb-titulo').textContent = p.titulo;
  document.getElementById('onb-texto').textContent = p.texto;
  document.getElementById('onb-dots').innerHTML = ONB_PASOS.map((_,i)=>`<span class="${i===onbPaso?'on':''}"></span>`).join('');
  document.getElementById('onb-seguir').textContent = onbPaso === ONB_PASOS.length-1 ? '¡Empezar! 🚀' : 'Siguiente →';
}
function onbSiguiente() {
  if (onbPaso < ONB_PASOS.length - 1) { onbPaso++; pintarOnb(); }
  else cerrarOnb();
}
function cerrarOnb() {
  document.getElementById('onb-overlay').classList.remove('open');
  try { localStorage.setItem('cultyra_onb', 'visto'); } catch(e){}
}
function onbSiEsPrimeraVez() {
  let visto = false;
  try { visto = localStorage.getItem('cultyra_onb') === 'visto'; } catch(e){}
  if (!visto) setTimeout(mostrarOnboarding, 800);
}

// ===== TOASTS Y DIÁLOGOS BONITOS =====
function toast(msg, tipo) {
  const cont = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = 'toast ' + (tipo || 'ok');
  const ic = tipo === 'error' ? '⚠️' : tipo === 'info' ? 'ℹ️' : '✅';
  t.innerHTML = '<span>' + ic + '</span><span>' + msg + '</span>';
  cont.appendChild(t);
  setTimeout(() => { t.classList.add('fuera'); setTimeout(()=>t.remove(), 350); }, 3200);
}

// ===== ERRORES VISIBLES (para depurar en el celular sin DevTools) =====
window.addEventListener('error', (e) => {
  try { toast('⚠️ Error JS: ' + e.message + ' (' + (e.filename||'').split('/').pop() + ':' + e.lineno + ')', 'error'); } catch(_) {}
});
window.addEventListener('unhandledrejection', (e) => {
  try { toast('⚠️ Error async: ' + (e.reason && e.reason.message || e.reason), 'error'); } catch(_) {}
});

let _dialogoResolve = null;
function confirmar(msg, icono) {
  document.getElementById('dialogo-msg').textContent = msg;
  document.getElementById('dialogo-ic').textContent = icono || '🗑️';
  document.getElementById('dialogo-overlay').classList.add('open');
  return new Promise(res => { _dialogoResolve = res; });
}
function dialogoResponder(v) {
  document.getElementById('dialogo-overlay').classList.remove('open');
  if (_dialogoResolve) { _dialogoResolve(v); _dialogoResolve = null; }
}

// ===== ESTADÍSTICAS ANIMADAS DE LA LANDING =====
function animarStats() {
  const stats = document.querySelectorAll('.stat-item .n');
  if (!stats.length || !('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting && !en.target.dataset.hecho) {
        en.target.dataset.hecho = '1';
        const meta = parseInt(en.target.dataset.meta);
        const suf = en.target.dataset.suf || '';
        const ini = performance.now();
        function paso(t) {
          const p = Math.min(1, (t - ini) / 1300);
          en.target.textContent = Math.round(meta * (1 - Math.pow(1 - p, 3))).toLocaleString('es-CR') + suf;
          if (p < 1) requestAnimationFrame(paso);
        }
        requestAnimationFrame(paso);
      }
    });
  }, { threshold: 0.4 });
  stats.forEach(s => obs.observe(s));
}

// ===== LETRA GRANDE =====
function toggleLetra() {
  document.body.classList.toggle('grande');
  const g = document.body.classList.contains('grande');
  document.getElementById('btn-letra').textContent = g ? 'A− Letra normal' : 'A+ Letra grande';
  try { localStorage.setItem('cultyra_letra', g ? '1' : '0'); } catch (e) {}
}
(function () { try { if (localStorage.getItem('cultyra_letra') === '1') { document.body.classList.add('grande'); const b = document.getElementById('btn-letra'); if (b) b.textContent = 'A− Letra normal'; } } catch (e) {} })();

// ===== IDIOMA ES / EN =====
const I18N = {
  en: {
    'hero-tag': 'Costa Rican Agritech', 'hero-h1': 'The farm of the future<br>is <em>grown</em> today',
    'hero-p': 'Manage your farms with interactive maps, monitor the weather hour by hour, assign tasks to your team and buy biodegradable supplies. All in one platform.',
    'hero-cta': 'Sign In →', 'nav-login': 'Sign In',
    'como-h2': 'How does it work?',
    'paso1-h': 'Sign up for free', 'paso1-p': 'Create your farmer account in under a minute. Your workers can have their own too.',
    'paso2-h': 'Draw your farm', 'paso2-p': 'Pick your province, canton and district, draw your land on the map and hectares are calculated automatically.',
    'paso3-h': 'Get alerts & manage', 'paso3-p': 'Frost and rain alerts, tasks for your team, crop plans and profit tracking.',
    'stat1': 'Farms mapped', 'stat2': 'Hectares monitored', 'stat3': 'Supported crops', 'stat4': 'AI assistant',
    'feat1-h': 'Map your farm', 'feat1-p': 'Draw the exact area of your land on a map and calculate hectares automatically.',
    'feat2-h': 'Real-time weather', 'feat2-p': 'Hour-by-hour forecast for your area: temperature, rain, humidity and wind.',
    'feat3-h': 'Manage your team', 'feat3-p': 'Register your employees and assign field tasks with live tracking.',
    'feat4-h': 'Farm store', 'feat4-p': 'Organic fertilizers, IoT sensors and technical services one click away.',
    'feat5-h': 'AI assistant', 'feat5-p': 'Ask about pests, diseases and crop management with CultIA, your 24/7 virtual agronomist.',
    'footer-p': 'CULTYRA · STEAM Project · CTP José Figueres Ferrer · Costa Rica 🇨🇷 · 2026',
    'tab-login': 'Sign In', 'tab-registro': 'Sign Up',
    'lbl-email': 'Email', 'lbl-pass': 'Password', 'btn-entrar': 'Enter', 'lbl-recordar': ' Keep me signed in',
    'lbl-nombre': 'Full name', 'lbl-tipo': 'Account type', 'lbl-pass6': 'Password (min. 6 characters)', 'lbl-pass2': 'Confirm password', 'btn-crear': 'Create account'
  },
  es: {
    'hero-tag': 'Agrotecnología Costarricense', 'hero-h1': 'El campo del futuro<br>se <em>cultiva</em> hoy',
    'hero-p': 'Gestiona tus fincas con mapas interactivos, monitorea el clima hora a hora, asigna tareas a tu equipo y compra insumos biodegradables. Todo en una sola plataforma.',
    'hero-cta': 'Iniciar Sesión →', 'nav-login': 'Iniciar Sesión',
    'como-h2': '¿Cómo funciona?',
    'paso1-h': 'Regístrate gratis', 'paso1-p': 'Crea tu cuenta de agricultor en menos de un minuto. Tus trabajadores también pueden tener la suya.',
    'paso2-h': 'Dibuja tu finca', 'paso2-p': 'Elige provincia, cantón y distrito, dibuja tu terreno en el mapa y las hectáreas se calculan solas.',
    'paso3-h': 'Recibe alertas y gestiona', 'paso3-p': 'Alertas de helada y lluvia, tareas para tu equipo, plan de cultivo y control de ganancias.',
    'stat1': 'Fincas mapeadas', 'stat2': 'Hectáreas monitoreadas', 'stat3': 'Cultivos soportados', 'stat4': 'Asistente IA',
    'feat1-h': 'Mapea tu finca', 'feat1-p': 'Dibuja el área exacta de tus terrenos sobre un mapa satelital y calcula las hectáreas automáticamente.',
    'feat2-h': 'Clima en tiempo real', 'feat2-p': 'Pronóstico hora a hora para tu zona: temperatura, lluvia, humedad y viento para planificar tu jornada.',
    'feat3-h': 'Gestiona tu equipo', 'feat3-p': 'Registra a tus empleados y asígnales tareas de campo con prioridad y seguimiento en vivo.',
    'feat4-h': 'Tienda agrícola', 'feat4-p': 'Fertilizantes orgánicos, sensores IoT y servicios técnicos a un clic de distancia.',
    'feat5-h': 'Asistente IA', 'feat5-p': 'Consulta plagas, enfermedades y manejo agronómico con CultIA, tu agrónomo virtual 24/7.',
    'footer-p': 'CULTYRA · Proyecto STEAM · CTP José Figueres Ferrer · Costa Rica 🇨🇷 · 2026',
    'tab-login': 'Iniciar Sesión', 'tab-registro': 'Registrarse',
    'lbl-email': 'Correo electrónico', 'lbl-pass': 'Contraseña', 'btn-entrar': 'Entrar', 'lbl-recordar': ' Mantener sesión iniciada',
    'lbl-nombre': 'Nombre completo', 'lbl-tipo': 'Tipo de cuenta', 'lbl-pass6': 'Contraseña (mín. 6 caracteres)', 'lbl-pass2': 'Confirmar contraseña', 'btn-crear': 'Crear cuenta'
  }
};
let idiomaActual = 'es';
function setIdioma(lang) {
  idiomaActual = lang;
  const d = I18N[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    if (d[k] !== undefined) {
      if (k === 'hero-h1') el.innerHTML = d[k];
      else el.textContent = d[k];
    }
  });
  // checkbox recordarme conserva el input
  const rec = document.getElementById('lbl-recordar-txt');
  if (rec) rec.textContent = d['lbl-recordar'];
  document.querySelectorAll('.btn-idioma').forEach(b => b.textContent = lang === 'es' ? '🌐 EN' : '🌐 ES');
  try { localStorage.setItem('cultyra_idioma', lang); } catch (e) {}
}
function toggleIdioma() { setIdioma(idiomaActual === 'es' ? 'en' : 'es'); }
(function () { try { const l = localStorage.getItem('cultyra_idioma'); if (l === 'en') setTimeout(() => setIdioma('en'), 50); } catch (e) {} })();

// ===== BUSCADOR GLOBAL =====
function buscarGlobal(q) {
  const box = document.getElementById('buscador-res');
  q = q.toLowerCase().trim();
  if (!q) { box.classList.remove('open'); return; }
  const res = [];
  fincas.forEach((f, i) => { if ((f.nombre + ' ' + f.ubicacion + ' ' + f.cultivo).toLowerCase().includes(q)) res.push({ g: 'Fincas', t: f.nombre + ' · ' + f.cultivo, ic: '🌾', go: () => irA('cultivo') }); });
  tasks.forEach((t) => { if (t.text.toLowerCase().includes(q)) res.push({ g: 'Tareas', t: t.text, ic: '📋', go: () => irA('cultivo') }); });
  empleados.forEach((e, i) => { if ((e.nombre + ' ' + e.rol).toLowerCase().includes(q)) res.push({ g: 'Empleados', t: e.nombre + ' · ' + e.rol, ic: '👷', go: () => irA('empleados') }); });
  tareasEmpleado.forEach((t) => { if (t.text.toLowerCase().includes(q)) res.push({ g: 'Tareas equipo', t: t.text, ic: '✅', go: () => irA('empleados') }); });
  productos.forEach((p) => { if ((p.name + ' ' + p.desc).toLowerCase().includes(q)) res.push({ g: 'Tienda', t: p.name, ic: '🛒', go: () => irA('productos') }); });

  if (!res.length) { box.innerHTML = '<div class="vacio-b">Sin resultados para "' + q + '"</div>'; box.classList.add('open'); return; }
  const grupos = {};
  res.slice(0, 12).forEach(r => { (grupos[r.g] = grupos[r.g] || []).push(r); });
  box.innerHTML = Object.entries(grupos).map(([g, items]) =>
    `<div class="grupo">${g}</div>` + items.map((r, idx) => `<div class="item" data-go="${g}-${idx}">${r.ic} ${r.t}</div>`).join('')
  ).join('');
  box.classList.add('open');
  // re-asociar clicks
  const planos = [];
  Object.values(grupos).forEach(items => items.forEach(it => planos.push(it)));
  box.querySelectorAll('.item').forEach((el, idx) => {
    el.onclick = () => { box.classList.remove('open'); document.getElementById('buscador-input').value = ''; planos[idx].go(); };
  });
}
document.addEventListener('click', (e) => {
  const bg = document.querySelector('.buscador-global');
  if (bg && !bg.contains(e.target)) { const r = document.getElementById('buscador-res'); if (r) r.classList.remove('open'); }
});
