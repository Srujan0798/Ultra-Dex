// Copyright (c) 2026 Ultra-Dex

/**
 * Shared integration helpers
 */

export function requireConfig(config, requiredKeys = [], integrationName = 'integration') {
  const missing = requiredKeys.filter(
    (key) => !config || config[key] === undefined || config[key] === ''
  );
  if (missing.length > 0) {
    throw new Error(`[${integrationName}] Missing config: ${missing.join(', ')}`);
  }
}

export function createSyncResult({ direction = 'both', pulled = 0, pushed = 0, errors = [] } = {}) {
  return {
    ok: errors.length === 0,
    direction,
    pulled,
    pushed,
    errors,
    timestamp: new Date().toISOString(),
  };
}

export function normalizeWebhookEvent(payload, headers = {}) {
  return {
    receivedAt: new Date().toISOString(),
    headers,
    payload,
  };
}
