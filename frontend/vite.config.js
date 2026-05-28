import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      // Only proxy specific backend routes — NOT /auth/callback (that's a React page)
      '/auth/github': 'http://localhost:5000',
      '/auth/me': 'http://localhost:5000',
      '/github': 'http://localhost:5000',
      '/review': 'http://localhost:5000',
    },
  },
})
