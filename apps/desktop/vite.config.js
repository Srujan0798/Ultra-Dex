/**
 * @fileoverview Vite Config module
 * @module desktop/vite.config
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      overlay: false,
    },
  },
});

/**
 * Error handler for vite.config
 * @param {Error} error - Error to handle
 */
function handleViteconfigError(error) {
  try {
    console.error('[vite.config]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
