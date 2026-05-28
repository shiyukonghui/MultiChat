import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 配置：React 插件 + API 代理
export default defineConfig({
  plugins: [react()],
  server: {
    // 将 /api 请求代理到 Rust 后端服务
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
})
