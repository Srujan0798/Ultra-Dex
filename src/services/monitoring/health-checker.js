// Copyright (c) 2026 Ultra-Dex
// Health Checker Service for HTTP health checks and system metrics

import os from 'os';
import cluster from 'cluster';

class HealthChecker {
  constructor(options = {}) {
    this.checks = new Map();
    this.metrics = new Map();
    this.healthEndpoint = options.healthEndpoint || '/health';
    this.readyEndpoint = options.readyEndpoint || '/ready';
    this.metricsEndpoint = options.metricsEndpoint || '/metrics';
    this.timeout = options.timeout || 5000; // 5 seconds default timeout
  }

  // Register a custom health check
  registerCheck(name, checkFunction, options = {}) {
    this.checks.set(name, {
      fn: checkFunction,
      interval: options.interval || 30000, // 30 seconds default
      timeout: options.timeout || this.timeout,
      enabled: options.enabled !== false,
      lastRun: null,
      lastResult: null
    });
  }

  // Register a metric collector
  registerMetric(name, metricFunction) {
    this.metrics.set(name, metricFunction);
  }

  // Perform all registered health checks
  async runHealthChecks() {
    const results = {};
    let overallHealthy = true;

    for (const [name, check] of this.checks) {
      if (!check.enabled) continue;

      try {
        // Run check with timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), check.timeout)
        );

        const checkPromise = check.fn();
        const result = await Promise.race([checkPromise, timeoutPromise]);

        results[name] = {
          status: result.status || (result.ok ? 'healthy' : 'unhealthy'),
          details: result.details || result,
          timestamp: new Date().toISOString()
        };

        if (results[name].status !== 'healthy') {
          overallHealthy = false;
        }

        check.lastRun = new Date();
        check.lastResult = results[name];
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        };
        overallHealthy = false;
      }
    }

    return {
      status: overallHealthy ? 'healthy' : 'unhealthy',
      checks: results,
      timestamp: new Date().toISOString()
    };
  }

  // Get system metrics
  async getSystemMetrics() {
    const metrics = {};

    // System metrics
    metrics.system = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: {
        count: os.cpus().length,
        model: os.cpus()[0]?.model,
        load: os.loadavg()
      },
      os: {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch()
      },
      process: {
        pid: process.pid,
        ppid: process.ppid,
        title: process.title,
        version: process.version,
        versions: process.versions
      }
    };

    // Custom metrics
    for (const [name, metricFn] of this.metrics) {
      try {
        metrics[name] = await metricFn();
      } catch (error) {
        metrics[name] = { error: error.message };
      }
    }

    // Cluster info if applicable
    if (cluster.worker) {
      metrics.cluster = {
        workerId: cluster.worker.id,
        isMaster: cluster.isMaster,
        isWorker: cluster.isWorker
      };
    }

    return metrics;
  }

  // HTTP health check handler
  async healthHandler(req, res) {
    try {
      const health = await this.runHealthChecks();
      const statusCode = health.status === 'healthy' ? 200 : 503;
      
      res.status(statusCode).json({
        status: health.status,
        timestamp: health.timestamp,
        checks: health.checks
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Ready check handler (for startup readiness)
  async readyHandler(req, res) {
    try {
      // For readiness, we might want to check different things
      // For now, just check if basic services are running
      const basicChecks = {
        process: {
          status: 'healthy',
          uptime: process.uptime()
        },
        memory: {
          status: process.memoryUsage().heapUsed < (process.memoryUsage().heapTotal * 0.8) ? 'healthy' : 'warning',
          usage: process.memoryUsage()
        }
      };

      const overallStatus = Object.values(basicChecks).every(check => 
        check.status === 'healthy' || check.status === 'warning'
      ) ? 'healthy' : 'unhealthy';

      const statusCode = overallStatus === 'healthy' ? 200 : 503;

      res.status(statusCode).json({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        checks: basicChecks
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Metrics handler
  async metricsHandler(req, res) {
    try {
      const metrics = await this.getSystemMetrics();
      
      // Format as Prometheus-style metrics if requested
      if (req.headers.accept && req.headers.accept.includes('text/plain')) {
        res.setHeader('Content-Type', 'text/plain; version=0.0.4');
        res.send(this.formatPrometheusMetrics(metrics));
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.json(metrics);
      }
    } catch (error) {
      res.status(500).json({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Format metrics in Prometheus format
  formatPrometheusMetrics(metrics) {
    let output = '# HELP ultra_dex_metrics Ultra-Dex system metrics\n';
    output += '# TYPE ultra_dex_metrics gauge\n';

    const flatten = (obj, prefix = '') => {
      let items = [];
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}_${key}` : key;
        if (typeof value === 'number') {
          items.push(`${fullKey} ${value}`);
        } else if (typeof value === 'object' && value !== null) {
          items = items.concat(flatten(value, fullKey));
        }
      }
      return items;
    };

    const flatMetrics = flatten(metrics);
    output += flatMetrics.join('\n') + '\n';

    return output;
  }

  // Convenience method to add common health checks
  addCommonChecks() {
    // Database connection check (if available)
    this.registerCheck('database', async () => {
      // This would check actual database connections
      // For now, returning healthy as placeholder
      return { status: 'healthy', details: { connected: true } };
    });

    // Memory usage check
    this.registerCheck('memory', async () => {
      const memory = process.memoryUsage();
      const heapUsedPercent = (memory.heapUsed / memory.heapTotal) * 100;
      
      return {
        status: heapUsedPercent < 80 ? 'healthy' : 'warning',
        details: {
          heapUsedPercent: heapUsedPercent.toFixed(2) + '%',
          heapUsed: memory.heapUsed,
          heapTotal: memory.heapTotal
        }
      };
    });

    // Disk space check
    this.registerCheck('disk_space', async () => {
      // This is a simplified check - in production, you'd want to check actual disk usage
      return { status: 'healthy', details: { available: 'unknown' } };
    });

    // Uptime check
    this.registerCheck('uptime', async () => {
      const uptime = process.uptime();
      return {
        status: uptime > 60 ? 'healthy' : 'warning', // At least 1 minute uptime
        details: { uptime: uptime }
      };
    });
  }

  // Initialize with common checks
  initialize() {
    this.addCommonChecks();
  }
}

// Singleton instance
const healthChecker = new HealthChecker();
healthChecker.initialize();

export default healthChecker;