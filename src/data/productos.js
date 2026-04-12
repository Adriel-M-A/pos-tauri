// Productos de ejemplo para el sistema POS
// Se eliminaron categorías, y se añadieron propiedades lógicas (activo, controla_stock)
export let productos = [
  { id: 1, codigo: "001", nombre: "Coca Cola 500ml", precio: 1500, stock: 48, vende_por_peso: false, controla_stock: true, activo: true },
  { id: 2, codigo: "002", nombre: "Pan Lactal", precio: 2200, stock: 15, vende_por_peso: false, controla_stock: true, activo: true },
  { id: 3, codigo: "003", nombre: "Leche Entera 1L", precio: 1800, stock: null, vende_por_peso: false, controla_stock: false, activo: true }, // Ejemplo sin control
  { id: 4, codigo: "004", nombre: "Galletitas Oreo", precio: 1400, stock: 22, vende_por_peso: false, controla_stock: true, activo: true },
  { id: 5, codigo: "005", nombre: "Arroz 1kg", precio: 2500, stock: 40, vende_por_peso: false, controla_stock: true, activo: true },
  { id: 6, codigo: "006", nombre: "Fideos 500g", precio: 1200, stock: 35, vende_por_peso: false, controla_stock: true, activo: true },
  { id: 7, codigo: "007", nombre: "Aceite Girasol 1L", precio: 3200, stock: 18, vende_por_peso: false, controla_stock: true, activo: false }, // Ejemplo inactivo
  { id: 8, codigo: "008", nombre: "Yogur Natural", precio: 1600, stock: 12, vende_por_peso: false, controla_stock: true, activo: true },
  { id: 9, codigo: "009", nombre: "Agua Mineral 1.5L", precio: 1100, stock: 60, vende_por_peso: false, controla_stock: true, activo: true },
  { id: 10, codigo: "010", nombre: "Jabón Tocador", precio: 900, stock: 25, vende_por_peso: false, controla_stock: true, activo: true },
  { id: 11, codigo: "011", nombre: "Detergente 750ml", precio: 2800, stock: 14, vende_por_peso: false, controla_stock: true, activo: true },
  { id: 12, codigo: "012", nombre: "Queso Cremoso 1kg", precio: 8500, stock: null, vende_por_peso: true, controla_stock: false, activo: true },
  { id: 13, codigo: "013", nombre: "Pan Mignón x Kg", precio: 1900, stock: null, vende_por_peso: true, controla_stock: false, activo: true },
  { id: 14, codigo: "014", nombre: "Paleta x Kg", precio: 6500, stock: null, vende_por_peso: true, controla_stock: false, activo: true },
  { id: 15, codigo: "015", nombre: "Tomate x Kg", precio: 2500, stock: null, vende_por_peso: true, controla_stock: false, activo: true },
];

export const actualizarDataProductos = (nuevaLista) => {
  productos = nuevaLista;
};
