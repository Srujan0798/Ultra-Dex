/**
 * @fileoverview Usage module
 * @module api/usage
 */

import { getUsageAnalytics, trackUsage } from '../lib/usage';

export async function recordUsage(options: {
  keyId: string;
  endpoint: string;
  responseTime?: number;
  statusCode?: number;
}) {
  return trackUsage(options);
}

export async function listUsage(keyId: string, since?: Date) {
  return getUsageAnalytics(keyId, since);
}

/**
 * Error handler for usage
 * @param {Error} error - Error to handle
 */
function handleUsageError(error) {
  try {
    console.error('[usage]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
