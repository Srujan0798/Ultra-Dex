import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, test } from 'node:test';

import { Logger, logger } from '../lib/utils/logger.js';
import {
  getAgentMetrics,
  getErrorMetrics,
  getTokenMetrics,
  initializeAnalyticsSink,
} from '../lib/analytics/index.js';
import { initializeUsageSink, loadUsageEvents } from '../lib/enterprise/usage.js';
import { initializeGovernanceAuditSink, readAuditLog } from '../lib/governance/audit.js';
import { monitoring } from '../lib/utils/monitoring.js';

describe('logging spine', () => {
  let tmpDir;
  let originalCwd;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-logging-spine-'));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
    monitoring.metrics.reset();
  });

  afterEach(async () => {
    await monitoring.shutdown();
    monitoring.metrics.reset();
    process.chdir(originalCwd);
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('dispatches structured events to subscribers', async () => {
    const localLogger = new Logger({ timestamps: false, colorize: false });
    const seen = [];

    localLogger.subscribe('capture', (event) => {
      seen.push(event);
    });

    await localLogger.event(
      'demo.event',
      { apiKey: 'sk-123456789012345678901234' },
      {
        console: false,
        source: 'test',
      }
    );

    assert.equal(seen.length, 1);
    assert.equal(seen[0].type, 'demo.event');
    assert.match(seen[0].data.apiKey, /\[REDACTED\]/);
  });

  test('fans logger events out to usage, analytics, governance, and monitoring sinks', async () => {
    initializeAnalyticsSink();
    initializeUsageSink();
    initializeGovernanceAuditSink();
    await monitoring.initialize();

    await logger.event(
      'usage.command',
      { stage: 'start', command: 'run', cwd: process.cwd() },
      { console: false, source: 'test' }
    );
    await logger.event(
      'usage.command',
      { stage: 'end', command: 'run', durationMs: 123, success: true, cwd: process.cwd() },
      { console: false, source: 'test' }
    );
    await logger.event(
      'analytics.agent_performance',
      {
        agent: 'planner',
        durationMs: 42,
        success: true,
        task: 'plan release',
        provider: 'test-provider',
      },
      { console: false, source: 'test' }
    );
    await logger.event(
      'analytics.token_usage',
      {
        agent: 'planner',
        model: 'test-model',
        inputTokens: 10,
        outputTokens: 5,
        totalTokens: 15,
      },
      { console: false, source: 'test' }
    );
    await logger.event(
      'analytics.error',
      {
        message: 'boom',
        command: 'run',
        stack: 'stacktrace',
        metadata: { agent: 'planner' },
      },
      { console: false, source: 'test' }
    );
    await logger.event(
      'governance.operation',
      {
        agent: { id: 'planner' },
        operation: 'write',
        allowed: true,
        content: 'secret body',
      },
      { console: false, source: 'test' }
    );

    const usage = await loadUsageEvents();
    const agentMetrics = await getAgentMetrics();
    const tokenMetrics = await getTokenMetrics();
    const errorMetrics = await getErrorMetrics();
    const auditLog = await readAuditLog();
    const metrics = monitoring.getMetrics();

    assert.equal(usage.length, 2);
    assert.equal(agentMetrics.totalRuns, 1);
    assert.equal(tokenMetrics.totals.totalTokens, 15);
    assert.equal(errorMetrics.totalErrors, 1);
    assert.equal(auditLog.length, 1);
    assert.ok(auditLog[0].contentHash);
    assert.equal(auditLog[0].content, undefined);
    assert.equal(metrics.requests, 1);
    assert.equal(metrics.errors, 1);
    assert.equal(metrics.agents.planner.total, 1);
  });
});
