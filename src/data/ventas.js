// Ventas Mock distribuidas para pruebas de reportes (Marzo y Abril 2026)
export let ventas = [
  // --- HOY (Sabado 11 Abril) ---
  {
    id: 1, numero_ticket: "T-000001", fecha: "2026-04-11 09:15", subtotal: 4500, ajuste: 0, total: 4500, metodoPago: "Efectivo", anulada: false,
    items: [
      { id: 1, nombre: "Coca Cola 500ml", cantidad: 3, precio: 1500 },
    ],
  },
  {
    id: 2, numero_ticket: "T-000002", fecha: "2026-04-11 13:30", subtotal: 6600, ajuste: 400, total: 7000, metodoPago: "Efectivo", anulada: false,
    items: [
      { id: 2, nombre: "Pan Lactal", cantidad: 3, precio: 2200 },
    ],
  },
  {
    id: 3, numero_ticket: "T-000003", fecha: "2026-04-11 18:45", subtotal: 9600, ajuste: -600, total: 9000, metodoPago: "Transferencia", anulada: false,
    items: [
      { id: 7, nombre: "Aceite Girasol 1L", cantidad: 3, precio: 3200 },
    ],
  },

  // --- AYER (Viernes 10 Abril) ---
  {
    id: 4, numero_ticket: "T-000004", fecha: "2026-04-10 10:05", subtotal: 4400, ajuste: 0, total: 4400, metodoPago: "Efectivo", anulada: false,
    items: [
      { id: 2, nombre: "Pan Lactal", cantidad: 2, precio: 2200 },
    ],
  },
  {
    id: 5, numero_ticket: "T-000005", fecha: "2026-04-10 19:20", subtotal: 10500, ajuste: 0, total: 10500, metodoPago: "Efectivo", anulada: false,
    items: [
      { id: 12, nombre: "Queso Cremoso 1kg", cantidad: 1, precio: 8500 },
      { id: 1, nombre: "Coca Cola 500ml", cantidad: 1, precio: 1500 },
      { id: 4, nombre: "Galletitas Oreo", cantidad: 1, precio: 500 },
    ],
  },

  // --- ANTES EN LA SEMANA (Miercoles 8 Abril) ---
  {
    id: 6, numero_ticket: "T-000006", fecha: "2026-04-08 14:15", subtotal: 9000, ajuste: 0, total: 9000, metodoPago: "Tarjeta", anulada: false,
    items: [
      { id: 1, nombre: "Coca Cola 500ml", cantidad: 6, precio: 1500 },
    ],
  },

  // --- MES ACTUAL, SEMANA PASADA (Viernes 3 Abril) ---
  {
    id: 7, numero_ticket: "T-000007", fecha: "2026-04-03 11:10", subtotal: 7500, ajuste: 0, total: 7500, metodoPago: "Efectivo", anulada: false,
    items: [
      { id: 5, nombre: "Arroz 1kg", cantidad: 3, precio: 2500 },
    ],
  },
  {
    id: 8, numero_ticket: "T-000008", fecha: "2026-04-03 18:00", subtotal: 12000, ajuste: 0, total: 12000, metodoPago: "Transferencia", anulada: false,
    items: [
      { id: 14, nombre: "Paleta x Kg", cantidad: 1, precio: 6500 },
      { id: 13, nombre: "Pan Mignón x Kg", cantidad: 2, precio: 1900 },
      { id: 15, nombre: "Tomate x Kg", cantidad: 1, precio: 2500 } // Ajuste menor manual total
    ],
  },

  // --- MES ANTERIOR (Marzo 2026) ---
  {
    id: 9, numero_ticket: "T-000009", fecha: "2026-03-25 15:30", subtotal: 24000, ajuste: 0, total: 24000, metodoPago: "Tarjeta", anulada: false,
    items: [
      { id: 1, nombre: "Coca Cola 500ml", cantidad: 12, precio: 1500 },
      { id: 6, nombre: "Fideos 500g", cantidad: 5, precio: 1200 },
    ],
  },
  {
    id: 10, numero_ticket: "T-000010", fecha: "2026-03-12 09:20", subtotal: 8200, ajuste: 0, total: 8200, metodoPago: "Efectivo", anulada: false,
    items: [
      { id: 11, nombre: "Detergente 750ml", cantidad: 2, precio: 2800 },
      { id: 10, nombre: "Jabón Tocador", cantidad: 2, precio: 900 },
      { id: 8, nombre: "Yogur Natural", cantidad: 1, precio: 800 }
    ],
  },
  {
    id: 11, numero_ticket: "T-000011", fecha: "2026-03-05 18:45", subtotal: 9500, ajuste: -500, total: 9000, metodoPago: "Efectivo", anulada: true, // Venta grande anulada en Marzo
    items: [
      { id: 12, nombre: "Queso Cremoso 1kg", cantidad: 1, precio: 8500 },
      { id: 4, nombre: "Galletitas Oreo", cantidad: 2, precio: 500 },
    ],
  }
];

export const actualizarDataVentas = (nuevaLista) => {
  ventas = nuevaLista;
};
