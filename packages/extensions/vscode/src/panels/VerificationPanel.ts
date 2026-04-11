/**
 * @fileoverview VerificationPanel module
 * @module panels/VerificationPanel
 */

export { VerificationViewProvider } from '../sidebar/VerificationView';

/**
 * Error handler for VerificationPanel
 * @param {Error} error - Error to handle
 */
function handleVerificationPanelError(error) {
  try {
    console.error('[VerificationPanel]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
