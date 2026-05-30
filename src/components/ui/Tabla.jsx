import React from "react";

function Tabla({
  columnas = [],
  stickyHeader = false,
  estadoVacio = null,
  isLoading = false,
  mensajeCarga = "Cargando datos...",
  mostrarVacio = false,
  children
}) {
  return (
    <div className="flex-1 bg-white border border-border shadow-sm flex flex-col min-h-0 overflow-hidden">
      <div className="overflow-auto flex-1">
        <table className="w-full border-collapse">
          <thead
            className={
              stickyHeader
                ? "sticky top-0 bg-bg-panel border-b-2 border-text-primary z-10 shadow-sm"
                : "bg-bg-panel border-b border-border"
            }
          >
            <tr>
              {columnas.map((col, idx) => {
                let alignClass = "text-left";
                if (col.alinear === "right") alignClass = "text-right";
                if (col.alinear === "center") alignClass = "text-center";

                let hiddenClass = "";
                if (col.ocultarBajo === "sm") hiddenClass = "hidden sm:table-cell";
                if (col.ocultarBajo === "md") hiddenClass = "hidden md:table-cell";

                return (
                  <th
                    key={idx}
                    className={`text-xs font-semibold text-text-secondary uppercase px-4 py-3 tracking-wider ${alignClass} ${hiddenClass} ${col.clasesExtras || ""}`}
                  >
                    {col.titulo}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td
                  colSpan={columnas.length}
                  className="text-center py-12 text-accent text-sm font-bold animate-pulse"
                >
                  {mensajeCarga}
                </td>
              </tr>
            )}

            {!isLoading && mostrarVacio && estadoVacio && (
              <tr>
                <td colSpan={columnas.length} className="py-12">
                  {estadoVacio}
                </td>
              </tr>
            )}

            {/* Los <tr> con los datos los renderiza el padre */}
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Tabla;
