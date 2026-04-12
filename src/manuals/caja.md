# Manual del Módulo de Caja
 
El módulo de caja es la herramienta principal de facturación. Ha sido optimizado para procesar transacciones en segundos, minimizando el tiempo de espera del cliente en el mostrador.
 
## Tipos de Productos en la Venta
 
El sistema discrimina entre dos naturalezas de productos para adaptarse a la realidad del comercio:
 
### 1. Productos Unitarios (Contables)
Son aquellos que se venden por pieza o unidad cerrada (ej: una botella, un paquete de galletas).
- Comportamiento: La cantidad siempre es un número entero.
- Incremento: Al seleccionar el producto en el buscador, se agrega por defecto una unidad. Puede aumentar o disminuir esta cantidad usando los botones de + y - en la lista del ticket.
- Control de Stock: El sistema restará exactamente una unidad por cada ítem vendido.
 
### 2. Productos Pesables (A granel)
Son aquellos que requieren una balanza y se venden por peso (ej: Frutas, Verduras, Fiambres).
- Unidad de Medida: El sistema utiliza el Kilogramo como base para el precio, pero permite la entrada en Gramos para mayor agilidad.
- Entrada Directa: Si el cliente lleva 250 gramos, simplemente ingrese el número 250. El sistema dividirá por 1000 internamente para aplicar el precio por kilo.
- Alta Precisión: El campo permite decimales en caso de contar con balanzas milimétricas (ej: 250.47 gramos).
 
## Panel de Cobro y Métodos de Pago
 
Una vez conformado el ticket, presione el botón de Cobrar (o use el atajo F12). El sistema permite:
- Ajustes de Monto: Puede aplicar descuentos o recargos globales a la venta.
- Cálculo de Vuelto: Al ingresar el monto con el que paga el cliente, el sistema calcula instantáneamente el cambio a entregar.
- Métodos de Pago: Selección entre Efectivo, Débito, Crédito o Transferencia para el reporte de caja.
 
## Atajos de Teclado Operativos
 
- F1: Enfocar el buscador de productos de forma instantánea desde cualquier parte de la vista.
- F12: Disparar la ventana de cobro y finalización de la venta actual.
- Enter: Confirmar selección de producto o confirmar el cobro en la ventana de pago.
- Flechas: Navegar por los resultados del buscador antes de confirmar.
