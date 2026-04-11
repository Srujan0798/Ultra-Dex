// Copyright (c) 2026 Ultra-Dex

/**
 * Governance audit trail
 * Enterprise-grade logging for agent operations via the logger spine.
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { appendJsonl } from '../analytics/storage.js';
import { logger } from '../utils/logger.js';

function getAuditDir() {
  return path.resolve(process.cwd(), '.ultra-dex', 'audit');
}

function getAuditLogPath() {
  return path.join(getAuditDir(), 'agent-ops.jsonl');
}

function toIso(ts) {
  return new Date(ts || Date.now()).toISOString();
}

function hashContent(content) {
  if (typeof content !== 'string' || content.length === 0) return null;
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function buildAuditPayload(entry = {}, timestamp = toIso()) {
  const payload = {
    timestamp,
    ...entry,
  };

  if (payload.content && !payload.contentHash) {
    payload.contentHash = hashContent(payload.content);
    delete payload.content;
  }

  return payload;
}

let auditSinkInitialized = false;

export function initializeGovernanceAuditSink() {
  if (auditSinkInitialized) return;

  logger.subscribe(
    'governance-audit',
    async (event) => {
      const payload = buildAuditPayload(event.data, event.timestamp);
      await appendJsonl(getAuditLogPath(), payload);
    },
    {
      eventTypes: ['governance.operation'],
    }
  );

  auditSinkInitialized = true;
}

export async function logOperation(entry) {
  initializeGovernanceAuditSink();

  const payload = buildAuditPayload(entry);
  await logger.event('governance.operation', payload, {
    console: false,
    source: 'compat.governance',
  });
}

export async function readAuditLog() {
  try {
    const data = await fs.readFile(getAuditLogPath(), 'utf8');
    return data
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
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export async function generateComplianceReport({ since, until, writeToFile = false } = {}) {
  const events = await readAuditLog();
  const start = since ? new Date(since).getTime() : null;
  const end = until ? new Date(until).getTime() : null;

  const filtered = events.filter((event) => {
    const ts = new Date(event.timestamp).getTime();
    if (start && ts < start) return false;
    if (end && ts > end) return false;
    return true;
  });

  const summary = {
    generatedAt: toIso(),
    range: {
      since: start ? new Date(start).toISOString() : null,
      until: end ? new Date(end).toISOString() : null,
    },
    totals: {
      events: filtered.length,
      allowed: filtered.filter((event) => event.allowed).length,
      blocked: filtered.filter((event) => !event.allowed).length,
    },
    byAgent: {},
    byOperation: {},
    blockedReasons: {},
  };

  for (const event of filtered) {
    const agentId = event.agent?.id || 'unknown';
    summary.byAgent[agentId] = summary.byAgent[agentId] || { total: 0, blocked: 0 };
    summary.byAgent[agentId].total += 1;
    if (!event.allowed) summary.byAgent[agentId].blocked += 1;

    const operation = event.operation || 'unknown';
    summary.byOperation[operation] = summary.byOperation[operation] || { total: 0, blocked: 0 };
    summary.byOperation[operation].total += 1;
    if (!event.allowed) summary.byOperation[operation].blocked += 1;

    if (!event.allowed) {
      const reason = event.reason || 'unspecified';
      summary.blockedReasons[reason] = (summary.blockedReasons[reason] || 0) + 1;
    }
  }

  if (writeToFile) {
    const reportPath = path.join(getAuditDir(), `compliance-report-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(summary, null, 2), 'utf8');
    summary.reportPath = reportPath;
  }

  return summary;
}

function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => escape(row[header])).join(','));
  }

  return lines.join('\n');
}

export async function exportAuditLog({ format = 'json', since, until, outputPath } = {}) {
  const events = await readAuditLog();
  const start = since ? new Date(since).getTime() : null;
  const end = until ? new Date(until).getTime() : null;

  const filtered = events.filter((event) => {
    const ts = new Date(event.timestamp).getTime();
    if (start && ts < start) return false;
    if (end && ts > end) return false;
    return true;
  });

  let payload = '';
  if (format === 'csv') {
    payload = toCsv(filtered);
  } else {
    payload = JSON.stringify(
      {
        generatedAt: toIso(),
        count: filtered.length,
        events: filtered,
      },
      null,
      2
    );
  }

  if (outputPath) {
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(outputPath, payload, 'utf8');
    return { outputPath, count: filtered.length, format };
  }

  return { data: payload, count: filtered.length, format };
}
