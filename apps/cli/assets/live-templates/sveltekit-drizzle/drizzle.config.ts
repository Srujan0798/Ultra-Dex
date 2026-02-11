/**
 * @fileoverview Drizzle Config module
 * @module sveltekit-drizzle/drizzle.config
 */

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  driver: 'pg',
};

/**
 * Error handler for drizzle.config
 * @param {Error} error - Error to handle
 */
function handleDrizzleconfigError(error) {
  try {
    console.error('[drizzle.config]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
