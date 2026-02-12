// Copyright (c) 2026 Ultra-Dex

import os from 'os';

const startTime = Date.now();
const metrics = {
  runs: 0,
  healthy: 0,
  degraded: 0,
  unhealthy: 0,
  latencyMsP50: 0,
};

function updateLatencyMetrics(latencyMs) {
  const runs = metrics.runs;
  metrics.latencyMsP50 = ((metrics.latencyMsP50 * (runs - 1)) + latencyMs) / runs;
}

function deriveStatus(results) {
  const failed = results.filter((check) => check.status !== 'healthy');
  if (failed.length === 0) return 'healthy';
  if (failed.length <= Math.ceil(results.length / 2)) return 'degraded';
  return 'unhealthy';
}

async function defaultDatabaseCheck() {
  const startedAt = Date.now();
  try {
    const { healthCheck } = await import('../database/connection-pool.js');
    const result = await healthCheck();
    return {
      name: 'database',
      status: result.status === 'healthy' ? 'healthy' : 'unhealthy',
      latencyMs: Date.now() - startedAt,
      details: result,
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'degraded',
      latencyMs: Date.now() - startedAt,
      details: { error: error.message },
    };
  }
}

async function defaultMemoryCheck() {
  const mem = process.memoryUsage();
  const heapRatio = mem.heapUsed / Math.max(mem.heapTotal, 1);
  const status = heapRatio > 0.9 ? 'degraded' : 'healthy';
  return {
    name: 'memory',
    status,
    details: {
      rss: mem.rss,
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      heapRatio,
    },
  };
}

async function defaultDiskCheck() {
  const freeMemoryRatio = os.freemem() / Math.max(os.totalmem(), 1);
  return {
    name: 'disk_space',
    status: freeMemoryRatio < 0.05 ? 'degraded' : 'healthy',
    details: {
      freeMemoryRatio,
      note: 'Disk check fallback uses system memory ratio when disk stats are unavailable.',
    },
  };
}

async function defaultApiLatencyCheck() {
  const startedAt = Date.now();
  const target = 'https://example.com';

  try {
    await fetch(target, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - startedAt;
    return {
      name: 'api_latency',
      status: latencyMs > 2000 ? 'degraded' : 'healthy',
      latencyMs,
      details: { target },
    };
  } catch (error) {
    return {
      name: 'api_latency',
      status: 'degraded',
      latencyMs: Date.now() - startedAt,
      details: { target, error: error.message },
    };
  }
}

export function createHealthChecker(checks = {}) {
  const checkMap = {
    database: checks.database || defaultDatabaseCheck,
    memory: checks.memory || defaultMemoryCheck,
    diskSpace: checks.diskSpace || defaultDiskCheck,
    apiLatency: checks.apiLatency || defaultApiLatencyCheck,
  };

  return {
    async runHealthCheck() {
      const startedAt = Date.now();
      const checksResult = await Promise.all([
        checkMap.database(),
        checkMap.memory(),
        checkMap.diskSpace(),
        checkMap.apiLatency(),
      ]);

      const status = deriveStatus(checksResult);
      const latencyMs = Date.now() - startedAt;

      metrics.runs += 1;
      metrics[status] += 1;
      updateLatencyMetrics(latencyMs);

      return {
        status,
        checks: checksResult,
        uptime: Date.now() - startTime,
      };
    },

    getMetrics() {
      return {
        ...metrics,
        uptime: Date.now() - startTime,
      };
    },
  };
}

export async function runHealthCheck() {
  const checker = createHealthChecker();
  return checker.runHealthCheck();
}

export function getMetrics() {
  return {
    ...metrics,
    uptime: Date.now() - startTime,
  };
}
