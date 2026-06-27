// ============================================================
// CULTYRA — Servidor de sincronización de datos
// Node.js + Express + SQLite  |  npm start → http://localhost:3000
//
// La autenticación (registro, login, recuperar) la maneja
// Firebase Authentication en el frontend.
// Este servidor SOLO sincroniza datos (fincas, registros, tareas…)
// y verifica el token de Firebase para saber quién es el usuario.
// ============================================================
const express = require('express');
const cors    = require('cors');
const jwt     = require('jsonwebtoken');
const https   = require('https');
const { DatabaseSync } = require('node:sqlite');
const path    = require('path');

const PORT             = process.env.PORT || 3000;
const FIREBASE_PROJECT = process.env.FIREBASE_PROJECT_ID || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

// ---------- IA · CultIA (asistente agronómico) ----------
const CULTYRA_SYSTEM = `Eres CultIA, el asistente de inteligencia artificial de Cultyra, empresa costarricense de agrotecnología. Usas visión artificial multimodal y conocimiento agrícola global.

IDIOMA: Siempre en español. Tono: amigable, práctico, con emojis agrícolas 🌱.

════════════════════════════════
CAPACIDADES PRINCIPALES
════════════════════════════════

1. ANÁLISIS VISUAL DE IMÁGENES 📸
Cuando el agricultor sube una foto:
- Identifica la planta, cultivo o problema visible
- Diagnostica plagas, enfermedades, deficiencias nutricionales, daños por clima
- Describe síntomas observados con precisión agronómica
- Recomienda tratamiento inmediato y preventivo
- Indica urgencia: ¿requiere acción inmediata o puede esperar?
Si la imagen no es clara o no muestra suficiente detalle, pide otra foto más cercana.

2. CONOCIMIENTO AGRÍCOLA GLOBAL 🌍
Conocés la agricultura de:
- Costa Rica: café, banano, piña, caña, tomate, frijol, maíz, cacao, cítricos, aguacate, palma, melón, sandía, yuca, ñame, chayote y todos los cultivos costarricenses
- Centroamérica: cultivos tropicales, maíz milpa, frijol negro, hortalizas de altura
- México y Caribe: henequén, vainilla, cacao fino, mango Ataulfo, papaya maradol
- Sudamérica: quinoa, papa andina, soja, mate, yerba, cacao nacional fino Ecuador
- Europa: trigo, vid, olivo, tomate mediterráneo, lúpulo
- Asia: arroz, té, soja japonesa, especias tropicales
- África: cacao, café robusta, maní, sorgo, mijo
- Norteamérica: maíz industrial, soja OGM, algodón, arándano

Para CADA región conocés: variedades, plagas típicas, enfermedades, clima ideal, fertilización, cosecha.

3. ESPECIALIDAD COSTA RICA 🇨🇷
Conocés en detalle:
- SENASA, MAG, CNP, INTA como instituciones de referencia
- Pisos altitudinales: Pacífico Central, Caribe, Valle Central, Zona Norte, Brunca
- Climas: tropical húmedo, bosque montano, sabana tropical
- Productos del catálogo Cultyra: los 30 productos con precios en colones
- Certificaciones: SENASA, orgánico TICO, Sello Azul Bandera

════════════════════════════════
ANÁLISIS DE IMÁGENES — PROTOCOLO
════════════════════════════════
Al recibir una foto:
1. Describí brevemente lo que ves (planta, parte afectada, síntomas)
2. Diagnóstico más probable (plaga, hongo, bacteria, deficiencia, daño físico)
3. Diagnósticos alternativos si hay ambigüedad
4. Tratamiento recomendado (preferir biodegradables de Cultyra)
5. Medidas preventivas
6. Urgencia: 🔴 Urgente (actuar en 24h) · 🟡 Moderada (esta semana) · 🟢 Leve (monitorear)

Si la foto muestra suelo: evalúa color, textura, humedad aparente, estructura.
Si muestra frutos: evalúa madurez, daños, calidad postcosecha.
Si muestra flores o raíces: evalúa estado reproductivo o sanitario.`;




// Límite simple de uso por usuario (evita que una sola cuenta agote la cuota de la API)
const IA_LIMITE_POR_HORA = 30;
const iaUsoPorUsuario = new Map(); // uid -> { conteo, expira }

function iaPermitido(uid) {
  const ahora = Date.now();
  const reg = iaUsoPorUsuario.get(uid);
  if (!reg || ahora > reg.expira) {
    iaUsoPorUsuario.set(uid, { conteo: 1, expira: ahora + 60 * 60 * 1000 });
    return true;
  }
  if (reg.conteo >= IA_LIMITE_POR_HORA) return false;
  reg.conteo++;
  return true;
}

// ---------- BASE DE DATOS ----------
const db = new DatabaseSync(path.join(__dirname, 'cultyra.db'));

// Datos generales (fincas, tareas, empleados…) como blob JSON por usuario
db.exec(`
  CREATE TABLE IF NOT EXISTS datos_usuario (
    firebase_uid TEXT PRIMARY KEY,
    datos        TEXT NOT NULL DEFAULT '{}',
    actualizado  TEXT DEFAULT (datetime('now'))
  );
`);

// Registros contables (cosechas, ventas, gastos) en tabla propia
db.exec(`
  CREATE TABLE IF NOT EXISTS registros (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    firebase_uid TEXT NOT NULL,
    finca        TEXT NOT NULL DEFAULT 'General',
    tipo         TEXT NOT NULL CHECK(tipo IN ('cosecha','venta','gasto')),
    monto        REAL NOT NULL,
    nota         TEXT DEFAULT '',
    fecha        TEXT DEFAULT (datetime('now'))
  );
`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_reg_uid ON registros(firebase_uid);`);

// ---------- APP ----------
const app = express();

// ══════════════════════════════════════════════════════
// SEGURIDAD · ISO 27001 / OWASP Top 10
// ══════════════════════════════════════════════════════

const helmet      = require('helmet');
const rateLimit   = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const morgan      = require('morgan');
const compression = require('compression');
const hpp         = require('hpp');

// 1. HTTP Security Headers (OWASP A05 · ISO 27001 A.14.1)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.anthropic.com', 'https://api.open-meteo.com'],
      frameSrc:   ["'none'"],
      objectSrc:  ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

// 2. CORS — Solo orígenes autorizados (OWASP A01)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://cultyraagro.web.app,https://cultyraagr.web.app,http://localhost:5000').split(',');
app.use(require('cors')({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origen no autorizado: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// 3. Rate Limiting — Protección contra fuerza bruta (OWASP A04 · ISO 27001 A.12.6)
const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta en 15 minutos.' },
});
const limiterIA = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 10,
  message: { error: 'Límite de solicitudes a la IA alcanzado. Espera 1 minuto.' },
});
const limiterAuth = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 20,
  message: { error: 'Demasiados intentos. Intenta en 10 minutos.' },
});
app.use(limiterGeneral);
app.use('/api/ia', limiterIA);

// 4. Parseo con límite de tamaño (OWASP A04 — DOS Prevention)
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));

// 5. Protección contra HTTP Parameter Pollution (OWASP A03)
app.use(hpp());

// 6. Compresión (mejora rendimiento, reduce superficie)
app.use(compression());

// 7. Logging de acceso estructurado (ISO 27001 A.12.4 — Audit Logs)
app.use(morgan(':date[iso] :method :url :status :res[content-length] - :response-time ms - :remote-addr'));

// 8. Cabecera de versión oculta (OWASP A05)
app.disable('x-powered-by');

// 9. Función helper de validación de Express-validator
function validar(req, res) {
  const errs = validationResult(req);
  if (!errs.isEmpty()) {
    res.status(422).json({ error: 'Datos inválidos', detalles: errs.array().map(e => e.msg) });
    return false;
  }
  return true;
}

// 10. Sanitización básica de texto (prevención XSS)
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[<>"']/g, c => ({'<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;'}[c]));
}

// ---------- VERIFICACIÓN DE TOKEN FIREBASE (sin Admin SDK) ----------
// Firebase firma los ID tokens con claves RSA publicadas por Google.
// Las descargamos una vez y las cacheamos según el encabezado Cache-Control.
let googleKeys = {}, keysExpiry = 0;

function fetchGoogleKeys() {
  return new Promise((resolve, reject) => {
    https.get(
      'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
      res => {
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
      }
    ).on('error', reject);
  });
}

async function verifyFirebaseToken(token) {
  if (!FIREBASE_PROJECT) {
    console.warn('⚠️  FIREBASE_PROJECT_ID no configurado. Token no verificado.');
    return null;
  }
  try {
    if (Date.now() >= keysExpiry || !Object.keys(googleKeys).length) {
      await fetchGoogleKeys();
    }
    const header = JSON.parse(
      Buffer.from(token.split('.')[0], 'base64url').toString()
    );
    const cert = googleKeys[header.kid];
    if (!cert) return null;
    const payload = jwt.verify(token, cert, {
      algorithms: ['RS256'],
      audience:   FIREBASE_PROJECT,
      issuer:     'https://securetoken.google.com/' + FIREBASE_PROJECT
    });
    return { uid: payload.uid || payload.sub, email: payload.email };
  } catch(e) {
    return null;
  }
}

// Middleware helper: verifica el token y responde 401 si falla
async function autenticar(req, res) {
  const auth  = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) { res.status(401).json({ error: 'Token requerido.' }); return null; }
  const u = await verifyFirebaseToken(token);
  if (!u)  { res.status(401).json({ error: 'Token inválido o expirado.' }); return null; }
  return u;
}

// ---------- IA · CHAT (CultIA) ----------
app.post('/api/ia', async (req, res) => {
  const u = await autenticar(req, res); if (!u) return;

  if (!ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'La IA no está configurada en el servidor (falta ANTHROPIC_API_KEY).' });
  }
  if (!iaPermitido(u.uid)) {
    return res.status(429).json({ error: `Límite de ${IA_LIMITE_POR_HORA} mensajes por hora alcanzado. Intenta más tarde.` });
  }

  const entrada = Array.isArray(req.body?.messages) ? req.body.messages : null;
  if (!entrada || !entrada.length) {
    return res.status(400).json({ error: 'Se requiere el campo "messages".' });
  }

  // ── Construir mensajes compatibles con la API multimodal de Anthropic ──
  // Cada mensaje puede tener: { role, content (string) } o
  // { role, content (array de bloques: text + image) }
  const messages = entrada.slice(-10).map(m => {
    const role = m.role === 'assistant' ? 'assistant' : 'user';

    // Si el mensaje trae imagen (base64)
    if (m.imagen) {
      // Validar que la imagen no sea demasiado grande (max ~4 MB base64 ≈ 3 MB real)
      if (m.imagen.length > 5_500_000) {
        return { role, content: [{ type: 'text', text: String(m.content || 'Analiza esta imagen.').slice(0, 2000) }] };
      }

      // Detectar tipo MIME de la imagen
      let mediaType = 'image/jpeg';
      if (m.imagen.startsWith('/9j/')) mediaType = 'image/jpeg';
      else if (m.imagen.startsWith('iVBORw')) mediaType = 'image/png';
      else if (m.imagen.startsWith('R0lG')) mediaType = 'image/gif';
      else if (m.imagen.startsWith('UklG')) mediaType = 'image/webp';
      if (m.mimeType) mediaType = m.mimeType;

      return {
        role,
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: m.imagen }
          },
          {
            type: 'text',
            text: String(m.content || '¿Qué ves en esta imagen? Analízala desde el punto de vista agronómico.').slice(0, 2000)
          }
        ]
      };
    }

    // Mensaje de solo texto
    return { role, content: String(m.content ?? '').slice(0, 4000) };
  });

  // ── Construir contexto personalizado de la finca del usuario (RAG) ──
  let contextoFinca = '';
  try {
    const filaUser = db.prepare('SELECT datos FROM datos_usuario WHERE firebase_uid = ?').get(u.uid);
    if (filaUser?.datos) {
      const datos = JSON.parse(filaUser.datos);

      // Fecha y hora actual en Costa Rica
      const ahora = new Date().toLocaleString('es-CR', { timeZone: 'America/Costa_Rica',
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      // Fincas
      const fincas = Array.isArray(datos.fincas) ? datos.fincas : [];
      const fincasTxt = fincas.length
        ? fincas.map(f => `• ${f.nombre} — ${f.cultivo || 'cultivo no especificado'}, ${f.area || '?'} ha, ${f.ubicacion || 'ubicación no especificada'}`).join('\n')
        : 'Sin fincas registradas.';

      // Tareas pendientes
      const tareas = Array.isArray(datos.tasks) ? datos.tasks.filter(t => !t.done) : [];
      const tareasTxt = tareas.length
        ? tareas.slice(0, 8).map(t => `• [${t.priority || 'media'}] ${t.text}${t.fecha ? ` (vence: ${t.fecha})` : ''} — Finca: ${t.finca || 'General'}`).join('\n')
        : 'Sin tareas pendientes.';

      // Empleados
      const empleados = Array.isArray(datos.empleados) ? datos.empleados : [];
      const empTxt = empleados.length
        ? empleados.map(e => `• ${e.nombre} (${e.rol || 'peón'})`).join(', ')
        : 'Sin empleados registrados.';

      // Últimos registros contables
      const registros = db.prepare(
        'SELECT tipo, monto, nota, fecha FROM registros WHERE firebase_uid = ? ORDER BY fecha DESC LIMIT 5'
      ).all(u.uid);
      const regTxt = registros.length
        ? registros.map(r => `• ${r.fecha || '?'}: ${r.tipo} ₡${Number(r.monto).toLocaleString('es-CR')}${r.nota ? ` — ${r.nota}` : ''}`).join('\n')
        : 'Sin registros contables recientes.';

      // Resumen financiero rápido
      const ventas  = registros.filter(r => r.tipo === 'venta').reduce((s, r) => s + r.monto, 0);
      const gastos  = registros.filter(r => r.tipo === 'gasto').reduce((s, r) => s + r.monto, 0);

      contextoFinca = `
════════════════════════════════
CONTEXTO PERSONAL DEL AGRICULTOR
(Usar estos datos para personalizar las respuestas)
════════════════════════════════
📅 Fecha y hora: ${ahora} (Costa Rica)
👤 Usuario: ${u.uid.slice(0, 8)}...

🌾 MIS FINCAS (${fincas.length}):
${fincasTxt}

📋 TAREAS PENDIENTES (${tareas.length}):
${tareasTxt}

👷 MI EQUIPO:
${empTxt}

💰 ÚLTIMOS MOVIMIENTOS:
${regTxt}
Ventas recientes: ₡${ventas.toLocaleString('es-CR')} | Gastos recientes: ₡${gastos.toLocaleString('es-CR')}

════════════════════════════════
Cuando el agricultor pregunte sobre "mi finca", "mis tomates", "mis empleados", etc., 
usa estos datos reales. Si menciona un nombre de finca, búscalo en la lista.
Si pregunta por finanzas, usa los registros reales.
════════════════════════════════`;
    }
  } catch(ctxErr) {
    console.warn('No se pudo cargar contexto de finca:', ctxErr.message);
  }

  // Sistema personalizado = prompt base + contexto de la finca
  const systemPersonalizado = CULTYRA_SYSTEM + contextoFinca;

  // ── Usar claude-sonnet para visión (haiku no soporta imágenes) ──
  const tieneImagen = entrada.some(m => m.imagen);
  const modelo = tieneImagen ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001';

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: modelo,
        max_tokens: 1200,
        system: systemPersonalizado,
        messages
      })
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('Error de Anthropic:', data);
      return res.status(502).json({ error: data?.error?.message || 'La IA no respondió correctamente.' });
    }
    const texto = (data.content || []).map(c => c.text || '').join('');
    res.json({ texto, modelo });
  } catch (e) {
    console.error('Error llamando a la IA:', e);
    res.status(500).json({ error: 'No se pudo conectar con la IA.' });
  }
});

// ---------- DATOS GENERALES (blob JSON: fincas, tareas, empleados…) ----------
app.get('/api/datos', async (req, res) => {
  const u = await autenticar(req, res); if (!u) return;
  // Los empleados pueden pedir los datos de su patrón pasando ?uid=patronUid
  const targetUid = req.query.uid || u.uid;
  const fila = db.prepare(
    'SELECT datos, actualizado FROM datos_usuario WHERE firebase_uid = ?'
  ).get(targetUid);
  res.json({ datos: fila?.datos ?? null, actualizado: fila?.actualizado ?? null });
});

app.put('/api/datos', async (req, res) => {
  const u = await autenticar(req, res); if (!u) return;
  const datos = JSON.stringify(req.body?.datos ?? {});
  if (datos.length > 2_000_000) return res.status(413).json({ error: 'Datos demasiado grandes (máx. 2 MB).' });
  // Validar que sea JSON válido antes de guardar
  try { JSON.parse(datos); } catch(e) { return res.status(400).json({ error: 'Formato de datos inválido.' }); }
  db.prepare(`
    INSERT INTO datos_usuario (firebase_uid, datos, actualizado)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(firebase_uid)
    DO UPDATE SET datos = excluded.datos, actualizado = datetime('now')
  `).run(u.uid, datos);
  res.json({ ok: true });
});

// ---------- REGISTROS (cosechas, ventas, gastos) ----------
app.get('/api/registros', async (req, res) => {
  const u = await autenticar(req, res); if (!u) return;
  const rows = db.prepare(
    'SELECT id, finca, tipo, monto, nota, fecha FROM registros WHERE firebase_uid = ? ORDER BY fecha DESC'
  ).all(u.uid);
  res.json(rows);
});

app.post('/api/registros',
  body('tipo').isIn(['cosecha','venta','gasto']).withMessage('Tipo inválido'),
  body('monto').isFloat({ min: 0.01, max: 99999999 }).withMessage('Monto fuera de rango'),
  body('finca').optional().isLength({ max: 120 }).trim().escape(),
  body('nota').optional().isLength({ max: 300 }).trim().escape(),
  body('fecha').optional().isISO8601().withMessage('Fecha inválida'),
  async (req, res) => {
  const u = await autenticar(req, res); if (!u) return;
  if (!validar(req, res)) return;
  const { finca, tipo, monto, nota, fecha } = req.body || {};
  const m = parseFloat(monto);
  const f = sanitize((finca || 'General').trim().substring(0, 120));
  const n = sanitize((nota  || '').trim().substring(0, 300));
  const stmt  = fecha
    ? db.prepare('INSERT INTO registros (firebase_uid,finca,tipo,monto,nota,fecha) VALUES (?,?,?,?,?,?)')
        .run(u.uid, f, tipo, m, n, String(fecha).substring(0, 25))
    : db.prepare('INSERT INTO registros (firebase_uid,finca,tipo,monto,nota) VALUES (?,?,?,?,?)')
        .run(u.uid, f, tipo, m, n);
  res.status(201).json(
    db.prepare('SELECT id,finca,tipo,monto,nota,fecha FROM registros WHERE id=?').get(stmt.lastInsertRowid)
  );
});

app.put('/api/registros/:id', async (req, res) => {
  const u = await autenticar(req, res); if (!u) return;
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido.' });
  if (!db.prepare('SELECT id FROM registros WHERE id=? AND firebase_uid=?').get(id, u.uid))
    return res.status(404).json({ error: 'Registro no encontrado o sin permiso.' });

  const { finca, tipo, monto, nota } = req.body || {};
  if (tipo && !['cosecha','venta','gasto'].includes(tipo))
    return res.status(400).json({ error: 'Tipo inválido.' });
  const m = parseFloat(monto);

  db.prepare(`UPDATE registros SET
    finca = COALESCE(?, finca),
    tipo  = COALESCE(?, tipo),
    monto = COALESCE(?, monto),
    nota  = COALESCE(?, nota)
  WHERE id = ?`).run(
    finca ? finca.trim().substring(0, 120) : null,
    tipo  || null,
    (monto !== undefined && m > 0) ? m : null,
    nota  !== undefined ? nota.trim().substring(0, 300) : null,
    id
  );
  res.json(db.prepare('SELECT id,finca,tipo,monto,nota,fecha FROM registros WHERE id=?').get(id));
});

app.delete('/api/registros/:id', async (req, res) => {
  const u = await autenticar(req, res); if (!u) return;
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido.' });
  if (!db.prepare('SELECT id FROM registros WHERE id=? AND firebase_uid=?').get(id, u.uid))
    return res.status(404).json({ error: 'No encontrado o sin permiso.' });
  db.prepare('DELETE FROM registros WHERE id=?').run(id);
  res.json({ ok: true, eliminado: id });
});

// ---------- SALUD ----------
app.get('/api/salud', (_req, res) => res.json({
  ok:        true,
  servicio:  'Cultyra Sync',
  firebase:  FIREBASE_PROJECT || '⚠️ sin configurar',
  ia:        ANTHROPIC_API_KEY ? 'configurada' : '⚠️ sin configurar (falta ANTHROPIC_API_KEY)',
  registros: db.prepare('SELECT COUNT(*) AS n FROM registros').get().n
}));

// ── 404 ───────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

// ── Error handler global (no expone detalles internos) ────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const msg    = status < 500 ? err.message : 'Error interno del servidor.';
  console.error(`[ERROR ${status}]`, err.message);
  res.status(status).json({ error: msg });
});

app.listen(PORT, () => {
  console.log('🌱 Servidor Cultyra (solo sync) en http://localhost:' + PORT);
  console.log('   Firebase Project: ' + (FIREBASE_PROJECT || '⚠️  pon FIREBASE_PROJECT_ID en las variables de entorno de Render'));
  console.log('   IA (CultIA): ' + (ANTHROPIC_API_KEY ? '✅ configurada' : '⚠️  pon ANTHROPIC_API_KEY en las variables de entorno de Render'));
  console.log('   GET|PUT  /api/datos');
  console.log('   GET|POST|PUT|DELETE  /api/registros');
  console.log('   POST /api/ia');
});
