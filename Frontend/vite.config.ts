import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [react(), VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false
      },
      manifest: {
        name: 'Rexi Clinic',
        short_name: 'Rexi',
        description: 'Hệ thống Quản lý Phòng Khám Thú Y Rexi',
        theme_color: '#0f766e',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/logo-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }),],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@layouts": path.resolve(__dirname, "./src/layouts"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@styles": path.resolve(__dirname, "./src/styles"),
      "@contexts": path.resolve(__dirname, "./src/contexts"),
      "@services": path.resolve(__dirname, "./src/services"),
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "react-router-dom": path.resolve(__dirname, "./node_modules/react-router-dom"),
    },
  },
  cacheDir: 'node_modules/.vite_new',
  server: {
    port: 3005,
    strictPort: true,
    host: true,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    }
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    // Dùng esbuild (mặc định Vite) – nhanh hơn terser, đủ tốt cho production
    minify: 'esbuild',
    // Target ES2020: bỏ polyfill thừa, giảm output size
    target: 'es2020',
    // Nén CSS cùng với JS
    cssMinify: true,
    // Hạ từ 800 → 500 để phát hiện chunk nặng sớm hơn
    chunkSizeWarningLimit: 500
  },
});

