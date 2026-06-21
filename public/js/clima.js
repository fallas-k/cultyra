// ============================================================
// CULTYRA · CLIMA
// ============================================================

// ===== ALERTAS INTELIGENTES (clima × cultivo) =====
let alertas = [];
const CULTIVOS_FRIO_SENSIBLES = ['Papa','Fresa','Mora','Arándano','Tomate','Frijol','Hortalizas de hoja','Cebolla','Zanahoria'];
async function generarAlertas() {
  alertas = [];
  const conCoords = fincas.filter(f => f.centro);
  for (const f of conCoords.slice(0, 4)) {
    try {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${f.centro[0]}&longitude=${f.centro[1]}&hourly=temperature_2m,precipitation_probability,wind_speed_10m&forecast_days=1&timezone=auto`);
      const d = await r.json();
      const temps = d.hourly.temperature_2m, probs = d.hourly.precipitation_probability, vientos = d.hourly.wind_speed_10m;
      const minT = Math.min(...temps), maxProb = Math.max(...probs), maxV = Math.max(...vientos), maxT = Math.max(...temps);
      if (minT <= 4 && CULTIVOS_FRIO_SENSIBLES.includes(f.cultivo))
        alertas.push({tipo:'roja', icon:'❄️', text:`Riesgo de helada en ${f.nombre} (mín. ${Math.round(minT)}°C hoy). Su cultivo de ${f.cultivo.toLowerCase()} es sensible: active riego por aspersión al amanecer o use coberturas.`});
      else if (minT <= 2)
        alertas.push({tipo:'roja', icon:'❄️', text:`Posible helada en ${f.nombre} (mín. ${Math.round(minT)}°C). Tome precauciones.`});
      if (maxProb >= 70)
        alertas.push({tipo:'amarilla', icon:'🌧️', text:`Lluvia muy probable (${maxProb}%) hoy en ${f.nombre}: evite fumigar y fertilizar al voleo.`});
      if (maxV >= 40)
        alertas.push({tipo:'amarilla', icon:'💨', text:`Vientos fuertes (hasta ${Math.round(maxV)} km/h) en ${f.nombre}: revise tutores e invernaderos.`});
      if (maxT >= 32)
        alertas.push({tipo:'amarilla', icon:'🌡️', text:`Calor alto (máx. ${Math.round(maxT)}°C) en ${f.nombre}: riegue temprano y vigile estrés hídrico.`});
    } catch(e) { /* sin conexión */ }
  }
  if (alertas.some(a => a.tipo === 'roja')) alertaCritica();
  if (!alertas.length && conCoords.length)
    alertas.push({tipo:'verde', icon:'✅', text:'Sin alertas climáticas para tus fincas en las próximas 24 horas. ¡Buen día para trabajar el campo!'});
  if (!conCoords.length)
    alertas.push({tipo:'verde', icon:'🗺️', text:'Agrega una finca dibujando su terreno en el mapa para recibir alertas climáticas personalizadas.'});
  renderAlertas();
}
function renderAlertas() {
  const box = document.getElementById('dash-alertas');
  if (box) box.innerHTML = alertas.map(a => `<div class="dash-alerta ${a.tipo}"><span style="font-size:20px">${a.icon}</span><span>${a.text}</span></div>`).join('');
}

// ===== CLIMA POR FINCA (chips) =====
function renderClimaFincas() {
  const box = document.getElementById('clima-fincas');
  if (!box) return;
  const conCoords = fincas.filter(f=>f.centro);
  box.innerHTML = conCoords.map((f)=>`<button onclick="cargarClima(${f.centro[0]},${f.centro[1]},'${f.nombre.replace(/'/g,"\\'")} (${f.ubicacion.split(',')[0]})')">🌾 ${f.nombre}</button>`).join('');
}

// ===== HISTORIAL ÚLTIMOS 7 DÍAS =====
async function cargarHistorial(lat, lon) {
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&past_days=7&forecast_days=1&timezone=auto`);
    const d = await r.json();
    const dias = d.daily.time.slice(0,7), lluvia = d.daily.precipitation_sum.slice(0,7);
    const tmax = d.daily.temperature_2m_max.slice(0,7), tmin = d.daily.temperature_2m_min.slice(0,7);
    const maxLluvia = Math.max(...lluvia, 1);
    document.getElementById('hist-grid').innerHTML = dias.map((t,i)=>{
      const fecha = new Date(t + 'T12:00');
      const nombre = fecha.toLocaleDateString('es-CR', {weekday:'short', day:'numeric'});
      const h = Math.max(3, Math.round((lluvia[i]/maxLluvia)*100));
      return `<div class="hist-dia">
        <div class="hist-bar-wrap"><div class="hist-bar" style="height:${h}%"></div></div>
        <div class="mm">${lluvia[i].toFixed(1)} mm</div>
        <div class="temps">${Math.round(tmax[i])}° / ${Math.round(tmin[i])}°</div>
        <div class="nombre">${nombre}</div>
      </div>`;
    }).join('');
    document.getElementById('hist-card').style.display = 'block';
  } catch(e) { /* sin conexión */ }
}

// ===== ALERTAS CRÍTICAS: sonido + vibración =====
function alertaCritica() {
  if (navigator.vibrate) { try { navigator.vibrate([200, 100, 200]); } catch (e) {} }
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine'; o.frequency.value = 660;
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    o.start(); o.stop(ctx.currentTime + 0.5);
  } catch (e) {}
}

// ===== CLIMA (Open-Meteo) =====
const WMO = {
  0:['☀️','Despejado'],1:['🌤️','Mayormente despejado'],2:['⛅','Parcialmente nublado'],3:['☁️','Nublado'],
  45:['🌫️','Neblina'],48:['🌫️','Neblina con escarcha'],51:['🌦️','Llovizna ligera'],53:['🌦️','Llovizna'],
  55:['🌧️','Llovizna intensa'],61:['🌧️','Lluvia ligera'],63:['🌧️','Lluvia moderada'],65:['🌧️','Lluvia fuerte'],
  66:['🌧️','Lluvia helada'],67:['🌧️','Lluvia helada fuerte'],71:['🌨️','Nieve ligera'],73:['🌨️','Nieve'],
  75:['❄️','Nieve fuerte'],80:['🌦️','Chubascos ligeros'],81:['🌧️','Chubascos'],82:['⛈️','Chubascos fuertes'],
  95:['⛈️','Tormenta'],96:['⛈️','Tormenta con granizo'],99:['⛈️','Tormenta fuerte con granizo']
};
function wmoInfo(code){ return WMO[code] || ['🌡️','—']; }

async function buscarLugar() {
  const q = document.getElementById('clima-input').value.trim();
  const box = document.getElementById('clima-results');
  if(!q) return;
  box.innerHTML = '<div class="clima-result-item">Buscando...</div>';
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=es&format=json`);
    const d = await r.json();
    if(!d.results || !d.results.length) { box.innerHTML = '<div class="clima-result-item">❌ No se encontró el lugar. Intenta con otro nombre.</div>'; return; }
    box.innerHTML = d.results.map(p =>
      `<div class="clima-result-item" onclick="cargarClima(${p.latitude},${p.longitude},'${(p.name+', '+(p.admin1||'')+', '+p.country).replace(/'/g,"\\'")}')">📍 <b>${p.name}</b> — ${p.admin1||''}, ${p.country}</div>`
    ).join('');
  } catch(e) {
    box.innerHTML = '<div class="clima-result-item">⚠️ Error de conexión. Intenta de nuevo.</div>';
  }
}

async function cargarClima(lat, lon, nombre) {
  document.getElementById('clima-results').innerHTML = '';
  const loading = document.getElementById('clima-loading');
  loading.style.display = 'block';
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation` +
      `&hourly=temperature_2m,precipitation_probability,weather_code&forecast_days=2&timezone=auto`;
    const r = await fetch(url);
    const d = await r.json();
    loading.style.display = 'none';

    // Actual
    const cur = d.current;
    const [emoji, desc] = wmoInfo(cur.weather_code);
    document.getElementById('cc-lugar').textContent = nombre;
    document.getElementById('cc-temp').textContent = Math.round(cur.temperature_2m) + '°C ' + emoji;
    document.getElementById('cc-desc').textContent = desc;
    document.getElementById('cc-hum').textContent = cur.relative_humidity_2m + '%';
    document.getElementById('cc-viento').textContent = Math.round(cur.wind_speed_10m) + ' km/h';
    document.getElementById('clima-current').classList.add('show');
    cargarHistorial(lat, lon);

    // Próximas 24 horas desde la hora actual
    const now = new Date();
    const horas = d.hourly.time.map((t,i)=>({t:new Date(t), temp:d.hourly.temperature_2m[i], prob:d.hourly.precipitation_probability[i], code:d.hourly.weather_code[i]}));
    const idx = horas.findIndex(h => h.t >= now) ;
    const start = Math.max(0, idx === -1 ? 0 : idx - 1);
    const next24 = horas.slice(start, start + 24);
    document.getElementById('cc-lluvia').textContent = (next24[0] ? next24[0].prob : 0) + '%';

    document.getElementById('horas-title').style.display = 'block';
    document.getElementById('horas-scroll').innerHTML = next24.map((h,i)=>{
      const [em] = wmoInfo(h.code);
      const hh = h.t.getHours().toString().padStart(2,'0') + ':00';
      return `<div class="hora-card ${i===0?'ahora':''}">
        <div class="h">${i===0?'AHORA':hh}</div>
        <div class="emoji">${em}</div>
        <div class="t">${Math.round(h.temp)}°</div>
        <div class="lluvia">💧 ${h.prob}%</div>
      </div>`;
    }).join('');
  } catch(e) {
    loading.style.display = 'none';
    toast('No se pudo cargar el clima. Revisa tu conexión.', 'error');
  }
}
