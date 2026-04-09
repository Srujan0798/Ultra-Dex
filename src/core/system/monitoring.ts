/**
 * Monitoring Service
 * Collects and reports system metrics, including Prometheus format support
 */

import { healthChecker } from './health-checker.js';

interface ProviderMetrics {
  calls: number;
  errors: number;
  totalLatency: number;
  totalTokens: number;
  totalCost: number;
}

interface UserMetrics {
  requests: number;
  tokens: number;
}

interface LatencyBucket {
  count: number;
  sum: number;
  values: number[];
}

export class MonitoringService {
  private startTime: number = Date.now();
  private requestCount: number = 0;
  private errorCount: number = 0;
  private latencyBuckets: LatencyBucket = { count: 0, sum: 0, values: [] };
  private providers: Map<string, ProviderMetrics> = new Map();
  private users: Map<string, UserMetrics> = new Map();

  /**
   * Track HTTP request latency
   */
  trackRequest(latencyMs: number): void {
    this.requestCount++;
    this.latencyBuckets.count++;
    this.latencyBuckets.sum += latencyMs;
    this.latencyBuckets.values.push(latencyMs);

    // Keep only last 1000 latency values for percentile calculation
    if (this.latencyBuckets.values.length > 1000) {
      this.latencyBuckets.values.shift();
    }
  }

  /**
   * Track server errors
   */
  trackError(): void {
    this.errorCount++;
  }

  /**
   * Track AI provider calls
   */
  trackProviderCall(
    provider: string,
    tokens: number,
    cost: number,
    latencyMs: number,
    error: boolean = false
  ): void {
    if (!this.providers.has(provider)) {
      this.providers.set(provider, {
        calls: 0,
        errors: 0,
        totalLatency: 0,
        totalTokens: 0,
        totalCost: 0,
      });
    }

    const metrics = this.providers.get(provider)!;
    metrics.calls++;
    if (error) metrics.errors++;
    metrics.totalLatency += latencyMs;
    metrics.totalTokens += tokens;
    metrics.totalCost += cost;
  }

  /**
   * Track user-specific request metrics
   */
  trackUserRequest(userId: string, tokens: number): void {
    if (!this.users.has(userId)) {
      this.users.set(userId, { requests: 0, tokens: 0 });
    }

    const metrics = this.users.get(userId)!;
    metrics.requests++;
    metrics.tokens += tokens;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * Gathers and returns system metrics in JSON format
   */
  getMetrics() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const memoryUsage = process.memoryUsage();

    const providerStats: Record<string, any> = {};

    this.providers.forEach((metrics, provider) => {
      providerStats[provider] = {
        calls: metrics.calls,
        errors: metrics.errors,
        avgLatency: metrics.calls > 0 ? Math.round(metrics.totalLatency / metrics.calls) : 0,
        totalTokens: metrics.totalTokens,
        totalCost: Math.round(metrics.totalCost * 100) / 100,
        errorRate: metrics.calls > 0 ? Math.round((metrics.errors / metrics.calls) * 100) / 100 : 0,
      };
    });

    return {
      uptime,
      version: '3.1.0',
      requests: {
        total: this.requestCount,
        errors: this.errorCount,
        errorRate:
          this.requestCount > 0 ? Math.round((this.errorCount / this.requestCount) * 100) / 100 : 0,
      },
      latency: {
        p50: Math.round(this.calculatePercentile(this.latencyBuckets.values, 50)),
        p95: Math.round(this.calculatePercentile(this.latencyBuckets.values, 95)),
        p99: Math.round(this.calculatePercentile(this.latencyBuckets.values, 99)),
        avg:
          this.latencyBuckets.count > 0
            ? Math.round(this.latencyBuckets.sum / this.latencyBuckets.count)
            : 0,
      },
      providers: providerStats,
      memory: {
        heapUsedBytes: memoryUsage.heapUsed,
        heapTotalBytes: memoryUsage.heapTotal,
        rssBytes: memoryUsage.rss,
      },
    };
  }

  /**
   * Returns metrics in Prometheus plain-text format
   */
  getPrometheusFormat(): string {
    const metrics = this.getMetrics();
    const uptime = metrics.uptime;
    const memory = metrics.memory;
    const requests = metrics.requests;
    const latency = metrics.latency;

    let prometheusStr = '';

    // Uptime
    prometheusStr += '# HELP ultra_dex_uptime_seconds The uptime of the server in seconds\n';
    prometheusStr += '# TYPE ultra_dex_uptime_seconds gauge\n';
    prometheusStr += `ultra_dex_uptime_seconds ${uptime}\n\n`;

    // Memory Usage
    prometheusStr += '# HELP ultra_dex_memory_usage_bytes Current memory usage in bytes\n';
    prometheusStr += '# TYPE ultra_dex_memory_usage_bytes gauge\n';
    prometheusStr += `ultra_dex_memory_usage_bytes{type="heap_used"} ${memory.heapUsedBytes}\n`;
    prometheusStr += `ultra_dex_memory_usage_bytes{type="heap_total"} ${memory.heapTotalBytes}\n`;
    prometheusStr += `ultra_dex_memory_usage_bytes{type="rss"} ${memory.rssBytes}\n\n`;

    // HTTP Requests
    prometheusStr += '# HELP ultra_dex_http_requests_total Total number of HTTP requests\n';
    prometheusStr += '# TYPE ultra_dex_http_requests_total counter\n';
    prometheusStr += `ultra_dex_http_requests_total{status="all"} ${requests.total}\n`;
    prometheusStr += `ultra_dex_http_requests_total{status="error"} ${requests.errors}\n\n`;

    // Request Latency
    prometheusStr +=
      '# HELP ultra_dex_http_request_duration_seconds HTTP request latency in seconds\n';
    prometheusStr += '# TYPE ultra_dex_http_request_duration_seconds gauge\n';
    prometheusStr += `ultra_dex_http_request_duration_seconds{percentile="50"} ${latency.p50 / 1000}\n`;
    prometheusStr += `ultra_dex_http_request_duration_seconds{percentile="95"} ${latency.p95 / 1000}\n`;
    prometheusStr += `ultra_dex_http_request_duration_seconds{percentile="99"} ${latency.p99 / 1000}\n\n`;

    // Provider Metrics
    prometheusStr += '# HELP ultra_dex_ai_requests_total Total number of AI provider requests\n';
    prometheusStr += '# TYPE ultra_dex_ai_requests_total counter\n';
    this.providers.forEach((m, provider) => {
      prometheusStr += `ultra_dex_ai_requests_total{provider="${provider}"} ${m.calls}\n`;
    });
    prometheusStr += '\n';

    prometheusStr += '# HELP ultra_dex_ai_tokens_used_total Total number of AI tokens used\n';
    prometheusStr += '# TYPE ultra_dex_ai_tokens_used_total counter\n';
    this.providers.forEach((m, provider) => {
      prometheusStr += `ultra_dex_ai_tokens_used_total{provider="${provider}"} ${m.totalTokens}\n`;
    });

    return prometheusStr;
  }

  /**
   * Deep health check of system components
   */
  async getHealthStatus() {
    return await healthChecker.checkHealth();
  }

  getUserMetrics(userId: string) {
    return this.users.get(userId) || { requests: 0, tokens: 0 };
  }

  reset(): void {
    this.requestCount = 0;
    this.errorCount = 0;
    this.latencyBuckets = { count: 0, sum: 0, values: [] };
    this.providers.clear();
    this.users.clear();
  }
}

export const monitoring = new MonitoringService();
