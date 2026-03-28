// Copyright (c) 2026 Ultra-Dex

/**
 * Ultra-Dex Monitoring and Observability System
 * Provides metrics, health monitoring, and file-log sinks behind the logger spine.
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { performance } from 'perf_hooks';
import { logger, serializeEvent } from './logger.js';

// Configuration for monitoring system
const MONITORING_CONFIG = {
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || '.ultra-dex/logs/ultra-dex.log',
  metricsEnabled: process.env.METRICS_ENABLED !== 'false',
  healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
  maxLogSize: process.env.MAX_LOG_SIZE || '20m',
  maxLogFiles: parseInt(process.env.MAX_LOG_FILES) || 5,
};

function writeInternalWarning(message) {
  try {
    process.stderr.write(`${message}\n`);
  } catch {
    // ignore monitoring sink failures
  }
}

// Metrics storage
class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      performance: [],
      agents: {},
      operations: {},
    };
    this.startTime = Date.now();
  }

  incrementCounter(counterName) {
    if (this.metrics[counterName] !== undefined) {
      this.metrics[counterName]++;
    } else {
      this.metrics[counterName] = 1;
    }
  }

  recordPerformance(operation, duration, metadata = {}) {
    this.metrics.performance.push({
      operation,
      duration,
      timestamp: Date.now(),
      metadata,
    });

    if (this.metrics.performance.length > 1000) {
      this.metrics.performance = this.metrics.performance.slice(-1000);
    }
  }

  recordAgentActivity(agentName, duration, success = true) {
    if (!this.metrics.agents[agentName]) {
      this.metrics.agents[agentName] = {
        total: 0,
        successful: 0,
        failed: 0,
        avgDuration: 0,
        durations: [],
      };
    }

    const agentStats = this.metrics.agents[agentName];
    agentStats.total++;

    if (success) {
      agentStats.successful++;
    } else {
      agentStats.failed++;
    }

    agentStats.durations.push(duration);
    if (agentStats.durations.length > 100) {
      agentStats.durations = agentStats.durations.slice(-100);
    }

    agentStats.avgDuration =
      agentStats.durations.reduce((a, b) => a + b, 0) / agentStats.durations.length;
  }

  getMetrics() {
    const uptime = Date.now() - this.startTime;

    return {
      ...this.metrics,
      uptime,
      timestamp: new Date().toISOString(),
      system: {
        platform: os.platform(),
        arch: os.arch(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        loadAverage: os.loadavg(),
        cpuCount: os.cpus().length,
      },
    };
  }

  reset() {
    this.metrics = {
      requests: 0,
      errors: 0,
      performance: [],
      agents: {},
      operations: {},
    };
    this.startTime = Date.now();
  }
}

// Health checker
class HealthChecker {
  constructor() {
    this.healthChecks = new Map();
    this.status = 'healthy';
    this.lastCheck = null;
  }

  registerCheck(name, checkFn, interval = 30000) {
    this.healthChecks.set(name, {
      checkFn,
      interval,
      lastRun: null,
      status: 'unknown',
      message: 'Not checked yet',
    });
  }

  async runHealthCheck(name) {
    const check = this.healthChecks.get(name);
    if (!check) {
      throw new Error(`Health check '${name}' not found`);
    }

    try {
      const result = await check.checkFn();
      check.status = result.healthy ? 'healthy' : 'unhealthy';
      check.message = result.message || 'Check completed';
      check.lastRun = new Date().toISOString();
      check.responseTime = result.responseTime || 0;
    } catch (error) {
      check.status = 'unhealthy';
      check.message = error.message;
      check.lastRun = new Date().toISOString();
    }

    return {
      name,
      ...check,
    };
  }

  async runAllChecks() {
    const results = [];

    for (const [name] of this.healthChecks) {
      results.push(await this.runHealthCheck(name));
    }

    const unhealthyChecks = results.filter((result) => result.status !== 'healthy');
    this.status = unhealthyChecks.length === 0 ? 'healthy' : 'degraded';
    this.lastCheck = new Date().toISOString();

    return {
      overallStatus: this.status,
      checks: results,
      timestamp: this.lastCheck,
    };
  }

  getStatus() {
    return {
      status: this.status,
      lastCheck: this.lastCheck,
      checks: Array.from(this.healthChecks.keys()),
    };
  }
}

async function ensureLogDirectory() {
  const logDir = path.dirname(MONITORING_CONFIG.logFile);
  try {
    await fs.mkdir(logDir, { recursive: true });
  } catch (error) {
    writeInternalWarning(`Could not create log directory: ${error.message}`);
  }
}

async function createLoggerInstance() {
  await ensureLogDirectory();

  let winston = null;
  try {
    winston = await import('winston');
  } catch {
    winston = null;
  }

  if (!winston) {
    return {
      transports: [],
      async log(entry) {
        if (MONITORING_CONFIG.logLevel === 'silent') return;
        await fs.appendFile(
          MONITORING_CONFIG.logFile,
          JSON.stringify({
            timestamp: new Date().toISOString(),
            ...entry,
          }) + '\n',
          'utf8'
        );
      },
      close() {},
    };
  }

  const { createLogger, format, transports } = winston;

  if (MONITORING_CONFIG.logLevel === 'silent') {
    return createLogger({
      silent: true,
      transports: [],
    });
  }

  const logTransports = [
    new transports.File({
      filename: MONITORING_CONFIG.logFile,
      maxSize: MONITORING_CONFIG.maxLogSize,
      maxFiles: MONITORING_CONFIG.maxLogFiles,
    }),
  ];

  if (MONITORING_CONFIG.logLevel === 'debug' || process.env.DEBUG) {
    logTransports.push(
      new transports.Console({
        format: format.combine(format.colorize(), format.simple()),
      })
    );
  }

  return createLogger({
    level: MONITORING_CONFIG.logLevel,
    format: format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.splat(),
      format.json()
    ),
    defaultMeta: { service: 'ultra-dex' },
    transports: logTransports,
  });
}

function getOperationNameForEvent(event) {
  if (event.type === 'usage.command') {
    return `command.${event.data?.command || 'unknown'}`;
  }

  if (event.type === 'recovery.operation') {
    return `service.${event.data?.serviceName || 'unknown'}`;
  }

  if (event.type === 'analytics.agent_performance') {
    return `agent.${event.data?.agent || 'unknown'}`;
  }

  return event.type;
}

// Monitoring singleton
class MonitoringSystem {
  constructor() {
    this.logger = null;
    this.metrics = new MetricsCollector();
    this.healthChecker = new HealthChecker();
    this.performanceMarks = new Map();
    this.initialized = false;
    this.unsubscribeSink = null;
  }

  async initialize() {
    if (this.initialized) return;

    this.logger = await createLoggerInstance();
    this.setupDefaultHealthChecks();
    this.subscribeToSpine();
    this.initialized = true;
  }

  subscribeToSpine() {
    this.unsubscribeSink?.();

    this.unsubscribeSink = logger.subscribe('monitoring', async (event) => {
      if (!this.logger) return;

      const serialized = serializeEvent(event);
      await Promise.resolve(this.logger.log({
        level: event.level || 'info',
        message: event.message || event.type,
        eventType: event.type,
        structuredEvent: serialized,
      }));

      if (MONITORING_CONFIG.metricsEnabled) {
        this.updateMetricsFromEvent(event);
      }
    });
  }

  updateMetricsFromEvent(event) {
    switch (event.type) {
      case 'usage.command':
        if (event.data?.stage === 'start') {
          this.metrics.incrementCounter('requests');
        }
        if (typeof event.data?.durationMs === 'number') {
          this.metrics.recordPerformance(getOperationNameForEvent(event), event.data.durationMs, {
            stage: event.data.stage,
            success: event.data.success,
          });
        }
        break;
      case 'analytics.agent_performance':
        if (typeof event.data?.durationMs === 'number') {
          this.metrics.recordAgentActivity(
            event.data.agent || 'unknown',
            event.data.durationMs,
            event.data.success !== false
          );
          this.metrics.recordPerformance(getOperationNameForEvent(event), event.data.durationMs, {
            success: event.data.success !== false,
            provider: event.data.provider,
          });
        }
        break;
      case 'analytics.error':
        this.metrics.incrementCounter('errors');
        break;
      case 'recovery.operation':
        if (event.data?.status === 'failure') {
          this.metrics.incrementCounter('errors');
        }
        if (typeof event.data?.duration === 'number') {
          this.metrics.recordPerformance(getOperationNameForEvent(event), event.data.duration, {
            status: event.data.status,
            error: event.data.error,
          });
        }
        break;
      case 'monitoring.counter':
        if (event.data?.counterName) {
          this.metrics.incrementCounter(event.data.counterName);
        }
        break;
      case 'monitoring.performance':
        if (event.data?.operation && typeof event.data?.duration === 'number') {
          this.metrics.recordPerformance(
            event.data.operation,
            event.data.duration,
            event.data.metadata || {}
          );
        }
        break;
      case 'monitoring.agent_activity':
        if (event.data?.agentName && typeof event.data?.duration === 'number') {
          this.metrics.recordAgentActivity(
            event.data.agentName,
            event.data.duration,
            event.data.success !== false
          );
        }
        break;
      default:
        break;
    }
  }

  async shutdown() {
    this.unsubscribeSink?.();
    this.unsubscribeSink = null;

    if (!this.logger) {
      this.initialized = false;
      return;
    }

    try {
      for (const transport of this.logger.transports || []) {
        if (typeof transport.close === 'function') {
          transport.close();
        }
      }
      if (typeof this.logger.close === 'function') {
        this.logger.close();
      }
    } catch (error) {
      writeInternalWarning(`Failed to shutdown monitoring: ${error.message}`);
    }

    this.logger = null;
    this.initialized = false;
  }

  setupDefaultHealthChecks() {
    this.healthChecker.registerCheck('system', async () => {
      const start = performance.now();
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      const healthy = memoryUsage.heapUsed < memoryUsage.heapTotal * 0.8;

      return {
        healthy,
        message: healthy ? 'System resources within limits' : 'High memory usage detected',
        responseTime: performance.now() - start,
        memory: memoryUsage,
        uptime,
      };
    });

    this.healthChecker.registerCheck('disk', async () => {
      const start = performance.now();

      try {
        const stats = {
          available: 1024 * 1024 * 1024,
          total: 1024 * 1024 * 1024 * 100,
        };
        const healthy = stats.available > 100 * 1024 * 1024;

        return {
          healthy,
          message: healthy ? 'Sufficient disk space available' : 'Low disk space',
          responseTime: performance.now() - start,
          available: stats.available,
          total: stats.total,
        };
      } catch (error) {
        return {
          healthy: false,
          message: `Disk check failed: ${error.message}`,
          responseTime: performance.now() - start,
        };
      }
    });
  }

  // Compatibility wrappers: route legacy callers into the logger spine.
  log(level, message, meta = {}) {
    return logger.event('log.entry', meta, {
      kind: 'log',
      level,
      message,
      console: false,
      source: 'compat.monitoring',
    });
  }

  info(message, meta = {}) {
    return logger.event('monitoring.log', meta, {
      level: 'info',
      message,
      console: false,
      source: 'compat.monitoring',
    });
  }

  warn(message, meta = {}) {
    return logger.event('monitoring.log', meta, {
      level: 'warn',
      message,
      console: false,
      source: 'compat.monitoring',
    });
  }

  error(message, meta = {}) {
    return logger.event('monitoring.log', meta, {
      level: 'error',
      message,
      console: false,
      source: 'compat.monitoring',
    });
  }

  debug(message, meta = {}) {
    return logger.event('monitoring.log', meta, {
      level: 'debug',
      message,
      console: false,
      source: 'compat.monitoring',
    });
  }

  recordEvent(eventType, metadata = {}) {
    return logger.event(eventType, metadata, {
      console: false,
      source: 'compat.monitoring',
    });
  }

  incrementCounter(counterName) {
    return logger.event(
      'monitoring.counter',
      { counterName },
      {
        console: false,
        source: 'compat.monitoring',
      }
    );
  }

  recordPerformance(operation, duration, metadata = {}) {
    return logger.event(
      'monitoring.performance',
      { operation, duration, metadata },
      {
        console: false,
        source: 'compat.monitoring',
      }
    );
  }

  recordAgentActivity(agentName, duration, success = true) {
    return logger.event(
      'monitoring.agent_activity',
      { agentName, duration, success },
      {
        console: false,
        source: 'compat.monitoring',
      }
    );
  }

  getMetrics() {
    return this.metrics.getMetrics();
  }

  registerHealthCheck(name, checkFn, interval) {
    this.healthChecker.registerCheck(name, checkFn, interval);
  }

  async runHealthCheck(name) {
    return this.healthChecker.runHealthCheck(name);
  }

  async runAllHealthChecks() {
    return this.healthChecker.runAllChecks();
  }

  getHealthStatus() {
    return this.healthChecker.getStatus();
  }

  checkAlerts() {
    const metrics = this.getMetrics();
    const alerts = [];

    if (metrics.system) {
      const usedMemPercent =
        ((metrics.system.totalMemory - metrics.system.freeMemory) / metrics.system.totalMemory) *
        100;
      if (usedMemPercent > 90) {
        alerts.push({
          level: 'critical',
          type: 'memory',
          message: `High memory usage: ${usedMemPercent.toFixed(1)}%`,
        });
      } else if (usedMemPercent > 80) {
        alerts.push({
          level: 'warning',
          type: 'memory',
          message: `Elevated memory usage: ${usedMemPercent.toFixed(1)}%`,
        });
      }
    }

    if (metrics.errors > 10) {
      alerts.push({
        level: 'critical',
        type: 'errors',
        message: `High error count detected: ${metrics.errors} errors`,
      });
    }

    const slowOps = metrics.performance.filter((entry) => entry.duration > 5000);
    if (slowOps.length > 0) {
      alerts.push({
        level: 'warning',
        type: 'performance',
        message: `${slowOps.length} operations took longer than 5s`,
      });
    }

    return alerts;
  }

  markStart(operation) {
    this.performanceMarks.set(operation, performance.now());
  }

  markEnd(operation) {
    const start = this.performanceMarks.get(operation);
    if (!start) return null;

    const duration = performance.now() - start;
    this.performanceMarks.delete(operation);
    void this.recordPerformance(operation, duration);
    return duration;
  }

  async exportLogs() {
    try {
      try {
        await fs.access(MONITORING_CONFIG.logFile);
      } catch {
        return '# No logs available\n';
      }

      const logContent = await fs.readFile(MONITORING_CONFIG.logFile, 'utf8');
      return logContent;
    } catch (error) {
      writeInternalWarning(`Failed to export logs: ${error.message}`);
      return '# Error reading logs\n' + error.message;
    }
  }

  async exportMetrics(formatName = 'json') {
    const metrics = this.getMetrics();

    switch (formatName.toLowerCase()) {
      case 'json':
        return JSON.stringify(metrics, null, 2);
      case 'csv':
        return `metric,value\nrequests,${metrics.requests}\nerrors,${metrics.errors}\nuptime,${metrics.uptime}`;
      default:
        return JSON.stringify(metrics, null, 2);
    }
  }
}

// Global monitoring instance
export const monitoring = new MonitoringSystem();

// Export for use in other modules
export default monitoring;
