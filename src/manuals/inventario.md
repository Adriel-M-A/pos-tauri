# Manual del Módulo de Inventario
 
El inventario permite el control total de los activos del negocio. Es fundamental mantener esta base de datos actualizada para asegurar que la caja opere sin fricciones.
 
## Clasificación de Productos
 
Al crear un producto, debe definir su naturaleza para que el sistema sepa cómo realizar los cálculos en el mostrador:
 
- **Productos Unitarios**: Ideales para mercadería que se vende por envase, lata o paquete. No permiten ingreso de decimales por parte del cajero para evitar errores humanos.
- **Productos Pesables o a Granel**: Seleccione esta opción para artículos que se venden por kilogramo (frutas, legumbres, carnes). Habilita el campo de pesaje rápido en gramos en la caja.
 
## Configuración de Atributos
 
Cada producto cuenta con identificadores únicos y configuraciones de comportamiento:
- **Código y Nombre**: Elementos clave para la búsqueda rápida en caja. Se recomienda usar códigos cortos o códigos de barras si dispone de un lector.
- **Precio por Unidad/Kilo**: El sistema utiliza este valor base para todos los cálculos automáticos de subtotal. El precio se ingresa siempre por la unidad total (un producto o un kilo).
- **Control de Stock**: Puede activarse de forma individual. Si un producto no controla stock (ej: bolsas de nylon o recargos de servicio), el sistema no restringirá la venta por unidades disponibles.
 
## Edición en Grilla (Actualización Rápida)
 
Para cambios masivos de precios o actualizaciones de mercadería entrante, el inventario permite la edición directa sobre la tabla:
- Al hacer clic sobre el precio o el stock de un producto, el campo se volverá editable.
- Presione la tecla Enter para confirmar o simplemente haga clic fuera del recuadro para autoguardar.
- Para cambios de nombre o código que requieran mayor detalle, use el botón de edición para abrir el formulario completo.
 
## Estados de Productos e Inactivos
 
Para mantener la integridad histórica de los reportes de ventas, los productos no se eliminan físicamente. El borrado lógico asegura que si un producto se vendió en el pasado, su nombre siga apareciendo en los tickets viejos aunque deje de venderse hoy.
- **Desactivación**: Al presionar borrar, el producto pasa al estado "Inactivo".
- **Reactivación**: Puede volver a dar de alta un producto inactivo en cualquier momento activando el filtro de "Mostrar inactivos".
