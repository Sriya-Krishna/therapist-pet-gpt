/**
 * Vite config — proxies /api requests to the FastAPI backend during development.
 * Run the backend with: cd backend && uvicorn main:app --reload --port 8000
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})