// ============================================================
// CULTYRA · IA — Multimodal (texto + visión)
// ============================================================

// La IA corre a través del backend de Cultyra (cultyra-server).
// Soporta: texto, imágenes de cámara y galería.
// Modelo: claude-haiku (texto) · claude-sonnet (visión)

async function callCultyraIA(messages) {
  const token = await getToken();
  if (!token) throw new Error('Debes iniciar sesión para usar la IA.');

  const response = await fetch(API_URL + '/api/ia', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ messages })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'La IA no respondió correctamente.');
  return data.texto || '';
}

// ── Estado del chat ───────────────────────────────────────────
let iaHistorial = [];
let imagenPendiente = null; // { base64, mimeType, preview }

// ── Utilidades de tiempo ──────────────────────────────────────
function getTime() {
  return new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });
}

// ── Procesar imagen desde input file ─────────────────────────
function procesarImagenIA(input) {
  const file = input.files?.[0];
  if (!file) return;

  // Validar tipo
  if (!file.type.startsWith('image/')) {
    toast('Solo se permiten imágenes (JPG, PNG, WEBP).', 'error');
    return;
  }
  // Validar tamaño (max 4 MB)
  if (file.size > 4 * 1024 * 1024) {
    toast('La imagen es demasiado grande (máx. 4 MB). Intentá con una foto más pequeña.', 'error');
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const fullData = e.target.result; // data:image/jpeg;base64,...
    const base64   = fullData.split(',')[1];
    const mimeType = file.type;
    imagenPendiente = { base64, mimeType, preview: fullData };
    mostrarPreviewImagen(fullData, file.name);
    toast('📸 Imagen lista. Agregá un mensaje o enviá directamente para analizarla.');
  };
  reader.readAsDataURL(file);
}

// ── Mostrar preview de imagen antes de enviar ─────────────────
function mostrarPreviewImagen(src, nombre) {
  const prev = document.getElementById('ia-img-preview');
  if (!prev) return;
  prev.innerHTML = `
    <div style="position:relative;display:inline-block;margin:8px 0">
      <img src="${src}" alt="${nombre}" style="max-height:150px;max-width:100%;border-radius:12px;border:2px solid rgba(52,199,89,0.4);display:block">
      <button onclick="cancelarImagenIA()" title="Quitar imagen"
        style="position:absolute;top:-8px;right:-8px;background:#ef4444;border:none;color:#fff;width:22px;height:22px;border-radius:50%;cursor:pointer;font-size:14px;line-height:22px;text-align:center;font-weight:700">×</button>
      <div style="font-size:11px;color:var(--green-bright);margin-top:4px;text-align:center">📸 ${nombre}</div>
    </div>`;
  prev.style.display = 'block';
}

function cancelarImagenIA() {
  imagenPendiente = null;
  const prev = document.getElementById('ia-img-preview');
  if (prev) { prev.innerHTML = ''; prev.style.display = 'none'; }
  const inp = document.getElementById('ia-foto-input');
  if (inp) inp.value = '';
}

// ── Agregar mensaje al chat UI ────────────────────────────────
function appendMsg(role, html, tiempo) {
  const cont = document.getElementById('chat-messages');
  if (!cont) return;
  const typing = document.getElementById('typing');

  const div = document.createElement('div');
  div.className = 'msg ' + role;
  div.innerHTML = `<div class="msg-bubble">${html}</div><span class="msg-time">${tiempo || getTime()}</span>`;

  if (typing) cont.insertBefore(div, typing);
  else cont.appendChild(div);
  cont.scrollTop = cont.scrollHeight;
}

// ── Mostrar/ocultar indicador de escritura ────────────────────
function setTyping(show) {
  const t = document.getElementById('typing');
  if (t) t.style.display = show ? 'flex' : 'none';
}

// ── Enviar mensaje principal ──────────────────────────────────
async function sendMessage() {
  const input = document.getElementById('chat-input');
  const texto = (input?.value || '').trim();

  if (!texto && !imagenPendiente) return;

  // Ocultar chips de sugerencias
  const sugg = document.getElementById('ia-suggestions');
  if (sugg) sugg.style.display = 'none';

  // Deshabilitar input mientras procesa
  if (input) input.disabled = true;
  const sendBtn = document.querySelector('.chat-send');
  if (sendBtn) sendBtn.disabled = true;

  // ── Mostrar mensaje del usuario en el chat ──────────────────
  let htmlUser = '';
  if (imagenPendiente) {
    htmlUser += `<img src="${imagenPendiente.preview}" alt="foto" style="max-width:100%;max-height:200px;border-radius:10px;display:block;margin-bottom:6px">`;
  }
  if (texto) htmlUser += escapeHtml(texto);
  if (!htmlUser) htmlUser = '📸 <em>Imagen enviada para análisis</em>';

  appendMsg('user', htmlUser);
  if (input) input.value = '';

  // ── Construir mensaje para historial ──────────────────────────
  const msgUsuario = {
    role: 'user',
    content: texto || 'Analiza esta imagen agronómicamente.',
    ...(imagenPendiente ? { imagen: imagenPendiente.base64, mimeType: imagenPendiente.mimeType } : {})
  };
  iaHistorial.push(msgUsuario);

  // Limpiar preview
  cancelarImagenIA();

  // ── Llamar a la IA ────────────────────────────────────────────
  setTyping(true);
  try {
    const respuesta = await callCultyraIA(iaHistorial);
    setTyping(false);

    iaHistorial.push({ role: 'assistant', content: respuesta });

    // Formatear respuesta con markdown básico
    const html = formatIAResponse(respuesta);
    appendMsg('assistant', html);
  } catch (e) {
    setTyping(false);
    appendMsg('assistant',
      `<span style="color:#f87171">⚠️ ${escapeHtml(e.message)}</span><br><small style="color:var(--text-light)">Verificá tu conexión o intentá de nuevo.</small>`
    );
  }

  if (input) input.disabled = false;
  if (sendBtn) sendBtn.disabled = false;
  if (input) input.focus();
}

// ── Formateo básico de markdown de la IA ─────────────────────
function formatIAResponse(texto) {
  return escapeHtml(texto)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:rgba(52,199,89,0.12);padding:1px 5px;border-radius:4px;font-size:0.9em">$1</code>')
    .replace(/^#{1,3} (.+)$/gm, '<strong style="font-size:1.05em;color:var(--green-bright)">$1</strong>')
    .replace(/^• (.+)$/gm, '<span style="display:block;padding-left:12px">• $1</span>')
    .replace(/^- (.+)$/gm, '<span style="display:block;padding-left:12px">• $1</span>')
    .replace(/\n{2,}/g, '</p><p style="margin:6px 0">')
    .replace(/\n/g, '<br>')
    .replace(/🔴/g, '<span style="color:#ef4444">🔴</span>')
    .replace(/🟡/g, '<span style="color:#f59e0b">🟡</span>')
    .replace(/🟢/g, '<span style="color:#22c55e">🟢</span>');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Chips de sugerencia ───────────────────────────────────────
function sendSuggestion(texto) {
  const input = document.getElementById('chat-input');
  if (input) input.value = texto;
  sendMessage();
}

function preguntaRapida(texto) {
  const input = document.getElementById('chat-input');
  if (input) input.value = texto;
  sendMessage();
}

// ── Nueva conversación ────────────────────────────────────────
function nuevaConversacionIA() {
  iaHistorial = [];
  imagenPendiente = null;
  cancelarImagenIA();

  const cont = document.getElementById('chat-messages');
  if (!cont) return;
  cont.innerHTML = '';

  const bienvenida = document.createElement('div');
  bienvenida.className = 'msg assistant';
  bienvenida.innerHTML = `
    <div class="msg-bubble">
      ¡Hola! Soy <strong>CultIA</strong> 🌱 — tu asistente agronómico con visión artificial.<br><br>
      Puedo ayudarte con:<br>
      📸 <strong>Analizar fotos</strong> de plantas, plagas, enfermedades o suelo<br>
      🌍 <strong>Consultas agrícolas</strong> de Costa Rica y el mundo<br>
      🐛 <strong>Diagnóstico de plagas</strong> y recomendaciones biodegradables<br><br>
      ¿Qué necesitás hoy?
    </div>
    <span class="msg-time">${getTime()}</span>`;
  cont.appendChild(bienvenida);

  const typing = document.createElement('div');
  typing.className = 'typing-indicator';
  typing.id = 'typing';
  typing.style.display = 'none';
  typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
  cont.appendChild(typing);

  // Mostrar chips nuevamente
  const sugg = document.getElementById('ia-suggestions');
  if (sugg) sugg.style.display = 'flex';

  const inp = document.getElementById('chat-input');
  if (inp) inp.value = '';

  toast('Nueva conversación iniciada 🌱');
}

// ── Sugerencias dinámicas basadas en la finca del usuario ──
function actualizarChipsFinca() {
  const chipsEl = document.getElementById('ia-chips');
  if (!chipsEl) return;

  const finca1 = fincas?.[0];
  const tarea1 = tasks?.find(t => !t.done);
  const hoy = new Date().toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long' });

  const chips = [
    finca1
      ? { icon: '🌾', texto: `¿Qué plagas afectan el ${finca1.cultivo || 'cultivo'} en ${finca1.ubicacion || 'esta zona'}?` }
      : { icon: '🌾', texto: '¿Cuáles plagas son más comunes en Costa Rica?' },
    tarea1
      ? { icon: '📋', texto: `Tengo pendiente: "${tarea1.text.slice(0, 40)}". ¿Algún consejo?` }
      : { icon: '📋', texto: '¿Qué tareas agrícolas debería hacer esta semana?' },
    finca1
      ? { icon: '💧', texto: `¿Debería regar hoy ${finca1.nombre || 'mi finca'}?` }
      : { icon: '💧', texto: '¿Cada cuánto tiempo se riegan los cultivos tropicales?' },
    { icon: '📸', texto: 'Voy a subir una foto de mi cultivo para que lo analicés' },
    { icon: '🌡️', texto: '¿Qué temperatura ideal necesita mi cultivo?' },
    { icon: '🐛', texto: '¿Cómo controlo plagas con productos biodegradables?' },
    { icon: '💰', texto: '¿Cuándo es mejor momento para cosechar y vender?' },
    { icon: '🌍', texto: '¿Qué diferencia hay entre agricultura orgánica y convencional?' },
  ];

  chipsEl.innerHTML = chips.map(c =>
    `<button class="ia-chip" onclick="preguntaRapida('${c.texto.replace(/'/g, "\\'")}')">${c.icon} ${c.texto.length > 45 ? c.texto.slice(0, 45) + '…' : c.texto}</button>`
  ).join('');
}

// Actualizar chips cuando se carga la sección IA
// (se llama desde showSection en ui.js)
function initIASection() {
  actualizarChipsFinca();
  // Mostrar indicador de personalización si hay fincas
  const badge = document.getElementById('ia-personalizacion');
  if (badge) {
    if (fincas?.length > 0) {
      badge.textContent = `🌾 Personalizada para ${fincas.length} finca(s)`;
      badge.style.display = 'inline-block';
    } else {
      badge.textContent = '⚡ Agregá tu finca para respuestas personalizadas';
      badge.style.display = 'inline-block';
    }
  }
}
