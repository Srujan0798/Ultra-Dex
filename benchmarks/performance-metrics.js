// Copyright (c) 2026 Ultra-Dex
// benchmarks/performance-metrics.js

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import os from 'os';
import { createLogger } from '../src/utils/logging.js';

class PerformanceMetrics extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      collectionInterval: options.collectionInterval || 5000, // 5 seconds
      retentionPeriod: options.retentionPeriod || 3600000, // 1 hour
      ...options,
    };

    this.logger = createLogger('PerformanceMetrics');
    this.metrics = {
      latency: [],
      throughput: [],
      memory: [],
      cpu: [],
      custom: new Map(),
    };

    this.collectionTimer = null;
    this.isCollecting = false;
  }

  /**
   * Start metrics collection
   */
  startCollection() {
    if (this.isCollecting) return;

    this.isCollecting = true;
    this.collectionTimer = setInterval(() => {
      this.collectSystemMetrics();
    }, this.options.collectionInterval);

    this.logger.info('Performance metrics collection started');
  }

  /**
   * Stop metrics collection
   */
  stopCollection() {
    if (!this.isCollecting) return;

    this.isCollecting = false;
    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
      this.collectionTimer = null;
    }

    this.logger.info('Performance metrics collection stopped');
  }

  /**
   * Collect system performance metrics
   */
  collectSystemMetrics() {
    const timestamp = Date.now();

    // Memory metrics
    const memUsage = process.memoryUsage();
    const memoryMetrics = {
      timestamp,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
    };

    this.metrics.memory.push(memoryMetrics);

    // CPU metrics
    const cpuUsage = process.cpuUsage();
    const cpuMetrics = {
      timestamp,
      user: cpuUsage.user,
      system: cpuUsage.system,
      total: cpuUsage.user + cpuUsage.system,
    };

    this.metrics.cpu.push(cpuMetrics);

    // System load
    const loadAvg = os.loadavg();
    const systemMetrics = {
      timestamp,
      load1: loadAvg[0],
      load5: loadAvg[1],
      load15: loadAvg[2],
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
      memoryUsagePercent: Math.round((1 - os.freemem() / os.totalmem()) * 100),
    };

    this.recordMetric('system.load', loadAvg[0], { type: 'load1' });
    this.recordMetric('system.memory.usage', systemMetrics.memoryUsagePercent, { unit: 'percent' });

    // Clean up old metrics
    this.cleanupOldMetrics();

    this.emit('metrics:collected', {
      memory: memoryMetrics,
      cpu: cpuMetrics,
      system: systemMetrics,
    });
  }

  /**
   * Record latency measurement
   */
  recordLatency(operation, duration, tags = {}) {
    const metric = {
      timestamp: Date.now(),
      operation,
      duration,
      tags,
    };

    this.metrics.latency.push(metric);
    this.emit('latency:recorded', metric);

    // Also record as custom metric for aggregation
    this.recordMetric(`latency.${operation}`, duration, tags);
  }

  /**
   * Record throughput measurement
   */
  recordThroughput(operation, count, timeWindow = 1000, tags = {}) {
    const rate = (count / timeWindow) * 1000; // per second
    const metric = {
      timestamp: Date.now(),
      operation,
      rate,
      count,
      timeWindow,
      tags,
    };

    this.metrics.throughput.push(metric);
    this.emit('throughput:recorded', metric);

    this.recordMetric(`throughput.${operation}`, rate, { ...tags, unit: 'per_second' });
  }

  /**
   * Record custom metric
   */
  recordMetric(name, value, tags = {}) {
    const key = this.metricKey(name, tags);
    if (!this.metrics.custom.has(key)) {
      this.metrics.custom.set(key, []);
    }

    const values = this.metrics.custom.get(key);
    values.push({
      timestamp: Date.now(),
      value,
      tags,
    });

    // Keep only recent values
    if (values.length > 1000) {
      values.splice(0, values.length - 1000);
    }

    this.emit('metric:recorded', { name, value, tags });
  }

  /**
   * Get metric statistics
   */
  getMetricStats(name, tags = {}, timeRange = 300000) {
    // 5 minutes default
    const key = this.metricKey(name, tags);
    const values = this.metrics.custom.get(key) || [];
    const cutoff = Date.now() - timeRange;

    const recentValues = values.filter((v) => v.timestamp > cutoff);
    if (recentValues.length === 0) return null;

    const nums = recentValues.map((v) => v.value);
    const sum = nums.reduce((a, b) => a + b, 0);
    const mean = sum / nums.length;

    nums.sort((a, b) => a - b);
    const median = nums[Math.floor(nums.length / 2)];

    const variance = nums.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / nums.length;
    const stdDev = Math.sqrt(variance);

    return {
      name,
      tags,
      count: nums.length,
      mean: Math.round(mean * 100) / 100,
      median: Math.round(median * 100) / 100,
      min: Math.min(...nums),
      max: Math.max(...nums),
      stdDev: Math.round(stdDev * 100) / 100,
      p95: nums[Math.floor(nums.length * 0.95)] || nums[nums.length - 1],
      p99: nums[Math.floor(nums.length * 0.99)] || nums[nums.length - 1],
    };
  }

  /**
   * Get latency percentiles for an operation
   */
  getLatencyPercentiles(operation, timeRange = 300000) {
    const latencies = this.metrics.latency
      .filter((l) => l.operation === operation && l.timestamp > Date.now() - timeRange)
      .map((l) => l.duration);

    if (latencies.length === 0) return null;

    latencies.sort((a, b) => a - b);

    return {
      operation,
      count: latencies.length,
      p50: latencies[Math.floor(latencies.length * 0.5)],
      p95: latencies[Math.floor(latencies.length * 0.95)],
      p99: latencies[Math.floor(latencies.length * 0.99)] || latencies[latencies.length - 1],
      max: latencies[latencies.length - 1],
      min: latencies[0],
    };
  }

  /**
   * Get throughput statistics
   */
  getThroughputStats(operation, timeRange = 300000) {
    const throughputs = this.metrics.throughput
      .filter((t) => t.operation === operation && t.timestamp > Date.now() - timeRange)
      .map((t) => t.rate);

    if (throughputs.length === 0) return null;

    const sum = throughputs.reduce((a, b) => a + b, 0);
    const mean = sum / throughputs.length;

    throughputs.sort((a, b) => a - b);

    return {
      operation,
      count: throughputs.length,
      mean: Math.round(mean * 100) / 100,
      median: throughputs[Math.floor(throughputs.length / 2)],
      p95: throughputs[Math.floor(throughputs.length * 0.95)],
      max: Math.max(...throughputs),
      min: Math.min(...throughputs),
    };
  }

  /**
   * Get system resource usage summary
   */
  getResourceUsage() {
    const now = Date.now();
    const timeRange = 60000; // Last minute

    const recentMemory = this.metrics.memory.filter((m) => m.timestamp > now - timeRange);
    const recentCpu = this.metrics.cpu.filter((c) => c.timestamp > now - timeRange);

    if (recentMemory.length === 0) return null;

    const avgMemoryMB =
      recentMemory.reduce((sum, m) => sum + m.heapUsedMB, 0) / recentMemory.length;
    const maxMemoryMB = Math.max(...recentMemory.map((m) => m.heapUsedMB));

    const avgCpu =
      recentCpu.length > 0 ? recentCpu.reduce((sum, c) => sum + c.total, 0) / recentCpu.length : 0;

    return {
      memory: {
        averageMB: Math.round(avgMemoryMB),
        maxMB: maxMemoryMB,
        usagePercent: Math.round(
          (avgMemoryMB / (process.memoryUsage().heapTotal / 1024 / 1024)) * 100
        ),
      },
      cpu: {
        averageUsage: Math.round(avgCpu / 1000), // Convert to milliseconds
      },
      uptime: process.uptime(),
      timestamp: now,
    };
  }

  /**
   * Export metrics for dashboard
   */
  exportForDashboard() {
    return {
      latency: this.metrics.latency.slice(-100), // Last 100 measurements
      throughput: this.metrics.throughput.slice(-100),
      memory: this.metrics.memory.slice(-50),
      cpu: this.metrics.cpu.slice(-50),
      resourceUsage: this.getResourceUsage(),
      timestamp: Date.now(),
    };
  }

  /**
   * Create metric key for custom metrics
   */
  metricKey(name, tags) {
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return tagString ? `${name}:${tagString}` : name;
  }

  /**
   * Clean up old metrics
   */
  cleanupOldMetrics() {
    const cutoff = Date.now() - this.options.retentionPeriod;

    this.metrics.latency = this.metrics.latency.filter((m) => m.timestamp > cutoff);
    this.metrics.throughput = this.metrics.throughput.filter((m) => m.timestamp > cutoff);
    this.metrics.memory = this.metrics.memory.filter((m) => m.timestamp > cutoff);
    this.metrics.cpu = this.metrics.cpu.filter((m) => m.timestamp > cutoff);

    // Clean up custom metrics
    for (const [key, values] of this.metrics.custom) {
      const filtered = values.filter((v) => v.timestamp > cutoff);
      if (filtered.length === 0) {
        this.metrics.custom.delete(key);
      } else {
        this.metrics.custom.set(key, filtered);
      }
    }
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = {
      latency: [],
      throughput: [],
      memory: [],
      cpu: [],
      custom: new Map(),
    };

    this.logger.info('Performance metrics reset');
  }
}

export { PerformanceMetrics };
export default PerformanceMetrics;
