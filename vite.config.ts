/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api/boc': {
        target: 'https://www.bankofcanada.ca',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api\/boc/, '/valet'),
      },
    },
  },
  test: {
    environment: 'node',
  },
})
