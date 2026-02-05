import { requireConfig, createSyncResult, normalizeWebhookEvent } from './utils.js';

export async function connect(config = {}) {
  requireConfig(config, ['baseUrl', 'apiToken', 'email'], 'Jira');
  return {
    ok: true,
    connected: true,
    account: config.email,
    baseUrl: config.baseUrl
  };
}

export async function disconnect() {
  return { ok: true, disconnected: true };
}

export async function sync({ direction = 'both', state = {} } = {}, config = {}) {
  requireConfig(config, ['baseUrl', 'apiToken'], 'Jira');
  const pulled = direction === 'push' ? 0 : state.pulled || 0;
  const pushed = direction === 'pull' ? 0 : state.pushed || 0;
  return createSyncResult({ direction, pulled, pushed });
}

export async function handleWebhook(payload, headers = {}) {
  return normalizeWebhookEvent(payload, headers);
}

export const integration = {
  id: 'jira',
  name: 'Jira',
  connect,
  disconnect,
  sync,
  handleWebhook
};

export default integration;
