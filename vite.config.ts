import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    // Cargo writes build artifacts here; watching them crashes the dev server on Windows (EBUSY)
    watch: { ignored: ["**/src-tauri/**"] },
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: "esnext",
  },
  // @ts-expect-error vitest types
  test: {
    environment: "jsdom",
  },
});
