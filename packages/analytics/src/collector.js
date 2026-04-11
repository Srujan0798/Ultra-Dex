/**
 * @class MetricsCollector
 * Collects metrics from all Ultra-Dex system components
 */

import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import moment from 'moment';

export class MetricsCollector extends EventEmitter {
  constructor(config, logger) {
    super();
    this.config = config;
    this.logger = logger;
    this.metrics = new Map();
    this.collectors = new Map();
    this.storagePath = path.join(process.cwd(), 'analytics', 'metrics');
  }

  async initialize() {
    await fs.mkdir(this.storagePath, { recursive: true });

    // Initialize component collectors
    this.registerCollector('core', this.collectCoreMetrics.bind(this));
    this.registerCollector('cli', this.collectCLIMetrics.bind(this));
    this.registerCollector('dashboard', this.collectDashboardMetrics.bind(this));
    this.registerCollector('ai-providers', this.collectAIProviderMetrics.bind(this));
    this.registerCollector('services', this.collectServiceMetrics.bind(this));
    this.registerCollector('security', this.collectSecurityMetrics.bind(this));
    this.registerCollector('performance', this.collectPerformanceMetrics.bind(this));
    this.registerCollector('costs', this.collectCostMetrics.bind(this));

    // Start periodic collection
    this.collectionInterval = setInterval(() => {
      this.collectAllMetrics();
    }, 60000); // Every minute

    this.logger.info('Metrics Collector initialized');
  }

  registerCollector(component, collectorFn) {
    this.collectors.set(component, collectorFn);
  }

  async collect(component, metrics) {
    const timestamp = new Date().toISOString();
    const metricData = {
      component,
      metrics,
      timestamp,
    };

    if (!this.metrics.has(component)) {
      this.metrics.set(component, []);
    }

    this.metrics.get(component).push(metricData);

    // Store to disk
    await this.storeMetric(component, metricData);

    this.emit('metric-collected', metricData);
    this.logger.debug(`Collected metrics for ${component}`, metrics);
  }

  async collectAllMetrics() {
    for (const [component, collector] of this.collectors) {
      try {
        const metrics = await collector();
        if (metrics && Object.keys(metrics).length > 0) {
          await this.collect(component, metrics);
        }
      } catch (error) {
        this.logger.error(`Failed to collect metrics for ${component}`, error);
      }
    }
  }

  async collectCoreMetrics() {
    // Collect core system metrics
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memory: {
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      uptime: process.uptime(),
      pid: process.pid,
    };
  }

  async collectCLIMetrics() {
    // CLI usage metrics - would integrate with CLI app
    return {
      commandsExecuted: 0, // Placeholder
      errors: 0,
      avgResponseTime: 0,
    };
  }

  async collectDashboardMetrics() {
    // Dashboard usage metrics
    return {
      activeUsers: 0,
      pageViews: 0,
      sessionDuration: 0,
    };
  }

  async collectAIProviderMetrics() {
    // AI provider usage, costs, performance
    return {
      requests: 0,
      tokens: 0,
      cost: 0,
      latency: 0,
      errors: 0,
    };
  }

  async collectServiceMetrics() {
    // General service metrics
    return {
      requests: 0,
      responses: 0,
      errors: 0,
      throughput: 0,
    };
  }

  async collectSecurityMetrics() {
    // Security events, violations
    return {
      authAttempts: 0,
      authFailures: 0,
      securityAlerts: 0,
      vulnerabilities: 0,
    };
  }

  async collectPerformanceMetrics() {
    // Performance benchmarks
    return {
      responseTime: 0,
      throughput: 0,
      errorRate: 0,
      availability: 100,
    };
  }

  async collectCostMetrics() {
    // Cost tracking
    return {
      aiCosts: 0,
      infrastructureCosts: 0,
      storageCosts: 0,
      totalCosts: 0,
    };
  }

  async storeMetric(component, data) {
    const fileName = `${component}-${moment().format('YYYY-MM-DD')}.json`;
    const filePath = path.join(this.storagePath, fileName);

    let existingData = [];
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      existingData = JSON.parse(content);
    } catch (error) {
      // File doesn't exist or invalid, start fresh
    }

    existingData.push(data);
    await fs.writeFile(filePath, JSON.stringify(existingData, null, 2));
  }

  async getMetrics(component, timeRange = '24h') {
    const startTime = moment().subtract(this.parseTimeRange(timeRange));

    if (!this.metrics.has(component)) {
      return [];
    }

    return this.metrics.get(component).filter((m) => moment(m.timestamp).isAfter(startTime));
  }

  async getAggregatedMetrics(timeRange = '24h') {
    const aggregated = {};

    for (const component of this.collectors.keys()) {
      const metrics = await this.getMetrics(component, timeRange);
      if (metrics.length > 0) {
        aggregated[component] = this.aggregateMetrics(metrics);
      }
    }

    return aggregated;
  }

  aggregateMetrics(metrics) {
    if (metrics.length === 0) return {};

    const aggregated = {};
    const first = metrics[0].metrics;

    // Aggregate numeric values
    for (const [key, value] of Object.entries(first)) {
      if (typeof value === 'number') {
        const values = metrics.map((m) => m.metrics[key]).filter((v) => typeof v === 'number');
        aggregated[key] = {
          current: values[values.length - 1] || 0,
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length,
        };
      } else {
        aggregated[key] = value; // Keep last value for non-numeric
      }
    }

    return aggregated;
  }

  parseTimeRange(timeRange) {
    const match = timeRange.match(/^(\d+)([hdwm])$/);
    if (!match) return 1; // Default 1 hour

    const [, num, unit] = match;
    const number = parseInt(num);

    switch (unit) {
      case 'h':
        return number;
      case 'd':
        return number * 24;
      case 'w':
        return number * 24 * 7;
      case 'm':
        return number * 24 * 30;
      default:
        return 1;
    }
  }

  async shutdown() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }
    this.logger.info('Metrics Collector shut down');
  }
}
