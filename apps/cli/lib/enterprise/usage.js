// Copyright (c) 2026 Ultra-Dex

/**
 * Enterprise Usage Analytics
 * Persists command usage from the logger spine and builds lightweight summaries.
 */

import fsPromises from 'fs/promises';
import path from 'path';
import { appendJsonl } from '../analytics/storage.js';
import { logger } from '../utils/logger.js';

function getAnalyticsDir() {
  return path.resolve(process.cwd(), '.ultra-dex', 'analytics');
}

function getUsageLogPath() {
  return path.join(getAnalyticsDir(), 'usage.jsonl');
}

function safeJsonParse(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function normalizeCommandName(command) {
  if (!command) return 'unknown';
  return String(command).trim();
}

let usageSinkInitialized = false;

function isUsageEvent(event) {
  return (
    event.type === 'usage.command' ||
    (event.type === 'log.entry' && event.message === 'usage.command')
  );
}

export function initializeUsageSink() {
  if (usageSinkInitialized) return;

  logger.subscribe(
    'usage',
    async (event) => {
      const payload = {
        timestamp: event.data?.timestamp || event.timestamp || new Date().toISOString(),
        ...event.data,
        command: normalizeCommandName(event.data?.command),
      };

      await appendJsonl(getUsageLogPath(), payload);
    },
    {
      filter: (event) => isUsageEvent(event),
    }
  );

  usageSinkInitialized = true;
}

export function recordUsageEventSync(event = {}) {
  initializeUsageSink();

  const payload = {
    timestamp: new Date().toISOString(),
    ...event,
    command: normalizeCommandName(event.command),
  };

  void logger.event('usage.command', payload, {
    console: false,
    source: 'compat.usage',
  });
}

export async function recordUsageEvent(event = {}) {
  initializeUsageSink();

  const payload = {
    timestamp: new Date().toISOString(),
    ...event,
    command: normalizeCommandName(event.command),
  };

  await logger.event('usage.command', payload, {
    console: false,
    source: 'compat.usage',
  });
}

export async function loadUsageEvents({ since, limit } = {}) {
  try {
    const data = await fsPromises.readFile(getUsageLogPath(), 'utf8');
    let events = data.split('\n').filter(Boolean).map(safeJsonParse).filter(Boolean);

    if (since) {
      const sinceTs = new Date(since).getTime();
      if (!Number.isNaN(sinceTs)) {
        events = events.filter((event) => new Date(event.timestamp).getTime() >= sinceTs);
      }
    }

    if (limit && events.length > limit) {
      events = events.slice(events.length - limit);
    }

    return events;
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    return [];
  }
}

export function summarizeUsage(events = []) {
  const summary = {
    totalCommands: 0,
    uniqueCommands: 0,
    last24h: 0,
    last7d: 0,
    errorCount: 0,
    avgDurationMs: 0,
    topCommands: [],
    byCommand: {},
  };

  if (!events.length) return summary;

  const now = Date.now();
  const last24hTs = now - 24 * 60 * 60 * 1000;
  const last7dTs = now - 7 * 24 * 60 * 60 * 1000;
  const durationValues = [];

  for (const event of events) {
    const commandName = normalizeCommandName(event.command);
    summary.totalCommands += 1;
    summary.byCommand[commandName] = (summary.byCommand[commandName] || 0) + 1;

    const ts = new Date(event.timestamp).getTime();
    if (!Number.isNaN(ts)) {
      if (ts >= last24hTs) summary.last24h += 1;
      if (ts >= last7dTs) summary.last7d += 1;
    }

    if (event.success === false || event.stage === 'error') {
      summary.errorCount += 1;
    }

    if (typeof event.durationMs === 'number') {
      durationValues.push(event.durationMs);
    }
  }

  summary.uniqueCommands = Object.keys(summary.byCommand).length;
  if (durationValues.length > 0) {
    summary.avgDurationMs = Math.round(
      durationValues.reduce((a, b) => a + b, 0) / durationValues.length
    );
  }

  summary.topCommands = Object.entries(summary.byCommand)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return summary;
}

export async function getUsageSummary({ windowDays = 7, limit = 2000 } = {}) {
  const since = windowDays
    ? new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString()
    : null;
  const events = await loadUsageEvents({ since, limit });
  return summarizeUsage(events);
}

export const usageLogPath = {
  toString() {
    return getUsageLogPath();
  },
  valueOf() {
    return getUsageLogPath();
  },
};
