import { useState, useEffect } from "react";
import { HardDriveDownload, HardDriveUpload, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { differenceInCalendarDays } from "date-fns";
import { parsearFechaDB } from "../utils/fecha";
import ConfirmModal from "../components/ui/ConfirmModal";
import TituloVista from "../components/ui/TituloVista";

function Respaldos() {
  const [backupInfo, setBackupInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalRestaurar, setModalRestaurar] = useState(false);
  const [archivoRestaurar, setArchivoRestaurar] = useState(null);

  // Cargar info del último backup al montar
  useEffect(() => {
    cargarInfo();
  }, []);

  const cargarInfo = async () => {
    setIsLoading(true);
    try {
      const info = await invoke("get_backup_info");
      setBackupInfo(info);
    } catch (err) {
      console.error("Error al cargar info de backup:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calcula días transcurridos desde el último backup usando date-fns
  // parsearFechaDB evita el comportamiento no definido de new Date(string) con formato SQLite
  const diasDesdeUltimoBackup = () => {
    if (!backupInfo || !backupInfo.ultimo_backup) return null;
    const ultima = parsearFechaDB(backupInfo.ultimo_backup);
    if (!ultima) return null;
    return differenceInCalendarDays(new Date(), ultima);
  };

  const dias = diasDesdeUltimoBackup();
  const necesitaBackup = dias === null || dias >= 30;

  // --- CREAR BACKUP ---
  const handleCrearBackup = async () => {
    try {
      // Abrir diálogo nativo para elegir carpeta destino
      const carpeta = await open({
        directory: true,
        multiple: false,
        title: "Seleccione carpeta para guardar el respaldo",
      });

      if (!carpeta) return; // El usuario canceló

      setIsProcessing(true);
      const rutaFinal = await invoke("crear_backup", { rutaDestino: carpeta });

      toast.success("Respaldo creado exitosamente", {
        description: `Guardado en: ${rutaFinal}`,
        duration: 5000,
      });

      // Refrescar la info
      await cargarInfo();
    } catch (err) {
      console.error("Error al crear backup:", err);
      toast.error("Error al crear respaldo", {
        description: err?.mensaje || String(err),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // --- RESTAURAR BACKUP ---
  const handleSeleccionarRestauracion = async () => {
    try {
      const archivo = await open({
        directory: false,
        multiple: false,
        title: "Seleccione el archivo de respaldo (.db)",
        filters: [{ name: "Base de Datos", extensions: ["db"] }],
      });

      if (!archivo) return; // El usuario canceló

      setArchivoRestaurar(archivo);
      setModalRestaurar(true);
    } catch (err) {
      console.error("Error al seleccionar archivo:", err);
    }
  };

  const confirmarRestauracion = async () => {
    if (!archivoRestaurar) return;
    setModalRestaurar(false);
    setIsProcessing(true);

    try {
      await invoke("restaurar_backup", { rutaOrigen: archivoRestaurar });
      toast.success("Respaldo restaurado exitosamente", {
        description: "Reinicie la aplicación para aplicar los cambios correctamente.",
        duration: 8000,
      });
    } catch (err) {
      console.error("Error al restaurar:", err);
      toast.error("Error al restaurar respaldo", {
        description: err?.mensaje || String(err),
      });
    } finally {
      setIsProcessing(false);
      setArchivoRestaurar(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-main relative">

      {/* Barra de carga delgada — carga inicial y durante operaciones */}
      {(isLoading || isProcessing) && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-border overflow-hidden z-50">
          <div className="w-1/3 h-full bg-accent animate-pulse"></div>
        </div>
      )}

      <div className="p-4 bg-bg-main">
        <TituloVista titulo="Copias de Seguridad" />
      </div>

      {/* Contenido centrado (razonable para 2 tarjetas de acción) */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">

          {/* Alerta de estado */}
          {!isLoading && (
            <div className={`p-4 border flex items-center gap-4 ${necesitaBackup
                ? "bg-danger/5 border-danger/30"
                : "bg-success/5 border-success/30"
              }`}>
              {necesitaBackup ? (
                <AlertTriangle size={24} className="text-danger shrink-0" />
              ) : (
                <CheckCircle size={24} className="text-success shrink-0" />
              )}
              <div>
                <p className="text-sm font-bold text-text-primary">
                  {dias === null
                    ? "Nunca se realizó un respaldo de la base de datos."
                    : dias === 0
                      ? "La última copia de seguridad fue realizada hoy."
                      : `La última copia de seguridad fue realizada hace ${dias} día${dias > 1 ? "s" : ""}.`
                  }
                </p>
                {necesitaBackup && (
                  <p className="text-xs text-text-secondary mt-1">
                    Se recomienda realizar un respaldo cada 30 días como mínimo para proteger su información.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Info del último backup */}
          {backupInfo && (
            <div className="p-4 bg-white border border-border">
              <h3 className="text-xs font-bold text-text-secondary uppercase mb-3 pb-2 border-b border-border">
                Último Respaldo Registrado
              </h3>
              <div className="flex items-center gap-3 mb-2">
                <Clock size={14} className="text-text-secondary" />
                <span className="text-sm text-text-primary font-medium">{backupInfo.ultimo_backup}</span>
              </div>
              <div className="flex items-center gap-3">
                <HardDriveDownload size={14} className="text-text-secondary" />
                <span className="text-xs text-text-secondary truncate">{backupInfo.ruta}</span>
              </div>
            </div>
          )}

          {/* Tarjetas de acción */}
          <div className="grid grid-cols-2 gap-6">

            {/* Crear Backup */}
            <div className="bg-white border border-border p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-text-primary uppercase mb-2">Crear Respaldo</h3>
                <p className="text-xs text-text-secondary mb-6 leading-relaxed">
                  Genera una copia exacta de toda su base de datos (ventas, productos, cierres) y la guarda en la carpeta que usted elija.
                </p>
              </div>
              <button
                onClick={handleCrearBackup}
                disabled={isProcessing}
                className={`w-full py-3 text-sm font-bold uppercase border cursor-pointer transition-colors ${isProcessing
                    ? "bg-border text-text-secondary border-border cursor-not-allowed"
                    : "bg-accent text-white border-accent hover:bg-accent/90"
                  }`}
              >
                {isProcessing ? "Procesando..." : "Elegir Carpeta y Respaldar"}
              </button>
            </div>

            {/* Restaurar Backup */}
            <div className="bg-white border border-border p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-text-primary uppercase mb-2">Restaurar Respaldo</h3>
                <p className="text-xs text-text-secondary mb-6 leading-relaxed">
                  Sobreescribe la base de datos actual con una copia anterior. Esto reemplazará todos los datos actuales por los del archivo seleccionado.
                </p>
              </div>
              <button
                onClick={handleSeleccionarRestauracion}
                disabled={isProcessing}
                className={`w-full py-3 text-sm font-bold uppercase border cursor-pointer transition-colors ${isProcessing
                    ? "bg-border text-text-secondary border-border cursor-not-allowed"
                    : "bg-transparent text-danger border-danger hover:bg-danger/10"
                  }`}
              >
                {isProcessing ? "Procesando..." : "Seleccionar Archivo .db"}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Modal de confirmación para restaurar */}
      {modalRestaurar && (
        <ConfirmModal
          isOpen={modalRestaurar}
          titulo="Restaurar Respaldo"
          mensaje="Esta acción REEMPLAZARÁ toda la base de datos actual (ventas, productos, cierres) con los datos del archivo seleccionado. Después de restaurar, deberá reiniciar la aplicación. ¿Está seguro?"
          textoConfirmar="Sí, Restaurar"
          textoCancelar="Cancelar"
          onConfirm={confirmarRestauracion}
          onCancel={() => { setModalRestaurar(false); setArchivoRestaurar(null); }}
        />
      )}
    </div>
  );
}

export default Respaldos;

