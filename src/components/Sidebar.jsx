import {
  ShoppingCart,
  Package,
  ClockArrowUp,
  ChartNoAxesCombined,
  Banknote,
  ShieldCheck,
  HardDriveDownload,
  Info
} from "lucide-react";
import pkg from "../../package.json";

// Formatear versión: "1.0.0" -> "1", "1.1.0" -> "1.1", "2.3.1" -> "2.3.1"
const formatearVersion = (v) => {
  const partes = v.split(".").map(Number);
  if (partes[2] === 0 && partes[1] === 0) return String(partes[0]);
  if (partes[2] === 0) return `${partes[0]}.${partes[1]}`;
  return v;
};

// Definición de las opciones de navegación del sidebar
const opcionesMenu = [
  { id: "caja", nombre: "Caja", icono: ShoppingCart },
  { id: "inventario", nombre: "Inventario", icono: Package },
  { id: "historial", nombre: "Historial", icono: ClockArrowUp },
  { id: "informes", nombre: "Informes", icono: ChartNoAxesCombined },
  { id: "cierre", nombre: "Cierre", icono: Banknote },
  { id: "auditoria", nombre: "Auditoría", icono: ShieldCheck },
  { id: "respaldos", nombre: "Respaldos", icono: HardDriveDownload },
];

function Sidebar({ vistaActiva, onCambiarVista }) {
  return (
    <aside className="w-56 h-full bg-bg-sidebar flex flex-col">
      {/* Encabezado del sidebar con logo */}
      <div className="p-4 border-b border-bg-sidebar-active flex items-center gap-3">
        <img src="/estadisticas.png" alt="Logo" className="w-8 h-8" />
        <h1 className="text-text-sidebar-active text-lg font-bold tracking-wide">
          SISTEMA POS
        </h1>
      </div>

      {/* Opciones de navegación */}
      <nav className="flex-1 py-2">
        {opcionesMenu.map((opcion) => {
          const Icono = opcion.icono;
          const activo = vistaActiva === opcion.id;

          return (
            <button
              key={opcion.id}
              onClick={() => onCambiarVista(opcion.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer
                border-none outline-none
                ${activo
                  ? "bg-bg-sidebar-active text-text-sidebar-active border-l-3 border-l-accent"
                  : "bg-transparent text-text-sidebar hover:bg-bg-sidebar-hover"
                }
              `}
            >
              <Icono size={20} />
              <span className="text-sm font-medium">{opcion.nombre}</span>
            </button>
          );
        })}
      </nav>

      {/* Pie del sidebar */}
      <div className="p-4 border-t border-bg-sidebar-active">
        <button
          onClick={() => onCambiarVista("ayuda")}
          className={`
            w-full flex items-center justify-center gap-2 text-xs opacity-60 bg-transparent border-none cursor-pointer 
            transition-colors duration-200
            ${vistaActiva === "ayuda" ? "text-text-sidebar-active font-bold opacity-100" : "text-text-sidebar hover:opacity-100 hover:text-text-sidebar-active"}
          `}
        >
          <Info size={14} />
          Versión {formatearVersion(pkg.version)}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
