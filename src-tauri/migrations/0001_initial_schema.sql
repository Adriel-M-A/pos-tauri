-- Esquema Inicial Consolidado (Versión Centavos)
-- Todas las magnitudes monetarias se guardan como INTEGER (centavos x 100)

CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    precio INTEGER NOT NULL, -- Guardado en centavos
    stock REAL,              -- Stock puede ser decimal (ej: 1.5kg)
    vende_por_peso BOOLEAN NOT NULL DEFAULT 0,
    controla_stock BOOLEAN NOT NULL DEFAULT 1,
    activo BOOLEAN NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS turnos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha_apertura TEXT NOT NULL,
    fecha_cierre TEXT,
    fondo_inicial INTEGER NOT NULL DEFAULT 0,
    total_esperado INTEGER,
    total_declarado INTEGER,
    diferencia INTEGER,
    estado TEXT NOT NULL DEFAULT 'abierto' -- 'abierto' o 'cerrado'
);

CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_ticket TEXT NOT NULL UNIQUE,
    fecha TEXT NOT NULL,
    subtotal INTEGER NOT NULL,
    ajuste INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL,
    metodo_pago TEXT NOT NULL,
    anulada BOOLEAN NOT NULL DEFAULT 0,
    turno_id INTEGER REFERENCES turnos(id)
);

CREATE TABLE IF NOT EXISTS venta_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    cantidad REAL NOT NULL,
    precio INTEGER NOT NULL,
    subtotal INTEGER NOT NULL,
    FOREIGN KEY (venta_id) REFERENCES ventas(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE IF NOT EXISTS caja_movimientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    turno_id INTEGER NOT NULL,
    tipo TEXT NOT NULL, -- 'ingreso' o 'retiro'
    monto INTEGER NOT NULL,
    motivo TEXT NOT NULL DEFAULT '',
    fecha TEXT NOT NULL,
    FOREIGN KEY (turno_id) REFERENCES turnos(id)
);
