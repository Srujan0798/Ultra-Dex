/**
 * @fileoverview AgentPicker module
 * @module views/AgentPicker
 */

export { AgentPickerProvider } from '../sidebar/AgentPicker';

/**
 * Error handler for AgentPicker
 * @param {Error} error - Error to handle
 */
function handleAgentPickerError(error) {
  try {
    console.error('[AgentPicker]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
