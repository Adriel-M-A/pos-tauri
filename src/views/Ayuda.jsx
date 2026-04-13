import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

// Importar manuales como raw strings usando Vite
import manualIntroduccion from "../manuals/introduccion.md?raw";
import manualCaja from "../manuals/caja.md?raw";
import manualInventario from "../manuals/inventario.md?raw";
import manualHistorial from "../manuals/historial.md?raw";
import manualInformes from "../manuals/informes.md?raw";
import manualCierres from "../manuals/cierres.md?raw";

const TABS = [
  { id: "introduccion", nombre: "Introducción", contenido: manualIntroduccion },
  { id: "caja", nombre: "Caja", contenido: manualCaja },
  { id: "inventario", nombre: "Inventario", contenido: manualInventario },
  { id: "historial", nombre: "Historial", contenido: manualHistorial },
  { id: "informes", nombre: "Informes", contenido: manualInformes },
  { id: "cierres", nombre: "Cierres", contenido: manualCierres },
];

function Ayuda() {
  const [tabActiva, setTabActiva] = useState("introduccion");
  const [contenido, setContenido] = useState("");

  useEffect(() => {
    const selected = TABS.find((t) => t.id === tabActiva);
    setContenido(selected ? selected.contenido : "");
  }, [tabActiva]);

  return (
    <div className="flex flex-col h-full bg-bg-main">
      {/* Cabecera del Manual */}
      <div className="h-16 px-6 bg-bg-panel border-b border-border flex items-center justify-between">
        <h1 className="text-lg font-black text-text-primary tracking-widest uppercase">
          Manual de Usuario
        </h1>

        {/* Selector de Tabs (Estilo Reports) */}
        <div className="flex bg-bg-main p-1 border border-border">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id)}
              className={`
                px-4 py-1.5 text-[10px] font-bold uppercase tracking-tighter cursor-pointer transition-colors
                ${tabActiva === tab.id
                  ? "bg-text-primary text-white"
                  : "bg-transparent text-text-secondary hover:bg-border/30"}
              `}
            >
              {tab.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Área del Lector de Markdown */}
      <div className="flex-1 overflow-auto p-8 max-w-6xl mx-auto w-full">
        <div className="manual-markdown">
          <ReactMarkdown>{contenido}</ReactMarkdown>
        </div>

        {/* Info lateral o pie de página del manual */}
        <div className="mt-12 pt-6 border-t border-border flex justify-between items-center text-[10px] font-medium text-text-secondary uppercase">
          <span>Soporte Técnico: ADRIEL.DEV97@GMAIL.COM</span>
          <span>Actualizado: Abril 2026</span>
        </div>
      </div>
    </div>
  );
}

export default Ayuda;
