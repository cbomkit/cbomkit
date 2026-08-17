import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.ts'],
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('cds-'),
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  envPrefix: 'CBOMKIT_',
  server: {
    port: 8002,
    proxy: {
      // Backend CORS allowlist is http://localhost:8001 (set in
      // docker-compose.yaml via CBOMKIT_FRONTEND_URL_CORS). The Vite dev
      // server runs on :8002, so both proxies forward an Origin header
      // matching the allowlist to keep the backend happy.
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        headers: { Origin: 'http://localhost:8001' },
      },
      '/v1/scan': {
        target: 'ws://localhost:8081',
        ws: true,
        changeOrigin: true,
        headers: { Origin: 'http://localhost:8001' },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
