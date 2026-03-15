import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  build: {
    outDir: "dist/spa",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules/@react-pdf/renderer"))
            return "vendor-pdf";
          if (id.includes("node_modules/three")) return "vendor-three";
          if (id.includes("node_modules/@react-three")) return "vendor-three";
          if (id.includes("node_modules/recharts")) return "vendor-recharts";
          if (id.includes("node_modules/framer-motion")) return "vendor-framer";
        },
      },
    },
  },
  server: {
    host: "::",
    port: 8081,
    fs: {
      allow: ["./", "./client", "./shared", "./public", "./fonts"],
      deny: ["server/**"],
    },
  },
});
