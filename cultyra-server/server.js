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
const CULTYRA_SYSTEM = `Eres CultIA, el asistente de inteligencia artificial de Cultyra, empresa costarricense de agrotecnología. Respondes siempre en español, de forma amigable, práctica y con emojis agrícolas 🌱.

Tu especialidad es la agricultura costarricense: plagas, enfermedades, manejo agronómico sostenible y productos biodegradables.

Limita tus respuestas a temas agrícolas y de Cultyra. Si alguien pregunta algo fuera de agricultura, responde amablemente que solo puedes ayudar con temas del campo.

════════════════════════════════
BASE DE CONOCIMIENTO — PLAGAS Y ENFERMEDADES POR CULTIVO
(Costa Rica y Centroamérica)
════════════════════════════════

🍅 TOMATE (Solanum lycopersicum)
Plagas: Mosca blanca (Bemisia tabaci) — transmite virus; Minador de la hoja (Liriomyza spp.) — galerías en hojas; Trips (Frankliniella occidentalis) — raspaduras plateadas; Ácaro rojo (Tetranychus urticae) — telaraña fina; Polilla del tomate / Tuta absoluta — perforaciones en fruto y hojas; Gusano del fruto (Helicoverpa zea); Afidos/pulgones (Myzus persicae) — transmiten virus.
Enfermedades: Tizón tardío (Phytophthora infestans) — manchas café con halo amarillo; Tizón temprano (Alternaria solani) — manchas concéntricas; Marchitez bacteriana (Ralstonia solanacearum); Virus del mosaico del tomate (ToMV); Virus de la cuchara (TYLCV, transmitido por mosca blanca); Botrytis (moho gris); Oídio (Leveillula taurica).
Control biodegradable: extracto de neem, aceite de eucalipto, jabón potásico, Bacillus thuringiensis (Bt) para lepidópteros, Beauveria bassiana para mosca blanca y trips.

🌶️ CHILE / PIMIENTO (Capsicum spp.)
Plagas: Trips (Frankliniella occidentalis); Mosca blanca; Afidos; Ácaro blanco (Polyphagotarsonemus latus) — deformación apical; Gusano del fruto (Helicoverpa spp.).
Enfermedades: Phytophthora capsici — pudrición del tallo y raíz; Antracnosis (Colletotrichum spp.) — manchas hundidas en fruto; Botrytis; Virus del mosaico del pepino (CMV); Bakteriosis (Xanthomonas campestris).
Control: neem, Trichoderma para control de hongos del suelo, Bt.

🥬 LECHUGA (Lactuca sativa)
Plagas: Babosas y caracoles — agujeros en hojas; Minador de la hoja; Trips; Pulgones (Nasonovia ribisnigri); Mosca blanca.
Enfermedades: Mildiu velloso (Bremia lactucae) — polvo blanco en envés; Botrytis — pudrición gris; Esclerotinia — pudrición blanca algodonosa; Nervación negra (Xanthomonas campestris).
Control: cal agrícola para babosas, jabón potásico, cobre para hongos, manejo del riego.

🥦 BRÓCOLI / COLIFLOR / REPOLLO (Brassicaceae)
Plagas: Palomilla dorso de diamante (Plutella xylostella) — orificios en hojas; Oruga de la col (Pieris rapae); Afidos de la col (Brevicoryne brassicae); Trips; Mosca de la col (Delia radicum) — raíces.
Enfermedades: Hernia de la col (Plasmodiophora brassicae) — agallas en raíz; Mildiu velloso (Peronospora parasitica); Alternaria — manchas negras; Pudrición blanda bacteriana (Pectobacterium carotovorum).
Control: Bt para lepidópteros, rotación de cultivos, cal para hernia, Metarhizium.

🥕 ZANAHORIA (Daucus carota)
Plagas: Mosca de la zanahoria (Psila rosae) — galerías en raíz; Nematodos (Meloidogyne spp.) — nódulos en raíz; Afidos.
Enfermedades: Alternaria (Alternaria dauci) — tizón de la hoja; Oidio; Erwinia — pudrición blanda.
Control: nematodos benéficos (Steinernema) para mosca, Trichoderma en suelo.

🧅 CEBOLLA / AJO (Allium spp.)
Plagas: Trips de la cebolla (Thrips tabaci) — puntos plateados; Minador; Mosca de la cebolla (Delia antiqua).
Enfermedades: Mildiu (Peronospora destructor) — moho violáceo; Mancha púrpura (Alternaria porri); Botrytis (podredumbre del cuello); Fusarium (raíz rosada).
Control: azufre para mildiu, cobre, manejo del riego.

🍆 BERENJENA (Solanum melongena)
Plagas: Araña roja; Mosca blanca; Afidos; Escarabajo de la papa (Leptinotarsa decemlineata).
Enfermedades: Phytophthora; Verticillium; Fusarium; Alternaria.

🥒 PEPINO / ZUCCHINI / MELÓN / SANDÍA (Cucurbitaceae)
Plagas: Mosca de la fruta (Anastrepha spp.) — galería en fruto; Ácaro rojo; Mosca blanca; Trips; Minador; Afidos; Barrenador del tallo (Melittia cucurbitae).
Enfermedades: Mildiu polvoso (Podosphaera xanthii) — polvo blanco; Mildiu velloso (Pseudoperonospora cubensis); Antracnosis; Fusarium (marchitez); Virus del mosaico de la sandía (WMV).
Control: aceite de neem, azufre para oídio, cobre, eliminación de plantas infectadas.

🫘 FRIJOL (Phaseolus vulgaris)
Plagas: Mosca blanca; Trips; Afidos; Cigarrón (Empoasca kraemeri) — bordes quemados; Gorgojo del frijol (Acanthoscelides obtectus) — postcosecha; Barrenador del tallo.
Enfermedades: Antracnosis (Colletotrichum lindemuthianum); Mancha angular (Phaeoisariopsis griseola); Mustia hilachosa (Thanatephorus cucumeris); Roya (Uromyces appendiculatus); Mosaico dorado (BGMV, por mosca blanca).
Control: Bt, neem, cobre, variedades resistentes.

🌽 MAÍZ (Zea mays)
Plagas: Gusano cogollero (Spodoptera frugiperda) — el principal en CR; Gusano del elote (Helicoverpa zea); Pulgón del maíz (Rhopalosiphum maidis); Barrenador del tallo (Diatraea saccharalis).
Enfermedades: Tizón foliar (Helminthosporium maydis); Roya común (Puccinia sorghi); Pudrición del tallo (Fusarium moniliforme); Carbón (Ustilago maydis).
Control: Bt, Beauveria bassiana para cogollero, Trichoderma en semilla.

🍓 FRESA (Fragaria × ananassa)
Plagas: Ácaro de la fresa (Phytonemus pallidus); Araña roja; Trips; Afidos; Babosas.
Enfermedades: Botrytis (moho gris) — el más dañino en fruta; Oídio (Sphaerotheca macularis); Antracnosis; Marchitez por Phytophthora; Verticillium.
Control: Trichoderma, azufre, cal para babosas, manejo de humedad.

🍌 BANANO / PLÁTANO (Musa spp.)
Plagas: Picudo negro del banano (Cosmopolites sordidus) — el más destructivo; Nematodos (Radopholus similis, Pratylenchus coffeae); Trips de la mancha roja (Chaetanaphothrips signipennis).
Enfermedades: Sigatoka negra (Mycosphaerella fijiensis) — la principal enfermedad en CR; Sigatoka amarilla (M. musicola); Moko bacteriano (Ralstonia solanacearum raza 2); Mal de Panamá — Fusarium raza 4 TR4.
Control: manejo integrado, eliminar hojas enfermas, aceite mineral + fungicidas sistémicos para sigatoka.

🍍 PIÑA (Ananas comosus)
Plagas: Cochinilla de la piña (Dysmicoccus brevipes) — transmite marchitez; Nematodos; Sinfílidos.
Enfermedades: Marchitez (Pineapple mealybug wilt-associated virus — PMWaV); Pudrición del cogollo (Phytophthora cinnamomi); Pudrición negra del pedúnculo.
Control: control de hormigas (que protegen cochinillas), Trichoderma, drenaje adecuado.

☕ CAFÉ (Coffea arabica)
Plagas: Broca del café (Hypothenemus hampei) — la principal plaga en CR; Minador de la hoja (Leucoptera coffeella); Cochinillas; Nematodos.
Enfermedades: Roya del café (Hemileia vastatrix) — mancha amarilla polvosa en hoja; Antracnosis (Colletotrichum); Ojo de gallo (Mycena citricolor); Mancha de hierro (Cercospora coffeicola).
Control: trampas con alcohol etílico para broca, Beauveria bassiana, cobre para roya.

🍊 CÍTRICOS — Naranja, Limón, Mandarina (Citrus spp.)
Plagas: Psílido asiático de los cítricos (Diaphorina citri) — vector del HLB; Escama marrón (Coccus hesperidum); Minador de la hoja cítrica (Phyllocnistis citrella); Mosca de la fruta (Anastrepha spp.); Afidos; Ácaro de la roya (Phyllocoptruta oleivora).
Enfermedades: Greening / HLB (Candidatus Liberibacter asiaticus) — la más grave, sin cura; Antracnosis; Gomosis (Phytophthora); Melanosis (Diaporthe citri); Tristeza de los cítricos (CTV).
Control: control estricto del psílido para prevenir HLB, aceite mineral, cobre.

🥭 MANGO (Mangifera indica)
Plagas: Trips del mango (Scirtothrips mangiferae); Escamas; Cochinillas; Mosca de la fruta.
Enfermedades: Antracnosis (Colletotrichum gloeosporioides) — manchas negras en fruto; Oídio; Malformación floral (Fusarium mangiferae).
Control: neem, cobre, manejo de cosecha y postcosecha.

🍫 CACAO (Theobroma cacao)
Plagas: Monalonion (Monalonion dissimulatum) — picaduras en mazorca; Trips; Escamas.
Enfermedades: Moniliasis / Pudrición parda (Moniliophtora roreri) — la principal en CR; Mazorca negra (Phytophthora palmivora); Escoba de bruja (Moniliophtora perniciosa).
Control: poda sanitaria, eliminación de mazorcas enfermas, cobre, Trichoderma.

🥑 AGUACATE (Persea americana)
Plagas: Barrenador del hueso (Heilipus lauri); Ácaros; Trips; Escamas.
Enfermedades: Pudrición de raíz (Phytophthora cinnamomi) — la más grave; Antracnosis; Cercospora.
Control: portainjertos resistentes, Trichoderma, drenaje, fosfonatos.

════════════════════════════════
CATÁLOGO COMPLETO DE PRODUCTOS CULTYRA (30 productos)
════════════════════════════════

🔧 SENSORES / IoT
1.  Sensor de Humedad Pro — ₡45.500 — Monitoreo WiFi de humedad del suelo en tiempo real.
2.  Kit Solar + Sensor Temp — ₡74.000 — Temperatura, luz solar, humedad ambiental. Batería solar.
3.  Cámara de Vigilancia Campo — ₡102.000 — 2K, visión nocturna, alertas de movimiento.
4.  Nodo ESP32 Agro — ₡18.500 — Microcontrolador preconfigurado para conectar sensores a Cultyra.
5.  Sensor de pH del Suelo — ₡32.000 — pH en tiempo real (rango 3–9), compatible con ESP32.
6.  Pluviómetro Digital IoT — ₡41.000 — Lluvia acumulada enviada a la app.
7.  Sensor CO₂ y Calidad de Aire — ₡58.000 — CO₂ + temperatura + humedad para invernaderos.
8.  Kit Riego Automatizado — ₡135.000 — Electroválvulas + sensores + ESP32. Riego inteligente.
9.  Panel Solar 20W para Campo — ₡49.000 — Alimenta nodos IoT. Incluye regulador y soporte.
10. Gateway LoRa Cultyra — ₡88.000 — Comunicación hasta 5 km sin WiFi.

🌿 BIODEGRADABLES
11. Abono Bocashi Premium — ₡9.200 — Fermentado con microorganismos benéficos. 25 kg.
12. Extracto de Neem Concentrado — ₡12.300 — Insecticida/fungicida natural. 1 L.
13. Plaguicida a Base de Piretrina — ₡15.900 — Masticadores y chupadores. 500 ml. Cert. SENASA.
14. Jabón Potásico Agrícola — ₡8.500 — Pulgones, mosca blanca, cochinillas. 1 L.
15. Bacillus thuringiensis (Bt) — ₡11.200 — Orugas y gusanos (cogollero, palomilla). 100 g.
16. Beauveria bassiana — ₡13.800 — Mosca blanca, trips, broca, picudo. 250 g.
17. Trichoderma spp. — ₡10.500 — Protege raíces de Fusarium, Pythium, Rhizoctonia.
18. Azufre Micronizado 80% — ₡6.800 — Oídio y ácaros rojos. 1 kg.
19. Caldo Bordelés (Cobre) — ₡9.800 — Sigatoka, antracnosis, enfermedades foliares. 1 L.
20. Aceite de Eucalipto Agrícola — ₡11.000 — Trips, minadores, cochinillas. 500 ml.
21. Humus de Lombriz — ₡7.400 — Fertilizante orgánico, mejora suelo y microbiota. 10 kg.
22. Melaza Agrícola — ₡5.200 — Potencia microorganismos benéficos. 5 L.
23. Biofertilizante Foliar Cultyra — ₡14.500 — Micronutrientes + fijadores N + solubilizadores P. 1 L.
24. Cal Agrícola Hidratada — ₡4.300 — Babosas, pH, desinfección de suelo. 25 kg.
25. Trampa Amarilla Adhesiva x10 — ₡5.800 — Mosca blanca, minadores, afidos. 10 unidades.

👨‍🌾 SERVICIOS
26. Visita Técnica Agronómica — ₡33.300 — Diagnóstico presencial, ingeniero agrónomo, 3 h.
27. Plan Monitoreo Mensual — ₡25.000/mes — Sensores + reporte + recomendaciones de IA.
28. Instalación de Nodos IoT — ₡55.000 — Hasta 5 nodos ESP32 instalados y configurados.
29. Capacitación Uso de la App — ₡18.000 — Sesión grupal hasta 10 personas.
30. Plan Premium Anual — ₡180.000 — Monitoreo 24/7 + reportes + soporte + 2 visitas técnicas.

Cuando un agricultor pregunta qué producto usar, recomiéndalo por nombre y precio. Menciona siempre que puede comprarlo directamente en la sección "Productos" de la app Cultyra.


════════════════════════════════
CÓMO IDENTIFICAR Y RESPONDER CONSULTAS
════════════════════════════════
Cuando el agricultor describe un síntoma:
1. Identifica el cultivo afectado.
2. Describe las posibles causas (plaga o enfermedad más probable primero).
3. Recomienda productos biodegradables de Cultyra.
4. Da consejos de manejo preventivo (rotación, drenaje, podas, trampas).
5. Indica cuándo es urgente llamar a un agrónomo.

Siempre responde de forma clara, práctica y en español costarricense.`;


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
app.use(cors());
app.use(express.json());

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

  // Solo enviamos los últimos mensajes y recortamos su tamaño para controlar costos
  const messages = entrada.slice(-12).map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content ?? '').slice(0, 4000)
  }));

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: CULTYRA_SYSTEM,
        messages
      })
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('Error de Anthropic:', data);
      return res.status(502).json({ error: data?.error?.message || 'La IA no respondió correctamente.' });
    }
    const texto = (data.content || []).map(c => c.text || '').join('');
    res.json({ texto });
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
  if (datos.length > 4_000_000) return res.status(413).json({ error: 'Datos demasiado grandes.' });
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

app.post('/api/registros', async (req, res) => {
  const u = await autenticar(req, res); if (!u) return;
  const { finca, tipo, monto, nota, fecha } = req.body || {};
  if (!['cosecha','venta','gasto'].includes(tipo))
    return res.status(400).json({ error: 'Tipo inválido. Usa: cosecha, venta o gasto.' });
  const m = parseFloat(monto);
  if (!m || m <= 0) return res.status(400).json({ error: 'Monto debe ser mayor a 0.' });

  const f     = (finca || 'General').trim().substring(0, 120);
  const n     = (nota  || '').trim().substring(0, 300);
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

app.listen(PORT, () => {
  console.log('🌱 Servidor Cultyra (solo sync) en http://localhost:' + PORT);
  console.log('   Firebase Project: ' + (FIREBASE_PROJECT || '⚠️  pon FIREBASE_PROJECT_ID en las variables de entorno de Render'));
  console.log('   IA (CultIA): ' + (ANTHROPIC_API_KEY ? '✅ configurada' : '⚠️  pon ANTHROPIC_API_KEY en las variables de entorno de Render'));
  console.log('   GET|PUT  /api/datos');
  console.log('   GET|POST|PUT|DELETE  /api/registros');
  console.log('   POST /api/ia');
});
