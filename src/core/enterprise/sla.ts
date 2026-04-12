export type EnterpriseTier = 'free' | 'pro' | 'enterprise';

export interface SLATarget {
  uptime: number;
  responseTimeMs: number;
  resolutionTimeHours: number;
}

export interface SLAMetrics {
  uptime: number;
  responseTimeMs: number;
  resolutionTimeHours: number;
  sampledAt: string;
}

export interface SLAComplianceResult {
  tier: EnterpriseTier;
  compliant: boolean;
  breaches: string[];
  metrics: SLAMetrics;
  targets: SLATarget;
}

export type SLABreachCallback = (result: SLAComplianceResult) => void;

export class SLAManager {
  readonly tiers: Record<EnterpriseTier, Partial<SLATarget>> = {
    free: {},
    pro: { uptime: 99.5, responseTimeMs: 500, resolutionTimeHours: 24 },
    enterprise: { uptime: 99.9, responseTimeMs: 250, resolutionTimeHours: 4 },
  };

  private metrics: SLAMetrics = {
    uptime: 100,
    responseTimeMs: 120,
    resolutionTimeHours: 2,
    sampledAt: new Date().toISOString(),
  };

  private breachCallbacks: SLABreachCallback[] = [];

  setMetrics(metrics: Partial<SLAMetrics>): SLAMetrics {
    this.metrics = {
      ...this.metrics,
      ...metrics,
      sampledAt: new Date().toISOString(),
    };
    return this.metrics;
  }

  getMetrics(): SLAMetrics {
    return { ...this.metrics };
  }

  checkCompliance(tier: EnterpriseTier): SLAComplianceResult {
    const targets = this.resolveTargets(tier);
    const breaches: string[] = [];

    if (this.metrics.uptime < targets.uptime) {
      breaches.push(`uptime ${this.metrics.uptime}% < target ${targets.uptime}%`);
    }
    if (this.metrics.responseTimeMs > targets.responseTimeMs) {
      breaches.push(
        `response time ${this.metrics.responseTimeMs}ms > target ${targets.responseTimeMs}ms`
      );
    }
    if (this.metrics.resolutionTimeHours > targets.resolutionTimeHours) {
      breaches.push(
        `resolution time ${this.metrics.resolutionTimeHours}h > target ${targets.resolutionTimeHours}h`
      );
    }

    const result: SLAComplianceResult = {
      tier,
      compliant: breaches.length === 0,
      breaches,
      metrics: this.getMetrics(),
      targets,
    };

    if (!result.compliant) {
      for (const callback of this.breachCallbacks) {
        callback(result);
      }
    }

    return result;
  }

  alertOnBreach(callback: SLABreachCallback): () => void {
    this.breachCallbacks.push(callback);
    return () => {
      this.breachCallbacks = this.breachCallbacks.filter((entry) => entry !== callback);
    };
  }

  private resolveTargets(tier: EnterpriseTier): SLATarget {
    const defaults: SLATarget = {
      uptime: 95,
      responseTimeMs: 1000,
      resolutionTimeHours: 48,
    };
    return {
      ...defaults,
      ...this.tiers[tier],
    };
  }
}

