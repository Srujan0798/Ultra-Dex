// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Supabase module
 * @module integrations/supabase
 */

import { requireConfig, retryWithBackoff, normalizeWebhookEvent } from './utils.js';

async function restRequest(url, method, apiKey, body) {
  return retryWithBackoff(async () => {
    const response = await fetch(url, {
      method,
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || response.statusText);
    }
    return payload;
  });
}

async function managementRequest(path, accessToken) {
  return retryWithBackoff(async () => {
    const response = await fetch(`https://api.supabase.com${path}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message || response.statusText);
    }
    return payload;
  });
}

export async function connect(config = {}) {
  requireConfig(config, ['url', 'serviceRoleKey'], 'Supabase');
  const health = await fetch(`${config.url}/auth/v1/health`, {
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
    },
  });
  if (!health.ok) {
    throw new Error(`Supabase health check failed: ${health.status} ${health.statusText}`);
  }
  return { ok: true, connected: true, url: config.url };
}

export async function disconnect() {
  return { ok: true, disconnected: true };
}

export async function listProjects(config = {}) {
  requireConfig(config, ['accessToken'], 'Supabase');
  return managementRequest('/v1/projects', config.accessToken);
}

export async function listRows(config = {}, table, limit = 50) {
  requireConfig(config, ['url', 'serviceRoleKey'], 'Supabase');
  const url = `${config.url}/rest/v1/${table}?select=*&limit=${limit}`;
  return restRequest(url, 'GET', config.serviceRoleKey);
}

export async function insertRow(config = {}, table, data) {
  requireConfig(config, ['url', 'serviceRoleKey'], 'Supabase');
  const url = `${config.url}/rest/v1/${table}`;
  return restRequest(url, 'POST', config.serviceRoleKey, data);
}

export async function sync({ direction = 'both', state = {} } = {}, config = {}) {
  requireConfig(config, ['url', 'serviceRoleKey'], 'Supabase');
  const pulled = direction === 'push' ? 0 : state.pulled || 0;
  const pushed = direction === 'pull' ? 0 : state.pushed || 0;
  return { ok: true, direction, pulled, pushed, timestamp: new Date().toISOString() };
}

export async function handleWebhook(payload, headers = {}) {
  return normalizeWebhookEvent(payload, headers);
}

export const integration = {
  id: 'supabase',
  name: 'Supabase',
  connect,
  disconnect,
  sync,
  listProjects,
  listRows,
  insertRow,
  handleWebhook,
};

export default integration;
