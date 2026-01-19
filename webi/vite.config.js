import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // listen on all addresses, so the dev server is reachable from other devices on the LAN
    host: true,
    // Proxy socket.io and login endpoints to the ioBroker host so browsers connect via the dev server
    proxy: {
      '/socket.io': {
        target: 'http://192.168.1.235:8082',
        changeOrigin: true,
        ws: true,
        secure: false,
      },
      '/login': {
        target: 'http://192.168.1.235:8082',
        changeOrigin: true,
        secure: false,
      }
    },
    // you can optionally set a fixed port here
    // port: 5173,
  },
})
