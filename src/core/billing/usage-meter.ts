import { getTierById } from './pricing-tiers.js';

export type PlanId = 'free' | 'pro' | 'enterprise';

export interface UsageSnapshot {
  requestCount: number;
  tokenCount: number;
  agentRunCount: number;
  resetAt: string;
  updatedAt: string;
}

export interface UsageIncrement {
  requests?: number;
  tokens?: number;
  agentRuns?: number;
}

export interface UsageLimitResult {
  allowed: boolean;
  remaining: {
    requests: number;
    tokens: number;
    agents: number;
  };
  usage: UsageSnapshot;
  plan: PlanId;
}

const DEFAULT_LIMITS: Record<PlanId, { requests: number; tokens: number; agents: number }> = {
  free: { requests: 100, tokens: 10000, agents: 3 },
  pro: { requests: 10000, tokens: 1_000_000, agents: -1 },
  enterprise: { requests: -1, tokens: -1, agents: -1 },
};

function nowIso(): string {
  return new Date().toISOString();
}

function createSnapshot(): UsageSnapshot {
  const timestamp = nowIso();
  return {
    requestCount: 0,
    tokenCount: 0,
    agentRunCount: 0,
    resetAt: timestamp,
    updatedAt: timestamp,
  };
}

function cloneSnapshot(snapshot: UsageSnapshot): UsageSnapshot {
  return { ...snapshot };
}

function normalizePlan(plan?: string | null): PlanId {
  if (plan === 'pro' || plan === 'enterprise') {
    return plan;
  }

  return 'free';
}

function getPlanLimits(plan: PlanId): { requests: number; tokens: number; agents: number } {
  const tier = getTierById(plan);
  if (!tier) {
    return DEFAULT_LIMITS[plan];
  }

  return {
    requests: plan === 'enterprise' ? -1 : DEFAULT_LIMITS[plan].requests,
    tokens: tier.limits.tokensPerMonth,
    agents: tier.limits.agents,
  };
}

export class UsageMeter {
  private usageByUser = new Map<string, UsageSnapshot>();
  private planByUser = new Map<string, PlanId>();

  private ensureUsage(userId: string): UsageSnapshot {
    const existing = this.usageByUser.get(userId);
    if (existing) {
      return existing;
    }

    const snapshot = createSnapshot();
    this.usageByUser.set(userId, snapshot);
    return snapshot;
  }

  private resolvePlan(userId: string, plan?: string): PlanId {
    const normalized = normalizePlan(plan);
    if (plan) {
      this.planByUser.set(userId, normalized);
      return normalized;
    }

    return this.planByUser.get(userId) || 'free';
  }

  setPlan(userId: string, plan: string): void {
    this.planByUser.set(userId, normalizePlan(plan));
  }

  increment(userId: string, usage: UsageIncrement = {}): UsageSnapshot {
    const snapshot = this.ensureUsage(userId);
    snapshot.requestCount += usage.requests ?? 0;
    snapshot.tokenCount += usage.tokens ?? 0;
    snapshot.agentRunCount += usage.agentRuns ?? 0;
    snapshot.updatedAt = nowIso();
    return cloneSnapshot(snapshot);
  }

  async trackUsage(
    userId: string,
    action: string,
    metadata: Record<string, unknown> = {}
  ): Promise<UsageSnapshot> {
    const agentRuns = action.includes('agent') ? 1 : 0;
    const tokens = typeof metadata.tokens === 'number' ? metadata.tokens : 0;
    return this.increment(userId, { requests: 1, tokens, agentRuns });
  }

  getUsage(userId: string): UsageSnapshot;
  getUsage(userId: string, period: 'day' | 'month'): number;
  getUsage(userId: string, period?: 'day' | 'month'): UsageSnapshot | number {
    const snapshot = cloneSnapshot(this.ensureUsage(userId));
    if (period) {
      return snapshot.requestCount;
    }

    return snapshot;
  }

  checkLimit(userId: string, plan?: string): UsageLimitResult {
    const resolvedPlan = this.resolvePlan(userId, plan);
    const limits = getPlanLimits(resolvedPlan);
    const usage = this.getUsage(userId) as UsageSnapshot;

    const remaining = {
      requests: limits.requests < 0 ? -1 : Math.max(0, limits.requests - usage.requestCount),
      tokens: limits.tokens < 0 ? -1 : Math.max(0, limits.tokens - usage.tokenCount),
      agents: limits.agents < 0 ? -1 : Math.max(0, limits.agents - usage.agentRunCount),
    };

    const allowed =
      (limits.requests < 0 || usage.requestCount < limits.requests) &&
      (limits.tokens < 0 || usage.tokenCount < limits.tokens) &&
      (limits.agents < 0 || usage.agentRunCount < limits.agents);

    return {
      allowed,
      remaining,
      usage,
      plan: resolvedPlan,
    };
  }

  resetUser(userId: string, plan?: string): UsageSnapshot {
    if (plan) {
      this.planByUser.set(userId, normalizePlan(plan));
    }

    const snapshot = createSnapshot();
    this.usageByUser.set(userId, snapshot);
    return cloneSnapshot(snapshot);
  }

  async resetDailyCounters(): Promise<void> {
    for (const [userId] of this.usageByUser.entries()) {
      this.resetUser(userId);
    }
  }
}

export const usageMeter = new UsageMeter();
