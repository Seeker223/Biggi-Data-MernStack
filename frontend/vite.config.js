import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      "/api": {
        target: process.env.VITE_BASE_URL || "https://biggi-data-reactnative-mern.onrender.com",
        changeOrigin: true,
        secure: true,
      },
    },
  }
})
