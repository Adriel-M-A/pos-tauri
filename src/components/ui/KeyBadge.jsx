/**
 * KeyBadge - Componente visual para mostrar atajos de teclado.
 * Estilo cuadrado, sin bordes redondeados. Minimalista.
 * 
 * Uso: <KeyBadge tecla="F12" />
 */
function KeyBadge({ tecla, className = "" }) {
  return (
    <span
      className={`inline-flex items-center justify-center px-1.5 py-0.5
                  text-[10px] font-bold uppercase tracking-wider leading-none
                  bg-black/20 text-white/80 border border-white/20
                  select-none pointer-events-none ${className}`}
    >
      {tecla}
    </span>
  );
}

export default KeyBadge;
