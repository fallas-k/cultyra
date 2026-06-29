// ============================================================
// CULTYRA · UI
// ============================================================

// ===== NAVIGATION =====
let _faqInit = false;
function showSection(id, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const sec = document.getElementById(id);
  if (!sec) return;
  sec.classList.add('active');
  if(btn) btn.classList.add('active');
  window.scrollTo(0, 0);
  if(id === 'cultivo') { initMapaGeneral(); setTimeout(() => { if(window.mapaGeneral) window.mapaGeneral.invalidateSize(); }, 350); }
  if(id === 'dashboard') renderDashboard();
  if(id === 'registros') renderRegistros();
  if(id === 'calendario') renderCalendario();
  if(id === 'comparar') renderComparar();
  if(id === 'cultivo') renderBitacora();
  if(id === 'ia') { if(typeof initIASection === 'function') setTimeout(initIASection, 100); }
  if(id === 'informacion') {
    if(!_faqInit && typeof renderFAQ === 'function') { renderFAQ(); _faqInit = true; }
    if(typeof actualizarStatsInfo === 'function') actualizarStatsInfo();
  }
}

// irA — navegar a una sección desde cualquier parte de la app
function irA(id) {
  const navBtns = document.querySelectorAll('.nav-btn');
  const map = { 'dashboard':0, 'informacion':1, 'cultivo':2, 'clima':3, 'empleados':4,
                'registros':5, 'calendario':6, 'comparar':7, 'ia':8, 'productos':9, 'ayuda':10 };
  const idx = map[id];
  const btn = idx !== undefined ? navBtns[idx] : null;
  showSection(id, btn);
}

// landingScroll — scroll suave en la landing page
function landingScroll(id) {
  if(event) event.preventDefault();
  const el = document.getElementById(id);
  if(el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== MENÚ HAMBURGUESA =====
function toggleNavMenu() {
  document.getElementById('nav-menu-panel').classList.toggle('open');
  document.getElementById('nav-menu-overlay').classList.toggle('open');
  document.getElementById('nav-burger').classList.toggle('open');
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

// ===== FAQ ACORDEÓN =====
const FAQ_ITEMS = [
  { q: "¿Cultyra es completamente gratis?", a: "El plan básico es 100% gratuito. Incluye gestión de fincas, clima, tareas, empleados, registros y CultIA. Los planes de pago ofrecen monitoreo IoT y visitas técnicas." },
  { q: "¿Necesito instalar algo en mi celular?", a: "No. Cultyra es una PWA. Entrá desde Chrome en cultyraagro.web.app y funciona como app nativa. Podés agregarla a la pantalla de inicio pero no es obligatorio." },
  { q: "¿Mis datos están seguros?", a: "Sí. Los datos se almacenan con cifrado TLS 1.3 en Google Cloud (Firebase) y Railway. Solo vos podés acceder a tus datos. Nunca compartimos información con terceros." },
  { q: "¿Funciona sin internet?", a: "Cultyra tiene modo offline básico con Service Worker. Podés ver información ya cargada. Las funciones de sincronización, clima en tiempo real y CultIA requieren internet." },
  { q: "¿Cómo agrego empleados?", a: "En 'Empleados' → '+ Agregar empleado'. Completás sus datos y si querés que accedan a la app, agregás correo y contraseña temporal. El empleado ve sus tareas, clima y CultIA." },
  { q: "¿Qué cultivos conoce CultIA?", a: "CultIA conoce más de 50 cultivos: tomate, maíz, frijol, café, banano, piña, cacao, aguacate, cítricos, cebolla, chile, brócoli, fresa, yuca, chayote y muchos más. También conoce agricultura de todo el mundo." },
  { q: "¿Cómo funciona el mapa de fincas?", a: "En 'Mi Cultivo' → '+ Agregar Finca'. Se abre un mapa satelital. Buscás tu zona, presionás 'Dibujar terreno' y marcás las esquinas de tu finca. El sistema calcula las hectáreas automáticamente." },
  { q: "¿Puedo subir fotos de plagas a la IA?", a: "Sí. En CultIA hay un botón 📸 para tomar foto o subirla desde la galería. La IA analiza la imagen y te da un diagnóstico con nivel de urgencia (🔴🟡🟢) y tratamiento recomendado." },
  { q: "¿Cómo compro los productos?", a: "En 'Productos' agregás artículos al carrito y al finalizar se genera un mensaje de WhatsApp con tu pedido completo para enviarlo al +506 6205-3039." },
  { q: "¿Cómo contacto soporte?", a: "Por WhatsApp al +506 6205-3039, por correo a soportecultyra@gmail.com, o consulta directamente a CultIA disponible las 24 horas." },
];

function renderFAQ() {
  const el = document.getElementById('faq-list');
  if (!el) return;
  el.innerHTML = FAQ_ITEMS.map((item, i) => `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:6px">
      <button onclick="toggleFAQ(${i})" style="width:100%;text-align:left;background:none;border:none;padding:14px 18px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:12px;font-family:'DM Sans',sans-serif">
        <span style="font-size:14px;font-weight:600;color:var(--text-dark)">${item.q}</span>
        <span id="faq-icon-${i}" style="font-size:18px;color:var(--green-bright);flex-shrink:0;transition:transform .25s">+</span>
      </button>
      <div id="faq-body-${i}" style="display:none;padding:0 18px 14px">
        <p style="font-size:13px;color:var(--text-mid);line-height:1.7;margin:0">${item.a}</p>
      </div>
    </div>`).join('');
}

function toggleFAQ(i) {
  const body = document.getElementById('faq-body-' + i);
  const icon = document.getElementById('faq-icon-' + i);
  const open = body.style.display === 'block';
  FAQ_ITEMS.forEach((_, j) => {
    const b = document.getElementById('faq-body-' + j);
    const ic = document.getElementById('faq-icon-' + j);
    if (b) b.style.display = 'none';
    if (ic) { ic.style.transform = ''; ic.textContent = '+'; }
  });
  if (!open && body) {
    body.style.display = 'block';
    if (icon) icon.style.transform = 'rotate(45deg)';
  }
}

// ===== ESTADÍSTICAS REALES =====
function actualizarStatsInfo() {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('info-fincas', (typeof fincas !== 'undefined' ? fincas.length : 0));
  set('info-tareas', (typeof tasks !== 'undefined' ? tasks.length : 0) + (typeof tareasEmpleado !== 'undefined' ? tareasEmpleado.length : 0));
  set('info-registros', (typeof registros !== 'undefined' ? registros.length : 0));
  set('info-empleados', (typeof empleados !== 'undefined' ? empleados.length : 0));
  set('stat-fincas', (typeof fincas !== 'undefined' ? fincas.length : 0));
  set('stat-registros', (typeof registros !== 'undefined' ? registros.length : 0));
}

// ===== NOTIFICACIONES PUSH =====
async function activarNotificaciones() {
  if (!('Notification' in window)) { toast('Tu navegador no soporta notificaciones.', 'error'); return; }
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    toast('✅ Notificaciones activadas. Te avisaremos cuando una tarea esté por vencer.');
    try { localStorage.setItem('cultyra_notif', '1'); } catch(e){}
    programarRevisionTareas();
  } else {
    toast('Notificaciones bloqueadas. Actívalas en la configuración del navegador.', 'error');
  }
}
function programarRevisionTareas() {
  setInterval(revisarTareasHoy, 60 * 60 * 1000);
  revisarTareasHoy();
}
function revisarTareasHoy() {
  if (Notification.permission !== 'granted') return;
  const hoy = new Date().toISOString().split('T')[0];
  const vencen = (typeof tasks !== 'undefined' ? tasks : []).filter(t => !t.done && t.fecha === hoy);
  if (vencen.length > 0) {
    new Notification('🌱 CULTYRA — Tareas pendientes hoy', {
      body: `Tenés ${vencen.length} tarea(s) que vencen hoy: ${vencen.map(t => t.text).join(', ')}`,
      icon: 'img/logo.png'
    });
  }
}

// ===== IA SECTION INIT =====
function initIASection() {
  if (typeof actualizarChipsFinca === 'function') actualizarChipsFinca();
  const badge = document.getElementById('ia-personalizacion');
  if (badge) {
    const nFincas = typeof fincas !== 'undefined' ? fincas.length : 0;
    if (nFincas > 0) {
      badge.textContent = `🌾 Personalizada para ${nFincas} finca(s)`;
      badge.style.display = 'inline-block';
    } else {
      badge.textContent = '⚡ Agregá tu finca para respuestas personalizadas';
      badge.style.display = 'inline-block';
    }
  }
}

