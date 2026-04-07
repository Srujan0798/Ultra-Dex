var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
import { singleton } from "tsyringe";
import { performance } from "perf_hooks";
import os from "os";
let PerformanceMonitor = class {
  constructor() {
    this.requests = [];
    this.metrics = /* @__PURE__ */ new Map();
    this.startTime = Date.now();
    this.maxHistory = 1e3;
  }
  // Track a request with timing
  trackRequest(requestInfo, durationMs) {
    const entry = {
      timestamp: Date.now(),
      endpoint: requestInfo.endpoint || "unknown",
      method: requestInfo.method || "GET",
      durationMs,
      statusCode: requestInfo.statusCode || 200
    };
    this.requests.push(entry);
    if (this.requests.length > this.maxHistory) {
      this.requests = this.requests.slice(-this.maxHistory);
    }
    const metricKey = `${requestInfo.method}:${requestInfo.endpoint}`;
    const existing = this.metrics.get(metricKey) || { count: 0, totalMs: 0, minMs: Infinity, maxMs: 0 };
    this.metrics.set(metricKey, {
      count: existing.count + 1,
      totalMs: existing.totalMs + durationMs,
      minMs: Math.min(existing.minMs, durationMs),
      maxMs: Math.max(existing.maxMs, durationMs)
    });
    return entry;
  }
  // Start timing a request
  startTimer() {
    return performance.now();
  }
  // End timing and record
  endTimer(startTime, requestInfo) {
    const durationMs = performance.now() - startTime;
    return this.trackRequest(requestInfo, durationMs);
  }
  // Collect system metrics
  collectMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    return {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        rss: memUsage.rss,
        external: memUsage.external
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: process.uptime(),
      platform: process.platform,
      nodeVersion: process.version,
      system: {
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        cpuCount: os.cpus().length,
        loadAverage: os.loadavg()
      }
    };
  }
  // Get performance report
  getPerformanceReport() {
    const summary = {
      totalRequests: this.requests.length,
      avgDurationMs: 0,
      p50Ms: 0,
      p95Ms: 0,
      p99Ms: 0
    };
    if (this.requests.length > 0) {
      const durations = this.requests.map((r) => r.durationMs).sort((a, b) => a - b);
      summary.avgDurationMs = durations.reduce((a, b) => a + b, 0) / durations.length;
      summary.p50Ms = durations[Math.floor(durations.length * 0.5)] || 0;
      summary.p95Ms = durations[Math.floor(durations.length * 0.95)] || 0;
      summary.p99Ms = durations[Math.floor(durations.length * 0.99)] || 0;
    }
    const endpoints = {};
    for (const [key, stats] of this.metrics.entries()) {
      const [method, endpoint] = key.split(":");
      if (!endpoints[endpoint]) {
        endpoints[endpoint] = { count: 0, avgMs: 0, minMs: Infinity, maxMs: 0 };
      }
      endpoints[endpoint].count += stats.count;
      endpoints[endpoint].avgMs = stats.totalMs / stats.count;
      endpoints[endpoint].minMs = stats.minMs;
      endpoints[endpoint].maxMs = stats.maxMs;
    }
    return {
      summary,
      endpoints,
      system: this.collectMetrics(),
      uptime: Date.now() - this.startTime
    };
  }
  // Get slow requests
  getSlowRequests(thresholdMs = 1e3) {
    return this.requests.filter((r) => r.durationMs > thresholdMs);
  }
  // Get error requests
  getErrorRequests() {
    return this.requests.filter((r) => r.statusCode >= 400);
  }
  // Clear history
  clear() {
    this.requests = [];
    this.metrics.clear();
  }
  // Get request by time range
  getRequestsByTimeRange(startMs, endMs) {
    return this.requests.filter((r) => r.timestamp >= startMs && r.timestamp <= endMs);
  }
};
PerformanceMonitor = __decorateClass([
  singleton()
], PerformanceMonitor);
const performanceMonitor = new PerformanceMonitor();
var monitor_default = performanceMonitor;
export {
  PerformanceMonitor,
  monitor_default as default,
  performanceMonitor
};
