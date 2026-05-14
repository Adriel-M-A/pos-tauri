import { useState, useEffect, useCallback, Fragment } from "react";
import { invoke } from "@tauri-apps/api/core";
import { format } from "date-fns";
import { formatearFecha } from "../utils/fecha";
import { ChevronDown } from "lucide-react";
import LoadingBar from "../components/ui/LoadingBar";
import { formatearMoneda } from "../utils/formato";
import TituloVista from "../components/ui/TituloVista";

function AuditoriaCierres() {
  const [mes, setMes] = useState(() => format(new Date(), "yyyy-MM"));
  const [cierres, setCierres] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filaExpandida, setFilaExpandida] = useState(null);

  // --- Cargar cierres por mes ---
  const cargarCierres = useCallback(async () => {
    setIsLoading(true);
    try {
      const historial = await invoke("get_historial_cierres", { mes });
      setCierres(historial);
      // Reset expansion when changing months
      setFilaExpandida(null);
    } catch (err) {
      console.error("Fallo al cargar historial de cierres:", err);
    } finally {
      setIsLoading(false);
    }
  }, [mes]);

  useEffect(() => {
    cargarCierres();
  }, [cargarCierres]);

  // Expandir / colapsar fila
  const toggleFila = (id) => {
    setFilaExpandida(filaExpandida === id ? null : id);
  };

  return (
    <div className="flex flex-col h-full bg-bg-main p-4 gap-4 overflow-hidden relative">
      
      {/* Indicador de carga superior */}
      <LoadingBar isVisible={isLoading} />

      <TituloVista titulo="Auditoría de Cierres" />
      
      {/* FILTROS */}
      <div className="flex items-center justify-between mb-2">
        <div></div> {/* Espaciador para alinear a la derecha */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-text-secondary uppercase">Período:</label>
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="border border-border bg-white text-sm font-bold text-text-primary px-3 py-2 outline-none focus:border-text-primary"
          />
        </div>
      </div>

      {/* TABLA PRINCIPAL DE DATOS */}
      <div className="flex-1 bg-white border border-border shadow-sm flex flex-col min-h-0 overflow-hidden">
        <div className="overflow-auto flex-1">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-bg-panel border-b-2 border-text-primary z-10 shadow-sm">
              <tr>
                <th className="text-left text-xs font-bold text-text-secondary px-4 py-3 uppercase tracking-wider">Turno / Cierre</th>
                <th className="text-right text-xs font-bold text-text-secondary px-4 py-3 uppercase tracking-wider hidden sm:table-cell">Apertura</th>
                <th className="text-right text-xs font-bold text-text-secondary px-4 py-3 uppercase tracking-wider">Fondo Inicial</th>
                <th className="text-right text-xs font-bold text-text-secondary px-4 py-3 uppercase tracking-wider hidden md:table-cell">Total Esperado</th>
                <th className="text-right text-xs font-bold text-text-secondary px-4 py-3 uppercase tracking-wider">Total Declarado</th>
                <th className="text-right text-xs font-bold text-text-secondary px-4 py-3 uppercase tracking-wider w-32 border-l border-border/50">Diferencia</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {cierres.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <p className="text-text-secondary text-sm font-bold uppercase tracking-wider">No hay cierres registrados en {mes}</p>
                  </td>
                </tr>
              ) : (
                cierres.map((turno) => {
                  const expandido = filaExpandida === turno.id;
                  const dif = turno.diferencia || 0;
                  const esExacto = dif === 0;
                  const esSobrante = dif > 0;
                  // Si dif < 0 es faltante

                  const colorDifStr = esExacto 
                    ? "text-text-primary" 
                    : esSobrante ? "text-success" : "text-danger";

                  return (
                    <Fragment key={turno.id}>
                      {/* FILA PRINCIPAL */}
                      <tr 
                        onClick={() => toggleFila(turno.id)}
                        className={`border-b ${expandido ? "border-text-primary bg-bg-panel" : "border-border hover:bg-border/30"} cursor-pointer transition-colors`}
                      >
                        <td className="px-4 py-3 text-sm font-black text-text-primary">
                          <span className="text-text-secondary font-normal mr-2">#{turno.id}</span>
                          {formatearFecha(turno.fecha_cierre)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-text-secondary hidden sm:table-cell">
                          {formatearFecha(turno.fecha_apertura)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium">
                          ${formatearMoneda(turno.fondo_inicial || 0)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium hidden md:table-cell">
                          ${formatearMoneda(turno.total_esperado || 0)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-black">
                          ${formatearMoneda(turno.total_declarado || 0)}
                        </td>
                        <td className={`px-4 py-3 text-right font-black tracking-wider text-base border-l border-border/50 ${colorDifStr}`}>
                          {dif >= 0 ? "+" : ""}{formatearMoneda(dif)}
                        </td>
                        <td className="px-4 py-3 text-right text-text-secondary">
                          <ChevronDown 
                            size={18} 
                            className={`transition-transform duration-200 ${expandido ? "rotate-180 text-text-primary" : ""}`}
                          />
                        </td>
                      </tr>

                      {/* PANEL DESPLEGABLE (DETALLES Y AUDITORÍA) */}
                      {expandido && (
                        <tr className="bg-bg-panel border-b-2 border-border">
                          <td colSpan="7" className="p-0">
                            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-inner">
                              
                              {/* BLOQUE IZQ: Movimientos Manuales */}
                              <div className="col-span-1 md:col-span-2">
                                <h3 className="text-xs font-bold text-text-primary uppercase border-b border-border pb-2 mb-3">Movimientos Manuales Físicos</h3>
                                {turno.caja_movimientos && turno.caja_movimientos.length > 0 ? (
                                  <div className="bg-white border border-border">
                                    <table className="w-full text-xs">
                                      <tbody>
                                        {turno.caja_movimientos.map(mov => (
                                          <tr key={mov.id} className="border-b border-border last:border-none">
                                            <td className="px-3 py-2 text-text-secondary w-20">{mov.tipo.toUpperCase()}</td>
                                            <td className="px-3 py-2 text-text-primary">{mov.motivo || "-"}</td>
                                            <td className={`px-3 py-2 text-right font-bold tracking-wider ${mov.tipo === 'ingreso' ? 'text-success' : 'text-danger'}`}>
                                              {mov.tipo === 'ingreso' ? "+" : "-"}${formatearMoneda(mov.monto)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="text-xs text-text-secondary italic">Sin retiros ni ingresos adicionales registrados.</p>
                                )}
                              </div>

                              {/* BLOQUE DER: Observaciones */}
                              <div className="flex flex-col gap-4">
                                <div>
                                  <h3 className="text-xs font-bold text-text-primary uppercase border-b border-border pb-2 mb-3">Notas del Cajero</h3>
                                  <div className="bg-white border border-border p-3 min-h-[60px]">
                                    {turno.observaciones ? (
                                      <p className="text-sm text-text-primary italic">"{turno.observaciones}"</p>
                                    ) : (
                                      <p className="text-xs text-text-secondary opacity-60">Ninguna observación adjuntada.</p>
                                    )}
                                  </div>
                                </div>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AuditoriaCierres;
