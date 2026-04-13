/**
 * Ultra-Dex Distributed Tracing
 *
 * OpenTelemetry-compatible tracing for workflow execution.
 * Tracks spans across async boundaries for performance analysis.
 */

import { randomUUID } from 'crypto';

// ──────────────────────────────────────────────────────────────────────────────
// Span Types
// ──────────────────────────────────────────────────────────────────────────────

export interface SpanContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  sampled: boolean;
}

export interface SpanAttributes {
  [key: string]: string | number | boolean | undefined;
}

export interface Span {
  id: string;
  traceId: string;
  parentId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  attributes: SpanAttributes;
  status: 'ok' | 'error';
  errorMessage?: string;
  children: Span[];
}

// ──────────────────────────────────────────────────────────────────────────────
// Span Implementation
// ──────────────────────────────────────────────────────────────────────────────

class SpanImpl implements Span {
  id: string;
  traceId: string;
  parentId?: string;
  startTime: number;
  endTime?: number;
  attributes: SpanAttributes = {};
  status: 'ok' | 'error' = 'ok';
  errorMessage?: string;
  children: SpanImpl[] = [];

  constructor(
    public name: string,
    traceId: string,
    parentId?: string,
  ) {
    this.id = randomUUID().replace(/-/g, '').slice(0, 16);
    this.traceId = traceId;
    this.parentId = parentId;
    this.startTime = performance.now();
  }

  setAttribute(key: string, value: string | number | boolean): void {
    this.attributes[key] = value;
  }

  setAttributes(attrs: SpanAttributes): void {
    Object.assign(this.attributes, attrs);
  }

  setError(message: string): void {
    this.status = 'error';
    this.errorMessage = message;
  }

  addChild(child: SpanImpl): void {
    this.children.push(child);
  }

  end(): void {
    this.endTime = performance.now();
  }

  get durationMs(): number {
    return (this.endTime ?? performance.now()) - this.startTime;
  }

  toJSON(): Span {
    return {
      id: this.id,
      traceId: this.traceId,
      parentId: this.parentId,
      name: this.name,
      startTime: this.startTime,
      endTime: this.endTime,
      attributes: this.attributes,
      status: this.status,
      errorMessage: this.errorMessage,
      children: this.children.map(c => c.toJSON()),
    };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Tracer
// ──────────────────────────────────────────────────────────────────────────────

export interface TracerConfig {
  serviceName: string;
  serviceVersion?: string;
  sampler?: (name: string) => boolean;
}

export class Tracer {
  private serviceName: string;
  private serviceVersion: string;
  private sampler: (name: string) => boolean;
  private activeSpans = new Map<string, SpanImpl>();

  constructor(config: TracerConfig) {
    this.serviceName = config.serviceName;
    this.serviceVersion = config.serviceVersion ?? '1.0.0';
    this.sampler = config.sampler ?? (() => true);
  }

  /**
   * Start a new trace (root span)
   */
  startTrace(name: string, attributes?: SpanAttributes): Span {
    const traceId = randomUUID().replace(/-/g, '');
    const span = new SpanImpl(name, traceId);
    
    span.setAttribute('service.name', this.serviceName);
    span.setAttribute('service.version', this.serviceVersion);
    if (attributes) span.setAttributes(attributes);
    
    this.activeSpans.set(span.id, span);
    return span;
  }

  /**
   * Start a child span within an existing trace
   */
  startSpan(name: string, parentSpan: Span, attributes?: SpanAttributes): Span {
    const parent = this.activeSpans.get(parentSpan.id);
    if (!parent) throw new Error('Parent span not found');

    const span = new SpanImpl(name, parent.traceId, parent.id);
    if (attributes) span.setAttributes(attributes);
    
    parent.addChild(span);
    this.activeSpans.set(span.id, span);
    return span;
  }

  /**
   * End a span and remove from active spans
   */
  endSpan(span: Span): void {
    const impl = this.activeSpans.get(span.id);
    if (impl) {
      impl.end();
      this.activeSpans.delete(span.id);
    }
  }

  /**
   * Get the full trace tree for a span
   */
  getTrace(span: Span): Span | undefined {
    // Find root
    let root = this.activeSpans.get(span.id);
    if (!root) return undefined;
    
    while (root.parentId) {
      const parent = Array.from(this.activeSpans.values()).find(s => s.id === root!.parentId);
      if (!parent) break;
      root = parent;
    }
    
    return root?.toJSON();
  }

  /**
   * Execute a function within a span, automatically ending it
   */
  async withSpan<T>(
    name: string,
    parentSpan: Span | undefined,
    fn: (span: Span) => Promise<T>,
    attributes?: SpanAttributes,
  ): Promise<T> {
    const span = parentSpan 
      ? this.startSpan(name, parentSpan, attributes)
      : this.startTrace(name, attributes);
    
    try {
      const result = await fn(span);
      this.endSpan(span);
      return result;
    } catch (error) {
      const impl = this.activeSpans.get(span.id);
      if (impl) {
        impl.setError((error as Error).message);
        impl.end();
        this.activeSpans.delete(span.id);
      }
      throw error;
    }
  }

  /**
   * Export trace in Jaeger/Zipkin compatible JSON format
   */
  exportTrace(span: Span): Record<string, unknown> {
    const trace = this.getTrace(span);
    if (!trace) return {};

    return {
      traceId: trace.traceId,
      spans: this.flattenSpans(trace),
    };
  }

  private flattenSpans(span: Span, parentId?: string): Record<string, unknown>[] {
    const result: Record<string, unknown>[] = [{
      spanId: span.id,
      parentSpanId: parentId,
      traceId: span.traceId,
      name: span.name,
      startTime: span.startTime,
      endTime: span.endTime,
      duration: (span.endTime ?? performance.now()) - span.startTime,
      attributes: span.attributes,
      status: span.status,
      errorMessage: span.errorMessage,
    }];

    for (const child of span.children) {
      result.push(...this.flattenSpans(child, span.id));
    }

    return result;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Global Tracer
// ──────────────────────────────────────────────────────────────────────────────

let _globalTracer: Tracer | undefined;

export function getGlobalTracer(): Tracer {
  if (!_globalTracer) {
    _globalTracer = new Tracer({
      serviceName: process.env.OTEL_SERVICE_NAME ?? 'ultra-dex',
    });
  }
  return _globalTracer;
}

export function setGlobalTracer(tracer: Tracer): void {
  _globalTracer = tracer;
}
