import fs from "fs/promises";
import path from "path";
import { createLogger, format, transports } from "winston";
import os from "os";
import { performance } from "perf_hooks";
import { logger } from './logging.js';
const MONITORING_CONFIG = {
  logLevel: process.env.LOG_LEVEL || "info",
  logFile: process.env.LOG_FILE || ".ultra-dex/logs/ultra-dex.log",
  metricsEnabled: process.env.METRICS_ENABLED !== "false",
  healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || "30000") || 3e4,
  maxLogSize: process.env.MAX_LOG_SIZE || "20m",
  maxLogFiles: parseInt(process.env.MAX_LOG_FILES || "5") || 5
};
class MetricsCollector {
  metrics;
  startTime;
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      performance: [],
      agents: {},
      operations: {}
    };
    this.startTime = Date.now();
  }
  incrementCounter(counterName) {
    if (this.metrics[counterName] !== void 0) {
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
      metadata
    });
    if (this.metrics.performance.length > 1e3) {
      this.metrics.performance = this.metrics.performance.slice(-1e3);
    }
  }
  recordAgentActivity(agentName, duration, success = true) {
    if (!this.metrics.agents[agentName]) {
      this.metrics.agents[agentName] = {
        total: 0,
        successful: 0,
        failed: 0,
        avgDuration: 0,
        durations: []
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
    agentStats.avgDuration = agentStats.durations.reduce((a, b) => a + b, 0) / agentStats.durations.length;
  }
  getMetrics() {
    const uptime = Date.now() - this.startTime;
    return {
      ...this.metrics,
      uptime,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      system: {
        platform: os.platform(),
        arch: os.arch(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        loadAverage: os.loadavg(),
        cpuCount: os.cpus().length
      }
    };
  }
  reset() {
    this.metrics = {
      requests: 0,
      errors: 0,
      performance: [],
      agents: {},
      operations: {}
    };
    this.startTime = Date.now();
  }
}
class HealthChecker {
  healthChecks;
  status;
  lastCheck;
  constructor() {
    this.healthChecks = /* @__PURE__ */ new Map();
    this.status = "healthy";
    this.lastCheck = null;
  }
  registerCheck(name, checkFn, interval = 3e4) {
    this.healthChecks.set(name, {
      checkFn,
      interval,
      lastRun: null,
      status: "unknown",
      message: "Not checked yet"
    });
  }
  async runHealthCheck(name) {
    const check = this.healthChecks.get(name);
    if (!check) {
      throw new Error(`Health check '${name}' not found`);
    }
    try {
      const result = await check.checkFn();
      check.status = result.healthy ? "healthy" : "unhealthy";
      check.message = result.message || "Check completed";
      check.lastRun = (/* @__PURE__ */ new Date()).toISOString();
      check.responseTime = result.responseTime || 0;
    } catch (error) {
      check.status = "unhealthy";
      check.message = error instanceof Error ? error.message : String(error);
      check.lastRun = (/* @__PURE__ */ new Date()).toISOString();
    }
    return {
      name,
      ...check
    };
  }
  async runAllChecks() {
    const results = [];
    for (const [name] of this.healthChecks) {
      results.push(await this.runHealthCheck(name));
    }
    const unhealthyChecks = results.filter((r) => r.status !== "healthy");
    this.status = unhealthyChecks.length === 0 ? "healthy" : "degraded";
    this.lastCheck = (/* @__PURE__ */ new Date()).toISOString();
    return {
      overallStatus: this.status,
      checks: results,
      timestamp: this.lastCheck
    };
  }
  getStatus() {
    return {
      status: this.status,
      lastCheck: this.lastCheck,
      checks: Array.from(this.healthChecks.keys())
    };
  }
}
async function ensureLogDirectory() {
  const logDir = path.dirname(MONITORING_CONFIG.logFile);
  try {
    await fs.mkdir(logDir, { recursive: true });
  } catch (error) {
    logger.warn(`Could not create log directory: ${error instanceof Error ? error.message : String(error)}`);
  }
}
async function createLoggerInstance() {
  if (MONITORING_CONFIG.logLevel === "silent") {
    return createLogger({
      silent: true,
      transports: []
    });
  }
  await ensureLogDirectory();
  const logTransports = [
    new transports.File({
      filename: MONITORING_CONFIG.logFile,
      maxSize: MONITORING_CONFIG.maxLogSize,
      maxFiles: MONITORING_CONFIG.maxLogFiles
    })
  ];
  if (MONITORING_CONFIG.logLevel === "debug" || process.env.DEBUG) {
    logTransports.push(
      new transports.Console({
        format: format.combine(format.colorize(), format.simple())
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
    defaultMeta: { service: "ultra-dex" },
    transports: logTransports
  });
}
class MonitoringSystem {
  logger;
  metrics;
  healthChecker;
  performanceMarks;
  initialized;
  constructor() {
    this.logger = null;
    this.metrics = new MetricsCollector();
    this.healthChecker = new HealthChecker();
    this.performanceMarks = /* @__PURE__ */ new Map();
    this.initialized = false;
  }
  async initialize() {
    if (this.initialized)
      return;
    this.logger = await createLoggerInstance();
    this.setupDefaultHealthChecks();
    this.initialized = true;
    this.logger.info("Monitoring system initialized", {
      config: MONITORING_CONFIG
    });
  }
  async shutdown() {
    if (!this.logger)
      return;
    try {
      const trans = this.logger.transports;
      for (const t of trans || []) {
        if (typeof t.close === "function") {
          t.close();
        }
      }
      if (typeof this.logger.close === "function") {
        this.logger.close();
      }
    } catch (error) {
      logger.warn(`Failed to shutdown monitoring: ${error instanceof Error ? error.message : String(error)}`);
    }
    this.initialized = false;
  }
  setupDefaultHealthChecks() {
    this.healthChecker.registerCheck("system", async () => {
      const start = performance.now();
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      const healthy = memoryUsage.heapUsed < memoryUsage.heapTotal * 0.8;
      return {
        healthy,
        message: healthy ? "System resources within limits" : "High memory usage detected",
        responseTime: performance.now() - start,
        memory: memoryUsage,
        uptime
      };
    });
    this.healthChecker.registerCheck("disk", async () => {
      const start = performance.now();
      try {
        const stats = { available: 1024 * 1024 * 1024, total: 1024 * 1024 * 1024 * 100 };
        const healthy = stats.available > 100 * 1024 * 1024;
        return {
          healthy,
          message: healthy ? "Sufficient disk space available" : "Low disk space",
          responseTime: performance.now() - start,
          available: stats.available,
          total: stats.total
        };
      } catch (error) {
        return {
          healthy: false,
          message: `Disk check failed: ${error instanceof Error ? error.message : String(error)}`,
          responseTime: performance.now() - start
        };
      }
    });
  }
  log(level, message, meta = {}) {
    if (!this.initialized)
      return;
    if (this.logger) {
      this.logger[level]?.(message, meta);
    }
  }
  info(message, meta = {}) {
    this.log("info", message, meta);
  }
  warn(message, meta = {}) {
    this.log("warn", message, meta);
  }
  error(message, meta = {}) {
    this.log("error", message, meta);
    this.metrics.incrementCounter("errors");
  }
  debug(message, meta = {}) {
    this.log("debug", message, meta);
  }
  incrementCounter(counterName) {
    this.metrics.incrementCounter(counterName);
  }
  recordPerformance(operation, duration, metadata = {}) {
    this.metrics.recordPerformance(operation, duration, metadata);
  }
  recordAgentActivity(agentName, duration, success = true) {
    this.metrics.recordAgentActivity(agentName, duration, success);
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
      const usedMemPercent = (metrics.system.totalMemory - metrics.system.freeMemory) / metrics.system.totalMemory * 100;
      if (usedMemPercent > 90) {
        alerts.push({
          level: "critical",
          type: "memory",
          message: `High memory usage: ${usedMemPercent.toFixed(1)}%`
        });
      } else if (usedMemPercent > 80) {
        alerts.push({
          level: "warning",
          type: "memory",
          message: `Elevated memory usage: ${usedMemPercent.toFixed(1)}%`
        });
      }
    }
    if (metrics.errors > 10) {
      alerts.push({
        level: "critical",
        type: "errors",
        message: `High error count detected: ${metrics.errors} errors`
      });
    }
    const slowOps = metrics.performance.filter((p) => p.duration > 5e3);
    if (slowOps.length > 0) {
      alerts.push({
        level: "warning",
        type: "performance",
        message: `${slowOps.length} operations took longer than 5s`
      });
    }
    return alerts;
  }
  markStart(operation) {
    this.performanceMarks.set(operation, performance.now());
  }
  markEnd(operation) {
    const start = this.performanceMarks.get(operation);
    if (start) {
      const duration = performance.now() - start;
      this.performanceMarks.delete(operation);
      this.recordPerformance(operation, duration);
      return duration;
    }
    return null;
  }
  async exportLogs() {
    try {
      try {
        await fs.access(MONITORING_CONFIG.logFile);
      } catch {
        return "# No logs available\n";
      }
      const logContent = await fs.readFile(MONITORING_CONFIG.logFile, "utf8");
      return logContent;
    } catch (error) {
      this.error("Failed to export logs", { error: error instanceof Error ? error.message : String(error) });
      return "# Error reading logs\n" + (error instanceof Error ? error.message : String(error));
    }
  }
  async exportMetrics(format2 = "json") {
    const metrics = this.getMetrics();
    switch (format2.toLowerCase()) {
      case "json":
        return JSON.stringify(metrics, null, 2);
      case "csv":
        return `metric,value
requests,${metrics.requests}
errors,${metrics.errors}
uptime,${metrics.uptime}`;
      default:
        return JSON.stringify(metrics, null, 2);
    }
  }
}
const monitoring = new MonitoringSystem();
var monitoring_default = monitoring;
export {
  monitoring_default as default,
  monitoring
};
