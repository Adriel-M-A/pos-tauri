import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Caja from "../views/Caja";
import Inventario from "../views/Inventario";
import Historial from "../views/Historial";
import Informes from "../views/Informes";
import Cierre from "../views/Cierre";
import AuditoriaCierres from "../views/AuditoriaCierres";
import Ayuda from "../views/Ayuda";

// Mapa de vistas disponibles
const vistas = {
  caja: Caja,
  inventario: Inventario,
  historial: Historial,
  informes: Informes,
  cierre: Cierre,
  auditoria: AuditoriaCierres,
  ayuda: Ayuda,
};

function MainLayout() {
  const [vistaActiva, setVistaActiva] = useState("caja");

  // Obtener el componente de la vista activa
  const VistaActual = vistas[vistaActiva];

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar de navegación */}
      <Sidebar vistaActiva={vistaActiva} onCambiarVista={setVistaActiva} />

      {/* Contenido principal */}
      <main className="flex-1 overflow-auto bg-bg-main relative">
        <VistaActual onCambiarVista={setVistaActiva} />
      </main>
    </div>
  );
}

export default MainLayout;
