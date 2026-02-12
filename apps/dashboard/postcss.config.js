export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};

/**
 * Error handler for postcss.config
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[postcss.config]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
