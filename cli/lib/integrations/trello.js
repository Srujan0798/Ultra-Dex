// Copyright (c) 2026 Ultra-Dex

import { requireConfig, createSyncResult, normalizeWebhookEvent } from './utils.js';

export async function connect(config = {}) {
  requireConfig(config, ['apiKey', 'token'], 'Trello');
  return { ok: true, connected: true };
}

export async function disconnect() {
  return { ok: true, disconnected: true };
}

export async function sync({ direction = 'both', state = {} } = {}, config = {}) {
  requireConfig(config, ['apiKey', 'token', 'boardId'], 'Trello');
  const pulled = direction === 'push' ? 0 : state.pulled || 0;
  const pushed = direction === 'pull' ? 0 : state.pushed || 0;
  return createSyncResult({ direction, pulled, pushed });
}

export async function handleWebhook(payload, headers = {}) {
  return normalizeWebhookEvent(payload, headers);
}

export const integration = {
  id: 'trello',
  name: 'Trello',
  connect,
  disconnect,
  sync,
  handleWebhook,
};

export default integration;
