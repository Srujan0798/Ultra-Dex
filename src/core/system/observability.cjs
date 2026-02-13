/**
 * Observability System
 * Full tracing, monitoring, and debugging for Ultra-Dex
 *
 * @module Observability
 * @version 1.0.0
 */

const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

class ObservabilitySystem extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      logPath: config.logPath || './data/observability',
      maxTraces: config.maxTraces || 10000,
      retentionDays: config.retentionDays || 30,
      sampleRate: config.sampleRate || 1.0,
      enableConsole: config.enableConsole !== false,
      ...config,
    };

    this.traces = [];
    this.spans = new Map();
    this.metrics = new Map();
    this.alerts = [];
    this.dashboard = {
      requests: 0,
      errors: 0,
      latency: [],
      activeSessions: 0,
    };

    this.initialized = false;
  }

  /**
   * Initialize observability system
   */
  async initialize() {
    // Create log directory
    await fs.mkdir(this.config.logPath, { recursive: true });

    // Start metrics collection
    this._startMetricsCollection();

    // Start cleanup job
    this._startCleanupJob();

    this.initialized = true;
    this.emit('initialized');
    return true;
  }

  /**
   * Start a new trace
   * @param {string} name - Trace name
   * @param {Object} context - Trace context
   * @returns {Object} Trace object
   */
  startTrace(name, context = {}) {
    this._ensureInitialized();

    const traceId = this._generateTraceId();
    const trace = {
      id: traceId,
      name,
      context,
      startedAt: Date.now(),
      spans: [],
      status: 'running',
      tags: context.tags || {},
    };

    this.traces.push(trace);

    // Limit trace storage
    if (this.traces.length > this.config.maxTraces) {
      this.traces = this.traces.slice(-this.config.maxTraces);
    }

    this.emit('trace:started', { traceId, name });

    return trace;
  }

  /**
   * Start a span within a trace
   * @param {string} traceId - Trace ID
   * @param {string} name - Span name
   * @param {Object} context - Span context
   * @returns {Object} Span object
   */
  startSpan(traceId, name, context = {}) {
    const trace = this.traces.find((t) => t.id === traceId);
    if (!trace) return null;

    const spanId = this._generateSpanId();
    const span = {
      id: spanId,
      traceId,
      name,
      context,
      startedAt: Date.now(),
      endedAt: null,
      duration: null,
      status: 'running',
      events: [],
      tags: context.tags || {},
    };

    this.spans.set(spanId, span);
    trace.spans.push(span);

    return span;
  }

  /**
   * End a span
   * @param {string} spanId - Span ID
   * @param {Object} result - Span result
   */
  endSpan(spanId, result = {}) {
    const span = this.spans.get(spanId);
    if (!span) return;

    span.endedAt = Date.now();
    span.duration = span.endedAt - span.startedAt;
    span.status = result.error ? 'error' : 'success';
    span.result = result;

    this.spans.delete(spanId);

    this.emit('span:ended', { spanId, duration: span.duration });
  }

  /**
   * End a trace
   * @param {string} traceId - Trace ID
   * @param {Object} result - Trace result
   */
  async endTrace(traceId, result = {}) {
    const trace = this.traces.find((t) => t.id === traceId);
    if (!trace) return;

    trace.endedAt = Date.now();
    trace.duration = trace.endedAt - trace.startedAt;
    trace.status = result.error ? 'error' : 'success';
    trace.result = result;

    // Update dashboard
    this.dashboard.requests++;
    this.dashboard.latency.push(trace.duration);
    if (result.error) this.dashboard.errors++;

    // Keep only last 1000 latencies
    if (this.dashboard.latency.length > 1000) {
      this.dashboard.latency = this.dashboard.latency.slice(-1000);
    }

    // Persist trace
    await this._persistTrace(trace);

    this.emit('trace:ended', { traceId, duration: trace.duration });
  }

  /**
   * Add event to span
   * @param {string} spanId - Span ID
   * @param {string} name - Event name
   * @param {Object} data - Event data
   */
  addEvent(spanId, name, data = {}) {
    const span = this.spans.get(spanId);
    if (!span) return;

    span.events.push({
      name,
      timestamp: Date.now(),
      data,
    });
  }

  /**
   * Record a metric
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {Object} tags - Metric tags
   */
  recordMetric(name, value, tags = {}) {
    const key = this._metricKey(name, tags);

    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        name,
        tags,
        values: [],
        count: 0,
        sum: 0,
        min: Infinity,
        max: -Infinity,
      });
    }

    const metric = this.metrics.get(key);
    metric.values.push({ value, timestamp: Date.now() });
    metric.count++;
    metric.sum += value;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);

    // Keep only recent values
    if (metric.values.length > 1000) {
      metric.values = metric.values.slice(-1000);
    }
  }

  /**
   * Log an event
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} context - Log context
   */
  log(level, message, context = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      service: context.service || 'ultra-dex',
    };

    if (this.config.enableConsole) {
      const colors = {
        debug: '\x1b[36m',
        info: '\x1b[32m',
        warn: '\x1b[33m',
        error: '\x1b[31m',
      };

      console.log(
        `${colors[level] || ''}[${entry.timestamp}] ${level.toUpperCase()}: ${message}\x1b[0m`
      );
    }

    this.emit('log', entry);
  }

  /**
   * Create an alert
   * @param {string} name - Alert name
   * @param {string} severity - Alert severity
   * @param {Object} data - Alert data
   */
  createAlert(name, severity, data = {}) {
    const alert = {
      id: this._generateAlertId(),
      name,
      severity, // 'critical', 'high', 'medium', 'low'
      data,
      createdAt: new Date().toISOString(),
      acknowledged: false,
    };

    this.alerts.push(alert);

    // Keep only recent alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    this.emit('alert', alert);

    return alert;
  }

  /**
   * Get trace by ID
   * @param {string} traceId - Trace ID
   * @returns {Object|null} Trace
   */
  getTrace(traceId) {
    return this.traces.find((t) => t.id === traceId) || null;
  }

  /**
   * Get recent traces
   * @param {number} limit - Number of traces
   * @returns {Array<Object>} Recent traces
   */
  getRecentTraces(limit = 100) {
    return this.traces.slice(-limit);
  }

  /**
   * Get traces by tag
   * @param {string} tag - Tag to filter by
   * @returns {Array<Object>} Matching traces
   */
  getTracesByTag(tag) {
    return this.traces.filter((t) => t.tags && t.tags[tag]);
  }

  /**
   * Get metric statistics
   * @param {string} name - Metric name
   * @param {Object} tags - Metric tags
   * @returns {Object} Statistics
   */
  getMetricStats(name, tags = {}) {
    const key = this._metricKey(name, tags);
    const metric = this.metrics.get(key);

    if (!metric) return null;

    return {
      name: metric.name,
      count: metric.count,
      average: metric.sum / metric.count,
      min: metric.min,
      max: metric.max,
      tags: metric.tags,
    };
  }

  /**
   * Get dashboard data
   * @returns {Object} Dashboard data
   */
  getDashboard() {
    const latencies = this.dashboard.latency;
    const avgLatency =
      latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;

    const p95Latency =
      latencies.length > 0
        ? latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)]
        : 0;

    const errorRate =
      this.dashboard.requests > 0
        ? ((this.dashboard.errors / this.dashboard.requests) * 100).toFixed(2)
        : 0;

    return {
      ...this.dashboard,
      averageLatency: Math.round(avgLatency),
      p95Latency,
      errorRate: `${errorRate}%`,
      activeTraces: this.traces.filter((t) => t.status === 'running').length,
      activeSpans: this.spans.size,
      unacknowledgedAlerts: this.alerts.filter((a) => !a.acknowledged).length,
    };
  }

  /**
   * Get all alerts
   * @param {Object} filters - Filter options
   * @returns {Array<Object>} Alerts
   */
  getAlerts(filters = {}) {
    let alerts = this.alerts;

    if (filters.severity) {
      alerts = alerts.filter((a) => a.severity === filters.severity);
    }

    if (filters.acknowledged !== undefined) {
      alerts = alerts.filter((a) => a.acknowledged === filters.acknowledged);
    }

    return alerts;
  }

  /**
   * Acknowledge an alert
   * @param {string} alertId - Alert ID
   */
  acknowledgeAlert(alertId) {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
    }
  }

  /**
   * Generate execution report
   * @param {string} traceId - Trace ID
   * @returns {Object} Execution report
   */
  generateReport(traceId) {
    const trace = this.getTrace(traceId);
    if (!trace) return null;

    return {
      traceId: trace.id,
      name: trace.name,
      duration: trace.duration,
      status: trace.status,
      spanCount: trace.spans.length,
      spans: trace.spans.map((span) => ({
        name: span.name,
        duration: span.duration,
        status: span.status,
        eventCount: span.events.length,
      })),
      events: trace.spans.flatMap((s) =>
        s.events.map((e) => ({
          span: s.name,
          ...e,
        }))
      ),
    };
  }

  // Private methods
  _ensureInitialized() {
    if (!this.initialized) {
      throw new Error('Observability not initialized. Call initialize() first.');
    }
  }

  async _persistTrace(trace) {
    const filePath = path.join(this.config.logPath, `trace-${trace.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(trace, null, 2));
  }

  _startMetricsCollection() {
    // Collect system metrics every minute
    setInterval(() => {
      const memUsage = process.memoryUsage();

      this.recordMetric('system.memory.heapUsed', memUsage.heapUsed);
      this.recordMetric('system.memory.heapTotal', memUsage.heapTotal);
      this.recordMetric('system.memory.rss', memUsage.rss);

      // Check for alerts
      if (memUsage.heapUsed > 1024 * 1024 * 1024) {
        // 1GB
        this.createAlert('High Memory Usage', 'high', {
          heapUsed: memUsage.heapUsed,
          threshold: 1024 * 1024 * 1024,
        });
      }
    }, 60000);
  }

  _startCleanupJob() {
    // Cleanup old traces daily
    setInterval(
      async () => {
        const cutoff = Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000;

        this.traces = this.traces.filter((t) => t.startedAt > cutoff);

        // Cleanup old files
        try {
          const files = await fs.readdir(this.config.logPath);
          for (const file of files) {
            if (file.startsWith('trace-')) {
              const filePath = path.join(this.config.logPath, file);
              const stats = await fs.stat(filePath);
              if (stats.mtime.getTime() < cutoff) {
                await fs.unlink(filePath);
              }
            }
          }
        } catch (error) {
          // Ignore cleanup errors
        }
      },
      24 * 60 * 60 * 1000
    );
  }

  _metricKey(name, tags) {
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return tagString ? `${name}:${tagString}` : name;
  }

  _generateTraceId() {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _generateSpanId() {
    return `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = { ObservabilitySystem };
