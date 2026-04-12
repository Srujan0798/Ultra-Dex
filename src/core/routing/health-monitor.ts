// Provider Health Monitor with auto-degradation detection
export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'SLOW';

import { BetterStackLogger } from '../monitoring/better-stack-logger.js';

interface ProviderHealth {
  providerId: string;
  status: HealthStatus;
  errorCount: number; // last 5 minutes
  successCount: number; // last 5 minutes
  latencySum: number; // last 5 minutes
  lastCheck: number;
  consecutiveProbes: number;
  errorTimestamps: number[];
  successTimestamps: number[];
  latencySamples: Array<{ ts: number; ms: number }>;
}

export class ProviderHealthMonitor {
  private healthMap: Map<string, ProviderHealth> = new Map();
  private baselineLatency: Map<string, number> = new Map();
  private readonly logger = new BetterStackLogger();
  private readonly ERROR_THRESHOLD_DEGRADED = 0.2; // 20%
  private readonly ERROR_THRESHOLD_UNHEALTHY = 0.5; // 50%
  private readonly LATENCY_MULTIPLIER_SLOW = 3; // 3x baseline
  private readonly PROBE_INTERVAL = 60000; // 60s
  private readonly WINDOW_MS = 5 * 60 * 1000; // last 5 minutes
  private readonly SUCCESS_PROBES_RECOVERY = 3;

  constructor() {
    this.startHealthProbes();
  }

  checkHealth(providerId: string): boolean {
    const health = this.healthMap.get(providerId);
    if (!health) {
      return true; // Default to healthy if not tracked
    }
    return health.status !== 'UNHEALTHY';
  }

  recordLatency(providerId: string, latencyMs: number): void {
    const health = this.getOrCreateHealth(providerId);
    const now = Date.now();
    health.successTimestamps.push(now);
    health.latencySamples.push({ ts: now, ms: latencyMs });
    this.compactWindow(health, now);
    health.successCount = health.successTimestamps.length;
    health.latencySum = health.latencySamples.reduce((sum, sample) => sum + sample.ms, 0);

    // Set baseline latency after 10 calls
    const totalCalls = health.successCount + health.errorCount;
    if (totalCalls === 10) {
      this.baselineLatency.set(providerId, health.latencySum / totalCalls);
    }

    this.updateHealthStatus(providerId);
  }

  recordError(providerId: string, error?: Error): void {
    const health = this.getOrCreateHealth(providerId);
    const now = Date.now();
    health.errorTimestamps.push(now);
    this.compactWindow(health, now);
    health.errorCount = health.errorTimestamps.length;
    this.updateHealthStatus(providerId);
  }

  isHealthy(providerId: string): boolean {
    return this.checkHealth(providerId);
  }

  getStatus(): Map<string, ProviderHealth> {
    return new Map(this.healthMap);
  }

  private getOrCreateHealth(providerId: string): ProviderHealth {
    if (!this.healthMap.has(providerId)) {
      this.healthMap.set(providerId, {
        providerId,
        status: 'HEALTHY',
        errorCount: 0,
        successCount: 0,
        latencySum: 0,
        lastCheck: Date.now(),
        consecutiveProbes: 0,
        errorTimestamps: [],
        successTimestamps: [],
        latencySamples: [],
      });
    }
    return this.healthMap.get(providerId)!;
  }

  private updateHealthStatus(providerId: string): void {
    const health = this.healthMap.get(providerId)!;
    const previous = health.status;
    const now = Date.now();
    this.compactWindow(health, now);
    health.errorCount = health.errorTimestamps.length;
    health.successCount = health.successTimestamps.length;
    health.latencySum = health.latencySamples.reduce((sum, sample) => sum + sample.ms, 0);
    const totalCalls = health.successCount + health.errorCount;

    if (totalCalls === 0) {
      health.status = 'HEALTHY';
    } else {
      const errorRate = health.errorCount / totalCalls;

      // Check error rate thresholds
      if (errorRate > this.ERROR_THRESHOLD_UNHEALTHY) {
        health.status = 'UNHEALTHY';
      } else if (errorRate > this.ERROR_THRESHOLD_DEGRADED) {
        health.status = 'DEGRADED';
      } else {
        // Check latency threshold
        const baseline = this.baselineLatency.get(providerId);
        if (baseline && totalCalls > 10) {
          const avgLatency = health.latencySum / totalCalls;
          if (avgLatency > baseline * this.LATENCY_MULTIPLIER_SLOW) {
            health.status = 'SLOW';
          } else {
            health.status = 'HEALTHY';
          }
        } else {
          health.status = 'HEALTHY';
        }
      }
    }
    if (previous !== health.status) {
      this.logger.track('provider_health_state_change', {
        provider: providerId,
        from: previous,
        to: health.status,
      });
    }
  }

  private startHealthProbes(): void {
    const timer = setInterval(() => {
      this.probeUnhealthyProviders();
    }, this.PROBE_INTERVAL);
    timer.unref?.();
  }

  private async probeUnhealthyProviders(): Promise<void> {
    for (const [providerId, health] of this.healthMap) {
      if (health.status === 'UNHEALTHY') {
        try {
          // Simulate probe
          const success = await this.probeProvider(providerId);
          if (success) {
            health.consecutiveProbes++;
            if (health.consecutiveProbes >= this.SUCCESS_PROBES_RECOVERY) {
              health.status = 'DEGRADED';
              health.consecutiveProbes = 0;
            }
          } else {
            health.consecutiveProbes = 0;
          }
        } catch {
          health.consecutiveProbes = 0;
        }
      } else if (health.status === 'DEGRADED') {
        // Try to recover to HEALTHY
        try {
          const success = await this.probeProvider(providerId);
          if (success) {
            health.consecutiveProbes++;
            if (health.consecutiveProbes >= this.SUCCESS_PROBES_RECOVERY) {
              health.status = 'HEALTHY';
              health.consecutiveProbes = 0;
              health.errorCount = 0; // Reset error count
              health.successCount = 0;
            }
          }
        } catch {
          health.consecutiveProbes = 0;
        }
      }
    }
  }

  private async probeProvider(providerId: string): Promise<boolean> {
    // Simulate a lightweight health check
    // In production, this would ping the actual provider API
    return Math.random() > 0.3; // 70% success rate for probes
  }

  private compactWindow(health: ProviderHealth, now: number): void {
    const cutoff = now - this.WINDOW_MS;
    health.errorTimestamps = health.errorTimestamps.filter((ts) => ts >= cutoff);
    health.successTimestamps = health.successTimestamps.filter((ts) => ts >= cutoff);
    health.latencySamples = health.latencySamples.filter((entry) => entry.ts >= cutoff);
  }
}

export const providerHealthMonitor = new ProviderHealthMonitor();
