import { parse, format } from "date-fns";
import { es } from "date-fns/locale";

// Formato canónico que SQLite guarda y Rust produce con chrono::Local
// Nunca cambiar este valor sin actualizar también el format en repositories.rs
export const FORMATO_DB = "yyyy-MM-dd HH:mm:ss";

/**
 * Parsea un string de fecha proveniente de SQLite/Rust.
 * PROHIBIDO usar new Date(string) directamente con strings de DB.
 *
 * @param {string|null} fechaStr — Ej: "2026-05-11 14:30:00"
 * @returns {Date|null} objeto Date en hora local, o null si el string es inválido
 */
export function parsearFechaDB(fechaStr) {
  if (!fechaStr) return null;
  return parse(fechaStr, FORMATO_DB, new Date());
}

/**
 * Parsea y formatea un string de DB en un solo paso para mostrar en la UI.
 * Usa locale "es" (Argentina) por defecto.
 *
 * @param {string|null} fechaStr — string proveniente de la DB
 * @param {string} formatoDestino — patrón date-fns de salida (default: "dd/MM/yyyy HH:mm")
 * @returns {string} fecha formateada lista para mostrar, o "-" si inválida o vacía
 */
export function formatearFecha(fechaStr, formatoDestino = "dd/MM/yyyy HH:mm") {
  const fecha = parsearFechaDB(fechaStr);
  if (!fecha) return "-";
  return format(fecha, formatoDestino, { locale: es });
}
