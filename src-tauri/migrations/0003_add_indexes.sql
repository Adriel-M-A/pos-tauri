-- Índices para optimizar queries de historial e informes
-- Sin estos, SQLite hace full-scan con meses de datos acumulados

CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_turno_id ON ventas(turno_id);
CREATE INDEX IF NOT EXISTS idx_venta_items_venta_id ON venta_items(venta_id);
