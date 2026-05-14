const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { fakerES: faker } = require('@faker-js/faker');

// =========================================================
// CATÁLOGO REAL DE PRODUCTOS DE KIOSCO / MERCADO LOCAL
// =========================================================
// Cada entrada: [nombre, precioEnPesos, vendePorPeso, controlaStock]
const CATALOGO = [
  // --- Bebidas ---
  ['Coca-Cola 500ml', 1500, false, true],
  ['Coca-Cola 1.5L', 2800, false, true],
  ['Sprite 500ml', 1400, false, true],
  ['Agua Mineral 500ml', 900, false, true],
  ['Agua Mineral 1.5L', 1600, false, true],
  ['Fanta Naranja 500ml', 1400, false, true],
  ['Jugo Cepita 1L', 2200, false, true],
  ['Cerveza Quilmes Lata', 1800, false, true],
  ['Cerveza Brahma Lata', 1500, false, true],
  ['Energizante Speed 250ml', 2000, false, true],
  // --- Panificados y Galletitas ---
  ['Pan Lactal Bimbo', 3200, false, true],
  ['Galletitas Oreo', 1800, false, true],
  ['Galletitas Toddy', 1900, false, true],
  ['Bizcochos Don Satur', 1200, false, true],
  ['Galletitas Crackers', 1100, false, true],
  ['Medialunas (6u)', 2500, false, true],
  // --- Lácteos ---
  ['Leche La Serenísima 1L', 1800, false, true],
  ['Yogur Sachet Vainilla', 1200, false, true],
  ['Queso Cremoso (kg)', 8500, true, true],
  ['Manteca 200g', 2800, false, true],
  // --- Fiambrería ---
  ['Jamón Cocido (kg)', 12000, true, true],
  ['Queso de Máquina (kg)', 9500, true, true],
  ['Salame (kg)', 11000, true, true],
  // --- Almacén ---
  ['Arroz Largo Fino 1kg', 1600, false, true],
  ['Fideos Tirabuzón 500g', 1200, false, true],
  ['Aceite Girasol 900ml', 2500, false, true],
  ['Azúcar 1kg', 1400, false, true],
  ['Yerba Mate 1kg', 4500, false, true],
  ['Café Molido 250g', 3500, false, true],
  ['Sal Fina 500g', 600, false, true],
  ['Harina 000 1kg', 1100, false, true],
  ['Puré de Tomate 520g', 900, false, true],
  ['Atún en Lata', 2200, false, true],
  ['Mayonesa 500g', 2800, false, true],
  // --- Golosinas y Snacks ---
  ['Alfajor Havanna', 2200, false, true],
  ['Alfajor Jorgito', 800, false, true],
  ['Chicle Beldent', 500, false, false],
  ['Caramelos Sugus (paq)', 700, false, false],
  ['Papas Fritas Lays', 2400, false, true],
  ['Chocolate Milka 100g', 3000, false, true],
  // --- Limpieza ---
  ['Lavandina 1L', 900, false, true],
  ['Detergente Magistral 500ml', 2200, false, true],
  ['Papel Higiénico (4u)', 2800, false, true],
  ['Jabón en Polvo 800g', 3200, false, true],
  // --- Verdulería (por peso) ---
  ['Banana (kg)', 1800, true, false],
  ['Manzana Roja (kg)', 2200, true, false],
  ['Tomate Redondo (kg)', 2500, true, false],
  ['Papa (kg)', 1200, true, false],
  ['Cebolla (kg)', 1000, true, false],
  ['Naranja (kg)', 1500, true, false],
];

// =========================================================
// 1. Determinar ruta de la BD según OS (Tauri)
// =========================================================
const appDataPath = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.local/share');
const bundleId = 'com.nexpos.system';
const dbPath = path.join(appDataPath, bundleId, 'pos.db');

console.log(`[1/5] Localizando Base de Datos en: ${dbPath}`);

if (!fs.existsSync(dbPath)) {
  // Asegurar que exista la carpeta si es la primera ejecución
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

// Conectar con WAL mode
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// =========================================================
// 2. Limpieza total y Recreación de Tablas
// =========================================================
console.log(`[2/5] Purgando datos anteriores y recreando esquema...`);
try {
  // Borrar tablas existentes para una base limpia
  db.exec(`
    DROP TABLE IF EXISTS caja_movimientos;
    DROP TABLE IF EXISTS venta_items;
    DROP TABLE IF EXISTS ventas;
    DROP TABLE IF EXISTS turnos;
    DROP TABLE IF EXISTS productos;
  `);

  // Leer y aplicar todas las migraciones oficiales
  const migrationsDir = path.join(__dirname, '../../src-tauri/migrations');
  const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of migrationFiles) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    db.exec(sql);
    console.log(`   ✔ Migración aplicada: ${file}`);
  }
} catch (e) {
  console.error("Error al recrear el esquema. ¿Tienes la app abierta y bloqueando el archivo? Cierra la aplicación e intenta de nuevo.");
  console.error(e.message);
  process.exit(1);
}

// =========================================================
// UTILIDADES
// =========================================================
const formatDate = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

// =========================================================
// 3. Crear Catálogo de Productos (50 reales)
// =========================================================
console.log(`[3/5] Creando Catálogo de ${CATALOGO.length} Productos Reales...`);

const insertProducto = db.prepare(`
  INSERT INTO productos (codigo, nombre, precio, stock, vende_por_peso, controla_stock, activo)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const productos = [];
db.transaction(() => {
  CATALOGO.forEach(([nombre, precioPesos, vendePorPeso, controlaStock], index) => {
    const id = index + 1;
    const precioCentavos = precioPesos * 100; // Convertir a centavos
    const stockInicial = controlaStock
      ? (vendePorPeso ? faker.number.float({ min: 10, max: 50, fractionDigits: 1 }) : faker.number.int({ min: 15, max: 80 }))
      : null;

    const prod = {
      id,
      codigo: String(id).padStart(3, '0'),
      nombre,
      precio: precioCentavos,
      stock: stockInicial,
      vende_por_peso: vendePorPeso ? 1 : 0,
      controla_stock: controlaStock ? 1 : 0,
      activo: 1,
    };

    insertProducto.run(prod.codigo, prod.nombre, prod.precio, prod.stock, prod.vende_por_peso, prod.controla_stock, prod.activo);
    productos.push(prod);
  });
})();

// Métodos de pago posibles (deben coincidir exactamente con src/data/metodosPago.js)
const METODOS_PAGO = ['efectivo', 'tarjeta', 'transferencia'];

// =========================================================
// 4. Simulador de 30 días de ventas (reducido)
// =========================================================
const DIAS_SIMULADOS = 30;
console.log(`[4/5] Simulando ${DIAS_SIMULADOS} días de operación...`);

const insertTurno = db.prepare(`
  INSERT INTO turnos (fecha_apertura, fecha_cierre, fondo_inicial, total_esperado, total_declarado, diferencia, estado, observaciones)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertVenta = db.prepare(`
  INSERT INTO ventas (numero_ticket, fecha, subtotal, ajuste, total, metodo_pago, anulada, turno_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertVentaItem = db.prepare(`
  INSERT INTO venta_items (venta_id, producto_id, nombre, cantidad, precio, subtotal)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const updateStock = db.prepare(`
  UPDATE productos SET stock = stock - ? WHERE id = ?
`);

const insertMovimiento = db.prepare(`
  INSERT INTO caja_movimientos (turno_id, tipo, monto, motivo, fecha)
  VALUES (?, ?, ?, ?, ?)
`);

// Comenzamos N días en el pasado hasta hoy
const fechaInicio = new Date();
fechaInicio.setDate(fechaInicio.getDate() - DIAS_SIMULADOS);

let ticketCounter = 1;
let totalVentas = 0;
let totalTurnos = 0;

db.transaction(() => {
  for (let dia = 0; dia <= DIAS_SIMULADOS; dia++) {
    const currentDay = new Date(fechaInicio);
    currentDay.setDate(fechaInicio.getDate() + dia);

    // Saltear algunos domingos al azar (negocio cerrado)
    if (currentDay.getDay() === 0 && faker.datatype.boolean()) continue;

    // --- MAÑANA: Apertura de Turno ---
    currentDay.setHours(faker.number.int({ min: 8, max: 10 }), faker.number.int({ min: 0, max: 59 }), 0);
    const dateApertura = formatDate(currentDay);
    const fondoInicial = faker.datatype.boolean() ? faker.number.int({ min: 5000, max: 20000 }) * 100 : 0;

    const infoTurno = insertTurno.run(dateApertura, null, fondoInicial, null, null, null, 'abierto', null);
    const turnoId = infoTurno.lastInsertRowid;
    totalTurnos++;

    let ingresosCaja = fondoInicial; // Acumulador de efectivo real

    // --- DÍA: Ventas (reducido: 5-15 por turno) ---
    const cantVentas = faker.number.int({ min: 5, max: 15 });
    for (let v = 0; v < cantVentas; v++) {
      // Avanzar minutos entre ventas
      currentDay.setMinutes(currentDay.getMinutes() + faker.number.int({ min: 10, max: 45 }));

      const cantItems = faker.number.int({ min: 1, max: 5 });
      let subtotal = 0;

      const itemsDeVenta = [];
      // Generar items de la venta
      for (let i = 0; i < cantItems; i++) {
        const prod = faker.helpers.arrayElement(productos);
        const cant = prod.vende_por_peso
          ? faker.number.float({ min: 0.1, max: 2.5, fractionDigits: 3 })
          : faker.number.int({ min: 1, max: 3 });
        const subtotalItem = Math.round(cant * prod.precio);

        // Auto-restock para evitar stocks negativos en el seeder
        if (prod.controla_stock && prod.stock !== null) {
          if (prod.stock < cant) {
            const restockAmount = prod.vende_por_peso ? 30 : 50;
            prod.stock += restockAmount;
            db.prepare(`UPDATE productos SET stock = ? WHERE id = ?`).run(prod.stock, prod.id);
          }
          prod.stock -= cant; // Mantener RAM local actualizada
        }

        itemsDeVenta.push({
          producto_id: prod.id,
          nombre: prod.nombre,
          cantidad: cant,
          precio: prod.precio,
          subtotal: subtotalItem,
        });

        subtotal += subtotalItem;

        // Actualizar stock en BD
        if (prod.controla_stock) {
          updateStock.run(cant, prod.id);
        }
      }

      // Descuento al azar ~10% del tiempo
      let ajuste = 0;
      if (faker.number.int({ min: 1, max: 100 }) <= 10) {
        ajuste = -Math.round(subtotal * faker.number.float({ min: 0.05, max: 0.15 }));
      }

      const total = subtotal + ajuste;
      const metodo = faker.helpers.arrayElement(METODOS_PAGO);
      // 2% de probabilidad de anulación
      const anulada = faker.number.int({ min: 1, max: 100 }) <= 2 ? 1 : 0;

      const infoVenta = insertVenta.run(
        `T-${String(ticketCounter++).padStart(5, '0')}`,
        formatDate(currentDay),
        subtotal,
        ajuste,
        total,
        metodo,
        anulada,
        turnoId
      );

      const ventaId = infoVenta.lastInsertRowid;

      // Insertar detalle de items
      for (const item of itemsDeVenta) {
        insertVentaItem.run(ventaId, item.producto_id, item.nombre, item.cantidad, item.precio, item.subtotal);
      }

      // Sumar si es efectivo y no anulada (corregido: comparación en minúsculas)
      if (metodo === 'efectivo' && !anulada) {
        ingresosCaja += total;
      }

      totalVentas++;
    }

    // --- ESPORÁDICO: Movimiento manual de caja ---
    if (faker.datatype.boolean()) {
      currentDay.setMinutes(currentDay.getMinutes() + faker.number.int({ min: 5, max: 30 }));
      const isRetiro = faker.datatype.boolean();
      const montoMov = faker.number.int({ min: 1000, max: 5000 }) * 100;

      const motivo = isRetiro
        ? faker.helpers.arrayElement(['Pago proveedor', 'Retiro del dueño', 'Gastos varios'])
        : faker.helpers.arrayElement(['Cambio extra', 'Ingreso por cobro deuda', 'Aporte del dueño']);

      insertMovimiento.run(turnoId, isRetiro ? 'retiro' : 'ingreso', montoMov, motivo, formatDate(currentDay));

      if (isRetiro) ingresosCaja -= montoMov;
      else ingresosCaja += montoMov;
    }

    // --- NOCHE: Cierre de Turno ---
    currentDay.setHours(faker.number.int({ min: 19, max: 22 }), faker.number.int({ min: 0, max: 59 }), 0);
    const dateCierre = formatDate(currentDay);

    // El cajero casi siempre cuadra, pero a veces hay diferencia
    let declarado = ingresosCaja;
    let observacion = null;

    if (faker.number.int({ min: 1, max: 100 }) <= 10) {
      // Diferencia (faltante o sobrante)
      const errorMonto = faker.number.int({ min: 50, max: 2000 }) * 100;
      declarado += faker.datatype.boolean() ? errorMonto : -errorMonto;
      observacion = 'Diferencia de caja chica - Revisar';
    }

    const diferencia = declarado - ingresosCaja;

    db.prepare(`
      UPDATE turnos 
      SET fecha_cierre = ?, total_esperado = ?, total_declarado = ?, diferencia = ?, estado = 'cerrado', observaciones = ?
      WHERE id = ?
    `).run(dateCierre, ingresosCaja, declarado, diferencia, observacion, turnoId);
  }
})();

// =========================================================
// 5. Resumen final
// =========================================================
console.log(`\n[5/5] ¡Seeding Finalizado Exitosamente!`);
console.log(`   📦 Productos insertados: ${productos.length}`);
console.log(`   📅 Turnos creados: ${totalTurnos}`);
console.log(`   🧾 Ventas generadas: ${totalVentas}`);
console.log(`\n¡Abre tu sistema NexPOS!`);

db.close();
