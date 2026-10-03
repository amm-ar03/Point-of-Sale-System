import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
  server: {
    // Forward /api calls to Spring Boot so the browser sees one origin (no CORS, no hardcoded ports)
    proxy: { "/api": "http://localhost:8080" },
  },
})
