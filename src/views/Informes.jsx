import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { DollarSign, Hash, TrendingUp, Maximize2, Minimize2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import LoadingBar from "../components/ui/LoadingBar";
import { formatearMoneda } from "../utils/formato";

function Informes() {
  const [periodo, setPeriodo] = useState("este_mes");
  const [isLoading, setIsLoading] = useState(true);
  const [rankingExpandido, setRankingExpandido] = useState(false);

  // Estado de datos provenientes de Rust
  const [datos, setDatos] = useState({
    total_facturado: 0,
    cantidad_ventas: 0,
    promedio_ticket: 0,
    grafico: [],
    ranking: [],
    metodos_pago: [],
  });

  // --- Conversor de período a rango de fechas (hora local pura) ---
  const calcularRango = useCallback((p) => {
    const ahora = new Date();
    const hoyStr = format(ahora, "yyyy-MM-dd");

    switch (p) {
      case "hoy":
        return {
          desde: `${hoyStr} 00:00:00`,
          hasta: `${hoyStr} 23:59:59`,
          agrupacion: "hora",
        };
      case "ayer": {
        const ayerStr = format(subDays(ahora, 1), "yyyy-MM-dd");
        return {
          desde: `${ayerStr} 00:00:00`,
          hasta: `${ayerStr} 23:59:59`,
          agrupacion: "hora",
        };
      }
      case "esta_semana": {
        // Lunes como inicio de semana (locale: es)
        const lunes = startOfWeek(ahora, { weekStartsOn: 1 });
        return {
          desde: `${format(lunes, "yyyy-MM-dd")} 00:00:00`,
          hasta: `${hoyStr} 23:59:59`,
          agrupacion: "dia",
        };
      }
      case "este_mes": {
        const inicioMes = startOfMonth(ahora);
        return {
          desde: `${format(inicioMes, "yyyy-MM-dd")} 00:00:00`,
          hasta: `${hoyStr} 23:59:59`,
          agrupacion: "dia",
        };
      }
      case "mes_anterior": {
        const mesAnterior = subMonths(ahora, 1);
        const inicioMesAnt = startOfMonth(mesAnterior);
        const finMesAnt = endOfMonth(mesAnterior);
        return {
          desde: `${format(inicioMesAnt, "yyyy-MM-dd")} 00:00:00`,
          hasta: `${format(finMesAnt, "yyyy-MM-dd")} 23:59:59`,
          agrupacion: "dia",
        };
      }
      default:
        return { desde: `${hoyStr} 00:00:00`, hasta: `${hoyStr} 23:59:59`, agrupacion: "dia" };
    }
  }, []);

  // --- Petición al backend ---
  const cargarInforme = useCallback(async (p) => {
    setIsLoading(true);
    const { desde, hasta, agrupacion } = calcularRango(p);
    try {
      const payload = await invoke("get_informe", { desde, hasta, agrupacion });
      if (!payload) return;
      setDatos(payload);
    } catch (err) {
      console.error("Fallo al cargar informe:", err);
    } finally {
      setIsLoading(false);
    }
  }, [calcularRango]);

  // Efecto principal: reacciona al cambio de período
  useEffect(() => {
    cargarInforme(periodo);
  }, [periodo, cargarInforme]);

  const btnClases = (p) => `cursor-pointer px-4 py-2 font-bold text-sm border-none transition-colors ${
    periodo === p ? "bg-accent text-white" : "bg-bg-panel text-text-secondary hover:bg-border/50"
  }`;

  return (
    <div className="flex flex-col h-full bg-bg-main p-4 gap-4 overflow-auto relative">
      
      {/* Indicador de carga superior */}
      <LoadingBar isVisible={isLoading} />

      {/* BOTONERA SUPERIOR */}
      <div className="flex gap-2">
        <button className={btnClases("hoy")} onClick={() => setPeriodo("hoy")}>Hoy</button>
        <button className={btnClases("ayer")} onClick={() => setPeriodo("ayer")}>Ayer</button>
        <button className={btnClases("esta_semana")} onClick={() => setPeriodo("esta_semana")}>Esta Semana</button>
        <button className={btnClases("este_mes")} onClick={() => setPeriodo("este_mes")}>Este Mes</button>
        <button className={btnClases("mes_anterior")} onClick={() => setPeriodo("mes_anterior")}>Mes Anterior</button>
      </div>

      {/* CUERPO DE DATOS EN GRILLA DE 6 COLUMNAS */}
      <div className="grid grid-cols-6 grid-rows-[auto_1fr] gap-4 flex-1 min-h-0">
        
        {/* FILA 1: KPIs (3 cards x 2 cols c/u) */}
        {/* Total Facturado */}
        <div className="col-span-2 bg-white p-4 border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-text-secondary uppercase mb-1">Total Facturado</p>
            <p className="text-3xl font-black text-text-primary uppercase">${formatearMoneda(datos.total_facturado)}</p>
          </div>
          <div className="w-12 h-12 bg-success/10 text-success flex items-center justify-center shrink-0">
            <DollarSign size={24} />
          </div>
        </div>
        
        {/* Cantidad Ventas */}
        <div className="col-span-2 bg-white p-4 border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-text-secondary uppercase mb-1">Cantidad Ventas</p>
            <p className="text-3xl font-black text-text-primary">{datos.cantidad_ventas} Tickets</p>
          </div>
          <div className="w-12 h-12 bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <Hash size={24} />
          </div>
        </div>

        {/* Promedio x Venta */}
        <div className="col-span-2 bg-white p-4 border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-text-secondary uppercase mb-1">Ticket Promedio</p>
            <p className="text-3xl font-black text-text-primary uppercase">${formatearMoneda(datos.promedio_ticket)}</p>
          </div>
          <div className="w-12 h-12 bg-text-primary/10 text-text-primary flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* FILA 2: GRAFICO (4 cols) + RANKING (2 cols) */}
        
        {/* ZONA IZQ: Grafico de Barras */}
        <div className="col-span-4 bg-white border border-border shadow-sm p-4 flex flex-col min-h-[350px]">
          <h3 className="text-sm font-bold text-text-secondary uppercase mb-4">Ingresos por Período</h3>
          
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datos.grafico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#64748B', fontWeight: 'bold' }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748B' }} 
                  tickFormatter={(val) => `$${val / 100}`}
                />
                <Tooltip 
                  cursor={{fill: '#F1F5F9'}} 
                  contentStyle={{ backgroundColor: '#1e1e1e', border: 'none', color: '#ffffff', fontWeight: 'bold', fontSize: '13px' }}
                  itemStyle={{color: '#ffffff'}}
                  formatter={(value) => [`$${formatearMoneda(value)}`, "Facturación"]}
                />
                <Bar 
                  dataKey="total" 
                  fill="#4a6fa5" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
            
            {datos.total_facturado === 0 && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-text-secondary bg-white/80">
                No hay movimientos registrados para graficar este período.
              </div>
            )}
          </div>
        </div>

        {/* ZONA DER: Métodos de Pago + Ranking */}
        <div className="col-span-2 flex flex-col gap-4 min-h-[350px]">

          {/* Tarjeta Superior: Ingresos por Método de Pago */}
          <div className="bg-white border border-border shadow-sm p-4 flex flex-col transition-all duration-200">
            <h3 className="text-sm font-bold text-text-secondary uppercase mb-4 pb-2 border-b border-border">Ingresos por Medio de Pago</h3>
            
            {!rankingExpandido && (
              <div className="flex flex-col gap-2">
                {datos.metodos_pago.length === 0 && !isLoading ? (
                  <div className="text-sm text-text-secondary text-center py-2 font-bold">Sin datos</div>
                ) : (
                  datos.metodos_pago.map((mp) => {
                    const porcentaje = datos.total_facturado > 0
                      ? ((mp.total / datos.total_facturado) * 100).toFixed(1)
                      : "0.0";
                    return (
                      <div key={mp.metodo_pago} className="flex items-center justify-between p-3 bg-bg-panel border border-border">
                        <span className="text-sm font-bold text-text-primary capitalize">{mp.metodo_pago}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-accent">
                            ${formatearMoneda(mp.total)}
                          </span>
                          <span className="text-[10px] font-bold text-text-secondary bg-white px-1.5 py-0.5 border border-border">
                            {porcentaje}%
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Tarjeta Inferior: Ranking Top 10 con scroll */}
          <div className="bg-white border border-border shadow-sm p-4 flex flex-col transition-all duration-200 flex-1 min-h-0">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
              <h3 className="text-sm font-bold text-text-secondary uppercase">Ranking de Ventas (Top 10)</h3>
              <button 
                onClick={() => setRankingExpandido(!rankingExpandido)}
                className="text-text-secondary hover:text-accent cursor-pointer transition-colors bg-transparent border-none p-1"
              >
                {rankingExpandido ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
            
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 pr-1">
              {datos.ranking.length === 0 && !isLoading ? (
                <div className="text-sm text-text-secondary h-full flex items-center justify-center font-bold">
                  Información insuficiente
                </div>
              ) : (
                datos.ranking.map((prod, i) => (
                  <div key={`${prod.nombre}-${i}`} className="flex items-center justify-between p-3 bg-bg-panel border border-border hover:border-accent transition-colors shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 shrink-0 bg-accent rounded flex items-center justify-center text-white text-xs font-black">
                        {i + 1}
                      </div>
                      <span className="text-sm font-bold text-text-primary truncate">{prod.nombre}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 bg-white px-2 py-1 border border-border text-xs font-bold text-text-secondary">
                      {prod.cantidad} <span className="font-normal opacity-70">Salidas</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

export default Informes;
