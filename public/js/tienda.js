// ============================================================
// CULTYRA · TIENDA
// ============================================================

// ===== PRODUCTOS =====
const productos = [
  // ── SENSORES / IoT ──────────────────────────────────────────
  {id:1,  foto:'https://images.unsplash.com/photo-1611735341450-74d61e660ad2?w=600&q=60', category:'sensor',        name:'Sensor de Humedad Pro',           desc:'Monitoreo en tiempo real de la humedad del suelo. Conectividad WiFi y app móvil.',                              precio:45500,  emoji:'📡', badge:'IoT'},
  {id:2,  foto:'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=60', category:'sensor',        name:'Kit Solar + Sensor Temp',          desc:'Temperatura, luz solar y humedad ambiental. Batería solar incluida.',                                            precio:74000,  emoji:'🌡️', badge:'IoT'},
  {id:8,  foto:'https://images.unsplash.com/photo-1557862921-37829c790f19?w=600&q=60', category:'sensor',        name:'Cámara de Vigilancia Campo',       desc:'Resolución 2K, visión nocturna, alertas de movimiento para tu finca.',                                          precio:102000, emoji:'📷', badge:'IoT'},
  {id:9,  foto:'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=60', category:'sensor',        name:'Nodo ESP32 Agro',                  desc:'Microcontrolador ESP32 preconfigurado para conectar sensores de campo a la plataforma Cultyra.',                precio:18500,  emoji:'🔧', badge:'IoT'},
  {id:10, foto:'https://images.unsplash.com/photo-1581092921461-eab10380ed66?w=600&q=60', category:'sensor',        name:'Sensor de pH del Suelo',           desc:'Mide el pH del suelo en tiempo real. Rango 3–9 pH. Compatible con nodo ESP32.',                                 precio:32000,  emoji:'🧪', badge:'IoT'},
  {id:11, foto:'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&q=60', category:'sensor',        name:'Pluviómetro Digital IoT',          desc:'Mide la lluvia acumulada y la envía a tu app. Ideal para zonas sin estación meteorológica.',                   precio:41000,  emoji:'🌧️', badge:'IoT'},
  {id:12, foto:'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&q=60', category:'sensor',        name:'Sensor CO₂ y Calidad de Aire',     desc:'Monitorea CO₂, temperatura y humedad en invernaderos. Alerta si los niveles son críticos.',                   precio:58000,  emoji:'💨', badge:'IoT'},
  {id:13, foto:'https://images.unsplash.com/photo-1592890288564-76628a30a657?w=600&q=60', category:'sensor',        name:'Kit Riego Automatizado',           desc:'Electroválvulas + sensores de humedad + controlador ESP32. Riega solo cuando el suelo lo necesita.',          precio:135000, emoji:'💧', badge:'IoT'},
  {id:14, foto:'https://images.unsplash.com/photo-1559163499-413811fb2344?w=600&q=60', category:'sensor',        name:'Panel Solar 20W para Campo',       desc:'Alimenta tus nodos IoT de forma autónoma. Incluye regulador de carga y soporte.',                              precio:49000,  emoji:'☀️', badge:'IoT'},
  {id:15, foto:'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=60', category:'sensor',        name:'Gateway LoRa Cultyra',             desc:'Puente de comunicación de largo alcance (hasta 5 km) para conectar nodos en zonas sin WiFi.',                 precio:88000,  emoji:'📶', badge:'IoT'},

  // ── BIODEGRADABLES ────────────────────────────────────────
  {id:3,  foto:'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=600&q=60', category:'biodegradable', name:'Abono Bocashi Premium',            desc:'Fermentado artesanal con microorganismos benéficos. Saco de 25 kg.',                                            precio:9200,   emoji:'🌿', badge:'Bio'},
  {id:4,  foto:'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=60', category:'biodegradable', name:'Extracto de Neem Concentrado',     desc:'Insecticida y fungicida natural. No daña polinizadores. Litro concentrado.',                                   precio:12300,  emoji:'🍃', badge:'Bio'},
  {id:5,  foto:'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=60', category:'biodegradable', name:'Plaguicida a Base de Piretrina',    desc:'Control de insectos masticadores y chupadores. Certificado SENASA. Frasco 500 ml.',                            precio:15900,  emoji:'🌸', badge:'Bio'},
  {id:16, foto:'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=600&q=60', category:'biodegradable', name:'Jabón Potásico Agrícola',           desc:'Insecticida de contacto contra pulgones, mosca blanca y cochinillas. 1 L listo para usar.',                   precio:8500,   emoji:'🧼', badge:'Bio'},
  {id:17, foto:'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600&q=60', category:'biodegradable', name:'Bacillus thuringiensis (Bt)',       desc:'Control biológico de orugas y gusanos (cogollero, palomilla, gusano del fruto). Polvo mojable 100 g.',       precio:11200,  emoji:'🦠', badge:'Bio'},
  {id:18, foto:'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=60', category:'biodegradable', name:'Beauveria bassiana',                desc:'Hongo entomopatógeno para mosca blanca, trips, broca y picudo negro. Frasco 250 g.',                           precio:13800,  emoji:'🍄', badge:'Bio'},
  {id:19, foto:'https://images.unsplash.com/photo-1416431049739-33e0f5e6c77d?w=600&q=60', category:'biodegradable', name:'Trichoderma spp.',                  desc:'Hongo antagonista que protege raíces de Fusarium, Pythium y Rhizoctonia. Aplicar al suelo al trasplante.',   precio:10500,  emoji:'🌱', badge:'Bio'},
  {id:20, foto:'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=600&q=60', category:'biodegradable', name:'Azufre Micronizado 80%',            desc:'Fungicida y acaricida para oídio y ácaros rojos. Compatible con agricultura orgánica. Saco 1 kg.',            precio:6800,   emoji:'🫙', badge:'Bio'},
  {id:21, foto:'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=60', category:'biodegradable', name:'Caldo Bordelés (Cobre)',            desc:'Fungicida y bactericida cúprico. Control de sigatoka, antracnosis y enfermedades foliares. 1 L.',             precio:9800,   emoji:'🟢', badge:'Bio'},
  {id:22, foto:'https://images.unsplash.com/photo-1585664811087-47f65abbad64?w=600&q=60', category:'biodegradable', name:'Aceite de Eucalipto Agrícola',      desc:'Repelente e insecticida natural para trips, minadores y cochinillas. 500 ml concentrado.',                    precio:11000,  emoji:'🌳', badge:'Bio'},
  {id:23, foto:'https://images.unsplash.com/photo-1455103721808-86f0e85b1db7?w=600&q=60', category:'biodegradable', name:'Humus de Lombriz',                  desc:'Fertilizante orgánico de alta concentración. Mejora estructura del suelo y microbiota. Saco 10 kg.',         precio:7400,   emoji:'🪱', badge:'Bio'},
  {id:24, foto:'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&q=60', category:'biodegradable', name:'Melaza Agrícola',                   desc:'Potenciador de microorganismos benéficos y fuente de carbono para biofertilizantes. Garrafa 5 L.',            precio:5200,   emoji:'🍯', badge:'Bio'},
  {id:25, foto:'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=60', category:'biodegradable', name:'Biofertilizante Foliar Cultyra',    desc:'Mezcla de micronutrientes + microorganismos fijadores de N y solubilizadores de P. Litro concentrado.',     precio:14500,  emoji:'💚', badge:'Bio'},
  {id:26, foto:'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=60', category:'biodegradable', name:'Cal Agrícola Hidratada',            desc:'Control de babosas, ajuste de pH y desinfección del suelo. Saco 25 kg.',                                      precio:4300,   emoji:'⬜', badge:'Bio'},
  {id:27, foto:'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&q=60', category:'biodegradable', name:'Trampa Amarilla Adhesiva x10',      desc:'Monitoreo y control de mosca blanca, minadores y afidos. Paquete de 10 trampas de doble cara.',              precio:5800,   emoji:'🟡', badge:'Bio'},

  // ── SERVICIOS ─────────────────────────────────────────────
  {id:6,  foto:'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=600&q=60', category:'servicio',      name:'Visita Técnica Agronómica',        desc:'Diagnóstico presencial por un ingeniero agrónomo certificado. 3 horas en finca.',                              precio:33300,  emoji:'👨‍🌾', badge:'Servicio'},
  {id:7,  foto:'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=60', category:'servicio',      name:'Plan Monitoreo Mensual',           desc:'Lectura de sensores + reporte mensual + recomendaciones de IA.',                                               precio:25000,  emoji:'📊', badge:'Servicio', mensual:true},
  {id:28, foto:'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=60', category:'servicio',      name:'Instalación de Nodos IoT',         desc:'Instalación profesional de hasta 5 nodos ESP32 en campo. Incluye configuración en la app Cultyra.',           precio:55000,  emoji:'🔌', badge:'Servicio'},
  {id:29, foto:'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&q=60', category:'servicio',      name:'Capacitación Uso de la App',       desc:'Sesión grupal (hasta 10 personas) para aprender a usar Cultyra: registros, fincas, IA y sensores.',          precio:18000,  emoji:'🎓', badge:'Servicio'},
  {id:30, foto:'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=60', category:'servicio',      name:'Plan Premium Anual',               desc:'Acceso completo: monitoreo 24/7, reportes automáticos, soporte prioritario y 2 visitas técnicas al año.',    precio:180000, emoji:'⭐', badge:'Servicio'},
];

let activeFilter = 'todos';

function renderProductos() {
  let filtered = activeFilter==='todos' ? productos : productos.filter(p=>p.category===activeFilter);
  if (busquedaTienda) filtered = filtered.filter(p => (p.name + ' ' + p.desc).toLowerCase().includes(busquedaTienda));
  if (!filtered.length) { document.getElementById('productos-grid').innerHTML = '<div class="vacio"><div class="ic">🔍</div><h4>Sin resultados</h4><p>No encontramos productos con esa búsqueda. Intenta con otra palabra.</p></div>'; return; }
  document.getElementById('productos-grid').innerHTML = filtered.map(p=>`
    <div class="producto-card">
      <div class="producto-img" style="background:linear-gradient(135deg,#1a3a1f,#2d6a4f)">
        <img class="foto" src="${p.foto}" alt="${p.name}" loading="lazy" onerror="this.remove()">
        <span class="foto-emoji">${p.emoji}</span>
        <span class="producto-badge">${p.badge}</span>
      </div>
      <div class="producto-body">
        <div class="producto-category">${{'sensor':'Sensor IoT','biodegradable':'Biodegradable','servicio':'Servicio'}[p.category]}</div>
        <div class="producto-name">${p.name}</div>
        <div class="producto-desc">${p.desc}</div>
        <div class="producto-footer">
          <span class="producto-price">${fmtColones(p.precio)}${p.mensual?'/mes':''}</span>
          <button class="btn-add" onclick="addToCart(${p.id})">Agregar</button>
        </div>
      </div>
    </div>`).join('');
}

function filterProductos(cat, btn) {
  activeFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderProductos();
}

let toastTimeout;

// ===== CARRITO DE COMPRAS =====
let carrito = [];
function fmtColones(n) { return '₡' + Number(n).toLocaleString('es-CR'); }
function addToCart(id) {
  const item = carrito.find(c => c.id === id);
  if (item) item.qty++;
  else carrito.push({id, qty: 1});
  guardar();
  actualizarCartBadge();
  const p = productos.find(p => p.id === id);
  const toast = document.getElementById('cart-toast');
  toast.textContent = `✅ "${p.name}" agregado al carrito`;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(()=>toast.classList.remove('show'), 2200);
}
function actualizarCartBadge() {
  const total = carrito.reduce((s,c)=>s+c.qty, 0);
  const b = document.getElementById('cart-badge');
  b.textContent = total;
  b.style.display = total ? 'flex' : 'none';
}
function abrirCarrito() {
  renderCarrito();
  document.getElementById('cart-modal').classList.add('open');
}
function renderCarrito() {
  const list = document.getElementById('cart-list');
  const totalEl = document.getElementById('cart-total');
  if (!carrito.length) {
    list.innerHTML = '<div class="cart-vacio">🛒 Tu carrito está vacío.<br>Agrega fertilizantes, sensores o servicios desde el catálogo.</div>';
    totalEl.textContent = fmtColones(0);
    return;
  }
  let total = 0;
  list.innerHTML = carrito.map(c => {
    const p = productos.find(p => p.id === c.id);
    const sub = p.precio * c.qty;
    total += sub;
    return `<div class="cart-item">
      <span class="emoji">${p.emoji}</span>
      <div class="info"><h4>${p.name}</h4><p>${fmtColones(p.precio)}${p.mensual?'/mes':''} c/u · Subtotal: <b>${fmtColones(sub)}</b></p></div>
      <div class="cart-qty">
        <button onclick="cambiarQty(${c.id},-1)">−</button><span>${c.qty}</span><button onclick="cambiarQty(${c.id},1)">+</button>
      </div>
    </div>`;
  }).join('');
  totalEl.textContent = fmtColones(total);
}
function cambiarQty(id, delta) {
  const item = carrito.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) carrito = carrito.filter(c => c.id !== id);
  guardar(); actualizarCartBadge(); renderCarrito();
}
function realizarPedido() {
  if (!carrito.length) return;
  const total = carrito.reduce((s,c)=>{ const p = productos.find(p=>p.id===c.id); return s + p.precio*c.qty; }, 0);

  // Generar mensaje de WhatsApp con el pedido
  const lineas = carrito.map(c => {
    const p = productos.find(p=>p.id===c.id);
    return `• ${c.qty}x ${p.emoji} ${p.name} — ${fmtColones(p.precio * c.qty)}${p.mensual?'/mes':''}`;
  });
  const nombre = document.getElementById('nav-username')?.textContent || 'Cliente';
  const msg = `¡Hola! Soy ${nombre} y me gustaría hacer este pedido en CULTYRA 🌱\n\n${lineas.join('\n')}\n\n*Total: ${fmtColones(total)}*\n\n¿Me pueden confirmar disponibilidad y coordinar la entrega? Gracias 🚚`;
  const url = `https://wa.me/50662053039?text=${encodeURIComponent(msg)}`;

  document.getElementById('cart-list').innerHTML = `
    <div class="cart-vacio">
      ✅ <b>¡Pedido listo!</b><br><br>
      Total: <b>${fmtColones(total)}</b><br><br>
      <a href="${url}" target="_blank" rel="noopener" style="display:inline-block;margin-top:8px;background:#25D366;color:#fff;padding:10px 20px;border-radius:999px;font-weight:600;text-decoration:none;font-size:14px;">
        📲 Enviar pedido por WhatsApp
      </a>
      <p style="font-size:12px;color:var(--text-light);margin-top:8px;">Se abrirá WhatsApp con tu pedido ya escrito.</p>
    </div>`;
  carrito = [];
  guardar(); actualizarCartBadge();
  document.getElementById('cart-total').textContent = fmtColones(0);
}

// ===== BUSCADOR DE LA TIENDA =====
let busquedaTienda = '';
function buscarTienda(v) {
  busquedaTienda = v.toLowerCase().trim();
  renderProductos();
}

// ===== LISTA DE COMPRAS INTELIGENTE (plan → productos) =====
function sugerirProducto(etapa) {
  const e = etapa.toLowerCase();
  if (e.includes('fertiliz') || e.includes('enmienda') || e.includes('fertirr')) return 3;
  if (e.includes('tizón') || e.includes('fungicida') || e.includes('roya') || e.includes('mildiú') || e.includes('phytophthora')) return 4;
  if (e.includes('plaga') || e.includes('trips') || e.includes('ácaro') || e.includes('broca')) return 5;
  if (e.includes('monitoreo') || e.includes('evaluación')) return 7;
  if (e.includes('riego') || e.includes('goteo') || e.includes('suelo')) return 1;
  return null;
}
