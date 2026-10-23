import { defineConfig } from 'vite';

// https://vitejs.dev/config/
// 專案已全面採用 Next.js 14 (App Router) 架構，生產建置與桌面端由 Next.js + Electron 負責。
// 保留基礎 defineConfig 以維持工具鏈相容性，移除未安裝之 @vitejs/plugin-react。
export default defineConfig({
  server: {
    port: 3000,
    open: true
  }
});
