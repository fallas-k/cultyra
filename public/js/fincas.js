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

  fincaMap = L.map('finca-map', { zoomControl: false }).setView([9.7489, -83.7534], 8);

  // Capas base
  const satelite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '© Esri Satellite', maxZoom: 20
  });
  const hibrido = L.layerGroup([
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom:20 }),
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { opacity: 0.35, maxZoom:19 })
  ]);
  const calles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap', maxZoom: 19
  });
  satelite.addTo(fincaMap);

  // Controles
  L.control.zoom({ position: 'topright' }).addTo(fincaMap);
  L.control.layers(
    { '🛰️ Satélite': satelite, '🛰️+🗺️ Híbrido': hibrido, '🗺️ Calles': calles },
    {}, { position: 'topright', collapsed: false }
  ).addTo(fincaMap);

  // GPS — centrar en ubicación actual
  if (L.control.locate) {
    L.control.locate({
      position: 'topright',
      strings: { title: 'Mi ubicación' },
      flyTo: true,
      showPopup: false,
      locateOptions: { maxZoom: 16 }
    }).addTo(fincaMap);
  }

  // Grupo de dibujo
  drawnGroup = new L.FeatureGroup();
  fincaMap.addLayer(drawnGroup);

  // Control de dibujo visual con barra de herramientas
  const drawControl = new L.Control.Draw({
    position: 'topleft',
    draw: {
      polygon: { allowIntersection: false, showArea: true, shapeOptions: { color:'#34c759', fillColor:'#34c759', fillOpacity:0.2, weight:2.5 } },
      polyline: false, rectangle: false, circle: false, marker: false, circlemarker: false
    },
    edit: { featureGroup: drawnGroup, remove: true }
  });
  fincaMap.addControl(drawControl);

  // Tooltips en español
  L.drawLocal.draw.handlers.polygon.tooltip = {
    start: '📍 Toque para empezar a dibujar su terreno',
    cont: '📍 Toque para continuar el contorno',
    end: '✅ Toque el primer punto para cerrar el área'
  };
  L.drawLocal.draw.toolbar.actions = { title:'Cancelar', text:'Cancelar' };
  L.drawLocal.draw.toolbar.finish  = { title:'Terminar', text:'Terminar' };
  L.drawLocal.draw.toolbar.undo    = { title:'Borrar último punto', text:'Deshacer' };
  L.drawLocal.edit.toolbar.actions.save   = { title:'Guardar cambios', text:'Guardar' };
  L.drawLocal.edit.toolbar.actions.cancel = { title:'Cancelar', text:'Cancelar' };
  L.drawLocal.edit.toolbar.actions.clearAll = { title:'Borrar todo', text:'Borrar todo' };

  fincaMap.on(L.Draw.Event.CREATED, e => {
    drawnGroup.clearLayers();
    drawnLayer = e.layer;
    drawnGroup.addLayer(drawnLayer);
    calcularArea();
    document.getElementById('btn-dibujar').textContent = '✏️ Redibujar terreno';
  });
  fincaMap.on(L.Draw.Event.EDITED, () => calcularArea());
  fincaMap.on(L.Draw.Event.DELETED, () => {
    drawnLayer = null;
    document.getElementById('finca-area').value = '';
  });

  // Búsqueda por coordenadas (simple, sin API externa)
  const searchCtrl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd() {
      const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      div.style.cssText = 'background:#1b3a1f;padding:4px 8px;border:1px solid rgba(52,199,89,0.3)';
      div.innerHTML = '<input id="map-coord-search" placeholder="Lat, Lng (ej: 9.748,-83.75)" style="background:transparent;border:none;color:#c8f0c8;font-size:12px;width:180px;outline:none" />';
      L.DomEvent.disableClickPropagation(div);
      div.querySelector('input').addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        const [lat, lng] = e.target.value.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) { fincaMap.setView([lat, lng], 16); toast('Mapa centrado en ' + lat + ', ' + lng); }
        else toast('Escribe coordenadas válidas (lat, lng)', 'error');
      });
      return div;
    }
  });
  fincaMap.addControl(new searchCtrl());

  setTimeout(()=>fincaMap.invalidateSize(), 300);
}
let dibujoActivo = null;
function empezarDibujo() {
  if (!fincaMap) return;
  // Activar la herramienta de polígono del DrawControl
  fincaMap.eachLayer(l => { if (l._toolbars) Object.values(l._toolbars).forEach(t => t && t.disable && t.disable()); });
  new L.Draw.Polygon(fincaMap, {
    allowIntersection: false,
    shapeOptions: { color:'#34c759', fillColor:'#34c759', fillOpacity:0.2, weight:2.5 }
  }).enable();
}
function borrarDibujo() {
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
  toast(`📐 Área calculada: ${ha} hectáreas`);
}
function openFincaModal() {
  document.getElementById('add-finca-modal').classList.add('open');
  setTimeout(initFincaMap, 150);
  cargarProvincias();
}

// ===== MAPA GENERAL DE FINCAS (Mi Cultivo) =====
let mapaGeneral = null, capaFincas = null;
function initMapaGeneral() {
  if (!mapaGeneral) {
    mapaGeneral = L.map('mapa-general', { zoomControl: false }).setView([9.7489, -83.7534], 8);

    const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri Satellite', maxZoom: 20
    });
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19
    });
    sat.addTo(mapaGeneral);

    L.control.zoom({ position: 'topright' }).addTo(mapaGeneral);
    L.control.layers({ '🛰️ Satélite': sat, '🗺️ Calles': osm }, {}, { position: 'topright', collapsed: false }).addTo(mapaGeneral);

    // GPS en el mapa general también
    if (L.control.locate) {
      L.control.locate({
        position: 'topright',
        strings: { title: 'Mi ubicación' },
        flyTo: true, showPopup: false,
        locateOptions: { maxZoom: 16 }
      }).addTo(mapaGeneral);
    }

    capaFincas = L.featureGroup().addTo(mapaGeneral);
  }
  setTimeout(()=>{ mapaGeneral.invalidateSize(); pintarFincas(); }, 250);
}
function pintarFincas() {
  if (!capaFincas) return;
  capaFincas.clearLayers();
  let hayPoligonos = false;
  const colores = ['#34c759','#30d158','#32ade6','#ffd60a','#ff9f0a','#ff6961'];
  fincas.forEach((f, idx) => {
    const color = colores[idx % colores.length];
    const pendF = tareasEmpleado.filter(t => !t.done && tasks.concat([]).some(tt => !tt.done && tt.finca === f.nombre)).length +
                  tasks.filter(t => !t.done && t.finca === f.nombre).length;
    const popup = `
      <div style="min-width:160px;font-family:'DM Sans',sans-serif">
        <div style="font-weight:700;font-size:14px;margin-bottom:4px">🌾 ${f.nombre}</div>
        <div style="font-size:12px;color:#555;margin-bottom:6px">📍 ${f.ubicacion||''}</div>
        <div style="display:flex;gap:8px;font-size:12px">
          <span style="background:#e8f5e9;color:#1b5e20;padding:2px 8px;border-radius:99px">🌱 ${f.cultivo}</span>
          <span style="background:#e3f2fd;color:#0d47a1;padding:2px 8px;border-radius:99px">📐 ${f.area} ha</span>
        </div>
        ${pendF ? `<div style="margin-top:6px;font-size:11px;color:#e65100">⚠️ ${pendF} tarea(s) pendiente(s)</div>` : ''}
      </div>`;
    if (f.coords && f.coords.length) {
      hayPoligonos = true;
      L.polygon(f.coords, {color, fillColor: color, fillOpacity: 0.22, weight: 2.5})
        .bindPopup(popup).addTo(capaFincas);
    } else if (f.centro) {
      const icon = L.divIcon({html:`<div style="background:${color};border:2px solid #fff;border-radius:50%;width:14px;height:14px;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`, iconSize:[14,14], className:''});
      L.marker(f.centro, {icon}).bindPopup(popup).addTo(capaFincas);
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

// ===== BÚSQUEDA EN MAPA (Nominatim geocoding) =====
async function buscarEnMapa() {
  const q = document.getElementById('map-search-input')?.value?.trim();
  if (!q) return;
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ' Costa Rica')}&format=json&limit=1`);
    const d = await r.json();
    if (!d.length) return toast('No se encontró ese lugar. Intenta con otro nombre.', 'error');
    const lat = parseFloat(d[0].lat), lon = parseFloat(d[0].lon);
    if (!mapaGeneral) initMapaGeneral();
    mapaGeneral.setView([lat, lon], 14);
    L.popup().setLatLng([lat, lon]).setContent(`📍 ${d[0].display_name.split(',').slice(0,3).join(', ')}`).openOn(mapaGeneral);
  } catch(e) { toast('Error al buscar. Verifica tu conexión.', 'error'); }
}

async function buscarEnMapaFinca() {
  const q = document.getElementById('finca-map-search')?.value?.trim();
  if (!q) return;
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ' Costa Rica')}&format=json&limit=1`);
    const d = await r.json();
    if (!d.length) return toast('No se encontró ese lugar.', 'error');
    const lat = parseFloat(d[0].lat), lon = parseFloat(d[0].lon);
    if (fincaMap) fincaMap.setView([lat, lon], 15);
  } catch(e) { toast('Error al buscar.', 'error'); }
}

function centrarEnMiUbicacion() {
  if (!navigator.geolocation) return toast('Geolocalización no disponible.', 'error');
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude: lat, longitude: lon } = pos.coords;
    if (!mapaGeneral) initMapaGeneral();
    mapaGeneral.setView([lat, lon], 15);
    L.circle([lat, lon], {radius: 30, color:'#34c759', fillColor:'#34c759', fillOpacity:0.3}).addTo(mapaGeneral);
  }, () => toast('No se pudo obtener tu ubicación.', 'error'));
}

function centrarFincaEnUbicacion() {
  if (!navigator.geolocation) return toast('Geolocalización no disponible.', 'error');
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude: lat, longitude: lon } = pos.coords;
    if (fincaMap) {
      fincaMap.setView([lat, lon], 16);
      L.circle([lat, lon], {radius: 20, color:'#34c759', fillColor:'#34c759', fillOpacity:0.4}).addTo(fincaMap);
    }
  }, () => toast('No se pudo obtener tu ubicación.', 'error'));
}
