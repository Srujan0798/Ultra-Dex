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

class MonitoringService {
  private startTime: number = Date.now();
  private requestCount: number = 0;
  private errorCount: number = 0;
  private latencyBuckets: LatencyBucket = { count: 0, sum: 0, values: [] };
  private providers: Map<string, ProviderMetrics> = new Map();
  private users: Map<string, UserMetrics> = new Map();

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

  trackError(): void {
    this.errorCount++;
  }

  trackProviderCall(provider: string, tokens: number, cost: number, latencyMs: number, error: boolean = false): void {
    if (!this.providers.has(provider)) {
      this.providers.set(provider, {
        calls: 0,
        errors: 0,
        totalLatency: 0,
        totalTokens: 0,
        totalCost: 0
      });
    }

    const metrics = this.providers.get(provider)!;
    metrics.calls++;
    if (error) metrics.errors++;
    metrics.totalLatency += latencyMs;
    metrics.totalTokens += tokens;
    metrics.totalCost += cost;
  }

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

  getMetrics() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const memoryUsage = process.memoryUsage();

    const providerStats: Record<string, {
      calls: number;
      errors: number;
      avgLatency: number;
      totalTokens: number;
      totalCost: number;
      errorRate: number;
    }> = {};

    this.providers.forEach((metrics, provider) => {
      providerStats[provider] = {
        calls: metrics.calls,
        errors: metrics.errors,
        avgLatency: metrics.calls > 0 ? Math.round(metrics.totalLatency / metrics.calls) : 0,
        totalTokens: metrics.totalTokens,
        totalCost: Math.round(metrics.totalCost * 100) / 100,
        errorRate: metrics.calls > 0 ? Math.round((metrics.errors / metrics.calls) * 100) / 100 : 0
      };
    });

    return {
      uptime,
      version: '3.0.0',
      requests: {
        total: this.requestCount,
        errors: this.errorCount,
        errorRate: this.requestCount > 0 ? Math.round((this.errorCount / this.requestCount) * 100) / 100 : 0
      },
      latency: {
        p50: Math.round(this.calculatePercentile(this.latencyBuckets.values, 50)),
        p95: Math.round(this.calculatePercentile(this.latencyBuckets.values, 95)),
        p99: Math.round(this.calculatePercentile(this.latencyBuckets.values, 99)),
        avg: this.latencyBuckets.count > 0 ? Math.round(this.latencyBuckets.sum / this.latencyBuckets.count) : 0
      },
      providers: providerStats,
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024)
      }
    };
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
