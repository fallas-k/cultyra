// ============================================================
// CULTYRA · STORAGE
// ============================================================

// ===== PERSISTENCIA (almacenamiento local con respaldo en memoria) =====
// La clave de almacenamiento es ÚNICA por usuario, así los datos de un
// agricultor nunca se mezclan con los de otro aunque usen la misma computadora.
function claveDatos() {
  const email = (sesion && sesion.email) ? sesion.email.toLowerCase() : 'invitado';
  return 'cultyra_datos__' + email;
}
function guardar() {
  try {
    localStorage.setItem(claveDatos(), JSON.stringify({fincas, tasks, empleados, tareasEmpleado, carrito, registros, bitacora}));
  } catch(e) { /* sin almacenamiento disponible: se mantiene en memoria */ }
  flashGuardado();
  sincronizarSubida();
}
function vaciarDatos() {
  // Deja la app en blanco para el nuevo usuario (sin datos de demostración)
  fincas = []; tasks = []; empleados = []; tareasEmpleado = []; carrito = []; registros = []; bitacora = [];
}
function cargarDatos() {
  vaciarDatos();
  try {
    const d = JSON.parse(localStorage.getItem(claveDatos()));
    if (d) {
      if (Array.isArray(d.fincas)) fincas = d.fincas;
      if (Array.isArray(d.tasks)) tasks = d.tasks;
      if (Array.isArray(d.empleados)) empleados = d.empleados;
      if (Array.isArray(d.tareasEmpleado)) tareasEmpleado = d.tareasEmpleado;
      if (Array.isArray(d.carrito)) carrito = d.carrito;
      if (Array.isArray(d.registros)) registros = d.registros;
      if (Array.isArray(d.bitacora)) bitacora = d.bitacora;
    }
  } catch(e) { /* primera vez o sin almacenamiento */ }
}
function recargarTodoUI() {
  renderFincas(); renderTasks(); renderEmpleados(); renderClimaFincas();
  actualizarCartBadge(); renderRegistros(); renderBitacora(); renderDashboard();
}

// ===== EXPORTAR REGISTROS A CSV (Excel) =====
function exportarCSV() {
  if (!registros.length) { toast('No hay registros para exportar todavía.', 'info'); return; }
  const filas = [['Fecha','Tipo','Finca','Cantidad','Unidad','Nota']];
  registros.slice().reverse().forEach(r => {
    const f = new Date(r.fecha);
    const fecha = f.getDate().toString().padStart(2,'0') + '/' + (f.getMonth()+1).toString().padStart(2,'0') + '/' + f.getFullYear();
    const tipo = r.tipo === 'cosecha' ? 'Cosecha' : r.tipo === 'venta' ? 'Venta' : 'Gasto';
    const unidad = r.tipo === 'cosecha' ? 'kg' : 'CRC';
    filas.push([fecha, tipo, r.finca, r.monto, unidad, (r.nota || '').replace(/"/g, '""')]);
  });
  const csv = '\uFEFF' + filas.map(f => f.map(x => '"' + x + '"').join(';')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'cultyra-registros.csv';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Registros exportados a CSV. Ábrelo con Excel. 📊');
}

// ===== SINCRONIZACIÓN CON LA BASE DE DATOS SQL =====
let syncTimer = null;
let syncEstado = 'local';
function marcarSync(estado) {
  syncEstado = estado;
  const el = document.getElementById('sync-estado');
  if (!el) return;
  el.textContent = estado === 'ok' ? '☁️ Sincronizado' : estado === 'subiendo' ? '☁️ Guardando...' : estado === 'error' ? '📴 Solo local' : '💾 Local';
  el.style.color = estado === 'error' ? '#ef9a9a' : '';
}
function sincronizarSubida() {
  if (!sesion || !sesion.uid) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    try {
      marcarSync('subiendo');
      const r = await fetch(API_URL + '/api/datos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (await getToken()) },
        body: JSON.stringify({ datos: { fincas, tasks, empleados, tareasEmpleado, carrito, registros, bitacora } })
      });
      marcarSync(r.ok ? 'ok' : 'error');
    } catch (e) { marcarSync('error'); }
  }, 1500);
}
async function cargarDatosServidor() {
  if (!sesion || !sesion.uid) return;
  try {
    // Si es empleado, cargar datos del patrón usando su patronUid
    let uidParaCarga = sesion.uid;
    if (sesion.rol === 'empleado') {
      try {
        const doc = await firebase.firestore().collection('usuarios').doc(sesion.uid).get();
        if (doc.exists && doc.data().patronUid) {
          uidParaCarga = doc.data().patronUid;
          sesion.patronUid = uidParaCarga;
        }
      } catch(e) { console.warn('No se pudo obtener patronUid:', e); }
    }

    // 1) Cargar datos del blob JSON (del patrón si es empleado)
    // El servidor usa el token para identificar al usuario, así que
    // para empleados necesitamos pasar el patronUid como query param
    const url = sesion.rol === 'empleado' && sesion.patronUid
      ? API_URL + '/api/datos?uid=' + sesion.patronUid
      : API_URL + '/api/datos';

    const r = await fetch(url, { headers: { 'Authorization': 'Bearer ' + (await getToken()) } });
    if (!r.ok) { marcarSync('error'); return; }
    const d = await r.json();
    if (d.datos) {
      const j = JSON.parse(d.datos);
      if (Array.isArray(j.fincas)) fincas = j.fincas;
      if (Array.isArray(j.tasks)) tasks = j.tasks;
      if (Array.isArray(j.empleados)) empleados = j.empleados;
      if (Array.isArray(j.tareasEmpleado)) tareasEmpleado = j.tareasEmpleado;
      if (Array.isArray(j.carrito)) carrito = j.carrito;
      if (Array.isArray(j.bitacora)) bitacora = j.bitacora;
      renderFincas(); renderTasks(); renderEmpleados(); renderClimaFincas();
      actualizarCartBadge(); renderBitacora(); renderDashboard();
    }
    marcarSync('ok');

    // 2) Cargar registros desde la tabla SQL propia
    await cargarRegistrosServidor();
  } catch (e) { marcarSync('error'); }
}

// ===== INDICADOR DE GUARDADO =====
function flashGuardado() {
  const el = document.getElementById('guardado-flash');
  if (!el) return;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 1400);
}
