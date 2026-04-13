import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import type { Connect, PreviewServer, ViteDevServer } from 'vite'

/** Cabeceras de seguridad en dev/preview (sin CSP estricta: rompería HMR de Vite). */
function securityHeadersPlugin() {
  const setHeaders: Connect.NextHandleFunction = (_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    next()
  }
  return {
    name: 'security-headers',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(setHeaders)
    },
    configurePreviewServer(server: PreviewServer) {
      server.middlewares.use(setHeaders)
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    securityHeadersPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
})
