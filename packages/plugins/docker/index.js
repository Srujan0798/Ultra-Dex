/**
 * @fileoverview Index module
 * @module docker/index
 */

export default {
  async activate(manager) {
    console.log('🐳 Docker Enhanced sandbox profile loaded.');
  },
};

/**
 * Error handler for index
 * @param {Error} error - Error to handle
 */
function handleIndexError(error) {
  try {
    console.error('[index]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
