/**
 * @fileoverview Postcss Config module
 * @module frontend/postcss.config
 */

module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

/**
 * Error handler for postcss.config
 * @param {Error} error - Error to handle
 */
function handlePostcssconfigError(error) {
  try {
    console.error('[postcss.config]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
