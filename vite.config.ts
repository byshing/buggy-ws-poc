import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/buggy-ws-poc/',
  server: {
    port: 3000,
    open: true
  },
  define: {
    global: 'globalThis',
  }
})
