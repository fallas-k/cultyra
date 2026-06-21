// ============================================================
// CULTYRA · TAREAS
// ============================================================

// ===== TASKS =====
let tasks = [];

function renderTasks() {
  const list = document.getElementById('tasks-list');
  if(!tasks.length) { list.innerHTML = '<p style="color:var(--text-light);text-align:center;padding:20px">No hay tareas pendientes.</p>'; return; }
  list.innerHTML = tasks.map((t,i) => `
    <div class="task-item ${t.done?'done':''}">
      <button class="task-check ${t.done?'checked':''}" onclick="toggleTask(${i})">${t.done?'✓':''}</button>
      <div style="flex:1;">
        <div class="task-text ${t.done?'done':''}">${t.text}</div>
        <div style="font-size:11px;color:var(--text-light);margin-top:3px;font-family:'Space Mono',monospace">📍 ${t.finca}</div>
        ${t.fecha ? `<div class="task-fecha ${(!t.done && new Date(t.fecha) < new Date(new Date().toDateString())) ? 'vencida' : ''}">📅 ${fechaRelativa(t.fecha)}</div>` : ''}
      </div>
      <span class="task-priority priority-${t.priority}">${t.priority.toUpperCase()}</span>
      <button class="task-delete" onclick="deleteTask(${i})">×</button>
    </div>`).join('');
}

function addTask() {
  const text = document.getElementById('task-input').value.trim();
  if(!text) return;
  const fecha = document.getElementById('task-fecha').value || null;
  tasks.unshift({text, priority: document.getElementById('task-priority').value, finca: document.getElementById('task-finca').value, fecha, done: false});
  guardar();
  document.getElementById('task-input').value = '';
  document.getElementById('task-fecha').value = '';
  renderTasks();
  renderDashboard();
}
function toggleTask(i) { tasks[i].done = !tasks[i].done; guardar(); renderTasks(); renderDashboard(); }
function deleteTask(i) { tasks.splice(i,1); guardar(); renderTasks(); renderDashboard(); }

// ===== PLAN DE CULTIVO (calendario automático) =====
const PLANES = {
  'Papa': [[0,'Preparación de suelo y desinfección de semilla'],[7,'Siembra'],[30,'Aporca y fertilización nitrogenada'],[45,'Prevención de tizón tardío (fungicida cúprico)'],[75,'Segundo monitoreo de plagas'],[100,'Defoliación'],[110,'Cosecha']],
  'Cebolla': [[0,'Preparación de almácigo'],[35,'Trasplante a campo'],[55,'Fertilización de crecimiento'],[80,'Control de trips y mildiú'],[110,'Suspender riego (curado)'],[125,'Cosecha y curado']],
  'Zanahoria': [[0,'Preparación de suelo profundo y suelto'],[5,'Siembra directa'],[25,'Raleo a 5 cm entre plantas'],[45,'Fertilización potásica'],[70,'Control de malezas'],[100,'Cosecha']],
  'Fresa': [[0,'Acolchado plástico y goteo'],[7,'Siembra de plantines'],[35,'Primera fertirrigación completa'],[60,'Poda sanitaria y control de ácaros'],[75,'Inicio de cosecha continua'],[180,'Renovación de plantas']],
  'Café de altura': [[0,'Hoyado y enmienda de siembra'],[15,'Siembra de almácigos'],[60,'Fertilización 18-5-15'],[120,'Control de roya y broca'],[240,'Poda de formación'],[330,'Preparación de cosecha']],
  'Aguacate Hass': [[0,'Hoyado con drenaje en laderas'],[10,'Siembra de injertos'],[45,'Fertilización con boro y zinc'],[90,'Control de Phytophthora'],[180,'Poda de formación'],[365,'Evaluación de primera floración']],
  '_default': [[0,'Preparación de suelo y análisis'],[7,'Siembra'],[30,'Primera fertilización'],[55,'Control de malezas'],[80,'Monitoreo de plagas y enfermedades'],[110,'Cosecha (ajustar según cultivo)']]
};
let planFincaActual = null;
async function cerrarModalFinca() {
  const algo = document.getElementById('finca-nombre').value.trim() || document.getElementById('finca-area').value || drawnLayer;
  if (algo) {
    if (!await confirmar('¿Cerrar sin guardar? Se perderán los datos que ingresaste.', '⚠️')) return;
  }
  document.getElementById('add-finca-modal').classList.remove('open');
  ['finca-nombre','finca-ubicacion','finca-area'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('btn-guardar-finca').textContent = 'Guardar Finca';
  editandoFinca = null;
  if (drawnGroup) drawnGroup.clearLayers();
  drawnLayer = null;
}

let planEtapas = [];
function borrarEtapaPlan(pi) {
  planEtapas.splice(pi, 1);
  pintarPlan();
}
function verPlan(i) {
  planFincaActual = i;
  const f = fincas[i];
  planEtapas = (PLANES[f.cultivo] || PLANES['_default']).map(e => [...e]);
  pintarPlan();
  document.getElementById('plan-modal').classList.add('open');
}
function pintarPlan() {
  const i = planFincaActual;
  const f = fincas[i];
  const plan = planEtapas;
  const inicio = f.fechaInicio ? new Date(f.fechaInicio) : new Date();
  document.getElementById('plan-titulo').textContent = '📅 Plan de cultivo — ' + f.nombre + ' (' + f.cultivo + ')';
  document.getElementById('plan-lista').innerHTML = plan.map(([dia, etapa], pi) => {
    const fecha = new Date(inicio.getTime() + dia*86400000);
    const fstr = fecha.toLocaleDateString('es-CR', {day:'numeric', month:'short'});
    const opts = empleados.map((e,ei)=>`<option value="${ei}">${e.nombre}</option>`).join('');
    const sug = sugerirProducto(etapa);
    const prodSug = sug ? productos.find(p=>p.id===sug) : null;
    return `<div class="plan-item">
      <span class="dia">Día ${dia}<br>${fstr}</span>
      <span style="flex:1">${etapa}${prodSug ? `<br><button class="plan-sugerencia" onclick="addToCart(${prodSug.id})">🛒 + ${prodSug.name}</button>` : ''}</span>
      <select id="plan-asig-${pi}"><option value="">Asignar a...</option>${opts}</select>
      <button onclick="borrarEtapaPlan(${pi})" title="Quitar etapa" style="background:none;border:none;color:#ef5350;cursor:pointer;font-size:16px;">×</button>
    </div>`;
  }).join('');
}
function asignarPlan() {
  const f = fincas[planFincaActual];
  const plan = planEtapas;
  let asignadas = 0;
  plan.forEach(([dia, etapa], pi) => {
    const sel = document.getElementById('plan-asig-' + pi);
    if (sel && sel.value !== '') {
      tareasEmpleado.push({emp: parseInt(sel.value), text: `${etapa} — ${f.nombre} (día ${dia})`, done: false});
      asignadas++;
    }
  });
  guardar();
  renderEmpleados();
  document.getElementById('plan-modal').classList.remove('open');
  if (asignadas) toast(`${asignadas} tarea(s) del plan asignadas a tu equipo. Revisa la sección Empleados. 👷`);
}

// ===== CALENDARIO DE TAREAS =====
let calMes = new Date().getMonth(), calAnio = new Date().getFullYear();
function eventosDelPlan() {
  // genera eventos a partir de la fecha de inicio de cada finca + su plan
  const eventos = [];
  // tareas con fecha límite
  tasks.filter(t=>t.fecha && !t.done).forEach(t => eventos.push({ fecha: new Date(t.fecha+'T12:00'), texto: t.text, finca: t.finca, tipo: 'tarea' }));
  fincas.forEach(f => {
    const plan = (typeof PLANES !== 'undefined') ? (PLANES[f.cultivo] || PLANES['_default']) : null;
    if (!plan || !f.fechaInicio) return;
    const inicio = new Date(f.fechaInicio);
    plan.forEach(([dia, etapa]) => {
      const fecha = new Date(inicio.getTime() + dia * 86400000);
      eventos.push({ fecha, texto: etapa, finca: f.nombre, tipo: 'plan' });
    });
  });
  return eventos;
}
function renderCalendario() {
  const cont = document.getElementById('cal-grid');
  if (!cont) return;
  const titulo = document.getElementById('cal-titulo');
  const primerDia = new Date(calAnio, calMes, 1);
  const finMes = new Date(calAnio, calMes + 1, 0).getDate();
  const arranque = primerDia.getDay();
  const hoy = new Date();
  titulo.textContent = primerDia.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' });
  const eventos = eventosDelPlan();
  const dows = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  let html = dows.map(d => `<div class="cal-dow">${d}</div>`).join('');
  for (let i = 0; i < arranque; i++) html += '<div class="cal-dia vacio"></div>';
  for (let d = 1; d <= finMes; d++) {
    const esHoy = hoy.getDate() === d && hoy.getMonth() === calMes && hoy.getFullYear() === calAnio;
    const evs = eventos.filter(e => e.fecha.getDate() === d && e.fecha.getMonth() === calMes && e.fecha.getFullYear() === calAnio);
    html += `<div class="cal-dia ${esHoy ? 'hoy' : ''}"><div class="num">${d}</div>` +
      evs.slice(0, 3).map(e => `<div class="cal-evento ${e.tipo==='tarea'?'tarea':''}" title="${e.texto} — ${e.finca}">${e.texto}</div>`).join('') +
      (evs.length > 3 ? `<div class="cal-evento">+${evs.length - 3} más</div>` : '') +
      `</div>`;
  }
  cont.innerHTML = html;
}
function calCambiar(delta) {
  calMes += delta;
  if (calMes < 0) { calMes = 11; calAnio--; }
  if (calMes > 11) { calMes = 0; calAnio++; }
  renderCalendario();
}

// ===== RECORDATORIOS DE TAREAS (notificación según el plan) =====
function revisarRecordatorios() {
  const eventos = eventosDelPlan();
  const manana = new Date(); manana.setDate(manana.getDate() + 1);
  const hoy = new Date();
  const proximos = eventos.filter(e =>
    (e.fecha.toDateString() === manana.toDateString()) || (e.fecha.toDateString() === hoy.toDateString())
  );
  if (!proximos.length) return;
  proximos.slice(0, 3).forEach(e => {
    const cuando = e.fecha.toDateString() === hoy.toDateString() ? 'hoy' : 'mañana';
    if (('Notification' in window) && Notification.permission === 'granted') {
      try { new Notification('📅 Recordatorio Cultyra', { body: `${cuando.toUpperCase()}: ${e.texto} — ${e.finca}` }); } catch (e2) {}
    }
  });
  // también como alerta visible en el dashboard
  proximos.slice(0, 2).forEach(e => {
    const cuando = e.fecha.toDateString() === hoy.toDateString() ? 'Hoy' : 'Mañana';
    alertas.unshift({ tipo: 'amarilla', icon: '📅', text: `${cuando}: ${e.texto} en ${e.finca} (según tu plan de cultivo).` });
  });
  renderAlertas();
}

// ===== EMPLEADOS =====
let empleados = [];
let tareasEmpleado = [];

function renderEmpleados() {
  const g = document.getElementById('empleados-grid');
  if(!empleados.length) { g.innerHTML = '<p style="color:var(--text-light);text-align:center;grid-column:1/-1;padding:30px">No hay empleados registrados. Agrega el primero arriba. 👆</p>'; return; }
  g.innerHTML = empleados.map((e,i)=>{
    const tareas = tareasEmpleado.map((t,ti)=>({...t,ti})).filter(t=>t.emp===i);
    const pendientes = tareas.filter(t=>!t.done).length;
    const cuentaBadge = e.cuentaCreada
      ? `<span style="font-size:10px;background:rgba(52,199,89,0.15);color:#34c759;border:1px solid rgba(52,199,89,0.3);padding:2px 7px;border-radius:99px;margin-left:6px">✅ Cuenta web</span>`
      : `<span style="font-size:10px;background:rgba(255,200,0,0.12);color:#f0a500;border:1px solid rgba(255,200,0,0.3);padding:2px 7px;border-radius:99px;margin-left:6px">Sin cuenta</span>`;
    return `<div class="empleado-card">
      <div class="empleado-head">
        <div class="empleado-avatar">${e.nombre[0].toUpperCase()}</div>
        <div style="flex:1">
          <h3>${e.nombre}${cuentaBadge}</h3>
          <p>${e.rol} · ${e.tel||'sin teléfono'}${e.email?` · ${e.email}`:''}</p>
        </div>
        <button class="btn-edit-mini" onclick="editarEmpleado(${i})" title="Editar" style="color:#fff;">✏️</button>
      </div>
      <div class="empleado-body">
        <div style="font-size:12px;font-family:'Space Mono',monospace;color:var(--text-light);margin-bottom:8px;">TAREAS ASIGNADAS · ${pendientes} pendiente${pendientes===1?'':'s'}</div>
        ${tareas.length ? tareas.map(t=>`
          <div class="empleado-tarea ${t.done?'hecha':''}">
            <button class="et-check ${t.done?'ok':''}" onclick="toggleTareaEmp(${t.ti})">${t.done?'✓':''}</button>
            <span style="flex:1">${t.text}${t.fecha?` <small style="color:var(--text-light)">(${fechaRelativa(t.fecha)})</small>`:''}</span>
            <button onclick="delTareaEmp(${t.ti})" style="background:none;border:none;color:#ef5350;cursor:pointer;font-size:15px;">×</button>
          </div>`).join('') : '<p style="font-size:13px;color:var(--text-light);">Sin tareas asignadas.</p>'}
        <div class="asignar-row">
          <input type="text" id="asig-${i}" placeholder="Asignar nueva tarea..." onkeydown="if(event.key==='Enter') asignarTarea(${i})">
          <button onclick="asignarTarea(${i})">+</button>
        </div>
        <button class="empleado-del" onclick="removeEmpleado(${i})">Eliminar empleado</button>
      </div>
    </div>`;
  }).join('');
}
let editandoEmp = null;
function editarEmpleado(i) {
  editandoEmp = i;
  const e = empleados[i];
  document.getElementById('emp-nombre').value = e.nombre;
  document.getElementById('emp-rol').value = e.rol;
  document.getElementById('emp-tel').value = e.tel || '';
  document.getElementById('emp-email').value = e.email || '';
  document.getElementById('emp-pass').value = '';
  document.getElementById('btn-add-emp').textContent = '✏️ Guardar cambios';
  document.getElementById('emp-nombre').focus();
}

async function addEmpleado() {
  const n     = document.getElementById('emp-nombre').value.trim();
  const r     = document.getElementById('emp-rol').value;
  const t     = document.getElementById('emp-tel').value.trim();
  const email = document.getElementById('emp-email').value.trim();
  const pass  = document.getElementById('emp-pass').value.trim();
  const btn   = document.getElementById('btn-add-emp');

  if (!n) return toast('Escribe el nombre del empleado.', 'error');

  // ── EDITAR (sin crear cuenta nueva) ──────────────────────
  if (editandoEmp !== null) {
    Object.assign(empleados[editandoEmp], {nombre:n, rol:r, tel:t, email: email||empleados[editandoEmp].email||''});
    editandoEmp = null;
    btn.textContent = '+ Agregar y crear cuenta';
    toast('Empleado actualizado. ✏️');
    guardar(); renderEmpleados(); renderTareas();
    ['emp-nombre','emp-tel','emp-email','emp-pass'].forEach(id=>document.getElementById(id).value='');
    return;
  }

  // ── CREAR CUENTA FIREBASE usando instancia secundaria ────
  // Así la sesión del patrón NO se interrumpe
  if (email && pass) {
    if (pass.length < 6) return toast('La contraseña debe tener mínimo 6 caracteres.', 'error');
    btn.disabled = true; btn.textContent = 'Creando cuenta…';
    try {
      const appSec  = getFirebaseSecundaria();
      const authSec = appSec.auth();
      const cred    = await authSec.createUserWithEmailAndPassword(email, pass);
      await cred.user.updateProfile({ displayName: n });

      // Guardar rol en Firestore (desde la sesión del PATRÓN, no del empleado)
      try {
        await firebase.firestore().collection('usuarios').doc(cred.user.uid).set({
          rol: 'empleado',
          nombre: n,
          email,
          tel: t,
          patronUid: sesion.uid,
          creadoEn: new Date().toISOString()
        }, { merge: true });
      } catch(fe) { console.warn('Firestore:', fe); }

      // Cerrar sesión SOLO en la instancia secundaria
      await authSec.signOut();

      // Registrar empleado localmente y guardar
      empleados.push({ nombre: n, rol: r, tel: t, email, uid: cred.user.uid, cuentaCreada: true });
      // Guardar patronUid propio en Firestore
      try {
        await firebase.firestore().collection('usuarios').doc(sesion.uid).set(
          { rol: 'agricultor', nombre: sesion.nombre, email: sesion.email }, { merge: true }
        );
      } catch(fe) {}

      await mostrarCredencialesEmpleado(n, email, pass);

    } catch(e) {
      btn.disabled = false; btn.textContent = '+ Agregar y crear cuenta';
      return toast('Error: ' + (tradFirebaseError(e.code) || e.message), 'error');
    }
  } else {
    // Sin cuenta web — solo registro local
    empleados.push({ nombre: n, rol: r, tel: t, email: email || '', cuentaCreada: false });
    toast('Empleado registrado (sin cuenta web). 👷');
  }

  btn.disabled = false; btn.textContent = '+ Agregar y crear cuenta';
  guardar(); renderEmpleados(); renderTareas();
  ['emp-nombre','emp-tel','emp-email','emp-pass'].forEach(id=>document.getElementById(id).value='');
}
async function removeEmpleado(i) {
  if (!await confirmar('¿Eliminar a ' + empleados[i].nombre + ' y todas sus tareas?')) return;
  tareasEmpleado = tareasEmpleado.filter(t=>t.emp!==i).map(t=> t.emp>i ? {...t, emp:t.emp-1} : t);
  empleados.splice(i,1);
  guardar();
  renderEmpleados();
  renderDashboard();
  toast('Empleado eliminado.', 'info');
}
function asignarTarea(i) {
  const inp = document.getElementById('asig-'+i);
  const text = inp.value.trim();
  if(!text) return;
  tareasEmpleado.push({emp:i, text, done:false, fechaAsignada: new Date().toISOString()});
  guardar();
  inp.value='';
  renderEmpleados();
  renderDashboard();
  toast(`✅ Tarea asignada a ${empleados[i]?.nombre||'empleado'}`);
}
function toggleTareaEmp(ti) { tareasEmpleado[ti].done = !tareasEmpleado[ti].done; guardar(); renderEmpleados(); renderDashboard(); }
function delTareaEmp(ti) { tareasEmpleado.splice(ti,1); guardar(); renderEmpleados(); renderDashboard(); }

// ===== MODAL CREDENCIALES EMPLEADO =====
function mostrarCredencialesEmpleado(nombre, email, pass) {
  return new Promise(resolve => {
    const html = `
      <div id="cred-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px">
        <div style="background:#0d2010;border:1px solid rgba(52,199,89,0.3);border-radius:18px;padding:28px;max-width:380px;width:100%;font-family:'DM Sans',sans-serif">
          <div style="text-align:center;margin-bottom:16px">
            <div style="font-size:36px;margin-bottom:8px">✅</div>
            <h3 style="color:#e0f0e4;margin:0 0 4px;font-size:18px">Cuenta creada para ${nombre}</h3>
            <p style="color:#a0c4a8;font-size:13px;margin:0">Anota estas credenciales y dáselas al empleado</p>
          </div>
          <div style="background:#112214;border-radius:12px;padding:16px;margin-bottom:16px">
            <div style="margin-bottom:12px">
              <div style="font-size:11px;color:#a0c4a8;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.05em">📧 Correo</div>
              <div style="color:#e0f0e4;font-size:14px;font-weight:600;word-break:break-all">${email}</div>
            </div>
            <div>
              <div style="font-size:11px;color:#a0c4a8;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.05em">🔑 Contraseña temporal</div>
              <div style="color:#34c759;font-size:20px;font-weight:700;letter-spacing:0.05em">${pass}</div>
            </div>
          </div>
          <div style="font-size:12px;color:#a0c4a8;background:rgba(52,199,89,0.08);border-radius:8px;padding:10px;margin-bottom:16px">
            🌐 El empleado accede en <b style="color:#34c759">cultyraagr.web.app</b> con estas credenciales. Tendrá acceso a: IA, fincas y sus tareas asignadas.
          </div>
          <div style="display:flex;gap:8px">
            <button onclick="navigator.clipboard.writeText('Correo: ${email}\\nContraseña: ${pass}\\nSitio: cultyraagr.web.app').then(()=>toast('Credenciales copiadas ✅')).catch(()=>{})" style="flex:1;background:rgba(52,199,89,0.15);border:1px solid rgba(52,199,89,0.3);color:#34c759;border-radius:10px;padding:10px;cursor:pointer;font-size:13px;font-weight:600">📋 Copiar</button>
            <button onclick="document.getElementById('cred-overlay').remove(); window._credResolve && window._credResolve();" style="flex:1;background:#34c759;border:none;color:#0a1a0c;border-radius:10px;padding:10px;cursor:pointer;font-size:13px;font-weight:700">✓ Listo</button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    window._credResolve = resolve;
    document.getElementById('cred-overlay').addEventListener('click', e => {
      if (e.target.id === 'cred-overlay') { e.target.remove(); resolve(); }
    });
  });
}
