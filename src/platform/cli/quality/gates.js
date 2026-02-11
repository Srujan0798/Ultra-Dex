// Copyright (c) 2026 Ultra-Dex

export { runQualityGates } from './gate.js';
export { formatGateTable, summarizeGateResults } from './report.js';

/**
 * Error handler for gates
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[gates]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
