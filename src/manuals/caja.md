# Manual del Módulo de Caja
 
El módulo de caja es la herramienta principal del negocio. Ha sido diseñado con una filosofía de **cero distracciones y máxima velocidad computacional**, garantizando que pueda procesar una fila de clientes sin interrupciones.
 
## Bloqueo de Seguridad Inicial
 
Una importante medida antifraude de NexPOS es que **no le permitirá vender** si no hay un turno de caja abierto. 
Si intenta acceder a la pestaña "Caja" sin haber declarado con cuánto dinero inicia el local, el sistema bloqueará la facturación con una alerta roja obligándole a realizar en primer lugar una "Apertura" (Ver Manual de Cierres).
 
## Funcionamiento del Buscador y Carrito
 
El buscador inteligente le permite ingresar tanto códigos numéricos como fragmentos de nombres de productos.
 - Funciona con solo presionar 3 letras y muestra de inmediato el stock restante y el precio.
 - Navegue rápidamente por los resultados utilizando las flechas de su teclado (Arriba / Abajo).
 - Presione la tecla **Enter** y el producto seleccionado se agregará al carrito sumando su monto al total.
 
## Manipulación de Cantidades Físicas
 
Una vez dentro del ticket, puede editar las cantidades según la naturaleza del artículo (configurada de antemano en el Inventario):
 
### 1. Artículos Contables (Ej: Botella de agua)
Al ser ítems indivisibles, verá botones de (+) y (-) para sumar o restar rápidamente piezas sin posibilidad de errores, siempre en números enteros. 
El sistema cruzará esta información con el stock y no le permitirá superar las existencias actuales.
 
### 2. Artículos Pesables o a Granel (Ej: Verduras, Quesos)
A diferencia de los artículos contables, por un lado estos productos le permitirán ingresar gramos en una pequeña casilla especial. 
Usted no necesita pensar en decimales difíciles: Si en la balanza pesó 350 gramos, simplemente escriba "350" y el sistema dividirá milimétricamente el valor para darle el impacto correcto del precio en el ticket basado en su precio por kilogramo.
 
## El Panel de Cobro
 
A la derecha de su pantalla, encontrará siempre visible el Panel de Cobro. Este panel se actualiza en tiempo real a medida que agrega productos y le permite finalizar la transacción:
 
- **Modificación Rápida del Total (Descuentos y Recargos)**: Una barra le permite restarle un porcentaje por pago en efectivo, u ofrecer pagar con tarjeta aplicando un recargo por interés.
- **Forma de Pago**: Selección entre Efectivo, Débito, Transferencia, o Crédito para que luego sus informes distingan cómo ingresó el dinero.
- **Herramienta Calculadora Inteligente**: Si selecciona Efectivo, verá un campo donde puede ingresar con cuánto billete le abona su cliente. El sistema calculará automáticamente el monto exacto de cambio o vuelto que debe entregar.
- **Botón de Cobrar**: Una vez todo esté correcto, presione el gran botón verde de "Cobrar" que se encuentra en este mismo panel (o use **F12** en su teclado) para finalizar y guardar la venta.
 
## Atajos Profesionales
 
Aprenda de memoria estas teclas y nunca necesitará usar el ratón para realizar una venta en NexPOS:
- **F1**: En cualquier momento posiciona el cursor intermitente listo sobre la barra principal del Buscador.
- **F12**: Activa el botón de Cobrar directamente para cerrar y guardar la venta.
- **Enter**: Funciona de forma adaptativa. Le permite agregar al carrito si está eligiendo opciones en el buscador, pero si está parado sobre el panel final, confirmará la acción enteramente.
- **Escape**: Abortará u ocultará cualquier pequeño menú desplegable abierto.
