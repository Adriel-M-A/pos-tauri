import { Loader2 } from "lucide-react";
import KeyBadge from "./KeyBadge";

function Boton({
  variante = "primario",
  icono: Icono,
  atajo,
  cargando = false,
  disabled = false,
  ancho = "auto",
  onClick,
  children,
  className = "",
  ...props
}) {
  const baseClasses =
    "flex items-center justify-center gap-2 px-4 py-3 font-bold text-sm uppercase transition-colors cursor-pointer border-none";

  const widthClasses = ancho === "full" ? "w-full" : "";

  const disabledClasses =
    disabled || cargando ? "opacity-40 cursor-not-allowed" : "";

  let variantClasses = "";
  if (variante === "primario") {
    variantClasses = "bg-accent text-white hover:bg-accent/90";
  } else if (variante === "secundario") {
    variantClasses =
      "bg-white border border-border text-text-primary hover:bg-border/50";
  } else if (variante === "peligro") {
    variantClasses = "bg-danger text-white hover:bg-danger/90";
  } else if (variante === "peligro-ghost") {
    variantClasses =
      "bg-transparent border border-danger text-danger hover:bg-danger/10";
  }

  // Si tiene border de Tailwind u otras clases, asegurarse de pasarlas bien
  return (
    <button
      onClick={onClick}
      disabled={disabled || cargando}
      className={`${baseClasses} ${variantClasses} ${widthClasses} ${disabledClasses} ${className}`}
      {...props}
    >
      {cargando ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        Icono && <Icono size={18} />
      )}
      {children}
      {atajo && <KeyBadge tecla={atajo} />}
    </button>
  );
}

export default Boton;
