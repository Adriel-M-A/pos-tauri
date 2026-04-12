-- Agregar columna de observaciones libres al registro de turno cerrado
ALTER TABLE turnos ADD COLUMN observaciones TEXT;
