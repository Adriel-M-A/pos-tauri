
function EstadoVacio({ icono: Icono, titulo, descripcion, extra }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
      {Icono && <Icono size={48} className="text-text-secondary opacity-50" />}
      <div className="text-center flex flex-col gap-1">
        <h3 className="font-semibold text-text-primary text-lg">{titulo}</h3>
        {descripcion && (
          <p className="text-text-secondary text-sm max-w-xs mx-auto">
            {descripcion}
          </p>
        )}
      </div>
      {extra && <div className="mt-2">{extra}</div>}
    </div>
  );
}

export default EstadoVacio;
