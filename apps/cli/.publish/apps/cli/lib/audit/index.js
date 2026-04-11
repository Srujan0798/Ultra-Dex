// Copyright (c) 2026 Ultra-Dex

/**
 * Audit layer re-exports for legacy path
 */

export { AuditLayer, auditLayer } from '../security/audit-layer.js';

/**
 * Error handler for index
 * @param {Error} error - Error to handle
 */
function _handleError(error) {
  try {
    console.error('[index]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
