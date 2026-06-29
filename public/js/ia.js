// ============================================================
// CULTYRA · CultIA — Asistente Agronómico Multimodal
// Texto + Visión (fotos de plantas, plagas, suelo)
// ============================================================

let iaHistorial = [];
let imagenPendiente = null;

function getTime() {
  return new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });
}

// ── Llamada al backend ──────────────────────────────────────────
async function callCultyraIA(messages) {
  const token = await getToken();
  if (!token) throw new Error('Debés iniciar sesión para usar la IA.');
  const response = await fetch(API_URL + '/api/ia', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ messages })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'La IA no respondió correctamente.');
  return data.texto || '';
}

// ── Procesar imagen seleccionada ────────────────────────────────
function procesarImagenIA(input) {
  const file = input.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { toast('Solo se permiten imágenes (JPG, PNG, WEBP).', 'error'); return; }
  if (file.size > 4 * 1024 * 1024) { toast('La imagen es demasiado grande (máx. 4 MB).', 'error'); input.value = ''; return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    const full = e.target.result;
    imagenPendiente = { base64: full.split(',')[1], mimeType: file.type, preview: full };
    mostrarPreviewImagen(full, file.name);
    toast('📸 Imagen lista. Enviá directamente o agregá un mensaje.');
  };
  reader.readAsDataURL(file);
}

function mostrarPreviewImagen(src, nombre) {
  const prev = document.getElementById('ia-img-preview');
  if (!prev) return;
  prev.innerHTML = `
    <div style="position:relative;display:inline-block;margin:8px 0">
      <img src="${src}" alt="${nombre}" style="max-height:140px;max-width:100%;border-radius:10px;border:2px solid rgba(52,199,89,0.4);display:block">
      <button onclick="cancelarImagenIA()" style="position:absolute;top:-8px;right:-8px;background:#ef4444;border:none;color:#fff;width:22px;height:22px;border-radius:50%;cursor:pointer;font-size:14px;line-height:22px;text-align:center;font-weight:700">×</button>
      <div style="font-size:11px;color:var(--green-bright);margin-top:4px;text-align:center">📸 ${nombre.length > 20 ? nombre.substring(0,20)+'...' : nombre}</div>
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

// ── Agregar mensaje al chat ─────────────────────────────────────
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

function setTyping(show) {
  const t = document.getElementById('typing');
  if (t) t.style.display = show ? 'flex' : 'none';
}

// ── Enviar mensaje ──────────────────────────────────────────────
async function sendMessage() {
  const input = document.getElementById('chat-input');
  const texto = (input?.value || '').trim();
  if (!texto && !imagenPendiente) return;

  const sugg = document.getElementById('ia-suggestions');
  if (sugg) sugg.style.display = 'none';

  if (input) input.disabled = true;
  const sendBtn = document.querySelector('.chat-send');
  if (sendBtn) sendBtn.disabled = true;

  // Mostrar mensaje del usuario
  let htmlUser = '';
  if (imagenPendiente) htmlUser += `<img src="${imagenPendiente.preview}" alt="foto" style="max-width:100%;max-height:180px;border-radius:10px;display:block;margin-bottom:6px">`;
  if (texto) htmlUser += escapeHtml(texto);
  if (!htmlUser) htmlUser = '📸 <em>Imagen enviada para análisis</em>';
  appendMsg('user', htmlUser);
  if (input) input.value = '';

  const msgUsuario = {
    role: 'user',
    content: texto || 'Analiza esta imagen agronómicamente.',
    ...(imagenPendiente ? { imagen: imagenPendiente.base64, mimeType: imagenPendiente.mimeType } : {})
  };
  iaHistorial.push(msgUsuario);
  cancelarImagenIA();

  setTyping(true);
  try {
    const respuesta = await callCultyraIA(iaHistorial);
    setTyping(false);
    iaHistorial.push({ role: 'assistant', content: respuesta });
    appendMsg('assistant', formatIAResponse(respuesta));
  } catch(e) {
    setTyping(false);
    appendMsg('assistant', `<span style="color:#f87171">⚠️ ${escapeHtml(e.message)}</span><br><small style="color:var(--text-light)">Verificá tu conexión o intentá de nuevo.</small>`);
  }

  if (input) input.disabled = false;
  if (sendBtn) sendBtn.disabled = false;
  if (input) input.focus();
}

// ── Formatear respuesta de la IA ────────────────────────────────
function formatIAResponse(texto) {
  return escapeHtml(texto)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:rgba(52,199,89,0.12);padding:1px 5px;border-radius:4px;font-size:0.9em">$1</code>')
    .replace(/^#{1,3} (.+)$/gm, '<strong style="font-size:1.05em;color:var(--green-bright)">$1</strong>')
    .replace(/^[-•] (.+)$/gm, '<span style="display:block;padding-left:12px">• $1</span>')
    .replace(/\n{2,}/g, '<br><br>')
    .replace(/\n/g, '<br>')
    .replace(/🔴/g, '<span style="color:#ef4444">🔴</span>')
    .replace(/🟡/g, '<span style="color:#f59e0b">🟡</span>')
    .replace(/🟢/g, '<span style="color:#22c55e">🟢</span>');
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function preguntaRapida(texto) {
  const input = document.getElementById('chat-input');
  if (input) input.value = texto;
  sendMessage();
}

function sendSuggestion(texto) { preguntaRapida(texto); }

// ── Nueva conversación ──────────────────────────────────────────
function nuevaConversacionIA() {
  iaHistorial = [];
  cancelarImagenIA();
  const cont = document.getElementById('chat-messages');
  if (!cont) return;
  cont.innerHTML = '';
  const bienvenida = document.createElement('div');
  bienvenida.className = 'msg assistant';
  bienvenida.innerHTML = `<div class="msg-bubble">¡Hola! Soy <strong>CultIA</strong> 🌱 — tu asistente agronómico con visión artificial.<br><br>
    📸 <strong>Analizá fotos</strong> de plantas, plagas, enfermedades o suelo<br>
    🌍 <strong>Agricultura de Costa Rica y el mundo</strong> (más de 50 cultivos)<br>
    🐛 <strong>Diagnóstico de plagas</strong> con nivel de urgencia 🔴🟡🟢<br><br>
    ¿Qué necesitás hoy?</div><span class="msg-time">${getTime()}</span>`;
  cont.appendChild(bienvenida);
  const typing = document.createElement('div');
  typing.className = 'typing-indicator'; typing.id = 'typing'; typing.style.display = 'none';
  typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
  cont.appendChild(typing);
  const sugg = document.getElementById('ia-suggestions');
  if (sugg) sugg.style.display = 'flex';
  const inp = document.getElementById('chat-input');
  if (inp) inp.value = '';
  toast('Nueva conversación iniciada 🌱');
}

// ── Chips dinámicos basados en la finca ─────────────────────────
function actualizarChipsFinca() {
  const chipsEl = document.getElementById('ia-chips');
  if (!chipsEl) return;
  const finca1 = typeof fincas !== 'undefined' ? fincas[0] : null;
  const tarea1 = typeof tasks !== 'undefined' ? tasks.find(t => !t.done) : null;
  const chips = [
    finca1 ? { icon:'🌾', texto:`¿Qué plagas afectan el ${finca1.cultivo || 'cultivo'} en ${finca1.ubicacion || 'esta zona'}?` }
           : { icon:'🌾', texto:'¿Cuáles plagas son más comunes en Costa Rica?' },
    { icon:'📸', texto:'Voy a subir una foto de mi cultivo para que la analicés' },
    tarea1 ? { icon:'📋', texto:`Tengo pendiente: "${tarea1.text.slice(0,40)}". ¿Algún consejo?` }
           : { icon:'📋', texto:'¿Qué tareas agrícolas debería hacer esta semana?' },
    { icon:'💧', texto:'¿Cada cuánto tiempo se riegan los cultivos tropicales?' },
    { icon:'🐛', texto:'¿Cómo controlo plagas con productos biodegradables?' },
    { icon:'💰', texto:'¿Cuándo es mejor momento para cosechar y vender?' },
  ];
  chipsEl.innerHTML = chips.map(c =>
    `<button class="ia-chip" onclick="preguntaRapida('${c.texto.replace(/'/g,"\\'")}')">${c.icon} ${c.texto.length > 40 ? c.texto.slice(0,40)+'…' : c.texto}</button>`
  ).join('');
}
