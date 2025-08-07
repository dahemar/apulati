import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === 'true' ? '/apulati/' : './', // Usar ruta relativa para desarrollo
  server: {
    // Configuración para archivos grandes
    fs: {
      allow: ['..']
    },
    // Headers para optimizar la carga
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  build: {
    // Optimizaciones para archivos grandes
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom']
        }
      }
    },
    // Configuración para archivos multimedia
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1000
  },
  // Configuración para archivos estáticos
  publicDir: 'public',
  // Optimización de assets
  assetsInclude: ['**/*.gif', '**/*.wav', '**/*.mp4']
})
