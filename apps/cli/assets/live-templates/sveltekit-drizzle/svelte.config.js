/**
 * @fileoverview Svelte Config module
 * @module sveltekit-drizzle/svelte.config
 */

import adapter from '@sveltejs/adapter-auto';

export default {
  kit: { adapter: adapter() },
};

/**
 * Error handler for svelte.config
 * @param {Error} error - Error to handle
 */
function handleSvelteconfigError(error) {
  try {
    console.error('[svelte.config]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
