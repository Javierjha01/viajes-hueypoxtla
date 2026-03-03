import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    headers: {
      // Necesario para que el popup de Google no falle por COOP (window.closed)
      'Cross-Origin-Opener-Policy': 'unsafe-none',
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Viajes Hueypoxtla',
        short_name: 'Hueypoxtla',
        description: 'Plataforma de servicios tipo Uber - MVP',
        theme_color: '#1a1a1a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/vite.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Límite por defecto 2 MiB; el chunk principal supera eso
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackAllowlist: [/^\/.*/],
        mode: 'development',
      },
      // Desactivado en desarrollo para que el service worker no interfiera con el login (redirect de Google)
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
