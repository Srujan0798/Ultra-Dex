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
var __decorateParam = (index, decorator) => (target, key) => decorator(target, key, index);
import { singleton, inject } from "tsyringe";
import { randomUUID } from "crypto";
import { DI_TOKENS } from '../di/tokens.js';
let TelemetryService = class {
  constructor(logger, config) {
    this.logger = logger;
    this.config = config;
  }
  spans = /* @__PURE__ */ new Map();
  metrics = /* @__PURE__ */ new Map();
  events = [];
  tracers = /* @__PURE__ */ new Map();
  initialized = false;
  async initialize() {
    if (this.initialized)
      return;
    this.logger.info("Initializing TelemetryService");
    const flushInterval = this.config.get("telemetry.flushInterval", 6e4);
    setInterval(() => this.flush(), flushInterval);
    this.initialized = true;
    this.logger.info("TelemetryService initialized");
  }
  recordSpan(span) {
    this.spans.set(span.id, span);
    if (process.env.NODE_ENV === "development") {
      this.logger.debug("Span recorded", {
        traceId: span.traceId,
        spanId: span.id,
        operation: span.operation,
        duration: span.endTime ? span.endTime - span.startTime : "in-progress"
      });
    }
  }
  recordMetric(name, value, tags = {}) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      tags
    };
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    const metrics = this.metrics.get(name);
    metrics.push(metric);
    if (metrics.length > 1e3) {
      metrics.shift();
    }
  }
  recordEvent(event) {
    this.events.push(event);
    if (this.events.length > 1e4) {
      this.events.shift();
    }
    if (event.type.startsWith("self-heal") || event.type.startsWith("error")) {
      this.logger.info(`[Telemetry] ${event.type}`, event.data);
    }
  }
  getTracer(name) {
    if (!this.tracers.has(name)) {
      this.tracers.set(name, {
        name,
        spans: /* @__PURE__ */ new Map()
      });
    }
    const tracer = this.tracers.get(name);
    return {
      startSpan: (operation, parentSpan) => {
        const span = {
          id: randomUUID(),
          parentId: parentSpan?.id,
          traceId: parentSpan?.traceId || randomUUID(),
          operation,
          startTime: Date.now(),
          tags: {},
          logs: []
        };
        tracer.spans.set(span.id, span);
        return span;
      },
      finishSpan: (span) => {
        span.endTime = Date.now();
        this.recordSpan(span);
        tracer.spans.delete(span.id);
      },
      log: (span, fields) => {
        const log = {
          timestamp: Date.now(),
          fields
        };
        span.logs.push(log);
      }
    };
  }
  getMetrics(name, timeRange) {
    const metrics = this.metrics.get(name) || [];
    const startTime = timeRange.start.getTime();
    const endTime = timeRange.end.getTime();
    return metrics.filter((m) => m.timestamp >= startTime && m.timestamp <= endTime);
  }
  /**
   * Get all spans for a trace
   */
  getTrace(traceId) {
    return Array.from(this.spans.values()).filter((s) => s.traceId === traceId);
  }
  /**
   * Get service metrics summary
   */
  getServiceMetrics() {
    return {
      totalSpans: this.spans.size,
      activeSpans: Array.from(this.spans.values()).filter((s) => !s.endTime).length,
      totalMetrics: Array.from(this.metrics.values()).reduce((sum, arr) => sum + arr.length, 0),
      totalEvents: this.events.length
    };
  }
  async shutdown() {
    this.logger.info("Shutting down TelemetryService");
    await this.flush();
    this.initialized = false;
  }
  async flush() {
    const stats = this.getServiceMetrics();
    this.logger.debug("Telemetry flush", stats);
  }
};
TelemetryService = __decorateClass([
  singleton(),
  __decorateParam(0, inject(DI_TOKENS.Logger)),
  __decorateParam(1, inject(DI_TOKENS.ConfigService))
], TelemetryService);
export {
  TelemetryService
};
