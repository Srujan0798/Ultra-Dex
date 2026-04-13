/**
 * Ultra-Dex Metrics & Telemetry
 *
 * Production metrics collection with counters, gauges, histograms.
 * Supports Prometheus-style exposition format.
 */

// ──────────────────────────────────────────────────────────────────────────────
// Metric Types
// ──────────────────────────────────────────────────────────────────────────────

export interface Counter {
  name: string;
  help: string;
  labels: string[];
  values: Map<string, number>;
  inc(labels?: Record<string, string>, value?: number): void;
  get(labels?: Record<string, string>): number;
}

export interface Gauge {
  name: string;
  help: string;
  labels: string[];
  values: Map<string, number>;
  set(labels?: Record<string, string>, value?: number): void;
  inc(labels?: Record<string, string>, value?: number): void;
  dec(labels?: Record<string, string>, value?: number): void;
  get(labels?: Record<string, string>): number;
}

export interface Histogram {
  name: string;
  help: string;
  labels: string[];
  buckets: number[];
  values: Map<string, number[]>;
  observe(labels?: Record<string, string>, value?: number): void;
  percentile(labels: Record<string, string>, p: number): number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Metric Implementations
// ──────────────────────────────────────────────────────────────────────────────

function labelKey(labels?: Record<string, string>): string {
  if (!labels) return '';
  return Object.entries(labels).sort().map(([k, v]) => `${k}=${v}`).join(',');
}

export class CounterImpl implements Counter {
  values = new Map<string, number>();

  constructor(
    public name: string,
    public help: string,
    public labels: string[] = [],
  ) {}

  inc(labels?: Record<string, string>, value = 1): void {
    const key = labelKey(labels);
    const current = this.values.get(key) ?? 0;
    this.values.set(key, current + value);
  }

  get(labels?: Record<string, string>): number {
    return this.values.get(labelKey(labels)) ?? 0;
  }
}

export class GaugeImpl implements Gauge {
  values = new Map<string, number>();

  constructor(
    public name: string,
    public help: string,
    public labels: string[] = [],
  ) {}

  set(labels?: Record<string, string>, value = 0): void {
    this.values.set(labelKey(labels), value);
  }

  inc(labels?: Record<string, string>, value = 1): void {
    const key = labelKey(labels);
    const current = this.values.get(key) ?? 0;
    this.values.set(key, current + value);
  }

  dec(labels?: Record<string, string>, value = 1): void {
    const key = labelKey(labels);
    const current = this.values.get(key) ?? 0;
    this.values.set(key, current - value);
  }

  get(labels?: Record<string, string>): number {
    return this.values.get(labelKey(labels)) ?? 0;
  }
}

export class HistogramImpl implements Histogram {
  values = new Map<string, number[]>();

  constructor(
    public name: string,
    public help: string,
    public labels: string[] = [],
    public buckets: number[] = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  ) {}

  observe(labels?: Record<string, string>, value = 0): void {
    const key = labelKey(labels);
    const current = this.values.get(key) ?? [];
    current.push(value);
    this.values.set(key, current);
  }

  percentile(labels: Record<string, string>, p: number): number {
    const values = this.values.get(labelKey(labels)) ?? [];
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * p);
    return sorted[Math.min(index, sorted.length - 1)];
  }

  /** Calculate bucket counts for Prometheus format */
  getBuckets(labels?: Record<string, string>): Map<number, number> {
    const values = this.values.get(labelKey(labels)) ?? [];
    const counts = new Map<number, number>();
    
    for (const bucket of this.buckets) {
      counts.set(bucket, values.filter(v => v <= bucket).length);
    }
    counts.set(+Infinity, values.length);
    
    return counts;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Metrics Registry
// ──────────────────────────────────────────────────────────────────────────────

export class MetricsRegistry {
  private counters = new Map<string, Counter>();
  private gauges = new Map<string, Gauge>();
  private histograms = new Map<string, Histogram>();

  createCounter(name: string, help: string, labels?: string[]): Counter {
    const counter = new CounterImpl(name, help, labels);
    this.counters.set(name, counter);
    return counter;
  }

  createGauge(name: string, help: string, labels?: string[]): Gauge {
    const gauge = new GaugeImpl(name, help, labels);
    this.gauges.set(name, gauge);
    return gauge;
  }

  createHistogram(name: string, help: string, labels?: string[], buckets?: number[]): Histogram {
    const histogram = new HistogramImpl(name, help, labels, buckets);
    this.histograms.set(name, histogram);
    return histogram;
  }

  getCounter(name: string): Counter | undefined {
    return this.counters.get(name);
  }

  getGauge(name: string): Gauge | undefined {
    return this.gauges.get(name);
  }

  getHistogram(name: string): Histogram | undefined {
    return this.histograms.get(name);
  }

  /** Export all metrics in Prometheus exposition format */
  export(): string {
    const lines: string[] = [];

    // Counters
    for (const counter of this.counters.values()) {
      lines.push(`# HELP ${counter.name} ${counter.help}`);
      lines.push(`# TYPE ${counter.name} counter`);
      for (const [key, value] of counter.values) {
        const labels = key ? `{${key}}` : '';
        lines.push(`${counter.name}${labels} ${value}`);
      }
      lines.push('');
    }

    // Gauges
    for (const gauge of this.gauges.values()) {
      lines.push(`# HELP ${gauge.name} ${gauge.help}`);
      lines.push(`# TYPE ${gauge.name} gauge`);
      for (const [key, value] of gauge.values) {
        const labels = key ? `{${key}}` : '';
        lines.push(`${gauge.name}${labels} ${value}`);
      }
      lines.push('');
    }

    // Histograms
    for (const hist of this.histograms.values()) {
      lines.push(`# HELP ${hist.name} ${hist.help}`);
      lines.push(`# TYPE ${hist.name} histogram`);
      
      const h = hist as HistogramImpl;
      for (const [key] of h.values) {
        const labels = key ? `{${key}}` : '';
        const buckets = h.getBuckets(key ? Object.fromEntries(key.split(',').map(s => s.split('='))) : undefined);
        
        for (const [bucket, count] of buckets) {
          const bucketLabel = bucket === +Infinity ? '+Inf' : bucket;
          const bucketStr = key ? `${key},le="${bucketLabel}"` : `le="${bucketLabel}"`;
          lines.push(`${hist.name}_bucket{${bucketStr}} ${count}`);
        }
        lines.push(`${hist.name}_sum${labels} ${h.values.get(key)?.reduce((a, b) => a + b, 0) ?? 0}`);
        lines.push(`${hist.name}_count${labels} ${h.values.get(key)?.length ?? 0}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  clear(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Global Registry
// ──────────────────────────────────────────────────────────────────────────────

let _globalRegistry: MetricsRegistry | undefined;

export function getGlobalMetrics(): MetricsRegistry {
  if (!_globalRegistry) {
    _globalRegistry = new MetricsRegistry();
  }
  return _globalRegistry;
}

// ──────────────────────────────────────────────────────────────────────────────
// Pre-defined Ultra-Dex Metrics
// ──────────────────────────────────────────────────────────────────────────────

export function createUltraDexMetrics(registry: MetricsRegistry = getGlobalMetrics()): {
  workflowTotal: Counter;
  workflowDuration: Histogram;
  taskTotal: Counter;
  taskDuration: Histogram;
  taskErrors: Counter;
  activeWorkers: Gauge;
  queueDepth: Gauge;
} {
  return {
    workflowTotal: registry.createCounter('ultradex_workflows_total', 'Total workflows executed', ['status']),
    workflowDuration: registry.createHistogram('ultradex_workflow_duration_seconds', 'Workflow execution time'),
    taskTotal: registry.createCounter('ultradex_tasks_total', 'Total tasks executed', ['status', 'role']),
    taskDuration: registry.createHistogram('ultradex_task_duration_seconds', 'Task execution time', ['role']),
    taskErrors: registry.createCounter('ultradex_task_errors_total', 'Total task errors', ['type']),
    activeWorkers: registry.createGauge('ultradex_active_workers', 'Currently active workers'),
    queueDepth: registry.createGauge('ultradex_queue_depth', 'Current queue depth'),
  };
}
