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

export async function retryWithBackoff(fn, retries = 3, baseDelayMs = 500) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= retries) break;
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
