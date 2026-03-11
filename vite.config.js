import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    // 允许访问上层目录的静态资源
    fs: {
      allow: ['..', '../../..']
    }
  },
  build: {
    outDir: 'dist'
  }
})
