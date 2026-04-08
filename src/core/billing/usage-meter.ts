/**
 * Usage Metering System
 * Tracks per-user API usage (requests, tokens, agent runs) with daily limits
 */

import { getTierById, PricingTier } from './pricing-tiers.js';
import { logError, logEvent } from '../monitoring/better-stack-logger.js';
import { getRedisClient } from './redis-client.js';

export interface UsageCounter {
  requestCount: number;
  tokenCount: number;
  agentRunCount: number;
  resetAt: Date;
}

export interface LimitCheckResult {
  allowed: boolean;
  remaining: {
    requests: number;
    tokens: number;
  };
  resetAt: Date;
  reason?: string;
}

export interface UsageIncrement {
  requests?: number;
  tokens?: number;
  agentRuns?: number;
}

// In-memory storage (replace with Redis in production)
const usageStore = new Map<string, UsageCounter>();

export class UsageMeter {
  private resetInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startResetTimer();
  }

  /**
   * Start daily reset timer (midnight UTC)
   */
  private startResetTimer(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCHours(24, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    // Schedule first reset at midnight UTC
    setTimeout(() => {
      this.resetAllUsage();
      
      // Then reset every 24 hours
      this.resetInterval = setInterval(() => {
        this.resetAllUsage();
      }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }

  /**
   * Reset all user usage counters
   */
  private resetAllUsage(): void {
    const resetAt = this.getNextResetTime();
    usageStore.clear();
    
    logEvent('usage_reset', {
      resetAt: resetAt.toISOString(),
      totalUsers: usageStore.size
    });
  }

  /**
   * Get next reset time (midnight UTC)
   */
  private getNextResetTime(): Date {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCHours(24, 0, 0, 0);
    return tomorrow;
  }

  /**
   * Get or create usage counter for a user
   */
  private getUsageCounter(userId: string): UsageCounter {
    let counter = usageStore.get(userId);
    
    if (!counter) {
      counter = {
        requestCount: 0,
        tokenCount: 0,
        agentRunCount: 0,
        resetAt: this.getNextResetTime()
      };
      usageStore.set(userId, counter);
    }
    
    return counter;
  }

  /**
   * Resolve daily limits from pricing tiers.
   * NOTE: Tier limits are treated as daily caps for metering.
   */
  private getDailyLimits(tier: PricingTier): { requests: number; tokens: number } {
    return {
      requests: tier.limits.requestsPerMonth,
      tokens: tier.limits.tokensPerMonth
    };
  }

  /**
   * Check if user is within their usage limits
   */
  checkLimit(userId: string, planId: string): LimitCheckResult {
    const tier = getTierById(planId);
    
    if (!tier) {
      logError('Invalid tier ID', new Error(`Tier not found: ${planId}`), { userId, planId });
      return {
        allowed: false,
        remaining: { requests: 0, tokens: 0 },
        resetAt: this.getNextResetTime(),
        reason: 'Invalid plan'
      };
    }

    const counter = this.getUsageCounter(userId);
    const dailyLimits = this.getDailyLimits(tier);

    // Enterprise and unlimited tiers
    if (dailyLimits.requests === -1 && dailyLimits.tokens === -1) {
      return {
        allowed: true,
        remaining: { requests: -1, tokens: -1 },
        resetAt: counter.resetAt
      };
    }

    // Check request limit
    if (dailyLimits.requests > 0 && counter.requestCount >= dailyLimits.requests) {
      return {
        allowed: false,
        remaining: { 
          requests: 0, 
          tokens: Math.max(0, dailyLimits.tokens - counter.tokenCount) 
        },
        resetAt: counter.resetAt,
        reason: 'Daily request limit exceeded'
      };
    }

    // Check token limit
    if (dailyLimits.tokens > 0 && counter.tokenCount >= dailyLimits.tokens) {
      return {
        allowed: false,
        remaining: { 
          requests: Math.max(0, dailyLimits.requests - counter.requestCount), 
          tokens: 0 
        },
        resetAt: counter.resetAt,
        reason: 'Daily token limit exceeded'
      };
    }

    // Within limits
    return {
      allowed: true,
      remaining: {
        requests: dailyLimits.requests > 0 
          ? dailyLimits.requests - counter.requestCount 
          : -1,
        tokens: dailyLimits.tokens > 0 
          ? dailyLimits.tokens - counter.tokenCount 
          : -1
      },
      resetAt: counter.resetAt
    };
  }

  /**
   * Increment usage counters
   */
  increment(userId: string, usage: UsageIncrement): void {
    const counter = this.getUsageCounter(userId);
    
    if (usage.requests) {
      counter.requestCount += usage.requests;
    }
    
    if (usage.tokens) {
      counter.tokenCount += usage.tokens;
    }
    
    if (usage.agentRuns) {
      counter.agentRunCount += usage.agentRuns;
    }

    logEvent('usage_increment', {
      userId,
      requests: usage.requests || 0,
      tokens: usage.tokens || 0,
      agentRuns: usage.agentRuns || 0,
      totals: {
        requests: counter.requestCount,
        tokens: counter.tokenCount,
        agentRuns: counter.agentRunCount
      }
    });

    // Persist increments to Redis if available (fire-and-forget)
    (async () => {
      try {
        const client = await getRedisClient();
        if (!client) return;
        const key = `usage:${userId}:${counter.resetAt.toISOString().slice(0,10)}`; // day-keyed
        if (usage.requests) await client.hIncrBy(key, 'requestCount', usage.requests);
        if (usage.tokens) await client.hIncrBy(key, 'tokenCount', usage.tokens);
        if (usage.agentRuns) await client.hIncrBy(key, 'agentRunCount', usage.agentRuns);
        await client.hSet(key, 'resetAt', counter.resetAt.toISOString());
        const ttl = Math.max(60, Math.floor((counter.resetAt.getTime() - Date.now()) / 1000));
        await client.expire(key, ttl);
      } catch (err) {
        logError('Failed to persist usage to Redis', err as Error, { userId });
      }
    })();
  }

  /**
   * Get current usage for a user
   */
  getUsage(userId: string): UsageCounter {
    return { ...this.getUsageCounter(userId) };
  }

  /**
   * Reset usage for a specific user
   */
  resetUser(userId: string): void {
    const resetAt = this.getNextResetTime();
    usageStore.set(userId, {
      requestCount: 0,
      tokenCount: 0,
      agentRunCount: 0,
      resetAt
    });

    logEvent('user_usage_reset', { userId, resetAt: resetAt.toISOString() });
  }

  /**
   * Cleanup interval on shutdown
   */
  destroy(): void {
    if (this.resetInterval) {
      clearInterval(this.resetInterval);
      this.resetInterval = null;
    }
  }
}

// Singleton instance
export const usageMeter = new UsageMeter();
