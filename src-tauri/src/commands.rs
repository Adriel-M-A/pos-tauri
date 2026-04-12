use tauri::State;
use sqlx::SqlitePool;
use crate::models::{Producto, Venta, ItemVenta, InformePayload, Turno, CajaMovimiento, CierrePayload};
use crate::repositories::{
    repo_get_productos, repo_create_producto, repo_update_producto, repo_search_productos,
    repo_get_ventas_by_date, repo_get_venta_items, repo_crear_venta, repo_anular_venta,
    repo_get_informe,
    repo_get_turno_abierto, repo_abrir_turno, repo_registrar_movimiento, repo_get_movimientos_turno, repo_cerrar_turno, repo_get_cierres_por_mes
};

// --- PRODUCTOS COMANDOS ---

#[tauri::command]
pub async fn search_productos(pool: State<'_, SqlitePool>, query: String) -> Result<Vec<Producto>, String> {
    repo_search_productos(&*pool, query).await.map_err(|e| { eprintln!("Error: {}", e); e.to_string() })
}

#[tauri::command]
pub async fn get_productos(pool: State<'_, SqlitePool>) -> Result<Vec<Producto>, String> {
    repo_get_productos(&*pool).await.map_err(|e| { eprintln!("Error: {}", e); e.to_string() })
}

#[tauri::command]
pub async fn create_producto(pool: State<'_, SqlitePool>, prod: Producto) -> Result<i64, String> {
    repo_create_producto(&*pool, prod).await.map_err(|e| { eprintln!("Error: {}", e); e.to_string() })
}

#[tauri::command]
pub async fn update_producto(pool: State<'_, SqlitePool>, prod: Producto) -> Result<(), String> {
    repo_update_producto(&*pool, prod).await.map_err(|e| { eprintln!("Error: {}", e); e.to_string() })
}

// --- VENTAS COMANDOS ---

#[tauri::command]
pub async fn get_ventas_by_date(pool: State<'_, SqlitePool>, fecha: String) -> Result<Vec<Venta>, String> {
    repo_get_ventas_by_date(&*pool, fecha).await.map_err(|e| { eprintln!("Error: {}", e); e.to_string() })
}

#[tauri::command]
pub async fn get_venta_items(pool: State<'_, SqlitePool>, venta_id: i64) -> Result<Vec<ItemVenta>, String> {
    repo_get_venta_items(&*pool, venta_id).await.map_err(|e| { eprintln!("Error: {}", e); e.to_string() })
}

#[tauri::command]
pub async fn create_venta(pool: State<'_, SqlitePool>, v: Venta) -> Result<i64, String> {
    repo_crear_venta(&*pool, v).await.map_err(|e| { eprintln!("Error: {}", e); e.to_string() })
}

#[tauri::command]
pub async fn anular_venta(pool: State<'_, SqlitePool>, id_venta: i64) -> Result<(), String> {
    repo_anular_venta(&*pool, id_venta).await.map_err(|e| { eprintln!("Error: {}", e); e.to_string() })
}

// --- INFORMES COMANDOS ---

#[tauri::command]
pub async fn get_informe(pool: State<'_, SqlitePool>, desde: String, hasta: String, agrupacion: String) -> Result<InformePayload, String> {
    repo_get_informe(&*pool, desde, hasta, agrupacion).await.map_err(|e| { eprintln!("Error: {}", e); e.to_string() })
}

// --- TURNOS / CIERRE DE CAJA COMANDOS ---

#[tauri::command]
pub async fn get_turno_abierto(pool: State<'_, SqlitePool>) -> Result<Option<Turno>, String> {
    repo_get_turno_abierto(&*pool).await.map_err(|e| { eprintln!("Error: {}", e); e.to_string() })
}

#[tauri::command]
pub async fn abrir_turno(pool: State<'_, SqlitePool>, fondo_inicial: i64) -> Result<i64, String> {
    repo_abrir_turno(&*pool, fondo_inicial).await.map_err(|e| { eprintln!("Error: {}", e); e.to_string() })
}

#[tauri::command]
pub async fn registrar_movimiento(pool: State<'_, SqlitePool>, turno_id: i64, tipo: String, monto: i64, motivo: String) -> Result<i64, String> {
    repo_registrar_movimiento(&*pool, turno_id, tipo, monto, motivo).await.map_err(|e| { eprintln!("Error: {}", e); e.to_string() })
}

#[tauri::command]
pub async fn get_movimientos_turno(pool: State<'_, SqlitePool>, turno_id: i64) -> Result<Vec<CajaMovimiento>, String> {
    repo_get_movimientos_turno(&*pool, turno_id).await.map_err(|e| { eprintln!("Error: {}", e); e.to_string() })
}

#[tauri::command]
pub async fn cerrar_turno(pool: State<'_, SqlitePool>, turno_id: i64, total_declarado: i64, observaciones: Option<String>) -> Result<CierrePayload, String> {
    repo_cerrar_turno(&*pool, turno_id, total_declarado, observaciones).await.map_err(|e| { eprintln!("Error: {}", e); e.to_string() })
}

#[tauri::command]
pub async fn get_historial_cierres(pool: State<'_, SqlitePool>, mes: String) -> Result<Vec<crate::models::TurnoConDetalles>, String> {
    repo_get_cierres_por_mes(&*pool, mes).await.map_err(|e| { eprintln!("Error: {}", e); e.to_string() })
}

