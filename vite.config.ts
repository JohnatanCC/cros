import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base relativa: o build funciona servido de qualquer pasta (GitHub Pages incluído)
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 1200 }, // o three.js sozinho passa de 900 kB
})
