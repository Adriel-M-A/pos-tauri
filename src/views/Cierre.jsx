import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { formatearFecha } from "../utils/fecha";
import {
  Lock, Unlock, ArrowDownCircle, ArrowUpCircle,
  AlertTriangle, CheckCircle2, XCircle, Loader2, Banknote
} from "lucide-react";
import KeyBadge from "../components/ui/KeyBadge";
import { toast } from "sonner";
import LoadingBar from "../components/ui/LoadingBar";
import { formatearMoneda } from "../utils/formato";
import ConfirmModal from "../components/ui/ConfirmModal";
import CharacterCount from "../components/ui/CharacterCount";

function Cierre() {
  // Estado global de la vista: 'cargando' | 'apertura' | 'operacion' | 'cerrando' | 'resumen'
  const [fase, setFase] = useState("cargando");
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Apertura
  const [fondoInicial, setFondoInicial] = useState("");

  // Operación - Movimientos
  const [movimientos, setMovimientos] = useState([]);
  const [totalVentasTurno, setTotalVentasTurno] = useState(0);
  const [showMovForm, setShowMovForm] = useState(null); // 'ingreso' | 'retiro' | null
  const [movMonto, setMovMonto] = useState("");
  const [movMotivo, setMovMotivo] = useState("");

  // Cierre
  const [totalDeclarado, setTotalDeclarado] = useState("");
  const [observacionesCierre, setObservacionesCierre] = useState("");
  const [resumenCierre, setResumenCierre] = useState(null);

  // Estado para el modal de confirmación de cierre
  const [modalCierreOpen, setModalCierreOpen] = useState(false);

  // --- Consultar estado del turno al montar ---
  const consultarTurno = useCallback(async () => {
    try {
      const turno = await invoke("get_turno_abierto");
      if (turno) {
        setTurnoActivo(turno);
        // Cargar movimientos y total de ventas del turno en paralelo
        const [movs, totalVentas] = await Promise.all([
          invoke("get_movimientos_turno", { turnoId: turno.id }),
          invoke("get_total_ventas_turno", { turnoId: turno.id }),
        ]);
        setMovimientos(movs);
        setTotalVentasTurno(totalVentas);
        setFase("operacion");
      } else {
        setFase("apertura");
      }
    } catch (err) {
      console.error("Error al consultar turno:", err);
      setFase("apertura");
    }
  }, []);

  useEffect(() => {
    consultarTurno();
  }, [consultarTurno]);

  // --- FASE 3: CIERRE ---
  const handleIniciarCierre = useCallback(() => {
    setModalCierreOpen(true);
  }, []);

  // Atajo de teclado F2: Iniciar Cierre (solo en fase operacion)
  useEffect(() => {
    const manejarAtajo = (e) => {
      if (e.key === "F2" && fase === "operacion" && !modalCierreOpen) {
        e.preventDefault();
        handleIniciarCierre();
      }
    };
    window.addEventListener("keydown", manejarAtajo);
    return () => window.removeEventListener("keydown", manejarAtajo);
  }, [fase, modalCierreOpen, handleIniciarCierre]);

  // --- FASE 1: APERTURA ---
  const handleAbrirTurno = async () => {
    const fondo = Math.round(parseFloat(fondoInicial) * 100);
    if (isNaN(fondo) || fondo < 0) return;

    setIsLoading(true);
    try {
      const turnoId = await invoke("abrir_turno", { fondoInicial: fondo });
      const turno = await invoke("get_turno_abierto");
      setTurnoActivo(turno);
      setMovimientos([]);
      setFase("operacion");
      toast.success("Turno de caja abierto", {
        description: `Iniciado con fondo de $${formatearMoneda(fondo)}`
      });
    } catch (err) {
      console.error("Error al abrir turno:", err);
      toast.error("Error al efectuar apertura", {
        description: err?.mensaje || "Inténtalo nuevamente."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- FASE 2: OPERACIÓN - Registrar movimiento ---
  const handleRegistrarMovimiento = async () => {
    const monto = Math.round(parseFloat(movMonto) * 100);
    if (isNaN(monto) || monto <= 0 || !showMovForm || !turnoActivo) return;

    setIsLoading(true);
    try {
      await invoke("registrar_movimiento", {
        turnoId: turnoActivo.id,
        tipo: showMovForm,
        monto,
        motivo: movMotivo || (showMovForm === "ingreso" ? "Ingreso manual" : "Retiro manual"),
      });
      // Refrescar movimientos y total de ventas
      const [movs, totalVentas] = await Promise.all([
        invoke("get_movimientos_turno", { turnoId: turnoActivo.id }),
        invoke("get_total_ventas_turno", { turnoId: turnoActivo.id }),
      ]);
      setMovimientos(movs);
      setTotalVentasTurno(totalVentas);

      toast.success(showMovForm === "ingreso" ? "Ingreso de dinero registrado" : "Retiro de dinero registrado", {
        description: `Monto: $${formatearMoneda(monto)}`
      });

      setMovMonto("");
      setMovMotivo("");
      setShowMovForm(null);
    } catch (err) {
      console.error("Error al registrar movimiento:", err);
      toast.error("Error al registrar el movimiento", {
        description: err?.mensaje || String(err)
      });
    } finally {
      setIsLoading(false);
    }
  };


  const confirmarInicioCierre = () => {
    setModalCierreOpen(false);
    setFase("cerrando");
  };

  const handleFinalizarTurno = async () => {
    const declarado = Math.round(parseFloat(totalDeclarado) * 100);
    if (isNaN(declarado) || declarado < 0 || !turnoActivo) return;

    setIsLoading(true);
    try {
      const resultado = await invoke("cerrar_turno", {
        turnoId: turnoActivo.id,
        totalDeclarado: declarado,
        observaciones: observacionesCierre.trim() !== "" ? observacionesCierre.trim() : null
      });
      setResumenCierre(resultado);
      setTurnoActivo(null);
      setFase("resumen");
    } catch (err) {
      console.error("Error al cerrar turno:", err);
      toast.error("Error al cerrar el turno", {
        description: err?.mensaje || "Inténtalo nuevamente."
      });
    } finally {
      setIsLoading(false);
    }
  };


  // RENDERIZADO CONDICIONAL POR FASES
  // =============================================================

  // Cargando estado inicial
  if (fase === "cargando") {
    return (
      <div className="flex items-center justify-center h-full bg-bg-main">
        <div className="flex items-center gap-3 text-accent animate-pulse">
          <Loader2 size={24} className="animate-spin" />
          <span className="font-bold text-sm">Consultando estado del turno...</span>
        </div>
      </div>
    );
  }

  // ==================== FASE 1: APERTURA ====================
  if (fase === "apertura") {
    return (
      <div className="flex items-center justify-center h-full bg-bg-main">
        <div className="w-full max-w-md bg-white border border-border shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-accent/10 flex items-center justify-center text-accent">
              <Unlock size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-text-primary uppercase">Apertura de Turno</h2>
              <p className="text-xs text-text-secondary">Contá los billetes del cajón e ingresá el monto inicial.</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-text-secondary uppercase mb-2">
              Fondo Inicial ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="99999999"
              value={fondoInicial}
              onChange={(e) => setFondoInicial(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAbrirTurno()}
              placeholder="0.00"
              autoFocus
              className="w-full px-4 py-3 text-2xl font-black text-text-primary border border-border
                         outline-none focus:border-accent bg-bg-panel text-center"
            />
          </div>

          <button
            onClick={handleAbrirTurno}
            disabled={isLoading || !fondoInicial}
            className="w-full py-4 bg-accent text-white font-black text-sm uppercase tracking-wider
                       border-none cursor-pointer hover:bg-accent/90 transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Unlock size={18} />}
            Abrir Turno
          </button>
        </div>
      </div>
    );
  }

  // ==================== FASE 2: OPERACIÓN ====================
  if (fase === "operacion") {
    return (
      <div className="flex flex-col h-full bg-bg-main p-4 gap-4 overflow-auto relative">
        {/* Indicador de carga */}
        <LoadingBar isVisible={isLoading} />

        {/* Encabezado del turno */}
        <div className="bg-white border border-border shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center text-success">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-text-primary uppercase">Turno Abierto #{turnoActivo?.id}</h2>
              <p className="text-xs text-text-secondary capitalize">
                Apertura: {formatearFecha(turnoActivo?.fecha_apertura, "d 'de' MMMM, HH:mm 'hs'")}
                — Fondo: <span className="font-bold text-text-primary">${formatearMoneda(turnoActivo?.fondo_inicial || 0)}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {/* Total de ventas del turno activo */}
            <div className="text-right">
              <p className="text-xs font-bold text-text-secondary uppercase">Ventas del Turno</p>
              <p className="text-lg font-black text-success">${formatearMoneda(totalVentasTurno)}</p>
            </div>
            <button
              onClick={handleIniciarCierre}
              className="flex items-center gap-2 px-4 py-2 border border-danger text-danger
                         hover:bg-danger hover:text-white font-bold text-sm cursor-pointer transition-colors"
            >
              <Lock size={16} />
              Iniciar Cierre
              <KeyBadge tecla="F2" className="bg-danger/20 text-danger border-danger/30" />
            </button>
          </div>
        </div>

        {/* Zona de acciones: Botones de movimientos */}
        <div className="flex gap-4">
          <button
            onClick={() => { setShowMovForm(showMovForm === "ingreso" ? null : "ingreso"); setMovMonto(""); setMovMotivo(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 font-bold text-sm border cursor-pointer transition-colors ${showMovForm === "ingreso"
              ? "bg-success text-white border-success"
              : "bg-white text-success border-border hover:border-success"
              }`}
          >
            <ArrowDownCircle size={18} /> Registrar Ingreso
          </button>
          <button
            onClick={() => { setShowMovForm(showMovForm === "retiro" ? null : "retiro"); setMovMonto(""); setMovMotivo(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 font-bold text-sm border cursor-pointer transition-colors ${showMovForm === "retiro"
              ? "bg-danger text-white border-danger"
              : "bg-white text-danger border-border hover:border-danger"
              }`}
          >
            <ArrowUpCircle size={18} /> Registrar Retiro
          </button>
        </div>

        {/* Formulario de movimiento (condicional) */}
        {showMovForm && (
          <div className={`bg-white border-2 p-4 shadow-sm ${showMovForm === "ingreso" ? "border-success" : "border-danger"}`}>
            <h3 className="text-xs font-black text-text-secondary uppercase mb-3">
              {showMovForm === "ingreso" ? "Nuevo Ingreso de Efectivo" : "Nuevo Retiro de Efectivo"}
            </h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-text-secondary mb-1">Monto ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="99999999"
                  value={movMonto}
                  onChange={(e) => setMovMonto(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  className="w-full px-3 py-2 border border-border text-sm font-bold outline-none focus:border-accent"
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-text-secondary">Motivo (opcional)</label>
                  <CharacterCount current={movMotivo.length} max={100} />
                </div>
                <input
                  type="text"
                  maxLength={100}
                  value={movMotivo}
                  onChange={(e) => setMovMotivo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRegistrarMovimiento()}
                  placeholder={showMovForm === "ingreso" ? "Ej: Cambio inicial / Ingreso extra" : "Ej: Pago a proveedor / Gastos varios"}
                  className="w-full px-3 py-2 border border-border text-sm outline-none focus:border-accent"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleRegistrarMovimiento}
                  disabled={isLoading || !movMonto}
                  className={`px-6 py-2 font-bold text-sm text-white border-none cursor-pointer 
                             disabled:opacity-40 disabled:cursor-not-allowed ${showMovForm === "ingreso" ? "bg-success hover:bg-success/90" : "bg-danger hover:bg-danger/90"
                    }`}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de movimientos registrados */}
        <div className="flex-1 bg-white border border-border shadow-sm flex flex-col">
          <h3 className="text-xs font-bold text-text-secondary uppercase p-4 border-b border-border">
            Movimientos del Turno ({movimientos.length})
          </h3>
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-bg-panel border-b border-border">
                  <th className="text-left text-xs font-semibold text-text-secondary px-4 py-3 uppercase">Hora</th>
                  <th className="text-left text-xs font-semibold text-text-secondary px-4 py-3 uppercase">Tipo</th>
                  <th className="text-left text-xs font-semibold text-text-secondary px-4 py-3 uppercase">Motivo</th>
                  <th className="text-right text-xs font-semibold text-text-secondary px-4 py-3 uppercase">Monto</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-text-secondary text-sm">
                      No hay movimientos manuales registrados en este turno.
                    </td>
                  </tr>
                ) : (
                  movimientos.map((mov) => (
                    <tr key={mov.id} className="border-b border-border-light hover:bg-accent-light/30">
                      <td className="px-4 py-3 text-sm font-bold text-text-primary capitalize">
                        {formatearFecha(mov.fecha, "d 'de' MMMM, HH:mm 'hs'")}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 text-xs font-black uppercase ${mov.tipo === "ingreso"
                          ? "bg-success/10 text-success"
                          : "bg-danger/10 text-danger"
                          }`}>
                          {mov.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{mov.motivo || "-"}</td>
                      <td className={`px-4 py-3 text-sm text-right font-black ${mov.tipo === "ingreso" ? "text-success" : "text-danger"
                        }`}>
                        {mov.tipo === "ingreso" ? "+" : "-"}${formatearMoneda(mov.monto)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <ConfirmModal
          isOpen={modalCierreOpen}
          titulo="CIERRE DE CAJA"
          mensaje="Al confirmar esta acción se cortará la operatividad del sistema de ventas. Ningún ticket nuevo podrá ser facturado hasta efectuar una nueva Apertura de Caja. ¿Confirmás iniciar el arqueo y cierre del turno actual?"
          textoConfirmar="Cerrar Caja"
          textoCancelar="Cancelar"
          onConfirm={confirmarInicioCierre}
          onCancel={() => setModalCierreOpen(false)}
        />
      </div>
    );
  }

  // ==================== FASE 3: CERRANDO ====================
  if (fase === "cerrando") {
    return (
      <div className="flex items-center justify-center h-full bg-bg-main">
        <div className="w-full max-w-md bg-white border-2 border-danger shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-danger/10 rounded-full flex items-center justify-center text-danger">
              <Lock size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-text-primary uppercase">Cierre de Caja</h2>
              <p className="text-xs text-text-secondary">
                Contá el efectivo físico del cajón e ingresá el total exacto.
              </p>
            </div>
          </div>

          <div className="bg-bg-panel border border-border p-3 mb-4 text-xs text-text-secondary">
            <strong className="text-text-primary">⚠ Turno bloqueado.</strong> No se pueden registrar nuevas ventas hasta abrir un nuevo turno.
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-text-secondary uppercase mb-2">
              Efectivo Contado ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100000000"
              value={totalDeclarado}
              onChange={(e) => setTotalDeclarado(e.target.value)}
              placeholder="0.00"
              autoFocus
              className="w-full px-4 py-3 text-2xl font-black text-text-primary border-2 border-danger
                         outline-none focus:border-danger bg-bg-panel text-center"
            />
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-text-secondary uppercase">
                Observaciones del cajero (Opcional)
              </label>
              <CharacterCount current={observacionesCierre.length} max={250} />
            </div>
            <textarea
              maxLength={250}
              value={observacionesCierre}
              onChange={(e) => setObservacionesCierre(e.target.value)}
              placeholder="Ej: Faltan $500 por error en un vuelto..."
              rows={2}
              className="w-full px-3 py-2 border border-border text-sm outline-none focus:border-danger bg-bg-panel resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setFase("operacion")}
              className="flex-1 py-3 bg-bg-panel text-text-secondary font-bold text-sm border border-border
                         cursor-pointer hover:bg-border/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleFinalizarTurno}
              disabled={isLoading || !totalDeclarado}
              className="flex-1 py-3 bg-danger text-white font-black text-sm uppercase
                         border-none cursor-pointer hover:bg-danger/90 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
              Finalizar Turno
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== RESUMEN FINAL ====================
  if (fase === "resumen" && resumenCierre) {
    const { fondo_inicial, ventas_efectivo, ingresos_manuales, retiros_manuales, total_esperado, total_declarado: declarado, diferencia } = resumenCierre;
    const esExacto = diferencia === 0;
    const esSobrante = diferencia > 0;
    // Si diferencia < 0 → faltante

    return (
      <div className="flex items-center justify-center h-full bg-bg-main">
        <div className="w-full max-w-lg bg-white border border-border shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${esExacto ? "bg-success/10 text-success" : esSobrante ? "bg-accent/10 text-accent" : "bg-danger/10 text-danger"
              }`}>
              {esExacto ? <CheckCircle2 size={24} /> : esSobrante ? <AlertTriangle size={24} /> : <XCircle size={24} />}
            </div>
            <div>
              <h2 className="text-xl font-black text-text-primary uppercase">
                {esExacto ? "Caja Exacta" : esSobrante ? "Sobrante Detectado" : "Faltante Detectado"}
              </h2>
              <p className="text-xs text-text-secondary">Turno cerrado correctamente.</p>
            </div>
          </div>

          {/* Desglose */}
          <div className="border border-border divide-y divide-border mb-6">
            <div className="flex justify-between px-4 py-3 text-sm">
              <span className="text-text-secondary">Fondo Inicial</span>
              <span className="font-bold text-text-primary">${formatearMoneda(fondo_inicial)}</span>
            </div>
            <div className="flex justify-between px-4 py-3 text-sm">
              <span className="text-text-secondary">Ventas en Efectivo</span>
              <span className="font-bold text-success">+${formatearMoneda(ventas_efectivo)}</span>
            </div>
            <div className="flex justify-between px-4 py-3 text-sm">
              <span className="text-text-secondary">Ingresos Manuales</span>
              <span className="font-bold text-success">+${formatearMoneda(ingresos_manuales)}</span>
            </div>
            <div className="flex justify-between px-4 py-3 text-sm">
              <span className="text-text-secondary">Retiros Manuales</span>
              <span className="font-bold text-danger">-${formatearMoneda(retiros_manuales)}</span>
            </div>
            <div className="flex justify-between px-4 py-3 text-sm bg-bg-panel">
              <span className="font-bold text-text-primary uppercase">Total Esperado</span>
              <span className="font-black text-text-primary text-lg">${formatearMoneda(total_esperado)}</span>
            </div>
            <div className="flex justify-between px-4 py-3 text-sm bg-bg-panel">
              <span className="font-bold text-text-primary uppercase">Total Declarado</span>
              <span className="font-black text-text-primary text-lg">${formatearMoneda(declarado)}</span>
            </div>
            <div className={`flex justify-between px-4 py-4 text-sm ${esExacto ? "bg-success/5" : esSobrante ? "bg-accent/5" : "bg-danger/5"
              }`}>
              <span className="font-black uppercase">Diferencia</span>
              <span className={`font-black text-xl ${esExacto ? "text-success" : esSobrante ? "text-accent" : "text-danger"
                }`}>
                {diferencia >= 0 ? "+" : ""}${formatearMoneda(diferencia)}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setResumenCierre(null);
              setFondoInicial("");
              setTotalDeclarado("");
              setObservacionesCierre("");
              setMovimientos([]);
              setFase("apertura");
            }}
            className="w-full py-3 bg-accent text-white font-black text-sm uppercase
                       border-none cursor-pointer hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
          >
            <Banknote size={18} />
            Abrir Nuevo Turno
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default Cierre;
