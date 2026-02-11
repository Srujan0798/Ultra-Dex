// Copyright (c) 2026 Ultra-Dex

/**
 * Enterprise Usage Analytics
 * Tracks command usage and builds lightweight summaries for dashboards.
 */

import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';

const ANALYTICS_DIR = path.resolve(process.cwd(), '.ultra-dex', 'analytics');
const USAGE_LOG = path.join(ANALYTICS_DIR, 'usage.jsonl');

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

export function recordUsageEventSync(event = {}) {
  try {
    fs.mkdirSync(ANALYTICS_DIR, { recursive: true });
    const payload = {
      timestamp: new Date().toISOString(),
      ...event,
      command: normalizeCommandName(event.command),
    };
    fs.appendFileSync(USAGE_LOG, JSON.stringify(payload) + '\n', 'utf8');
  } catch {
    // Usage tracking should never block CLI execution
  }
}

export async function recordUsageEvent(event = {}) {
  try {
    await fsPromises.mkdir(ANALYTICS_DIR, { recursive: true });
    const payload = {
      timestamp: new Date().toISOString(),
      ...event,
      command: normalizeCommandName(event.command),
    };
    await fsPromises.appendFile(USAGE_LOG, JSON.stringify(payload) + '\n', 'utf8');
  } catch {
    // Usage tracking should never block CLI execution
  }
}

export async function loadUsageEvents({ since, limit } = {}) {
  try {
    const data = await fsPromises.readFile(USAGE_LOG, 'utf8');
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

export const usageLogPath = USAGE_LOG;
