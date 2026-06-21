// ============================================================
// CULTYRA · INIT (arranque de la app)
// ============================================================

// ===== INIT =====
renderFincas();
renderTasks();
renderProductos();
renderEmpleados();
renderClimaFincas();
actualizarCartBadge();
renderRegistros();
renderBitacora();
renderDashboard();
animarStats();
intentarSesionGuardada();

// Clima por defecto: la primera finca con coordenadas, o San José
(function(){
  const f = fincas.find(f=>f.centro);
  if (f) cargarClima(f.centro[0], f.centro[1], f.nombre + ' (' + f.ubicacion.split(',')[0] + ')');
  else cargarClima(9.9281, -84.0907, 'San José, Costa Rica');
})();
