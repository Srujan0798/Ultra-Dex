/**
 * @fileoverview Vite Config module
 * @module sveltekit-drizzle/vite.config
 */

import { sveltekit } from '@sveltejs/kit/vite';

export default {
  plugins: [sveltekit()],
};

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
