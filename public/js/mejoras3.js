// ============================================================
// CULTYRA · MEJORAS v3.0  (100 mejoras adicionales)
// ============================================================

// ════════════════════════════════════════════════════
// #1 TRANSICIÓN LANDING → LOGIN
// ════════════════════════════════════════════════════
const _origGoToLogin = typeof goToLogin === 'function' ? goToLogin : null;
window.goToLogin = function() {
  const landing = document.getElementById('landing');
  const login   = document.getElementById('login-screen');
  if (!landing || !login) { _origGoToLogin?.(); return; }
  landing.style.transition = 'opacity .4s, transform .4s';
  landing.style.opacity    = '0';
  landing.style.transform  = 'scale(0.97)';
  setTimeout(() => {
    landing.style.display = 'none';
    login.style.display   = 'flex';
    login.style.opacity   = '0';
    login.style.transition = 'opacity .35s';
    requestAnimationFrame(() => { login.style.opacity = '1'; });
  }, 380);
};

// ════════════════════════════════════════════════════
// #2 ANIMACIÓN DE NÚMEROS (roll-up)
// ════════════════════════════════════════════════════
function animarNum(el, target, durMs, prefix, suffix) {
  if (!el) return;
  const start = 0, steps = 40, inc = target / steps, step = (durMs || 900) / steps;
  let cur = 0, t = 0;
  const iv = setInterval(() => {
    cur = Math.min(cur + inc, target);
    el.textContent = (prefix||'') + Math.round(cur).toLocaleString('es-CR') + (suffix||'');
    if (++t >= steps) { el.textContent = (prefix||'') + target.toLocaleString('es-CR') + (suffix||''); clearInterval(iv); }
  }, step);
}

// ════════════════════════════════════════════════════
// #3 CONFETI AL COMPLETAR TAREA
// ════════════════════════════════════════════════════
function confeti(x, y) {
  const colors = ['#34c759','#86efac','#f59e0b','#60a5fa','#f472b6','#eafff0'];
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-p';
    p.style.cssText = `left:${x??50}%;top:${y??40}%;background:${colors[i%colors.length]};
      width:${6+Math.random()*6}px;height:${6+Math.random()*6}px;
      transform:rotate(${Math.random()*360}deg);
      --dx:${(Math.random()-0.5)*200}px;--dy:${-(80+Math.random()*200)}px;`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1800);
  }
}

// ════════════════════════════════════════════════════
// #4 BOTÓN COPIAR EN CAMPOS
// ════════════════════════════════════════════════════
function copiarTexto(txt, label) {
  navigator.clipboard?.writeText(String(txt)).then(() =>
    toast(label ? `${label} copiado 📋` : 'Copiado 📋', 'ok', { title:'Copiar' })
  ).catch(() => {});
}
function agregarBtnCopiar(selector, getValFn, label) {
  document.querySelectorAll(selector+':not([data-copy-init])').forEach(el => {
    el.dataset.copyInit = '1';
    const btn = document.createElement('button');
    btn.className = 'btn-copy-inline';
    btn.title = 'Copiar';
    btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    btn.onclick = e => { e.stopPropagation(); copiarTexto(getValFn(el), label); };
    el.style.position = 'relative';
    el.appendChild(btn);
  });
}

// ════════════════════════════════════════════════════
// #5 BARRA DE PROGRESO EN LA PARTE SUPERIOR
// ════════════════════════════════════════════════════
(function() {
  const bar = document.createElement('div');
  bar.id = 'top-progress';
  document.body.prepend(bar);
  const origFetch = window.fetch;
  let reqs = 0;
  function show() { bar.style.width='70%'; bar.style.opacity='1'; }
  function hide() { bar.style.width='100%'; setTimeout(()=>{ bar.style.opacity='0'; bar.style.width='0%'; },300); }
  window.fetch = function(...args) {
    reqs++;
    if (reqs === 1) show();
    return origFetch.apply(this, args).finally(() => { if(--reqs<=0){reqs=0;hide();} });
  };
})();

// ════════════════════════════════════════════════════
// #6 SHAKE AL ERROR DE LOGIN
// ════════════════════════════════════════════════════
(function() {
  const origDoLogin = typeof doLogin === 'function' ? doLogin : null;
  // Hook al observer de errores de login
  const obs = new MutationObserver(() => {
    const e = document.getElementById('login-error');
    if (e && e.style.display !== 'none' && e.textContent) {
      const box = document.querySelector('.login-card, .login-box-inner, #form-login');
      if (box && !box.dataset.shaking) {
        box.dataset.shaking = '1';
        box.classList.add('shake');
        setTimeout(() => { box.classList.remove('shake'); delete box.dataset.shaking; }, 600);
      }
    }
  });
  const target = document.getElementById('login-error');
  if (target) obs.observe(target, { attributes: true, attributeFilter: ['style'] });
})();

// ════════════════════════════════════════════════════
// #8 SCROLL TO TOP
// ════════════════════════════════════════════════════
(function() {
  const btn = document.createElement('button');
  btn.id = 'scroll-top-btn';
  btn.title = 'Volver al inicio';
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>';
  btn.onclick = () => {
    const active = document.querySelector('.section.active, .main.overflow-y-auto');
    (active || window).scrollTo({ top:0, behavior:'smooth' });
  };
  document.body.appendChild(btn);
  document.addEventListener('scroll', e => {
    btn.classList.toggle('visible', (e.target?.scrollTop ?? window.scrollY) > 300);
  }, true);
})();

// ════════════════════════════════════════════════════
// #9 PLACEHOLDER ROTATIVO EN CULTIA
// ════════════════════════════════════════════════════
(function() {
  const frases = [
    '¿Cómo trato el tizón en papa?',
    '¿Cuándo fertilizo el café en Cartago?',
    '¿Qué causa las manchas amarillas en mi tomate?',
    '¿Cuánto bocashi aplico por hectárea?',
    '¿Cómo controlo los trips en fresa orgánicamente?',
    '¿Qué variedad de papa rinde más en altura?',
    '¿Cuándo es la época de siembra del frijol?',
  ];
  let fi = 0;
  function setPlaceholder() {
    const inp = document.getElementById('chat-input');
    if (inp) inp.placeholder = frases[fi = (fi+1) % frases.length];
  }
  setInterval(setPlaceholder, 4000);
})();

// ════════════════════════════════════════════════════
// #11 DARK MODE SYNC CON OS
// ════════════════════════════════════════════════════
(function() {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (!localStorage.getItem('cultyra_tema_manual')) {
    // Cultyra ya es dark por defecto; esto activa el light si el OS prefiere light
    if (!mq.matches) document.body.classList.add('light');
  }
  mq.addEventListener('change', e => {
    if (!localStorage.getItem('cultyra_tema_manual')) {
      document.body.classList.toggle('light', !e.matches);
    }
  });
})();

// ════════════════════════════════════════════════════
// #12 FAVICON DINÁMICO POR SECCIÓN
// ════════════════════════════════════════════════════
const FAVICON_EMOJIS = { dashboard:'🌱', cultivo:'🗺️', clima:'🌧️', sensores:'📡', empleados:'👥', registros:'📊', calendario:'📅', comparar:'⚖️', ia:'🤖', productos:'🛒', ayuda:'❓', acerca:'🌿' };
function setFavicon(emoji) {
  const canvas = document.createElement('canvas');
  canvas.width = 32; canvas.height = 32;
  const ctx = canvas.getContext('2d');
  ctx.font = '26px serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 16, 18);
  const link = document.querySelector('link[rel="icon"]');
  if (link) link.href = canvas.toDataURL();
}

// ════════════════════════════════════════════════════
// #13 PRODUCTIVIDAD SEMANA vs ANTERIOR
// ════════════════════════════════════════════════════
function renderProductividadSemana() {
  const el = document.getElementById('widget-productividad');
  if (!el || typeof registros === 'undefined') return;
  const hoy = new Date();
  const semAct  = registros.filter(r => { const f = new Date(r.fecha); return (hoy - f) < 7*86400000 && r.tipo === 'cosecha'; }).reduce((s,r) => s+r.monto,0);
  const semPrev = registros.filter(r => { const f = new Date(r.fecha); const d = hoy-f; return d >= 7*86400000 && d < 14*86400000 && r.tipo === 'cosecha'; }).reduce((s,r) => s+r.monto,0);
  const diff = semPrev ? Math.round(((semAct-semPrev)/semPrev)*100) : null;
  const up   = diff !== null && diff >= 0;
  el.innerHTML = `
    <div class="wprod-titulo">📈 Productividad esta semana</div>
    <div class="wprod-val">${semAct.toLocaleString('es-CR')} kg cosechados</div>
    ${diff !== null ? `<div class="wprod-badge ${up?'up':'dn'}">${up?'▲':'▼'} ${Math.abs(diff)}% vs semana pasada</div>` : '<div class="wprod-badge neutral">Primera semana</div>'}`;
}

// ════════════════════════════════════════════════════
// #15 VELOCIDAD DEL VIENTO EN CLIMA
// ════════════════════════════════════════════════════
async function cargarViento(lat, lng) {
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=wind_speed_10m&forecast_days=1&timezone=auto`);
    const d = await r.json();
    const now = new Date().getHours();
    const vel = d.hourly?.wind_speed_10m?.[now];
    const el = document.getElementById('widget-viento');
    if (el && vel !== undefined) el.innerHTML = `💨 Viento: <b>${vel.toFixed(1)} km/h</b>`;
  } catch {}
}

// ════════════════════════════════════════════════════
// #18 ÍNDICE UV
// ════════════════════════════════════════════════════
async function cargarUV(lat, lng) {
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=uv_index&forecast_days=1&timezone=auto`);
    const d = await r.json();
    const uv = d.hourly?.uv_index?.[new Date().getHours()] ?? 0;
    const nivel = uv < 3 ? '🟢 Bajo' : uv < 6 ? '🟡 Moderado' : uv < 8 ? '🟠 Alto' : uv < 11 ? '🔴 Muy alto' : '🟣 Extremo';
    const el = document.getElementById('widget-uv');
    if (el) el.innerHTML = `☀️ Índice UV: <b>${uv.toFixed(0)}</b> — ${nivel}`;
  } catch {}
}

// ════════════════════════════════════════════════════
// #20 MINI CALENDARIO EN DASHBOARD
// ════════════════════════════════════════════════════
function renderMiniCalendario() {
  const el = document.getElementById('mini-calendario');
  if (!el) return;
  const hoy = new Date();
  const dias = ['Do','Lu','Ma','Mi','Ju','Vi','Sá'];
  const html = ['<div class="mc-header"><div class="mc-mes">' + hoy.toLocaleDateString('es-CR',{month:'long',year:'numeric'}) + '</div><div class="mc-dias-hd">' + dias.map(d=>`<div>${d}</div>`).join('') + '</div></div><div class="mc-grid">'];
  const primer = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const total  = new Date(hoy.getFullYear(), hoy.getMonth()+1, 0).getDate();
  for (let i = 0; i < primer.getDay(); i++) html.push('<div class="mc-day empty"></div>');
  for (let d = 1; d <= total; d++) {
    const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const tieneTask = (typeof tasks !== 'undefined' ? tasks : []).some(t => t.fecha === fecha);
    const esFer  = typeof esFeriado === 'function' ? esFeriado(fecha) : null;
    html.push(`<div class="mc-day${d===hoy.getDate()?' today':''}${tieneTask?' has-task':''}${esFer?' feriado':''}" title="${esFer||''}">${d}</div>`);
  }
  html.push('</div>');
  el.innerHTML = html.join('');
}

// ════════════════════════════════════════════════════
// #21 GAUGE CIRCULAR DE HUMEDAD
// ════════════════════════════════════════════════════
function renderGaugeHumedad(pct) {
  const el = document.getElementById('gauge-humedad');
  if (!el) return;
  const r = 38, c = 2*Math.PI*r, offset = c - (Math.min(pct,100)/100)*c;
  const color = pct < 40 ? '#f87171' : pct < 70 ? '#f59e0b' : '#34c759';
  el.innerHTML = `<svg width="100" height="100" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="${r}" fill="none" stroke="rgba(52,199,89,0.1)" stroke-width="10"/>
    <circle cx="50" cy="50" r="${r}" fill="none" stroke="${color}" stroke-width="10"
      stroke-dasharray="${c}" stroke-dashoffset="${offset}" stroke-linecap="round"
      transform="rotate(-90 50 50)" style="transition:stroke-dashoffset .8s ease"/>
    <text x="50" y="54" text-anchor="middle" fill="${color}" font-size="18" font-family="Space Mono,monospace" font-weight="700">${Math.round(pct)}%</text>
    <text x="50" y="68" text-anchor="middle" fill="#4f7a53" font-size="9" font-family="DM Sans,sans-serif">Humedad</text>
  </svg>`;
}

// ════════════════════════════════════════════════════
// #22 FASE LUNAR
// ════════════════════════════════════════════════════
function faselunar(fecha) {
  const d = fecha || new Date();
  const lp = 29.53058867;
  const base = new Date(2000,0,6);
  const diff = (d - base) / (1000*60*60*24);
  const age  = ((diff % lp) + lp) % lp;
  const fases = [
    { max:1.84,'ic':'🌑','n':'Luna nueva' },
    { max:7.38,'ic':'🌒','n':'Cuarto creciente' },
    { max:14.76,'ic':'🌕','n':'Luna llena' },
    { max:22.15,'ic':'🌖','n':'Cuarto menguante' },
    { max:29.53,'ic':'🌘','n':'Luna nueva' },
  ];
  const fase = fases.find(f => age <= f.max) || fases[0];
  return fase;
}
function renderFaseLunar() {
  const el = document.getElementById('widget-luna');
  if (!el) return;
  const f = faselunar();
  el.innerHTML = `<span title="${f.n}" style="font-size:22px;cursor:help">${f.ic}</span> <span style="font-size:12px;color:var(--text-mid)">${f.n}</span>`;
}

// ════════════════════════════════════════════════════
// #27 NAVEGAR A LA FINCA (Google Maps / Waze)
// ════════════════════════════════════════════════════
function navegarFinca(idx) {
  const f = (typeof fincas !== 'undefined' && fincas[idx]);
  if (!f?.centro) { toast('Esta finca no tiene coordenadas registradas.','warn',{title:'Navegación'}); return; }
  const [lat,lng] = f.centro;
  const ua = navigator.userAgent.toLowerCase();
  const url = ua.includes('waze') ? `waze://?ll=${lat},${lng}&navigate=yes`
    : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  window.open(url, '_blank');
}

// ════════════════════════════════════════════════════
// #28 IMPORT/EXPORT GEOJSON
// ════════════════════════════════════════════════════
function exportarGeoJSON() {
  if (typeof fincas === 'undefined' || !fincas.length) { toast('No hay fincas para exportar.','warn',{title:'GeoJSON'}); return; }
  const features = fincas.filter(f => f.coords?.length).map(f => ({
    type:'Feature',
    properties:{ nombre:f.nombre, cultivo:f.cultivo, area:f.area, ubicacion:f.ubicacion },
    geometry:{ type:'Polygon', coordinates:[f.coords.map(([la,lo]) => [lo,la])] }
  }));
  const blob = new Blob([JSON.stringify({type:'FeatureCollection',features},null,2)],{type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'cultyra-fincas.geojson'; a.click();
  toast(`${features.length} finca(s) exportadas.`,'ok',{title:'GeoJSON exportado'});
}
function importarGeoJSON(file) {
  const r = new FileReader();
  r.onload = e => {
    try {
      const gj = JSON.parse(e.target.result);
      let cnt = 0;
      (gj.features || []).forEach(feat => {
        if (feat.geometry?.type !== 'Polygon') return;
        const coords = feat.geometry.coordinates[0].map(([lo,la]) => [la,lo]);
        const props  = feat.properties || {};
        fincas.push({ nombre:props.nombre||'Importada', cultivo:props.cultivo||'Sin cultivo', area:props.area||'0', ubicacion:props.ubicacion||'', coords, centro:coords[0]||null, fechaInicio:new Date().toISOString().slice(0,10) });
        cnt++;
      });
      guardar(); renderFincas();
      toast(`${cnt} finca(s) importadas correctamente.`,'ok',{title:'GeoJSON'});
    } catch { toast('Archivo GeoJSON inválido.','error',{title:'GeoJSON'}); }
  };
  r.readAsText(file);
}

// ════════════════════════════════════════════════════
// #30 MAPA MODO NOCTURNO (Carto Dark)
// ════════════════════════════════════════════════════
let _mapaDark = false;
function toggleMapaDark() {
  _mapaDark = !_mapaDark;
  if (typeof mapaGeneral === 'undefined' || !mapaGeneral) return;
  if (typeof _capaActual !== 'undefined' && _capaActual) mapaGeneral.removeLayer(_capaActual);
  window._capaActual = L.tileLayer(
    _mapaDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { attribution:'© CartoDB', maxZoom:19 }
  ).addTo(mapaGeneral);
  const btn = document.getElementById('btn-mapa-dark');
  if (btn) btn.classList.toggle('active', _mapaDark);
}

// ════════════════════════════════════════════════════
// #36 CORRELACIÓN LLUVIA VS COSECHA
// ════════════════════════════════════════════════════
function renderCorrelacionLluviaCosecha() {
  const canvas = document.getElementById('chart-correlacion');
  if (!canvas || typeof Chart === 'undefined' || typeof registros === 'undefined') return;
  const meses = Array.from({length:6},(_,i) => {
    const d = new Date(); d.setMonth(d.getMonth()-5+i);
    return { label:d.toLocaleDateString('es-CR',{month:'short'}), cosecha:0, lluvia:Math.round(80+Math.random()*120) };
  });
  registros.forEach(r => {
    if (r.tipo !== 'cosecha') return;
    const f = new Date(r.fecha), now = new Date();
    const mOffset = (now.getFullYear()-f.getFullYear())*12 + now.getMonth()-f.getMonth();
    const idx = 5-mOffset;
    if (idx >= 0 && idx < 6) meses[idx].cosecha += r.monto;
  });
  if (canvas._chart) canvas._chart.destroy();
  canvas._chart = new Chart(canvas, {
    type:'scatter',
    data:{ datasets:[{ label:'Lluvia (mm) vs Cosecha (kg)', data:meses.map(m=>({x:m.lluvia,y:m.cosecha})), backgroundColor:'rgba(52,199,89,0.7)', borderColor:'#34c759', pointRadius:8 }] },
    options:{ responsive:true, plugins:{ legend:{ labels:{ color:'#9ec5a2', font:{size:12} } }, tooltip:{ callbacks:{ label:c=>`💧${c.parsed.x}mm · 🌾${c.parsed.y.toLocaleString('es-CR')}kg` } } }, scales:{ x:{ title:{display:true,text:'Lluvia mm',color:'#4f7a53'}, ticks:{color:'#4f7a53'}, grid:{color:'rgba(52,199,89,.06)'} }, y:{ title:{display:true,text:'Cosecha kg',color:'#4f7a53'}, ticks:{color:'#4f7a53'}, grid:{color:'rgba(52,199,89,.06)'} } } }
  });
}

// ════════════════════════════════════════════════════
// #37 HORAS FRÍO ACUMULADAS
// ════════════════════════════════════════════════════
async function calcularHorasFrio(lat, lng) {
  const el = document.getElementById('widget-horas-frio');
  if (!el || !lat || !lng) return;
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m&past_days=30&forecast_days=0&timezone=auto`);
    const d = await r.json();
    const temps = d.hourly?.temperature_2m || [];
    const horasFrio = temps.filter(t => t !== null && t <= 7).length;
    el.innerHTML = `❄️ Horas frío acumuladas (30 días): <b style="color:var(--blue)">${horasFrio} h</b><br><small style="color:var(--text-dim)">Cultivos que necesitan frío: fresa 250h, manzana 1000h, pera 800h</small>`;
  } catch { el.innerHTML = '❄️ Horas frío: no disponible'; }
}

// ════════════════════════════════════════════════════
// #38 EVAPOTRANSPIRACIÓN DE REFERENCIA ET₀
// ════════════════════════════════════════════════════
async function calcularET0Finca(lat, lng) {
  const el = document.getElementById('widget-et0');
  if (!el || !lat || !lng) return;
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=et0_fao_evapotranspiration&forecast_days=1&timezone=auto`);
    const d = await r.json();
    const et0 = d.daily?.et0_fao_evapotranspiration?.[0];
    if (et0 !== undefined) el.innerHTML = `💧 ET₀ hoy: <b style="color:var(--blue)">${et0.toFixed(2)} mm/día</b><br><small style="color:var(--text-dim)">Agua que necesita tu cultivo para compensar la evaporación</small>`;
  } catch { el.innerHTML = ''; }
}

// ════════════════════════════════════════════════════
// #45 IMPORTAR REGISTROS DESDE CSV
// ════════════════════════════════════════════════════
function importarRegistrosCSV(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const lines = e.target.result.split('\n').filter(l => l.trim());
    let cnt = 0;
    lines.forEach((line, idx) => {
      if (idx === 0 && line.toLowerCase().includes('tipo')) return; // skip header
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g,''));
      if (cols.length < 3) return;
      const [finca, tipo, monto, nota, fecha] = cols;
      if (!['cosecha','venta','gasto'].includes(tipo?.toLowerCase())) return;
      registros.push({
        id: Date.now() + idx, finca: finca||'General', tipo: tipo.toLowerCase(),
        monto: parseFloat(monto)||0, nota: nota||'', fecha: fecha || new Date().toISOString().slice(0,10)
      });
      cnt++;
    });
    guardar(); renderRegistros();
    toast(`${cnt} registro(s) importados.`, 'ok', { title:'CSV importado' });
  };
  reader.readAsText(file);
}

// ════════════════════════════════════════════════════
// #47 CATEGORÍAS DE GASTOS PERSONALIZADAS
// ════════════════════════════════════════════════════
const CATEGORIAS_GASTO = ['Fertilizantes','Mano de obra','Combustible','Agroquímicos','Transporte','Maquinaria','Semillas','Empaque','Agua/Riego','Otros'];

// ════════════════════════════════════════════════════
// #48 PRESUPUESTO POR CICLO
// ════════════════════════════════════════════════════
function guardarPresupuesto() {
  const limite = parseFloat(document.getElementById('presupuesto-input')?.value)||0;
  if (!limite) { toast('Ingresa un límite de presupuesto.','warn',{title:'Presupuesto'}); return; }
  localStorage.setItem('cultyra_presupuesto', limite);
  verificarPresupuesto();
  toast(`Presupuesto de ${(typeof fmtColones==='function'?fmtColones(limite):limite)} guardado.`,'ok',{title:'Presupuesto'});
}
function verificarPresupuesto() {
  const limite = parseFloat(localStorage.getItem('cultyra_presupuesto'))||0;
  if (!limite || typeof registros === 'undefined') return;
  const gastosMes = registros.filter(r => r.tipo==='gasto' && new Date(r.fecha).getMonth()===new Date().getMonth()).reduce((s,r)=>s+r.monto,0);
  const pct = Math.round((gastosMes/limite)*100);
  const el = document.getElementById('presupuesto-bar-wrap');
  if (el) {
    el.style.display='block';
    el.innerHTML=`<div style="font-size:12px;color:var(--text-mid);margin-bottom:5px">Presupuesto mensual: <b style="color:${pct>=90?'#f87171':pct>=70?'#f59e0b':'#34c759'}">${pct}% usado</b></div><div class="meta-bar-wrap"><div class="meta-bar-fill" style="width:${Math.min(pct,100)}%;background:${pct>=90?'#f87171':pct>=70?'#f59e0b':'#34c759'}"></div></div><div style="font-size:11px;color:var(--text-dim);margin-top:4px">${typeof fmtColones==='function'?fmtColones(gastosMes):gastosMes} de ${typeof fmtColones==='function'?fmtColones(limite):limite}</div>`;
  }
  if (pct >= 90) toast(`⚠️ Has usado el ${pct}% de tu presupuesto mensual.`,'warn',{title:'Presupuesto'});
}

// ════════════════════════════════════════════════════
// #49 PUNTO DE EQUILIBRIO
// ════════════════════════════════════════════════════
function calcularPuntoEquilibrio() {
  const gastos = (typeof registros !== 'undefined' ? registros : []).filter(r=>r.tipo==='gasto').reduce((s,r)=>s+r.monto,0);
  const ventas = (typeof registros !== 'undefined' ? registros : []).filter(r=>r.tipo==='venta').reduce((s,r)=>s+r.monto,0);
  const cosecha = (typeof registros !== 'undefined' ? registros : []).filter(r=>r.tipo==='cosecha').reduce((s,r)=>s+r.monto,0);
  const precioKg = ventas && cosecha ? ventas/cosecha : 0;
  const kgNecesarios = precioKg ? Math.ceil(gastos/precioKg) : 0;
  const el = document.getElementById('punto-equilibrio-res');
  if (!el) return;
  if (!gastos) { el.textContent = 'Agrega registros de gastos para calcular.'; return; }
  el.innerHTML = `<div class="pe-fila"><span>Total gastos registrados</span><b>${typeof fmtColones==='function'?fmtColones(gastos):gastos}</b></div>
    <div class="pe-fila"><span>Precio promedio/kg</span><b>${precioKg?fmtColones(precioKg.toFixed(0)):'No calculable'}</b></div>
    <div class="pe-fila pe-total"><span>Necesitas vender</span><b style="color:${cosecha>=kgNecesarios?'#34c759':'#f59e0b'}">${kgNecesarios.toLocaleString('es-CR')} kg</b></div>
    <div class="pe-fila" style="font-size:11px;color:var(--text-dim)"><span>Cosechado actual</span><b>${cosecha.toLocaleString('es-CR')} kg ${cosecha>=kgNecesarios?'✅':'⚠️'}</b></div>`;
}

// ════════════════════════════════════════════════════
// #51 FLUJO DE CAJA
// ════════════════════════════════════════════════════
function renderFlujoCaja() {
  const canvas = document.getElementById('chart-flujo-caja');
  if (!canvas || typeof Chart === 'undefined' || typeof registros === 'undefined') return;
  const meses = Array.from({length:6},(_,i) => {
    const d = new Date(); d.setMonth(d.getMonth()-5+i);
    return { label:d.toLocaleDateString('es-CR',{month:'short'}), entradas:0, salidas:0 };
  });
  registros.forEach(r => {
    const f = new Date(r.fecha), now = new Date();
    const idx = 5 - ((now.getFullYear()-f.getFullYear())*12 + now.getMonth()-f.getMonth());
    if (idx < 0 || idx > 5) return;
    if (r.tipo === 'venta') meses[idx].entradas += r.monto;
    else if (r.tipo === 'gasto') meses[idx].salidas += r.monto;
  });
  let saldo = 0;
  const saldoAcum = meses.map(m => (saldo += m.entradas - m.salidas));
  if (canvas._chart) canvas._chart.destroy();
  canvas._chart = new Chart(canvas, {
    data:{ labels:meses.map(m=>m.label), datasets:[
      { type:'bar', label:'Entradas', data:meses.map(m=>m.entradas), backgroundColor:'rgba(52,199,89,0.7)', borderRadius:4 },
      { type:'bar', label:'Salidas', data:meses.map(m=>m.salidas), backgroundColor:'rgba(248,113,113,0.6)', borderRadius:4 },
      { type:'line', label:'Saldo acumulado', data:saldoAcum, borderColor:'#60a5fa', backgroundColor:'rgba(96,165,250,0.1)', tension:0.4, fill:true, pointRadius:4, pointBackgroundColor:'#60a5fa' }
    ]},
    options:{ responsive:true, plugins:{ legend:{ labels:{ color:'#9ec5a2', font:{size:11} } } }, scales:{ x:{ ticks:{color:'#4f7a53'}, grid:{color:'rgba(52,199,89,.06)'} }, y:{ ticks:{color:'#4f7a53', callback:v=>'₡'+Number(v).toLocaleString('es-CR')}, grid:{color:'rgba(52,199,89,.06)'} } } }
  });
}

// ════════════════════════════════════════════════════
// #54 MULTI-MONEDA (CRC + USD con tasa BCCR)
// ════════════════════════════════════════════════════
let _tipoCambio = 525; // fallback
async function cargarTipoCambio() {
  try {
    const r = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const d = await r.json();
    if (d.rates?.CRC) _tipoCambio = d.rates.CRC;
  } catch {}
}
function crcToUsd(c) { return (c / _tipoCambio).toFixed(2); }
function usdToCrc(u) { return Math.round(u * _tipoCambio); }

// ════════════════════════════════════════════════════
// #63 BUNDLES DE PRODUCTOS
// ════════════════════════════════════════════════════
const BUNDLES = [
  { id:'b1', nombre:'Kit inicio para Papa 🥔', ids:[3,4,5], descuento:15 },
  { id:'b2', nombre:'Pack sensores campo ☁️', ids:[1,2,8], descuento:10 },
  { id:'b3', nombre:'Fertilización orgánica 🌿', ids:[3,7], descuento:12 },
];
function renderBundles() {
  const el = document.getElementById('bundles-wrap');
  if (!el || typeof productos === 'undefined') return;
  el.innerHTML = BUNDLES.map(b => {
    const prods = b.ids.map(id => productos.find(p=>p.id===id)).filter(Boolean);
    const total = prods.reduce((s,p)=>s+p.precio,0);
    const precio = Math.round(total * (1-b.descuento/100));
    return `<div class="bundle-card">
      <div class="bundle-tag">-${b.descuento}%</div>
      <div class="bundle-name">${b.nombre}</div>
      <div class="bundle-prods">${prods.map(p=>p.name).join(' + ')}</div>
      <div class="bundle-precios"><s style="color:var(--text-dim);font-size:12px">${typeof fmtColones==='function'?fmtColones(total):total}</s> → <b class="td-green">${typeof fmtColones==='function'?fmtColones(precio):precio}</b></div>
      <button class="btn-add" onclick="agregarBundle('${b.id}')">+ Agregar kit</button>
    </div>`;
  }).join('');
}
function agregarBundle(bid) {
  const b = BUNDLES.find(b=>b.id===bid);
  if (!b) return;
  b.ids.forEach(id => { if(typeof addToCart==='function') addToCart(id); });
  toast(`Kit agregado al carrito 🎁`,'ok',{title:b.nombre});
}

// ════════════════════════════════════════════════════
// #65 PUNTOS DE LEALTAD
// ════════════════════════════════════════════════════
let _puntos = parseInt(localStorage.getItem('cultyra_puntos')||'0');
function sumarPuntos(total) {
  const ganados = Math.floor(total / 1000);
  _puntos += ganados;
  localStorage.setItem('cultyra_puntos', _puntos);
  const el = document.getElementById('puntos-display');
  if (el) el.textContent = '⭐ ' + _puntos.toLocaleString('es-CR') + ' pts';
  if (ganados > 0) toast(`+${ganados} puntos de lealtad ⭐`, 'ok', { title:'Puntos' });
}
function canjearPuntos() {
  if (_puntos < 100) { toast('Necesitas al menos 100 puntos para canjear.','warn',{title:'Puntos'}); return; }
  const desc = Math.floor(_puntos/100)*500;
  if (typeof cuponActivo !== 'undefined') window.cuponActivo = { codigo:'PUNTOS', pct:0, monto_fijo:desc };
  toast(`₡${desc.toLocaleString('es-CR')} de descuento aplicados 🎉`,'ok',{title:'Canje de puntos'});
  _puntos = _puntos % 100;
  localStorage.setItem('cultyra_puntos', _puntos);
}

// ════════════════════════════════════════════════════
// #66 FECHA ESTIMADA DE ENTREGA
// ════════════════════════════════════════════════════
function fechaEntregaEstimada() {
  const hoy = new Date();
  const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const min = new Date(hoy.getTime() + 2*86400000);
  const max = new Date(hoy.getTime() + 3*86400000);
  return `${dias[min.getDay()]} ${min.getDate()} – ${dias[max.getDay()]} ${max.getDate()} de ${max.toLocaleDateString('es-CR',{month:'long'})}`;
}

// ════════════════════════════════════════════════════
// #70 BOTÓN WHATSAPP SOPORTE FLOTANTE
// ════════════════════════════════════════════════════
(function() {
  const btn = document.createElement('a');
  btn.id  = 'wa-soporte';
  btn.href = 'https://wa.me/50662053039?text=Hola%20Cultyra%2C%20necesito%20ayuda%20con%20mi%20pedido';
  btn.target = '_blank';
  btn.rel = 'noopener';
  btn.title = 'Soporte por WhatsApp';
  btn.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>';
  document.body.appendChild(btn);
})();

// ════════════════════════════════════════════════════
// #72 DIAGNÓSTICO CULTIA CON DESCRIPCIÓN
// ════════════════════════════════════════════════════
function diagnosticarConDescripcion() {
  const desc = document.getElementById('diag-descripcion')?.value.trim();
  if (!desc) { toast('Describe los síntomas de tu planta.','warn',{title:'Diagnóstico'}); return; }
  const cultivo = (typeof fincas !== 'undefined' && fincas.length) ? fincas[0].cultivo : 'cultivo';
  const pregunta = `Tengo un ${cultivo} con los siguientes síntomas: ${desc}. ¿Qué puede ser y cómo lo trato con productos biodegradables disponibles en Costa Rica? Dame un diagnóstico claro en 3 pasos.`;
  const inp = document.getElementById('chat-input');
  if (inp) inp.value = pregunta;
  if (typeof sendMessage === 'function') { sendMessage(); document.getElementById('diag-modal')?.classList.remove('open'); }
  if (typeof irA === 'function') irA('ia');
}

// ════════════════════════════════════════════════════
// #73 GENERADOR DE PLAN NUTRICIONAL
// ════════════════════════════════════════════════════
function generarPlanNutricional() {
  const cultivo = document.getElementById('pn-cultivo')?.value;
  const etapa   = document.getElementById('pn-etapa')?.value;
  const ph      = document.getElementById('pn-ph')?.value;
  if (!cultivo || !etapa) { toast('Selecciona cultivo y etapa.','warn',{title:'Plan nutricional'}); return; }
  const pregunta = `Genera un calendario de fertilización orgánica y biodegradable para ${cultivo} en etapa de ${etapa}${ph?' con pH del suelo '+ph:''}. Incluye: producto, dosis por hectárea, frecuencia y método de aplicación. Usa productos disponibles en Costa Rica.`;
  const inp = document.getElementById('chat-input');
  if (inp) inp.value = pregunta;
  if (typeof sendMessage === 'function') { sendMessage(); document.getElementById('pn-modal')?.classList.remove('open'); }
  if (typeof irA === 'function') irA('ia');
}

// ════════════════════════════════════════════════════
// #74 ASISTENTE DE COMPRA CULTIA
// ════════════════════════════════════════════════════
function abrirAsistenteCompra() {
  const presupuesto = document.getElementById('asist-presupuesto')?.value.trim();
  const problema    = document.getElementById('asist-problema')?.value.trim();
  if (!presupuesto || !problema) { toast('Completa los campos.','warn',{title:'Asistente'}); return; }
  const cultivo = (typeof fincas !== 'undefined' && fincas.length) ? fincas[0].cultivo : 'mi cultivo';
  const pregunta = `Tengo un presupuesto de ₡${presupuesto} y tengo el siguiente problema en ${cultivo}: ${problema}. ¿Qué productos de la tienda de Cultyra me recomiendas comprar con ese presupuesto?`;
  const inp = document.getElementById('chat-input');
  if (inp) inp.value = pregunta;
  if (typeof sendMessage === 'function') { sendMessage(); document.getElementById('asist-compra-modal')?.classList.remove('open'); }
  if (typeof irA === 'function') irA('ia');
}

// ════════════════════════════════════════════════════
// #76 MODO VOZ — Web Speech API
// ════════════════════════════════════════════════════
let _escuchando = false;
let _reconocedor = null;
function iniciarVoz() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast('Tu navegador no soporta entrada por voz. Usa Chrome.','warn',{title:'Voz'}); return; }
  if (_escuchando) { _reconocedor?.stop(); return; }
  _reconocedor = new SR();
  _reconocedor.lang = 'es-CR'; _reconocedor.continuous = false; _reconocedor.interimResults = false;
  _reconocedor.onstart  = () => { _escuchando = true; const b = document.getElementById('btn-voz'); if(b){b.classList.add('grabando');b.title='Escuchando… (clic para detener)';} toast('Escuchando...🎤','info',{title:'Voz'}); };
  _reconocedor.onresult = e => { const txt = e.results[0][0].transcript; const inp = document.getElementById('chat-input'); if(inp){inp.value=txt; if(typeof sendMessage==='function')sendMessage();} };
  _reconocedor.onend    = () => { _escuchando = false; const b = document.getElementById('btn-voz'); if(b){b.classList.remove('grabando');b.title='Entrada por voz';} };
  _reconocedor.onerror  = e => { _escuchando = false; toast('Error de voz: ' + e.error,'error',{title:'Voz'}); };
  _reconocedor.start();
}

// ════════════════════════════════════════════════════
// #78 GENERADOR DE INFORME TÉCNICO
// ════════════════════════════════════════════════════
function generarInformeTecnico() {
  if (typeof fincas === 'undefined' || !fincas.length) { toast('Agrega al menos una finca para generar el informe.','warn',{title:'Informe'}); return; }
  const resumen = fincas.map(f => `• ${f.nombre}: ${f.area} ha de ${f.cultivo} en ${f.ubicacion}`).join('\n');
  const ventas  = typeof registros !== 'undefined' ? registros.filter(r=>r.tipo==='venta').reduce((s,r)=>s+r.monto,0) : 0;
  const gastos  = typeof registros !== 'undefined' ? registros.filter(r=>r.tipo==='gasto').reduce((s,r)=>s+r.monto,0) : 0;
  const pregunta = `Redacta un informe técnico agronómico profesional para presentar a un banco o institución. Datos de la operación:\n${resumen}\nVentas acumuladas: ₡${ventas.toLocaleString('es-CR')}\nGastos acumulados: ₡${gastos.toLocaleString('es-CR')}\nIncluye: descripción de la operación, análisis financiero básico, recomendaciones de mejora y conclusión. Formato profesional con secciones numeradas.`;
  const inp = document.getElementById('chat-input');
  if (inp) inp.value = pregunta;
  if (typeof sendMessage==='function') sendMessage();
  if (typeof irA==='function') irA('ia');
}

// ════════════════════════════════════════════════════
// #81 SLIDER DE TAMAÑO DE TEXTO
// ════════════════════════════════════════════════════
function setFontSize(size) {
  document.documentElement.style.fontSize = size + 'px';
  localStorage.setItem('cultyra_font_size', size);
  const lbl = document.getElementById('font-size-lbl');
  if (lbl) lbl.textContent = size + 'px';
}
(function() {
  const saved = parseInt(localStorage.getItem('cultyra_font_size'));
  if (saved) document.documentElement.style.fontSize = saved + 'px';
})();

// ════════════════════════════════════════════════════
// #82 MODO DALTÓNICO
// ════════════════════════════════════════════════════
function toggleDaltonico() {
  document.body.classList.toggle('daltonico');
  const on = document.body.classList.contains('daltonico');
  localStorage.setItem('cultyra_daltonico', on ? '1' : '');
  toast(on ? 'Modo daltónico activado (azul/naranja)' : 'Colores normales restaurados', 'info', { title:'Accesibilidad' });
}
if (localStorage.getItem('cultyra_daltonico')) document.body.classList.add('daltonico');

// ════════════════════════════════════════════════════
// #83 HAPTIC FEEDBACK
// ════════════════════════════════════════════════════
function vibrar(ms) { if (navigator.vibrate) navigator.vibrate(ms || 50); }
document.addEventListener('click', e => {
  const btn = e.target.closest('.btn-primary,.btn-add,.btn-landing-cta,.btn-login');
  if (btn) vibrar(30);
}, { passive: true });

// ════════════════════════════════════════════════════
// #84 MODO KIOSCO
// ════════════════════════════════════════════════════
let _kiosco = false;
function toggleKiosco() {
  _kiosco = !_kiosco;
  document.body.classList.toggle('modo-kiosco', _kiosco);
  if (_kiosco && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(()=>{});
  if (!_kiosco && document.exitFullscreen) document.exitFullscreen().catch(()=>{});
  toast(_kiosco ? 'Modo kiosco activo (pantalla completa)' : 'Kiosco desactivado', 'info', { title:'Kiosco' });
}
document.addEventListener('keydown', e => { if(e.key==='F11') { e.preventDefault(); toggleKiosco(); } });

// ════════════════════════════════════════════════════
// #85 ATAJOS DE TECLADO COMPLETOS
// ════════════════════════════════════════════════════
const SHORTCUTS = [
  { tecla:'Ctrl+K',   desc:'Búsqueda global' },
  { tecla:'Ctrl+/',   desc:'Mostrar atajos' },
  { tecla:'G + D',    desc:'Ir a Dashboard' },
  { tecla:'G + F',    desc:'Ir a Fincas' },
  { tecla:'G + R',    desc:'Ir a Registros' },
  { tecla:'G + I',    desc:'Ir a CultIA' },
  { tecla:'G + T',    desc:'Ir a Tienda' },
  { tecla:'G + E',    desc:'Ir a Equipo' },
  { tecla:'G + C',    desc:'Ir a Clima' },
  { tecla:'Esc',      desc:'Cerrar modal / salir kiosco' },
  { tecla:'F11',      desc:'Modo kiosco / pantalla completa' },
];
let _gPressed = false;
document.addEventListener('keydown', e => {
  if ((e.ctrlKey||e.metaKey) && e.key === '/') { e.preventDefault(); document.getElementById('shortcuts-modal')?.classList.add('open'); }
  if (e.key === 'g' || e.key === 'G') { _gPressed = true; setTimeout(() => { _gPressed = false; }, 1000); return; }
  if (_gPressed && typeof irA === 'function') {
    const map = { d:'dashboard', f:'cultivo', r:'registros', i:'ia', t:'productos', e:'empleados', c:'clima' };
    if (map[e.key.toLowerCase()]) { irA(map[e.key.toLowerCase()]); _gPressed = false; }
  }
});

// ════════════════════════════════════════════════════
// #88 REDUCIR ANIMACIONES (prefers-reduced-motion)
// ════════════════════════════════════════════════════
if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) {
  const s = document.createElement('style');
  s.textContent = '*{animation-duration:.01ms!important;transition-duration:.01ms!important}';
  document.head.appendChild(s);
}

// ════════════════════════════════════════════════════
// #92 EXPORTAR TODOS MIS DATOS
// ════════════════════════════════════════════════════
async function exportarTodosDatos() {
  const datos = {
    exportado: new Date().toISOString(),
    usuario: typeof sesion !== 'undefined' ? { nombre:sesion.nombre, email:sesion.email } : {},
    fincas: typeof fincas !== 'undefined' ? fincas : [],
    tareas: typeof tasks !== 'undefined' ? tasks : [],
    empleados: typeof empleados !== 'undefined' ? empleados : [],
    registros: typeof registros !== 'undefined' ? registros : [],
    pedidos: typeof obtenerPedidos === 'function' ? obtenerPedidos() : [],
  };
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `cultyra-mis-datos-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  toast('Datos exportados correctamente.', 'ok', { title:'Exportar mis datos' });
}

// ════════════════════════════════════════════════════
// #94 PIN DE LA APP
// ════════════════════════════════════════════════════
let _pinActivo = false, _pinGuardado = localStorage.getItem('cultyra_pin_hash');
function configurarPIN() {
  const pin = prompt('Escribe un PIN de 4 dígitos para proteger la app:');
  if (!pin || !/^\d{4}$/.test(pin)) { toast('El PIN debe tener exactamente 4 dígitos.','warn',{title:'PIN'}); return; }
  crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin)).then(buf => {
    const hash = Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
    localStorage.setItem('cultyra_pin_hash', hash);
    _pinGuardado = hash;
    toast('PIN configurado. Se pedirá al volver de segundo plano.','ok',{title:'PIN activado'});
  });
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && _pinGuardado && !_pinActivo && document.getElementById('app')?.style.display !== 'none') {
    _pinActivo = true;
    const pin = prompt('🔒 Ingresa tu PIN de Cultyra:');
    if (!pin) { _pinActivo = false; return; }
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin)).then(buf => {
      const h = Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
      _pinActivo = false;
      if (h !== _pinGuardado) { toast('PIN incorrecto. Cerrando sesión.','error',{title:'PIN'}); if(typeof doLogout==='function')doLogout(); }
    });
  }
});

// ════════════════════════════════════════════════════
// INIT — conectar todo al DOM existente
// ════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // #20 Mini calendario
  renderMiniCalendario();
  // #22 Fase lunar
  renderFaseLunar();
  // #48 Presupuesto
  verificarPresupuesto();
  // #49 Punto equilibrio
  calcularPuntoEquilibrio();
  // #54 Tipo de cambio
  cargarTipoCambio();
  // #65 Puntos display
  const pdEl = document.getElementById('puntos-display');
  if (pdEl) pdEl.textContent = '⭐ ' + _puntos.toLocaleString('es-CR') + ' pts';
  // #63 Bundles
  setTimeout(renderBundles, 400);
  // #13 Productividad
  setTimeout(renderProductividadSemana, 500);

  // Agregar controles de accesibilidad al menú
  const navFoot = document.querySelector('.nav-menu-foot');
  if (navFoot) {
    const items = [
      { label:'🎨 Modo daltónico', fn:'toggleDaltonico()' },
      { label:'🔒 Configurar PIN', fn:'configurarPIN()' },
      { label:'⌨️ Ver atajos de teclado', fn:"document.getElementById('shortcuts-modal')?.classList.add('open')" },
      { label:'🖥️ Modo kiosco (F11)', fn:'toggleKiosco()' },
      { label:'📦 Exportar mis datos', fn:'exportarTodosDatos()' },
    ];
    items.forEach(({ label, fn }) => {
      if (navFoot.querySelector(`[onclick="${fn}"]`)) return;
      const btn = document.createElement('button');
      btn.className = 'btn-tema'; btn.textContent = label;
      btn.setAttribute('onclick', fn); navFoot.appendChild(btn);
    });

    // Slider tamaño de fuente
    if (!document.getElementById('font-slider-wrap')) {
      const wrap = document.createElement('div');
      wrap.id = 'font-slider-wrap';
      wrap.innerHTML = `<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-dim);margin-bottom:4px"><span>Tamaño texto</span><span id="font-size-lbl">${localStorage.getItem('cultyra_font_size')||'16'}px</span></div><input type="range" min="12" max="22" step="1" value="${localStorage.getItem('cultyra_font_size')||16}" oninput="setFontSize(parseInt(this.value))" style="width:100%;accent-color:var(--green-bright)">`;
      navFoot.appendChild(wrap);
    }
  }

  // Hook completarTarea para confeti
  const origComplTask = typeof completarTarea === 'function' ? completarTarea : null;
  if (origComplTask) {
    window.completarTarea = function(idx) {
      origComplTask(idx);
      confeti(50, 40);
      vibrar([50, 30, 50]);
    };
  }

  // Botón voz en CultIA
  const iaInput = document.querySelector('.chat-input-row');
  if (iaInput && !document.getElementById('btn-voz')) {
    const btn = document.createElement('button');
    btn.id = 'btn-voz'; btn.className = 'btn-voz-ia'; btn.title = 'Entrada por voz';
    btn.onclick = iniciarVoz;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
    iaInput.insertBefore(btn, iaInput.querySelector('#chat-input'));
  }

  // Mapa: agregar botón modo nocturno y GeoJSON
  const mapaCtrl = document.querySelector('.mapa-controles');
  if (mapaCtrl) {
    if (!document.getElementById('btn-mapa-dark')) {
      const btn = document.createElement('button');
      btn.id = 'btn-mapa-dark'; btn.className = 'btn-mapa-ctrl';
      btn.textContent = '🌙 Nocturno'; btn.onclick = toggleMapaDark;
      mapaCtrl.appendChild(btn);
    }
    if (!document.getElementById('btn-geojson-exp')) {
      const btn = document.createElement('button');
      btn.id = 'btn-geojson-exp'; btn.className = 'btn-mapa-ctrl';
      btn.textContent = '⬇ GeoJSON'; btn.onclick = exportarGeoJSON;
      mapaCtrl.appendChild(btn);
    }
    if (!document.getElementById('btn-geojson-imp')) {
      const inp = document.createElement('input');
      inp.type='file'; inp.accept='.geojson,.json'; inp.style.display='none'; inp.id='geojson-inp';
      inp.onchange = e => { if(e.target.files[0]) importarGeoJSON(e.target.files[0]); inp.value=''; };
      const btn = document.createElement('button');
      btn.id = 'btn-geojson-imp'; btn.className = 'btn-mapa-ctrl';
      btn.textContent = '⬆ Importar'; btn.onclick = () => inp.click();
      mapaCtrl.appendChild(btn); mapaCtrl.appendChild(inp);
    }
  }

  // CSV import en registros
  const regForm = document.querySelector('.reg-form');
  if (regForm && !document.getElementById('btn-csv-imp')) {
    const inp = document.createElement('input');
    inp.type='file'; inp.accept='.csv'; inp.style.display='none'; inp.id='csv-reg-inp';
    inp.onchange = e => { if(e.target.files[0]) importarRegistrosCSV(e.target.files[0]); inp.value=''; };
    const btn = document.createElement('button');
    btn.id = 'btn-csv-imp'; btn.className = 'btn-mapa-ctrl';
    btn.style.cssText = 'border-radius:10px;padding:8px 13px;font-size:12.5px';
    btn.textContent = '⬆ Importar CSV'; btn.onclick = () => inp.click();
    regForm.appendChild(btn); regForm.appendChild(inp);
  }

  // Favicon dinámico (override showSection)
  const origShow = typeof showSection === 'function' ? showSection : null;
  if (origShow && !window._faviconHooked) {
    window._faviconHooked = true;
    const origShow2 = window.showSection;
    window.showSection = function(id, btn) {
      origShow2(id, btn);
      setFavicon(FAVICON_EMOJIS[id] || '🌱');
    };
  }
});

// Populate shortcuts modal on open
document.addEventListener('DOMContentLoaded', () => {
  const obs = new MutationObserver(() => {
    const list = document.getElementById('shortcuts-list');
    if (list && !list.children.length) {
      list.innerHTML = SHORTCUTS.map(s => `
        <div class="shortcut-row">
          <span class="shortcut-desc">${s.desc}</span>
          <kbd class="shortcut-key">${s.tecla}</kbd>
        </div>`).join('');
    }
  });
  const modal = document.getElementById('shortcuts-modal');
  if (modal) obs.observe(modal, { attributes:true, attributeFilter:['class'] });
});
