/**
 * Analytics subsystem
 * Tracks command usage, agent performance, tokens, errors, and team activity.
 */

import path from 'path';
import fs from 'fs/promises';
import { appendJsonl, readJsonl } from './storage.js';
import { getUsageSummary, loadUsageEvents } from '../enterprise/usage.js';

const ANALYTICS_DIR = path.resolve(process.cwd(), '.ultra-dex', 'analytics');
const AGENT_LOG = path.join(ANALYTICS_DIR, 'agents.jsonl');
const TOKEN_LOG = path.join(ANALYTICS_DIR, 'tokens.jsonl');
const ERROR_LOG = path.join(ANALYTICS_DIR, 'errors.jsonl');
const TEAM_ACTIVITY_LOG = path.resolve(process.cwd(), '.ultra-dex', 'team', 'activity.log');

export async function recordAgentPerformance({ agent, durationMs, success = true, task, provider } = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    agent,
    durationMs,
    success,
    task,
    provider
  };
  await appendJsonl(AGENT_LOG, payload);
  return payload;
}

export async function recordTokenUsage({ agent, model, inputTokens = 0, outputTokens = 0, totalTokens, cost } = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    agent,
    model,
    inputTokens,
    outputTokens,
    totalTokens: totalTokens ?? inputTokens + outputTokens,
    cost: cost ?? null
  };
  await appendJsonl(TOKEN_LOG, payload);
  return payload;
}

export async function recordError({ message, command, stack, metadata } = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    message,
    command,
    stack,
    metadata
  };
  await appendJsonl(ERROR_LOG, payload);
  return payload;
}

export async function getUsageStats({ windowDays = 7 } = {}) {
  return getUsageSummary({ windowDays });
}

export async function getAgentMetrics({ since } = {}) {
  const events = await readJsonl(AGENT_LOG, { since });
  if (!events.length) return { totalRuns: 0, successRate: 0, avgDurationMs: 0, byAgent: {} };

  const byAgent = {};
  let totalDuration = 0;
  let successCount = 0;

  for (const event of events) {
    const name = event.agent || 'unknown';
    byAgent[name] = byAgent[name] || { runs: 0, success: 0, avgDurationMs: 0, durations: [] };
    byAgent[name].runs += 1;
    if (event.success) byAgent[name].success += 1;
    if (typeof event.durationMs === 'number') {
      byAgent[name].durations.push(event.durationMs);
      totalDuration += event.durationMs;
    }
    if (event.success) successCount += 1;
  }

  Object.values(byAgent).forEach(agent => {
    if (agent.durations.length) {
      agent.avgDurationMs = Math.round(agent.durations.reduce((a, b) => a + b, 0) / agent.durations.length);
    }
    delete agent.durations;
  });

  return {
    totalRuns: events.length,
    successRate: events.length ? Math.round((successCount / events.length) * 100) : 0,
    avgDurationMs: events.length ? Math.round(totalDuration / events.length) : 0,
    byAgent
  };
}

export async function getTokenMetrics({ since } = {}) {
  const events = await readJsonl(TOKEN_LOG, { since });
  const totals = { inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: 0 };
  const byModel = {};

  for (const event of events) {
    totals.inputTokens += event.inputTokens || 0;
    totals.outputTokens += event.outputTokens || 0;
    totals.totalTokens += event.totalTokens || 0;
    totals.cost += event.cost || 0;

    const model = event.model || 'unknown';
    byModel[model] = byModel[model] || { tokens: 0, cost: 0 };
    byModel[model].tokens += event.totalTokens || 0;
    byModel[model].cost += event.cost || 0;
  }

  return {
    totals,
    byModel
  };
}

export async function getErrorMetrics({ since } = {}) {
  const errors = await readJsonl(ERROR_LOG, { since });
  const usageEvents = await loadUsageEvents({ since, limit: 5000 });
  const errorRate = usageEvents.length ? Math.round((errors.length / usageEvents.length) * 100) : 0;

  return {
    totalErrors: errors.length,
    errorRate,
    recent: errors.slice(-10)
  };
}

export async function getTeamActivity({ limit = 50 } = {}) {
  try {
    const data = await fs.readFile(TEAM_ACTIVITY_LOG, 'utf8');
    const entries = data.split('\n').filter(Boolean).map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);

    return entries.slice(-limit);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    return [];
  }
}

export async function getAnalyticsSnapshot(options = {}) {
  const [usage, agents, tokens, errors, team] = await Promise.all([
    getUsageStats(options.usage || {}),
    getAgentMetrics(options.agents || {}),
    getTokenMetrics(options.tokens || {}),
    getErrorMetrics(options.errors || {}),
    getTeamActivity(options.team || {})
  ]);

  return { usage, agents, tokens, errors, team };
}

export const analyticsPaths = {
  directory: ANALYTICS_DIR,
  agentLog: AGENT_LOG,
  tokenLog: TOKEN_LOG,
  errorLog: ERROR_LOG
};
