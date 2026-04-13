# Manual del Módulo de Inventario
 
El módulo de inventario le permite controlar el cerebro de los precios y productos de su base de datos.
Al igual que los otros apartados del sistema, en lugar de navegar páginas por página el sistema presenta una búsqueda ultrarrápida instantánea apoyable por la tecla rápida F1.
 
## Alta Rápida de Stock (Atajo F2)
 
Desde cualquier rincón de la plantilla de productos presione la tecla F2 para emerger la ficha visual del nuevo artículo que va a incorporar. Preste extrema atención a las siguientes variables obligatorias:
 
- **Stock Base y Precio**: Ingresará en número absolutos. Si el artículo es contable el costo es por 1 unidad física. Si es a Granel o de peso, se ingresa el valor de acuerdo a la medida final de todo un kilo completo.
- **Tipo de Naturaleza**: Define la columna vertebral de cómo este producto se comportará si se cobra (Si será contable con saltos por unidad o permitirá pesar a granel los gramos que la balanza le exprese). 
- **Controla Ventas**: Esto bloquea al usuario si vende de más. Para servicios inmateriales o productos libres ponga que *No controla Stock*. 
 
## La Grilla en Tiempo Real (Edición Directa)
 
Modificar costos hoy en día en tiempo récord es clave para soportar presiones económicas. 
NexPOS integra una Grilla inteligente. Al igual que con un papel de cálculo moderno como Excel, no requiere usted de entrar a lentos botones técnicos de edición. 
Simplemente al pasar el ratón, con **dar clic en cualquier número de precio o valor de la tabla** activará el comando y se volverá una casilla blanca editable de alta interactividad en vivo. Escriba y presione `Enter` y verá una advertencia mágica avisándole cómo el nuevo valor ya ha sido anclado al motor interno offline instantáneamente y la próxima venta aplicará esta tarifa novedosa.
 
## Gestión del Historial Financiero (Borrado Lógico)
 
Para evitar corrupciones financieras como los sistemas anticuados que pierden detalles o tickets rotos al eliminar algo pasados años:
- NexPOS emplea **Estado de Inactividad**. Al darle click al tacho rojo y presionar Eliminar, este ya no podrá seleccionarse ni aparecer en la Caja. Pero al mismo tiempo preserva históricamente cómo y bajo qué números operó ayer asegurando tranquilidad y una integridad fuerte del total histórico.
- **Ver Inactivos:** Marcando la casilla de la barra lateral devolverá todos los números inactivos o caducados permitiendo el botón para que se *Resuciten* a vivos.
