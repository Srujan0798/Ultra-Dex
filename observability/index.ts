/**
 * Ultra-Dex Observability
 *
 * Unified exports for logging, metrics, and tracing.
 */

// Event System (original)
export { EventEmitter, createEvent } from './eventEmitter.js';
export type { EventType, DexEvent, EventHandler } from './eventEmitter.js';

// Logger
export {
  Logger,
  ConsoleTransport,
  FileTransport,
  getGlobalLogger,
  setGlobalLogger,
} from './logger.js';
export type {
  LogLevel,
  LogContext,
  LogEntry,
  LogTransport,
  LoggerConfig,
} from './logger.js';

// Metrics
export {
  MetricsRegistry,
  CounterImpl,
  GaugeImpl,
  HistogramImpl,
  getGlobalMetrics,
  createUltraDexMetrics,
} from './metrics.js';
export type {
  Counter,
  Gauge,
  Histogram,
} from './metrics.js';

// Tracing
export {
  Tracer,
  getGlobalTracer,
  setGlobalTracer,
} from './tracer.js';
export type {
  Span,
  SpanContext,
  SpanAttributes,
} from './tracer.js';
