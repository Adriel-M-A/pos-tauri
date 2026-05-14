import { AlertTriangle, X } from "lucide-react";
import Boton from "./Boton";

/**
 * Componente modal de advertencia para acciones destructivas.
 * Estilo industrial, cuadrado, directo y paralizador.
 */
function ConfirmModal({ 
  isOpen, 
  titulo, 
  mensaje, 
  onConfirm, 
  onCancel, 
  textoConfirmar = "Confirmar", 
  textoCancelar = "Cancelar" 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white border-2 border-danger w-full max-w-sm shadow-xl flex flex-col pointer-events-auto">
        
        {/* Cabecera Peligro */}
        <div className="bg-danger px-4 py-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} strokeWidth={2.5} />
            <h2 className="text-sm font-black uppercase tracking-wider">{titulo}</h2>
          </div>
          <button onClick={onCancel} className="text-white/80 hover:text-white cursor-pointer transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo del Mensaje */}
        <div className="p-6">
          <p className="text-sm font-semibold text-text-primary mb-6 leading-relaxed">
            {mensaje}
          </p>

          {/* Acciones */}
          <div className="flex gap-3 mt-auto justify-end">
            <Boton
              variante="secundario"
              onClick={onCancel}
              className="px-4 py-2 text-xs"
            >
              {textoCancelar}
            </Boton>
            <Boton
              variante="peligro"
              onClick={onConfirm}
              className="px-4 py-2 text-xs"
            >
              {textoConfirmar}
            </Boton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
