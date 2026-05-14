mod db;
mod models;
mod repositories;
mod commands;
pub mod error;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let handle = app.handle().clone();
            
            // Inicialización de base de datos de manera síncrona en el setup
            let pool = tauri::async_runtime::block_on(async move {
                db::init_db(&handle).await.expect("Error al inicializar SQLite")
            });
            
            app.manage(pool);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_productos,
            commands::search_productos,
            commands::create_producto,
            commands::update_producto,
            commands::get_ventas_by_date,
            commands::get_venta_items,
            commands::create_venta,
            commands::anular_venta,
            commands::get_informe,
            commands::get_turno_abierto,
            commands::abrir_turno,
            commands::registrar_movimiento,
            commands::get_movimientos_turno,
            commands::cerrar_turno,
            commands::get_historial_cierres,
            commands::get_total_ventas_turno,
            commands::crear_backup,
            commands::restaurar_backup,
            commands::get_backup_info
        ])
        .run(tauri::generate_context!())
        .expect("error al correr aplicacion tauri");
}
