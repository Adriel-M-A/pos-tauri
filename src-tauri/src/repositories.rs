use crate::models::{ItemVenta, Producto, Venta, VentaCreada, InformePayload, GraficoItem, RankingItem, MetodoPagoItem, Turno, CajaMovimiento, CierrePayload};
use sqlx::SqlitePool;

// =========== REPOSITORIO PRODUCTOS ===========

pub async fn repo_get_productos(pool: &SqlitePool) -> Result<Vec<Producto>, sqlx::Error> {
    sqlx::query_as::<_, Producto>(
        r#"SELECT id, codigo, nombre, precio, stock, vende_por_peso, controla_stock, activo FROM productos"#
    )
    .fetch_all(pool)
    .await
}

pub async fn repo_create_producto(pool: &SqlitePool, prod: Producto) -> Result<i64, sqlx::Error> {
    let mut tx = pool.begin().await?;

    // Insertar con código temporal para obtener el ID real de la DB
    let result = sqlx::query(
        r#"
        INSERT INTO productos (codigo, nombre, precio, stock, vende_por_peso, controla_stock, activo)
        VALUES ('__TEMP__', ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&prod.nombre)
    .bind(prod.precio)
    .bind(prod.stock)
    .bind(prod.vende_por_peso)
    .bind(prod.controla_stock)
    .bind(prod.activo)
    .execute(&mut *tx)
    .await?;

    let new_id = result.last_insert_rowid();

    // Generar el código definitivo basado en el ID real asignado por SQLite
    // {:03} → mínimo 3 dígitos con cero-padding, crece naturalmente si supera 999
    // Consistente con los códigos existentes: "001".."100".."999".."1000"..
    let auto_codigo = format!("{:03}", new_id);

    sqlx::query("UPDATE productos SET codigo = ? WHERE id = ?")
        .bind(&auto_codigo)
        .bind(new_id)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;
    Ok(new_id)
}

pub async fn repo_update_producto(pool: &SqlitePool, prod: Producto) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE productos 
        SET nombre = ?, precio = ?, stock = ?, vende_por_peso = ?, controla_stock = ?, activo = ?
        WHERE id = ?
        "#
    )
    .bind(prod.nombre)
    .bind(prod.precio)
    .bind(prod.stock)
    .bind(prod.vende_por_peso)
    .bind(prod.controla_stock)
    .bind(prod.activo)
    .bind(prod.id)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn repo_search_productos(pool: &SqlitePool, query: String) -> Result<Vec<Producto>, sqlx::Error> {
    let wildcard = format!("%{}%", query);
    sqlx::query_as::<_, Producto>(
        r#"SELECT id, codigo, nombre, precio, stock, vende_por_peso, controla_stock, activo 
           FROM productos 
           WHERE activo = 1 AND (nombre LIKE ? OR codigo LIKE ?) 
           LIMIT 10"#
    )
    .bind(&wildcard)
    .bind(&wildcard)
    .fetch_all(pool)
    .await
}

// =========== REPOSITORIO VENTAS ===========

/// Trae SOLO las cabeceras de ventas para una fecha específica (YYYY-MM-DD).
/// No toca venta_items → ultra liviano para la grilla colapsada.
pub async fn repo_get_ventas_by_date(pool: &SqlitePool, fecha: String) -> Result<Vec<Venta>, sqlx::Error> {
    let wildcard = format!("{}%", fecha);
    sqlx::query_as::<_, Venta>(
        r#"SELECT id, numero_ticket, fecha, subtotal, ajuste, total, metodo_pago, anulada, turno_id 
           FROM ventas 
           WHERE fecha LIKE ? 
           ORDER BY id DESC"#
    )
    .bind(&wildcard)
    .fetch_all(pool)
    .await
}

/// Carga diferida: trae los items de UNA venta específica cuando el cajero expande la fila.
pub async fn repo_get_venta_items(pool: &SqlitePool, venta_id: i64) -> Result<Vec<ItemVenta>, sqlx::Error> {
    sqlx::query_as::<_, ItemVenta>(
        r#"SELECT vi.id, vi.venta_id, vi.producto_id, vi.nombre, vi.cantidad, vi.precio, vi.subtotal, p.vende_por_peso
           FROM venta_items vi
           JOIN productos p ON vi.producto_id = p.id
           WHERE vi.venta_id = ?"#
    )
    .bind(venta_id)
    .fetch_all(pool)
    .await
}

pub async fn repo_crear_venta(pool: &SqlitePool, mut v: Venta) -> Result<VentaCreada, sqlx::Error> {
    // 1. Iniciar Transacción Atómica
    let mut tx = pool.begin().await?;

    // Autogenerar número de comprobante usando MAX(id) para evitar colisiones con anuladas
    let last_id: (i64,) = sqlx::query_as("SELECT COALESCE(MAX(id), 0) FROM ventas")
        .fetch_one(&mut *tx)
        .await?;
    let correlativo = last_id.0 + 1;
    v.numero_ticket = format!("T-{:06}", correlativo);
    let numero_ticket_final = v.numero_ticket.clone();

    // Inyectar forzosamente el timestamp Local ignorando React UTC
    v.fecha = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    let result = sqlx::query(
        r#"
        INSERT INTO ventas (numero_ticket, fecha, subtotal, ajuste, total, metodo_pago, anulada, turno_id)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?)
        "#
    )
    .bind(&v.numero_ticket)
    .bind(&v.fecha)
    .bind(v.subtotal)
    .bind(v.ajuste)
    .bind(v.total)
    .bind(&v.metodo_pago)
    .bind(v.turno_id)
    .execute(&mut *tx)
    .await?;
    
    let venta_id = result.last_insert_rowid();

    // 2. Insertar items vinculados y descontar stock
    for res_item in v.items {
        sqlx::query(
            r#"
            INSERT INTO venta_items (venta_id, producto_id, nombre, cantidad, precio, subtotal)
            VALUES (?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(venta_id)
        .bind(res_item.producto_id)
        .bind(&res_item.nombre)
        .bind(res_item.cantidad)
        .bind(res_item.precio)
        .bind(res_item.subtotal)
        .execute(&mut *tx)
        .await?;

        // Descontar stock solo para productos por unidad que controlan inventario
        sqlx::query(
            r#"
            UPDATE productos 
            SET stock = stock - ? 
            WHERE id = ? AND controla_stock = 1 AND vende_por_peso = 0 AND stock IS NOT NULL
            "#
        )
        .bind(res_item.cantidad)
        .bind(res_item.producto_id)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    Ok(VentaCreada { id: venta_id, numero_ticket: numero_ticket_final })
}

pub async fn repo_anular_venta(pool: &SqlitePool, id_venta: i64) -> Result<(), sqlx::Error> {
    // 1. Recuperar info original e iniciar transaccion
    let mut tx = pool.begin().await?;

    // Ver si no está anulada ya (Usamos struct proxy corta para no traer toda la db)
    #[derive(sqlx::FromRow)]
    struct VentaStatus {
        anulada: bool,
    }

    let venta_estado = sqlx::query_as::<_, VentaStatus>("SELECT anulada FROM ventas WHERE id = ?")
        .bind(id_venta)
        .fetch_optional(&mut *tx)
        .await?;
        
    if let Some(est) = venta_estado {
        if est.anulada {
            return Ok(());
        }
    } else {
        return Ok(());
    }

    // 2. Marcarla como anulada
    sqlx::query("UPDATE ventas SET anulada = 1 WHERE id = ?")
        .bind(id_venta)
        .execute(&mut *tx)
        .await?;

    // 3. Revisar ítems para reactivar inventarios físicos robados
    let items = sqlx::query_as::<_, ItemVenta>(
        r#"SELECT vi.id, vi.venta_id, vi.producto_id, vi.nombre, vi.cantidad, vi.precio, vi.subtotal, p.vende_por_peso 
           FROM venta_items vi
           JOIN productos p ON vi.producto_id = p.id
           WHERE vi.venta_id = ?"#
    )
    .bind(id_venta)
    .fetch_all(&mut *tx)
    .await?;

    for it in items {
        sqlx::query(
            r#"
            UPDATE productos 
            SET stock = stock + ? 
            WHERE id = ? AND controla_stock = 1 AND vende_por_peso = 0 AND stock IS NOT NULL
            "#
        )
        .bind(it.cantidad)
        .bind(it.producto_id)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    Ok(())
}

// =========== REPOSITORIO INFORMES ===========

pub async fn repo_get_informe(
    pool: &SqlitePool,
    desde: String,
    hasta: String,
    agrupacion: String,
) -> Result<InformePayload, sqlx::Error> {

    // Query 1: KPIs globales (Total Facturado + Cantidad de Tickets)
    let kpi: (i64, i64) = sqlx::query_as(
        r#"SELECT COUNT(*) as cantidad, COALESCE(SUM(total), 0) as total
           FROM ventas
           WHERE fecha >= ? AND fecha <= ? AND anulada = 0"#
    )
    .bind(&desde)
    .bind(&hasta)
    .fetch_one(pool)
    .await?;

    let cantidad_ventas = kpi.0;
    let total_facturado = kpi.1;
    let promedio_ticket = if cantidad_ventas > 0 {
        total_facturado / cantidad_ventas
    } else {
        0
    };

    // Query 2: Datos para el gráfico de barras (agrupado por hora o por día)
    let grafico: Vec<GraficoItem> = if agrupacion == "hora" {
        sqlx::query_as::<_, GraficoItem>(
            r#"SELECT strftime('%H:00', fecha) as name, COALESCE(SUM(total), 0) as total
               FROM ventas
               WHERE fecha >= ? AND fecha <= ? AND anulada = 0
               GROUP BY strftime('%H', fecha)
               ORDER BY name ASC"#
        )
        .bind(&desde)
        .bind(&hasta)
        .fetch_all(pool)
        .await?
    } else {
        sqlx::query_as::<_, GraficoItem>(
            r#"SELECT strftime('%d/%m', fecha) as name, COALESCE(SUM(total), 0) as total
               FROM ventas
               WHERE fecha >= ? AND fecha <= ? AND anulada = 0
               GROUP BY strftime('%Y-%m-%d', fecha)
               ORDER BY fecha ASC"#
        )
        .bind(&desde)
        .bind(&hasta)
        .fetch_all(pool)
        .await?
    };

    // Query 3: Ranking Top 10 productos unitarios más vendidos en el período
    let ranking: Vec<RankingItem> = sqlx::query_as::<_, RankingItem>(
        r#"SELECT vi.nombre as nombre, SUM(vi.cantidad) as cantidad
           FROM venta_items vi
           INNER JOIN ventas v ON v.id = vi.venta_id
           INNER JOIN productos p ON p.id = vi.producto_id
           WHERE v.fecha >= ? AND v.fecha <= ? AND v.anulada = 0 AND p.vende_por_peso = 0
           GROUP BY vi.producto_id
           ORDER BY cantidad DESC
           LIMIT 10"#
    )
    .bind(&desde)
    .bind(&hasta)
    .fetch_all(pool)
    .await?;

    // Query 4: Desglose de ingresos por método de pago
    let metodos_pago: Vec<MetodoPagoItem> = sqlx::query_as::<_, MetodoPagoItem>(
        r#"SELECT metodo_pago, COALESCE(SUM(total), 0) as total
           FROM ventas
           WHERE fecha >= ? AND fecha <= ? AND anulada = 0
           GROUP BY metodo_pago
           ORDER BY total DESC"#
    )
    .bind(&desde)
    .bind(&hasta)
    .fetch_all(pool)
    .await?;

    Ok(InformePayload {
        total_facturado,
        cantidad_ventas,
        promedio_ticket,
        grafico,
        ranking,
        metodos_pago,
    })
}

// =========== REPOSITORIO TURNOS / CIERRE DE CAJA ===========

/// Busca si existe un turno con estado 'abierto'
pub async fn repo_get_turno_abierto(pool: &SqlitePool) -> Result<Option<Turno>, sqlx::Error> {
    let turno = sqlx::query_as::<_, Turno>(
        "SELECT * FROM turnos WHERE estado = 'abierto' LIMIT 1"
    )
    .fetch_optional(pool)
    .await?;
    Ok(turno)
}

/// Abre un nuevo turno de caja
pub async fn repo_abrir_turno(pool: &SqlitePool, fondo_inicial: i64) -> Result<i64, sqlx::Error> {
    let ahora = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let result = sqlx::query(
        "INSERT INTO turnos (fecha_apertura, fondo_inicial, estado) VALUES (?, ?, 'abierto')"
    )
    .bind(&ahora)
    .bind(fondo_inicial)
    .execute(pool)
    .await?;
    Ok(result.last_insert_rowid())
}

/// Registra un movimiento manual de efectivo (ingreso o retiro)
pub async fn repo_registrar_movimiento(
    pool: &SqlitePool,
    turno_id: i64,
    tipo: String,
    monto: i64,
    motivo: String,
) -> Result<i64, sqlx::Error> {
    let ahora = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let result = sqlx::query(
        "INSERT INTO caja_movimientos (turno_id, tipo, monto, motivo, fecha) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(turno_id)
    .bind(&tipo)
    .bind(monto)
    .bind(&motivo)
    .bind(&ahora)
    .execute(pool)
    .await?;
    Ok(result.last_insert_rowid())
}

/// Obtiene los movimientos manuales del turno activo
pub async fn repo_get_movimientos_turno(pool: &SqlitePool, turno_id: i64) -> Result<Vec<CajaMovimiento>, sqlx::Error> {
    let movimientos = sqlx::query_as::<_, CajaMovimiento>(
        "SELECT * FROM caja_movimientos WHERE turno_id = ? ORDER BY fecha ASC"
    )
    .bind(turno_id)
    .fetch_all(pool)
    .await?;
    Ok(movimientos)
}

/// Cierra el turno: calcula el total esperado vs declarado y actualiza la DB
pub async fn repo_cerrar_turno(
    pool: &SqlitePool,
    turno_id: i64,
    total_declarado: i64,
    observaciones: Option<String>,
) -> Result<CierrePayload, sqlx::Error> {
    let mut tx = pool.begin().await?;

    // Leer el turno actual
    let turno: Turno = sqlx::query_as::<_, Turno>("SELECT * FROM turnos WHERE id = ?")
        .bind(turno_id)
        .fetch_one(&mut *tx)
        .await?;

    // Sumar ventas en EFECTIVO de este turno (solo efectivo afecta al arqueo físico)
    let ventas_efectivo_tuple: (i64,) = sqlx::query_as(
        r#"SELECT COALESCE(SUM(total), 0)
           FROM ventas
           WHERE turno_id = ? AND anulada = 0 AND LOWER(metodo_pago) = 'efectivo'"#
    )
    .bind(turno_id)
    .fetch_one(&mut *tx)
    .await?;
    let ventas_efectivo = ventas_efectivo_tuple.0;

    // Sumar ingresos manuales del turno
    let ingresos_tuple: (i64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(monto), 0) FROM caja_movimientos WHERE turno_id = ? AND tipo = 'ingreso'"
    )
    .bind(turno_id)
    .fetch_one(&mut *tx)
    .await?;
    let ingresos_manuales = ingresos_tuple.0;

    // Sumar retiros manuales del turno
    let retiros_tuple: (i64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(monto), 0) FROM caja_movimientos WHERE turno_id = ? AND tipo = 'retiro'"
    )
    .bind(turno_id)
    .fetch_one(&mut *tx)
    .await?;
    let retiros_manuales = retiros_tuple.0;

    // Cálculo del total esperado: fondo + ventas efectivo + ingresos - retiros
    let total_esperado = turno.fondo_inicial + ventas_efectivo + ingresos_manuales - retiros_manuales;
    let diferencia = total_declarado - total_esperado;
    let ahora = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    // Actualizar el turno a cerrado
    sqlx::query(
        r#"UPDATE turnos SET
           fecha_cierre = ?, total_esperado = ?, total_declarado = ?, diferencia = ?, estado = 'cerrado', observaciones = ?
           WHERE id = ?"#
    )
    .bind(&ahora)
    .bind(total_esperado)
    .bind(total_declarado)
    .bind(diferencia)
    .bind(&observaciones)
    .bind(turno_id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    Ok(CierrePayload {
        fondo_inicial: turno.fondo_inicial,
        ventas_efectivo,
        ingresos_manuales,
        retiros_manuales,
        total_esperado,
        total_declarado,
        diferencia,
    })
}

/// Extrae todos los turnos cerrados de un mes específico (YYYY-MM) con sus movimientos.
/// Usa JOIN para evitar el patrón N+1 queries.
pub async fn repo_get_cierres_por_mes(pool: &SqlitePool, mes: String) -> Result<Vec<crate::models::TurnoConDetalles>, sqlx::Error> {
    let wildcard = format!("{}%", mes);
    
    // Query 1: Todos los turnos cerrados del mes
    let turnos = sqlx::query_as::<_, Turno>(
        r#"SELECT * FROM turnos 
           WHERE estado = 'cerrado' AND fecha_cierre LIKE ? 
           ORDER BY fecha_cierre DESC"#
    )
    .bind(&wildcard)
    .fetch_all(pool)
    .await?;

    if turnos.is_empty() {
        return Ok(Vec::new());
    }

    // Query 2: Todos los movimientos de esos turnos en UNA sola consulta (evita N+1)
    let todos_movimientos = sqlx::query_as::<_, CajaMovimiento>(
        r#"SELECT cm.* FROM caja_movimientos cm
           INNER JOIN turnos t ON t.id = cm.turno_id
           WHERE t.estado = 'cerrado' AND t.fecha_cierre LIKE ?
           ORDER BY cm.fecha ASC"#
    )
    .bind(&wildcard)
    .fetch_all(pool)
    .await?;

    // Armar el resultado combinando en memoria
    let resultado = turnos.into_iter().map(|t| {
        let turno_id = t.id.unwrap_or(0);
        let movimientos_del_turno: Vec<CajaMovimiento> = todos_movimientos
            .iter()
            .filter(|m| m.turno_id == turno_id)
            .cloned()
            .collect();

        crate::models::TurnoConDetalles {
            id: turno_id,
            fecha_apertura: t.fecha_apertura,
            fecha_cierre: t.fecha_cierre,
            fondo_inicial: t.fondo_inicial,
            total_esperado: t.total_esperado,
            total_declarado: t.total_declarado,
            diferencia: t.diferencia,
            estado: t.estado,
            observaciones: t.observaciones,
            caja_movimientos: movimientos_del_turno,
        }
    }).collect();

    Ok(resultado)
}

/// Total acumulado de ventas en efectivo + otros medios del turno activo (sin anuladas)
pub async fn repo_get_total_ventas_turno(pool: &SqlitePool, turno_id: i64) -> Result<i64, sqlx::Error> {
    let result: (i64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(total), 0) FROM ventas WHERE turno_id = ? AND anulada = 0"
    )
    .bind(turno_id)
    .fetch_one(pool)
    .await?;
    Ok(result.0)
}
