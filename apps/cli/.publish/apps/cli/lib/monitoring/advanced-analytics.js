// Copyright (c) 2026 Ultra-Dex

/**
 * Advanced Analytics & Monitoring v6.0
 * Real-time insights, predictive alerts, and comprehensive metrics
 */

import EventEmitter from 'events';

/**
 * Metrics Collector
 */
export class MetricsCollector extends EventEmitter {
  constructor(options = {}) {
    super();
    this.buffer = [];
    this.maxBufferSize = options.maxBufferSize || 10000;
    this.flushInterval = options.flushInterval || 5000;
    this.aggregates = new Map();
    this.dimensions = new Set(options.dimensions || []);
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);

    this.emit('started');
  }

  stop() {
    this.isRunning = false;
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush(); // Final flush
    this.emit('stopped');
  }

  record(metric) {
    const enriched = {
      ...metric,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9),
    };

    this.buffer.push(enriched);

    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }

    // Update real-time aggregates
    this.updateAggregates(enriched);
  }

  updateAggregates(metric) {
    const key = metric.name;

    if (!this.aggregates.has(key)) {
      this.aggregates.set(key, {
        count: 0,
        sum: 0,
        min: Infinity,
        max: -Infinity,
        avg: 0,
        last: 0,
        values: [],
      });
    }

    const agg = this.aggregates.get(key);
    const value = metric.value;

    agg.count++;
    agg.sum += value;
    agg.min = Math.min(agg.min, value);
    agg.max = Math.max(agg.max, value);
    agg.avg = agg.sum / agg.count;
    agg.last = value;
    agg.values.push(value);

    // Keep last 1000 values for percentiles
    if (agg.values.length > 1000) {
      agg.values.shift();
    }
  }

  flush() {
    if (this.buffer.length === 0) return;

    const batch = [...this.buffer];
    this.buffer = [];

    this.emit('flush', batch);
  }

  getAggregate(name) {
    return this.aggregates.get(name);
  }

  getAllAggregates() {
    const result = {};
    for (const [name, agg] of this.aggregates) {
      result[name] = { ...agg };
      delete result[name].values; // Don't expose raw values
    }
    return result;
  }

  getPercentile(name, percentile) {
    const agg = this.aggregates.get(name);
    if (!agg || agg.values.length === 0) return null;

    const sorted = [...agg.values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
}

/**
 * Predictive Alert System
 */
export class PredictiveAlertSystem extends EventEmitter {
  constructor(metricsCollector) {
    super();
    this.metrics = metricsCollector;
    this.rules = [];
    this.predictions = new Map();
    this.alertHistory = [];
  }

  addRule(config) {
    this.rules.push({
      name: config.name,
      metric: config.metric,
      condition: config.condition,
      threshold: config.threshold,
      duration: config.duration || 0,
      severity: config.severity || 'warning',
      predictionWindow: config.predictionWindow || 300000, // 5 minutes
    });
  }

  async evaluate() {
    for (const rule of this.rules) {
      const aggregate = this.metrics.getAggregate(rule.metric);
      if (!aggregate) continue;

      const currentValue = aggregate.last;
      const triggered = this.checkCondition(currentValue, rule);

      if (triggered) {
        // Check if this is a new alert
        const alertKey = `${rule.name}:${rule.metric}`;
        const lastAlert = this.alertHistory.find((a) => a.key === alertKey);

        if (!lastAlert || Date.now() - lastAlert.timestamp > rule.duration) {
          const alert = {
            key: alertKey,
            rule: rule.name,
            metric: rule.metric,
            value: currentValue,
            threshold: rule.threshold,
            severity: rule.severity,
            timestamp: Date.now(),
            predicted: false,
          };

          this.alertHistory.push(alert);
          this.emit('alert', alert);
        }
      }

      // Predict future alerts
      await this.predictAlert(rule, aggregate);
    }
  }

  checkCondition(value, rule) {
    switch (rule.condition) {
      case 'gt':
        return value > rule.threshold;
      case 'gte':
        return value >= rule.threshold;
      case 'lt':
        return value < rule.threshold;
      case 'lte':
        return value <= rule.threshold;
      case 'eq':
        return value === rule.threshold;
      default:
        return false;
    }
  }

  async predictAlert(rule, aggregate) {
    if (aggregate.values.length < 10) return;

    // Simple linear regression for prediction
    const values = aggregate.values.slice(-20);
    const trend = this.calculateTrend(values);

    if (trend === 0) return;

    const currentValue = aggregate.last;
    const timeToThreshold = (rule.threshold - currentValue) / trend;

    if (timeToThreshold > 0 && timeToThreshold < rule.predictionWindow) {
      const prediction = {
        rule: rule.name,
        metric: rule.metric,
        currentValue,
        threshold: rule.threshold,
        predictedTime: Date.now() + timeToThreshold,
        timeToThreshold,
        confidence: this.calculateConfidence(values),
      };

      this.predictions.set(rule.name, prediction);
      this.emit('prediction', prediction);
    }
  }

  calculateTrend(values) {
    const n = values.length;
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  calculateConfidence(values) {
    const variance = this.calculateVariance(values);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const cv = Math.sqrt(variance) / mean; // Coefficient of variation

    // Lower CV = higher confidence
    return Math.max(0, Math.min(1, 1 - cv));
  }

  calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  getPredictions() {
    return Array.from(this.predictions.values());
  }

  getAlerts(limit = 50) {
    return this.alertHistory.slice(-limit);
  }
}

/**
 * Performance Profiler
 */
export class PerformanceProfiler extends EventEmitter {
  constructor() {
    super();
    this.profiles = new Map();
    this.activeProfiles = new Map();
  }

  startProfile(name, metadata = {}) {
    const profile = {
      name,
      startTime: Date.now(),
      startMemory: process.memoryUsage(),
      startCPU: process.cpuUsage(),
      metadata,
      marks: [],
    };

    this.activeProfiles.set(name, profile);
    return profile;
  }

  mark(profileName, markName) {
    const profile = this.activeProfiles.get(profileName);
    if (!profile) return;

    profile.marks.push({
      name: markName,
      time: Date.now(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(profile.startCPU),
    });
  }

  endProfile(name) {
    const profile = this.activeProfiles.get(name);
    if (!profile) return null;

    profile.endTime = Date.now();
    profile.endMemory = process.memoryUsage();
    profile.endCPU = process.cpuUsage(profile.startCPU);

    // Calculate metrics
    profile.duration = profile.endTime - profile.startTime;
    profile.memoryDelta = {
      heapUsed: profile.endMemory.heapUsed - profile.startMemory.heapUsed,
      external: profile.endMemory.external - profile.startMemory.external,
    };
    profile.cpuTime = {
      user: profile.endCPU.user,
      system: profile.endCPU.system,
    };

    this.profiles.set(name, profile);
    this.activeProfiles.delete(name);

    this.emit('profile:complete', profile);
    return profile;
  }

  getProfile(name) {
    return this.profiles.get(name);
  }

  getAllProfiles() {
    return Array.from(this.profiles.values());
  }

  getTopSlowProfiles(limit = 10) {
    return this.getAllProfiles()
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  analyzeBottlenecks() {
    const profiles = this.getAllProfiles();
    const analysis = {
      slowOperations: [],
      memoryLeaks: [],
      cpuIntensive: [],
    };

    for (const profile of profiles) {
      if (profile.duration > 1000) {
        analysis.slowOperations.push({
          name: profile.name,
          duration: profile.duration,
          suggestion: 'Consider optimization or caching',
        });
      }

      if (profile.memoryDelta.heapUsed > 100 * 1024 * 1024) {
        // 100MB
        analysis.memoryLeaks.push({
          name: profile.name,
          memoryIncrease: profile.memoryDelta.heapUsed,
          suggestion: 'Check for memory leaks',
        });
      }

      const totalCPUTime = profile.cpuTime.user + profile.cpuTime.system;
      if (totalCPUTime > 1000000) {
        // 1 second
        analysis.cpuIntensive.push({
          name: profile.name,
          cpuTime: totalCPUTime,
          suggestion: 'Consider async processing or worker threads',
        });
      }
    }

    return analysis;
  }
}

/**
 * Real-time Dashboard Data Provider
 */
export class DashboardDataProvider extends EventEmitter {
  constructor(metricsCollector, alertSystem, profiler) {
    super();
    this.metrics = metricsCollector;
    this.alerts = alertSystem;
    this.profiler = profiler;
    this.subscribers = new Map();
  }

  subscribe(clientId, channels) {
    this.subscribers.set(clientId, { channels, socket: null });
  }

  unsubscribe(clientId) {
    this.subscribers.delete(clientId);
  }

  broadcast(channel, data) {
    for (const [clientId, sub] of this.subscribers) {
      if (sub.channels.includes(channel) || sub.channels.includes('all')) {
        this.emit('data', { clientId, channel, data });
      }
    }
  }

  getSnapshot() {
    return {
      timestamp: Date.now(),
      metrics: this.metrics.getAllAggregates(),
      alerts: this.alerts.getAlerts(10),
      predictions: this.alerts.getPredictions(),
      profiles: this.profiler.getTopSlowProfiles(5),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
    };
  }

  startRealtimeUpdates(interval = 1000) {
    this.updateTimer = setInterval(() => {
      const snapshot = this.getSnapshot();
      this.broadcast('snapshot', snapshot);
    }, interval);
  }

  stopRealtimeUpdates() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }
}

/**
 * Analytics Engine
 */
export class AnalyticsEngine extends EventEmitter {
  constructor() {
    super();
    this.events = [];
    this.maxEvents = 100000;
  }

  track(event) {
    this.events.push({
      ...event,
      timestamp: Date.now(),
    });

    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  query(filters = {}) {
    let results = [...this.events];

    if (filters.eventType) {
      results = results.filter((e) => e.type === filters.eventType);
    }

    if (filters.startTime) {
      results = results.filter((e) => e.timestamp >= filters.startTime);
    }

    if (filters.endTime) {
      results = results.filter((e) => e.timestamp <= filters.endTime);
    }

    if (filters.limit) {
      results = results.slice(-filters.limit);
    }

    return results;
  }

  aggregate(groupBy, metric) {
    const groups = {};

    for (const event of this.events) {
      const key = event[groupBy];
      if (!groups[key]) {
        groups[key] = { count: 0, sum: 0, values: [] };
      }

      const value = event[metric] || 1;
      groups[key].count++;
      groups[key].sum += value;
      groups[key].values.push(value);
    }

    // Calculate averages
    for (const key in groups) {
      groups[key].avg = groups[key].sum / groups[key].count;
    }

    return groups;
  }

  funnel(steps) {
    const funnel = [];
    let currentSet = new Set(this.events.map((e) => e.sessionId).filter(Boolean));

    for (const step of steps) {
      const stepEvents = this.events.filter((e) => e.type === step && currentSet.has(e.sessionId));

      const stepSessions = new Set(stepEvents.map((e) => e.sessionId));

      funnel.push({
        step,
        count: stepSessions.size,
        conversion:
          funnel.length > 0
            ? ((stepSessions.size / funnel[funnel.length - 1].count) * 100).toFixed(2) + '%'
            : '100%',
      });

      currentSet = stepSessions;
    }

    return funnel;
  }
}

export default {
  MetricsCollector,
  PredictiveAlertSystem,
  PerformanceProfiler,
  DashboardDataProvider,
  AnalyticsEngine,
};
