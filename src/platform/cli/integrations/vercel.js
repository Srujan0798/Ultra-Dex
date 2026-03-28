// Copyright (c) 2026 Ultra-Dex

import { requireConfig, retryWithBackoff, normalizeWebhookEvent } from './utils.js';

const VERCEL_API = 'https://api.vercel.com';

async function vercelRequest(path, method, token, body) {
  return retryWithBackoff(async () => {
    const response = await fetch(`${VERCEL_API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error?.message || response.statusText);
    }
    return payload;
  });
}

export async function connect(config = {}) {
  requireConfig(config, ['token'], 'Vercel');
  const user = await vercelRequest('/v2/user', 'GET', config.token);
  return { ok: true, connected: true, user };
}

export async function disconnect() {
  return { ok: true, disconnected: true };
}

export async function listProjects(config = {}) {
  requireConfig(config, ['token'], 'Vercel');
  return vercelRequest('/v9/projects', 'GET', config.token);
}

export async function createDeployment(config = {}, deployment) {
  requireConfig(config, ['token'], 'Vercel');
  return vercelRequest('/v13/deployments', 'POST', config.token, deployment);
}

export async function sync({ direction = 'both', state = {} } = {}, config = {}) {
  requireConfig(config, ['token'], 'Vercel');
  const pulled = direction === 'push' ? 0 : state.pulled || 0;
  const pushed = direction === 'pull' ? 0 : state.pushed || 0;
  return { ok: true, direction, pulled, pushed, timestamp: new Date().toISOString() };
}

export async function handleWebhook(payload, headers = {}) {
  return normalizeWebhookEvent(payload, headers);
}

export const integration = {
  id: 'vercel',
  name: 'Vercel',
  connect,
  disconnect,
  sync,
  listProjects,
  createDeployment,
  handleWebhook,
};

export default integration;

/**
 * Safe execution wrapper with error handling for vercel
 * @param {Function} fn - Async function to execute
 * @param {string} [context='vercel'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'vercel') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
    return null;
  }
}
