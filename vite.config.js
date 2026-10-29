import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [nodePolyfills({ include: ["buffer", "crypto", "stream", "util", "path"], globals: { Buffer: true, process: true, global: true } })],
  build: {
    target: "es2022",
    // abaplint usa los nombres de las clases (constructor.name): no se deben renombrar
    minify: false,
    chunkSizeWarningLimit: 6000,
  },
  optimizeDeps: {
    esbuildOptions: { target: "es2022" },
  },
  worker: { format: "es" },
});
