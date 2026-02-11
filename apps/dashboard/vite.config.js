import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});

/**
 * Error handler for vite.config
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[vite.config]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
