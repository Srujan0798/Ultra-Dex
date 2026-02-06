// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';
import { requireConfig, createSyncResult, normalizeWebhookEvent } from './utils.js';

async function loadPlan(planPath) {
  const resolved = path.resolve(process.cwd(), planPath);
  return fs.readFile(resolved, 'utf8');
}

export async function connect(config = {}) {
  requireConfig(config, ['apiToken', 'databaseId'], 'Notion');
  return { ok: true, connected: true, databaseId: config.databaseId };
}

export async function disconnect() {
  return { ok: true, disconnected: true };
}

export async function sync({ direction = 'both', state = {} } = {}, config = {}) {
  requireConfig(config, ['apiToken', 'databaseId'], 'Notion');
  const pulled = direction === 'push' ? 0 : state.pulled || 0;
  const pushed = direction === 'pull' ? 0 : state.pushed || 0;
  return createSyncResult({ direction, pulled, pushed });
}

export async function exportPlan({ planPath = 'IMPLEMENTATION-PLAN.md' } = {}, config = {}) {
  requireConfig(config, ['apiToken', 'databaseId'], 'Notion');
  const content = await loadPlan(planPath);
  return {
    ok: true,
    databaseId: config.databaseId,
    content,
  };
}

export async function importPlan(
  { outputPath = 'IMPLEMENTATION-PLAN.md', content } = {},
  config = {}
) {
  requireConfig(config, ['apiToken', 'databaseId'], 'Notion');
  const resolved = path.resolve(process.cwd(), outputPath);
  await fs.writeFile(resolved, content || '# Imported from Notion\n');
  return { ok: true, path: resolved };
}

export async function handleWebhook(payload, headers = {}) {
  return normalizeWebhookEvent(payload, headers);
}

export const integration = {
  id: 'notion',
  name: 'Notion',
  connect,
  disconnect,
  sync,
  exportPlan,
  importPlan,
  handleWebhook,
};

export default integration;
