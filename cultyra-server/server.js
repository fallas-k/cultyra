// ============================================================
// CULTYRA — Backend API con seguridad, IA multimodal y RAG
// Node.js + Express + SQLite | Railway
// ============================================================
const express  = require('express');
const cors     = require('cors');
const jwt      = require('jsonwebtoken');
const https    = require('https');
const { DatabaseSync } = require('node:sqlite');
const path     = require('path');

const PORT             = process.env.PORT || 3000;
const FIREBASE_PROJECT = process.env.FIREBASE_PROJECT_ID || '';
const ANTHROPIC_KEY    = process.env.ANTHROPIC_API_KEY   || '';

// ── BASE DE DATOS ─────────────────────────────────────────────
const db = new DatabaseSync(path.join(__dirname, 'cultyra.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS datos_usuario (
    firebase_uid TEXT PRIMARY KEY,
    datos        TEXT NOT NULL DEFAULT '{}',
    actualizado  TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS registros (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    firebase_uid TEXT NOT NULL,
    finca        TEXT NOT NULL DEFAULT 'General',
    tipo         TEXT NOT NULL CHECK(tipo IN ('cosecha','venta','gasto')),
    monto        REAL NOT NULL,
    nota         TEXT DEFAULT '',
    fecha        TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_reg_uid ON registros(firebase_uid);
`);

// ── SYSTEM PROMPT DE CULTIA ───────────────────────────────────
const CULTYRA_SYSTEM = `Eres CultIA, el asistente de inteligencia artificial de Cultyra, empresa costarricense de agrotecnología. Usas visión artificial multimodal y conocimiento agrícola global.

IDIOMA: Siempre en español. Tono: amigable, práctico, con emojis agrícolas 🌱.

ANÁLISIS VISUAL DE IMÁGENES 📸
Al recibir una foto:
1. Describí brevemente lo que ves (planta, parte afectada, síntomas)
2. Diagnóstico más probable (plaga, hongo, bacteria, deficiencia, daño físico)
3. Diagnósticos alternativos si hay ambigüedad
4. Tratamiento recomendado (preferir biodegradables)
5. Urgencia: 🔴 Urgente (actuar en 24h) · 🟡 Moderada (esta semana) · 🟢 Leve (monitorear)

CONOCIMIENTO AGRÍCOLA GLOBAL 🌍
Conocés agricultura de: Costa Rica, Centroamérica, México, Sudamérica, Europa, Asia, África.
Cultivos CR: café, banano, piña, caña, tomate, frijol, maíz, cacao, cítricos, aguacate, palma, melón, yuca, chayote, chile, repollo, cebolla, lechuga, papa, fresa, zanahoria, brócoli y más.
Conocés: SENASA, MAG, CNP, INTA de Costa Rica como instituciones de referencia.`;

// ── RATE LIMITING DE IA (por UID) ─────────────────────────────
const IA_LIMITE_POR_HORA = 30;
const iaUso = new Map();
function iaPermitido(uid) {
  const ahora = Date.now();
  const u = iaUso.get(uid) || { conteo: 0, expira: ahora + 3_600_000 };
  if (ahora > u.expira) { u.conteo = 0; u.expira = ahora + 3_600_000; }
  if (u.conteo >= IA_LIMITE_POR_HORA) return false;
  u.conteo++; iaUso.set(uid, u); return true;
}

// ── APP ───────────────────────────────────────────────────────
const app = express();

// CORS — orígenes autorizados
const ALLOWED = (process.env.ALLOWED_ORIGINS ||
  'https://cultyraagro.web.app,https://cultyraagr.web.app,http://localhost:5000,http://localhost:3000'
).split(',').map(s => s.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origen no autorizado: ' + origin));
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // 10MB para imágenes base64
app.disable('x-powered-by');

// ── VERIFICACIÓN TOKEN FIREBASE ───────────────────────────────
let googleKeys = {}, keysExpiry = 0;
function fetchGoogleKeys() {
  return new Promise((resolve, reject) => {
    https.get('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com', res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          googleKeys = JSON.parse(data);
          const m = (res.headers['cache-control'] || '').match(/max-age=(\d+)/);
          keysExpiry = Date.now() + (m ? parseInt(m[1]) * 1000 : 3_600_000);
          resolve(googleKeys);
        } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}
async function verifyFirebaseToken(token) {
  if (!FIREBASE_PROJECT) return null;
  try {
    if (Date.now() >= keysExpiry || !Object.keys(googleKeys).length) await fetchGoogleKeys();
    const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString());
    const cert = googleKeys[header.kid];
    if (!cert) return null;
    const payload = jwt.verify(token, cert, {
      algorithms: ['RS256'],
      audience:   FIREBASE_PROJECT,
      issuer:     'https://securetoken.google.com/' + FIREBASE_PROJECT
    });
    return { uid: payload.uid || payload.sub, email: payload.email };
  } catch(e) { return null; }
}
async function autenticar(req, res) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) { res.status(401).json({ error: 'Token requerido.' }); return null; }
  const u = await verifyFirebaseToken(token);
  if (!u) { res.status(401).json({ error: 'Token inválido o expirado.' }); return null; }
  return u;
}

// ── DATOS GENERALES ───────────────────────────────────────────
app.get('/api/datos', async (req, res) => {
  const u = await autenticar(req, res); if (!u) return;
  const fila = db.prepare('SELECT datos, actualizado FROM datos_usuario WHERE firebase_uid = ?').get(u.uid);
  res.json({ datos: fila?.datos ?? null, actualizado: fila?.actualizado ?? null });
});

app.put('/api/datos', async (req, res) => {
  const u = await autenticar(req, res); if (!u) return;
  const datos = JSON.stringify(req.body?.datos ?? {});
  if (datos.length > 4_000_000) return res.status(413).json({ error: 'Datos demasiado grandes.' });
  db.prepare(`
    INSERT INTO datos_usuario (firebase_uid, datos, actualizado) VALUES (?, ?, datetime('now'))
    ON CONFLICT(firebase_uid) DO UPDATE SET datos = excluded.datos, actualizado = datetime('now')
  `).run(u.uid, datos);
  res.json({ ok: true });
});

// ── REGISTROS ─────────────────────────────────────────────────
app.get('/api/registros', async (req, res) => {
  const u = await autenticar(req, res); if (!u) return;
  res.json(db.prepare('SELECT id,finca,tipo,monto,nota,fecha FROM registros WHERE firebase_uid=? ORDER BY fecha DESC').all(u.uid));
});

app.post('/api/registros', async (req, res) => {
  const u = await autenticar(req, res); if (!u) return;
  const { finca, tipo, monto, nota, fecha } = req.body || {};
  if (!['cosecha','venta','gasto'].includes(tipo)) return res.status(400).json({ error: 'Tipo inválido.' });
  const m = parseFloat(monto);
  if (!m || m <= 0) return res.status(400).json({ error: 'Monto debe ser mayor a 0.' });
  const f = (finca || 'General').trim().substring(0, 120);
  const n = (nota || '').trim().substring(0, 300);
  const stmt = fecha
    ? db.prepare('INSERT INTO registros (firebase_uid,finca,tipo,monto,nota,fecha) VALUES (?,?,?,?,?,?)').run(u.uid, f, tipo, m, n, String(fecha).substring(0, 25))
    : db.prepare('INSERT INTO registros (firebase_uid,finca,tipo,monto,nota) VALUES (?,?,?,?,?)').run(u.uid, f, tipo, m, n);
  res.status(201).json(db.prepare('SELECT id,finca,tipo,monto,nota,fecha FROM registros WHERE id=?').get(stmt.lastInsertRowid));
});

app.put('/api/registros/:id', async (req, res) => {
  const u = await autenticar(req, res); if (!u) return;
  const id = parseInt(req.params.id);
  if (!id || !db.prepare('SELECT id FROM registros WHERE id=? AND firebase_uid=?').get(id, u.uid))
    return res.status(404).json({ error: 'No encontrado o sin permiso.' });
  const { finca, tipo, monto, nota } = req.body || {};
  if (tipo && !['cosecha','venta','gasto'].includes(tipo)) return res.status(400).json({ error: 'Tipo inválido.' });
  const m = parseFloat(monto);
  db.prepare(`UPDATE registros SET finca=COALESCE(?,finca),tipo=COALESCE(?,tipo),monto=COALESCE(?,monto),nota=COALESCE(?,nota) WHERE id=?`)
    .run(finca ? finca.trim().substring(0, 120) : null, tipo || null, (monto !== undefined && m > 0) ? m : null, nota !== undefined ? nota.trim().substring(0, 300) : null, id);
  res.json(db.prepare('SELECT id,finca,tipo,monto,nota,fecha FROM registros WHERE id=?').get(id));
});

app.delete('/api/registros/:id', async (req, res) => {
  const u = await autenticar(req, res); if (!u) return;
  const id = parseInt(req.params.id);
  if (!id || !db.prepare('SELECT id FROM registros WHERE id=? AND firebase_uid=?').get(id, u.uid))
    return res.status(404).json({ error: 'No encontrado o sin permiso.' });
  db.prepare('DELETE FROM registros WHERE id=?').run(id);
  res.json({ ok: true, eliminado: id });
});

// ── CULTIA — IA MULTIMODAL CON RAG ────────────────────────────
app.post('/api/ia', async (req, res) => {
  const u = await autenticar(req, res); if (!u) return;
  if (!ANTHROPIC_KEY) return res.status(503).json({ error: 'IA no configurada en el servidor.' });
  if (!iaPermitido(u.uid)) return res.status(429).json({ error: `Límite de ${IA_LIMITE_POR_HORA} mensajes/hora alcanzado.` });

  const entrada = Array.isArray(req.body?.messages) ? req.body.messages : null;
  if (!entrada?.length) return res.status(400).json({ error: 'Se requiere el campo messages.' });

  // Construir mensajes multimodal
  const messages = entrada.slice(-10).map(m => {
    const role = m.role === 'assistant' ? 'assistant' : 'user';
    if (m.imagen) {
      if (m.imagen.length > 5_500_000) return { role, content: [{ type: 'text', text: (m.content || 'Analiza esta imagen.').slice(0, 2000) }] };
      let mediaType = 'image/jpeg';
      if (m.mimeType) mediaType = m.mimeType;
      else if (m.imagen.startsWith('iVBORw')) mediaType = 'image/png';
      else if (m.imagen.startsWith('R0lG'))   mediaType = 'image/gif';
      else if (m.imagen.startsWith('UklG'))   mediaType = 'image/webp';
      return { role, content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: m.imagen } },
        { type: 'text', text: (m.content || '¿Qué ves en esta imagen? Analízala agronómicamente.').slice(0, 2000) }
      ]};
    }
    return { role, content: String(m.content ?? '').slice(0, 4000) };
  });

  // RAG: inyectar contexto personalizado de la finca
  let contexto = '';
  try {
    const filaUser = db.prepare('SELECT datos FROM datos_usuario WHERE firebase_uid = ?').get(u.uid);
    if (filaUser?.datos) {
      const d = JSON.parse(filaUser.datos);
      const ahora = new Date().toLocaleString('es-CR', { timeZone: 'America/Costa_Rica', weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' });
      const fincas = Array.isArray(d.fincas) ? d.fincas : [];
      const tareas = Array.isArray(d.tasks) ? d.tasks.filter(t => !t.done) : [];
      const empleados = Array.isArray(d.empleados) ? d.empleados : [];
      const regRows = db.prepare('SELECT tipo,monto,nota,fecha FROM registros WHERE firebase_uid=? ORDER BY fecha DESC LIMIT 5').all(u.uid);
      const ventas = regRows.filter(r=>r.tipo==='venta').reduce((s,r)=>s+r.monto,0);
      const gastos = regRows.filter(r=>r.tipo==='gasto').reduce((s,r)=>s+r.monto,0);
      contexto = `\n\n════════════ DATOS DEL AGRICULTOR ════════════
📅 Fecha: ${ahora}
🌾 FINCAS (${fincas.length}): ${fincas.length ? fincas.map(f=>`${f.nombre} — ${f.cultivo||'?'}, ${f.area||'?'} ha, ${f.ubicacion||'?'}`).join(' | ') : 'Sin fincas'}
📋 TAREAS PENDIENTES (${tareas.length}): ${tareas.length ? tareas.slice(0,5).map(t=>`${t.text} [${t.priority||'media'}]`).join(' | ') : 'Sin tareas'}
👷 EQUIPO: ${empleados.length ? empleados.map(e=>`${e.nombre} (${e.rol||'peón'})`).join(', ') : 'Sin empleados'}
💰 MOVIMIENTOS RECIENTES: ${regRows.length ? regRows.map(r=>`${r.tipo} ₡${Number(r.monto).toLocaleString('es-CR')} ${r.nota||''}`).join(' | ') : 'Sin registros'}
📊 Ventas recientes: ₡${ventas.toLocaleString('es-CR')} | Gastos: ₡${gastos.toLocaleString('es-CR')}
Usa estos datos para personalizar las respuestas cuando el usuario mencione "mi finca", "mis empleados", "mis registros", etc.`;
    }
  } catch(e) { /* contexto vacío si falla */ }

  const tieneImagen = entrada.some(m => m.imagen);
  const modelo = tieneImagen ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001';

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: modelo, max_tokens: 1200, system: CULTYRA_SYSTEM + contexto, messages })
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: data?.error?.message || 'Error de la IA.' });
    res.json({ texto: (data.content || []).map(c => c.text || '').join(''), modelo });
  } catch(e) {
    res.status(500).json({ error: 'No se pudo conectar con la IA.' });
  }
});

// ── SALUD ─────────────────────────────────────────────────────
app.get('/api/salud', (_req, res) => res.json({
  ok: true, servicio: 'Cultyra API',
  firebase: FIREBASE_PROJECT || '⚠️ sin configurar',
  ia: ANTHROPIC_KEY ? '✅ configurada' : '⚠️ sin ANTHROPIC_API_KEY',
  registros: db.prepare('SELECT COUNT(*) AS n FROM registros').get().n
}));

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use((err, _req, res, _next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ error: 'Error interno.' });
});

app.listen(PORT, () => {
  console.log('🌱 Cultyra API en http://localhost:' + PORT);
  console.log('   Firebase: ' + (FIREBASE_PROJECT || '⚠️ no configurado'));
  console.log('   IA: ' + (ANTHROPIC_KEY ? '✅ lista' : '⚠️ falta ANTHROPIC_API_KEY'));
});
