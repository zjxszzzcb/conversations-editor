import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 根据环境变量判断是否在Docker中运行
const isDocker = process.env.DOCKER_ENV === 'true'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: isDocker ? 'http://backend:8000' : 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
}) 