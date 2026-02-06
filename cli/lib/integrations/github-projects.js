// Copyright (c) 2026 Ultra-Dex

import { requireConfig, createSyncResult, normalizeWebhookEvent } from './utils.js';

export async function connect(config = {}) {
  requireConfig(config, ['token'], 'GitHub Projects');
  return { ok: true, connected: true, owner: config.owner || null };
}

export async function disconnect() {
  return { ok: true, disconnected: true };
}

export async function sync({ direction = 'both', state = {} } = {}, config = {}) {
  requireConfig(config, ['token'], 'GitHub Projects');
  const pulled = direction === 'push' ? 0 : state.pulled || 0;
  const pushed = direction === 'pull' ? 0 : state.pushed || 0;
  return createSyncResult({ direction, pulled, pushed });
}

export async function handleWebhook(payload, headers = {}) {
  return normalizeWebhookEvent(payload, headers);
}

export const integration = {
  id: 'github-projects',
  name: 'GitHub Projects',
  connect,
  disconnect,
  sync,
  handleWebhook,
};

export default integration;
