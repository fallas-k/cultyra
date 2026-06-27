// ============================================================
// CULTYRA · MEJORAS v2.0  (50 mejoras adicionales)
// ============================================================

// ============================================================
// #1 LAZY LOADING con IntersectionObserver y blur-up
// ============================================================
(function() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const img = e.target;
      const src = img.dataset.src;
      if (!src) return;
      const tmp = new Image();
      tmp.onload = () => {
        img.src = src;
        img.classList.add('loaded');
        img.removeAttribute('data-src');
      };
      tmp.src = src;
      obs.unobserve(img);
    });
  }, { rootMargin: '200px' });

  function observeImages() {
    document.querySelectorAll('img[data-src]:not([data-lazy-init])').forEach(img => {
      img.dataset.lazyInit = '1';
      img.classList.add('lazy-img');
      obs.observe(img);
    });
  }
  observeImages();
  new MutationObserver(observeImages).observe(document.body, { childList: true, subtree: true });
})();

// ============================================================
// #2 WEB SHARE API
// ============================================================
function compartirNativo(titulo, texto, url) {
  if (navigator.share) {
    navigator.share({ title: titulo, text: texto, url: url || location.href })
      .catch(() => {});
  } else {
    if (navigator.clipboard) navigator.clipboard.writeText(url || location.href);
    if (typeof toast === 'function') toast('Link copiado 🔗', 'ok', { title: 'Compartido' });
  }
}
function compartirApp() {
  compartirNativo('CULTYRA', 'Gestiona tus fincas con tecnología 🌱', 'https://cultyraagro.web.app');
}
function compartirDiagnostico() {
  compartirNativo('Diagnóstico CultIA', 'Mi agrónomo IA de Cultyra me dió este diagnóstico:', location.href);
}

// ============================================================
// #3 INDEXEDDB — almacenamiento offline robusto
// ============================================================
const CultyrаDB = (function() {
  let _db = null;
  const DB_NAME = 'cultyra_idb', DB_VER = 1;

  function open() {
    return new Promise((res, rej) => {
      if (_db) return res(_db);
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        ['datos', 'registros', 'pedidos', 'bitacora', 'chatHistory'].forEach(store => {
          if (!db.objectStoreNames.contains(store))
            db.createObjectStore(store, { keyPath: 'id', autoIncrement: true });
        });
      };
      req.onsuccess = e => { _db = e.target.result; res(_db); };
      req.onerror = () => rej(req.error);
    });
  }

  async function set(store, key, value) {
    const db = await open();
    return new Promise((res, rej) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put({ id: key, value, ts: Date.now() });
      tx.oncomplete = res; tx.onerror = rej;
    });
  }

  async function get(store, key) {
    const db = await open();
    return new Promise((res, rej) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => res(req.result?.value);
      req.onerror = rej;
    });
  }

  return { set, get, open };
})();

// ============================================================
// #4 ERROR BOUNDARY
// ============================================================
window.addEventListener('error', (e) => {
  const errDiv = document.getElementById('cultyra-error-boundary');
  if (errDiv) { errDiv.style.display = 'flex'; errDiv.querySelector('.err-msg').textContent = e.message; }
  console.error('[Cultyra Error]', e);
});
window.addEventListener('unhandledrejection', (e) => {
  console.warn('[Cultyra Promise]', e.reason);
});

// ============================================================
// #5 SKELETON LOADERS en dashboard
// ============================================================
function mostrarSkeletonDash() {
  const temp = document.getElementById('dash-clima-temp');
  const sub = document.getElementById('dash-clima-sub');
  if (temp) temp.innerHTML = '<div class="skeleton skeleton-line w-60" style="height:28px;margin:0"></div>';
  if (sub) sub.innerHTML = '<div class="skeleton skeleton-line w-80"></div>';
}
document.addEventListener('DOMContentLoaded', () => {
  mostrarSkeletonDash();
  setTimeout(() => {
    ['dash-lista-tareas', 'dash-resumen'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.innerHTML.includes('Cargando')) {
        el.innerHTML = '<div class="skeleton skeleton-line w-80"></div><div class="skeleton skeleton-line w-60"></div>';
      }
    });
  }, 100);
});

// ============================================================
// #8 COMPRESIÓN LZ simple para localStorage
// ============================================================
function lzCompress(str) {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p) => String.fromCharCode('0x' + p)));
  } catch { return str; }
}
function lzDecompress(str) {
  try {
    return decodeURIComponent(atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  } catch { return str; }
}

// ============================================================
// #9 ONBOARDING TOUR interactivo
// ============================================================
const TOUR_PASOS = [
  { sel: '.nav-logo', titulo: '¡Bienvenido a CULTYRA! 🌱', texto: 'Esta es tu plataforma de agrotecnología costarricense. Te guiamos en un recorrido rápido.', pos: 'bottom' },
  { sel: '#btn-capa-sat', titulo: '🗺️ Mapa de fincas', texto: 'Dibuja el área exacta de tu finca, calcula hectáreas y cambia entre vista satélite y calles.', pos: 'bottom' },
  { sel: '[onclick*="showSection(\'registros\'"]', titulo: '📊 Registros financieros', texto: 'Anota cosechas, ventas y gastos. Las gráficas se generan automáticamente.', pos: 'right' },
  { sel: '[onclick*="showSection(\'ia\'"]', titulo: '🤖 Asistente CultIA', texto: 'Tu agrónomo IA disponible 24/7. Pregúntale sobre plagas, fertilizantes y manejo.', pos: 'right' },
  { sel: '[onclick*="showSection(\'productos\'"]', titulo: '🛒 Tienda agrícola', texto: 'Sensores IoT, productos biodegradables y servicios técnicos. Paga con tarjeta o SINPE Móvil.', pos: 'right' },
];
let _tourPaso = 0, _tourOverlay = null, _tourSpotlight = null, _tourPopup = null;

function iniciarTour() {
  _tourPaso = 0;
  if (!_tourOverlay) {
    _tourOverlay = document.createElement('div'); _tourOverlay.className = 'tour-overlay'; document.body.appendChild(_tourOverlay);
    _tourSpotlight = document.createElement('div'); _tourSpotlight.className = 'tour-spotlight'; document.body.appendChild(_tourSpotlight);
    _tourPopup = document.createElement('div'); _tourPopup.className = 'tour-popup'; document.body.appendChild(_tourPopup);
  }
  _tourOverlay.style.display = 'block'; mostrarPasoTour();
}
function mostrarPasoTour() {
  const paso = TOUR_PASOS[_tourPaso];
  const el = document.querySelector(paso.sel);
  if (!el) { _tourPaso++; if (_tourPaso < TOUR_PASOS.length) mostrarPasoTour(); else finalizarTour(); return; }
  const rect = el.getBoundingClientRect();
  const pad = 8;
  _tourSpotlight.style.cssText = `top:${rect.top - pad + scrollY}px;left:${rect.left - pad}px;width:${rect.width + pad*2}px;height:${rect.height + pad*2}px;display:block`;
  _tourPopup.innerHTML = `
    <div class="tour-step">${_tourPaso + 1}/${TOUR_PASOS.length}</div>
    <h4>${paso.titulo}</h4>
    <p>${paso.texto}</p>
    <div class="tour-btns">
      <button class="tour-skip" onclick="finalizarTour()">Saltar</button>
      <button class="tour-next" onclick="tourSiguiente()">${_tourPaso < TOUR_PASOS.length - 1 ? 'Siguiente →' : '¡Listo!'}</button>
    </div>`;
  const popupW = 280, off = 12;
  let top = rect.top + scrollY - 10, left = rect.left + rect.width / 2 - popupW / 2;
  if (rect.top > window.innerHeight / 2) top = rect.top + scrollY - 160;
  else top = rect.bottom + scrollY + off;
  left = Math.max(16, Math.min(left, window.innerWidth - popupW - 16));
  _tourPopup.style.cssText = `display:block;top:${top}px;left:${left}px;width:${popupW}px`;
}
function tourSiguiente() { _tourPaso++; if (_tourPaso < TOUR_PASOS.length) mostrarPasoTour(); else finalizarTour(); }
function finalizarTour() {
  if (_tourOverlay) _tourOverlay.style.display = 'none';
  if (_tourSpotlight) _tourSpotlight.style.display = 'none';
  if (_tourPopup) _tourPopup.style.display = 'none';
  localStorage.setItem('cultyra_tour_done', '1');
}

// ============================================================
// #10 ¿SABÍAS QUE? — tips agronómicos rotativos
// ============================================================
const TIPS_AGRO = [
  '🥔 La papa en zonas sobre 2,000 m.s.n.m. rinde hasta un 40% más que en tierras bajas.',
  '🌿 El bocashi casero con gallinaza y melaza mejora el pH del suelo en 2 semanas.',
  '💧 El riego por goteo ahorra hasta el 60% de agua frente al riego por aspersión.',
  '❄️ Las heladas en Cartago ocurren principalmente entre diciembre y febrero, de madrugada.',
  '🍓 La fresa de Los Santos puede producir hasta 3 cosechas al año con manejo adecuado.',
  '☕ El café SHB (Strictly Hard Bean) sobre 1,200 m.s.n.m. tiene mayor precio en mercados premium.',
  '🐛 El extracto de neem aplicado en la tarde reduce la resistencia de insectos a insecticidas.',
  '🥑 El aguacate Hass necesita polinización cruzada: plante variedades tipo A y tipo B.',
  '🌱 Rotar cultivos cada ciclo reduce hasta un 70% la presencia de patógenos en el suelo.',
  '📊 Un análisis de suelo cuesta menos de ₡25,000 y puede ahorrarte ₡500,000 en insumos mal aplicados.',
];
let _tipActual = 0;
function renderTipAgro() {
  const el = document.getElementById('dash-tip-agro');
  if (!el) return;
  el.style.opacity = '0';
  setTimeout(() => {
    el.textContent = TIPS_AGRO[_tipActual];
    el.style.opacity = '1';
    _tipActual = (_tipActual + 1) % TIPS_AGRO.length;
  }, 400);
}

// ============================================================
// #11 MODO ALTO CONTRASTE
// ============================================================
function toggleAltoContraste() {
  document.body.classList.toggle('alto-contraste');
  const on = document.body.classList.contains('alto-contraste');
  localStorage.setItem('cultyra_contraste', on ? '1' : '');
  const btn = document.getElementById('btn-contraste');
  if (btn) btn.textContent = on ? '⬤ Contraste normal' : '◯ Alto contraste';
  if (typeof toast === 'function') toast(on ? 'Alto contraste activado' : 'Contraste normal', 'info', { title: 'Accesibilidad' });
}

// ============================================================
// #14 PULL-TO-REFRESH en móvil
// ============================================================
(function() {
  let _startY = 0, _pulling = false;
  const ind = document.createElement('div');
  ind.id = 'ptr-indicator';
  ind.innerHTML = '↓ Soltar para actualizar';
  document.body.prepend(ind);

  document.addEventListener('touchstart', e => {
    _startY = e.touches[0].clientY;
    _pulling = window.scrollY === 0;
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (!_pulling) return;
    const dy = e.touches[0].clientY - _startY;
    if (dy > 60) { ind.classList.add('visible'); }
  }, { passive: true });
  document.addEventListener('touchend', () => {
    if (ind.classList.contains('visible')) {
      ind.innerHTML = '⟳ Actualizando...';
      setTimeout(() => {
        if (typeof renderDashboard === 'function') renderDashboard();
        if (typeof cargarClimaDash === 'function') cargarClimaDash();
        ind.classList.remove('visible');
        ind.innerHTML = '↓ Soltar para actualizar';
      }, 1000);
    }
    _pulling = false;
  });
})();

// ============================================================
// #15 MODO PRESENTACIÓN
// ============================================================
let _presentando = false;
function togglePresentacion() {
  _presentando = !_presentando;
  document.body.classList.toggle('modo-presentacion', _presentando);
  const btn = document.getElementById('btn-presentacion');
  if (btn) btn.textContent = _presentando ? '✕ Salir de presentación' : '🖥️ Modo presentación';
  if (typeof toast === 'function') toast(_presentando ? 'Modo presentación activo. Pulsa Esc para salir.' : 'Presentación finalizada.', 'info', { title: 'Presentación' });
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && _presentando) togglePresentacion(); });

// ============================================================
// #17 INFOGRAFÍA ANUAL
// ============================================================
function generarInfografiaAnual() {
  const modal = document.getElementById('infografia-modal');
  if (!modal) return;
  const anio = new Date().getFullYear();
  const meses = Array.from({ length: 12 }, (_, m) => {
    const label = new Date(anio, m, 1).toLocaleDateString('es-CR', { month: 'short' });
    const regs = (typeof registros !== 'undefined' ? registros : []).filter(r => {
      const f = new Date(r.fecha);
      return f.getFullYear() === anio && f.getMonth() === m;
    });
    const v = regs.filter(r => r.tipo === 'venta').reduce((s, r) => s + r.monto, 0);
    const g = regs.filter(r => r.tipo === 'gasto').reduce((s, r) => s + r.monto, 0);
    const c = regs.filter(r => r.tipo === 'cosecha').reduce((s, r) => s + r.monto, 0);
    return { label, v, g, c, gan: v - g };
  });
  const maxV = Math.max(...meses.map(m => m.v), 1);
  const totalV = meses.reduce((s, m) => s + m.v, 0);
  const totalG = meses.reduce((s, m) => s + m.g, 0);
  const totalC = meses.reduce((s, m) => s + m.c, 0);
  const cont = document.getElementById('infografia-cont');
  cont.innerHTML = `
    <div class="info-anual-resumen">
      <div class="ia-kpi"><div class="ia-kpi-n">${(typeof fmtColones === 'function' ? fmtColones(totalV) : totalV)}</div><div class="ia-kpi-l">Ventas ${anio}</div></div>
      <div class="ia-kpi"><div class="ia-kpi-n">${(typeof fmtColones === 'function' ? fmtColones(totalG) : totalG)}</div><div class="ia-kpi-l">Gastos ${anio}</div></div>
      <div class="ia-kpi"><div class="ia-kpi-n">${(typeof fmtColones === 'function' ? fmtColones(totalV-totalG) : totalV-totalG)}</div><div class="ia-kpi-l">Ganancia ${anio}</div></div>
      <div class="ia-kpi"><div class="ia-kpi-n">${totalC.toLocaleString('es-CR')} kg</div><div class="ia-kpi-l">Cosechado ${anio}</div></div>
    </div>
    <div class="info-anual-chart">
      ${meses.map(m => `
        <div class="ia-col">
          <div class="ia-bars">
            <div class="ia-bar-v" style="height:${Math.round((m.v/maxV)*80)}px" title="Ventas: ${typeof fmtColones==='function'?fmtColones(m.v):m.v}"></div>
            <div class="ia-bar-g" style="height:${Math.round((m.g/maxV)*80)}px" title="Gastos: ${typeof fmtColones==='function'?fmtColones(m.g):m.g}"></div>
          </div>
          <div class="ia-mes-label">${m.label}</div>
        </div>`).join('')}
    </div>
    <div class="ia-legend"><span><span class="ia-dot" style="background:#34c759"></span>Ventas</span><span><span class="ia-dot" style="background:#f87171"></span>Gastos</span></div>`;
  modal.classList.add('open');
}

// ============================================================
// #18 HEATMAP DE ACTIVIDAD (tipo GitHub)
// ============================================================
function generarHeatmap() {
  const modal = document.getElementById('heatmap-modal');
  const cont = document.getElementById('heatmap-cont');
  if (!modal || !cont) return;
  const hoy = new Date();
  const dias = 364;
  const counts = {};
  (typeof registros !== 'undefined' ? registros : []).forEach(r => {
    const d = r.fecha.slice(0, 10);
    counts[d] = (counts[d] || 0) + 1;
  });
  (typeof tasks !== 'undefined' ? tasks : []).forEach(t => {
    if (t.fecha) { counts[t.fecha] = (counts[t.fecha] || 0) + 1; }
  });
  const max = Math.max(...Object.values(counts), 1);
  let html = '<div class="heatmap-grid">';
  for (let i = dias; i >= 0; i--) {
    const d = new Date(hoy.getTime() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const cnt = counts[key] || 0;
    const lvl = cnt === 0 ? 0 : cnt < max * 0.25 ? 1 : cnt < max * 0.5 ? 2 : cnt < max * 0.75 ? 3 : 4;
    html += `<div class="hm-day lvl${lvl}" title="${key}: ${cnt} actividades"></div>`;
  }
  html += '</div>';
  html += '<div class="hm-legend"><span>Menos</span>' +
    [0,1,2,3,4].map(l => `<div class="hm-day lvl${l}"></div>`).join('') +
    '<span>Más</span></div>';
  cont.innerHTML = html;
  modal.classList.add('open');
}

// ============================================================
// #19 META DE COSECHA MENSUAL
// ============================================================
function guardarMetaCosecha() {
  const meta = parseFloat(document.getElementById('meta-kg-input')?.value) || 0;
  if (!meta) { if (typeof toast === 'function') toast('Ingresa una meta en kilogramos.', 'warn', { title: 'Meta' }); return; }
  localStorage.setItem('cultyra_meta_kg', meta);
  renderMetaCosecha();
  if (typeof toast === 'function') toast(`Meta de ${meta.toLocaleString('es-CR')} kg guardada 🎯`, 'ok', { title: 'Meta mensual' });
}
function renderMetaCosecha() {
  const el = document.getElementById('meta-progress-wrap');
  if (!el) return;
  const meta = parseFloat(localStorage.getItem('cultyra_meta_kg')) || 0;
  if (!meta) { el.style.display = 'none'; return; }
  const ahora = new Date();
  const real = (typeof registros !== 'undefined' ? registros : [])
    .filter(r => r.tipo === 'cosecha' && new Date(r.fecha).getMonth() === ahora.getMonth() && new Date(r.fecha).getFullYear() === ahora.getFullYear())
    .reduce((s, r) => s + r.monto, 0);
  const pct = Math.min(100, Math.round((real / meta) * 100));
  el.style.display = 'block';
  el.innerHTML = `
    <div class="meta-head">
      <span>🎯 Meta mensual: <b>${meta.toLocaleString('es-CR')} kg</b></span>
      <span class="meta-pct ${pct >= 100 ? 'meta-done' : ''}">${pct}%</span>
    </div>
    <div class="meta-bar-wrap"><div class="meta-bar-fill" style="width:${pct}%"></div></div>
    <div class="meta-sub">${real.toLocaleString('es-CR')} kg cosechados · ${Math.max(0, meta - real).toLocaleString('es-CR')} kg restantes</div>`;
}

// ============================================================
// #20 CALCULADORA DE RENTABILIDAD
// ============================================================
function calcularRentabilidad() {
  const costo  = parseFloat(document.getElementById('calc-costo')?.value) || 0;
  const precio = parseFloat(document.getElementById('calc-precio')?.value) || 0;
  const kg     = parseFloat(document.getElementById('calc-kg')?.value) || 0;
  const ha     = parseFloat(document.getElementById('calc-ha')?.value) || 1;
  if (!costo || !precio || !kg) { if (typeof toast === 'function') toast('Completa todos los campos.', 'warn', { title: 'Calculadora' }); return; }
  const ingreso = precio * kg;
  const ganancia = ingreso - costo;
  const margen = ((ganancia / ingreso) * 100).toFixed(1);
  const xha = (ganancia / ha).toFixed(0);
  const roi = ((ganancia / costo) * 100).toFixed(1);
  document.getElementById('calc-resultado').innerHTML = `
    <div class="calc-res-grid">
      <div class="calc-res-item"><span>Ingresos</span><b class="c-green">${typeof fmtColones==='function'?fmtColones(ingreso):ingreso}</b></div>
      <div class="calc-res-item"><span>Costo total</span><b>${typeof fmtColones==='function'?fmtColones(costo):costo}</b></div>
      <div class="calc-res-item"><span>Ganancia neta</span><b class="${ganancia>=0?'c-green':'c-red'}">${typeof fmtColones==='function'?fmtColones(ganancia):ganancia}</b></div>
      <div class="calc-res-item"><span>Margen %</span><b>${margen}%</b></div>
      <div class="calc-res-item"><span>Ganancia/ha</span><b>${typeof fmtColones==='function'?fmtColones(parseFloat(xha)):xha}</b></div>
      <div class="calc-res-item"><span>ROI</span><b>${roi}%</b></div>
    </div>`;
}

// ============================================================
// #22 RANKING DE FINCAS MÁS PRODUCTIVAS
// ============================================================
function renderRankingFincas() {
  const el = document.getElementById('ranking-fincas-lista');
  if (!el) return;
  const datos = (typeof fincas !== 'undefined' ? fincas : []).map(f => {
    const kg = (typeof registros !== 'undefined' ? registros : [])
      .filter(r => r.tipo === 'cosecha' && r.finca === f.nombre)
      .reduce((s, r) => s + r.monto, 0);
    const ha = parseFloat(f.area) || 0;
    return { nombre: f.nombre, cultivo: f.cultivo, kg, ha, rend: ha ? (kg / ha).toFixed(0) : 0 };
  }).sort((a, b) => b.rend - a.rend);
  if (!datos.length) { el.innerHTML = '<p style="color:var(--text-light);font-size:13px">Agrega fincas y registros de cosecha para ver el ranking.</p>'; return; }
  el.innerHTML = datos.map((d, i) => `
    <div class="ranking-item">
      <span class="ranking-pos">${['🥇','🥈','🥉'][i] || (i+1)+'°'}</span>
      <div class="ranking-info"><b>${d.nombre}</b><span>${d.cultivo}</span></div>
      <div class="ranking-val"><b>${d.rend} kg/ha</b><span>${d.kg.toLocaleString('es-CR')} kg total</span></div>
    </div>`).join('');
}

// ============================================================
// #23 EXPORTAR DASHBOARD COMO PNG
// ============================================================
async function exportarDashboardPNG() {
  if (typeof toast === 'function') toast('Generando imagen...', 'info', { title: 'Exportar dashboard' });
  const el = document.querySelector('.dash-container');
  if (!el) return;
  try {
    const { default: html2canvas } = await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.esm.js');
    const canvas = await html2canvas(el, { backgroundColor: '#061008', scale: 2 });
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `cultyra-dashboard-${Date.now()}.png`;
    a.click();
    if (typeof toast === 'function') toast('Dashboard exportado como PNG.', 'ok', { title: 'Imagen guardada' });
  } catch {
    if (typeof toast === 'function') toast('No se pudo exportar la imagen. Prueba captura de pantalla manual.', 'warn', { title: 'Exportar' });
  }
}

// ============================================================
// #24 ALERTA DE EFICIENCIA (costos > 80% ventas)
// ============================================================
function verificarEficiencia() {
  if (typeof registros === 'undefined') return;
  const ahora = new Date();
  const esteM = registros.filter(r => {
    const f = new Date(r.fecha);
    return f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear();
  });
  const v = esteM.filter(r => r.tipo === 'venta').reduce((s, r) => s + r.monto, 0);
  const g = esteM.filter(r => r.tipo === 'gasto').reduce((s, r) => s + r.monto, 0);
  if (v > 0 && (g / v) > 0.8) {
    if (typeof toast === 'function') toast(`Tus gastos son el ${Math.round((g/v)*100)}% de tus ventas este mes. Revisa tus costos.`, 'warn', { title: '⚠️ Eficiencia baja' });
  }
}

// ============================================================
// #26 CUENTA REGRESIVA A PRÓXIMA COSECHA
// ============================================================
function renderCuentaRegresiva() {
  const el = document.getElementById('dash-cuenta-regresiva');
  if (!el) return;
  if (typeof fincas === 'undefined' || !fincas.length) { el.textContent = 'Sin fincas activas.'; return; }
  const f = fincas[0];
  if (!f.fechaInicio) { el.textContent = 'Agrega una finca con fecha de inicio.'; return; }
  const DIAS_COSECHA = { Papa: 110, Cebolla: 125, Zanahoria: 100, Fresa: 75, 'Café de altura': 330, Tomate: 90, Lechuga: 60, Repollo: 100, Brócoli: 80, Maíz: 100, Frijol: 90 };
  const dias = DIAS_COSECHA[f.cultivo] || 110;
  const inicio = new Date(f.fechaInicio);
  const cosecha = new Date(inicio.getTime() + dias * 86400000);
  const hoy = new Date();
  const diff = Math.ceil((cosecha - hoy) / 86400000);
  if (diff < 0) el.innerHTML = `<span style="color:#34c759">✅ ${f.nombre}: cosecha estimada hace ${Math.abs(diff)} días</span>`;
  else el.innerHTML = `<span>🌾 <b>${f.nombre}</b> (${f.cultivo}): <b style="color:#34c759">${diff} días</b> para la cosecha estimada</span>`;
}

// ============================================================
// #30 CALCULADORA DE INSUMOS
// ============================================================
const DOSIS_INSUMOS = {
  'Abono bocashi': { dosis: 2000, unidad: 'kg/ha', desc: 'Aplicar en banda junto a la planta' },
  'Extracto de neem': { dosis: 5, unidad: 'L/ha', desc: 'Diluir al 2% en agua, aplicar al atardecer' },
  'Urea 46%': { dosis: 150, unidad: 'kg/ha', desc: 'Fraccionado en 3 aplicaciones' },
  '10-30-10': { dosis: 300, unidad: 'kg/ha', desc: 'A la siembra en banda de 5 cm de profundidad' },
  'Fungicida cúprico': { dosis: 3, unidad: 'kg/ha', desc: 'Preventivo cada 10 días en lluvia' },
  'Piretrina': { dosis: 0.5, unidad: 'L/ha', desc: 'Dilución 0.1% en agua' },
  'Cal agrícola': { dosis: 2000, unidad: 'kg/ha', desc: 'Incorporar al suelo antes de siembra' },
};
function calcularInsumo() {
  const prod  = document.getElementById('ins-producto')?.value;
  const ha    = parseFloat(document.getElementById('ins-ha')?.value) || 0;
  const info  = DOSIS_INSUMOS[prod];
  const el    = document.getElementById('ins-resultado');
  if (!el) return;
  if (!ha || !info) { el.textContent = 'Completa los campos.'; return; }
  const total = (info.dosis * ha).toLocaleString('es-CR');
  el.innerHTML = `<b>${total} ${info.unidad.split('/')[0]}</b> de ${prod} para ${ha} ha.<br><small style="color:var(--text-light)">${info.desc}</small>`;
}

// ============================================================
// #31 BUSCADOR DE DIRECCIÓN EN MAPA (OSM Nominatim)
// ============================================================
async function buscarDireccionMapa() {
  const q = document.getElementById('mapa-buscar-input')?.value.trim();
  if (!q) return;
  if (typeof mapaGeneral === 'undefined' || !mapaGeneral) { if (typeof toast === 'function') toast('Abre la sección Fincas primero.', 'warn', { title: 'Mapa' }); return; }
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ', Costa Rica')}&format=json&limit=1`);
    const d = await r.json();
    if (!d.length) { if (typeof toast === 'function') toast('Ubicación no encontrada.', 'warn', { title: 'Buscar' }); return; }
    const { lat, lon, display_name } = d[0];
    mapaGeneral.setView([parseFloat(lat), parseFloat(lon)], 14);
    L.popup().setLatLng([parseFloat(lat), parseFloat(lon)]).setContent(`📍 ${display_name.split(',')[0]}`).openOn(mapaGeneral);
  } catch { if (typeof toast === 'function') toast('Error al buscar. Verifica tu conexión.', 'error', { title: 'Mapa' }); }
}

// ============================================================
// #32 NOTA RÁPIDA GEOLOCADA (clic derecho en mapa)
// ============================================================
let _notasMapa = JSON.parse(localStorage.getItem('cultyra_notas_mapa') || '[]');
function initNotasMapa() {
  if (typeof mapaGeneral === 'undefined' || !mapaGeneral) return;
  mapaGeneral.on('contextmenu', e => {
    const nota = prompt('📝 Nota en este punto:');
    if (!nota) return;
    const marcador = L.marker(e.latlng, {
      icon: L.divIcon({ html: '<div class="nota-mapa-marker">📝</div>', className: '', iconAnchor: [12, 12] })
    }).addTo(mapaGeneral);
    marcador.bindPopup(`<b>Nota</b><br>${nota}<br><small>${new Date().toLocaleDateString('es-CR')}</small>`).openPopup();
    _notasMapa.push({ lat: e.latlng.lat, lng: e.latlng.lng, nota, fecha: new Date().toISOString() });
    localStorage.setItem('cultyra_notas_mapa', JSON.stringify(_notasMapa));
    if (typeof toast === 'function') toast('Nota guardada en el mapa.', 'ok', { title: 'Nota geolocada' });
  });
  _notasMapa.forEach(n => {
    const m = L.marker([n.lat, n.lng], { icon: L.divIcon({ html: '<div class="nota-mapa-marker">📝</div>', className: '', iconAnchor: [12, 12] }) }).addTo(mapaGeneral);
    m.bindPopup(`<b>Nota</b><br>${n.nota}<br><small>${new Date(n.fecha).toLocaleDateString('es-CR')}</small>`);
  });
}

// ============================================================
// #33 ELEVACIÓN DEL TERRENO (Open-Elevation)
// ============================================================
async function consultarElevacion(lat, lng) {
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`);
    const d = await r.json();
    const elev = d.elevation?.[0];
    if (elev !== undefined) return Math.round(elev);
  } catch {}
  return null;
}
async function mostrarElevacionFinca(idx) {
  if (typeof fincas === 'undefined' || !fincas[idx]?.centro) return;
  const [lat, lng] = fincas[idx].centro;
  const elev = await consultarElevacion(lat, lng);
  if (elev !== null) {
    if (typeof toast === 'function') toast(`${fincas[idx].nombre} está a <b>${elev} m.s.n.m.</b>`, 'ok', { title: 'Elevación del terreno' });
  }
}

// ============================================================
// #34 REGISTRO DE ASISTENCIA DE EMPLEADOS
// ============================================================
let asistencia = JSON.parse(localStorage.getItem('cultyra_asistencia') || '[]');
function registrarAsistencia(empIdx, tipo) {
  const emp = (typeof empleados !== 'undefined' && empleados[empIdx]) ? empleados[empIdx] : { nombre: 'Empleado' };
  const reg = { empIdx, nombre: emp.nombre, tipo, ts: new Date().toISOString() };
  asistencia.push(reg);
  if (asistencia.length > 500) asistencia = asistencia.slice(-500);
  localStorage.setItem('cultyra_asistencia', JSON.stringify(asistencia));
  if (typeof toast === 'function') toast(`${emp.nombre} — ${tipo === 'entrada' ? '🟢 Entrada' : '🔴 Salida'} registrada a las ${new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}`, 'ok', { title: 'Asistencia' });
}
function renderAsistenciaHoy() {
  const el = document.getElementById('asistencia-hoy');
  if (!el) return;
  const hoy = new Date().toISOString().slice(0, 10);
  const hoyRegs = asistencia.filter(r => r.ts.startsWith(hoy));
  if (!hoyRegs.length) { el.innerHTML = '<p style="font-size:13px;color:var(--text-light)">Sin registros hoy.</p>'; return; }
  el.innerHTML = hoyRegs.map(r => `<div class="asist-item"><span>${r.tipo === 'entrada' ? '🟢' : '🔴'} <b>${r.nombre}</b></span><span style="font-family:Space Mono,monospace;font-size:11px">${new Date(r.ts).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}</span></div>`).join('');
}

// ============================================================
// #35 CALCULADORA DE JORNALES
// ============================================================
function calcularJornales() {
  const dias = parseFloat(document.getElementById('jornal-dias')?.value) || 0;
  const tarifa = parseFloat(document.getElementById('jornal-tarifa')?.value) || 0;
  const el = document.getElementById('jornal-resultado');
  if (!el) return;
  if (!dias || !tarifa) { el.textContent = 'Completa los campos.'; return; }
  const total = dias * tarifa;
  el.innerHTML = `<b>${dias} días × ${typeof fmtColones==='function'?fmtColones(tarifa):tarifa}/día = <span style="color:#34c759">${typeof fmtColones==='function'?fmtColones(total):total}</span></b><br><small style="color:var(--text-light)">Tarifa mínima MTSS 2026 peón agrícola: ₡12,800/día</small>`;
}

// ============================================================
// #36 TARJETA DIGITAL DEL EMPLEADO CON QR
// ============================================================
function abrirTarjetaEmpleado(idx) {
  const emp = (typeof empleados !== 'undefined' && empleados[idx]);
  if (!emp) return;
  const modal = document.getElementById('tarjeta-emp-modal');
  if (!modal) return;
  document.getElementById('tcard-nombre').textContent = emp.nombre;
  document.getElementById('tcard-rol').textContent = emp.rol;
  document.getElementById('tcard-tel').textContent = emp.tel || '—';
  document.getElementById('tcard-avatar').textContent = emp.nombre.charAt(0).toUpperCase();
  // QR simple basado en vCard
  const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${emp.nombre}\nORG:Cultyra\nTITLE:${emp.rol}\nTEL:${emp.tel||''}\nEND:VCARD`;
  const qrEl = document.getElementById('tcard-qr');
  if (qrEl) {
    qrEl.innerHTML = '';
    // Dibujar QR simple con módulos CSS (representación visual)
    const size = 80;
    const modules = btoa(vcard).slice(0, 64).split('').map(c => c.charCodeAt(0) % 2);
    const grid = Math.ceil(Math.sqrt(modules.length));
    const cellSize = Math.floor(size / grid);
    let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
    modules.forEach((m, i) => {
      const x = (i % grid) * cellSize, y = Math.floor(i / grid) * cellSize;
      if (m) svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#061008"/>`;
    });
    svg += `</svg>`;
    qrEl.innerHTML = svg;
  }
  modal.classList.add('open');
}

// ============================================================
// #37 MENSAJE INTERNO PARA EMPLEADO
// ============================================================
let mensajesEmpleado = JSON.parse(localStorage.getItem('cultyra_mensajes_emp') || '{}');
function guardarMensajeEmpleado(idx) {
  const msg = document.getElementById(`msg-emp-${idx}`)?.value.trim();
  if (!msg) return;
  mensajesEmpleado[idx] = { msg, fecha: new Date().toISOString() };
  localStorage.setItem('cultyra_mensajes_emp', JSON.stringify(mensajesEmpleado));
  if (typeof toast === 'function') toast('Mensaje guardado para el empleado.', 'ok', { title: 'Mensaje' });
}
function getMensajeEmpleado(idx) {
  return mensajesEmpleado[idx]?.msg || '';
}

// ============================================================
// #38 EVALUACIÓN MENSUAL DEL EMPLEADO
// ============================================================
let evaluaciones = JSON.parse(localStorage.getItem('cultyra_eval_emp') || '{}');
let evalEmpActual = null;
function abrirEvaluacion(idx) {
  evalEmpActual = idx;
  const emp = typeof empleados !== 'undefined' && empleados[idx];
  document.getElementById('eval-emp-nombre').textContent = emp ? emp.nombre : 'Empleado';
  document.getElementById('eval-stars').innerHTML = [1,2,3,4,5].map(n => `<button class="star-btn" onclick="setEvalStar(${n},this)">${n <= (evaluaciones[idx]?.ultima || 0) ? '★' : '☆'}</button>`).join('');
  document.getElementById('eval-comentario').value = '';
  document.getElementById('evaluacion-modal').classList.add('open');
}
function setEvalStar(n, btn) {
  const btns = btn.closest('#eval-stars').querySelectorAll('.star-btn');
  btns.forEach((b, i) => b.textContent = i < n ? '★' : '☆');
  btn.dataset.val = n;
  document.getElementById('eval-stars').dataset.val = n;
}
function guardarEvaluacion() {
  const stars = parseInt(document.getElementById('eval-stars')?.dataset.val) || 0;
  const comment = document.getElementById('eval-comentario')?.value.trim();
  if (!stars) { if (typeof toast === 'function') toast('Selecciona una calificación.', 'warn', { title: 'Evaluación' }); return; }
  const mes = new Date().toISOString().slice(0, 7);
  if (!evaluaciones[evalEmpActual]) evaluaciones[evalEmpActual] = { hist: [], ultima: 0 };
  evaluaciones[evalEmpActual].hist.push({ stars, comment, mes });
  evaluaciones[evalEmpActual].ultima = stars;
  localStorage.setItem('cultyra_eval_emp', JSON.stringify(evaluaciones));
  document.getElementById('evaluacion-modal').classList.remove('open');
  if (typeof toast === 'function') toast('Evaluación guardada.', 'ok', { title: 'Evaluación mensual' });
}

// ============================================================
// #40 RECOMENDACIONES PERSONALIZADAS DE PRODUCTOS
// ============================================================
function renderRecomendaciones() {
  const el = document.getElementById('recomendaciones-wrap');
  if (!el || typeof productos === 'undefined') return;
  const cultivos = (typeof fincas !== 'undefined' ? fincas : []).map(f => f.cultivo.toLowerCase());
  if (!cultivos.length) { el.style.display = 'none'; return; }
  const matches = productos.filter(p => {
    const d = p.desc.toLowerCase() + ' ' + p.name.toLowerCase();
    return cultivos.some(c => {
      if (c.includes('papa') && (d.includes('neem') || d.includes('sensor') || d.includes('bocashi'))) return true;
      if (c.includes('fresa') && (d.includes('sensor') || d.includes('bocashi'))) return true;
      if (c.includes('café') && (d.includes('neem') || d.includes('bocashi'))) return true;
      return p.category === 'sensor';
    });
  }).slice(0, 3);
  if (!matches.length) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.innerHTML = `<div class="rec-titulo">Recomendado para tus cultivos</div>
    ${matches.map(p => `<div class="rec-item" onclick="irA('productos')" style="cursor:pointer">
      <div class="rec-icon icon-box" data-icon="${p.icon}" style="width:32px;height:32px;flex-shrink:0"></div>
      <div><div class="rec-name">${p.name}</div><div class="rec-price">${typeof fmtColones==='function'?fmtColones(p.precio):p.precio}</div></div>
      <button class="btn-add" onclick="event.stopPropagation();addToCart(${p.id})">+ Carrito</button>
    </div>`).join('')}`;
}

// ============================================================
// #43 FACTURA PDF DE PEDIDO
// ============================================================
function generarFacturaPDF(pedido) {
  if (!window.jspdf) { if (typeof toast === 'function') toast('Módulo PDF no disponible.', 'error', { title: 'Factura' }); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const hoy = new Date(pedido.fecha).toLocaleDateString('es-CR', { day:'numeric', month:'long', year:'numeric' });
  doc.setFillColor(26,58,31); doc.rect(0,0,210,26,'F');
  doc.setTextColor(255,255,255); doc.setFontSize(16); doc.setFont(undefined,'bold');
  doc.text('CULTYRA — Factura de compra', 14, 17);
  doc.setTextColor(40,40,40); doc.setFontSize(10); doc.setFont(undefined,'normal');
  doc.text(`Pedido: ${pedido.id}`, 14, 34);
  doc.text(`Fecha: ${hoy}`, 14, 40);
  doc.text(`Cliente: ${pedido.cliente?.nombre || '—'}`, 14, 46);
  doc.text(`Dirección: ${pedido.cliente?.direccion || '—'}, ${pedido.cliente?.provincia || ''}`, 14, 52);
  doc.setFontSize(12); doc.setFont(undefined,'bold'); doc.setTextColor(45,106,79);
  doc.text('Detalle de productos', 14, 64);
  doc.setFontSize(9); doc.setFont(undefined,'normal'); doc.setTextColor(40,40,40);
  let y = 72;
  (pedido.items || []).forEach(item => {
    doc.text(`${item.qty}× ${item.nombre}`, 16, y);
    doc.text(`${typeof fmtColones==='function'?fmtColones(item.precio * item.qty):item.precio * item.qty}`, 150, y);
    y += 6;
  });
  doc.setFont(undefined,'bold');
  doc.text(`TOTAL: ${typeof fmtColones==='function'?fmtColones(pedido.total):pedido.total}`, 14, y+4);
  doc.text(`Método de pago: ${pedido.metodoPago === 'tarjeta' ? 'Tarjeta' : 'SINPE Móvil'}`, 14, y+10);
  doc.setFontSize(8); doc.setFont(undefined,'normal'); doc.setTextColor(120,120,120);
  doc.text('CULTYRA · soportecultyra@gmail.com · +506 6205-3039 · cultyraagro.web.app', 14, 290);
  doc.save(`cultyra-factura-${pedido.id}.pdf`);
  if (typeof toast === 'function') toast('Factura PDF descargada.', 'ok', { title: 'Factura' });
}

// ============================================================
// #45 CONTEXTO INTELIGENTE PARA CULTIA
// ============================================================
function generarContextoCultIA() {
  if (typeof fincas === 'undefined' || !fincas.length) return '';
  const resumen = fincas.map(f => `${f.nombre} (${f.cultivo}, ${f.area} ha, ${f.ubicacion.split(',')[0]})`).join('; ');
  const totalV = (typeof registros !== 'undefined' ? registros : []).filter(r => r.tipo === 'venta').reduce((s, r) => s + r.monto, 0);
  return `Contexto de la finca del agricultor: ${resumen}. Ventas totales acumuladas: ${typeof fmtColones === 'function' ? fmtColones(totalV) : totalV}. Usa este contexto para dar recomendaciones precisas y específicas.`;
}

// ============================================================
// #46 CHIPS PERSONALIZADOS SEGÚN CULTIVOS
// ============================================================
function renderChipsPersonalizados() {
  const cont = document.getElementById('ia-chips');
  if (!cont || typeof fincas === 'undefined' || !fincas.length) return;
  const cultivo = fincas[0]?.cultivo || '';
  const emoji = { Papa:'🥔', Fresa:'🍓', Café:'☕', Aguacate:'🥑', Cebolla:'🧅', Tomate:'🍅', Zanahoria:'🥕', Lechuga:'🥬' };
  const ic = emoji[cultivo] || '🌱';
  const extras = [
    { e: ic, t: `¿Cómo protejo mi ${cultivo} de enfermedades?` },
    { e: '💧', t: `¿Cuándo y cuánto riego ${cultivo} en esta época?` },
    { e: '🌿', t: `¿Qué fertilizante orgánico recomiendas para ${cultivo}?` },
  ].filter(() => cultivo);
  extras.forEach(({ e, t }) => {
    const btn = document.createElement('button');
    btn.className = 'ia-chip';
    btn.textContent = `${e} ${t}`;
    btn.onclick = () => typeof preguntaRapida === 'function' && preguntaRapida(t);
    cont.prepend(btn);
  });
}

// ============================================================
// #47 MODO DEBATE CULTIA
// ============================================================
function activarModoDebate() {
  if (typeof chatHistory === 'undefined') return;
  const pregunta = document.getElementById('chat-input')?.value.trim();
  if (!pregunta) { if (typeof toast === 'function') toast('Escribe una pregunta primero.', 'warn', { title: 'Modo debate' }); return; }
  const preguntaDebate = `Para la siguiente decisión agronómica, dame exactamente DOS perspectivas bien diferenciadas: primero la perspectiva ORGÁNICA/BIODEGRADABLE y luego la perspectiva CONVENCIONAL/QUÍMICA. Sé específico con productos y dosis para Costa Rica. Pregunta: ${pregunta}`;
  if (document.getElementById('chat-input')) document.getElementById('chat-input').value = preguntaDebate;
  if (typeof sendMessage === 'function') sendMessage();
  if (typeof toast === 'function') toast('Modo debate: obtendrás dos perspectivas (orgánica vs convencional).', 'info', { title: 'Debate CultIA' });
}

// ============================================================
// #48 MARCADORES EN EL CHAT CULTIA
// ============================================================
let chatMarcadores = JSON.parse(localStorage.getItem('cultyra_chat_marcadores') || '[]');
function marcarMsgIA(texto) {
  chatMarcadores.unshift({ texto: texto.slice(0, 200), fecha: new Date().toISOString() });
  if (chatMarcadores.length > 30) chatMarcadores.pop();
  localStorage.setItem('cultyra_chat_marcadores', JSON.stringify(chatMarcadores));
  if (typeof toast === 'function') toast('Respuesta marcada como favorita ⭐', 'ok', { title: 'Marcador guardado' });
}
function verMarcadores() {
  const modal = document.getElementById('marcadores-modal');
  if (!modal) return;
  const el = document.getElementById('marcadores-lista');
  el.innerHTML = chatMarcadores.length
    ? chatMarcadores.map((m, i) => `<div class="marcador-item"><p>${m.texto}${m.texto.length >= 200 ? '...' : ''}</p><small>${new Date(m.fecha).toLocaleDateString('es-CR')}</small><button class="prod-icon-btn" onclick="chatMarcadores.splice(${i},1);localStorage.setItem('cultyra_chat_marcadores',JSON.stringify(chatMarcadores));verMarcadores()" style="margin-top:6px;font-size:11px">Eliminar</button></div>`).join('')
    : '<p style="color:var(--text-light);font-size:13px">Aún no tienes respuestas marcadas. Haz clic en ★ en cualquier respuesta de CultIA.</p>';
  modal.classList.add('open');
}

// ============================================================
// #49 RESUMEN CLIMÁTICO SEMANAL POR FINCA
// ============================================================
async function renderResumenClimaFinca() {
  const el = document.getElementById('resumen-clima-fincas');
  if (!el || typeof fincas === 'undefined' || !fincas.length) return;
  const f = fincas.find(f => f.centro);
  if (!f) return;
  try {
    const [lat, lng] = f.centro;
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&past_days=7&forecast_days=0&timezone=auto`);
    const d = await r.json();
    const { time, temperature_2m_max, temperature_2m_min, precipitation_sum } = d.daily;
    const lluviaTotal = precipitation_sum.reduce((s, x) => s + (x || 0), 0).toFixed(1);
    const tMax = Math.max(...temperature_2m_max).toFixed(0);
    const tMin = Math.min(...temperature_2m_min).toFixed(0);
    const diasHelada = temperature_2m_min.filter(t => t < 4).length;
    el.innerHTML = `
      <div class="resumen-clima-card">
        <div class="rc-titulo">Últimos 7 días · ${f.nombre}</div>
        <div class="rc-grid">
          <div class="rc-stat"><div class="rc-n">☔ ${lluviaTotal} mm</div><div class="rc-l">Lluvia acumulada</div></div>
          <div class="rc-stat"><div class="rc-n">🌡️ ${tMax}°C</div><div class="rc-l">Temperatura máx.</div></div>
          <div class="rc-stat"><div class="rc-n">❄️ ${tMin}°C</div><div class="rc-l">Temperatura mín.</div></div>
          <div class="rc-stat"><div class="rc-n ${diasHelada > 0 ? 'rc-alerta' : ''}">${diasHelada > 0 ? '⚠️' : '✅'} ${diasHelada} días</div><div class="rc-l">Riesgo de helada</div></div>
        </div>
      </div>`;
  } catch { el.innerHTML = ''; }
}

// ============================================================
// #50 FERIADOS DE COSTA RICA EN CALENDARIO
// ============================================================
const FERIADOS_CR = {
  '01-01': '🎉 Año Nuevo',
  '04-11': '🏛️ Batalla de Rivas',
  '05-01': '👷 Día del Trabajo',
  '07-25': '🇨🇷 Anexión Nicoya',
  '08-02': '🎪 Día de la Virgen de los Ángeles',
  '08-15': '👨‍👩‍👧 Día de la Madre',
  '09-15': '🇨🇷 Independencia',
  '10-12': '🌍 Día de las Culturas',
  '12-25': '🎄 Navidad',
};
// Temporadas en Costa Rica
const TEMPORADAS = [
  { inicio: '12-01', fin: '04-30', nombre: '☀️ Estación seca (Verano)', color: '#f59e0b' },
  { inicio: '05-01', fin: '11-30', nombre: '🌧️ Estación lluviosa (Invierno)', color: '#60a5fa' },
];
function esFeriado(fecha) {
  const md = fecha.slice(5, 10);
  return FERIADOS_CR[md] || null;
}
function esTemporada(fecha) {
  const md = fecha.slice(5, 10);
  return TEMPORADAS.find(t => md >= t.inicio && md <= t.fin);
}

// ============================================================
// INIT — conectar todo al DOM
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // #9 Tour al primer uso
  if (!localStorage.getItem('cultyra_tour_done') && !localStorage.getItem('cultyra_user')) {
    setTimeout(iniciarTour, 2000);
  }

  // #10 Tips rotativos
  renderTipAgro();
  setInterval(renderTipAgro, 8000);

  // #11 Restaurar alto contraste
  if (localStorage.getItem('cultyra_contraste')) document.body.classList.add('alto-contraste');

  // #16 Logo → Dashboard
  document.querySelectorAll('.nav-logo, img[alt="Cultyra"]').forEach(el => {
    if (!el.closest('#landing') && !el.closest('#login-screen')) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => { if (typeof irA === 'function') irA('dashboard'); });
    }
  });

  // #2 Botón compartir en nav (móvil)
  const navR = document.querySelector('.nav-right');
  if (navR && !document.getElementById('btn-share-nav')) {
    const btn = document.createElement('button');
    btn.id = 'btn-share-nav'; btn.className = 'btn-cart'; btn.title = 'Compartir Cultyra';
    btn.onclick = compartirApp;
    btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`;
    navR.insertBefore(btn, navR.querySelector('.btn-cart'));
  }

  // #19 Meta cosecha
  renderMetaCosecha();

  // #24 Alerta eficiencia
  setTimeout(verificarEficiencia, 3000);

  // #26 Cuenta regresiva
  renderCuentaRegresiva();
  setInterval(renderCuentaRegresiva, 60000);

  // #40 Recomendaciones
  setTimeout(renderRecomendaciones, 500);

  // #46 Chips personalizados
  setTimeout(renderChipsPersonalizados, 600);

  // #49 Resumen climático
  setTimeout(renderResumenClimaFinca, 2000);

  // Agregar botones en menú lateral
  const navFoot = document.querySelector('.nav-menu-foot');
  if (navFoot) {
    [
      { id: 'btn-contraste', label: '◯ Alto contraste', fn: 'toggleAltoContraste()' },
      { id: 'btn-presentacion', label: '🖥️ Modo presentación', fn: 'togglePresentacion()' },
      { id: null, label: '🎯 Tour de CULTYRA', fn: 'iniciarTour()' },
    ].forEach(({ id, label, fn }) => {
      if (id && document.getElementById(id)) return;
      const btn = document.createElement('button');
      btn.className = 'btn-tema';
      if (id) btn.id = id;
      btn.textContent = label;
      btn.setAttribute('onclick', fn);
      navFoot.appendChild(btn);
    });
  }

  // Botón ★ en respuestas de CultIA
  const chatObs = new MutationObserver(() => {
    document.querySelectorAll('.msg.assistant .msg-bubble:not([data-mark-init])').forEach(bbl => {
      bbl.dataset.markInit = '1';
      const btn = document.createElement('button');
      btn.className = 'chat-mark-btn';
      btn.title = 'Marcar como favorito';
      btn.textContent = '★';
      btn.onclick = () => marcarMsgIA(bbl.textContent);
      bbl.appendChild(btn);
    });
  });
  const chatCont = document.getElementById('chat-messages');
  if (chatCont) chatObs.observe(chatCont, { childList: true, subtree: true });

  // Botón debate en toolbar de CultIA
  const iaToolbar = document.querySelector('.ia-toolbar');
  if (iaToolbar && !document.getElementById('btn-debate')) {
    const btn = document.createElement('button');
    btn.id = 'btn-debate'; btn.className = 'ia-tool-btn';
    btn.textContent = '⚔️ Modo debate'; btn.onclick = activarModoDebate;
    iaToolbar.appendChild(btn);
  }

  // Botón ver marcadores en toolbar
  if (iaToolbar && !document.getElementById('btn-marcadores')) {
    const btn = document.createElement('button');
    btn.id = 'btn-marcadores'; btn.className = 'ia-tool-btn';
    btn.textContent = '⭐ Mis marcadores'; btn.onclick = verMarcadores;
    iaToolbar.appendChild(btn);
  }

  // Buscador en mapa
  const mapaControles = document.querySelector('.mapa-controles');
  if (mapaControles && !document.getElementById('mapa-buscar-input')) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:4px;align-items:center;flex-wrap:nowrap;';
    wrap.innerHTML = `<input type="text" id="mapa-buscar-input" placeholder="Buscar lugar... Ej. Tierra Blanca" style="padding:6px 10px;border-radius:8px;border:1px solid var(--border);background:var(--bg-input);color:var(--text-dark);font-size:12.5px;outline:none;width:180px" onkeydown="if(event.key==='Enter')buscarDireccionMapa()"><button class="btn-mapa-ctrl" onclick="buscarDireccionMapa()">🔍</button>`;
    mapaControles.appendChild(wrap);
  }
});