use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use std::fs;
use tauri::{AppHandle, Manager};

pub async fn init_db(app_handle: &AppHandle) -> Result<SqlitePool, Box<dyn std::error::Error>> {
    // 1. Obtener la ruta segura del OS (Ej: AppData/Roaming/com.pos.dev)
    // El Manager trait se usa para acceder a path() desde el app_handle en Tauri v2
    let app_dir = app_handle.path().app_data_dir()?;
    
    // 2. Crear la carpeta si no existe
    if !app_dir.exists() {
        fs::create_dir_all(&app_dir)?;
    }

    // 3. Crear el string de conexión (el archivo se llamará pos.db)
    let db_path = app_dir.join("pos.db");

    // 4. Configurar Conexión Segura (WAL y Timeout Anti-Colisión)
    let connect_options = sqlx::sqlite::SqliteConnectOptions::new()
        .filename(&db_path)
        .create_if_missing(true)
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
        .busy_timeout(std::time::Duration::from_secs(5));

    // 5. Iniciar el Pool Asíncrono
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(connect_options)
        .await?;

    // 5. Correr las migraciones automatizadas guardadas en la carpeta de macros sqlx
    // El macro `migrate!` auto-lee la carpeta "migrations" en la raíz
    sqlx::migrate!("./migrations").run(&pool).await?;

    Ok(pool)
}
