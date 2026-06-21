// ============================================================
// CULTYRA · LANDING
// ============================================================

// ===== CONTACT FORM =====
// Envía el correo usando Web3Forms (servicio gratuito, sin backend).
//
// IMPORTANTE: en el plan gratuito de Web3Forms, las notificaciones SIEMPRE
// llegan al correo con el que se creó la Access Key — el campo "to" NO
// cambia el destino. Si la Access Key de abajo está registrada con un
// correo personal, ahí llegarán los formularios (no a soportecultyra@gmail.com).
//
// Para que lleguen a soportecultyra@gmail.com:
//   1. Ve a https://web3forms.com
//   2. Crea una Access Key nueva poniendo soportecultyra@gmail.com
//   3. Revisa esa bandeja (y Spam la primera vez) para confirmar la clave
//   4. Reemplaza el valor de WEB3FORMS_KEY por la clave nueva
//
// El campo "email" (correo del usuario) se usa como "Responder a", para
// que al contestar la notificación, la respuesta vaya al usuario. Eso
// funciona igual sin importar a qué correo llegue la notificación.
const WEB3FORMS_KEY = '08501c0e-489c-442d-a228-2841f4078e83'; // CULTYRA - Soporte Técnico — cuenta soportecultyra@gmail.com

async function submitContact() {
  const n   = document.getElementById('cf-nombre').value.trim();
  const e   = document.getElementById('cf-email').value.trim();
  const tel = document.getElementById('cf-tel').value.trim();
  const tipo = document.getElementById('cf-tipo').value;
  const msg = document.getElementById('cf-mensaje').value.trim();
  if (!n || !e) { toast('Por favor completa nombre y email.', 'error'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { toast('El correo no es válido.', 'error'); return; }

  const btn = document.getElementById('btn-enviar-soporte');
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Enviando…';

  const ok = document.getElementById('contact-success');

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: 'CULTYRA · Soporte: ' + tipo,
        from_name: 'CULTYRA — ' + n,
        email: e,           // correo del usuario (para poder responderle)
        nombre: n,
        telefono: tel || 'No indicado',
        tipo_consulta: tipo,
        mensaje: msg || '(sin descripción)'
      })
    });
    const data = await res.json();

    if (data.success) {
      ok.innerHTML = '✅ ¡Solicitud enviada! Un técnico de Cultyra se pondrá en contacto contigo en menos de 24 horas.';
      ok.style.display = 'block';
      toast('Solicitud enviada correctamente ✅');
      // Limpiar el formulario
      document.getElementById('cf-nombre').value = '';
      document.getElementById('cf-email').value = '';
      document.getElementById('cf-tel').value = '';
      document.getElementById('cf-mensaje').value = '';
    } else {
      throw new Error(data.message || 'Error desconocido');
    }
  } catch (err) {
    // Respaldo: si falla el envío automático, abrir el correo manualmente
    const asunto = 'CULTYRA · Soporte: ' + tipo;
    const cuerpo =
      'Nombre: ' + n + '\n' +
      'Correo: ' + e + '\n' +
      'Teléfono: ' + (tel || 'No indicado') + '\n' +
      'Tipo de consulta: ' + tipo + '\n\n' +
      'Descripción:\n' + (msg || '(sin descripción)') + '\n\n' +
      '— Enviado desde la app CULTYRA';
    const mailto = 'mailto:soportecultyra@gmail.com?subject=' + encodeURIComponent(asunto) + '&body=' + encodeURIComponent(cuerpo);
    ok.innerHTML = '⚠️ No se pudo enviar automáticamente. <a href="' + mailto + '" style="color:var(--green-bright);font-weight:700;text-decoration:underline;">Haz clic aquí para enviarlo por tu correo</a>.';
    ok.style.display = 'block';
    toast('No se pudo enviar: ' + (err.message || 'error desconocido'), 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}

// ===== LANDING =====
function goToLogin() {
  document.getElementById('landing').style.display = 'none';
  const ls = document.getElementById('login-screen');
  ls.style.display = 'flex';
  ls.style.opacity = '1';
}
function goToLanding() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'none';
  document.getElementById('landing').style.display = 'block';
  document.getElementById('btn-wa').style.display = 'none';
}
