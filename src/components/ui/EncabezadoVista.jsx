function EncabezadoVista({
  titulo,
  variante = "plano",
  accionDerecha,
  segundaFila,
  className = ""
}) {
  const esPanel = variante === "panel";

  return (
    <div
      className={`flex flex-col p-4 gap-3 shrink-0 ${
        esPanel ? "bg-bg-panel border-b border-border" : ""
      } ${className}`}
    >
      {/* Fila 1: Titulo y/o Acción Derecha */}
      {(titulo || accionDerecha) && (
        <div className="flex items-center justify-between">
          {titulo ? (
            <h1 className="text-xl font-black uppercase text-text-primary">
              {titulo}
            </h1>
          ) : (
            <div />
          )}
          
          {accionDerecha && (
            <div className="flex items-center gap-3">{accionDerecha}</div>
          )}
        </div>
      )}

      {/* Separador: Solo en variante plano cuando hay título */}
      {titulo && !esPanel && (
        <div className="border-b border-border pb-1" />
      )}

      {/* Fila 2: Segunda Fila opcional */}
      {segundaFila && <div>{segundaFila}</div>}
    </div>
  );
}

export default EncabezadoVista;
