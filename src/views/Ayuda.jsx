import { useState } from "react";
import ReactMarkdown from "react-markdown";
import TituloVista from "../components/ui/TituloVista";

// Importar manuales como raw strings usando Vite
import manualIntroduccion from "../manuals/introduccion.md?raw";
import manualCaja from "../manuals/caja.md?raw";
import manualInventario from "../manuals/inventario.md?raw";
import manualHistorial from "../manuals/historial.md?raw";
import manualInformes from "../manuals/informes.md?raw";
import manualCierres from "../manuals/cierres.md?raw";
import manualRespaldos from "../manuals/respaldos.md?raw";

const TABS = [
  { id: "introduccion", nombre: "Introducción", contenido: manualIntroduccion },
  { id: "caja", nombre: "Caja", contenido: manualCaja },
  { id: "inventario", nombre: "Inventario", contenido: manualInventario },
  { id: "historial", nombre: "Historial", contenido: manualHistorial },
  { id: "informes", nombre: "Informes", contenido: manualInformes },
  { id: "cierres", nombre: "Cierres", contenido: manualCierres },
  { id: "respaldos", nombre: "Respaldos", contenido: manualRespaldos },
];

function Ayuda() {
  const [tabActiva, setTabActiva] = useState("introduccion");
  const contenido = TABS.find((t) => t.id === tabActiva)?.contenido ?? "";

  return (
    <div className="flex flex-col h-full bg-bg-main">
      {/* Cabecera del Manual */}
      <div className="p-6 pb-0">
        <TituloVista titulo="Manual de Usuario" />

        {/* Selector de Tabs (Estilo Informes) */}
        <div className="flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id)}
              className={`cursor-pointer px-4 py-2 font-bold text-sm transition-colors border ${
                tabActiva === tab.id
                  ? "bg-accent text-white border-accent"
                  : "bg-bg-panel border-border text-text-secondary hover:bg-border/50"
              }`}
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
