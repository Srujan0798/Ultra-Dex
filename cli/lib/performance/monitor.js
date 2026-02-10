// Copyright (c) 2026 Ultra-Dex

/**
 * Ultra-Dex Performance Monitoring System
 * Advanced performance tracking, profiling, and optimization
 */

import { performance } from 'perf_hooks';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';

// Performance configuration
const PERF_MONITOR_CONFIG = {
  samplingInterval: 1000, // 1 second
  maxSamples: 10000, // Maximum samples to keep in memory
  logRetentionDays: 30,
  metricsCollection: {
    cpu: true,
    memory: true,
    disk: true,
    network: true,
    custom: true
  },
  alertThresholds: {
    cpu: 80, // percentage
    memory: 85, // percentage
    disk: 90, // percentage
    responseTime: 5000 // milliseconds
  }
};

// Performance metrics collector
class MetricsCollector {
  constructor() {
    this.metrics = {
      cpu: [],
      memory: [],
      disk: [],
      network: [],
      custom: [],
      events: []
    };
    this.aggregatedMetrics = {
      cpuAvg: 0,
      memoryAvg: 0,
      peakMemory: 0,
      avgResponseTime: 0,
      totalRequests: 0,
      errorRate: 0
    };
    this.startTime = Date.now();
    this.isCollecting = false;
  }

  // Start collecting metrics
  startCollection() {
    if (this.isCollecting) return;
    this.isCollecting = true;

    // Collect system metrics periodically
    this.collectionInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.trimMetrics();
    }, PERF_MONITOR_CONFIG.samplingInterval);
  }

  // Stop collecting metrics
  stopCollection() {
    if (!this.isCollecting) return;
    this.isCollecting = false;
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }
  }

  // Collect system metrics
  collectSystemMetrics() {
    const timestamp = Date.now();
    
    // CPU metrics
    if (PERF_MONITOR_CONFIG.metricsCollection.cpu) {
      const cpus = os.cpus();
      const cpuUsage = process.cpuUsage();
      const cpuPercent = this.calculateCpuPercent(cpuUsage);
      
      this.metrics.cpu.push({
        timestamp,
        usage: cpuPercent,
        count: cpus.length,
        model: cpus[0]?.model
      });
    }

    // Memory metrics
    if (PERF_MONITOR_CONFIG.metricsCollection.memory) {
      const memoryUsage = process.memoryUsage();
      const systemMemory = {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
      };

      this.metrics.memory.push({
        timestamp,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
        system: systemMemory
      });

      // Update aggregated metrics
      if (memoryUsage.heapUsed > this.aggregatedMetrics.peakMemory) {
        this.aggregatedMetrics.peakMemory = memoryUsage.heapUsed;
      }
    }

    // Disk metrics (simplified)
    if (PERF_MONITOR_CONFIG.metricsCollection.disk) {
      this.metrics.disk.push({
        timestamp,
        free: os.freemem(),
        total: os.totalmem(),
        usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
      });
    }

    // Update averages
    this.updateAverages();
  }

  // Calculate CPU percentage
  calculateCpuPercent(startUsage) {
    const endUsage = process.cpuUsage();
    const elapsed = process.hrtime();
    const elapsedMicro = elapsed[0] * 1e6 + elapsed[1] / 1e3;
    
    const userDiff = endUsage.user - startUsage.user;
    const systemDiff = endUsage.system - startUsage.system;
    
    return ((userDiff + systemDiff) / elapsedMicro) * 100;
  }

  // Update aggregated metrics
  updateAverages() {
    // Calculate CPU average
    if (this.metrics.cpu.length > 0) {
      const cpuSum = this.metrics.cpu.reduce((sum, sample) => sum + sample.usage, 0);
      this.aggregatedMetrics.cpuAvg = cpuSum / this.metrics.cpu.length;
    }

    // Calculate memory average
    if (this.metrics.memory.length > 0) {
      const memSum = this.metrics.memory.reduce((sum, sample) => sum + sample.system.usagePercent, 0);
      this.aggregatedMetrics.memoryAvg = memSum / this.metrics.memory.length;
    }
  }

  // Record custom event
  recordEvent(eventType, metadata = {}) {
    this.metrics.events.push({
      timestamp: Date.now(),
      type: eventType,
      metadata
    });
  }

  // Record custom metric
  recordCustomMetric(name, value, unit = 'count') {
    this.metrics.custom.push({
      timestamp: Date.now(),
      name,
      value,
      unit
    });
  }

  // Record response time
  recordResponseTime(duration, endpoint = 'unknown') {
    this.recordCustomMetric(`response_time_${endpoint}`, duration, 'ms');
    this.aggregatedMetrics.totalRequests++;
    this.aggregatedMetrics.avgResponseTime = 
      ((this.aggregatedMetrics.avgResponseTime * (this.aggregatedMetrics.totalRequests - 1)) + duration) / 
      this.aggregatedMetrics.totalRequests;
  }

  // Record error
  recordError(errorType = 'unknown') {
    this.recordCustomMetric(`error_${errorType}`, 1, 'count');
    this.aggregatedMetrics.errorRate = 
      (this.metrics.custom.filter(m => m.name.startsWith('error_')).length / 
       this.aggregatedMetrics.totalRequests) * 100;
  }

  // Trim metrics to prevent memory overflow
  trimMetrics() {
    const maxSamples = PERF_MONITOR_CONFIG.maxSamples;
    
    for (const key in this.metrics) {
      if (this.metrics[key].length > maxSamples) {
        this.metrics[key] = this.metrics[key].slice(-maxSamples);
      }
    }
  }

  // Get current metrics snapshot
  getMetricsSnapshot() {
    return {
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
      system: {
        platform: os.platform(),
        arch: os.arch(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        loadAverage: os.loadavg(),
        cpuCount: os.cpus().length,
      },
      aggregated: this.aggregatedMetrics,
      recent: {
        cpu: this.metrics.cpu.slice(-50),
        memory: this.metrics.memory.slice(-50),
        events: this.metrics.events.slice(-20),
        custom: this.metrics.custom.slice(-50)
      }
    };
  }

  // Export metrics to file
  async exportMetrics(filename = `ultra-dex-metrics-${Date.now()}.json`) {
    const metrics = this.getMetricsSnapshot();
    const metricsPath = path.join(process.cwd(), '.ultra-dex', 'metrics', filename);
    
    try {
      // Ensure metrics directory exists
      await fs.mkdir(path.dirname(metricsPath), { recursive: true });
      
      // Write metrics to file
      await fs.writeFile(metricsPath, JSON.stringify(metrics, null, 2));
      
      return metricsPath;
    } catch (error) {
      console.error('Failed to export metrics:', error);
      throw error;
    }
  }

  // Get performance insights
  getInsights() {
    const snapshot = this.getMetricsSnapshot();
    const insights = [];

    // CPU insights
    if (snapshot.aggregated.cpuAvg > 70) {
      insights.push({
        type: 'warning',
        category: 'cpu',
        message: `High average CPU usage: ${snapshot.aggregated.cpuAvg.toFixed(2)}%`,
        recommendation: 'Consider optimizing algorithms or adding caching'
      });
    }

    // Memory insights
    if (snapshot.aggregated.memoryAvg > 80) {
      insights.push({
        type: 'warning',
        category: 'memory',
        message: `High average memory usage: ${snapshot.aggregated.memoryAvg.toFixed(2)}%`,
        recommendation: 'Review memory-intensive operations and implement garbage collection'
      });
    }

    if (snapshot.aggregated.peakMemory > 1e9) { // > 1GB
      insights.push({
        type: 'alert',
        category: 'memory',
        message: `High peak memory usage: ${(snapshot.aggregated.peakMemory / 1e6).toFixed(2)} MB`,
        recommendation: 'Investigate memory leaks and optimize data structures'
      });
    }

    // Response time insights
    if (snapshot.aggregated.avgResponseTime > 2000) {
      insights.push({
        type: 'warning',
        category: 'performance',
        message: `Slow average response time: ${snapshot.aggregated.avgResponseTime.toFixed(2)}ms`,
        recommendation: 'Optimize database queries and implement caching strategies'
      });
    }

    // Error rate insights
    if (snapshot.aggregated.errorRate > 5) {
      insights.push({
        type: 'alert',
        category: 'stability',
        message: `High error rate: ${snapshot.aggregated.errorRate.toFixed(2)}%`,
        recommendation: 'Review error handling and investigate root causes'
      });
    }

    return {
      timestamp: Date.now(),
      insights,
      summary: {
        cpuHealth: snapshot.aggregated.cpuAvg < 70 ? 'good' : 'concerning',
        memoryHealth: snapshot.aggregated.memoryAvg < 80 ? 'good' : 'concerning',
        performanceHealth: snapshot.aggregated.avgResponseTime < 2000 ? 'good' : 'concerning',
        stabilityHealth: snapshot.aggregated.errorRate < 5 ? 'good' : 'concerning'
      }
    };
  }
}

// Performance profiler with detailed analysis
class PerformanceProfiler {
  constructor() {
    this.measurements = new Map();
    this.markers = new Map();
  }

  // Start measuring a function
  async measure(label, fn) {
    const start = performance.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    try {
      const result = await fn();
      const end = performance.now();
      const endMemory = process.memoryUsage().heapUsed;
      
      const measurement = {
        label,
        startTime: start,
        endTime: end,
        duration: end - start,
        memoryBefore: startMemory,
        memoryAfter: endMemory,
        memoryDelta: endMemory - startMemory,
        timestamp: Date.now()
      };
      
      // Store measurement
      if (!this.measurements.has(label)) {
        this.measurements.set(label, []);
      }
      this.measurements.get(label).push(measurement);
      
      // Keep only last 100 measurements per label
      const measurements = this.measurements.get(label);
      if (measurements.length > 100) {
        this.measurements.set(label, measurements.slice(-100));
      }
      
      return result;
    } catch (error) {
      const end = performance.now();
      const endMemory = process.memoryUsage().heapUsed;
      
      const measurement = {
        label,
        startTime: start,
        endTime: end,
        duration: end - start,
        memoryBefore: startMemory,
        memoryAfter: endMemory,
        memoryDelta: endMemory - startMemory,
        error: error.message,
        timestamp: Date.now()
      };
      
      if (!this.measurements.has(label)) {
        this.measurements.set(label, []);
      }
      this.measurements.get(label).push(measurement);
      
      throw error;
    }
  }

  // Mark a point in time
  mark(label) {
    this.markers.set(label, {
      label,
      timestamp: performance.now(),
      wallTime: Date.now()
    });
  }

  // Calculate time between marks
  measureBetween(startMark, endMark) {
    const start = this.markers.get(startMark);
    const end = this.markers.get(endMark);
    
    if (!start || !end) {
      throw new Error(`Missing mark: ${!start ? startMark : endMark}`);
    }
    
    return end.timestamp - start.timestamp;
  }

  // Get performance report for a label
  getReport(label) {
    const measurements = this.measurements.get(label) || [];
    
    if (measurements.length === 0) {
      return null;
    }
    
    const durations = measurements.map(m => m.duration);
    const memoryDeltas = measurements.map(m => m.memoryDelta);
    
    const stats = {
      label,
      count: measurements.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      median: durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)],
      memory: {
        min: Math.min(...memoryDeltas),
        max: Math.max(...memoryDeltas),
        avg: memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length,
      },
      errors: measurements.filter(m => m.error).length,
      errorRate: (measurements.filter(m => m.error).length / measurements.length) * 100
    };
    
    return stats;
  }

  // Get all reports
  getAllReports() {
    const reports = {};
    for (const [label] of this.measurements) {
      reports[label] = this.getReport(label);
    }
    return reports;
  }

  // Export profiling data
  async exportProfilingData(filename = `ultra-dex-profiling-${Date.now()}.json`) {
    const profilingPath = path.join(process.cwd(), '.ultra-dex', 'profiling', filename);
    
    try {
      await fs.mkdir(path.dirname(profilingPath), { recursive: true });
      
      const data = {
        timestamp: Date.now(),
        measurements: Object.fromEntries(this.measurements),
        markers: Object.fromEntries(this.markers),
        reports: this.getAllReports()
      };
      
      await fs.writeFile(profilingPath, JSON.stringify(data, null, 2));
      return profilingPath;
    } catch (error) {
      console.error('Failed to export profiling data:', error);
      throw error;
    }
  }
}

// Alert manager for performance thresholds
class AlertManager {
  constructor(thresholds = PERF_MONITOR_CONFIG.alertThresholds) {
    this.thresholds = thresholds;
    this.alerts = [];
    this.callbacks = new Map();
  }

  // Register an alert callback
  onAlert(type, callback) {
    if (!this.callbacks.has(type)) {
      this.callbacks.set(type, []);
    }
    this.callbacks.get(type).push(callback);
  }

  // Check metrics against thresholds and trigger alerts
  checkAlerts(metrics) {
    const newAlerts = [];

    // CPU alert
    if (metrics.aggregated?.cpuAvg > this.thresholds.cpu) {
      const alert = {
        id: `cpu-${Date.now()}`,
        type: 'cpu-high',
        severity: 'warning',
        message: `CPU usage is high: ${metrics.aggregated.cpuAvg.toFixed(2)}%`,
        threshold: this.thresholds.cpu,
        currentValue: metrics.aggregated.cpuAvg,
        timestamp: Date.now()
      };
      newAlerts.push(alert);
      this.triggerCallbacks('cpu-high', alert);
    }

    // Memory alert
    if (metrics.aggregated?.memoryAvg > this.thresholds.memory) {
      const alert = {
        id: `memory-${Date.now()}`,
        type: 'memory-high',
        severity: 'warning',
        message: `Memory usage is high: ${metrics.aggregated.memoryAvg.toFixed(2)}%`,
        threshold: this.thresholds.memory,
        currentValue: metrics.aggregated.memoryAvg,
        timestamp: Date.now()
      };
      newAlerts.push(alert);
      this.triggerCallbacks('memory-high', alert);
    }

    // Response time alert
    if (metrics.aggregated?.avgResponseTime > this.thresholds.responseTime) {
      const alert = {
        id: `response-${Date.now()}`,
        type: 'response-slow',
        severity: 'warning',
        message: `Response time is slow: ${metrics.aggregated.avgResponseTime.toFixed(2)}ms`,
        threshold: this.thresholds.responseTime,
        currentValue: metrics.aggregated.avgResponseTime,
        timestamp: Date.now()
      };
      newAlerts.push(alert);
      this.triggerCallbacks('response-slow', alert);
    }

    // Add new alerts to the list
    this.alerts.push(...newAlerts);
    
    // Keep only recent alerts (last 1000)
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    return newAlerts;
  }

  // Trigger callbacks for an alert type
  triggerCallbacks(type, alert) {
    const callbacks = this.callbacks.get(type) || [];
    for (const callback of callbacks) {
      try {
        callback(alert);
      } catch (error) {
        console.error(`Error in alert callback for ${type}:`, error);
      }
    }
  }

  // Get recent alerts
  getRecentAlerts(hours = 24) {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.alerts.filter(alert => alert.timestamp > cutoff);
  }

  // Clear alerts older than specified hours
  clearOldAlerts(hours = 24) {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff);
  }
}

// Main Performance Monitoring System
class UltraDexPerformanceMonitor {
  constructor() {
    this.metricsCollector = new MetricsCollector();
    this.profiler = new PerformanceProfiler();
    this.alertManager = new AlertManager();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    // Start metrics collection
    this.metricsCollector.startCollection();
    
    // Set up alert monitoring
    this.alertInterval = setInterval(() => {
      const metrics = this.metricsCollector.getMetricsSnapshot();
      this.alertManager.checkAlerts(metrics);
    }, PERF_MONITOR_CONFIG.samplingInterval * 5); // Check every 5 seconds
    
    this.isInitialized = true;
  }

  async shutdown() {
    if (!this.isInitialized) return;
    
    this.metricsCollector.stopCollection();
    if (this.alertInterval) {
      clearInterval(this.alertInterval);
    }
    
    this.isInitialized = false;
  }

  // Convenience methods that delegate to internal components
  measure(label, fn) {
    return this.profiler.measure(label, fn);
  }

  mark(label) {
    this.profiler.mark(label);
  }

  measureBetween(startMark, endMark) {
    return this.profiler.measureBetween(startMark, endMark);
  }

  getReport(label) {
    return this.profiler.getReport(label);
  }

  getAllReports() {
    return this.profiler.getAllReports();
  }

  recordEvent(eventType, metadata = {}) {
    this.metricsCollector.recordEvent(eventType, metadata);
  }

  recordCustomMetric(name, value, unit = 'count') {
    this.metricsCollector.recordCustomMetric(name, value, unit);
  }

  recordResponseTime(duration, endpoint = 'unknown') {
    this.metricsCollector.recordResponseTime(duration, endpoint);
  }

  recordError(errorType = 'unknown') {
    this.metricsCollector.recordError(errorType);
  }

  getMetricsSnapshot() {
    return this.metricsCollector.getMetricsSnapshot();
  }

  getInsights() {
    return this.metricsCollector.getInsights();
  }

  async exportMetrics(filename) {
    return this.metricsCollector.exportMetrics(filename);
  }

  async exportProfilingData(filename) {
    return this.profiler.exportProfilingData(filename);
  }

  onAlert(type, callback) {
    this.alertManager.onAlert(type, callback);
  }

  getRecentAlerts(hours) {
    return this.alertManager.getRecentAlerts(hours);
  }

  // Performance optimization utilities
  async runOptimized(task, options = {}) {
    const {
      maxRetries = 3,
      timeout = 30000,
      circuitBreaker = true,
      fallback = null
    } = options;

    // Implement circuit breaker pattern
    if (circuitBreaker && this.isCircuitOpen(task.name)) {
      if (fallback) {
        return this.measure(`${task.name}-fallback`, fallback);
      }
      throw new Error(`Circuit breaker open for ${task.name}`);
    }

    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Add timeout protection
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const result = await this.measure(task.name, async () => {
          if (controller.signal.aborted) {
            throw new Error(`Task ${task.name} timed out after ${timeout}ms`);
          }
          return await task.fn();
        });

        clearTimeout(timeoutId);
        
        // Reset circuit breaker on success
        this.resetCircuit(task.name);
        
        return result;
      } catch (error) {
        lastError = error;
        clearTimeout(timeoutId);

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10 seconds
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // If all retries failed, trip the circuit breaker
    if (circuitBreaker) {
      this.tripCircuit(task.name, lastError);
    }

    throw lastError;
  }

  // Circuit breaker state management
  isCircuitOpen(taskName) {
    // Simplified circuit breaker - in a real implementation, you'd track state
    return false;
  }

  tripCircuit(taskName, error) {
    // Trip the circuit for this task
    console.warn(`Tripped circuit breaker for ${taskName}:`, error.message);
  }

  resetCircuit(taskName) {
    // Reset the circuit for this task
  }
}

// Global performance monitor instance
export const perfMonitor = new UltraDexPerformanceMonitor();

// Export for use in other modules
export default perfMonitor;

// Export individual components for advanced usage
export {
  MetricsCollector,
  PerformanceProfiler,
  AlertManager,
  UltraDexPerformanceMonitor
};