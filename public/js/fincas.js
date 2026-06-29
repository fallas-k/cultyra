// ============================================================
// CULTYRA · FINCAS
// ============================================================

// ===== FINCAS =====
let fincas = [];

function renderFincas() {
  const g = document.getElementById('fincas-grid');
  const emojis = {'Café':'☕','Café de altura':'☕','Piña':'🍍','Plátano':'🍌','Banano':'🍌','Yuca':'🌾','Tomate':'🍅','Lechuga':'🥬','Papa':'🥔','Cebolla':'🧅','Zanahoria':'🥕','Repollo':'🥬','Brócoli':'🥦','Coliflor':'🥦','Fresa':'🍓','Mora':'🫐','Arándano':'🫐','Manzana':'🍎','Ciruela':'🍑','Durazno':'🍑','Aguacate Hass':'🥑','Hortalizas de hoja':'🥬','Flores y follajes':'🌷','Trucha (acuicultura)':'🐟','Caña de azúcar':'🎋','Arroz':'🌾','Frijol':'🫘','Maíz':'🌽','Otro':'🌱'};
  if (!fincas.length) {
    g.innerHTML = '<div class="vacio"><div class="ic">🗺️</div><h4>Aún no tienes fincas</h4><p>Dibuja tu primer terreno en el mapa y empieza a recibir alertas del clima.</p><button onclick="openFincaModal()">+ Agregar mi primera finca</button></div>';
    const selv = document.getElementById('task-finca');
    selv.innerHTML = '<option value="General">General</option>';
    return;
  }
  g.innerHTML = fincas.map((f,i) => `
    <div class="finca-card">
      <div class="finca-header">
        <div><h3>${emojis[f.cultivo]||'🌾'} ${f.nombre}</h3><p>📍 ${f.ubicacion}</p></div>
        <div style="display:flex;align-items:center;gap:6px;"><button class="btn-edit-mini" onclick="editarFinca(${i})" title="Editar">✏️</button><span class="finca-badge">${f.cultivo}</span></div>
      </div>
      <div class="finca-body">
        <div class="finca-stat"><span>Área total</span><span>${f.area} ha</span></div>
        <div class="finca-stat"><span>Cultivo principal</span><span>${f.cultivo}</span></div>
        <div class="finca-stat"><span>Estado</span><span style="color:#52b788">✓ Activa</span></div>
        <button onclick="verPlan(${i})" style="margin-top:12px;background:var(--green-mid);border:none;color:#fff;padding:8px 14px;border-radius:8px;font-size:12.5px;cursor:pointer;width:100%;font-weight:600;">📅 Plan de cultivo</button>
        <button onclick="removeFinca(${i})" style="margin-top:8px;background:none;border:1px solid rgba(239,83,80,0.3);color:#ef5350;padding:6px 14px;border-radius:8px;font-size:12px;cursor:pointer;width:100%;">Eliminar finca</button>
      </div>
    </div>`).join('');
  const sel = document.getElementById('task-finca');
  sel.innerHTML = '<option value="General">General</option>' + fincas.map(f=>`<option>${f.nombre}</option>`).join('');
}

let editandoFinca = null;
function editarFinca(i) {
  editandoFinca = i;
  const f = fincas[i];
  openFincaModal();
  document.getElementById('finca-nombre').value = f.nombre;
  document.getElementById('finca-ubicacion').value = f.ubicacion;
  document.getElementById('finca-area').value = f.area;
  document.getElementById('finca-cultivo').value = f.cultivo;
  document.getElementById('ubi-status').textContent = '📍 Ubicación actual: ' + f.ubicacion + ' (elige de nuevo solo si quieres cambiarla)';
  document.getElementById('btn-guardar-finca').textContent = 'Guardar cambios';
  if (f.coords && fincaMap) setTimeout(()=>{ try { fincaMap.fitBounds(L.latLngBounds(f.coords).pad(0.4)); } catch(e){} }, 350);
}
function addFinca() {
  const n = document.getElementById('finca-nombre').value.trim();
  const u = document.getElementById('finca-ubicacion').value.trim();
  const a = document.getElementById('finca-area').value;
  const c = document.getElementById('finca-cultivo').value;
  if(!n||!u||!a) return toast('Completa el nombre, la ubicación (provincia/cantón/distrito) y dibuja el área en el mapa.', 'error');
  let coords = null, centro = null;
  if (drawnLayer) {
    coords = drawnLayer.getLatLngs()[0].map(p=>[p.lat, p.lng]);
    const cen = drawnLayer.getBounds().getCenter();
    centro = [cen.lat, cen.lng];
  }
  if (editandoFinca !== null) {
    const f = fincas[editandoFinca];
    Object.assign(f, {nombre:n, ubicacion:u, area:a, cultivo:c});
    if (coords) { f.coords = coords; f.centro = centro; }
    editandoFinca = null;
    toast('Finca actualizada. ✏️');
  } else {
    fincas.push({nombre:n, ubicacion:u, area:a, cultivo:c, coords, centro, fechaInicio: new Date().toISOString()});
    toast('¡Finca agregada! Ya estás recibiendo alertas del clima para ella. 🌱');
  }
  guardar();
  renderClimaFincas();
  pintarFincas();
  generarAlertas();
  document.getElementById('add-finca-modal').classList.remove('open');
  ['finca-nombre','finca-ubicacion','finca-area'].forEach(id=>document.getElementById(id).value='');
  ['sel-canton','sel-distrito'].forEach(id=>{const s=document.getElementById(id); s.innerHTML='<option value="">'+(id==='sel-canton'?'Cantón...':'Distrito...')+'</option>'; s.disabled=true;});
  document.getElementById('sel-provincia').value='';
  document.getElementById('ubi-status').textContent='';
  document.getElementById('btn-guardar-finca').textContent = 'Guardar Finca';
  editandoFinca = null;
  if(drawnGroup) drawnGroup.clearLayers();
  drawnLayer = null;
  renderFincas();
}
async function removeFinca(i) {
  if (!await confirmar('¿Eliminar "' + fincas[i].nombre + '"? Esta acción no se puede deshacer.')) return;
  fincas.splice(i,1);
  guardar();
  renderFincas();
  renderClimaFincas();
  pintarFincas();
  renderDashboard();
  toast('Finca eliminada.', 'info');
}

// ===== MAPA DE FINCA (Leaflet + Draw) =====
let fincaMap = null, drawnLayer = null, drawnGroup = null;
function initFincaMap() {
  if (fincaMap) { setTimeout(()=>fincaMap.invalidateSize(), 250); return; }
  fincaMap = L.map('finca-map').setView([9.7489, -83.7534], 8); // Costa Rica
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {attribution: '© OpenStreetMap © CARTO', subdomains: 'abcd', maxZoom: 20}).addTo(fincaMap);
  drawnGroup = new L.FeatureGroup();
  fincaMap.addLayer(drawnGroup);
  // Textos en español para las guías de dibujo
  L.drawLocal.draw.handlers.polygon.tooltip = {
    start: 'Toque el mapa para empezar a dibujar su terreno',
    cont: 'Toque para continuar el contorno',
    end: 'Toque el primer punto para cerrar el área'
  };
  L.drawLocal.draw.handlers.polyline = L.drawLocal.draw.handlers.polyline || {};
  L.drawLocal.draw.toolbar.actions = {title:'Cancelar dibujo', text:'Cancelar'};
  L.drawLocal.draw.toolbar.finish = {title:'Terminar dibujo', text:'Terminar'};
  L.drawLocal.draw.toolbar.undo = {title:'Borrar último punto', text:'Borrar último punto'};
  fincaMap.on(L.Draw.Event.CREATED, e => {
    drawnGroup.clearLayers();
    drawnLayer = e.layer;
    drawnGroup.addLayer(drawnLayer);
    calcularArea();
    document.getElementById('btn-dibujar').textContent = '✏️ Dibujar de nuevo';
  });
  setTimeout(()=>fincaMap.invalidateSize(), 250);
}
let dibujoActivo = null;
function empezarDibujo() {
  if (!fincaMap) return;
  if (dibujoActivo) dibujoActivo.disable();
  dibujoActivo = new L.Draw.Polygon(fincaMap, {
    allowIntersection: false,
    shapeOptions: {color:'#2d6a4f', fillColor:'#52b788', fillOpacity:0.35}
  });
  dibujoActivo.enable();
}
function borrarDibujo() {
  if (dibujoActivo) { dibujoActivo.disable(); dibujoActivo = null; }
  if (drawnGroup) drawnGroup.clearLayers();
  drawnLayer = null;
  document.getElementById('finca-area').value = '';
  document.getElementById('btn-dibujar').textContent = '⬠ Dibujar terreno';
}
function calcularArea() {
  if(!drawnLayer) return;
  const latlngs = drawnLayer.getLatLngs()[0];
  const m2 = L.GeometryUtil.geodesicArea(latlngs);
  const ha = (m2 / 10000).toFixed(2);
  document.getElementById('finca-area').value = ha;
}
function openFincaModal() {
  document.getElementById('add-finca-modal').classList.add('open');
  setTimeout(initFincaMap, 100);
  cargarProvincias();
}

// ===== MAPA GENERAL DE FINCAS =====
let mapaGeneral = null, capaFincas = null;
function initMapaGeneral() {
  if (!mapaGeneral) {
    mapaGeneral = L.map('mapa-general').setView([9.7489, -83.7534], 8);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO', subdomains: 'abcd', maxZoom: 20
    }).addTo(mapaGeneral);
    capaFincas = L.featureGroup().addTo(mapaGeneral);
  }
  setTimeout(()=>{ mapaGeneral.invalidateSize(); pintarFincas(); }, 200);
}
function pintarFincas() {
  if (!capaFincas) return;
  capaFincas.clearLayers();
  let hayPoligonos = false;
  fincas.forEach(f => {
    if (f.coords && f.coords.length) {
      hayPoligonos = true;
      L.polygon(f.coords, {color:'#2d6a4f', fillColor:'#52b788', fillOpacity:0.35})
        .bindPopup(`<b>${f.nombre}</b><br>${f.cultivo} · ${f.area} ha<br>📍 ${f.ubicacion}`)
        .addTo(capaFincas);
    } else if (f.centro) {
      L.marker(f.centro).bindPopup(`<b>${f.nombre}</b><br>${f.cultivo} · ${f.area} ha`).addTo(capaFincas);
    }
  });
  if (hayPoligonos || capaFincas.getLayers().length) {
    try { mapaGeneral.fitBounds(capaFincas.getBounds().pad(0.3)); } catch(e){}
  }
}

// ===== BITÁCORA CON FOTOS =====
let bitacora = [];
function fotoBitacora(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    const escala = Math.min(1, 800 / img.width);
    const cv = document.createElement('canvas');
    cv.width = Math.round(img.width * escala);
    cv.height = Math.round(img.height * escala);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    input.dataset.foto = cv.toDataURL('image/jpeg', 0.68);
    document.getElementById('bita-foto-ok').textContent = '✅ Foto lista';
  };
  img.src = URL.createObjectURL(file);
}
function addBitacora() {
  const inputF = document.getElementById('bita-foto');
  const foto = inputF.dataset.foto;
  const nota = document.getElementById('bita-nota').value.trim();
  const finca = document.getElementById('bita-finca').value;
  if (!foto) return toast('Toma o elige una foto del cultivo primero.', 'error');
  bitacora.unshift({ foto, nota, finca, fecha: new Date().toISOString() });
  if (bitacora.length > 60) bitacora.pop();
  inputF.value = ''; delete inputF.dataset.foto;
  document.getElementById('bita-foto-ok').textContent = '';
  document.getElementById('bita-nota').value = '';
  guardar();
  renderBitacora();
  toast('Foto agregada a la bitácora. 📸');
}
async function delBitacora(i) {
  if (!await confirmar('¿Eliminar esta foto de la bitácora?')) return;
  bitacora.splice(i, 1);
  guardar();
  renderBitacora();
}
function renderBitacora() {
  const selF = document.getElementById('bita-finca');
  if (selF) selF.innerHTML = '<option>General</option>' + fincas.map(f => `<option>${f.nombre}</option>`).join('');
  const g = document.getElementById('bitacora-linea');
  if (!g) return;
  g.innerHTML = bitacora.length ? bitacora.map((b, i) => {
    const f = new Date(b.fecha).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' });
    return `<div class="bita-item">
      <img src="${b.foto}" alt="Bitácora" loading="lazy">
      <div class="info"><b>🌾 ${b.finca}</b><small>${f}</small>${b.nota ? `<p>${b.nota}</p>` : ''}</div>
      <button class="bita-borrar" onclick="delBitacora(${i})">Eliminar</button>
    </div>`;
  }).join('') : '<div class="vacio" style="grid-column:1/-1"><div class="ic">📸</div><h4>Bitácora vacía</h4><p>Sube fotos de tu cultivo con fecha y nota para ver su evolución en el tiempo.</p></div>';
}

// ===== COMPARAR FINCAS =====
function renderComparar() {
  const cont = document.getElementById('comparar-cont');
  if (!cont) return;
  if (fincas.length < 1) { cont.innerHTML = '<p style="color:var(--text-light);font-size:14px;">Agrega fincas y registra cosechas/ventas para compararlas aquí.</p>'; return; }
  const datos = fincas.map(f => {
    const kg = registros.filter(r => r.tipo === 'cosecha' && r.finca === f.nombre).reduce((s, r) => s + r.monto, 0);
    const ventas = registros.filter(r => r.tipo === 'venta' && r.finca === f.nombre).reduce((s, r) => s + r.monto, 0);
    const gastos = registros.filter(r => r.tipo === 'gasto' && r.finca === f.nombre).reduce((s, r) => s + r.monto, 0);
    const ha = parseFloat(f.area) || 0;
    return { nombre: f.nombre, cultivo: f.cultivo, ha, kg, ventas, gastos, ganancia: ventas - gastos, rend: ha > 0 ? kg / ha : 0 };
  });
  const max = (k) => Math.max(...datos.map(d => d[k]));
  const maxGan = max('ganancia'), maxRend = max('rend'), maxKg = max('kg');
  cont.innerHTML = `<table class="comparar-tabla">
    <tr><th>Finca</th><th>Cultivo</th><th>Área</th><th>Cosecha</th><th>Rendimiento</th><th>Ganancia</th></tr>
    ${datos.map(d => `<tr>
      <td><b>${d.nombre}</b></td><td>${d.cultivo}</td><td>${d.ha} ha</td>
      <td class="${d.kg===maxKg&&d.kg>0?'mejor':''}">${d.kg.toLocaleString('es-CR')} kg</td>
      <td class="${d.rend===maxRend&&d.rend>0?'mejor':''}">${Math.round(d.rend).toLocaleString('es-CR')} kg/ha</td>
      <td class="${d.ganancia===maxGan&&d.ganancia>0?'mejor':''}">${fmtColones(d.ganancia)}</td>
    </tr>`).join('')}
  </table>
  <p style="font-size:12px;color:var(--text-light);margin-top:10px;font-family:'Space Mono',monospace;">🟢 = mejor finca en cada categoría</p>`;
}

// ===== UBICACION: PROVINCIA / CANTON / DISTRITO =====
const UBI_API = 'https://ubicaciones.paginasweb.cr';
let ubiCargado = false;
let ubiSel = { prov:'', canton:'', distrito:'', provId:'', cantonId:'' };

async function cargarProvincias() {
  if (ubiCargado) return;
  const st = document.getElementById('ubi-status');
  try {
    st.textContent = 'Cargando provincias...';
    const r = await fetch(UBI_API + '/provincias.json');
    const d = await r.json();
    const sel = document.getElementById('sel-provincia');
    sel.innerHTML = '<option value="">Provincia...</option>' +
      Object.entries(d).map(([id,n]) => `<option value="${id}">${n}</option>`).join('');
    ubiCargado = true;
    st.textContent = '';
  } catch(e) {
    st.textContent = '⚠️ No se pudieron cargar las provincias. Verifique su conexión.';
  }
}

async function onProvincia() {
  const sel = document.getElementById('sel-provincia');
  const id = sel.value;
  const cantonSel = document.getElementById('sel-canton');
  const distSel = document.getElementById('sel-distrito');
  cantonSel.innerHTML = '<option value="">Cantón...</option>'; cantonSel.disabled = true;
  distSel.innerHTML = '<option value="">Distrito...</option>'; distSel.disabled = true;
  if (!id) return;
  ubiSel.provId = id;
  ubiSel.prov = sel.options[sel.selectedIndex].text;
  ubicarEnMapa(ubiSel.prov + ', Costa Rica', 9);
  const st = document.getElementById('ubi-status');
  try {
    st.textContent = 'Cargando cantones...';
    const r = await fetch(`${UBI_API}/provincia/${id}/cantones.json`);
    const d = await r.json();
    cantonSel.innerHTML = '<option value="">Cantón...</option>' +
      Object.entries(d).map(([cid,n]) => `<option value="${cid}">${n}</option>`).join('');
    cantonSel.disabled = false;
    st.textContent = '';
  } catch(e) { st.textContent = '⚠️ Error cargando cantones.'; }
}

async function onCanton() {
  const sel = document.getElementById('sel-canton');
  const id = sel.value;
  const distSel = document.getElementById('sel-distrito');
  distSel.innerHTML = '<option value="">Distrito...</option>'; distSel.disabled = true;
  if (!id) return;
  ubiSel.cantonId = id;
  ubiSel.canton = sel.options[sel.selectedIndex].text;
  ubicarEnMapa(`${ubiSel.canton}, ${ubiSel.prov}, Costa Rica`, 12);
  const st = document.getElementById('ubi-status');
  try {
    st.textContent = 'Cargando distritos...';
    const r = await fetch(`${UBI_API}/provincia/${ubiSel.provId}/canton/${id}/distritos.json`);
    const d = await r.json();
    distSel.innerHTML = '<option value="">Distrito...</option>' +
      Object.entries(d).map(([did,n]) => `<option value="${did}">${n}</option>`).join('');
    distSel.disabled = false;
    st.textContent = '';
  } catch(e) { st.textContent = '⚠️ Error cargando distritos.'; }
}

function onDistrito() {
  const sel = document.getElementById('sel-distrito');
  if (!sel.value) return;
  ubiSel.distrito = sel.options[sel.selectedIndex].text;
  const ubicacion = `${ubiSel.distrito}, ${ubiSel.canton}, ${ubiSel.prov}`;
  document.getElementById('finca-ubicacion').value = ubicacion;
  ubicarEnMapa(ubicacion + ', Costa Rica', 14);
}

async function ubicarEnMapa(query, zoom) {
  const st = document.getElementById('ubi-status');
  try {
    st.textContent = '🔎 Ubicando en el mapa...';
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=cr&q=${encodeURIComponent(query)}`);
    const d = await r.json();
    if (d && d.length && fincaMap) {
      fincaMap.setView([parseFloat(d[0].lat), parseFloat(d[0].lon)], zoom);
      st.textContent = '✅ ' + query.replace(', Costa Rica','') + ' — ahora dibuje el área de su terreno';
    } else if (d && d.length === 0) {
      // Fallback con Open-Meteo geocoding
      const r2 = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.split(',')[0])}&count=1&language=es&format=json`);
      const d2 = await r2.json();
      if (d2.results && d2.results.length && fincaMap) {
        fincaMap.setView([d2.results[0].latitude, d2.results[0].longitude], zoom);
        st.textContent = '✅ Ubicado — ahora dibuje el área de su terreno';
      } else {
        st.textContent = '⚠️ No se encontró la ubicación exacta. Navegue manualmente en el mapa.';
      }
    }
  } catch(e) {
    st.textContent = '⚠️ Error de conexión al ubicar.';
  }
}


// ── Toggle mapa oscuro ↔ satélite ──────────────────────────────
function toggleMapMode() {
  if (!window.mapaGeneral) return;
  if (window._mapMode === 'dark') {
    window._mapMode = 'satellite';
    window._cartoTile.remove();
    window._satelliteTile.addTo(window.mapaGeneral);
    const btn = document.getElementById('btn-toggle-map');
    if (btn) { btn.textContent = '🗺️ Vista oscura'; btn.style.background = 'rgba(34,197,94,0.15)'; }
  } else {
    window._mapMode = 'dark';
    window._satelliteTile.remove();
    window._cartoTile.addTo(window.mapaGeneral);
    const btn = document.getElementById('btn-toggle-map');
    if (btn) { btn.textContent = '🛰️ Vista satélite'; btn.style.background = 'rgba(12,24,16,0.9)'; }
  }
}
