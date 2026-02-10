/**
 * @fileoverview Vite Config module
 * @module web/vite.config
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
