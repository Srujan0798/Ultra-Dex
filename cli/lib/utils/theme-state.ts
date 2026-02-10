/**
 * Theme state management for Ultra-Dex CLI
 * Controls doomsday/terminal theme mode
 */

let isDoomsday: boolean = false;

/**
 * Enable or disable doomsday mode
 * @param enabled - Whether to enable doomsday theme
 */
export function setDoomsdayMode(enabled: boolean): void {
  isDoomsday = enabled;
}

/**
 * Check if doomsday mode is currently enabled
 * @returns true if doomsday mode is active
 */
export function isDoomsdayMode(): boolean {
  return isDoomsday;
}

/**
 * Handle errors in theme-state module
 * @param {Error} error - The error to handle
 * @param {string} [context='theme-state'] - Error context
 */
function handleModuleError(error, context = 'theme-state') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
