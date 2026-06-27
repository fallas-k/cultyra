// ============================================================
// CULTYRA · AUTH — Firebase Authentication
// El registro, login y recuperación los maneja Firebase.
// No hay llamadas al servidor de Render para autenticarse.
// ============================================================

let sesion = { uid: null, nombre: null, email: null, token: null, rol: 'agricultor' };

// Firebase Auth (SDK cargado en index.html)
const fbAuth = firebase.auth();
fbAuth.languageCode = 'es';

// Segunda instancia de Firebase para crear cuentas de empleados
// sin interrumpir la sesión del patrón/agricultor
let _fbSecundaria = null;
function getFirebaseSecundaria() {
  if (_fbSecundaria) return _fbSecundaria;
  const cfg = firebase.app().options; // reutilizamos la misma config
  try {
    _fbSecundaria = firebase.initializeApp(cfg, 'secundaria');
  } catch(e) {
    _fbSecundaria = firebase.app('secundaria');
  }
  return _fbSecundaria;
}

// Obtener siempre un token fresco (Firebase lo renueva solo)
async function getToken() {
  try {
    if (firebase.auth().currentUser)
      return await firebase.auth().currentUser.getIdToken();
  } catch(e) {}
  return sesion.token || null;
}

// ---------- MOSTRAR FORMULARIOS ----------
function mostrarAuth(cual) { mostrarAuth2(cual); }
function mostrarAuth2(cual) {
  ['login','registro','recuperar'].forEach(f => {
    const el = document.getElementById('form-' + f);
    if (el) el.style.display = f === cual ? 'block' : 'none';
  });
  const tl = document.getElementById('tab-login');
  const tr = document.getElementById('tab-registro');
  if (tl) tl.classList.toggle('active', cual === 'login');
  if (tr) tr.classList.toggle('active', cual === 'registro');
  ['login-error','registro-error','registro-success','recuperar-msg'].forEach(id => {
    const e = document.getElementById(id);
    if (e) { e.style.display = 'none'; e.textContent = ''; }
  });
}

// ---------- ENTRAR A LA APP ----------
function entrarApp(nombre) {
  const ls = document.getElementById('login-screen');
  ls.style.transition = 'opacity .5s';
  ls.style.opacity = '0';
  setTimeout(() => {
    ls.style.display = 'none';
    document.getElementById('app').style.display = 'block';
    const wb = document.getElementById('btn-wa');
    if (wb) wb.style.display = 'flex';
    document.getElementById('nav-username').textContent = nombre;
    document.getElementById('nav-avatar').textContent   = nombre[0].toUpperCase();
    aplicarFotoNav();
    aplicarRol(sesion.rol || 'agricultor');
    cargarDatos();
    recargarTodoUI();
    cargarDatosServidor();
    renderDashboard();
    generarAlertas().then(() => { revisarRecordatorios(); notificarAlertas(); });
    onbSiEsPrimeraVez();
  }, 500);
}

// ---------- REGISTRARSE (Firebase) ----------
async function doRegistro() {
  const nombre = document.getElementById('reg-nombre').value.trim();
  const email  = document.getElementById('reg-email').value.trim();
  const pass   = document.getElementById('reg-pass').value;
  const pass2  = document.getElementById('reg-pass2').value;
  const rol    = document.getElementById('reg-rol').value || 'agricultor';
  const err    = document.getElementById('registro-error');
  const okBox  = document.getElementById('registro-success');
  err.style.display = 'none'; okBox.style.display = 'none';

  if (!nombre || !email || !pass) {
    err.textContent = 'Completa todos los campos.'; err.style.display = 'block'; return;
  }
  if (pass.length < 6) {
    err.textContent = 'La contraseña debe tener al menos 6 caracteres.'; err.style.display = 'block'; return;
  }
  if (pass !== pass2) {
    err.textContent = 'Las contraseñas no coinciden.'; err.style.display = 'block'; return;
  }

  const btn = document.querySelector('#form-registro .btn-login');
  if (btn) { btn.disabled = true; btn.textContent = 'Creando cuenta…'; }

  try {
    const cred  = await fbAuth.createUserWithEmailAndPassword(email, pass);
    await cred.user.updateProfile({ displayName: nombre });
    const token = await cred.user.getIdToken();
    sesion = { uid: cred.user.uid, nombre, email: cred.user.email, token, rol };
    try { localStorage.setItem('cultyra_sesion', JSON.stringify({ uid: sesion.uid, nombre, email: sesion.email, rol })); } catch(e) {}
    okBox.textContent = '✅ ¡Cuenta creada! Entrando…';
    okBox.style.display = 'block';
    setTimeout(() => entrarApp(nombre), 900);
  } catch(e) {
    err.textContent = tradFirebaseError(e.code); err.style.display = 'block';
    if (btn) { btn.disabled = false; btn.textContent = 'Crear cuenta'; }
  }
}

// ---------- INICIAR SESIÓN (Firebase) ----------
async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  const err   = document.getElementById('login-error');
  err.style.display = 'none';
  if (!email || !pass) { err.textContent = 'Escribe tu correo y contraseña.'; err.style.display = 'block'; return; }

  const btn = document.querySelector('#form-login .btn-login');
  if (btn) { btn.disabled = true; btn.textContent = 'Entrando…'; }

  try {
    const cred   = await fbAuth.signInWithEmailAndPassword(email, pass);
    const token  = await cred.user.getIdToken();
    const nombre = cred.user.displayName || email.split('@')[0];
    const rolGuardado = (() => {
      try { const s = JSON.parse(localStorage.getItem('cultyra_sesion') || '{}'); return s.rol || 'agricultor'; } catch(e) { return 'agricultor'; }
    })();
    sesion = { uid: cred.user.uid, nombre, email: cred.user.email, token, rol: rolGuardado };
    if (document.getElementById('login-recordar').checked) {
      try { localStorage.setItem('cultyra_sesion', JSON.stringify({ uid: sesion.uid, nombre, email: sesion.email, rol: sesion.rol })); } catch(e) {}
    }
    entrarApp(nombre);
  } catch(e) {
    err.textContent = tradFirebaseError(e.code); err.style.display = 'block';
    if (btn) { btn.disabled = false; btn.textContent = 'Entrar'; }
  }
}

// ---------- CERRAR SESIÓN ----------
function doLogout() {
  fbAuth.signOut().catch(() => {});
  sesion = { uid: null, nombre: null, email: null, token: null, rol: 'agricultor' };
  try { localStorage.removeItem('cultyra_sesion'); } catch(e) {}
  vaciarDatos();
  recargarTodoUI();
  document.getElementById('login-email').value = '';
  document.getElementById('login-pass').value  = '';
  goToLanding();
}

// ---------- RECUPERAR CONTRASEÑA (Firebase envía el correo) ----------
async function doRecuperar() {
  const email = document.getElementById('rec-email').value.trim();
  const msg   = document.getElementById('recuperar-msg');
  msg.style.display = 'none';
  if (!email) {
    msg.className = 'login-error'; msg.textContent = 'Escribe tu correo.'; msg.style.display = 'block'; return;
  }
  try {
    await fbAuth.sendPasswordResetEmail(email);
    msg.className = 'login-success';
    msg.textContent = '✅ Correo de recuperación enviado. Revisa tu bandeja de entrada y sigue las instrucciones.';
    msg.style.display = 'block';
    setTimeout(() => mostrarAuth2('login'), 4000);
  } catch(e) {
    msg.className = 'login-error'; msg.textContent = tradFirebaseError(e.code); msg.style.display = 'block';
  }
}

// ---------- SESIÓN PERSISTENTE (auto-login) ----------
async function intentarSesionGuardada() {
  return new Promise(resolve => {
    const unsub = fbAuth.onAuthStateChanged(async user => {
      unsub();
      if (!user) { resolve(false); return; }
      const token  = await user.getIdToken().catch(() => null);
      const nombre = user.displayName || user.email.split('@')[0];

      // Leer rol desde Firestore primero (empleados lo tienen guardado ahí)
      let rol = 'agricultor';
      try {
        const doc = await firebase.firestore().collection('usuarios').doc(user.uid).get();
        if (doc.exists && doc.data().rol) rol = doc.data().rol;
        else {
          // Fallback a localStorage
          const s = JSON.parse(localStorage.getItem('cultyra_sesion') || '{}');
          if (s.rol) rol = s.rol;
        }
      } catch(e) {
        try { const s = JSON.parse(localStorage.getItem('cultyra_sesion') || '{}'); if (s.rol) rol = s.rol; } catch(_) {}
      }

      sesion = { uid: user.uid, nombre, email: user.email, token, rol, foto: user.photoURL || null };
      const splash = document.getElementById('splash');
      if (splash) splash.style.display = 'none';
      document.getElementById('landing').style.display = 'none';
      entrarApp(nombre);
      resolve(true);
    });
  });
}

// ---------- TRADUCIR ERRORES DE FIREBASE ----------
function tradFirebaseError(code) {
  const errores = {
    'auth/email-already-in-use':   '⚠️ Ese correo ya tiene una cuenta. Inicia sesión.',
    'auth/invalid-email':          '⚠️ El formato del correo no es válido.',
    'auth/weak-password':          '⚠️ La contraseña es muy corta (mínimo 6 caracteres).',
    'auth/user-not-found':         '⚠️ No existe cuenta con ese correo.',
    'auth/wrong-password':         '⚠️ Contraseña incorrecta.',
    'auth/invalid-credential':     '⚠️ Correo o contraseña incorrectos.',
    'auth/too-many-requests':      '⏳ Demasiados intentos. Espera unos minutos.',
    'auth/network-request-failed': '📡 Sin conexión a internet.',
    'auth/user-disabled':          '🚫 Esta cuenta ha sido desactivada.',
    'auth/operation-not-allowed':  '🚫 Método de autenticación no habilitado. Actívalo en Firebase Console.',
  };
  return errores[code] || '⚠️ Error: ' + (code || 'desconocido');
}

// ---------- INICIAR SESIÓN CON GOOGLE ----------
async function doLoginGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  const errLogin = document.getElementById('login-error');
  const errReg   = document.getElementById('registro-error');
  try {
    const cred   = await fbAuth.signInWithPopup(provider);
    const token  = await cred.user.getIdToken();
    const nombre = cred.user.displayName || cred.user.email.split('@')[0];
    const rolGuardado = (() => {
      try { const s = JSON.parse(localStorage.getItem('cultyra_sesion') || '{}'); return s.rol || 'agricultor'; } catch(e) { return 'agricultor'; }
    })();
    sesion = { uid: cred.user.uid, nombre, email: cred.user.email, token, rol: rolGuardado };
    try { localStorage.setItem('cultyra_sesion', JSON.stringify({ uid: sesion.uid, nombre, email: sesion.email, rol: sesion.rol })); } catch(e) {}
    entrarApp(nombre);
  } catch(e) {
    if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return;
    const msg = tradFirebaseError(e.code);
    if (errLogin) { errLogin.textContent = msg; errLogin.style.display = 'block'; }
    if (errReg)   { errReg.textContent   = msg; errReg.style.display   = 'block'; }
  }
}

// ---------- ATAJOS DE TECLADO ----------
document.addEventListener('DOMContentLoaded', () => {
  const lp = document.getElementById('login-pass');
  if (lp) lp.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  const rp2 = document.getElementById('reg-pass2');
  if (rp2) rp2.addEventListener('keydown', e => { if (e.key === 'Enter') doRegistro(); });
  const re = document.getElementById('rec-email');
  if (re) re.addEventListener('keydown', e => { if (e.key === 'Enter') doRecuperar(); });
});

// ---------- MOSTRAR / OCULTAR CONTRASEÑA ----------
function togglePass(id, btn) {
  const inp = document.getElementById(id);
  const v   = inp.type === 'text';
  inp.type  = v ? 'password' : 'text';
  btn.textContent = v ? '👁️' : '🙈';
}

// ---------- ROL Y FOTO DE PERFIL ----------
let rolActual = 'agricultor';
function aplicarRol(rol) {
  rolActual = rol || 'agricultor';
  const esE = rolActual === 'empleado';
  const esA = rolActual === 'admin';

  // Si es admin, mostrar panel admin directamente
  if (esA) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const adminSec = document.getElementById('admin-panel');
    if (adminSec) { adminSec.classList.add('active'); renderAdminPanel(); }
    document.querySelectorAll('.nav-btn').forEach(b => b.style.display = 'none');
    const aviso = document.getElementById('aviso-empleado');
    if (aviso) { aviso.style.display = 'block'; aviso.textContent = '🛡️ Panel de Administración · CULTYRA'; aviso.style.background = 'rgba(99,102,241,0.12)'; aviso.style.borderColor = 'rgba(99,102,241,0.4)'; aviso.style.color = '#818cf8'; }
    return;
  }

  const ocultas = ['Mi Cultivo','Empleados','Registros','Productos','Información'];
  document.querySelectorAll('.nav-btn').forEach(b => {
    const t = b.textContent.trim();
    b.style.display = (esE && ocultas.includes(t)) ? 'none' : '';
  });
  const cartBtn = document.querySelector('.btn-cart');
  if (cartBtn) cartBtn.style.display = esE ? 'none' : '';
  const aviso = document.getElementById('aviso-empleado');
  if (aviso) aviso.style.display = esE ? 'block' : 'none';
}

function abrirPerfil() {
  const foto = sesion?.foto || null;
  const ini  = (document.getElementById('nav-username')?.textContent || 'A')[0].toUpperCase();
  const cont = document.getElementById('perfil-foto-prev');
  if (foto) { cont.style.backgroundImage = `url(${foto})`; cont.textContent = ''; }
  else { cont.style.backgroundImage = 'none'; cont.textContent = ini; }
  document.getElementById('perfil-nombre').textContent = document.getElementById('nav-username').textContent;
  document.getElementById('perfil-modal').classList.add('open');
}

function subirFotoPerfil(input) {
  const file = input.files?.[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 200;
    const sc = Math.max(200/img.width, 200/img.height);
    const w = img.width*sc, h = img.height*sc;
    cv.getContext('2d').drawImage(img,(200-w)/2,(200-h)/2,w,h);
    const data = cv.toDataURL('image/jpeg', 0.7);
    sesion.foto = data;
    try { localStorage.setItem('cultyra_foto__' + (sesion.email||'x'), data); } catch(e) {}
    aplicarFotoNav();
    document.getElementById('perfil-foto-prev').style.backgroundImage = `url(${data})`;
    document.getElementById('perfil-foto-prev').textContent = '';
    toast('Foto de perfil actualizada 📷');
  };
  img.src = URL.createObjectURL(file);
}

function aplicarFotoNav() {
  const av = document.getElementById('nav-avatar');
  let foto = sesion?.foto;
  if (!foto) {
    try { foto = localStorage.getItem('cultyra_foto__' + (sesion?.email||'x')); if (foto) sesion.foto = foto; } catch(e) {}
  }
  av.style.backgroundImage = foto ? `url(${foto})` : 'none';
  if (!foto) av.textContent = (sesion?.nombre || 'A')[0].toUpperCase();
}
