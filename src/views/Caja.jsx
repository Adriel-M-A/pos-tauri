import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Trash2, Plus, Minus, Lock, Unlock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import KeyBadge from "../components/ui/KeyBadge";
import { invoke } from "@tauri-apps/api/core";
import PanelCobro from "../components/PanelCobro";
import { formatearMoneda } from "../utils/formato";

function Caja({ onCambiarVista }) {
  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState([]);
  const [indiceSeleccion, setIndiceSeleccion] = useState(0);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  
  // Estado dinámico traído del backend
  const [productosFiltrados, setProductosFiltrados] = useState([]);

  // Estado del Turno de Caja (Imprescindible para ventas)
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [isCheckingTurno, setIsCheckingTurno] = useState(true);

  // --- Verificar Turno al entrar a la Caja ---
  useEffect(() => {
    const verificarTurno = async () => {
      try {
        const turno = await invoke("get_turno_abierto");
        setTurnoActivo(turno || null);
      } catch (err) {
        console.error("Fallo al verificar turno abierto:", err);
      } finally {
        setIsCheckingTurno(false);
      }
    };
    verificarTurno();
  }, []);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const prevQuery = useRef("");

  // --- Buscador Inteligente asíncrono (Debounce 300ms) ---
  useEffect(() => {
    let isActive = true;

    const terminoLimpio = busqueda.trim();

    // Si tiene 2 letras o menos no colapsamos el sistema
    if (terminoLimpio.length <= 2) {
      setProductosFiltrados([]);
      setMostrarDropdown(false);
      setIndiceSeleccion(0);
      prevQuery.current = ""; // Limpiar caché
      return;
    }

    if (terminoLimpio === prevQuery.current) {
      return;
    }

    const timerId = setTimeout(async () => {
      try {
        prevQuery.current = terminoLimpio;
        const results = await invoke("search_productos", { query: terminoLimpio });
        if (!results) return; // Validación mínima post-invoke
        
        if (isActive) {
          setProductosFiltrados(results);
          setMostrarDropdown(results.length > 0);
          setIndiceSeleccion(0);
        }
      } catch (err) {
        console.error("Fallo ejecutando Query a Rust:", err);
        prevQuery.current = ""; // Reset on error
      }
    }, 300);

    // Cancelar la peticion en vuelo si sigue tecleando
    return () => {
      isActive = false;
      clearTimeout(timerId);
    };
  }, [busqueda]);

  // Selección de Flechas
  useEffect(() => {
    if (dropdownRef.current) {
      const itemActivo = dropdownRef.current.querySelector("[data-activo='true']");
      if (itemActivo) {
        itemActivo.scrollIntoView({ block: "nearest" });
      }
    }
  }, [indiceSeleccion]);

  const agregarAlCarrito = useCallback((producto) => {
    setCarrito((prev) => {
      // Calcular cuanta cantidad total de este producto ya hay en el carrito
      const cantidadEnCarrito = prev
        .filter(item => item.id === producto.id)
        .reduce((sum, item) => sum + Number(item.cantidad || 0), 0);

      // Si controla stock, verificamos si hay lugar
      // Los productos pesables se validan recién al ingresar el peso en modificarCantidadExacta
      if (producto.controla_stock && !producto.vende_por_peso) {
        const cantidadEnCarrito = prev
          .filter(item => item.id === producto.id)
          .reduce((sum, item) => sum + Number(item.cantidad || 0), 0);

        const nuevaCantidad = cantidadEnCarrito + 1;

        if (producto.stock <= 0 || nuevaCantidad > producto.stock) {
          toast.error("Stock insuficiente", {
            description: `Solo queda(n) ${producto.stock} un. en inventario.`,
          });
          return prev; 
        }
      }

      const existente = prev.find((item) => item.id === producto.id);
      if (existente && !producto.vende_por_peso) {
        return prev.map((item) =>
          item.id === producto.id
            ? { ...item, cantidad: Number(item.cantidad) + 1 }
            : item
        );
      } else if (existente && producto.vende_por_peso) {
        const itemPesableId = `${producto.id}_${Date.now()}`;
        return [...prev, { ...producto, ticketId: itemPesableId, cantidad: "" }]; 
      }
      
      const nuevoId = producto.vende_por_peso ? `${producto.id}_${Date.now()}` : producto.id;
      return [...prev, { ...producto, ticketId: nuevoId, cantidad: producto.vende_por_peso ? "" : 1 }];
    });

    setBusqueda("");
    setMostrarDropdown(false);
  }, []);

  const modificarCantidad = (ticketId, cambio) => {
    setCarrito((prev) => {
      const targetItem = prev.find(item => item.ticketId === ticketId);
      if (!targetItem) return prev;

      if (cambio > 0 && targetItem.controla_stock) {
        const cantidadTotalGlobalKg = prev
          .filter(item => item.id === targetItem.id)
          .reduce((sum, item) => sum + (Number(item.cantidad || 0) / (item.vende_por_peso ? 1000 : 1)), 0);
          
        if (cantidadTotalGlobalKg + (targetItem.vende_por_peso ? (cambio / 1000) : cambio) > targetItem.stock) {
          toast.error("Límite de stock alcanzado", {
            description: `Solo hay ${targetItem.stock} ${targetItem.vende_por_peso ? 'kg' : 'un.'} disponibles en total.`
          });
          return prev;
        }
      }

      return prev
        .map((item) =>
          item.ticketId === ticketId
            ? { ...item, cantidad: Number(item.cantidad) + cambio }
            : item
        )
        .filter((item) => Number(item.cantidad) > 0);
    });
  };

  const modificarCantidadExacta = (ticketId, valorStr) => {
    if (valorStr === "" || /^\d*\.?\d*$/.test(valorStr)) {
      setCarrito((prev) => {
        let overflown = false;
        let stockRestante = 0;

        const newState = prev.map((item) => {
          if (item.ticketId === ticketId) {
            let newVal = valorStr;
            if (item.controla_stock && valorStr !== "") {
              const valorNumerico = Number(valorStr);
              // Suma de otros items del mismo producto en Kg
              const otherItemsSumKg = prev
                .filter(other => other.id === item.id && other.ticketId !== ticketId)
                .reduce((sum, other) => sum + (Number(other.cantidad || 0) / (other.vende_por_peso ? 1000 : 1)), 0);
              
              const valorIntentoKg = item.vende_por_peso ? (valorNumerico / 1000) : valorNumerico;

              if (otherItemsSumKg + valorIntentoKg > item.stock) {
                overflown = true;
                // Calcular cuánto puede exprimir realmente
                stockRestante = Math.max(0, item.stock - otherItemsSumKg);
                // Convertir de vuelta a gramos si es pesable
                newVal = item.vende_por_peso ? String(stockRestante * 1000) : String(Math.floor(stockRestante));
              }
            }
            return { ...item, cantidad: newVal };
          }
          return item;
        });

        if (overflown) {
          toast.error("Límite de stock excedido", {
            description: "La cantidad se redujo al máximo posible en existencia.",
            id: 'stock-warn-toast'
          });
        }
        
        return newState;
      });
    }
  };

  const vaciarCantidadSiEsCero = (ticketId, valorStr) => {
    if (valorStr === "" || Number(valorStr) === 0) {
      eliminarDelCarrito(ticketId);
    }
  };

  const eliminarDelCarrito = (ticketId) => {
    setCarrito((prev) => prev.filter((item) => item.ticketId !== ticketId));
  };

  const vaciarTicket = () => {
    setCarrito([]);
    setBusqueda("");
    inputRef.current?.focus();
  };

  const subtotal = carrito.reduce(
    (sum, item) => {
      const cantReal = item.vende_por_peso ? (Number(item.cantidad) / 1000) : Number(item.cantidad);
      return sum + item.precio * (cantReal || 0);
    },
    0
  );

  // --- Transacción de Fuego: Empaquetar y despachar a Sqlite ---
  const finalizarVenta = useCallback(async (datosVenta) => {
    // Rust requiere un formato rígido para los Items (Siempre en Kilogramos si es peso)
    const itemsAdaptados = carrito.map((c) => {
      const cantReal = c.vende_por_peso ? (Number(c.cantidad) / 1000) : Number(c.cantidad);
      const subtotalItem = Math.round(Number(c.precio) * (cantReal || 0));

      return {
        id: null,
        venta_id: 0, 
        producto_id: c.id,
        nombre: String(c.nombre),
        cantidad: cantReal,
        precio: Number(c.precio),
        subtotal: subtotalItem
      };
    });

    const paqueteDeVenta = {
      id: null,
      numero_ticket: "T-0000X", 
      fecha: "", // Se autogenera local y exactamente por chrono en Rust
      subtotal: Number(datosVenta.subtotal),
      ajuste: Number(datosVenta.ajuste),
      total: Number(datosVenta.total),
      metodo_pago: String(datosVenta.metodoPago),
      anulada: false,
      turno_id: turnoActivo ? turnoActivo.id : null,
      items: itemsAdaptados
    };

    try {
      const ventaCreada = await invoke("create_venta", { v: paqueteDeVenta });
      vaciarTicket();
      toast.success("Venta registrada con éxito", {
        description: `Ticket ${ventaCreada.numero_ticket} guardado en el historial.`
      });
    } catch (error) {
      console.error("Transacción Rollback ejecutada: Falla al grabar ticket.", error);
      toast.error("Error al registrar venta", {
        description: error?.mensaje || "Hubo un problema. Por favor reintenta o contacta a soporte.",
        duration: 4000,
      });
    }
  }, [carrito, turnoActivo]);

  const manejarTeclas = (e) => {
    if (!mostrarDropdown) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setIndiceSeleccion((prev) =>
          prev < productosFiltrados.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setIndiceSeleccion((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (productosFiltrados[indiceSeleccion]) {
          agregarAlCarrito(productosFiltrados[indiceSeleccion]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setBusqueda("");
        setMostrarDropdown(false);
        break;
    }
  };

  useEffect(() => {
    const manejarAtajo = (e) => {
      // F1 focaliza el buscador de productos
      if (e.key === "F1") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // F12 dispara el cobro directo
      if (e.key === "F12") {
        e.preventDefault();
        const botonCobrar = document.getElementById("btn-cobrar");
        if (botonCobrar && !botonCobrar.disabled) {
          botonCobrar.click();
        }
      }
    };
    window.addEventListener("keydown", manejarAtajo);
    return () => window.removeEventListener("keydown", manejarAtajo);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ========================================================
  // FILTRO ANTI-OPERACIÓN (CAJA CERRADA)
  // ========================================================
  if (isCheckingTurno) {
    return (
      <div className="flex items-center justify-center h-full bg-bg-main w-full">
        <div className="flex items-center gap-3 text-accent animate-pulse">
          <Loader2 size={24} className="animate-spin" />
          <span className="font-bold text-sm uppercase">Verificando estado de caja...</span>
        </div>
      </div>
    );
  }

  if (!turnoActivo) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-bg-main p-4 w-full">
        <div className="w-full max-w-md bg-white border border-border shadow-sm p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-xl font-black text-text-primary uppercase mb-2">Caja Cerrada</h2>
          <p className="text-sm font-medium text-text-secondary mb-6">
            Para poder operar el punto de venta primero debes declarar el fondo inicial y efectuar la <strong>Apertura</strong> en la vista de <strong>Cierre</strong>.
          </p>
          <button
            onClick={() => onCambiarVista?.("cierre")}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white font-bold text-sm uppercase
                       border-none cursor-pointer hover:bg-accent/90 transition-colors"
          >
            <Unlock size={18} />
            Ir a Apertura de Caja
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full">
      <div className="flex-1 flex flex-col">
        <div className="h-16 px-4 bg-bg-panel border-b border-border relative flex items-center">
          <div className="flex items-center gap-2 border border-border px-3 py-2 bg-white flex-1">
            <Search size={18} className="text-text-secondary" />
            <input
              ref={inputRef}
              type="text"
              maxLength={100}
              placeholder="Buscar producto por nombre o código (mín. 3 caracteres)..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={manejarTeclas}
              className="flex-1 outline-none border-none bg-transparent text-sm text-text-primary placeholder:text-text-secondary"
              autoFocus
            />
            <KeyBadge tecla="F1" className="bg-border text-text-secondary border-border" />
          </div>

          {mostrarDropdown && (
            <div
              ref={dropdownRef}
              className="absolute left-4 right-4 top-full mt-0 bg-bg-panel border border-border border-t-0 shadow-lg max-h-64 overflow-auto z-50"
            >
              {productosFiltrados.map((producto, idx) => (
                <button
                  key={producto.id}
                  data-activo={idx === indiceSeleccion}
                  onMouseDown={(e) => {
                     e.preventDefault(); // Evitar perder el foco onMouseDown antes de agregar
                     agregarAlCarrito(producto);
                  }}
                  className={`
                    w-full flex items-center justify-between px-4 py-2 text-left cursor-pointer border-none
                    ${
                      idx === indiceSeleccion
                        ? "bg-accent-light text-text-primary"
                        : "bg-transparent text-text-primary hover:bg-accent-light"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-text-secondary w-8">
                      {producto.codigo}
                    </span>
                    <span className="text-sm font-medium">
                      {producto.nombre}
                      {producto.vende_por_peso && <span className="ml-2 text-[10px] bg-accent/20 text-accent px-1">PESABLE</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-text-secondary w-16 text-right">
                      Stock: {producto.stock}
                    </span>
                    <span className="text-sm font-bold text-accent w-20 text-right">
                      ${formatearMoneda(producto.precio)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          {carrito.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-text-secondary text-sm">
                Buscá un producto para comenzar la venta.
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="bg-bg-panel border-b border-border">
                  <th className="w-10 text-center text-xs font-semibold text-text-secondary py-3">
                    #
                  </th>
                  <th className="w-20 text-left text-xs font-semibold text-text-secondary px-4 py-3">
                    CÓDIGO
                  </th>
                  <th className="text-left text-xs font-semibold text-text-secondary px-4 py-3">
                    PRODUCTO
                  </th>
                  <th className="w-28 text-right text-xs font-semibold text-text-secondary px-4 py-3">
                    PRECIO
                  </th>
                  <th className="w-32 text-center text-xs font-semibold text-text-secondary px-4 py-3">
                    CANT / PESO
                  </th>
                  <th className="w-28 text-right text-xs font-semibold text-text-secondary px-4 py-3">
                    SUBTOTAL
                  </th>
                  <th className="w-12 text-center align-middle py-3">
                    <button
                      onClick={vaciarTicket}
                      title="Vaciar ticket completo"
                      className="text-text-secondary hover:text-danger cursor-pointer bg-transparent border-none p-1 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {carrito.map((item, idx) => (
                  <tr
                    key={item.ticketId}
                    className="border-b border-border-light bg-bg-panel hover:bg-accent-light group"
                  >
                    <td className="text-center py-3 text-sm text-text-secondary">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary font-mono">
                      {item.codigo}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-text-primary truncate">
                      {item.nombre}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary text-right">
                      ${formatearMoneda(item.precio)}
                    </td>
                    <td className="px-4 py-3">
                      {item.vende_por_peso ? (
                        <div className="flex items-center justify-center">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="999999"
                            value={item.cantidad}
                            onChange={(e) => modificarCantidadExacta(item.ticketId, e.target.value)}
                            onBlur={(e) => vaciarCantidadSiEsCero(item.ticketId, e.target.value)}
                            className="w-16 px-1 py-1 text-center text-sm font-bold border border-accent bg-white outline-none focus:ring-1 focus:ring-accent"
                            placeholder="0"
                            autoFocus={item.cantidad === ""}
                          />
                          <span className="text-xs text-text-secondary ml-1">g</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => modificarCantidad(item.ticketId, -1)}
                            className="w-6 h-6 flex items-center justify-center border border-border bg-bg-main cursor-pointer hover:bg-border-light"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-bold w-6 text-center">
                            {item.cantidad}
                          </span>
                          <button
                            onClick={() => modificarCantidad(item.ticketId, 1)}
                            className="w-6 h-6 flex items-center justify-center border border-border bg-bg-main cursor-pointer hover:bg-border-light"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-text-primary text-right">
                      ${formatearMoneda(item.precio * (item.vende_por_peso ? (Number(item.cantidad) / 1000) : (Number(item.cantidad) || 0)))}
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => eliminarDelCarrito(item.ticketId)}
                        className="text-danger flex items-center justify-center mx-auto cursor-pointer opacity-50 hover:opacity-100 bg-transparent border-none p-1 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* --- PANEL DERECHO COBRO ESTÁTICO --- */}
      {/* Ya envía su payload limpio vía onCobrar / finalizarVenta */}
      <PanelCobro
        subtotal={subtotal}
        onCobrar={finalizarVenta}
      />
    </div>
  );
}

export default Caja;
