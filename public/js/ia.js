// ============================================================
// CULTYRA · IA
// ============================================================

// La IA corre a través del backend de Cultyra (cultyra-server), que
// guarda la clave de Anthropic de forma segura y la usa para responder.
// El navegador NUNCA debe tener la clave de la API.
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

let chatHistory = [];

function getTime() {
  return new Date().toLocaleTimeString('es-CR', {hour:'2-digit', minute:'2-digit'});
}

function appendMsg(role, text) {
  const container = document.getElementById('chat-messages');
  const typing = document.getElementById('typing');
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.innerHTML = `<div class="msg-bubble">${text.replace(/\n/g,'<br>')}</div><span class="msg-time">${getTime()}</span>`;
  container.insertBefore(div, typing);
  container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if(!text) return;
  input.value = '';
  appendMsg('user', text);
  chatHistory.push({role:'user', content:text});
  document.getElementById('typing').style.display='flex';
  document.getElementById('chat-messages').scrollTop = 99999;
  document.getElementById('ia-suggestions').style.display='none';
  try {
    const reply = await callCultyraIA(chatHistory);
    document.getElementById('typing').style.display='none';
    appendMsg('assistant', reply);
    chatHistory.push({role:'assistant', content:reply});
  } catch(e) {
    document.getElementById('typing').style.display='none';
    const local = respuestaLocal(text);
    appendMsg('assistant', local + '\n\n_📡 (Modo sin conexión: respondí con la base de conocimiento local de Cultyra. La IA en línea no está disponible en este momento.)_');
    chatHistory.push({role:'assistant', content:local});
  }
}

// ===== BASE DE CONOCIMIENTO LOCAL (respaldo cuando la IA en línea falla) =====
function respuestaLocal(q) {
  q = q.toLowerCase();
  const R = [
    [['papa','tizón'], '🥔 **Papa (zonas altas):** Siembre entre 2,000–3,400 msnm. El mayor riesgo es el tizón tardío (Phytophthora infestans) en época lluviosa: use variedades tolerantes (Floresta, Única), rote cultivos cada 2 ciclos y aplique fungicidas preventivos a base de cobre. Fertilice con 10-30-10 a la siembra y nitrógeno a la aporca.'],
    [['cebolla'], '🧅 **Cebolla:** Ideal en Tierra Blanca y Llano Grande de Cartago. Requiere suelo suelto, pH 6.0–6.8 y riego constante sin encharcar. Vigile trips y mildiú velloso; deje de regar 2 semanas antes de la cosecha para mejor curado.'],
    [['zanahoria'], '🥕 **Zanahoria:** Suelos profundos y sueltos sin piedras (la compactación deforma la raíz). Siembra directa, raleo a 5 cm entre plantas. Cosecha a los 90–110 días en zonas altas.'],
    [['fresa','mora','arándano','berries','frutilla'], '🍓 **Berries de altura (fresa, mora, arándano):** Prosperan entre 1,800–2,800 msnm (Cerro de la Muerte, Los Santos, Poás). Use acolchado plástico, riego por goteo y poda sanitaria. La fresa produce todo el año en altura; controle ácaros y botrytis con buena ventilación.'],
    [['aguacate'], '🥑 **Aguacate Hass:** Óptimo entre 1,200–2,200 msnm. Suelos con buen drenaje (odia el encharcamiento: riesgo de Phytophthora de raíz). Siembre en curvas de nivel en laderas y fertilice con boro y zinc en floración.'],
    [['café','roya','broca'], '☕ **Café de altura:** Sobre 1,200 msnm (Tarrazú, Dota) da los mejores SHB. Controle roya con variedades resistentes (Obatá, Costa Rica 95) y sombra regulada al 30–40%. Para broca: trampas con alcohol y recolección sanitaria de frutos del suelo.'],
    [['repollo','brócoli','brocoli','coliflor','crucífera'], '🥦 **Crucíferas (repollo, brócoli, coliflor):** Excelentes en zonas altas frescas. Plagas clave: palomilla dorso de diamante (Plutella) — use Bacillus thuringiensis y rotación. Cosecha brócoli antes de que abran las flores.'],
    [['helada','frío','frio','escarcha'], '❄️ **Heladas en zonas altas:** En el Cerro de la Muerte hay riesgo de dic–marzo en madrugadas despejadas. Proteja con riego por aspersión al amanecer, coberturas flotantes o barreras vivas. Consulte la sección Clima de Cultyra para ver las próximas horas.'],
    [['fertiliz','abono','npk'], '🌱 **Fertilización general:** Haga análisis de suelo cada año. Base: 10-30-10 a la siembra, nitrogenados (urea o nitrato de amonio) en crecimiento, y potasio en llenado de fruto. En zonas altas volcánicas suele faltar fósforo: ajuste según análisis.'],
    [['plaga','insecto','gusano','control'], '🐛 **Manejo integrado de plagas:** 1) Monitoree semanalmente, 2) use trampas amarillas/azules, 3) priorice control biológico (Bacillus, Beauveria, depredadores), 4) rote ingredientes activos para evitar resistencia, 5) respete períodos de carencia.'],
    [['riego','agua','goteo'], '💧 **Riego:** El goteo ahorra hasta 60% de agua vs. gravedad. En hortalizas de altura riegue temprano en la mañana. Revise la humedad a 15 cm de profundidad antes de regar: si el suelo forma bola al apretarlo, aún no necesita.'],
    [['suelo','ph','análisis','analisis'], '🪨 **Suelos:** En zonas altas volcánicas (andisoles) el pH suele ser 5.0–6.0: encale con carbonato de calcio si baja de 5.5. Incorpore materia orgánica (compost, gallinaza curada) para mejorar retención.'],
    [['clima','lluvia','tiempo'], '🌦️ Para el pronóstico use la sección **Clima** de Cultyra: busque su distrito y verá temperatura, lluvia y viento de las próximas 24 horas, hora por hora.'],
    [['tarea','empleado','equipo'], '👷 En la sección **Empleados** puede registrar a su equipo y asignarles tareas con seguimiento. Cada tarjeta muestra las tareas pendientes y completadas.']
  ];
  for (const [keys, resp] of R) {
    if (keys.some(k => q.includes(k))) return resp;
  }
  return '🌱 Puedo ayudarle con cultivos de zonas altas (papa, cebolla, zanahoria, fresa, mora, aguacate Hass, café de altura, brócoli...), plagas, fertilización, riego, suelos y heladas. Pregúnteme por un cultivo o problema específico, por ejemplo: *"¿Cómo controlo el tizón en papa?"*';
}

function sendSuggestion(text) {
  document.getElementById('chat-input').value = text;
  sendMessage();
}

// ===== PREGUNTAS RÁPIDAS PARA LA IA =====
function preguntaRapida(t) {
  const inp = document.getElementById('chat-input');
  inp.value = t;
  sendMessage();
}

// ===== NUEVA CONVERSACIÓN IA =====
function nuevaConversacionIA() {
  iaHistorial = [];
  const cont = document.getElementById('chat-messages');
  if (!cont) return;
  const typing = document.getElementById('typing');
  cont.innerHTML = '';
  // Reinsertar mensaje de bienvenida y typing indicator
  const bienvenida = document.createElement('div');
  bienvenida.className = 'msg assistant';
  bienvenida.innerHTML = '<div class="msg-bubble">¡Hola! Soy CultIA, el asistente inteligente de Cultyra 🌱. Puedo ayudarte con recomendaciones sobre plagas, enfermedades, productos biodegradables y el cuidado de tus cultivos. ¿En qué puedo ayudarte hoy?</div><span class="msg-time">Ahora</span>';
  cont.appendChild(bienvenida);
  const t = document.createElement('div');
  t.className = 'typing-indicator'; t.id = 'typing';
  t.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
  cont.appendChild(t);
  document.getElementById('chat-input').value = '';
  toast('Nueva conversación iniciada 🌱');
}
