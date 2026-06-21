// ============================================================
// CULTYRA · PAGOS / CHECKOUT
// Flujo de pago en 3 pasos: Entrega → Método de pago → Confirmación
// Métodos soportados: Tarjeta (crédito/débito, simulado con validación
// real de formato/Luhn) y SINPE Móvil (transferencia + referencia).
// ============================================================

// Número SINPE Móvil de Cultyra — cámbialo por el número real del proyecto.
const SINPE_NUMERO = '8888-8888';

let metodoPago = null;
let checkoutPaso = 1;

// ===== ABRIR / CERRAR =====
function abrirCheckout() {
  if (!carrito.length) { toast('Tu carrito está vacío. Agrega productos antes de pagar.', 'info'); return; }
  document.getElementById('cart-modal').classList.remove('open');
  renderResumenCheckout();
  const nombreInput = document.getElementById('chk-nombre');
  if (nombreInput && !nombreInput.value) nombreInput.value = sesion?.nombre || '';
  document.getElementById('sinpe-num-txt').textContent = SINPE_NUMERO;
  irPasoCheckout(1);
  document.getElementById('checkout-modal').classList.add('open');
}

function cerrarCheckoutFinal() {
  document.getElementById('checkout-modal').classList.remove('open');
  // Limpia el formulario para el próximo pedido
  ['card-numero','card-exp','card-cvv','card-nombre','sinpe-tel','sinpe-ref','chk-notas'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('cv-number').textContent = '•••• •••• •••• ••••';
  document.getElementById('cv-name').textContent   = 'NOMBRE APELLIDO';
  document.getElementById('cv-exp').textContent    = 'MM/AA';
  document.getElementById('cv-brand').textContent  = 'TARJETA';
  document.getElementById('card-visual')?.classList.remove('mc');
  metodoPago = null;
  document.querySelectorAll('.pm-card').forEach(c => c.classList.remove('active'));
  const tf = document.getElementById('pago-tarjeta-form'); if (tf) tf.style.display = 'none';
  const sf = document.getElementById('pago-sinpe-form');   if (sf) sf.style.display = 'none';
  const bp = document.getElementById('btn-pagar');
  if (bp) { bp.style.display = 'none'; bp.disabled = false; bp.textContent = 'Pagar'; }
}

// ===== NAVEGACIÓN ENTRE PASOS =====
function irPasoCheckout(n) {
  checkoutPaso = n;
  [1, 2, 3].forEach(i => {
    const panel = document.getElementById('checkout-step-' + i);
    const step  = document.getElementById('cstep-' + i);
    if (panel) panel.style.display = (i === n) ? 'block' : 'none';
    if (step) {
      step.classList.toggle('active', i === n);
      step.classList.toggle('done', i < n);
    }
  });
}

function checkoutSiguiente(paso) {
  if (paso === 2) {
    const nombre = document.getElementById('chk-nombre').value.trim();
    const tel    = document.getElementById('chk-tel').value.trim();
    const dir    = document.getElementById('chk-direccion').value.trim();
    if (!nombre || !tel || !dir) {
      toast('Completa nombre, teléfono y dirección de entrega.', 'error');
      return;
    }
  }
  irPasoCheckout(paso);
}

// ===== RESUMEN =====
function calcularTotalCarrito() {
  return carrito.reduce((s, c) => {
    const p = productos.find(p => p.id === c.id);
    return s + (p ? p.precio * c.qty : 0);
  }, 0);
}
function renderResumenCheckout() {
  const total = calcularTotalCarrito();
  const totalTxt = fmtColones(total);
  document.getElementById('chk-total').textContent = totalTxt;
  document.getElementById('sinpe-total').textContent = totalTxt;
}

// ===== SELECCIÓN DE MÉTODO DE PAGO =====
function seleccionarPago(m) {
  metodoPago = m;
  document.querySelectorAll('.pm-card').forEach(c => c.classList.toggle('active', c.dataset.pm === m));
  document.getElementById('pago-tarjeta-form').style.display = (m === 'tarjeta') ? 'block' : 'none';
  document.getElementById('pago-sinpe-form').style.display   = (m === 'sinpe')   ? 'block' : 'none';
  const btn = document.getElementById('btn-pagar');
  btn.style.display = 'block';
  btn.disabled = false;
  btn.textContent = (m === 'tarjeta') ? 'Pagar ' + fmtColones(calcularTotalCarrito()) + ' 🔒' : 'Confirmar pago SINPE';
}

// ===== TARJETA: FORMATO Y DETECCIÓN DE MARCA =====
function formatCardNumber(input) {
  const digits = input.value.replace(/\D/g, '').slice(0, 19);
  input.value = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  detectarMarca(digits);
  const visual = digits.padEnd(16, '•').replace(/(.{4})(?=.)/g, '$1 ');
  document.getElementById('cv-number').textContent = digits ? visual : '•••• •••• •••• ••••';
}
function detectarMarca(num) {
  const brand = document.getElementById('cv-brand');
  const visual = document.getElementById('card-visual');
  if (/^4/.test(num)) { brand.textContent = 'VISA'; visual.classList.remove('mc'); }
  else if (/^(5[1-5]|2[2-7])/.test(num)) { brand.textContent = 'Mastercard'; visual.classList.add('mc'); }
  else { brand.textContent = 'TARJETA'; visual.classList.remove('mc'); }
}
function formatCardExp(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 4);
  if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
  input.value = v;
  document.getElementById('cv-exp').textContent = v || 'MM/AA';
}

// ===== VALIDACIÓN LUHN (número de tarjeta) =====
function luhnValido(num) {
  let suma = 0, alterna = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = parseInt(num[i], 10);
    if (alterna) { d *= 2; if (d > 9) d -= 9; }
    suma += d; alterna = !alterna;
  }
  return suma % 10 === 0;
}

// ===== COPIAR NÚMERO SINPE =====
function copiarSinpe() {
  const num = SINPE_NUMERO.replace(/-/g, '');
  if (navigator.clipboard) {
    navigator.clipboard.writeText(num).then(() => toast('Número SINPE copiado 📋')).catch(() => toast('Número: ' + SINPE_NUMERO, 'info'));
  } else {
    toast('Número: ' + SINPE_NUMERO, 'info');
  }
}

// ===== PROCESAR PAGO =====
async function procesarPago() {
  if (!metodoPago) { toast('Selecciona un método de pago.', 'error'); return; }

  let referencia = '', estado = '', detalleTarjeta = '';

  if (metodoPago === 'tarjeta') {
    const num    = document.getElementById('card-numero').value.replace(/\s/g, '');
    const exp    = document.getElementById('card-exp').value;
    const cvv    = document.getElementById('card-cvv').value;
    const nombre = document.getElementById('card-nombre').value.trim();

    if (num.length < 13 || num.length > 19 || !luhnValido(num)) { toast('El número de tarjeta no es válido.', 'error'); return; }
    const partes = exp.split('/');
    const mm = parseInt(partes[0], 10), yy = parseInt(partes[1], 10);
    if (!mm || !yy || mm < 1 || mm > 12) { toast('La fecha de vencimiento no es válida.', 'error'); return; }
    const ahora = new Date(), yyAhora = ahora.getFullYear() % 100, mmAhora = ahora.getMonth() + 1;
    if (yy < yyAhora || (yy === yyAhora && mm < mmAhora)) { toast('Esa tarjeta está vencida.', 'error'); return; }
    if (cvv.length < 3) { toast('El CVV no es válido.', 'error'); return; }
    if (!nombre) { toast('Escribe el nombre del titular.', 'error'); return; }

    referencia = document.getElementById('cv-brand').textContent + ' •••• ' + num.slice(-4);
    detalleTarjeta = referencia;
    estado = 'pagado';
  } else {
    const tel = document.getElementById('sinpe-tel').value.trim();
    const ref = document.getElementById('sinpe-ref').value.trim();
    if (!tel) { toast('Escribe el número desde donde envías el SINPE.', 'error'); return; }
    if (!ref) { toast('Escribe el número de comprobante / referencia.', 'error'); return; }
    referencia = 'Tel: ' + tel + ' · Ref: ' + ref;
    estado = 'pendiente';
  }

  const btn = document.getElementById('btn-pagar');
  btn.disabled = true;
  btn.textContent = (metodoPago === 'tarjeta') ? 'Procesando pago…' : 'Confirmando…';

  // Simula el tiempo de procesamiento del pago
  await new Promise(r => setTimeout(r, 1300));

  const items = carrito.map(c => {
    const p = productos.find(p => p.id === c.id);
    return { id: p.id, nombre: p.name, precio: p.precio, qty: c.qty, mensual: !!p.mensual };
  });
  const total = items.reduce((s, i) => s + i.precio * i.qty, 0);

  const pedido = {
    id: 'CULT-' + Date.now().toString(36).toUpperCase(),
    fecha: new Date().toISOString(),
    items, total,
    metodoPago, referencia, estado,
    cliente: {
      nombre:    document.getElementById('chk-nombre').value.trim(),
      telefono:  document.getElementById('chk-tel').value.trim(),
      direccion: document.getElementById('chk-direccion').value.trim(),
      provincia: document.getElementById('chk-provincia').value,
      notas:     document.getElementById('chk-notas').value.trim()
    }
  };

  guardarPedido(pedido);

  // Sincroniza con el servidor si hay sesión activa (no bloquea el flujo si falla)
  if (sesion && sesion.uid) {
    try {
      await fetch(API_URL + '/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (await getToken()) },
        body: JSON.stringify(pedido)
      });
    } catch (e) { /* se mantiene en localStorage de todas formas */ }
  }

  mostrarConfirmacion(pedido);
  carrito = [];
  guardar();
  actualizarCartBadge();
  btn.disabled = false;
}

// ===== GUARDAR PEDIDO EN LOCALSTORAGE =====
function clavePedidos() {
  const email = (sesion && sesion.email) ? sesion.email.toLowerCase() : 'invitado';
  return 'cultyra_pedidos__' + email;
}
function guardarPedido(pedido) {
  let lista = [];
  try { lista = JSON.parse(localStorage.getItem(clavePedidos())) || []; } catch (e) {}
  lista.unshift(pedido);
  try { localStorage.setItem(clavePedidos(), JSON.stringify(lista)); } catch (e) {}
}
function obtenerPedidos() {
  try { return JSON.parse(localStorage.getItem(clavePedidos())) || []; } catch (e) { return []; }
}

// ===== PANTALLA DE CONFIRMACIÓN =====
function mostrarConfirmacion(pedido) {
  const cont = document.getElementById('checkout-confirm-content');
  const esTarjeta = pedido.metodoPago === 'tarjeta';
  cont.innerHTML = `
    <div class="confirm-icon">${esTarjeta ? '✅' : '⏳'}</div>
    <h3>${esTarjeta ? '¡Pago aprobado!' : '¡Pedido recibido!'}</h3>
    <p class="confirm-num">Pedido <b>${pedido.id}</b></p>
    <div class="confirm-resumen">
      ${pedido.items.map(i => `<div class="confirm-item"><span>${i.qty}× ${i.nombre}${i.mensual ? '/mes' : ''}</span><span>${fmtColones(i.precio * i.qty)}</span></div>`).join('')}
      <div class="confirm-item confirm-total"><span>Total</span><span>${fmtColones(pedido.total)}</span></div>
    </div>
    <p class="confirm-meta">${esTarjeta
      ? '💳 Pago procesado con ' + pedido.referencia + '.'
      : '📱 Estado: <b>pendiente de verificación SINPE</b>. Te avisaremos por WhatsApp o correo cuando confirmemos la transferencia.'}</p>
    <p class="confirm-entrega">📦 Se enviará a: ${pedido.cliente.direccion}, ${pedido.cliente.provincia}</p>
  `;
  irPasoCheckout(3);
}

// ===== MIS PEDIDOS =====
function abrirPedidos() {
  const lista = obtenerPedidos();
  const cont = document.getElementById('pedidos-lista');
  if (!lista.length) {
    cont.innerHTML = '<div class="cart-vacio">📦 Aún no tienes pedidos.<br>Compra en la Tienda para verlos aquí.</div>';
  } else {
    const etiquetasEstado = { pagado: '✅ Pagado', pendiente: '⏳ Pendiente', cancelado: '✖ Cancelado' };
    cont.innerHTML = lista.map(p => `
      <div class="pedido-item">
        <div class="pedido-head">
          <b>${p.id}</b>
          <span class="pedido-estado ${p.estado}">${etiquetasEstado[p.estado] || p.estado}</span>
        </div>
        <div class="pedido-fecha">${new Date(p.fecha).toLocaleString('es-CR', { dateStyle: 'medium', timeStyle: 'short' })}</div>
        <div class="pedido-items">${p.items.map(i => `${i.qty}× ${i.nombre}`).join(', ')}</div>
        <div class="pedido-total"><span>${fmtColones(p.total)}</span><span>${p.metodoPago === 'tarjeta' ? '💳 Tarjeta' : '📱 SINPE Móvil'}</span></div>
      </div>`).join('');
  }
  document.getElementById('pedidos-modal').classList.add('open');
}
