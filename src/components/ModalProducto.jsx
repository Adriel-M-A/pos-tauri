import { useState, useEffect, useRef } from "react";
import { X, AlertCircle } from "lucide-react";
import CharacterCount from "./ui/CharacterCount";

function ModalProducto({ isOpen, onClose, onSave, productoBase }) {
  const isEditing = !!productoBase;
  
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [esPeso, setEsPeso] = useState(false);
  const [controlaStock, setControlaStock] = useState(true);
  const [stock, setStock] = useState("");

  const nombreRef = useRef(null);

  // Inicializar estado según si es edición o nuevo
  useEffect(() => {
    if (isOpen) {
      if (productoBase) {
        setNombre(productoBase.nombre);
        setPrecio(productoBase.precio / 100);
        setEsPeso(productoBase.vende_por_peso);
        setControlaStock(productoBase.controla_stock);
        setStock(productoBase.stock === null ? "" : productoBase.stock);
      } else {
        setNombre("");
        setPrecio("");
        setEsPeso(false);
        setControlaStock(true);
        setStock("");
      }
    }
  }, [isOpen, productoBase]);

  if (!isOpen) return null;

  const handleCambioTipo = (tipoPeso) => {
    setEsPeso(tipoPeso);
    if (tipoPeso) {
      // Si es por peso, forzamos a que no controle stock
      setControlaStock(false);
      setStock("");
    } else {
      // Si vuelve a unidad, sugerimos controlar stock como default
      setControlaStock(true);
    }
  };

  const handleSave = async (e, mantenerAbierto = false) => {
    if (e) e.preventDefault();
    if (!nombre.trim() || precio === "") return;

    const productoFinal = {
      ...productoBase,
      nombre: nombre.trim(),
      precio: Math.round(Number(precio) * 100),
      vende_por_peso: esPeso,
      controla_stock: controlaStock,
      stock: controlaStock ? (Number(stock) || 0) : null,
      activo: isEditing ? productoBase.activo : true 
    };

    await onSave(productoFinal, mantenerAbierto);

    // Si se queda abierto (bucle veloz), limpiamos e inyectamos foco posteriormente a que Rust conteste
    if (mantenerAbierto) {
      setNombre("");
      setPrecio("");
      setEsPeso(false);
      setControlaStock(true);
      setStock("");
      nombreRef.current?.focus();
    }
  };

  const alternarActivacion = () => {
    if (isEditing) {
      const productoFinal = {
        ...productoBase,
        activo: !productoBase.activo
      };
      onSave(productoFinal);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-bg-panel w-full max-w-md border border-border shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border bg-bg-main">
          <h2 className="text-lg font-bold text-text-primary">
            {isEditing ? "Editar Producto" : "Nuevo Producto"}
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary cursor-pointer border-none bg-transparent"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={(e) => handleSave(e, false)} className="p-6 flex flex-col gap-5">
          {/* Nombre */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-text-secondary uppercase block">
                Nombre o Descripción
              </label>
              <CharacterCount current={nombre.length} max={100} />
            </div>
            <input
              ref={nombreRef}
              type="text"
              required
              autoFocus={!isEditing}
              value={nombre}
              maxLength={100}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-white outline-none focus:border-accent text-sm"
              placeholder="Ej. Alfajor Triple"
            />
          </div>

          {/* Precio */}
          <div>
            <label className="text-xs font-bold text-text-secondary uppercase mb-2 block">
              Precio de Venta ($){esPeso && <span className="normal-case font-normal text-accent ml-1">— por Kg</span>}
            </label>
            <input
              type="number"
              required
              min="0"
              max="99999999"
              step="0.01"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-white outline-none focus:border-accent text-sm"
              placeholder="0.00"
            />
          </div>

          {/* Naturaleza / Tipo */}
          <div>
            <label className="text-xs font-bold text-text-secondary uppercase mb-2 block">
              Naturaleza del Producto
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <input
                  type="radio"
                  checked={!esPeso}
                  onChange={() => handleCambioTipo(false)}
                  className="accent-accent"
                />
                Por Unidad
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <input
                  type="radio"
                  checked={esPeso}
                  onChange={() => handleCambioTipo(true)}
                  className="accent-accent"
                />
                Pesable (Balanza)
              </label>
            </div>
          </div>

          {/* Opciones de Stock - Siempre visible, desactivado cuando es pesable */}
          <div className={`p-4 border border-border bg-bg-main flex flex-col gap-3 transition-opacity ${esPeso ? "opacity-50 pointer-events-none" : ""}`}>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-text-primary">
              <input
                type="checkbox"
                checked={controlaStock && !esPeso}
                onChange={(e) => {
                  setControlaStock(e.target.checked);
                  if (!e.target.checked) setStock("");
                }}
                disabled={esPeso}
                className="accent-accent"
              />
              Controlar Stock
            </label>
            
            <div className={`mt-1 transition-opacity ${!controlaStock ? "opacity-40 pointer-events-none" : ""}`}>
              <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">
                {isEditing ? "Stock Actual" : "Stock Inicial"}
              </label>
              <input
                type="number"
                value={stock}
                min="0"
                max="99999"
                step="0.001"
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                disabled={!controlaStock || esPeso}
                className="w-1/2 px-3 py-2 border border-border bg-white outline-none focus:border-accent text-sm"
              />
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-4 border-t border-border mt-2 flex items-center justify-between">
            {/* Si edita, puede borrar lógico */}
            {isEditing ? (
              <button
                type="button"
                onClick={alternarActivacion}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-bold border cursor-pointer border-border transition-colors ${
                  productoBase.activo 
                    ? "bg-transparent text-danger hover:bg-danger hover:text-white" 
                    : "bg-transparent text-success hover:bg-success hover:text-white"
                }`}
              >
                <AlertCircle size={16} />
                {productoBase.activo ? "Desactivar Producto" : "Reactivar Producto"}
              </button>
            ) : (
              <div></div> // Espaciador
            )}

            <div className="flex gap-2">
              {!isEditing && (
                <button
                  type="button"
                  onClick={(e) => handleSave(e, true)}
                  className="px-4 py-2 bg-bg-main hover:bg-border border border-border text-text-primary text-sm font-bold cursor-pointer transition-colors"
                >
                  Guardar y Crear Otro
                </button>
              )}
              <button
                type="submit"
                className="px-6 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-bold cursor-pointer border-none"
              >
                {isEditing ? "Guardar Cambios" : "Guardar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalProducto;
