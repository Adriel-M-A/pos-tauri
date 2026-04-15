use tauri::State;
use sqlx::SqlitePool;
use crate::models::{Producto, Venta, VentaCreada, ItemVenta, InformePayload, Turno, CajaMovimiento, CierrePayload};
use crate::repositories::{
    repo_get_productos, repo_create_producto, repo_update_producto, repo_search_productos,
    repo_get_ventas_by_date, repo_get_venta_items, repo_crear_venta, repo_anular_venta,
    repo_get_informe,
    repo_get_turno_abierto, repo_abrir_turno, repo_registrar_movimiento, repo_get_movimientos_turno,
    repo_cerrar_turno, repo_get_cierres_por_mes, repo_get_total_ventas_turno
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
pub async fn create_venta(pool: State<'_, SqlitePool>, v: Venta) -> Result<VentaCreada, String> {
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

#[tauri::command]
pub async fn get_total_ventas_turno(pool: State<'_, SqlitePool>, turno_id: i64) -> Result<i64, String> {
    repo_get_total_ventas_turno(&*pool, turno_id).await.map_err(|e| { eprintln!("Error: {}", e); e.to_string() })
}

// --- BACKUP COMANDOS ---

#[tauri::command]
pub async fn crear_backup(app_handle: tauri::AppHandle, ruta_destino: String) -> Result<String, String> {
    use std::fs;
    use tauri::Manager;

    // Obtener la ruta de la base de datos actual
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("pos.db");

    if !db_path.exists() {
        return Err("No se encontró la base de datos para respaldar.".to_string());
    }

    // Generar nombre con timestamp
    let ahora = chrono::Local::now().format("%Y-%m-%d_%H-%M-%S").to_string();
    let nombre_archivo = format!("NexPOS_Backup_{}.db", ahora);
    let destino_completo = std::path::Path::new(&ruta_destino).join(&nombre_archivo);

    // Copiar el archivo de la base de datos
    fs::copy(&db_path, &destino_completo).map_err(|e| format!("Error al copiar: {}", e))?;

    // Guardar fecha del último backup en un archivo JSON
    let info_path = app_dir.join("backup_info.json");
    let info = serde_json::json!({
        "ultimo_backup": chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
        "ruta": destino_completo.to_string_lossy()
    });
    fs::write(&info_path, serde_json::to_string_pretty(&info).unwrap())
        .map_err(|e| format!("Error al guardar info de backup: {}", e))?;

    Ok(destino_completo.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn restaurar_backup(app_handle: tauri::AppHandle, pool: tauri::State<'_, sqlx::SqlitePool>, ruta_origen: String) -> Result<(), String> {
    use std::fs;
    use tauri::Manager;

    let origen = std::path::Path::new(&ruta_origen);
    if !origen.exists() {
        return Err("El archivo de respaldo seleccionado no existe.".to_string());
    }

    // 1. Cerrar violentamente el pool de conexiones actual para liberar el archivo (pos.db)
    pool.close().await;

    // Obtener la ruta de la base de datos actual
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("pos.db");

    // 2. Limpiar permanentemente los archivos WAL/SHM para evitar corrupción
    let _ = fs::remove_file(app_dir.join("pos.db-wal"));
    let _ = fs::remove_file(app_dir.join("pos.db-shm"));

    // 3. Sobreescribir la base de datos vacía/cerrada con el respaldo
    fs::copy(origen, &db_path).map_err(|e| format!("Error al restaurar: {}", e))?;

    // 4. Reiniciar la aplicación automáticamente para cargar la nueva base de datos
    app_handle.restart();
}

#[tauri::command]
pub async fn get_backup_info(app_handle: tauri::AppHandle) -> Result<Option<serde_json::Value>, String> {
    use std::fs;
    use tauri::Manager;

    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let info_path = app_dir.join("backup_info.json");

    if !info_path.exists() {
        return Ok(None);
    }

    let contenido = fs::read_to_string(&info_path).map_err(|e| e.to_string())?;
    let json: serde_json::Value = serde_json::from_str(&contenido).map_err(|e| e.to_string())?;
    Ok(Some(json))
}

