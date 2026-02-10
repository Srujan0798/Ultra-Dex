/**
 * @fileoverview Vite Config module
 * @module dashboard/vite.config
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4173,
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
