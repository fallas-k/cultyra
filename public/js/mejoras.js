// ============================================================
// CULTYRA · MEJORAS v1.0
// Items 2,3,4,6,7,8,10,13,18,19,20,21,22,23,24,25,26,
//       28,29,31,32,34,35,36,37,38,40,41,42,43,44,45,46,47,49,50
// ============================================================

// ============================================================
// #2 CURSOR PERSONALIZADO (hoja verde)
// ============================================================
(function() {
  const cur = document.createElement('div');
  cur.id = 'cultyra-cursor';
  cur.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M2 22c1.25-1.25 3.5-2 6-2h8c2.5 0 4.75.75 6 2" stroke="#34c759" stroke-width="2" stroke-linecap="round"/><path d="M4 3a7 7 0 0 1 9 9L4 21l-1-1Z" fill="rgba(52,199,89,0.25)" stroke="#34c759" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  document.body.appendChild(cur);
  document.addEventListener('mousemove', e => {
    cur.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
  });
  document.addEventListener('mousedown', () => cur.classList.add('pressed'));
  document.addEventListener('mouseup', () => cur.classList.remove('pressed'));
  // No mostrar el cursor personalizado en móvil
  if (window.matchMedia('(pointer:coarse)').matches) cur.style.display = 'none';
})();

// ============================================================
// #3 TYPING EFFECT en el hero de la landing
// ============================================================
(function() {
  const el = document.getElementById('l-typing');
  if (!el) return;
  const frases = [
    'monitorea el clima hora a hora',
    'asigna tareas a tu equipo',
    'consulta tu agrónomo IA',
    'controla ganancias y gastos',
    'dibuja el mapa de tu finca',
    'recibe alertas de helada',
  ];
  let fi = 0, ci = 0, borrando = false;
  function tick() {
    const frase = frases[fi];
    if (!borrando) {
      el.textContent = frase.slice(0, ++ci);
      if (ci >= frase.length) { borrando = true; setTimeout(tick, 1800); return; }
    } else {
      el.textContent = frase.slice(0, --ci);
      if (ci <= 0) { borrando = false; fi = (fi + 1) % frases.length; }
    }
    setTimeout(tick, borrando ? 45 : 75);
  }
  setTimeout(tick, 1200);
})();

// ============================================================
// #8 SOCIAL PROOF dinámico en hero
// ============================================================
(function() {
  const el = document.getElementById('l-sp-txt');
  if (!el) return;
  const msgs = [
    '124 agricultores se unieron esta semana',
    'Don José Mora registró su cosecha de papa hoy',
    '3 nuevas fincas agregadas en Cartago hoy',
    'La IA respondió 48 consultas agronómicas hoy',
    '₡2.1M en transacciones procesadas este mes',
  ];
  let i = 0;
  setInterval(() => {
    el.style.opacity = '0';
    setTimeout(() => { el.textContent = msgs[i = (i + 1) % msgs.length]; el.style.opacity = '1'; }, 400);
  }, 4000);
})();

// ============================================================
// #10 FLOATING CTA (móvil, aparece al hacer scroll)
// ============================================================
(function() {
  const btn = document.getElementById('l-float-cta');
  const landing = document.getElementById('landing');
  if (!btn || !landing) return;
  landing.addEventListener('scroll', () => {
    btn.classList.toggle('visible', landing.scrollTop > 300);
  }, { passive: true });
})();

// ============================================================
// #21 BÚSQUEDA GLOBAL Cmd+K
// ============================================================
const CMDК_ITEMS = [
  { label:'Dashboard', icon:'chart', sec:'dashboard' },
  { label:'Mis Fincas / Mapa', icon:'map', sec:'cultivo' },
  { label:'Tareas y equipo', icon:'users', sec:'tareas' },
  { label:'Clima en tiempo real', icon:'rain', sec:'clima' },
  { label:'Sensores IoT', icon:'cpu', sec:'sensores' },
  { label:'Empleados', icon:'users', sec:'empleados' },
  { label:'Registros financieros', icon:'list', sec:'registros' },
  { label:'Calendario de cultivo', icon:'calendar', sec:'calendario' },
  { label:'Comparar fincas', icon:'chart', sec:'comparar' },
  { label:'Asistente IA (CultIA)', icon:'chat', sec:'ia' },
  { label:'Tienda agrícola', icon:'cart', sec:'productos' },
  { label:'Centro de ayuda', icon:'help', sec:'ayuda' },
  { label:'Acerca de Cultyra', icon:'leaf', sec:'acerca' },
];
let cmdKActive = false;

document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); toggleCmdK(); }
  if (e.key === 'Escape') closeCmdK();
});

function toggleCmdK() {
  const ov = document.getElementById('cmdK-overlay');
  if (!ov) return;
  cmdKActive = !cmdKActive;
  ov.classList.toggle('open', cmdKActive);
  if (cmdKActive) {
    const inp = document.getElementById('cmdK-input');
    if (inp) { inp.value = ''; inp.focus(); }
    cmdKSearch('');
  }
}
function closeCmdK(e) {
  if (e && e.target !== document.getElementById('cmdK-overlay')) return;
  cmdKActive = false;
  document.getElementById('cmdK-overlay')?.classList.remove('open');
}
function cmdKSearch(q) {
  const res = document.getElementById('cmdK-results');
  if (!res) return;
  const matches = CMDК_ITEMS.filter(i => i.label.toLowerCase().includes(q.toLowerCase()));
  res.innerHTML = matches.map((m, i) => `
    <button class="cmdK-item ${i===0?'selected':''}" onclick="cmdKGo('${m.sec}')">
      <i class="icon-svg" data-icon="${m.icon}" style="width:16px;height:16px"></i>
      <span>${m.label}</span>
      <kbd class="cmdK-key">↵</kbd>
    </button>`).join('');
  if (typeof injectIcons !== 'undefined') setTimeout(() => injectIcons?.(res), 10);
}
function cmdKGo(sec) {
  closeCmdK();
  cmdKActive = false;
  const btn = Array.from(document.querySelectorAll('.nav-btn')).find(b => (b.getAttribute('onclick')||'').includes(`'${sec}'`));
  if (typeof showSection === 'function') showSection(sec, btn);
}

// ============================================================
// #22 DARK/LIGHT MODE TRANSICIÓN SUAVE
// ============================================================
(function() {
  const style = document.createElement('style');
  style.textContent = 'body, body * { transition: background-color 0.35s ease, color 0.35s ease, border-color 0.35s ease !important; }';
  document.head.appendChild(style);
  // Deshabilitar después de un momento para no interferir con animaciones normales
  setTimeout(() => style.textContent = '', 500);
})();

// ============================================================
// #23 TOOLTIPS en botones del menú
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[title]').forEach(el => {
    if (el.closest('.nav-menu-panel') || el.closest('.mapa-controles') || el.closest('.ia-toolbar')) return;
    el.setAttribute('data-tooltip', el.getAttribute('title'));
    el.removeAttribute('title');
  });
});

// ============================================================
// #24 AUTOSAVE INDICATOR
// ============================================================
let _autoSaveTimer = null;
const _origGuardar = typeof guardar !== 'undefined' ? guardar : null;
// Se sobreescribe en init.js — hook vía MutationObserver en sync-estado
function mostrarGuardando() {
  const el = document.getElementById('sync-estado');
  if (!el) return;
  el.textContent = '💾 Guardando...';
  clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(() => { el.textContent = '✓ Guardado'; setTimeout(() => { el.textContent = '💾 Local'; }, 2000); }, 600);
}

// ============================================================
// #25 UNDO (deshacer última eliminación)
// ============================================================
let _undoStack = [];
function pushUndo(tipo, datos, callback) {
  _undoStack.push({ tipo, datos, callback, ts: Date.now() });
  mostrarUndoToast(tipo);
}
function mostrarUndoToast(tipo) {
  const cont = document.getElementById('toasts');
  if (!cont) return;
  const el = document.createElement('div');
  el.className = 'toast info undo-toast';
  el.innerHTML = `
    <div class="toast-icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="18" height="18"><path d="M3 7v6h6"/><path d="M3 13C3 8.58 6.58 5 11 5a8 8 0 1 1 0 16"/></svg></div>
    <div class="toast-body"><div class="toast-title">Elemento eliminado</div><div class="toast-sub">${tipo}</div></div>
    <button class="toast-undo-btn" onclick="ejecutarUndo(this)">Deshacer</button>
    <div class="toast-prog"><div class="toast-prog-fill"></div></div>`;
  cont.appendChild(el);
  const fill = el.querySelector('.toast-prog-fill');
  if (fill) { fill.style.transitionDuration = '5000ms'; requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = '0%'; })); }
  setTimeout(() => { el.classList.add('fuera'); setTimeout(() => el.remove(), 320); }, 5000);
}
function ejecutarUndo(btn) {
  const u = _undoStack.pop();
  if (u) u.callback(u.datos);
  btn.closest('.toast')?.remove();
}

// ============================================================
// #26 DRAG AND DROP en lista de tareas
// ============================================================
let _dndDragging = null;
function activarDragTasks() {
  const list = document.getElementById('tasks-list');
  if (!list) return;
  list.querySelectorAll('.task-item').forEach((item, i) => {
    item.setAttribute('draggable', 'true');
    item.dataset.idx = i;
    item.addEventListener('dragstart', e => {
      _dndDragging = i;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    item.addEventListener('dragend', () => item.classList.remove('dragging'));
    item.addEventListener('dragover', e => {
      e.preventDefault();
      item.classList.add('drag-over');
    });
    item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
    item.addEventListener('drop', e => {
      e.preventDefault();
      item.classList.remove('drag-over');
      const from = _dndDragging, to = i;
      if (from === null || from === to) return;
      const moved = tasks.splice(from, 1)[0];
      tasks.splice(to, 0, moved);
      guardar(); renderTasks();
    });
  });
}

// ============================================================
// #32 KPIs con comparativa mes anterior en dashboard
// ============================================================
function calcMesAnterior() {
  const ahora = new Date();
  const esteMes = { v: 0, g: 0, c: 0 };
  const mesPasado = { v: 0, g: 0, c: 0 };
  if (typeof registros === 'undefined') return { esteMes, mesPasado };
  registros.forEach(r => {
    const f = new Date(r.fecha);
    const mismo = f.getFullYear() === ahora.getFullYear() && f.getMonth() === ahora.getMonth();
    const anterior = f.getFullYear() === (ahora.getMonth() === 0 ? ahora.getFullYear() - 1 : ahora.getFullYear()) && f.getMonth() === (ahora.getMonth() === 0 ? 11 : ahora.getMonth() - 1);
    const dest = mismo ? esteMes : anterior ? mesPasado : null;
    if (!dest) return;
    if (r.tipo === 'venta') dest.v += r.monto;
    else if (r.tipo === 'gasto') dest.g += r.monto;
    else if (r.tipo === 'cosecha') dest.c += r.monto;
  });
  return { esteMes, mesPasado };
}
function renderComparativaMes() {
  const el = document.getElementById('dash-comparativa');
  if (!el) return;
  const { esteMes, mesPasado } = calcMesAnterior();
  const ganActual = esteMes.v - esteMes.g;
  const ganPasado = mesPasado.v - mesPasado.g;
  const diff = mesPasado.v ? Math.round(((esteMes.v - mesPasado.v) / mesPasado.v) * 100) : null;
  const up = diff !== null && diff >= 0;
  el.innerHTML = `<div class="comp-mes-fila"><span>Ventas este mes</span><b>${fmtColones(esteMes.v)}</b>${diff !== null ? `<span class="kpi-badge-trend ${up?'up':'down'}" style="display:inline-flex">${up?'▲':'▼'} ${Math.abs(diff)}% vs mes ant.</span>` : ''}</div>
    <div class="comp-mes-fila"><span>Gastos este mes</span><b>${fmtColones(esteMes.g)}</b></div>
    <div class="comp-mes-fila comp-mes-gan"><span>Ganancia neta</span><b style="color:${ganActual>=0?'#34c759':'#f87171'}">${fmtColones(ganActual)}</b></div>`;
}

// ============================================================
// #36 COMPARTIR FINCA (link de solo lectura)
// ============================================================
function compartirFinca(idx) {
  if (typeof fincas === 'undefined' || !fincas[idx]) return;
  const f = fincas[idx];
  const data = btoa(encodeURIComponent(JSON.stringify({ n: f.nombre, u: f.ubicacion, c: f.cultivo, a: f.area, coords: f.coords || [] })));
  const url = `${location.origin}/#finca=${data}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => toast('Link copiado al portapapeles 🔗', 'ok', { title: 'Finca compartida' }));
  } else {
    prompt('Copia este enlace:', url);
  }
}

// ============================================================
// #37/#38/#40/#41 MEJORAS AL MAPA
// ============================================================
let _capaMapa = 'sat', _capaActual = null, _mapaDistancia = false, _ptsDist = [], _lineaDist = null;

function setCapaMapa(tipo, btn) {
  _capaMapa = tipo;
  if (typeof mapaGeneral === 'undefined' || !mapaGeneral) return;
  if (_capaActual) mapaGeneral.removeLayer(_capaActual);
  if (tipo === 'sat') {
    _capaActual = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri', maxZoom: 19 });
  } else {
    _capaActual = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM', maxZoom: 19 });
  }
  _capaActual.addTo(mapaGeneral);
  document.querySelectorAll('.btn-mapa-ctrl').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function centrarMapa() {
  if (typeof mapaGeneral === 'undefined' || !mapaGeneral) return;
  if (typeof capaFincas !== 'undefined' && capaFincas && capaFincas.getLayers().length) {
    try { mapaGeneral.fitBounds(capaFincas.getBounds().pad(0.3)); } catch (e) {}
  } else {
    mapaGeneral.setView([9.7489, -83.7534], 8);
  }
  toast('Mapa centrado en tus fincas.', 'ok', { title: 'Centrado' });
}

function toggleDistancia() {
  _mapaDistancia = !_mapaDistancia;
  _ptsDist = [];
  if (_lineaDist && mapaGeneral) { mapaGeneral.removeLayer(_lineaDist); _lineaDist = null; }
  const btn = document.getElementById('btn-distancia');
  const res = document.getElementById('distancia-resultado');
  if (btn) btn.classList.toggle('active', _mapaDistancia);
  if (res) res.style.display = 'none';
  if (_mapaDistancia && typeof mapaGeneral !== 'undefined' && mapaGeneral) {
    toast('Haz clic en dos puntos del mapa para medir la distancia.', 'info', { title: 'Medir distancia' });
    mapaGeneral.once('click', p1 => {
      _ptsDist.push(p1.latlng);
      mapaGeneral.once('click', p2 => {
        _ptsDist.push(p2.latlng);
        const dist = _ptsDist[0].distanceTo(_ptsDist[1]);
        const txt = dist >= 1000 ? `${(dist/1000).toFixed(2)} km` : `${Math.round(dist)} m`;
        if (res) { res.textContent = `📏 ${txt}`; res.style.display = 'inline'; }
        _lineaDist = L.polyline(_ptsDist, { color: '#f59e0b', weight: 3, dashArray: '8 4' }).addTo(mapaGeneral);
        _lineaDist.bindPopup(`Distancia: ${txt}`).openPopup();
        _mapaDistancia = false;
        if (btn) btn.classList.remove('active');
      });
    });
  }
}

// Etiquetas sobre polígonos de fincas (#40) — override pintarFincas
const _origPintarFincas = typeof pintarFincas !== 'undefined' ? pintarFincas : null;
function pintarFincasConLabels() {
  if (typeof capaFincas === 'undefined' || !capaFincas) return;
  capaFincas.clearLayers();
  let hayPol = false;
  (typeof fincas !== 'undefined' ? fincas : []).forEach(f => {
    if (f.coords && f.coords.length) {
      hayPol = true;
      const poly = L.polygon(f.coords, { color: '#2d6a4f', fillColor: '#52b788', fillOpacity: 0.35 })
        .bindPopup(`<b>${f.nombre}</b><br>${f.cultivo} · ${f.area} ha<br>📍 ${f.ubicacion}`)
        .addTo(capaFincas);
      // Etiqueta permanente sobre el polígono
      const centro = poly.getBounds().getCenter();
      L.marker(centro, {
        icon: L.divIcon({ className: 'finca-label-icon', html: `<span class="finca-map-label">${f.nombre}</span>`, iconAnchor: [0, 0] }),
        interactive: false
      }).addTo(capaFincas);
    } else if (f.centro) {
      L.marker(f.centro).bindPopup(`<b>${f.nombre}</b><br>${f.cultivo} · ${f.area} ha`).addTo(capaFincas);
    }
  });
  if (hayPol || capaFincas.getLayers().length) {
    try { mapaGeneral.fitBounds(capaFincas.getBounds().pad(0.3)); } catch (e) {}
  }
}

// ============================================================
// #42 WISHLIST (favoritos en la tienda)
// ============================================================
let wishlist = JSON.parse(localStorage.getItem('cultyra_wish') || '[]');
function toggleWish(id) {
  const idx = wishlist.indexOf(id);
  if (idx === -1) wishlist.push(id);
  else wishlist.splice(idx, 1);
  localStorage.setItem('cultyra_wish', JSON.stringify(wishlist));
  renderProductos();
  actualizarWishCount();
}
function actualizarWishCount() {
  const el = document.getElementById('wish-count');
  if (!el) return;
  el.textContent = wishlist.length;
  el.style.display = wishlist.length ? 'inline' : 'none';
}
function verWishlist() {
  const prevFilter = activeFilter, prevBusq = busquedaTienda;
  const wishProds = (typeof productos !== 'undefined' ? productos : []).filter(p => wishlist.includes(p.id));
  if (!wishProds.length) { toast('No tienes productos en favoritos aún. Haz clic en ❤️ para agregar.', 'info', { title: 'Mis favoritos' }); return; }
  toast(`${wishlist.length} producto(s) en favoritos`, 'ok', { title: '❤️ Mis favoritos' });
}

// ============================================================
// #43 COMPARAR PRODUCTOS
// ============================================================
let productosAComparar = [];
function toggleComparar(id) {
  const idx = productosAComparar.indexOf(id);
  if (idx === -1) {
    if (productosAComparar.length >= 3) { toast('Máximo 3 productos para comparar.', 'warn', { title: 'Comparar' }); return; }
    productosAComparar.push(id);
  } else {
    productosAComparar.splice(idx, 1);
  }
  renderProductos();
  document.getElementById('comp-fab')?.remove();
  if (productosAComparar.length >= 2) {
    const fab = document.createElement('button');
    fab.id = 'comp-fab';
    fab.className = 'comp-fab-btn';
    fab.textContent = `⚖️ Comparar (${productosAComparar.length})`;
    fab.onclick = abrirComparacion;
    document.body.appendChild(fab);
  }
}
function abrirComparacion() {
  const prods = (typeof productos !== 'undefined' ? productos : []).filter(p => productosAComparar.includes(p.id));
  if (prods.length < 2) return;
  const cols = prods.map(p => `<th>${p.name}</th>`).join('');
  const rows = [
    ['Precio', prods.map(p => `<td>${fmtColones(p.precio)}${p.mensual?'/mes':''}</td>`).join('')],
    ['Categoría', prods.map(p => `<td>${{sensor:'Sensor IoT',biodegradable:'Biodegradable',servicio:'Servicio'}[p.category]}</td>`).join('')],
    ['Descripción', prods.map(p => `<td style="font-size:12px">${p.desc}</td>`).join('')],
    ['', prods.map(p => `<td><button class="btn-add" onclick="addToCart(${p.id})">+ Carrito</button></td>`).join('')]
  ].map(([label, cells]) => `<tr><th class="comp-row-head">${label}</th>${cells}</tr>`).join('');
  document.getElementById('comp-tabla').innerHTML = `<table class="comp-table"><thead><tr><th></th>${cols}</tr></thead><tbody>${rows}</tbody></table>`;
  document.getElementById('comp-modal').classList.add('open');
}
function cerrarComparacion() {
  document.getElementById('comp-modal').classList.remove('open');
}

// ============================================================
// #44 CUPÓN DE DESCUENTO en checkout
// ============================================================
const CUPONES = { CULTYRA10: 10, STEAM2026: 15, AGRO25: 25, BIENVENIDO: 5 };
let cuponActivo = null;
function aplicarCupon() {
  const input = document.getElementById('cupon-input');
  if (!input) return;
  const codigo = input.value.trim().toUpperCase();
  if (CUPONES[codigo]) {
    cuponActivo = { codigo, pct: CUPONES[codigo] };
    input.classList.add('cupon-ok');
    document.getElementById('cupon-msg').textContent = `✅ ${CUPONES[codigo]}% de descuento aplicado`;
    document.getElementById('cupon-msg').className = 'cupon-msg ok';
    renderResumenCheckout();
    toast(`Cupón aplicado: ${CUPONES[codigo]}% de descuento 🎉`, 'ok', { title: codigo });
  } else {
    cuponActivo = null;
    input.classList.remove('cupon-ok');
    document.getElementById('cupon-msg').textContent = 'Cupón no válido';
    document.getElementById('cupon-msg').className = 'cupon-msg error';
  }
}
function calcTotalConCupon() {
  const base = (typeof carrito !== 'undefined' ? carrito : []).reduce((s, c) => {
    const p = (typeof productos !== 'undefined' ? productos : []).find(p => p.id === c.id);
    return s + (p ? p.precio * c.qty : 0);
  }, 0);
  if (!cuponActivo) return base;
  return Math.round(base * (1 - cuponActivo.pct / 100));
}

// ============================================================
// #45 RATINGS Y RESEÑAS DE PRODUCTOS
// ============================================================
let ratings = JSON.parse(localStorage.getItem('cultyra_ratings') || '{}');
let ratingProdActual = null, ratingEstrellas = 0;

function abrirRating(id) {
  ratingProdActual = id;
  ratingEstrellas = 0;
  const p = (typeof productos !== 'undefined' ? productos : []).find(p => p.id === id);
  document.getElementById('rating-prod-name').textContent = p?.name || '';
  renderStarsInput();
  document.getElementById('rating-comment').value = '';
  document.getElementById('rating-modal').classList.add('open');
}
function renderStarsInput() {
  const el = document.getElementById('rating-stars-input');
  if (!el) return;
  el.innerHTML = [1,2,3,4,5].map(n => `<button class="star-btn ${n<=ratingEstrellas?'on':''}" onclick="setRatingStar(${n})">★</button>`).join('');
}
function setRatingStar(n) { ratingEstrellas = n; renderStarsInput(); }
function guardarRating() {
  if (!ratingProdActual || ratingEstrellas === 0) { toast('Selecciona al menos 1 estrella.', 'warn', { title: 'Calificación' }); return; }
  if (!ratings[ratingProdActual]) ratings[ratingProdActual] = [];
  ratings[ratingProdActual].push({ stars: ratingEstrellas, comment: document.getElementById('rating-comment').value.trim(), fecha: new Date().toISOString() });
  localStorage.setItem('cultyra_ratings', JSON.stringify(ratings));
  document.getElementById('rating-modal').classList.remove('open');
  toast('¡Gracias por tu calificación! ⭐', 'ok', { title: 'Calificación guardada' });
  renderProductos();
}
function getAvgRating(id) {
  const rs = ratings[id];
  if (!rs || !rs.length) return null;
  return (rs.reduce((s, r) => s + r.stars, 0) / rs.length).toFixed(1);
}

// ============================================================
// #46 ESTADO DE ENVÍO en Mis Pedidos
// ============================================================
const ESTADOS_ENVIO = ['pendiente','confirmado','en_camino','entregado'];
const ESTADOS_LABEL = { pendiente:'⏳ Pendiente', confirmado:'✅ Confirmado', en_camino:'🚚 En camino', entregado:'📦 Entregado', pagado:'✅ Pagado', cancelado:'✖ Cancelado' };

// ============================================================
// #47 HISTORIAL DE CONVERSACIONES CultIA
// ============================================================
let chatSessions = JSON.parse(localStorage.getItem('cultyra_chat_sessions') || '[]');
function guardarSesionChat() {
  if (typeof chatHistory === 'undefined' || !chatHistory.length) return;
  const fecha = new Date().toLocaleDateString('es-CR');
  const preview = chatHistory[0]?.content?.slice(0, 60) + '...' || 'Conversación';
  chatSessions.unshift({ id: Date.now(), fecha, preview, messages: [...chatHistory] });
  if (chatSessions.length > 10) chatSessions.pop();
  localStorage.setItem('cultyra_chat_sessions', JSON.stringify(chatSessions));
}

// ============================================================
// #49 MODO URGENTE CultIA (respuestas cortas)
// ============================================================
let modoUrgente = false;
function toggleModoUrgente() {
  modoUrgente = !modoUrgente;
  const btn = document.getElementById('btn-urgente');
  if (btn) { btn.classList.toggle('active', modoUrgente); btn.textContent = modoUrgente ? '⚡ Urgente ON' : '⚡ Modo urgente'; }
  toast(modoUrgente ? 'Modo urgente: respuestas en 3 pasos rápidos.' : 'Modo urgente desactivado.', modoUrgente ? 'warn' : 'ok', { title: 'CultIA' });
}
function getSistemaPromptIA() {
  if (modoUrgente) return 'Eres CultIA. Responde SOLO en 3 pasos numerados, sin explicaciones largas. Máximo 60 palabras por respuesta. Solo temas agronómicos.';
  return null; // usa el default del servidor
}

// ============================================================
// #50 EXPORTAR CHAT A PDF
// ============================================================
function exportarChatPDF() {
  if (typeof chatHistory === 'undefined' || !chatHistory.length) { toast('No hay mensajes para exportar.', 'warn', { title: 'PDF' }); return; }
  if (!window.jspdf) { toast('Módulo PDF no disponible.', 'error', { title: 'PDF' }); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const hoy = new Date().toLocaleDateString('es-CR', { day:'numeric', month:'long', year:'numeric' });
  doc.setFillColor(26,58,31); doc.rect(0,0,210,22,'F');
  doc.setTextColor(255,255,255); doc.setFontSize(14); doc.setFont(undefined,'bold');
  doc.text('CultIA – Diagnóstico de mi cultivo', 14, 15);
  doc.setTextColor(60,60,60); doc.setFontSize(9); doc.setFont(undefined,'normal');
  doc.text(`Generado: ${hoy}`, 14, 30);
  let y = 40;
  chatHistory.forEach(m => {
    if (y > 270) { doc.addPage(); y = 20; }
    const label = m.role === 'user' ? '🧑 Agricultor:' : '🤖 CultIA:';
    doc.setFont(undefined,'bold'); doc.setTextColor(m.role==='user'?45:22,m.role==='user'?106:58,m.role==='user'?79:31);
    doc.text(label, 14, y); y += 5;
    doc.setFont(undefined,'normal'); doc.setTextColor(40,40,40);
    const lines = doc.splitTextToSize((m.content||'').replace(/\*\*/g,'').replace(/_/g,''), 180);
    lines.forEach(l => { if(y>275){doc.addPage();y=20;} doc.text(l,16,y); y+=5; });
    y += 3;
  });
  doc.setFontSize(8); doc.setTextColor(120,120,120);
  doc.text('CULTYRA · Proyecto STEAM · CTP José Figueres Ferrer · soportecultyra@gmail.com', 14, 290);
  doc.save(`cultyra-cultia-${Date.now()}.pdf`);
  guardarSesionChat();
  toast('PDF descargado.', 'ok', { title: 'Diagnóstico exportado' });
}

function borrarHistorialChat() {
  guardarSesionChat();
  if (typeof chatHistory !== 'undefined') { chatHistory.length = 0; }
  const cont = document.getElementById('chat-messages');
  const typing = document.getElementById('typing');
  if (cont && typing) {
    while (cont.firstChild && cont.firstChild !== typing) cont.removeChild(cont.firstChild);
  }
  document.getElementById('ia-suggestions').style.display = '';
  toast('Nueva conversación iniciada.', 'ok', { title: 'CultIA' });
}

// ============================================================
// #34 NOTIFICACIONES PUSH desde Service Worker
// ============================================================
function registrarPushSW() {
  if ('serviceWorker' in navigator && 'Notification' in window) {
    Notification.requestPermission().then(p => {
      if (p === 'granted') {
        navigator.serviceWorker.ready.then(reg => {
          reg.active?.postMessage({ type: 'INIT_PUSH' });
        });
      }
    });
  }
}

// ============================================================
// #29 GRID / LIST TOGGLE en Tienda
// ============================================================
let tiendaVista = 'grid';
function setTiendaVista(v, btn) {
  tiendaVista = v;
  document.querySelectorAll('.btn-view').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const grid = document.getElementById('productos-grid');
  if (grid) { grid.classList.toggle('productos-lista', v === 'list'); }
}

// ============================================================
// INIT: conectar mejoras al DOM existente
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  actualizarWishCount();

  // Agregar comparativa mes en dashboard
  const dashGrid = document.querySelector('.dash-grid');
  if (dashGrid && !document.getElementById('dash-comparativa')) {
    const card = document.createElement('div');
    card.className = 'dash-card';
    card.innerHTML = `<h3><i class="icon-svg" data-icon="trend"></i> vs mes anterior</h3><div id="dash-comparativa" style="font-size:13px;color:var(--text-mid);">Cargando...</div>`;
    dashGrid.appendChild(card);
  }

  // Agregar campo de cupón en checkout step-1
  const chkDir = document.getElementById('chk-direccion');
  if (chkDir && !document.getElementById('cupon-input')) {
    const div = document.createElement('div');
    div.className = 'modal-group cupon-group';
    div.innerHTML = `<label>Cupón de descuento (opcional)</label><div class="cupon-wrap"><input type="text" id="cupon-input" placeholder="Ej. CULTYRA10"><button type="button" class="btn-cupon" onclick="aplicarCupon()">Aplicar</button></div><div id="cupon-msg" class="cupon-msg"></div>`;
    chkDir.closest('.modal-group').insertAdjacentElement('afterend', div);
  }

  // Agregar botones ❤️ y ⚖️ en productos (override render)
  const origRender = typeof renderProductos !== 'undefined' ? renderProductos : null;
  if (origRender) {
    const wrappedRender = origRender;
    window.renderProductos = function() {
      wrappedRender();
      // Agregar botones de wishlist, comparar y rating a las tarjetas
      document.querySelectorAll('.producto-card').forEach(card => {
        const btn = card.querySelector('.btn-add');
        if (!btn || card.querySelector('.prod-extra-btns')) return;
        const id = parseInt(btn.getAttribute('onclick').match(/\d+/)?.[0]);
        if (!id) return;
        const avg = getAvgRating(id);
        const enWish = wishlist.includes(id);
        const enComp = productosAComparar.includes(id);
        const extra = document.createElement('div');
        extra.className = 'prod-extra-btns';
        extra.innerHTML = `
          <button class="prod-icon-btn ${enWish?'wish-on':''}" onclick="toggleWish(${id})" title="${enWish?'Quitar de favoritos':'Agregar a favoritos'}">♥</button>
          <button class="prod-icon-btn ${enComp?'comp-on':''}" onclick="toggleComparar(${id})" title="Comparar">⚖</button>
          <button class="prod-icon-btn" onclick="abrirRating(${id})" title="Calificar">${avg ? `★${avg}` : '☆'}</button>`;
        card.querySelector('.producto-body').appendChild(extra);
      });
    };
    window.renderProductos();
  }

  // Drag & drop en tareas (después de cada render)
  const origRenderTasks = typeof renderTasks !== 'undefined' ? renderTasks : null;
  if (origRenderTasks) {
    window.renderTasks = function() {
      origRenderTasks();
      setTimeout(activarDragTasks, 50);
    };
  }

  // Reemplazar pintarFincas con versión con labels
  if (typeof pintarFincas !== 'undefined') {
    window.pintarFincas = pintarFincasConLabels;
  }

  // Autosave hook en botones de guardar
  document.addEventListener('click', e => {
    if (e.target.closest('[onclick*="addFinca"],[onclick*="addTask"],[onclick*="addRegistro"],[onclick*="addEmpleado"]')) {
      setTimeout(mostrarGuardando, 100);
    }
  });
});

// ============================================================
// Analytics helper (Firebase - reemplazar G-PLACEHOLDER)
// ============================================================
function trackEvent(nombre, params) {
  if (typeof gtag === 'function') gtag('event', nombre, params || {});
}
