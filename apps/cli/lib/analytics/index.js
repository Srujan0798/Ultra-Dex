// Copyright (c) 2026 Ultra-Dex

/**
 * Analytics subsystem
 * Persists analytics events from the logger spine and exposes read helpers.
 */

import path from 'path';
import fs from 'fs/promises';
import { appendJsonl, readJsonl } from './storage.js';
import { getUsageSummary, loadUsageEvents } from '../enterprise/usage.js';
import { logger } from '../utils/logger.js';

function getAnalyticsDir() {
  return path.resolve(process.cwd(), '.ultra-dex', 'analytics');
}

function getAgentLogPath() {
  return path.join(getAnalyticsDir(), 'agents.jsonl');
}

function getTokenLogPath() {
  return path.join(getAnalyticsDir(), 'tokens.jsonl');
}

function getErrorLogPath() {
  return path.join(getAnalyticsDir(), 'errors.jsonl');
}

function getTeamActivityLogPath() {
  return path.resolve(process.cwd(), '.ultra-dex', 'team', 'activity.log');
}

let analyticsSinkInitialized = false;

function normalizeTimestamp(event) {
  return event.data?.timestamp || event.timestamp || new Date().toISOString();
}

export function initializeAnalyticsSink() {
  if (analyticsSinkInitialized) return;

  logger.subscribe(
    'analytics',
    async (event) => {
      switch (event.type) {
        case 'analytics.agent_performance':
          await appendJsonl(getAgentLogPath(), {
            timestamp: normalizeTimestamp(event),
            ...event.data,
          });
          break;
        case 'analytics.token_usage':
          await appendJsonl(getTokenLogPath(), {
            timestamp: normalizeTimestamp(event),
            ...event.data,
          });
          break;
        case 'analytics.error':
          await appendJsonl(getErrorLogPath(), {
            timestamp: normalizeTimestamp(event),
            ...event.data,
          });
          break;
        default:
          break;
      }
    },
    {
      eventTypes: ['analytics.agent_performance', 'analytics.token_usage', 'analytics.error'],
    }
  );

  analyticsSinkInitialized = true;
}

export async function recordAgentPerformance({
  agent,
  durationMs,
  success = true,
  task,
  provider,
  runId,
} = {}) {
  initializeAnalyticsSink();

  const payload = {
    timestamp: new Date().toISOString(),
    agent,
    durationMs,
    success,
    task,
    provider,
    runId,
  };

  await logger.event('analytics.agent_performance', payload, {
    console: false,
    source: 'compat.analytics',
  });

  return payload;
}

export async function recordTokenUsage({
  agent,
  model,
  inputTokens = 0,
  outputTokens = 0,
  totalTokens,
  cost,
  runId,
} = {}) {
  initializeAnalyticsSink();

  const payload = {
    timestamp: new Date().toISOString(),
    agent,
    model,
    inputTokens,
    outputTokens,
    totalTokens: totalTokens ?? inputTokens + outputTokens,
    cost: cost ?? null,
    runId,
  };

  await logger.event('analytics.token_usage', payload, {
    console: false,
    source: 'compat.analytics',
  });

  return payload;
}

export async function recordError({ message, command, stack, metadata, runId } = {}) {
  initializeAnalyticsSink();

  const payload = {
    timestamp: new Date().toISOString(),
    message,
    command,
    stack,
    metadata,
    runId,
  };

  await logger.event('analytics.error', payload, {
    console: false,
    source: 'compat.analytics',
  });

  return payload;
}

export async function getUsageStats({ windowDays = 7 } = {}) {
  return getUsageSummary({ windowDays });
}

export async function getAgentMetrics({ since } = {}) {
  const events = await readJsonl(getAgentLogPath(), { since });
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

  Object.values(byAgent).forEach((agentMetrics) => {
    if (agentMetrics.durations.length) {
      agentMetrics.avgDurationMs = Math.round(
        agentMetrics.durations.reduce((a, b) => a + b, 0) / agentMetrics.durations.length
      );
    }
    delete agentMetrics.durations;
  });

  return {
    totalRuns: events.length,
    successRate: events.length ? Math.round((successCount / events.length) * 100) : 0,
    avgDurationMs: events.length ? Math.round(totalDuration / events.length) : 0,
    byAgent,
  };
}

export async function getTokenMetrics({ since } = {}) {
  const events = await readJsonl(getTokenLogPath(), { since });
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
    byModel,
  };
}

export async function getErrorMetrics({ since } = {}) {
  const errors = await readJsonl(getErrorLogPath(), { since });
  const usageEvents = await loadUsageEvents({ since, limit: 5000 });
  const errorRate = usageEvents.length ? Math.round((errors.length / usageEvents.length) * 100) : 0;

  return {
    totalErrors: errors.length,
    errorRate,
    recent: errors.slice(-10),
  };
}

export async function getTeamActivity({ limit = 50 } = {}) {
  try {
    const data = await fs.readFile(getTeamActivityLogPath(), 'utf8');
    const entries = data
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

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
    getTeamActivity(options.team || {}),
  ]);

  return { usage, agents, tokens, errors, team };
}

export const analyticsPaths = {
  get directory() {
    return getAnalyticsDir();
  },
  get agentLog() {
    return getAgentLogPath();
  },
  get tokenLog() {
    return getTokenLogPath();
  },
  get errorLog() {
    return getErrorLogPath();
  },
};
