use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Error de base de datos: {0}")]
    DatabaseError(String),
    #[error("Stock insuficiente: {0}")]
    StockInsuficiente(String),
    #[error("El turno está cerrado o no existe")]
    TurnoCerrado,
    #[error("Error de validación: {0}")]
    ValidationError(String),
    #[error("Error de sistema: {0}")]
    IoError(String),
    #[error("Error de Tauri: {0}")]
    TauriError(String),
    #[error("Error de JSON: {0}")]
    JsonError(String),
}

// We need custom serialization so the frontend can receive it as a JSON object
// like { "tipo": "DatabaseError", "mensaje": "..." }
impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut state = serializer.serialize_struct("AppError", 2)?;
        
        let tipo = match self {
            AppError::DatabaseError(_) => "DatabaseError",
            AppError::StockInsuficiente(_) => "StockInsuficiente",
            AppError::TurnoCerrado => "TurnoCerrado",
            AppError::ValidationError(_) => "ValidationError",
            AppError::IoError(_) => "IoError",
            AppError::TauriError(_) => "TauriError",
            AppError::JsonError(_) => "JsonError",
        };
        
        state.serialize_field("tipo", tipo)?;
        state.serialize_field("mensaje", &self.to_string())?;
        state.end()
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        AppError::DatabaseError(err.to_string())
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::IoError(err.to_string())
    }
}

impl From<tauri::Error> for AppError {
    fn from(err: tauri::Error) -> Self {
        AppError::TauriError(err.to_string())
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::JsonError(err.to_string())
    }
}
