// ============================================================
// CULTYRA · DASHBOARD
// ============================================================

// ===== DASHBOARD =====
function renderDashboard() {
  const hoy = new Date();
  document.getElementById('dash-fecha').textContent = hoy.toLocaleDateString('es-CR', {weekday:'long', day:'numeric', month:'long', year:'numeric'});
  const hora = hoy.getHours();
  const saludo = hora < 12 ? '¡Buenos días' : hora < 18 ? '¡Buenas tardes' : '¡Buenas noches';
  const nombre = document.getElementById('nav-username').textContent || 'Agricultor';
  document.getElementById('dash-saludo-txt').textContent = `${saludo}, ${nombre}! 🌱`;

  // Fincas
  const totalHa = fincas.reduce((s,f)=>s + parseFloat(f.area||0), 0);
  animarNumero(document.getElementById('dash-num-fincas'), fincas.length);
  document.getElementById('dash-ha').textContent = totalHa.toFixed(1) + ' hectáreas en total';

  // Tareas pendientes (propias + del equipo)
  const misPend = tasks.filter(t=>!t.done);
  let equipoPend = tareasEmpleado.filter(t=>!t.done);
  if (rolActual === 'empleado') {
    const yo = (document.getElementById('nav-username').textContent || '').toLowerCase();
    const mias = equipoPend.filter(t => empleados[t.emp] && empleados[t.emp].nombre.toLowerCase().includes(yo));
    if (mias.length || empleados.some(e=>e.nombre.toLowerCase().includes(yo))) equipoPend = mias;
  }
  animarNumero(document.getElementById('dash-num-tareas'), misPend.length + equipoPend.length);
  const lista = [...misPend.slice(0,3).map(t=>'📌 ' + t.text), ...equipoPend.slice(0,2).map(t=>'👷 ' + t.text + (empleados[t.emp]? ' ('+empleados[t.emp].nombre.split(' ')[0]+')':''))];
  document.getElementById('dash-lista-tareas').innerHTML = lista.length ? lista.map(t=>`<li>${t}</li>`).join('') : '<li>Sin tareas pendientes 🎉</li>';

  // Equipo
  animarNumero(document.getElementById('dash-num-emp'), empleados.length);
  document.getElementById('dash-emp-sub').textContent = equipoPend.length + ' tarea(s) de campo pendientes';

  // Resumen semanal
  cargarResumenSemanal();

  // Clima de hoy (primera finca con coords, o San José)
  cargarClimaDash();
}
async function cargarResumenSemanal() {
  const el = document.getElementById('dash-resumen');
  if (!el) return;
  const hace7 = Date.now() - 7*86400000;
  const hechas = tasks.filter(t=>t.done).length + tareasEmpleado.filter(t=>t.done).length;
  const cosechado = registros.filter(r=>r.tipo==='cosecha' && new Date(r.fecha).getTime()>hace7).reduce((s,r)=>s+r.monto,0);
  let lluvia = null;
  const f = fincas.find(f=>f.centro);
  try {
    const lat = f ? f.centro[0] : 9.9281, lon = f ? f.centro[1] : -84.0907;
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum&past_days=7&forecast_days=1&timezone=auto`);
    const d = await r.json();
    lluvia = d.daily.precipitation_sum.slice(0,7).reduce((s,x)=>s+(x||0),0);
  } catch(e){}
  el.innerHTML = [
    lluvia !== null ? `🌧️ ${lluvia.toFixed(0)} mm de lluvia esta semana` : null,
    `✅ ${hechas} tarea(s) completadas en total`,
    cosechado ? `🌾 ${cosechado.toLocaleString('es-CR')} kg cosechados (7 días)` : '🌾 Sin cosechas anotadas esta semana',
  ].filter(Boolean).map(t=>`<li>${t}</li>`).join('');
}
async function cargarClimaDash() {
  const f = fincas.find(f=>f.centro);
  const lat = f ? f.centro[0] : 9.9281, lon = f ? f.centro[1] : -84.0907;
  const lugar = f ? f.nombre : 'San José';
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,precipitation_probability&hourly=precipitation&forecast_days=1&timezone=auto`);
    const d = await r.json();
    const [em, desc] = wmoInfo(d.current.weather_code);
    const temp = Math.round(d.current.temperature_2m);
    const lluvia24h = (d.hourly?.precipitation || []).slice(0,24).reduce((s,x)=>s+(x||0),0);
    document.getElementById('dash-clima-temp').textContent = temp + '°C ' + em;
    document.getElementById('dash-clima-sub').textContent = desc + ' · ' + lugar;

    // ─ Alertas climáticas automáticas ─
    const alertasEl = document.getElementById('dash-alertas');
    if (alertasEl) {
      const msgs = [];
      if (temp <= 10) msgs.push({ tipo:'roja', txt:`🥶 Alerta de frío: ${temp}°C en ${lugar}. Proteja sus cultivos de una posible helada.` });
      else if (temp <= 14) msgs.push({ tipo:'naranja', txt:`❄️ Temperatura baja: ${temp}°C. Riesgo de daño en cultivos sensibles.` });
      if (lluvia24h >= 30) msgs.push({ tipo:'roja', txt:`🌧️ Lluvia intensa prevista: ${lluvia24h.toFixed(0)} mm en las próximas 24 h. Revise drenajes.` });
      else if (lluvia24h >= 15) msgs.push({ tipo:'naranja', txt:`🌦️ Lluvia moderada prevista: ${lluvia24h.toFixed(0)} mm. Considere ajustar el riego.` });
      alertasEl.innerHTML = msgs.map(m =>
        `<div style="background:${m.tipo==='roja'?'rgba(220,38,38,0.12)':'rgba(234,179,8,0.12)'};border:1px solid ${m.tipo==='roja'?'rgba(220,38,38,0.35)':'rgba(234,179,8,0.35)'};border-radius:12px;padding:10px 14px;margin:6px 0;font-size:13px;color:var(--color-text-primary, #fff)">${m.txt}</div>`
      ).join('');
    }
  } catch(e) {
    document.getElementById('dash-clima-temp').textContent = '—';
    document.getElementById('dash-clima-sub').textContent = 'Sin conexión';
  }
}

// ===== NOTIFICACIONES DE ALERTAS =====
function pedirNotificaciones() {
  if (!('Notification' in window)) { toast('Tu navegador no soporta notificaciones.', 'error'); return; }
  Notification.requestPermission().then(p => {
    if (p === 'granted') {
      new Notification('🌱 Cultyra', { body: '¡Notificaciones activadas! Te avisaremos de heladas y lluvias fuertes en tus fincas.' });
      document.getElementById('btn-notif').style.display = 'none';
      notificarAlertas();
    }
  });
}
function notificarAlertas() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  alertas.filter(a => a.tipo !== 'verde').slice(0, 3).forEach(a => {
    try { new Notification('⚠️ Alerta Cultyra', { body: a.text }); } catch(e){}
  });
}

// ===== DATOS DE DEMOSTRACIÓN (un clic, sin afectar cuentas reales) =====
function cargarDemo() {
  fincas = [
    {nombre:'Finca La Esperanza', ubicacion:'Oreamuno, Cartago', area:'8.5', cultivo:'Papa', centro:[9.929,-83.857], coords:[[9.932,-83.861],[9.932,-83.853],[9.926,-83.853],[9.926,-83.861]], fechaInicio:'2026-05-20T12:00:00.000Z'},
    {nombre:'Finca El Roble', ubicacion:'El Guarco, Cartago', area:'3.2', cultivo:'Fresa', centro:[9.797,-83.953], coords:[[9.799,-83.956],[9.799,-83.950],[9.795,-83.950],[9.795,-83.956]], fechaInicio:'2026-04-10T12:00:00.000Z'}
  ];
  empleados = [
    {nombre:'Carlos Mora', rol:'Capataz', tel:'+506 8888-1234'},
    {nombre:'María Jiménez', rol:'Riego y fumigación', tel:'+506 8765-4321'}
  ];
  tareasEmpleado = [
    {emp:0, text:'Supervisar cosecha de papa', done:false},
    {emp:1, text:'Fumigar lote norte con extracto de neem', done:false},
    {emp:0, text:'Revisar cercas del sector este', done:true}
  ];
  tasks = [
    {text:'Aplicar fertilizante orgánico', priority:'alta', finca:'Finca La Esperanza', done:false},
    {text:'Revisar drenajes tras la lluvia', priority:'media', finca:'General', done:false}
  ];
  registros = [
    {finca:'Finca La Esperanza', tipo:'cosecha', monto:2400, nota:'Cosecha de papa', fecha:new Date(Date.now()-12*86400000).toISOString()},
    {finca:'Finca La Esperanza', tipo:'venta', monto:780000, nota:'Venta en feria del agricultor', fecha:new Date(Date.now()-10*86400000).toISOString()},
    {finca:'Finca La Esperanza', tipo:'gasto', monto:185000, nota:'Fertilizante y semilla', fecha:new Date(Date.now()-30*86400000).toISOString()},
    {finca:'Finca El Roble', tipo:'cosecha', monto:640, nota:'Fresa', fecha:new Date(Date.now()-5*86400000).toISOString()},
    {finca:'Finca El Roble', tipo:'venta', monto:512000, nota:'Venta a supermercado local', fecha:new Date(Date.now()-4*86400000).toISOString()}
  ];
  guardar();
  recargarTodoUI();
  const f = fincas.find(f=>f.centro);
  if (f) cargarClima(f.centro[0], f.centro[1], f.nombre + ' (' + f.ubicacion.split(',')[0] + ')');
  generarAlertas();
  toast('Datos de demostración cargados. 🌱 (Puedes borrarlos cuando quieras.)');
}
