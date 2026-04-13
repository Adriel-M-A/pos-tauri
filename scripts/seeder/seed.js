const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { fakerES: faker } = require('@faker-js/faker'); // Usaremos locale Español

// 1. Determinar ruta de la BD según OS (Tauri)
const appDataPath = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.local/share');
const bundleId = 'com.nexpos.system';
const dbPath = path.join(appDataPath, bundleId, 'pos.db');

console.log(`[1/5] Localizando Base de Datos en: ${dbPath}`);

if (!fs.existsSync(dbPath)) {
  // Asegurar que exista la carpeta al menos si es la primera vez total
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

// Conectar con WAL mode
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// 2. Limpieza total y Recreación de Tablas
console.log(`[2/5] Purgando datos anteriores y recreando esquema...`);
try {
  // Por si el archivo ya existía con datos, borramos las tablas para limpiarlas
  db.exec(`
    DROP TABLE IF EXISTS caja_movimientos;
    DROP TABLE IF EXISTS venta_items;
    DROP TABLE IF EXISTS ventas;
    DROP TABLE IF EXISTS turnos;
    DROP TABLE IF EXISTS productos;
  `);

  // Leemos las migraciones originales para tener la estructura oficial
  const mig1 = fs.readFileSync(path.join(__dirname, '../../src-tauri/migrations/0001_initial_schema.sql'), 'utf-8');
  const mig2 = fs.readFileSync(path.join(__dirname, '../../src-tauri/migrations/0002_add_turno_observaciones.sql'), 'utf-8');
  
  db.exec(mig1);
  db.exec(mig2);
} catch (e) {
  console.error("Error al recrear el esquema. ¿Tienes la app abierta y bloqueando el archivo? Cierra la aplicación e intenta de nuevo.");
  console.error(e.message);
  process.exit(1);
}

// ---------------------------------------------------------
// UTILIDADES
// ---------------------------------------------------------
const formatDate = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

// ---------------------------------------------------------
// SEMBRADO (SEEDING) BASE
// ---------------------------------------------------------

// 3. Crear Catálogo de Productos
console.log(`[3/5] Creando Catálogo Base de 100 Productos...`);
const insertProducto = db.prepare(`
  INSERT INTO productos (codigo, nombre, precio, stock, vende_por_peso, controla_stock, activo)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const productos = [];
db.transaction(() => {
  for (let i = 1; i <= 100; i++) {
    const isPeso = faker.datatype.boolean() && i % 3 === 0; // 1/3 son por peso
    const precio = faker.number.int({ min: 100, max: 15000 }) * 100; // Centavos
    
    // Si es producto por peso, NUNCA controla stock en este seeder (según requerimiento)
    // Para unitarios, 20% de probabilidad de que no controle stock
    const controlaStock = isPeso ? 0 : (faker.number.int({ min: 1, max: 100 }) > 20 ? 1 : 0);

    const prod = {
      id: i,
      codigo: String(i).padStart(3, "0"),
      nombre: faker.commerce.productName(),
      precio: precio,
      // Si no controla stock o es por peso, el stock es null
      stock: (controlaStock === 1 && !isPeso)
        ? faker.number.int({ min: 10, max: 200 })
        : null,
      vende_por_peso: isPeso ? 1 : 0,
      controla_stock: controlaStock,
      activo: 1
    };
    
    insertProducto.run(prod.codigo, prod.nombre, prod.precio, prod.stock, prod.vende_por_peso, prod.controla_stock, prod.activo);
    productos.push(prod);
  }
})();

// Métodos de pago posibles (deben coincidir exactamente con src/data/metodosPago.js)
const METODOS_PAGO = ['efectivo', 'tarjeta', 'transferencia'];

// 4. Simulador de 365 días de ventas
console.log(`[4/5] Simulando 365 días de operación ininterrumpida... paciencia.`);

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

// Comenzamos 365 días en el pasado hasta hoy
const fechaInicio = new Date();
fechaInicio.setDate(fechaInicio.getDate() - 365);

let globalVentaId = 1;
let ticketCounter = 1;

db.transaction(() => {
  for (let dia = 0; dia <= 365; dia++) {
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

    let ingresosCaja = fondoInicial; // Acumulador de efectivo real

    // --- DÍA: Ventas ---
    const cantVentas = faker.number.int({ min: 20, max: 60 });
    for (let v = 0; v < cantVentas; v++) {
      // Avanzar minutos
      currentDay.setMinutes(currentDay.getMinutes() + faker.number.int({ min: 5, max: 30 }));
      
      const cantItems = faker.number.int({ min: 1, max: 8 });
      let subtotal = 0;
      
      const itemsDeVenta = [];
      // Generar items
      for (let i = 0; i < cantItems; i++) {
        const prod = faker.helpers.arrayElement(productos);
        const cant = prod.vende_por_peso ? faker.number.float({ min: 0.1, max: 3, fractionDigits: 3 }) : faker.number.int({ min: 1, max: 5 });
        const subtotalItem = Math.round(cant * prod.precio);
        
        // ----- AUTO RESTOCK (Para evitar stocks en negativo en el seeder) -----
        if (prod.controla_stock) {
          if (prod.stock < cant) {
            const restockAmount = prod.vende_por_peso ? 50 : 100; // Recargamos 50kg o 100u
            prod.stock += restockAmount;
            // Lo guardamos en DB sin molestar la venta del loop
            db.prepare(`UPDATE productos SET stock = ? WHERE id = ?`).run(prod.stock, prod.id);
          }
          prod.stock -= cant; // Mantenemos la RAM local actualizada
        }
        
        itemsDeVenta.push({
          producto_id: prod.id,
          nombre: prod.nombre,
          cantidad: cant,
          precio: prod.precio,
          subtotal: subtotalItem
        });

        subtotal += subtotalItem;
        
        // Simular consumo de stock
        if (prod.controla_stock) {
          updateStock.run(cant, prod.id);
        }
      }

      // Descuento al azar 10% del tiempo
      let ajuste = 0;
      if (faker.number.int({ min: 1, max: 100 }) <= 10) {
        ajuste = -Math.round(subtotal * faker.number.float({ min: 0.05, max: 0.15 }));
      }
      
      const total = subtotal + ajuste;
      const metodo = faker.helpers.arrayElement(METODOS_PAGO);
      const anulada = faker.number.int({ min: 1, max: 100 }) <= 2 ? 1 : 0; // 2% probabilidad de anulación (ignorada matematicamente)

      const infoVenta = insertVenta.run(`T-${String(ticketCounter++).padStart(5, '0')}`, formatDate(currentDay), subtotal, ajuste, total, metodo, anulada, turnoId);
      
      const ventaId = infoVenta.lastInsertRowid;
      
      // Insertar detalle
      for (let item of itemsDeVenta) {
        insertVentaItem.run(ventaId, item.producto_id, item.nombre, item.cantidad, item.precio, item.subtotal);
      }

      // Sumar si es efectivo y no anulada
      if (metodo === 'Efectivo' && !anulada) {
        ingresosCaja += total;
      }
    }

    // --- ESPORÁDICO: Movimiento manual ---
    if (faker.datatype.boolean()) {
       currentDay.setMinutes(currentDay.getMinutes() + faker.number.int({ min: 5, max: 30 }));
       const isRetiro = faker.datatype.boolean();
       const montoMov = faker.number.int({ min: 1000, max: 5000 }) * 100;
       
       insertMovimiento.run(turnoId, isRetiro ? 'retiro' : 'ingreso', montoMov, isRetiro ? 'Pago proveedor' : 'Cambio extra', formatDate(currentDay));

       if (isRetiro) ingresosCaja -= montoMov;
       else ingresosCaja += montoMov;
    }

    // --- NOCHE: Cierre de Turno ---
    currentDay.setHours(faker.number.int({ min: 19, max: 22 }), faker.number.int({ min: 0, max: 59 }), 0);
    const dateCierre = formatDate(currentDay);
    
    // El cajero casi siempre cuadra, pero a veces se equivoca o roba
    let declarado = ingresosCaja;
    let observacion = null;

    if (faker.number.int({ min: 1, max: 100 }) <= 10) {
      // Diferencia (faltante o sobrante de hasta $2000)
      const errorStr = faker.number.int({ min: 50, max: 2000 }) * 100;
      declarado += faker.datatype.boolean() ? errorStr : -errorStr;
      observacion = "Diferencia de caja chica - Revisar";
    }

    const diferencia = declarado - ingresosCaja;

    db.prepare(`
      UPDATE turnos 
      SET fecha_cierre = ?, total_esperado = ?, total_declarado = ?, diferencia = ?, estado = 'cerrado', observaciones = ?
      WHERE id = ?
    `).run(dateCierre, ingresosCaja, declarado, diferencia, observacion, turnoId);
  }
})();

console.log(`[5/5] ¡Seeding Finalizado Exitosamente!`);
console.log(`Se insertaron ~365 turnos y ~15,000 ventas. ¡Abre tu sistema POS!`);

db.close();
