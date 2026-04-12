import { useState, useEffect, useCallback, Fragment } from "react";
import { invoke } from "@tauri-apps/api/core";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronDown } from "lucide-react";

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



  // Formatear fechas
  const formatearFechaCierre = (fechaStr) => {
    if (!fechaStr) return "-";
    try {
      const fechaObj = parse(fechaStr, "yyyy-MM-dd HH:mm:ss", new Date());
      return format(fechaObj, "dd/MM/yyyy HH:mm", { locale: es });
    } catch {
      return fechaStr;
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-main p-4 gap-4 overflow-hidden relative">
      
      {/* Indicador de carga superior */}
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-border overflow-hidden z-50">
          <div className="w-1/3 h-full bg-text-primary animate-pulse"></div>
        </div>
      )}

      {/* CABECERA MINIMA */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-black text-text-primary tracking-widest uppercase flex items-center gap-2">
          Auditoría de Cierres
        </h1>
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
                          {formatearFechaCierre(turno.fecha_cierre)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-text-secondary hidden sm:table-cell">
                          {formatearFechaCierre(turno.fecha_apertura)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium">
                          ${((turno.fondo_inicial || 0) / 100).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium hidden md:table-cell">
                          ${((turno.total_esperado || 0) / 100).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-black">
                          ${((turno.total_declarado || 0) / 100).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className={`px-4 py-3 text-right font-black tracking-wider text-base border-l border-border/50 ${colorDifStr}`}>
                          {dif >= 0 ? "+" : ""}{(dif / 100).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                              {mov.tipo === 'ingreso' ? "+" : "-"}${(mov.monto / 100).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
