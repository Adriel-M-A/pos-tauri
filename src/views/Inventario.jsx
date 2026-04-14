import { useState, useEffect, useMemo, useRef } from "react";
import { Search, Plus, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";
import ModalProducto from "../components/ModalProducto";
import KeyBadge from "../components/ui/KeyBadge";

function Inventario() {
  const [listaProductos, setListaProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [ordenCampos, setOrdenCampos] = useState({ campo: "codigo", asc: true });

  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);

  // Estado de carga simple (Spinner)
  const [isLoading, setIsLoading] = useState(true);

  const busquedaRef = useRef(null);

  // Atajos de teclado: F1 buscar, F2 nuevo producto
  useEffect(() => {
    const manejarAtajo = (e) => {
      if (e.key === "F1") {
        e.preventDefault();
        busquedaRef.current?.focus();
      }
      if (e.key === "F2") {
        e.preventDefault();
        nuevoProducto();
      }
    };
    window.addEventListener("keydown", manejarAtajo);
    return () => window.removeEventListener("keydown", manejarAtajo);
  }, []);

  // Carga maestra desde Rust / SQLite
  const cargarProductos = async () => {
    setIsLoading(true);
    try {
      const productosDuros = await invoke("get_productos");
      setListaProductos(productosDuros);
    } catch (error) {
      console.error("Falla al recuperar inventario:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // Filtrado reactivo en base a búsqueda y checkbox, y ordenamiento dinámico
  const filtrados = useMemo(() => {
    let result = listaProductos.filter((p) => {
      const matchBusqueda =
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.codigo.includes(busqueda);
      const matchActivo = mostrarInactivos ? true : p.activo === true;
      return matchBusqueda && matchActivo;
    });

    result.sort((a, b) => {
      let valA = a[ordenCampos.campo];
      let valB = b[ordenCampos.campo];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA == null) valA = "";
      if (valB == null) valB = "";

      if (valA < valB) return ordenCampos.asc ? -1 : 1;
      if (valA > valB) return ordenCampos.asc ? 1 : -1;
      return 0;
    });

    return result;
  }, [listaProductos, busqueda, mostrarInactivos, ordenCampos]);

  // Manejador del ordenado
  const handleSort = (campo) => {
    if (ordenCampos.campo === campo) {
      setOrdenCampos({ campo, asc: !ordenCampos.asc });
    } else {
      setOrdenCampos({ campo, asc: true });
    }
  };

  const renderSortIcon = (campo) => {
    if (ordenCampos.campo !== campo) return <ArrowUpDown size={14} className="opacity-30" />;
    return ordenCampos.asc ? <ArrowUp size={14} className="text-accent" /> : <ArrowDown size={14} className="text-accent" />;
  };

  // Guardar desde el modal (Nuevo o Edit) hacia la DB Cruda
  const manejarGuardadoModal = async (productoModificado, mantenerAbierto = false) => {
    setIsLoading(true);
    try {
      if (productoModificado.id) {
        // --- Editar Existente ---
        await invoke("update_producto", { prod: productoModificado });
      } else {
        // --- Nuevo Producto ---
        // Generamos un código falso atado al próximo ID lógicamente disponible ya que aún no pedimos Código de Barras
        const nextLocalId = Math.max(...listaProductos.map((p) => p.id || 0), 0) + 1;
        const autoCodigo = String(nextLocalId).padStart(3, "0");

        await invoke("create_producto", {
          prod: { ...productoModificado, codigo: autoCodigo }
        });
      }

      await cargarProductos(); // Refresco total

      if (!mantenerAbierto) {
        setModalAbierto(false);
      }
      
      toast.success(productoModificado.id ? "Producto actualizado" : "Producto creado", {
        description: `Se guardaron los cambios de ${productoModificado.nombre}.`
      });
    } catch (err) {
      console.error("Falló la atómica de base:", err);
      toast.error("Error al guardar producto", {
        description: "Revisa la conexión o intenta nuevamente."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Abrir ABM Nuevo
  const nuevoProducto = () => {
    setProductoEditando(null);
    setModalAbierto(true);
  };

  // Abrir ABM Edicion Completa
  const editarFormularioProducto = (producto) => {
    setProductoEditando(producto);
    setModalAbierto(true);
  };

  // --- LÓGICA DE EDICIÓN EN LÍNEA DIRECTO A SQLITE ---
  const manejarCambioCelda = async (id, campo, valor) => {
    let valorConvertido = valor;
    if (campo === "stock") {
      valorConvertido = Number(valor);
      if (isNaN(valorConvertido)) return; // Freno seguridad
    } else if (campo === "precio") {
      valorConvertido = Math.round(Number(valor) * 100);
      if (isNaN(valorConvertido)) return; // Freno seguridad
    }

    const productoReemplazo = listaProductos.find(p => p.id === id);
    if (!productoReemplazo) return;

    // Mutamos su copia ram solo para dispararla a la DB
    const clon = { ...productoReemplazo, [campo]: valorConvertido };

    // Si la celda que modificaron es IDÉNTICA a lo de la RAM, cancelamos el viaje a DB.
    if (productoReemplazo[campo] === clon[campo]) return;

    setIsLoading(true);
    try {
      await invoke("update_producto", { prod: clon });
      await cargarProductos();
      toast.success("Precio actualizado", {
        description: `El precio de ${clon.nombre} ahora es $${(clon.precio / 100).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      });
    } catch (err) {
      console.error("Fallo edición rápida:", err);
      toast.error("Fallo la actualización rápida", {
        description: "El cambio no pudo guardarse."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDownInline = (e, targetBlur) => {
    if (e.key === 'Enter') {
      e.target.blur(); // Fuerza el desenfoque enviando el evento onBlur y disparando el puente a Rust
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-main relative">

      {/* OVERLAY DE CARGA (Opcional, muy sutil) */}
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-border overflow-hidden z-50">
          <div className="w-1/3 h-full bg-accent animate-pulse relative"></div>
        </div>
      )}

      {/* Panel Superior de Control */}
      <div className="flex items-center justify-between p-4 bg-bg-panel border-b border-border">
        {/* Buscador y Filtros */}
        <div className="flex items-center gap-6 flex-1 max-w-2xl">
          <div className="flex-1 flex items-center gap-2 border border-border px-3 py-2 bg-white focus-within:border-accent">
            <Search size={18} className="text-text-secondary" />
            <input
              ref={busquedaRef}
              type="text"
              maxLength={100}
              placeholder="Buscar productos (nombre o código)..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="flex-1 outline-none border-none bg-transparent text-sm text-text-primary placeholder:text-text-secondary"
            />
            <KeyBadge tecla="F1" className="bg-border text-text-secondary border-border" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-text-secondary hover:text-text-primary select-none whitespace-nowrap">
            <input
              type="checkbox"
              checked={mostrarInactivos}
              onChange={(e) => setMostrarInactivos(e.target.checked)}
              className="accent-accent"
            />
            Mostrar inactivos
          </label>
        </div>

        {/* Botón de Acción Principal */}
        <button
          onClick={nuevoProducto}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-success hover:bg-success/90 text-white font-bold text-sm border-none cursor-pointer shadow-sm transition-colors"
          disabled={isLoading}
        >
          <Plus size={18} />
          Nuevo Producto
          <KeyBadge tecla="F2" />
        </button>
      </div>

      {/* Grilla / Inventario Principal */}
      <div className="flex-1 overflow-auto p-4">
        <table className="w-full border-collapse table-fixed bg-white border border-border shadow-sm">
          <thead>
            <tr className="bg-bg-panel border-b border-border">
              <th 
                className="w-28 text-center text-xs font-semibold text-text-secondary px-4 py-3 uppercase cursor-pointer hover:bg-border/30 transition-colors select-none"
                onClick={() => handleSort('codigo')}
              >
                <div className="flex items-center justify-center gap-2">
                  CÓDIGO {renderSortIcon('codigo')}
                </div>
              </th>
              <th 
                className="text-left text-xs font-semibold text-text-secondary px-4 py-3 uppercase cursor-pointer hover:bg-border/30 transition-colors select-none"
                onClick={() => handleSort('nombre')}
              >
                <div className="flex items-center gap-2">
                  NOMBRE {renderSortIcon('nombre')}
                </div>
              </th>
              <th 
                className="w-32 text-center text-xs font-semibold text-text-secondary px-4 py-3 uppercase cursor-pointer hover:bg-border/30 transition-colors select-none"
                onClick={() => handleSort('vende_por_peso')}
              >
                <div className="flex items-center justify-center gap-2">
                  TIPO {renderSortIcon('vende_por_peso')}
                </div>
              </th>
              <th 
                className="w-32 text-right text-xs font-semibold text-text-secondary px-4 py-3 uppercase border-l border-border-light cursor-pointer hover:bg-border/30 transition-colors select-none"
                onClick={() => handleSort('precio')}
              >
                <div className="flex items-center justify-end gap-2">
                  PRECIO ($) {renderSortIcon('precio')}
                </div>
              </th>
              <th 
                className="w-32 text-center text-xs font-semibold text-text-secondary px-4 py-3 uppercase border-l border-border-light cursor-pointer hover:bg-border/30 transition-colors select-none"
                onClick={() => handleSort('stock')}
              >
                <div className="flex items-center justify-center gap-2">
                  STOCK {renderSortIcon('stock')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((producto) => {
              const estaInactivo = producto.activo === false;

              return (
                <tr
                  key={producto.id}
                  className={`border-b border-border-light transition-colors hover:bg-accent-light/50 ${estaInactivo ? "opacity-50 grayscale bg-bg-panel" : ""}`}
                >
                  {/* CÓDIGO */}
                  <td className="px-4 py-2 text-center text-xs text-text-secondary font-mono border-r border-border-light/50">
                    {producto.codigo}
                  </td>

                  {/* NOMBRE - Clickable para Form ABM */}
                  <td className="px-4 py-2">
                    <button
                      onClick={() => editarFormularioProducto(producto)}
                      className={`text-sm font-bold text-left cursor-pointer bg-transparent border-none p-0 flex flex-col ${estaInactivo ? "text-text-secondary line-through" : "text-accent hover:underline"}`}
                    >
                      {producto.nombre}
                      {!producto.controla_stock && !producto.vende_por_peso && <span className="text-[10px] font-normal text-text-secondary decoration-transparent">Venta libre</span>}
                    </button>
                  </td>

                  <td className="px-4 py-2 text-center">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 ${producto.vende_por_peso ? 'bg-bg-main text-text-secondary border border-border' : 'bg-accent/10 text-accent border border-accent/20'}`}>
                      {producto.vende_por_peso ? "Peso" : "Unidad"}
                    </span>
                  </td>

                  {/* PRECIO - Edición inline vinculada al IPC */}
                  <td className="px-2 py-2 border-l border-border-light bg-bg-main/30">
                    <input
                      type="number"
                      min="0"
                      max="99999999"
                      step="0.01"
                      defaultValue={producto.precio / 100}
                      disabled={estaInactivo || isLoading}
                      onBlur={(e) => manejarCambioCelda(producto.id, "precio", e.target.value)}
                      onKeyDown={handleKeyDownInline}
                      className="w-full text-right text-sm font-bold text-text-primary outline-none bg-transparent border border-transparent focus:border-accent focus:bg-white px-2 py-1"
                    />
                  </td>

                  {/* STOCK - Optimizaciones visuales de báscula ignorada */}
                  <td className="px-2 py-2 border-l border-border-light bg-bg-main/30">
                    {(!producto.controla_stock || producto.vende_por_peso) ? (
                      <div className="w-full text-center text-text-secondary font-bold select-none cursor-default py-1">
                        -
                      </div>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        max="99999"
                        step="0.001"
                        defaultValue={producto.stock === null ? 0 : producto.stock}
                        disabled={estaInactivo || isLoading}
                        onBlur={(e) => manejarCambioCelda(producto.id, "stock", e.target.value)}
                        onKeyDown={handleKeyDownInline}
                        className="w-full text-center text-sm font-bold text-text-primary outline-none bg-transparent border border-transparent focus:border-accent focus:bg-white px-2 py-1"
                      />
                    )}
                  </td>
                </tr>
              )
            })}

            {/* Vacío: Se da el caso o porque recién instalamos app, o buscaron mal. */}
            {filtrados.length === 0 && !isLoading && (
              <tr>
                <td colSpan="4" className="text-center py-10 text-text-secondary text-sm">
                  {listaProductos.length === 0
                    ? "Inventario vacío."
                    : "No existen coincidencias con tu búsqueda."}
                </td>
              </tr>
            )}

            {/* Spinning Text: Solo aparece si está 100% vacia cargando initial state */}
            {listaProductos.length === 0 && isLoading && (
              <tr>
                <td colSpan="4" className="text-center py-10 text-accent text-sm font-bold animate-pulse">
                  Estableciendo conexión a base de datos local y leyendo inventario...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ModalProducto
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onSave={manejarGuardadoModal}
        productoBase={productoEditando}
      />
    </div>
  );
}

export default Inventario;
