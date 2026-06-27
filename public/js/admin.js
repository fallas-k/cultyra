// ============================================================
// CULTYRA · PANEL DE ADMINISTRACIÓN
// Solo accesible para cuentas con rol = 'admin' en Firestore
// ============================================================

async function renderAdminPanel() {
  const db = firebase.firestore();

  // ─── Usuarios ───────────────────────────────────────────
  const usersSnap = await db.collection('usuarios').get().catch(() => null);
  const users = usersSnap ? usersSnap.docs.map(d => ({ id: d.id, ...d.data() })) : [];

  const agricultores = users.filter(u => u.rol === 'agricultor' || !u.rol);
  const empleados    = users.filter(u => u.rol === 'empleado');

  // ─── Renderizar ─────────────────────────────────────────
  const panel = document.getElementById('admin-panel');
  if (!panel) return;

  panel.innerHTML = `
    <div style="max-width:1100px;margin:0 auto;padding:32px 24px 80px">

      <!-- Header -->
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:28px;flex-wrap:wrap">
        <div style="width:46px;height:46px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">🛡️</div>
        <div>
          <h2 style="margin:0;font-size:22px;color:var(--text-dark);font-family:'Playfair Display',serif">Panel de Administración</h2>
          <p style="margin:0;font-size:12px;color:var(--text-light)">CULTYRA · Vista exclusiva para administradores</p>
        </div>
      </div>

      <!-- KPIs -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:28px">
        ${kpiCard('👨‍🌾', 'Agricultores', agricultores.length, '#34c759')}
        ${kpiCard('👷', 'Empleados', empleados.length, '#f59e0b')}
        ${kpiCard('👥', 'Usuarios totales', users.length, '#6366f1')}
        ${kpiCard('🌾', 'Sesión activa', sesion.nombre, '#34c759', true)}
      </div>

      <!-- Tabla usuarios -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:18px;overflow:hidden;margin-bottom:24px">
        <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <h3 style="margin:0;font-size:15px;color:var(--text-dark)">👥 Usuarios registrados</h3>
          <input id="admin-search" oninput="filtrarAdminUsers()" type="text" placeholder="🔍 Buscar por nombre o correo..." style="background:var(--bg-input);border:1px solid var(--border);border-radius:8px;padding:6px 12px;font-size:13px;color:var(--text-dark);font-family:'DM Sans',sans-serif;outline:none;min-width:200px">
        </div>
        <div style="overflow-x:auto">
          <table id="admin-users-table" style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:rgba(52,199,89,0.08)">
                <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em">Usuario</th>
                <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em">Correo</th>
                <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em">Rol</th>
                <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => adminUserRow(u)).join('')}
            </tbody>
          </table>
          ${users.length === 0 ? '<p style="text-align:center;color:var(--text-light);padding:24px">Sin usuarios registrados aún.</p>' : ''}
        </div>
      </div>

      <!-- Soporte rápido -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:18px;padding:20px 24px">
        <h3 style="margin:0 0 14px;font-size:15px;color:var(--text-dark)">⚙️ Acciones rápidas</h3>
        <div style="display:flex;flex-wrap:wrap;gap:10px">
          <button onclick="window.open('https://console.firebase.google.com/project/cultyraagro','_blank')" style="${btnStyle('#6366f1')}">🔥 Firebase Console</button>
          <button onclick="window.open('https://railway.app','_blank')" style="${btnStyle('#0d9488')}">🚂 Railway</button>
          <button onclick="window.open('https://cultyraagr-production.up.railway.app/api/salud','_blank')" style="${btnStyle('#166534')}">🩺 Estado del servidor</button>
          <button onclick="exportarUsersCSV(${JSON.stringify(users).replace(/"/g,'&quot;')})" style="${btnStyle('#92400e')}">📥 Exportar usuarios CSV</button>
        </div>
      </div>

    </div>`;

  // Guardar users globalmente para filtrar
  window._adminUsers = users;
}

function kpiCard(icon, label, val, color, isText = false) {
  return `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:16px 18px">
    <div style="font-size:22px;margin-bottom:6px">${icon}</div>
    <div style="font-size:${isText?'16px':'28px'};font-weight:700;color:${color};margin-bottom:2px">${val}</div>
    <div style="font-size:11px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em">${label}</div>
  </div>`;
}

function adminUserRow(u) {
  const rolColor = u.rol === 'admin' ? '#6366f1' : u.rol === 'empleado' ? '#f59e0b' : '#34c759';
  const rolLabel = u.rol === 'admin' ? '🛡️ Admin' : u.rol === 'empleado' ? '👷 Empleado' : '👨‍🌾 Agricultor';
  return `<tr style="border-top:1px solid var(--border)" data-nombre="${(u.nombre||'').toLowerCase()}" data-email="${(u.email||'').toLowerCase()}">
    <td style="padding:11px 16px">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:32px;height:32px;border-radius:50%;background:${rolColor};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#061008;flex-shrink:0">${(u.nombre||'?')[0].toUpperCase()}</div>
        <span style="font-size:13px;font-weight:600;color:var(--text-dark)">${u.nombre || 'Sin nombre'}</span>
      </div>
    </td>
    <td style="padding:11px 16px;font-size:13px;color:var(--text-mid)">${u.email || '—'}</td>
    <td style="padding:11px 16px">
      <span style="font-size:11px;font-weight:600;padding:3px 9px;border-radius:99px;background:${rolColor}22;color:${rolColor}">${rolLabel}</span>
    </td>
    <td style="padding:11px 16px">
      <button onclick="cambiarRolUser('${u.id}','${u.rol||'agricultor'}')" style="background:none;border:1px solid var(--border);color:var(--text-mid);padding:4px 10px;border-radius:7px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif">Cambiar rol</button>
    </td>
  </tr>`;
}

function btnStyle(color) {
  return `background:${color}22;border:1px solid ${color}44;color:${color};padding:9px 16px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif`;
}

function filtrarAdminUsers() {
  const q = document.getElementById('admin-search').value.toLowerCase();
  document.querySelectorAll('#admin-users-table tbody tr').forEach(tr => {
    const n = tr.dataset.nombre || '', e = tr.dataset.email || '';
    tr.style.display = (n.includes(q) || e.includes(q)) ? '' : 'none';
  });
}

async function cambiarRolUser(uid, rolActual) {
  const roles = ['agricultor', 'empleado', 'admin'];
  const nuevoRol = prompt(`Cambiar rol de este usuario.\nRol actual: ${rolActual}\n\nEscribí el nuevo rol:\n• agricultor\n• empleado\n• admin`, rolActual);
  if (!nuevoRol || !roles.includes(nuevoRol.trim())) { toast('Rol inválido. Usá: agricultor, empleado o admin.', 'error'); return; }
  try {
    await firebase.firestore().collection('usuarios').doc(uid).set({ rol: nuevoRol.trim() }, { merge: true });
    toast(`✅ Rol actualizado a "${nuevoRol.trim()}"`, 'ok');
    renderAdminPanel();
  } catch(e) { toast('Error al actualizar: ' + e.message, 'error'); }
}

function exportarUsersCSV(users) {
  const header = 'Nombre,Correo,Rol,UID';
  const rows   = users.map(u => `"${u.nombre||''}","${u.email||''}","${u.rol||'agricultor'}","${u.id}"`);
  const csv    = [header, ...rows].join('\n');
  const blob   = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a'); a.href = url; a.download = 'cultyra_usuarios.csv'; a.click();
  URL.revokeObjectURL(url);
  toast('Usuarios exportados a CSV ✅');
}
