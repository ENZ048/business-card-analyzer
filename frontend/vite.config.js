import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Base path for WordPress integration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      external: ['@capacitor/filesystem', '@capacitor/share']
    }
  },
  server: {
    host: true,
    port: 5173
  }
})