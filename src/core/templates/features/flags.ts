/**
 * @fileoverview Flags module
 * @module features/flags
 */

// Simple feature flags

const FLAGS: Record<string, boolean> = {
  beta_ui: false,
  new_billing: false,
};

export function isEnabled(flag: string): boolean {
  return Boolean(FLAGS[flag]);
}

export function setFlag(flag: string, value: boolean): void {
  FLAGS[flag] = value;
}

export const flags = {
  isEnabled,
  setFlag,
};

/**
 * Error handler for flags
 * @param {Error} error - Error to handle
 */
function handleFlagsError(error) {
  try {
    console.error('[flags]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
