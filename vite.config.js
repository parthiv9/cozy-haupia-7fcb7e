import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  /** Load `.env` from project root (same folder as this file). */
  envDir: '.',
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
