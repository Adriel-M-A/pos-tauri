import { useState, useRef, useEffect } from "react";
import { DollarSign, Plus, Minus } from "lucide-react";
import { metodosPago } from "../data/metodosPago";
import KeyBadge from "./ui/KeyBadge";
import Boton from "./ui/Boton";
import { formatearMoneda } from "../utils/formato";

function PanelCobro({ subtotal, onCobrar }) {
  const [ajusteModalidad, setAjusteModalidad] = useState("descuento"); // 'descuento' o 'recargo'
  const [ajusteValor, setAjusteValor] = useState("");
  const [metodoPago, setMetodoPago] = useState("transferencia");
  const [pagaCon, setPagaCon] = useState("");

  const pagaConRef = useRef(null);

  // Calcular el valor del ajuste numérico considerando el tipo (recargo suma, descuento resta)
  const ajusteAbsolutoUsuario = Number(ajusteValor) || 0;
  // Convertimos a centavos lo que tipeó el usuario
  const ajusteNumericoCentavos = Math.round((ajusteModalidad === "descuento" ? -ajusteAbsolutoUsuario : ajusteAbsolutoUsuario) * 100);

  // Total a pagar = subtotal (viene en centavos) + ajuste en centavos
  const totalAPagar = subtotal + ajusteNumericoCentavos;

  // Valor numérico de "paga con" tipeado por el usuario (convertido a centavos)
  const pagaConNumericoCentavos = Math.round((Number(pagaCon) || 0) * 100);

  // Cálculo del vuelto en centavos
  const vuelto = pagaConNumericoCentavos - totalAPagar;

  // Determinar si el botón de cobrar está habilitado
  const puedeCobrar = (() => {
    if (subtotal === 0) return false;
    if (totalAPagar <= 0) return false;
    if (metodoPago === "efectivo") return pagaConNumericoCentavos >= totalAPagar;
    return true;
  })();

  // Foco en "Paga con"
  useEffect(() => {
    if (metodoPago === "efectivo" && pagaConRef.current) {
      pagaConRef.current.focus();
    }
  }, [metodoPago]);

  const cambiarMetodoPago = (id) => {
    setMetodoPago(id);
    setPagaCon("");
  };

  const ejecutarCobro = () => {
    if (!puedeCobrar) return;

    onCobrar({
      metodoPago,
      subtotal,
      ajuste: ajusteNumericoCentavos,
      total: totalAPagar,
      pagaCon: metodoPago === "efectivo" ? pagaConNumericoCentavos : null,
      vuelto: metodoPago === "efectivo" ? vuelto : null,
    });

    setAjusteValor("");
    setAjusteModalidad("descuento");
    setMetodoPago("transferencia");
    setPagaCon("");
  };

  // Permitir números positivos con hasta 2 decimales y límite máximo de monto lógico ($99,999,999)
  const validarYSetearMonto = (valorActual, setHook) => {
    if (valorActual === "") {
      setHook("");
      return;
    }
    // Regex: Números, opcional punto, máximo 2 decimales
    if (/^\d*\.?\d{0,2}$/.test(valorActual)) {
      const valorNum = Number(valorActual);
      if (valorNum <= 99999999) {
        setHook(valorActual);
      }
    }
  };

  const manejarAjuste = (valor) => validarYSetearMonto(valor, setAjusteValor);
  const manejarPagaCon = (valor) => validarYSetearMonto(valor, setPagaCon);

  const toggleModalidadAjuste = () => {
    setAjusteModalidad((prev) => (prev === "descuento" ? "recargo" : "descuento"));
  };

  return (
    <div className="w-[340px] min-w-[340px] flex flex-col bg-bg-panel border-l border-border">
      {/* Encabezado - Altura sincronizada con buscador de caja */}
      <div className="h-16 px-4 border-b border-border bg-bg-main flex items-center justify-center relative">
        <h2 className="text-xs font-bold text-text-secondary uppercase tracking-widest">
          Detalle de Operación
        </h2>
      </div>

      {/* Total a Pagar - FIJO, siempre visible */}
      <div className="text-center bg-accent-light p-4 border-b border-border">
        <span className="text-xs font-bold text-text-secondary uppercase tracking-widest block mb-2">
          Total a Pagar
        </span>
        <span className="text-5xl font-black text-text-primary">
          ${formatearMoneda(totalAPagar)}
        </span>
      </div>

      <div className="flex-1 flex flex-col p-4 overflow-y-auto">

        {/* Subtotal */}
        <div className="flex items-center justify-between mb-4 px-2">
          <span className="text-sm font-semibold text-text-secondary uppercase">
            Subtotal
          </span>
          <span className="text-lg font-bold text-text-primary">
            ${formatearMoneda(subtotal)}
          </span>
        </div>

        {/* Ajuste (Switch y valor numérico) */}
        <div className="mb-6 px-2">
          <label className="text-sm font-semibold text-text-secondary uppercase block mb-2">
            Ajuste Global
          </label>
          <div className="flex items-stretch border border-border bg-white h-10">
            {/* Botón switch */}
            <button
              onClick={toggleModalidadAjuste}
              className={`
                flex items-center justify-center w-12 border-r border-border cursor-pointer transition-colors
                ${ajusteModalidad === "descuento" ? "bg-danger text-white hover:bg-opacity-90" : "bg-success text-white hover:bg-opacity-90"}
              `}
              title="Cambiar a Descuento o Recargo"
            >
              {ajusteModalidad === "descuento" ? <Minus size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={3} />}
            </button>
            <span className="flex items-center px-3 text-sm text-text-secondary border-r border-border bg-bg-main">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              max="99999999"
              value={ajusteValor}
              onChange={(e) => manejarAjuste(e.target.value)}
              placeholder="0"
              className="flex-1 px-3 text-sm text-text-primary outline-none border-none bg-transparent text-right"
            />
          </div>
          {ajusteAbsolutoUsuario > 0 && (
            <p className={`text-xs mt-2 text-right font-medium ${ajusteModalidad === "descuento" ? "text-danger" : "text-success"}`}>
              {ajusteModalidad === "descuento" ? "Aplicando descuento" : "Aplicando recargo"}: ${formatearMoneda(Math.abs(ajusteNumericoCentavos))}
            </p>
          )}
        </div>

        {/* Separador */}
        <div className="border-t border-border mb-6"></div>

        {/* Método de pago */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-2 text-center">
            MÉTODO DE PAGO
          </label>
          <div className="flex flex-col gap-1">
            {metodosPago.map((metodo) => (
              <button
                key={metodo.id}
                onClick={() => cambiarMetodoPago(metodo.id)}
                className={`
                  w-full py-2.5 text-sm font-medium border cursor-pointer
                  ${
                    metodoPago === metodo.id
                      ? "bg-accent text-white border-accent shadow-sm"
                      : "bg-bg-main text-text-secondary border-border hover:border-accent hover:text-accent"
                  }
                `}
              >
                {metodo.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Efectivo extra */}
        {metodoPago === "efectivo" && (
          <div className="mt-4 p-4 border border-border bg-white shadow-inner">
            <div className="mb-4">
              <label className="text-xs font-bold text-text-secondary uppercase block mb-1">
                PAGA CON
              </label>
              <div className="flex items-center border-b-2 border-border focus-within:border-accent transition-colors">
                <span className="text-lg text-text-secondary py-1 mr-2">$</span>
                <input
                  ref={pagaConRef}
                  type="number"
                  step="0.01"
                  min="0"
                  max="99999999"
                  value={pagaCon}
                  onChange={(e) => manejarPagaCon(e.target.value)}
                  placeholder="0"
                  className="flex-1 py-1 text-2xl font-bold text-text-primary outline-none bg-transparent text-right w-full"
                />
              </div>
            </div>

            <div className="flex items-end justify-between pt-2">
              <span className="text-xs font-bold text-text-secondary uppercase">
                VUELTO
              </span>
              <span
                className={`text-2xl font-black ${
                  vuelto >= 0 ? "text-success" : "text-danger"
                }`}
              >
                ${formatearMoneda(vuelto)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-bg-main">
        <Boton
          id="btn-cobrar"
          variante="primario"
          icono={DollarSign}
          atajo="F12"
          onClick={ejecutarCobro}
          disabled={!puedeCobrar}
          ancho="full"
          className="py-4 text-xl shadow-md"
        >
          COBRAR
        </Boton>
      </div>
    </div>
  );
}

export default PanelCobro;
