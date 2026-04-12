import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],

  // Opciones de Vite adaptadas para el desarrollo con Tauri
  // Solo se aplican en `tauri dev` o `tauri build`
  //
  // 1. Evita que Vite oculte errores de Rust
  clearScreen: false,
  // 2. Tauri espera un puerto fijo, falla si no está disponible
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. Ignorar la carpeta src-tauri
      ignored: ["**/src-tauri/**"],
    },
  },
}));
