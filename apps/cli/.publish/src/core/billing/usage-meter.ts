import { getTierById } from './pricing-tiers.js';
import { getPostgresClient } from '../database/postgres-client.js';

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

interface UsageStore {
  persistUsage(record: {
    userId: string;
    provider: string;
    model: string;
    tokensIn: number;
    tokensOut: number;
    costUsd: number;
  }): Promise<void>;
  getUsage(
    userId: string,
    options?: { since?: number; until?: number }
  ): Promise<{ requests: number; tokens: number } | null>;
  getUsageSummary(
    userId: string,
    period: 'day' | 'month'
  ): Promise<{
    requests: number;
    tokens: number;
    cost: number;
    byProvider: Record<string, { requests: number; tokens: number; cost: number }>;
  } | null>;
}

class InMemoryUsageStore implements UsageStore {
  async persistUsage(): Promise<void> {}

  async getUsage(): Promise<{ requests: number; tokens: number } | null> {
    return null;
  }

  async getUsageSummary(): Promise<{
    requests: number;
    tokens: number;
    cost: number;
    byProvider: Record<string, { requests: number; tokens: number; cost: number }>;
  } | null> {
    return null;
  }
}

class PostgresUsageStore implements UsageStore {
  constructor(private readonly pgClient = getPostgresClient()) {}

  async persistUsage(record: {
    userId: string;
    provider: string;
    model: string;
    tokensIn: number;
    tokensOut: number;
    costUsd: number;
  }): Promise<void> {
    await this.pgClient.query(
      `INSERT INTO usage_events (user_id, provider, model, tokens_in, tokens_out, cost_usd, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        record.userId,
        record.provider,
        record.model,
        record.tokensIn,
        record.tokensOut,
        record.costUsd,
      ]
    );
  }

  async getUsage(
    userId: string,
    options: { since?: number; until?: number } = {}
  ): Promise<{ requests: number; tokens: number } | null> {
    const { since, until } = options;
    let query = 'SELECT COUNT(*) as requests, SUM(tokens_in) as tokens FROM usage_events WHERE user_id = $1';
    const params: unknown[] = [userId];

    if (since) {
      query += ' AND created_at >= $2';
      params.push(new Date(since));
    }
    if (until) {
      query += ` AND created_at <= $${params.length + 1}`;
      params.push(new Date(until));
    }

    const result = await this.pgClient.query(query, params);
    const row = result.rows[0];
    return {
      requests: parseInt(row?.requests || '0', 10),
      tokens: parseInt(row?.tokens || '0', 10),
    };
  }

  async getUsageSummary(
    userId: string,
    period: 'day' | 'month'
  ): Promise<{
    requests: number;
    tokens: number;
    cost: number;
    byProvider: Record<string, { requests: number; tokens: number; cost: number }>;
  } | null> {
    const since =
      period === 'day' ? Date.now() - 24 * 60 * 60 * 1000 : Date.now() - 30 * 24 * 60 * 60 * 1000;
    const result = await this.pgClient.query(
      `SELECT
         provider,
         COUNT(*) as requests,
         COALESCE(SUM(tokens_in), 0) + COALESCE(SUM(tokens_out), 0) as tokens,
         COALESCE(SUM(cost_usd), 0) as cost
       FROM usage_events
       WHERE user_id = $1 AND created_at >= $2
       GROUP BY provider`,
      [userId, new Date(since)]
    );

    const byProvider: Record<string, { requests: number; tokens: number; cost: number }> = {};
    let totalRequests = 0;
    let totalTokens = 0;
    let totalCost = 0;

    for (const row of result.rows) {
      const provider = row.provider || 'unknown';
      const requests = parseInt(row.requests || '0', 10);
      const tokens = parseInt(row.tokens || '0', 10);
      const cost = parseFloat(row.cost || '0');

      byProvider[provider] = { requests, tokens, cost };
      totalRequests += requests;
      totalTokens += tokens;
      totalCost += cost;
    }

    return { requests: totalRequests, tokens: totalTokens, cost: totalCost, byProvider };
  }
}

export class UsageMeter {
  private usageByUser = new Map<string, UsageSnapshot>();
  private planByUser = new Map<string, PlanId>();
  private pgClient = getPostgresClient();
  private usageStore: UsageStore;

  constructor() {
    this.usageStore = process.env.DATABASE_URL
      ? new PostgresUsageStore(this.pgClient)
      : new InMemoryUsageStore();
  }

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
    const provider = (metadata.provider as string) || 'unknown';
    const model = (metadata.model as string) || 'unknown';
    const cost = typeof metadata.cost === 'number' ? metadata.cost : 0;

    const snapshot = this.increment(userId, { requests: 1, tokens, agentRuns });

    try {
      await this.usageStore.persistUsage({
        userId,
        provider,
        model,
        tokensIn: tokens,
        tokensOut: 0,
        costUsd: cost,
      });
    } catch (error: unknown) {
      const err = error as Error;
      console.warn('[usage-meter] Failed to persist usage to Postgres:', err.message);
    }

    return snapshot;
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

  async getUsageFromDB(
    userId: string,
    options: { since?: number; until?: number } = {}
  ): Promise<{ requests: number; tokens: number }> {
    const { since, until } = options;

    try {
      const dbUsage = await this.usageStore.getUsage(userId, { since, until });
      if (dbUsage) {
        return dbUsage;
      }
      return {
        requests: 0,
        tokens: 0,
      };
    } catch (error: unknown) {
      const err = error as Error;
      console.warn('[usage-meter] Failed to query usage from Postgres:', err.message);
      const memory = this.getUsage(userId);
      return {
        requests: memory.requestCount,
        tokens: memory.tokenCount,
      };
    }
  }

  async getUsageSummary(
    userId: string,
    period: 'day' | 'month' = 'month'
  ): Promise<{
    requests: number;
    tokens: number;
    cost: number;
    byProvider: Record<string, { requests: number; tokens: number; cost: number }>;
  }> {
    try {
      const summary = await this.usageStore.getUsageSummary(userId, period);
      if (summary) return summary;
      return { requests: 0, tokens: 0, cost: 0, byProvider: {} };
    } catch (error: unknown) {
      const err = error as Error;
      console.warn('[usage-meter] Failed to get usage summary from Postgres:', err.message);
      const memory = this.getUsage(userId);
      return {
        requests: memory.requestCount,
        tokens: memory.tokenCount,
        cost: 0,
        byProvider: {},
      };
    }
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
