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
  costByModel: Map<string, number>; // model -> cumulative cost
}

interface RoutingDecision {
  strategy: string;
  selectedProvider: string;
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

  // Cost analytics counters
  private costSavingsUsd: number = 0; // cumulative savings from smart routing
  private routingDecisions: Map<string, number> = new Map(); // "strategy:provider" -> count

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
        costByModel: new Map(),
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

  /**
   * Record a routing decision with cost tracking.
   * @param provider - The selected provider
   * @param model - The model used
   * @param costUsd - The actual cost incurred
   * @param baselineCostUsd - What it would have cost with the most expensive option
   * @param strategy - The routing strategy used (e.g., "bandit", "round-robin", "cheapest")
   */
  recordCost(
    provider: string,
    model: string,
    costUsd: number,
    baselineCostUsd: number,
    strategy: string
  ): void {
    // Ensure provider metrics exist
    if (!this.providers.has(provider)) {
      this.providers.set(provider, {
        calls: 0,
        errors: 0,
        totalLatency: 0,
        totalTokens: 0,
        totalCost: 0,
        costByModel: new Map(),
      });
    }

    const metrics = this.providers.get(provider)!;
    metrics.calls++;
    metrics.totalCost += costUsd;

    // Track cost by model
    const existingModelCost = metrics.costByModel.get(model) || 0;
    metrics.costByModel.set(model, existingModelCost + costUsd);

    // Track cumulative savings
    const savings = Math.max(0, baselineCostUsd - costUsd);
    this.costSavingsUsd += savings;

    // Track routing decision
    const key = `${strategy}:${provider}`;
    this.routingDecisions.set(key, (this.routingDecisions.get(key) || 0) + 1);
  }

  /**
   * Record a routing decision without cost (for non-cost tracking calls).
   */
  recordRoutingDecision(strategy: string, selectedProvider: string): void {
    const key = `${strategy}:${selectedProvider}`;
    this.routingDecisions.set(key, (this.routingDecisions.get(key) || 0) + 1);
  }

  /**
   * Get total cost savings from smart routing vs always using the most expensive provider.
   */
  getCostSavings(): number {
    return this.costSavingsUsd;
  }

  /**
   * Get per-provider cost breakdown.
   */
  getProviderCostBreakdown(): Record<string, { total: number; byModel: Record<string, number> }> {
    const result: Record<string, { total: number; byModel: Record<string, number> }> = {};

    this.providers.forEach((metrics, provider) => {
      const byModel: Record<string, number> = {};
      metrics.costByModel.forEach((cost, model) => {
        byModel[model] = Math.round(cost * 10000) / 10000;
      });

      result[provider] = {
        total: Math.round(metrics.totalCost * 10000) / 10000,
        byModel,
      };
    });

    return result;
  }

  /**
   * Get average cost per request by provider.
   */
  getAvgCostPerProvider(): Record<string, number> {
    const result: Record<string, number> = {};

    this.providers.forEach((metrics, provider) => {
      result[provider] =
        metrics.calls > 0
          ? Math.round((metrics.totalCost / metrics.calls) * 1000000) / 1000000
          : 0;
    });

    return result;
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

    // AI Cost by Provider and Model
    prometheusStr += '\n# HELP ultra_dex_ai_cost_usd_total Total AI cost in USD\n';
    prometheusStr += '# TYPE ultra_dex_ai_cost_usd_total counter\n';
    this.providers.forEach((m, provider) => {
      m.costByModel.forEach((cost, model) => {
        prometheusStr += `ultra_dex_ai_cost_usd_total{provider="${provider}",model="${model}"} ${Math.round(cost * 10000) / 10000}\n`;
      });
    });

    // Average Cost Per Request by Provider
    prometheusStr += '\n# HELP ultra_dex_ai_cost_per_request_avg Average cost per request in USD\n';
    prometheusStr += '# TYPE ultra_dex_ai_cost_per_request_avg gauge\n';
    this.providers.forEach((m, provider) => {
      const avg = m.calls > 0 ? m.totalCost / m.calls : 0;
      prometheusStr += `ultra_dex_ai_cost_per_request_avg{provider="${provider}"} ${Math.round(avg * 1000000) / 1000000}\n`;
    });

    // Cost Savings from Smart Routing
    prometheusStr += '\n# HELP ultra_dex_ai_cost_savings_usd Total savings from smart routing in USD\n';
    prometheusStr += '# TYPE ultra_dex_ai_cost_savings_usd counter\n';
    prometheusStr += `ultra_dex_ai_cost_savings_usd ${Math.round(this.costSavingsUsd * 10000) / 10000}\n`;

    // Routing Decisions
    prometheusStr += '\n# HELP ultra_dex_routing_decisions_total Total routing decisions\n';
    prometheusStr += '# TYPE ultra_dex_routing_decisions_total counter\n';
    this.routingDecisions.forEach((count, key) => {
      const [strategy, provider] = key.split(':');
      prometheusStr += `ultra_dex_routing_decisions_total{strategy="${strategy}",provider="${provider}"} ${count}\n`;
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
