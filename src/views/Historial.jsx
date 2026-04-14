import { useState, useEffect, useMemo, Fragment } from "react";
import { ChevronDown, Ban, Receipt, DollarSign, Loader2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import ConfirmModal from "../components/ui/ConfirmModal";

function Historial() {
  // Inicialización de "hoy" basada estrictamente en la Zona Horaria Local (Ej: '2026-04-11')
  const hoy = format(new Date(), "yyyy-MM-dd");

  const [fechaFiltro, setFechaFiltro] = useState(hoy);
  const [mostrarAnuladas, setMostrarAnuladas] = useState(false);
  const [listaVentas, setListaVentas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estado para el acordeón
  const [expandedId, setExpandedId] = useState(null);

  // Caché local de items por venta_id → evita re-pedir a Rust si ya lo abrió
  const [itemsCache, setItemsCache] = useState({});
  const [loadingItems, setLoadingItems] = useState(null); // ID de la venta cargando items

  // Estado del modal de anulación
  const [ventaAAnular, setVentaAAnular] = useState(null);

  // --- CAPA 1: Cargar cabeceras por fecha ---
  const cargarVentas = async (fecha) => {
    setIsLoading(true);
    setExpandedId(null); // Colapsar al cambiar de día
    try {
      const cabeceras = await invoke("get_ventas_by_date", { fecha });
      setListaVentas(cabeceras);
    } catch (err) {
      console.error("Fallo al cargar historial:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Efecto que reacciona al cambio de fecha
  useEffect(() => {
    cargarVentas(fechaFiltro);
  }, [fechaFiltro]);

  // Filtrado visual: activas / anuladas
  const ventasFiltradas = useMemo(() => {
    return listaVentas.filter((v) => {
      return mostrarAnuladas ? true : v.anulada === false;
    });
  }, [listaVentas, mostrarAnuladas]);

  // KPIs calculados en base a cabeceras válidas del día
  const kpis = useMemo(() => {
    const validas = listaVentas.filter(v => !v.anulada);
    return {
      cantidad: validas.length,
      // ingresoTotal sigue en centavos en la memoria
      ingresoTotal: validas.reduce((sum, v) => sum + v.total, 0),
    };
  }, [listaVentas]);

  // --- CAPA 2: Carga diferida de items al expandir ---
  const toggleExpand = async (id) => {
    // Si ya está expandido, colapsar
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(id);

    // Si ya tenemos los items en caché, no viajamos a Rust
    if (itemsCache[id]) return;

    // Pedir detalles a Rust
    setLoadingItems(id);
    try {
      const items = await invoke("get_venta_items", { ventaId: id });
      setItemsCache(prev => ({ ...prev, [id]: items }));
    } catch (err) {
      console.error("Fallo al cargar detalle del ticket:", err);
    } finally {
      setLoadingItems(null);
    }
  };

  // --- ANULACIÓN ATÓMICA ---
  const anularVenta = (id) => {
    const ventaTarget = listaVentas.find(v => v.id === id);
    if (!ventaTarget || ventaTarget.anulada) return;
    setVentaAAnular(ventaTarget);
  };

  const confirmarAnulacion = async () => {
    if (!ventaAAnular) return;
    
    setIsLoading(true);
    setVentaAAnular(null);
    try {
      await invoke("anular_venta", { idVenta: ventaAAnular.id });
      // Refrescar la grilla desde Rust para ver el estado actualizado
      await cargarVentas(fechaFiltro);
      toast.success("Venta anulada", {
        description: `Ticket ${ventaAAnular.numero_ticket} inactivo y stock restaurado.`
      });
    } catch (err) {
      console.error("Fallo al anular venta:", err);
      toast.error("Error al efectuar anulación", {
        description: "Revisa la conexión o intenta nuevamente."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-main relative">

      {/* Barra de carga superior sutil */}
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-border overflow-hidden z-50">
          <div className="w-1/3 h-full bg-accent animate-pulse"></div>
        </div>
      )}

      {/* BARRA SUPERIOR DE CONTROL */}
      <div className="flex flex-col gap-4 p-4 bg-bg-panel border-b border-border">

        {/* Filtros e Inputs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border border-border px-3 py-2 bg-white focus-within:border-accent">
              <span className="text-xs font-bold text-text-secondary uppercase">DÍA:</span>
              <input
                type="date"
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
                className="outline-none border-none bg-transparent text-sm text-text-primary font-bold cursor-pointer"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-text-secondary hover:text-text-primary select-none whitespace-nowrap">
              <input
                type="checkbox"
                checked={mostrarAnuladas}
                onChange={(e) => setMostrarAnuladas(e.target.checked)}
                className="accent-accent"
              />
              Mostrar anuladas
            </label>
          </div>
        </div>

        {/* TARJETONES (KPIs) */}
        <div className="flex gap-4">
          {/* KPI 1 */}
          <div className="flex-1 flex items-center p-3 bg-white border border-border shadow-sm">
            <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center text-accent mr-3">
              <Receipt size={20} />
            </div>
            <div>
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-0.5">
                Tickets Emitidos
              </span>
              <span className="text-2xl font-black text-text-primary">
                {kpis.cantidad}
              </span>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="flex-1 flex items-center p-3 bg-white border border-border shadow-sm">
            <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center text-success mr-3">
              <DollarSign size={20} />
            </div>
            <div>
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-0.5">
                Ingreso Diario
              </span>
              <span className="text-2xl font-black text-text-primary">
                ${(kpis.ingresoTotal / 100).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* GRILLA PRINCIPAL */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white border border-border shadow-sm flex flex-col min-h-0 overflow-hidden">
          <div className="overflow-auto flex-1">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-bg-panel border-b-2 border-text-primary z-10 shadow-sm">
                <tr>
                  <th className="text-left text-xs font-bold text-text-secondary px-4 py-3 uppercase tracking-wider">Fecha y Hora</th>
                  <th className="text-left text-xs font-bold text-text-secondary px-4 py-3 uppercase tracking-wider">N° Ticket</th>
                  <th className="text-left text-xs font-bold text-text-secondary px-4 py-3 uppercase tracking-wider">Método Pago</th>
                  <th className="text-right text-xs font-bold text-text-secondary px-4 py-3 uppercase tracking-wider hidden md:table-cell">Ajuste</th>
                  <th className="text-right text-xs font-bold text-text-secondary px-4 py-3 uppercase tracking-wider border-l border-border/50 w-36">Total Cobrado</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {/* Estado vacío */}
                {ventasFiltradas.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan="6" className="text-center py-12">
                      <p className="text-text-secondary text-sm font-bold uppercase tracking-wider">
                        {listaVentas.length === 0
                          ? "No hay ventas registradas para esta fecha."
                          : "No hay ventas activas. Activá 'Mostrar anuladas' para verlas."}
                      </p>
                    </td>
                  </tr>
                )}

                {/* Estado de carga inicial */}
                {listaVentas.length === 0 && isLoading && (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-accent text-sm font-bold animate-pulse">
                      Consultando historial en base de datos...
                    </td>
                  </tr>
                )}

                {ventasFiltradas.map((venta) => {
                  const isExpanded = expandedId === venta.id;

                  // Mapeo Visual Local usando date-fns y ES locale
                  const fechaSegura = venta.fecha || "1970-01-01 00:00:00";
                  const fechaObj = parse(fechaSegura, "yyyy-MM-dd HH:mm:ss", new Date());
                  const fechaHermosa = format(fechaObj, "dd/MM/yyyy HH:mm", { locale: es });

                  const itemsDeEstaVenta = itemsCache[venta.id] || [];
                  const cargandoEsteDetalle = loadingItems === venta.id;

                  return (
                    <Fragment key={venta.id}>
                      {/* Fila Base del Ticket */}
                      <tr
                        onClick={() => toggleExpand(venta.id)}
                        className={`border-b ${isExpanded ? "border-text-primary bg-bg-panel" : "border-border hover:bg-border/30"} cursor-pointer transition-colors ${venta.anulada ? "opacity-50" : ""}`}
                      >
                        <td className={`px-4 py-3 text-sm font-black ${venta.anulada ? "line-through text-text-secondary" : "text-text-primary"}`}>
                          {fechaHermosa}
                        </td>
                        <td className={`px-4 py-3 text-sm font-mono ${venta.anulada ? "line-through text-text-secondary" : "text-accent"}`}>
                          {venta.numero_ticket}
                        </td>
                        <td className="px-4 py-3 text-sm text-text-secondary font-medium">
                          {venta.anulada ? "ANULADA" : venta.metodo_pago}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium hidden md:table-cell">
                          {venta.ajuste !== 0 ? (
                            <span className={venta.ajuste < 0 ? "text-danger" : "text-success"}>
                              {venta.ajuste < 0 ? "" : "+"}${(venta.ajuste / 100).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-text-secondary">-</span>
                          )}
                        </td>
                        <td className={`px-4 py-3 text-right font-black tracking-wider text-base border-l border-border/50 ${venta.anulada ? "line-through text-text-secondary" : "text-text-primary"}`}>
                          ${(venta.total / 100).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right text-text-secondary">
                          <ChevronDown 
                            size={18} 
                            className={`transition-transform duration-200 ${isExpanded ? "rotate-180 text-text-primary" : ""}`}
                          />
                        </td>
                      </tr>

                      {/* Panel Desplegable con Detalles */}
                      {isExpanded && (
                        <tr className="bg-bg-panel border-b-2 border-border">
                          <td colSpan="6" className="p-0">
                            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-inner">

                              {/* Listado de Artículos */}
                              <div className="col-span-1 md:col-span-2">
                                <h3 className="text-xs font-bold text-text-primary uppercase border-b border-border pb-2 mb-3">Desglose de Items</h3>

                                {cargandoEsteDetalle ? (
                                  <div className="flex items-center gap-2 py-4 text-accent text-sm animate-pulse">
                                    <Loader2 size={16} className="animate-spin" />
                                    Cargando detalles del ticket...
                                  </div>
                                ) : itemsDeEstaVenta.length > 0 ? (
                                  <div className="bg-white border border-border">
                                    <table className="w-full text-xs">
                                      <tbody>
                                        {itemsDeEstaVenta.map((it, idx) => (
                                          <tr key={idx} className="border-b border-border last:border-none">
                                            <td className="px-3 py-2 font-medium text-text-primary">{it.nombre}</td>
                                            <td className="px-3 py-2 text-center text-text-secondary w-20">
                                              {it.cantidad} {it.vende_por_peso && <span className="text-[10px] font-bold ml-0.5">kg</span>}
                                            </td>
                                            <td className="px-3 py-2 text-right text-text-secondary w-24">${(it.precio / 100).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-3 py-2 text-right font-bold text-text-primary w-24">${(it.subtotal / 100).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="text-xs text-text-secondary italic">Sin items registrados.</p>
                                )}
                              </div>

                              {/* Matemática Final + Botón Anular */}
                              <div className="flex flex-col gap-4">
                                <div>
                                  <h3 className="text-xs font-bold text-text-primary uppercase border-b border-border pb-2 mb-3">Resumen Financiero</h3>
                                  <div className="bg-white border border-border p-3 flex flex-col gap-2">
                                    <div className="flex justify-between text-xs text-text-secondary">
                                      <span>Subtotal Base:</span>
                                      <span className="font-bold text-text-primary">${(venta.subtotal / 100).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-text-secondary border-b border-border pb-2">
                                      <span>Ajuste Global:</span>
                                      <span className={`font-bold ${venta.ajuste < 0 ? "text-danger" : venta.ajuste > 0 ? "text-success" : "text-text-primary"}`}>
                                        ${(venta.ajuste / 100).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs font-bold uppercase text-text-secondary">Cobrado:</span>
                                      <span className="text-lg font-black text-text-primary">${(venta.total / 100).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                  </div>
                                </div>

                                {!venta.anulada ? (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); anularVenta(venta.id); }}
                                    className="mt-auto w-full flex items-center justify-center gap-2 py-3 border border-danger text-danger hover:bg-danger hover:text-white font-bold text-xs uppercase cursor-pointer transition-colors"
                                  >
                                    <Ban size={16} />
                                    Anular Venta
                                  </button>
                                ) : (
                                  <div className="mt-auto w-full py-3 bg-bg-main text-text-secondary text-xs uppercase font-bold text-center border border-border flex items-center justify-center gap-2">
                                    <Ban size={14} /> Anulada
                                  </div>
                                )}
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!ventaAAnular}
        titulo="ANULAR VENTA"
        mensaje="Al confirmar esta acción el ticket será invalidado y la mercadería será reingresada lógicamente al inventario. Los montos se restarán del ingreso diario. Esta operación NO se puede deshacer. ¿Seguro que querés anular la venta?"
        textoConfirmar="Anular Ticket"
        textoCancelar="Cancelar"
        onConfirm={confirmarAnulacion}
        onCancel={() => setVentaAAnular(null)}
      />
    </div>
  );
}

export default Historial;
