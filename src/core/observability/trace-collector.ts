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
import { EventEmitter } from "events";
let Span = class {
  constructor({ traceId, spanId, parentSpanId = null, operation, agentId, metadata = {} }) {
    this.traceId = traceId;
    this.spanId = spanId;
    this.parentSpanId = parentSpanId;
    this.operation = operation;
    this.agentId = agentId;
    this.status = "running";
    this.startTime = Date.now();
    this.endTime = null;
    this.durationMs = null;
    this.metadata = metadata;
    this.events = [];
    this.tokens = { prompt: 0, completion: 0, total: 0 };
    this.cost = 0;
    this.error = null;
    this.children = [];
  }
  addEvent(name, data = {}) {
    this.events.push({
      name,
      timestamp: Date.now(),
      elapsed: Date.now() - this.startTime,
      data
    });
  }
  recordTokens(promptTokens = 0, completionTokens = 0, costPerToken = 0) {
    this.tokens.prompt += promptTokens;
    this.tokens.completion += completionTokens;
    this.tokens.total += promptTokens + completionTokens;
    this.cost += (promptTokens + completionTokens) * costPerToken;
  }
  end(status = "ok") {
    this.status = status;
    this.endTime = Date.now();
    this.durationMs = this.endTime - this.startTime;
  }
  fail(error) {
    this.status = "error";
    this.endTime = Date.now();
    this.durationMs = this.endTime - this.startTime;
    this.error = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
  }
  toJSON() {
    return {
      traceId: this.traceId,
      spanId: this.spanId,
      parentSpanId: this.parentSpanId,
      operation: this.operation,
      agentId: this.agentId,
      status: this.status,
      startTime: this.startTime,
      endTime: this.endTime,
      durationMs: this.durationMs,
      tokens: this.tokens,
      cost: this.cost,
      error: this.error,
      events: this.events,
      metadata: this.metadata,
      childCount: this.children.length
    };
  }
};
Span = __decorateClass([
  singleton()
], Span);
let Trace = class {
  constructor({ traceId, agentId, task = "", metadata = {} }) {
    this.traceId = traceId;
    this.agentId = agentId;
    this.task = task;
    this.metadata = metadata;
    this.status = "running";
    this.startTime = Date.now();
    this.endTime = null;
    this.durationMs = null;
    this.spans = /* @__PURE__ */ new Map();
    this.rootSpanId = null;
    this.totalTokens = 0;
    this.totalCost = 0;
  }
  addSpan(span) {
    this.spans.set(span.spanId, span);
    if (!span.parentSpanId)
      this.rootSpanId = span.spanId;
    if (span.parentSpanId) {
      const parent = this.spans.get(span.parentSpanId);
      if (parent)
        parent.children.push(span.spanId);
    }
  }
  endSpan(spanId, status = "ok") {
    const span = this.spans.get(spanId);
    if (span) {
      span.end(status);
      this.totalTokens += span.tokens.total;
      this.totalCost += span.cost;
    }
  }
  failSpan(spanId, error) {
    const span = this.spans.get(spanId);
    if (span) {
      span.fail(error);
      this.totalTokens += span.tokens.total;
      this.totalCost += span.cost;
    }
  }
  complete() {
    this.status = "completed";
    this.endTime = Date.now();
    this.durationMs = this.endTime - this.startTime;
  }
  fail(error) {
    this.status = "failed";
    this.endTime = Date.now();
    this.durationMs = this.endTime - this.startTime;
    this.error = error;
  }
  /**
   * Generate waterfall timeline for visualization
   */
  getTimeline() {
    const spans = [...this.spans.values()].sort((a, b) => a.startTime - b.startTime);
    const traceStart = this.startTime;
    return {
      traceId: this.traceId,
      agentId: this.agentId,
      task: this.task,
      status: this.status,
      totalDuration: this.durationMs || Date.now() - this.startTime,
      totalTokens: this.totalTokens,
      totalCost: Math.round(this.totalCost * 1e6) / 1e6,
      spanCount: this.spans.size,
      waterfall: spans.map((s) => ({
        spanId: s.spanId,
        operation: s.operation,
        agentId: s.agentId,
        status: s.status,
        offsetMs: s.startTime - traceStart,
        durationMs: s.durationMs || Date.now() - s.startTime,
        depth: this._getDepth(s.spanId),
        tokens: s.tokens.total,
        cost: Math.round(s.cost * 1e6) / 1e6,
        error: s.error?.message || null,
        eventCount: s.events.length
      }))
    };
  }
  _getDepth(spanId, depth = 0) {
    const span = this.spans.get(spanId);
    if (!span || !span.parentSpanId)
      return depth;
    return this._getDepth(span.parentSpanId, depth + 1);
  }
  toJSON() {
    return {
      traceId: this.traceId,
      agentId: this.agentId,
      task: this.task,
      status: this.status,
      startTime: this.startTime,
      endTime: this.endTime,
      durationMs: this.durationMs,
      spanCount: this.spans.size,
      totalTokens: this.totalTokens,
      totalCost: Math.round(this.totalCost * 1e6) / 1e6
    };
  }
};
Trace = __decorateClass([
  singleton()
], Trace);
let TraceCollector = class extends EventEmitter {
  constructor({ maxTraces = 500 } = {}) {
    super();
    this.traces = /* @__PURE__ */ new Map();
    this.maxTraces = maxTraces;
    this.stats = {
      totalTraces: 0,
      totalSpans: 0,
      completed: 0,
      failed: 0,
      totalTokens: 0,
      totalCost: 0
    };
  }
  /**
   * Start a new trace
   */
  startTrace({ traceId = null, agentId, task = "", metadata = {} } = {}) {
    const id = traceId || `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const trace = new Trace({ traceId: id, agentId, task, metadata });
    this.traces.set(id, trace);
    this.stats.totalTraces++;
    this._evictOld();
    this.emit("trace:start", { traceId: id, agentId, task });
    return id;
  }
  /**
   * Start a new span within a trace
   */
  startSpan({ traceId, operation, agentId = null, parentSpanId = null, metadata = {} } = {}) {
    const trace = this.traces.get(traceId);
    if (!trace)
      return null;
    const spanId = `span-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const span = new Span({
      traceId,
      spanId,
      parentSpanId,
      operation,
      agentId: agentId || trace.agentId,
      metadata
    });
    trace.addSpan(span);
    this.stats.totalSpans++;
    this.emit("span:start", { traceId, spanId, operation });
    return spanId;
  }
  /**
   * Add an event to a span
   */
  addEvent(traceId, spanId, name, data = {}) {
    const trace = this.traces.get(traceId);
    if (!trace)
      return;
    const span = trace.spans.get(spanId);
    if (span)
      span.addEvent(name, data);
  }
  /**
   * Record tokens on a span
   */
  recordTokens(traceId, spanId, { promptTokens = 0, completionTokens = 0, costPerToken = 0 } = {}) {
    const trace = this.traces.get(traceId);
    if (!trace)
      return;
    const span = trace.spans.get(spanId);
    if (span)
      span.recordTokens(promptTokens, completionTokens, costPerToken);
  }
  /**
   * End a span successfully
   */
  endSpan(traceId, spanId) {
    const trace = this.traces.get(traceId);
    if (!trace)
      return;
    trace.endSpan(spanId, "ok");
    this.emit("span:end", { traceId, spanId });
  }
  /**
   * Fail a span
   */
  failSpan(traceId, spanId, error) {
    const trace = this.traces.get(traceId);
    if (!trace)
      return;
    trace.failSpan(spanId, error);
    this.emit("span:fail", { traceId, spanId, error: error?.message || error });
  }
  /**
   * Complete a trace
   */
  completeTrace(traceId) {
    const trace = this.traces.get(traceId);
    if (!trace)
      return;
    trace.complete();
    this.stats.completed++;
    this.stats.totalTokens += trace.totalTokens;
    this.stats.totalCost += trace.totalCost;
    this.emit("trace:complete", { traceId, duration: trace.durationMs });
  }
  /**
   * Fail a trace
   */
  failTrace(traceId, error) {
    const trace = this.traces.get(traceId);
    if (!trace)
      return;
    trace.fail(error);
    this.stats.failed++;
    this.stats.totalTokens += trace.totalTokens;
    this.stats.totalCost += trace.totalCost;
    this.emit("trace:fail", { traceId, error: error?.message || error });
  }
  /**
   * Get a trace by ID
   */
  get(traceId) {
    const trace = this.traces.get(traceId);
    if (!trace)
      return null;
    return {
      ...trace.toJSON(),
      spans: [...trace.spans.values()].map((s) => s.toJSON())
    };
  }
  /**
   * Get timeline for a trace
   */
  getTimeline(traceId) {
    const trace = this.traces.get(traceId);
    if (!trace)
      return null;
    return trace.getTimeline();
  }
  /**
   * List traces with filtering
   */
  list({ limit = 50, status = null, agentId = null } = {}) {
    let results = [...this.traces.values()];
    if (status)
      results = results.filter((t) => t.status === status);
    if (agentId)
      results = results.filter((t) => t.agentId === agentId);
    return results.sort((a, b) => b.startTime - a.startTime).slice(0, limit).map((t) => t.toJSON());
  }
  /**
   * Get dashboard aggregate stats
   */
  getDashboard() {
    const recent = [...this.traces.values()].filter((t) => Date.now() - t.startTime < 36e5);
    const avgDuration = recent.length > 0 ? recent.reduce((sum, t) => sum + (t.durationMs || 0), 0) / recent.length : 0;
    const errorRate = recent.length > 0 ? recent.filter((t) => t.status === "failed").length / recent.length : 0;
    return {
      ...this.stats,
      activeTraces: [...this.traces.values()].filter((t) => t.status === "running").length,
      recent: {
        count: recent.length,
        avgDurationMs: Math.round(avgDuration),
        errorRate: Math.round(errorRate * 100),
        totalTokens: recent.reduce((sum, t) => sum + t.totalTokens, 0),
        totalCost: Math.round(recent.reduce((sum, t) => sum + t.totalCost, 0) * 1e6) / 1e6
      },
      latestTraces: [...this.traces.values()].sort((a, b) => b.startTime - a.startTime).slice(0, 5).map((t) => t.toJSON())
    };
  }
  _evictOld() {
    if (this.traces.size <= this.maxTraces)
      return;
    const sorted = [...this.traces.entries()].sort((a, b) => a[1].startTime - b[1].startTime);
    const toRemove = sorted.slice(0, sorted.length - this.maxTraces);
    for (const [id] of toRemove)
      this.traces.delete(id);
  }
};
TraceCollector = __decorateClass([
  singleton()
], TraceCollector);
var trace_collector_default = TraceCollector;
export {
  Span,
  Trace,
  TraceCollector,
  trace_collector_default as default
};
