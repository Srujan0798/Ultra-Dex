/**
 * @fileoverview Index module
 * @module viz/index
 */

export default {
  async activate(manager) {
    console.log('📈 Visual dashboard components registered.');
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
