// ============================================================
// CULTYRA · REGISTROS
// ============================================================

// ===== REGISTROS: COSECHAS, VENTAS Y GASTOS =====
let registros = [];

// --- Helpers de API ---
async function apiRegistros(metodo, idReg, cuerpo) {
  if (!sesion || !sesion.uid) return null;
  try {
    const ruta = idReg ? `/api/registros/${idReg}` : '/api/registros';
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const r = await fetch(API_URL + ruta, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (await getToken()) },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      signal: ctrl.signal
    });
    clearTimeout(t);
    return r.ok ? r.json() : null;
  } catch (e) { return null; }
}

// Carga registros desde el servidor (reemplaza los de localStorage)
async function cargarRegistrosServidor() {
  const filas = await apiRegistros('GET', null, null);
  if (Array.isArray(filas)) {
    registros = filas.map(r => ({
      serverId: r.id,
      finca:    r.finca,
      tipo:     r.tipo,
      monto:    parseFloat(r.monto),
      nota:     r.nota || '',
      fecha:    r.fecha
    }));
    guardar();
    renderRegistros();
  }
}

async function addRegistro() {
  const finca = document.getElementById('reg-finca').value;
  const tipo = document.getElementById('reg-tipo').value;
  const monto = parseFloat(document.getElementById('reg-monto').value);
  const nota = document.getElementById('reg-nota').value.trim();
  if (!monto || monto <= 0) return toast('Escribe la cantidad (kilos o colones).', 'error');

  const nuevo = { finca, tipo, monto, nota, fecha: new Date().toISOString() };
  registros.unshift(nuevo);
  document.getElementById('reg-monto').value = '';
  document.getElementById('reg-nota').value = '';
  guardar();
  renderRegistros();

  // Intentar guardar en la base de datos SQL
  const guardado = await apiRegistros('POST', null, { finca, tipo, monto, nota, fecha: nuevo.fecha });
  if (guardado && guardado.id) {
    nuevo.serverId = guardado.id;
    guardar(); // actualizar localStorage con el serverId
  }
}

async function delRegistro(i) {
  const reg = registros[i];
  // Eliminar del servidor si tiene ID asignado
  if (reg && reg.serverId) {
    apiRegistros('DELETE', reg.serverId, null); // no esperamos (optimistic delete)
  }
  registros.splice(i, 1);
  guardar();
  renderRegistros();
}

async function editarRegistro(i) {
  const reg = registros[i];
  if (!reg) return;
  const nuevoMonto = parseFloat(prompt('Nuevo monto:', reg.monto));
  if (!nuevoMonto || nuevoMonto <= 0) return;
  const nuevaNota = prompt('Nueva nota (opcional):', reg.nota || '');
  reg.monto = nuevoMonto;
  reg.nota  = (nuevaNota || '').trim();
  guardar();
  renderRegistros();

  if (reg.serverId) {
    apiRegistros('PUT', reg.serverId, { monto: reg.monto, nota: reg.nota });
  }
}
let regFiltroMes = '', regFiltroTipo = '';

function filtrarRegistros(tipo, valor) {
  if (tipo === 'mes') regFiltroMes = valor;
  if (tipo === 'tipo') regFiltroTipo = valor;
  renderRegistros();
}

function renderRegistros() {
  // Selector de fincas
  const selF = document.getElementById('reg-finca');
  if (selF) selF.innerHTML = '<option>General</option>' + fincas.map(f=>`<option>${f.nombre}</option>`).join('');

  // Filtros UI
  const filtrosEl = document.getElementById('reg-filtros');
  if (filtrosEl && !filtrosEl.dataset.init) {
    filtrosEl.dataset.init = '1';
    const mesesOpts = Array.from({length:6},(_,i)=>{
      const d = new Date(); d.setMonth(d.getMonth()-i);
      const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const lbl = d.toLocaleDateString('es-CR',{month:'long',year:'numeric'});
      return `<option value="${val}">${lbl}</option>`;
    }).join('');
    filtrosEl.innerHTML = `
      <select onchange="filtrarRegistros('mes',this.value)" style="background:var(--bg-card,#1b3a1f);color:var(--text-main,#e0f0e4);border:1px solid rgba(52,199,89,0.3);border-radius:8px;padding:5px 10px;font-size:13px;cursor:pointer">
        <option value="">Todos los meses</option>${mesesOpts}
      </select>
      <select onchange="filtrarRegistros('tipo',this.value)" style="background:var(--bg-card,#1b3a1f);color:var(--text-main,#e0f0e4);border:1px solid rgba(52,199,89,0.3);border-radius:8px;padding:5px 10px;font-size:13px;cursor:pointer;margin-left:8px">
        <option value="">Todos los tipos</option>
        <option value="venta">💵 Ventas</option>
        <option value="gasto">🧾 Gastos</option>
        <option value="cosecha">🌾 Cosechas</option>
      </select>`;
  }

  // Aplicar filtros
  let regs = registros;
  if (regFiltroMes) regs = regs.filter(r => r.fecha && r.fecha.startsWith(regFiltroMes));
  if (regFiltroTipo) regs = regs.filter(r => r.tipo === regFiltroTipo);

  const ventas = regs.filter(r=>r.tipo==='venta').reduce((s,r)=>s+r.monto,0);
  const gastos = regs.filter(r=>r.tipo==='gasto').reduce((s,r)=>s+r.monto,0);
  const kilos = regs.filter(r=>r.tipo==='cosecha').reduce((s,r)=>s+r.monto,0);
  document.getElementById('kpi-ventas').textContent = fmtColones(ventas);
  document.getElementById('kpi-gastos').textContent = fmtColones(gastos);
  document.getElementById('kpi-ganancia').textContent = fmtColones(ventas - gastos);
  document.getElementById('kpi-kilos').textContent = kilos.toLocaleString('es-CR') + ' kg';

  // Gráfico últimos 6 meses: ventas vs gastos
  const meses = [];
  const ahora = new Date();
  for (let m = 5; m >= 0; m--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth()-m, 1);
    meses.push({ etiqueta: d.toLocaleDateString('es-CR',{month:'short'}), y: d.getFullYear(), m: d.getMonth(), in:0, out:0 });
  }
  registros.forEach(r => {
    const f = new Date(r.fecha);
    const mes = meses.find(x => x.y===f.getFullYear() && x.m===f.getMonth());
    if (mes) { if (r.tipo==='venta') mes.in += r.monto; if (r.tipo==='gasto') mes.out += r.monto; }
  });
  const maxV = Math.max(...meses.map(x=>Math.max(x.in,x.out)), 1);
  document.getElementById('reg-chart').innerHTML = meses.map(x => `
    <div style="flex:1">
      <div class="col">
        <div class="barra in" style="height:${Math.max(3,(x.in/maxV)*100)}%" title="Ventas: ${fmtColones(x.in)}"></div>
        <div class="barra out" style="height:${Math.max(3,(x.out/maxV)*100)}%" title="Gastos: ${fmtColones(x.out)}"></div>
      </div>
      <div class="reg-mes">${x.etiqueta}</div>
    </div>`).join('');

  renderRendimiento();

  // Lista
  const iconos = { cosecha:'🌾', venta:'💵', gasto:'🧾' };
  const list = document.getElementById('reg-lista');
  list.innerHTML = regs.length ? regs.slice(0, 30).map((r,i) => {
    const f = new Date(r.fecha).toLocaleDateString('es-CR',{day:'numeric',month:'short'});
    const esIn = r.tipo==='venta', esKg = r.tipo==='cosecha';
    const sync = r.serverId ? '<span title="Guardado en base de datos" style="font-size:10px;color:var(--accent-light,#69c564);margin-left:4px">☁️</span>' : '<span title="Solo local" style="font-size:10px;color:#aaa;margin-left:4px">💾</span>';
    return `<div class="reg-item">
      <span class="tipo">${iconos[r.tipo]}</span>
      <span class="det"><b>${r.tipo==='cosecha'?'Cosecha':r.tipo==='venta'?'Venta':'Gasto'}</b> · ${r.finca}${sync}<small>${f}${r.nota?' · '+r.nota:''}</small></span>
      <span class="monto ${esIn?'in':esKg?'':'out'}">${esKg ? r.monto.toLocaleString('es-CR')+' kg' : (esIn?'+':'−')+fmtColones(r.monto)}</span>
      <button onclick="editarRegistro(${i})" title="Editar" style="background:none;border:none;color:#66bb6a;cursor:pointer;font-size:15px;padding:0 4px">✏️</button>
      <button onclick="delRegistro(${i})" title="Eliminar" style="background:none;border:none;color:#ef5350;cursor:pointer;font-size:16px;">×</button>
    </div>`;
  }).join('') : `<div class="reg-item" style="justify-content:center;color:var(--text-light)">${(regFiltroMes||regFiltroTipo)?'Sin registros para el filtro seleccionado 🔍':'Sin registros todavía. Anota tu primera cosecha, venta o gasto. 👆'}</div>`;
}

// ===== RENDIMIENTO POR HECTÁREA =====
function renderRendimiento() {
  const box = document.getElementById('rend-lista');
  if (!box) return;
  const datos = fincas.map(f => {
    const kg = registros.filter(r => r.tipo === 'cosecha' && r.finca === f.nombre).reduce((s, r) => s + r.monto, 0);
    const ha = parseFloat(f.area) || 0;
    return { nombre: f.nombre, cultivo: f.cultivo, kg, ha, rend: ha > 0 ? kg / ha : 0 };
  }).filter(d => d.kg > 0);
  if (!datos.length) { box.innerHTML = '<p style="font-size:13px;color:var(--text-light);padding:8px 0;">Anota cosechas con el nombre de cada finca para comparar el rendimiento (kg/ha) entre tus terrenos.</p>'; return; }
  const maxR = Math.max(...datos.map(d => d.rend), 1);
  box.innerHTML = datos.map(d => `
    <div class="rend-fila">
      <span class="nom">${d.nombre}<br><small style="color:var(--text-light);font-size:11px">${d.cultivo} · ${d.ha} ha</small></span>
      <div class="barra-wrap"><div class="barra" style="width:${Math.max(4, (d.rend / maxR) * 100)}%"></div></div>
      <span class="dato">${Math.round(d.rend).toLocaleString('es-CR')} kg/ha</span>
    </div>`).join('');
}

// ===== REPORTE PDF =====
function generarReporte() {
  const hoy = new Date().toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' });
  const totalHa = fincas.reduce((s, f) => s + parseFloat(f.area || 0), 0);
  const ventas = registros.filter(r => r.tipo === 'venta').reduce((s, r) => s + r.monto, 0);
  const gastos = registros.filter(r => r.tipo === 'gasto').reduce((s, r) => s + r.monto, 0);
  const kilos = registros.filter(r => r.tipo === 'cosecha').reduce((s, r) => s + r.monto, 0);
  const pendientes = tasks.filter(t => !t.done).concat(tareasEmpleado.filter(t => !t.done));
  document.getElementById('reporte').innerHTML = `
    <h1>🌱 CULTYRA — Informe de la operación</h1>
    <p class="rep-meta">Generado el ${hoy} · ${document.getElementById('nav-username').textContent || 'Agricultor'} · ${fincas.length} finca(s) · ${totalHa.toFixed(1)} ha</p>
    <h2>Resumen financiero</h2>
    <div class="rep-kpis">
      <div><b>${kilos.toLocaleString('es-CR')} kg</b><br>Cosechado</div>
      <div><b>${fmtColones(ventas)}</b><br>Ventas</div>
      <div><b>${fmtColones(gastos)}</b><br>Gastos</div>
      <div><b>${fmtColones(ventas - gastos)}</b><br>Ganancia</div>
    </div>
    <h2>Fincas</h2>
    <table><tr><th>Finca</th><th>Ubicación</th><th>Cultivo</th><th>Área (ha)</th></tr>
      ${fincas.map(f => `<tr><td>${f.nombre}</td><td>${f.ubicacion}</td><td>${f.cultivo}</td><td>${f.area}</td></tr>`).join('') || '<tr><td colspan="4">Sin fincas registradas</td></tr>'}
    </table>
    <h2>Tareas pendientes (${pendientes.length})</h2>
    <table><tr><th>Tarea</th><th>Responsable</th></tr>
      ${tasks.filter(t => !t.done).map(t => `<tr><td>${t.text}</td><td>${document.getElementById('nav-username').textContent || 'Yo'}</td></tr>`).join('')}
      ${tareasEmpleado.filter(t => !t.done).map(t => `<tr><td>${t.text}</td><td>${empleados[t.emp] ? empleados[t.emp].nombre : '—'}</td></tr>`).join('')}
      ${!pendientes.length ? '<tr><td colspan="2">Sin tareas pendientes ✓</td></tr>' : ''}
    </table>
    <h2>Últimos registros</h2>
    <table><tr><th>Fecha</th><th>Tipo</th><th>Finca</th><th>Cantidad</th><th>Nota</th></tr>
      ${registros.slice(0, 15).map(r => {
        const f = new Date(r.fecha).toLocaleDateString('es-CR');
        const tipo = r.tipo === 'cosecha' ? 'Cosecha' : r.tipo === 'venta' ? 'Venta' : 'Gasto';
        const cant = r.tipo === 'cosecha' ? r.monto.toLocaleString('es-CR') + ' kg' : fmtColones(r.monto);
        return `<tr><td>${f}</td><td>${tipo}</td><td>${r.finca}</td><td>${cant}</td><td>${r.nota || ''}</td></tr>`;
      }).join('') || '<tr><td colspan="5">Sin registros</td></tr>'}
    </table>
    <p class="rep-meta" style="margin-top:14px">CULTYRA · Proyecto STEAM · CTP José Figueres Ferrer · Tecnología que cultiva el futuro</p>`;
  window.print();
}


const EMAIL_SOPORTE = 'soportecultyra@gmail.com';

// ===== REPORTE PDF DESCARGABLE (jsPDF) =====
function descargarReportePDF() {
  if (!window.jspdf) { generarReporte(); return; } // respaldo: impresión
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const hoy = new Date().toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' });
  const totalHa = fincas.reduce((s, f) => s + parseFloat(f.area || 0), 0);
  const ventas = registros.filter(r => r.tipo === 'venta').reduce((s, r) => s + r.monto, 0);
  const gastos = registros.filter(r => r.tipo === 'gasto').reduce((s, r) => s + r.monto, 0);
  const kilos = registros.filter(r => r.tipo === 'cosecha').reduce((s, r) => s + r.monto, 0);

  doc.setFillColor(26, 58, 31); doc.rect(0, 0, 210, 26, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.setFont(undefined, 'bold');
  doc.text('CULTYRA — Informe de la operacion', 14, 17);
  doc.setTextColor(60, 60, 60); doc.setFontSize(10); doc.setFont(undefined, 'normal');
  doc.text(`Generado: ${hoy}  ·  ${document.getElementById('nav-username').textContent || 'Agricultor'}  ·  ${fincas.length} finca(s)  ·  ${totalHa.toFixed(1)} ha`, 14, 34);

  doc.setFontSize(13); doc.setFont(undefined, 'bold'); doc.setTextColor(45, 106, 79);
  doc.text('Resumen financiero', 14, 46);
  doc.setFontSize(10); doc.setFont(undefined, 'normal'); doc.setTextColor(40, 40, 40);
  doc.text(`Cosechado: ${kilos.toLocaleString('es-CR')} kg`, 14, 54);
  doc.text(`Ventas: ${fmtColones(ventas)}`, 80, 54);
  doc.text(`Gastos: ${fmtColones(gastos)}`, 140, 54);
  doc.setFont(undefined, 'bold');
  doc.text(`Ganancia: ${fmtColones(ventas - gastos)}`, 14, 62);

  let y = 76;
  doc.setFontSize(13); doc.setFont(undefined, 'bold'); doc.setTextColor(45, 106, 79);
  doc.text('Fincas', 14, y); y += 8;
  doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(40, 40, 40);
  fincas.forEach(f => { doc.text(`• ${f.nombre} — ${f.ubicacion} — ${f.cultivo} — ${f.area} ha`, 16, y); y += 6; });
  if (!fincas.length) { doc.text('Sin fincas registradas', 16, y); y += 6; }

  y += 6;
  doc.setFontSize(13); doc.setFont(undefined, 'bold'); doc.setTextColor(45, 106, 79);
  doc.text('Tareas pendientes', 14, y); y += 8;
  doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(40, 40, 40);
  const pend = tasks.filter(t => !t.done);
  const pendE = tareasEmpleado.filter(t => !t.done);
  [...pend.map(t => '• ' + t.text), ...pendE.map(t => '• ' + t.text + (empleados[t.emp] ? ' (' + empleados[t.emp].nombre + ')' : ''))].forEach(t => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.text(t.substring(0, 90), 16, y); y += 6;
  });
  if (!pend.length && !pendE.length) { doc.text('Sin tareas pendientes', 16, y); y += 6; }

  y += 6;
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFontSize(13); doc.setFont(undefined, 'bold'); doc.setTextColor(45, 106, 79);
  doc.text('Ultimos registros', 14, y); y += 8;
  doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(40, 40, 40);
  registros.slice(0, 18).forEach(r => {
    if (y > 275) { doc.addPage(); y = 20; }
    const f = new Date(r.fecha).toLocaleDateString('es-CR');
    const tipo = r.tipo === 'cosecha' ? 'Cosecha' : r.tipo === 'venta' ? 'Venta' : 'Gasto';
    const cant = r.tipo === 'cosecha' ? r.monto.toLocaleString('es-CR') + ' kg' : fmtColones(r.monto);
    doc.text(`${f}  ·  ${tipo}  ·  ${r.finca}  ·  ${cant}`, 16, y); y += 6;
  });

  doc.setFontSize(8); doc.setTextColor(120, 120, 120);
  doc.text('CULTYRA · Proyecto STEAM · CTP Jose Figueres Ferrer · soportecultyra@gmail.com', 14, 290);
  doc.save('cultyra-informe.pdf');
  toast('Informe PDF descargado. 📄');
}
