use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Producto {
    pub id: Option<i64>,
    pub codigo: String,
    pub nombre: String,
    pub precio: i64,
    pub stock: Option<f64>,
    pub vende_por_peso: bool,
    pub controla_stock: bool,
    pub activo: bool,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Venta {
    pub id: Option<i64>,
    pub numero_ticket: String,
    pub fecha: String,
    pub subtotal: i64,
    pub ajuste: i64,
    pub total: i64,
    pub metodo_pago: String,
    pub anulada: bool,
    pub turno_id: Option<i64>,
    // La DB guarda la relación plana, pero en memoria devolvemos el objeto anidado para react
    #[sqlx(skip)] 
    pub items: Vec<ItemVenta>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct ItemVenta {
    pub id: Option<i64>,
    pub venta_id: i64,
    pub producto_id: i64,
    pub nombre: String,
    pub cantidad: f64,
    pub precio: i64,
    pub subtotal: i64,
    pub vende_por_peso: Option<bool>,
}

// =========== MODELOS INFORMES ===========

/// Punto individual del gráfico de barras (ej: "08:00" => $15000)
#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct GraficoItem {
    pub name: String,
    pub total: i64,
}

/// Producto en el ranking de salidas (Top 10)
#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct RankingItem {
    pub nombre: String,
    pub cantidad: f64, // Cantidad son unidades/kg, se mantiene en float
}

/// Desglose de ingresos por método de pago
#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct MetodoPagoItem {
    pub metodo_pago: String,
    pub total: i64,
}

/// Paquete completo que Rust devuelve a React de una sola vez
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InformePayload {
    pub total_facturado: i64,
    pub cantidad_ventas: i64,
    pub promedio_ticket: i64,
    pub grafico: Vec<GraficoItem>,
    pub ranking: Vec<RankingItem>,
    pub metodos_pago: Vec<MetodoPagoItem>,
}

// =========== MODELOS TURNOS / CIERRE DE CAJA ===========

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Turno {
    pub id: Option<i64>,
    pub fecha_apertura: String,
    pub fecha_cierre: Option<String>,
    pub fondo_inicial: i64,
    pub total_esperado: Option<i64>,
    pub total_declarado: Option<i64>,
    pub diferencia: Option<i64>,
    pub estado: String,
    pub observaciones: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct CajaMovimiento {
    pub id: Option<i64>,
    pub turno_id: i64,
    pub tipo: String,
    pub monto: i64,
    pub motivo: String,
    pub fecha: String,
}

/// Resultado del cierre de caja que se devuelve a React
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CierrePayload {
    pub fondo_inicial: i64,
    pub ventas_efectivo: i64,
    pub ingresos_manuales: i64,
    pub retiros_manuales: i64,
    pub total_esperado: i64,
    pub total_declarado: i64,
    pub diferencia: i64,
}

/// Resultado de una venta creada: devuelve id y número de ticket al frontend
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VentaCreada {
    pub id: i64,
    pub numero_ticket: String,
}

/// Envoltorio completo de un turno para el historial de auditoría
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TurnoConDetalles {
    pub id: i64,
    pub fecha_apertura: String,
    pub fecha_cierre: Option<String>,
    pub fondo_inicial: i64,
    pub total_esperado: Option<i64>,
    pub total_declarado: Option<i64>,
    pub diferencia: Option<i64>,
    pub estado: String,
    pub observaciones: Option<String>,
    pub caja_movimientos: Vec<CajaMovimiento>,
}

