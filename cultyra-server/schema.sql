-- ============================================================
-- CULTYRA — Esquema de base de datos SQL
-- Compatible con MySQL / MariaDB (XAMPP) y SQLite
-- ============================================================

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,        -- En SQLite: INTEGER PRIMARY KEY AUTOINCREMENT
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,          -- Contraseña cifrada con bcrypt (NUNCA en texto plano)
  rol VARCHAR(20) NOT NULL DEFAULT 'agricultor',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fincas (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  usuario_id INTEGER NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  ubicacion VARCHAR(200),
  area_ha DECIMAL(10,2),
  cultivo VARCHAR(80),
  lat DECIMAL(10,6),
  lng DECIMAL(10,6),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS empleados (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  usuario_id INTEGER NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  rol VARCHAR(80),
  telefono VARCHAR(30),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tareas (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  usuario_id INTEGER NOT NULL,
  empleado_id INTEGER,
  finca_id INTEGER,
  descripcion VARCHAR(300) NOT NULL,
  prioridad VARCHAR(10) DEFAULT 'media',
  completada TINYINT(1) DEFAULT 0,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE SET NULL,
  FOREIGN KEY (finca_id) REFERENCES fincas(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS registros (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  usuario_id INTEGER NOT NULL,
  finca VARCHAR(120) NOT NULL DEFAULT 'General',
  tipo VARCHAR(10) NOT NULL,                         -- 'cosecha' | 'venta' | 'gasto'
  monto DECIMAL(14,2) NOT NULL,
  nota VARCHAR(300) DEFAULT '',
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Índice para consultas por usuario ordenadas por fecha
CREATE INDEX IF NOT EXISTS idx_registros_usuario ON registros(usuario_id, fecha DESC);

-- Pedidos de la tienda (pago con tarjeta o SINPE Móvil)
CREATE TABLE IF NOT EXISTS pedidos (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  pedido_id VARCHAR(40) NOT NULL,
  usuario_id INTEGER NOT NULL,
  items TEXT NOT NULL,                               -- JSON: [{id, nombre, precio, qty}, ...]
  total DECIMAL(14,2) NOT NULL,
  metodo_pago VARCHAR(10) NOT NULL,                  -- 'tarjeta' | 'sinpe'
  estado VARCHAR(15) NOT NULL DEFAULT 'pendiente',   -- 'pagado' | 'pendiente' | 'cancelado'
  referencia VARCHAR(200) DEFAULT '',
  cliente TEXT DEFAULT '{}',                         -- JSON: {nombre, telefono, direccion, provincia, notas}
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario_id, fecha DESC);

-- Usuario de demostración (contraseña: cultyra2024, ya cifrada con bcrypt)
-- INSERT INTO usuarios (nombre, email, password_hash, rol)
-- VALUES ('Admin', 'admin@cultyra.com', '$2a$10$REEMPLAZAR_CON_HASH', 'admin');
