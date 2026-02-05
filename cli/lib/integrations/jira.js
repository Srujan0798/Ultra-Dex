import fs from 'fs/promises';
import path from 'path';
import { requireConfig, createSyncResult, normalizeWebhookEvent } from './utils.js';

async function parsePlanForJira(planPath) {
  const content = await fs.readFile(planPath, 'utf8');
  const lines = content.split('\n');
  const epics = [];
  const stories = [];
  let currentEpic = null;

  for (const line of lines) {
    const sectionMatch = line.match(/^##\s+(?:SECTION\s+)?(\d+)[:.]?\s*(.*)/i);
    if (sectionMatch) {
      currentEpic = {
        key: `P${sectionMatch[1]}`,
        title: sectionMatch[2] || `Section ${sectionMatch[1]}`
      };
      epics.push(currentEpic);
      continue;
    }

    const taskMatch = line.match(/^\s*-\s+\[([ x])\]\s+(.*)$/);
    if (taskMatch) {
      stories.push({
        title: taskMatch[2],
        epic: currentEpic?.title || 'General',
        status: taskMatch[1] === 'x' ? 'done' : 'todo'
      });
    }
  }

  return { epics, stories };
}

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

export async function syncPlan({ projectKey, planPath = 'IMPLEMENTATION-PLAN.md' } = {}, config = {}) {
  requireConfig(config, ['baseUrl', 'apiToken'], 'Jira');
  const resolvedPlan = path.resolve(process.cwd(), planPath);
  const { epics, stories } = await parsePlanForJira(resolvedPlan);
  return {
    ok: true,
    projectKey,
    epics,
    stories,
    summary: { epics: epics.length, stories: stories.length }
  };
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
  syncPlan,
  handleWebhook
};

export default integration;
