/**
 * CharacterCount — Indicador visual de longitud de texto.
 * Muestra "actual/max" y cambia de color al acercarse al límite.
 * - Normal: gris discreto
 * - 80%+: naranja (accent)
 * - 100%: rojo (danger)
 */
function CharacterCount({ current = 0, max = 100 }) {
  const porcentaje = max > 0 ? (current / max) * 100 : 0;

  let colorClass = "text-text-secondary";
  if (porcentaje >= 100) {
    colorClass = "text-danger font-bold";
  } else if (porcentaje >= 80) {
    colorClass = "text-accent font-semibold";
  }

  return (
    <span className={`text-[11px] select-none tabular-nums ${colorClass}`}>
      {current}/{max}
    </span>
  );
}

export default CharacterCount;
