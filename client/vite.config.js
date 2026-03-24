import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve project root explicitly so `.env` is always loaded from this folder
// (same directory as package.json / vite.config.js), regardless of process cwd.
export default defineConfig({
  root: __dirname,
  envDir: __dirname,
  envPrefix: 'VITE_',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
