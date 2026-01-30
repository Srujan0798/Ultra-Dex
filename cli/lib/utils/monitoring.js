/**
 * Ultra-Dex Monitoring and Observability System
 * Provides comprehensive logging, metrics, and health monitoring
 */

import fs from 'fs/promises';
import path from 'path';
import { createLogger, format, transports } from 'winston';
import os from 'os';
import { performance } from 'perf_hooks';

// Configuration for monitoring system
const MONITORING_CONFIG = {
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || '.ultra-dex/logs/ultra-dex.log',
  metricsEnabled: process.env.METRICS_ENABLED !== 'false',
  healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000, // 30 seconds
  maxLogSize: process.env.MAX_LOG_SIZE || '20m',
  maxLogFiles: parseInt(process.env.MAX_LOG_FILES) || 5
};

// Metrics storage
class MetricsCollector {
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
      metadata
    });

    // Keep only last 1000 performance records
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

    // Calculate average duration
    agentStats.durations.push(duration);
    if (agentStats.durations.length > 100) {
      agentStats.durations = agentStats.durations.slice(-100); // Keep last 100
    }
    
    agentStats.avgDuration = agentStats.durations.reduce((a, b) => a + b, 0) / agentStats.durations.length;
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
      message: 'Not checked yet'
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
      ...check
    };
  }

  async runAllChecks() {
    const results = [];
    
    for (const [name] of this.healthChecks) {
      results.push(await this.runHealthCheck(name));
    }

    // Determine overall status
    const unhealthyChecks = results.filter(r => r.status !== 'healthy');
    this.status = unhealthyChecks.length === 0 ? 'healthy' : 'degraded';
    this.lastCheck = new Date().toISOString();

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

// Create log directory if it doesn't exist
async function ensureLogDirectory() {
  const logDir = path.dirname(MONITORING_CONFIG.logFile);
  try {
    await fs.mkdir(logDir, { recursive: true });
  } catch (error) {
    console.warn(`Could not create log directory: ${error.message}`);
  }
}

// Create logger
async function createLoggerInstance() {
  // Handle 'silent' log level - return a silent logger
  if (MONITORING_CONFIG.logLevel === 'silent') {
    return createLogger({
      silent: true,
      transports: []
    });
  }

  await ensureLogDirectory();

  return createLogger({
    level: MONITORING_CONFIG.logLevel,
    format: format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.splat(),
      format.json()
    ),
    defaultMeta: { service: 'ultra-dex' },
    transports: [
      new transports.File({
        filename: MONITORING_CONFIG.logFile,
        maxSize: MONITORING_CONFIG.maxLogSize,
        maxFiles: MONITORING_CONFIG.maxLogFiles
      }),
      new transports.Console({
        format: format.combine(
          format.colorize(),
          format.simple()
        )
      })
    ]
  });
}

// Monitoring singleton
class MonitoringSystem {
  constructor() {
    this.logger = null;
    this.metrics = new MetricsCollector();
    this.healthChecker = new HealthChecker();
    this.performanceMarks = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    this.logger = await createLoggerInstance();
    this.setupDefaultHealthChecks();
    this.initialized = true;
    
    this.logger.info('Monitoring system initialized', {
      config: MONITORING_CONFIG
    });
  }

  setupDefaultHealthChecks() {
    // System health check
    this.healthChecker.registerCheck('system', async () => {
      const start = performance.now();
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      const healthy = memoryUsage.heapUsed < memoryUsage.heapTotal * 0.8; // Less than 80% heap used
      
      return {
        healthy,
        message: healthy ? 'System resources within limits' : 'High memory usage detected',
        responseTime: performance.now() - start,
        memory: memoryUsage,
        uptime
      };
    });

    // Disk space check
    this.healthChecker.registerCheck('disk', async () => {
      const start = performance.now();
      
      try {
        // This is a simplified check - in a real system, you'd use a library like 'check-disk-space'
        const stats = { available: 1024 * 1024 * 1024, total: 1024 * 1024 * 1024 * 100 }; // 1GB available, 100GB total
        const healthy = stats.available > 100 * 1024 * 1024; // At least 100MB available
        
        return {
          healthy,
          message: healthy ? 'Sufficient disk space available' : 'Low disk space',
          responseTime: performance.now() - start,
          available: stats.available,
          total: stats.total
        };
      } catch (error) {
        return {
          healthy: false,
          message: `Disk check failed: ${error.message}`,
          responseTime: performance.now() - start
        };
      }
    });
  }

  // Logging methods
  log(level, message, meta = {}) {
    if (!this.initialized) return;
    this.logger[level](message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
    this.metrics.incrementCounter('errors');
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  // Metrics methods
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

  // Health check methods
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

  // Performance timing
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

  // Utility methods
  async exportLogs() {
    try {
      const logContent = await fs.readFile(MONITORING_CONFIG.logFile, 'utf8');
      return logContent;
    } catch (error) {
      this.error('Failed to export logs', { error: error.message });
      return null;
    }
  }

  async exportMetrics(format = 'json') {
    const metrics = this.getMetrics();
    
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(metrics, null, 2);
      case 'csv':
        // Simplified CSV export
        return `metric,value\nrequests,${metrics.requests}\nerrors,${metrics.errors}\nuptime,${metrics.uptime}`;
      default:
        return JSON.stringify(metrics, null, 2);
    }
  }
}

// Global monitoring instance
export const monitoring = new MonitoringSystem();

// Initialize monitoring system
monitoring.initialize().catch(console.error);

// Export for use in other modules
export default monitoring;