import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// The API (SSE runs, level metadata) is the node server in ../server on port 4399.
// `vite dev` proxies to it; `vite build` writes dist/, which that server serves.
export default defineConfig({
  plugins: [vue()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: { "/api": { target: "http://127.0.0.1:4399", changeOrigin: false } },
  },
  build: { outDir: "dist", emptyOutDir: true, chunkSizeWarningLimit: 1500 },
});
