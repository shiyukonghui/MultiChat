import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Vitest 测试配置
export default defineConfig({
  plugins: [react()],
  test: {
    // 使用 jsdom 模拟浏览器环境
    environment: 'jsdom',
    // 全局测试设置文件
    setupFiles: ['./src/__tests__/setup.ts'],
    // 测试文件匹配模式
    include: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
    // 排除 node_modules 和 dist
    exclude: ['node_modules', 'dist'],
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // 覆盖率目标
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
      // 排除测试文件本身
      exclude: [
        'node_modules/**',
        'src/__tests__/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
      ],
    },
    // 全局变量（describe, it, expect 等）
    globals: true,
  },
})
