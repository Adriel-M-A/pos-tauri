/**
 * Formatea un valor en centavos a una cadena de moneda (ARS).
 * @param {number} centavos - El valor en centavos (ej: 10050 = $100.50).
 * @returns {string} El valor formateado.
 */
export function formatearMoneda(centavos) {
  if (centavos == null || isNaN(centavos)) return "0,00";
  return (centavos / 100).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
