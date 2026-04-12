# NexPOS — Sistema de Punto de Venta Base

![Status](https://img.shields.io/badge/Status-Desarrollo_Activo-orange?style=for-the-badge)
![Tech](https://img.shields.io/badge/Stack-Rust_%7C_React_%7C_SQLite-blue?style=for-the-badge)

Este proyecto es un sistema **POS (Point of Sale)** de alto rendimiento construido con **Tauri**. Ha sido diseñado no solo como un producto final, sino como un **núcleo o "cascarón" profesional** altamente extensible.

## 🚀 Filosofía del Proyecto

La arquitectura de este sistema está pensada para la **escalabilidad personalizada**. Funciona como un template base robusto sobre el cual se pueden derivar versiones específicas para diferentes clientes, permitiendo:

*   **Actualizaciones Modulares**: Implementación de nuevas funcionalidades (usuarios, gestión de proveedores, etc.) como capas adicionales.
*   **Identidad Visual Única**: Estilos y componentes adaptables según el branding de cada cliente.
*   **Núcleo Estable**: Una lógica de negocio sólida en Rust que garantiza el rendimiento sin importar las personalizaciones del frontend.

---

## 🛠 Stack Tecnológico

*   **Core**: [Tauri](https://tauri.app/) (Seguridad y ligereza).
*   **Backend**: [Rust](https://www.rust-lang.org/) con [SQLx](https://github.com/launchbadge/sqlx) (Consultas asíncronas de alto rendimiento).
*   **Base de Datos**: [SQLite](https://www.sqlite.org/) con modo **WAL (Write-Ahead Logging)** activado para transacciones atómicas ultra rápidas.
*   **Frontend**: React + Vite.
*   **Estética**: CSS Vanilla con diseño **Industrial Geométrico** (bordes rectos, minimalismo, alta legibilidad).
*   **Gráficos**: [Recharts](https://recharts.org/).
*   **Feedback**: [Sonner](https://sonner.stevenly.me/) (Notificaciones pasivas) y Componentes de Interrupción Propios.

---

## 📦 Módulos Principales

### 🛒 Caja (Punto de Venta)
*   **Entrada de Pesaje en Gramos (g)**: Optimización UX que permite al cajero ingresar pesos sin usar comas (ej. `200` en lugar de `0.200`), convirtiendo automáticamente a Kilogramos para el cálculo de precio y stock.
*   **Atajos de Teclado**: Operatividad completa mediante teclado (F1, F2, etc.) para máxima velocidad en mostrador.
*   **Validación de Stock en Tiempo Real**: Bloqueo inteligente de ventas si el inventario es insuficiente.

### 📊 Informes y Auditoría
*   **Dashboard Financiero**: KPIs clave (Ticket promedio, Total facturado, Ranking de productos).
*   **Gráficos Dinámicos**: Visualización de ventas diarias y tendencias.
*   **Auditoría de Cierres**: Historial completo de turnos por mes con desglose de diferencias (faltantes/sobrantes).

### 🔐 Cierre de Caja (Arqueo)
*   **Flujo de 3 Fases**: Apertura (Fondo inicial) → Operación (Ingresos/Retiros manuales) → Cierre (Declaración de efectivo).
*   **Bloqueo de Operativa**: Una vez iniciado el arqueo, el sistema se bloquea para garantizar la integridad del cierre.

### 📂 Inventario y ABM
*   **Gestión Híbrida**: Soporte para productos unitarios y pesables (balanza).
*   **Control de Stock Opcional**: Configurable por producto.
*   **Borrado Lógico**: Desactivación de productos para mantener integridad en el historial de ventas.

---

## 🧪 Herramientas de Desarrollo

### Database Seeder (Stress Test)
Ubicado en `scripts/seeder/`, este script independiente de Node.js permite poblar la base de datos con **365 días de actividad comercial realista** (~15,000 ventas).
*   Simula aperturas, ventas aleatorias, movimientos de caja y cierres de turno.
*   Garantiza coherencia relacional y stock siempre positivo.
*   Ideal para probar el rendimiento de los informes con volúmenes masivos de datos.

---

## 🛡 Validaciones y Seguridad
*   **Control de Longitud**: Todos los campos de texto tienen límites físicos para evitar saturación de la base de datos.
*   **UI CharacterCount**: Los campos de texto largos integran un contador visual dinámico (Gris/Naranja/Rojo).
*   **Formatos Monetarios**: Validación estricta a 2 decimales en todos los ingresos de dinero.

---

## 🛠 Instalación y Desarrollo

### Requisitos Previos
Para compilar este proyecto desde cero, necesitará tener instalado:
1.  **Node.js** (v18 o superior).
2.  **Rust** (v1.70 o superior) vía [rustup](https://rustup.rs/).
3.  **C++ Build Tools**: En Windows se requiere la carga de trabajo "Desarrollo para el escritorio con C++" de Visual Studio Build Tools.

### Pasos para Desarrollar
1.  **Instalar dependencias**: `npm install`
2.  **Correr en modo desarrollo**: `npm run tauri dev`
3.  **Generar datos de prueba**:
    ```bash
    cd scripts/seeder
    npm install
    node seed.js
    ```

### Cómo Compilar el Instalador (.msi)
Para generar el ejecutable de producción optimizado, ejecute:
```bash
npm run tauri build
```
El instalador generado se ubicará automáticamente en:
`src-tauri/target/release/bundle/msi/`

---

> [!TIP]
> **Personalización para Clientes**: NexPOS está diseñado para ser un "cascarón". Para crear una versión personalizada, se recomienda extender los componentes en `src/components/ui` y añadir los comandos de Rust necesarios en `src-tauri/src/commands.rs`.

