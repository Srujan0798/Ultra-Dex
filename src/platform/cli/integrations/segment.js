// Copyright (c) 2026 Ultra-Dex

import { requireConfig, retryWithBackoff, normalizeWebhookEvent } from './utils.js';

const SEGMENT_API = 'https://api.segment.io/v1';

function authHeader(writeKey) {
  const token = Buffer.from(`${writeKey}:`).toString('base64');
  return `Basic ${token}`;
}

async function segmentRequest(path, writeKey, payload) {
  return retryWithBackoff(async () => {
    const response = await fetch(`${SEGMENT_API}${path}`, {
      method: 'POST',
      headers: {
        Authorization: authHeader(writeKey),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || response.statusText);
    }
    return data;
  });
}

export async function connect(config = {}) {
  requireConfig(config, ['writeKey'], 'Segment');
  return { ok: true, connected: true };
}

export async function disconnect() {
  return { ok: true, disconnected: true };
}

export async function track(config = {}, payload) {
  requireConfig(config, ['writeKey'], 'Segment');
  return segmentRequest('/track', config.writeKey, payload);
}

export async function identify(config = {}, payload) {
  requireConfig(config, ['writeKey'], 'Segment');
  return segmentRequest('/identify', config.writeKey, payload);
}

export async function group(config = {}, payload) {
  requireConfig(config, ['writeKey'], 'Segment');
  return segmentRequest('/group', config.writeKey, payload);
}

export async function sync({ direction = 'both', state = {} } = {}, config = {}) {
  requireConfig(config, ['writeKey'], 'Segment');
  const pulled = direction === 'push' ? 0 : state.pulled || 0;
  const pushed = direction === 'pull' ? 0 : state.pushed || 0;
  return { ok: true, direction, pulled, pushed, timestamp: new Date().toISOString() };
}

export async function handleWebhook(payload, headers = {}) {
  return normalizeWebhookEvent(payload, headers);
}

export const integration = {
  id: 'segment',
  name: 'Segment',
  connect,
  disconnect,
  sync,
  track,
  identify,
  group,
  handleWebhook,
};

export default integration;

/**
 * Safe execution wrapper with error handling for segment
 * @param {Function} fn - Async function to execute
 * @param {string} [context='segment'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'segment') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
