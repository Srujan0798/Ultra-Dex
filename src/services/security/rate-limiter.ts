// Copyright (c) 2026 Ultra-Dex
/**
 * API Rate Limiting Service
 * Token bucket algorithm with organization quotas
 *
 * @module services/security/rate-limiter
 */

import { v4 as uuidv4 } from 'uuid';
import { ppmManager } from '../../core/memory/manager.js';
import { auditLogger } from '../audit/audit-logger.js';
import { errorHandler } from '../../../apps/cli/lib/utils/error-handler.js';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  id: string;
  organizationId?: string;
  userId?: string;
  endpoint?: string;
  windowMs: number;
  maxRequests: number;
  burstSize?: number;
  penaltyMultiplier?: number;
}

/**
 * Rate limit bucket
 */
export interface RateLimitBucket {
  id: string;
  key: string;
  tokens: number;
  lastRefill: Date;
  windowMs: number;
  maxTokens: number;
  penaltyMultiplier: number;
  violations: number;
  lastViolation?: Date;
  blockedUntil?: Date;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
  violations: number;
  blocked?: boolean;
}

/**
 * Rate limit tier
 */
export type RateLimitTier = 'free' | 'pro' | 'enterprise' | 'custom';

/**
 * Rate limit tiers configuration
 */
export const RateLimitTiers: Record<
  RateLimitTier,
  Omit<RateLimitConfig, 'id' | 'organizationId' | 'userId'>
> = {
  free: {
    windowMs: 60000, // 1 minute
    maxRequests: 100,
    burstSize: 10,
    penaltyMultiplier: 2,
  },
  pro: {
    windowMs: 60000,
    maxRequests: 1000,
    burstSize: 100,
    penaltyMultiplier: 1.5,
  },
  enterprise: {
    windowMs: 60000,
    maxRequests: 10000,
    burstSize: 500,
    penaltyMultiplier: 1.2,
  },
  custom: {
    windowMs: 60000,
    maxRequests: 5000,
    burstSize: 200,
    penaltyMultiplier: 1.5,
  },
};

/**
 * Rate Limiter Service
 */
export class RateLimiterService {
  private initialized: boolean = false;
  private buckets: Map<string, RateLimitBucket> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await ppmManager.init();
    await auditLogger.initialize();

    console.log('✓ Rate limiter service initialized');
    this.initialized = true;
  }

  /**
   * Check rate limit
   */
  async checkLimit(
    key: string,
    tier: RateLimitTier = 'free',
    customConfig?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    await this.initialize();

    // Check if blocked
    const bucket = this.getOrCreateBucket(key, tier, customConfig);

    if (bucket.blockedUntil && new Date() < bucket.blockedUntil) {
      return {
        allowed: false,
        limit: bucket.maxTokens,
        remaining: 0,
        resetTime: bucket.blockedUntil,
        retryAfter: Math.ceil((bucket.blockedUntil.getTime() - Date.now()) / 1000),
        violations: bucket.violations,
        blocked: true,
      };
    }

    // Refill tokens
    this.refillTokens(bucket);

    // Check if request can be processed
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;

      return {
        allowed: true,
        limit: bucket.maxTokens,
        remaining: Math.floor(bucket.tokens),
        resetTime: new Date(bucket.lastRefill.getTime() + bucket.windowMs),
        violations: bucket.violations,
      };
    }

    // Rate limit exceeded
    bucket.violations += 1;
    bucket.lastViolation = new Date();

    // Apply penalty for repeated violations
    if (bucket.violations >= 5) {
      const blockDuration = Math.min(
        bucket.violations * 60 * 1000, // 1 minute per violation
        3600000 // Max 1 hour
      );
      bucket.blockedUntil = new Date(Date.now() + blockDuration);
    }

    // Log violation
    await auditLogger.log({
      type: 'security.alert',
      severity: 'warning',
      action: 'RATE_LIMIT_EXCEEDED',
      resource: 'rate-limiter',
      resourceId: key,
      details: {
        tier,
        violations: bucket.violations,
        maxTokens: bucket.maxTokens,
      },
    });

    return {
      allowed: false,
      limit: bucket.maxTokens,
      remaining: 0,
      resetTime: new Date(bucket.lastRefill.getTime() + bucket.windowMs),
      retryAfter: Math.ceil(bucket.windowMs / 1000),
      violations: bucket.violations,
    };
  }

  /**
   * Get or create bucket
   */
  private getOrCreateBucket(
    key: string,
    tier: RateLimitTier,
    customConfig?: Partial<RateLimitConfig>
  ): RateLimitBucket {
    const existingBucket = this.buckets.get(key);

    if (existingBucket) {
      return existingBucket;
    }

    const tierConfig = RateLimitTiers[tier];
    const config = { ...tierConfig, ...customConfig };

    const bucket: RateLimitBucket = {
      id: uuidv4(),
      key,
      tokens: config.maxRequests,
      lastRefill: new Date(),
      windowMs: config.windowMs,
      maxTokens: config.maxRequests,
      penaltyMultiplier: config.penaltyMultiplier || 2,
      violations: 0,
    };

    this.buckets.set(key, bucket);
    return bucket;
  }

  /**
   * Refill tokens based on time elapsed
   */
  private refillTokens(bucket: RateLimitBucket): void {
    const now = new Date();
    const timeElapsed = now.getTime() - bucket.lastRefill.getTime();
    const refillRate = bucket.maxTokens / bucket.windowMs;
    const tokensToAdd = timeElapsed * refillRate;

    bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    // Reset violations if enough time has passed
    if (timeElapsed > bucket.windowMs * 10) {
      bucket.violations = Math.max(0, bucket.violations - 1);
    }

    // Clear block if expired
    if (bucket.blockedUntil && now >= bucket.blockedUntil) {
      bucket.blockedUntil = undefined;
    }
  }

  /**
   * Configure rate limit for organization
   */
  async configureOrganizationLimit(
    organizationId: string,
    tier: RateLimitTier,
    customLimits?: Partial<RateLimitConfig>
  ): Promise<RateLimitConfig> {
    await this.initialize();

    const tierDefaults = RateLimitTiers[tier];
    const config: RateLimitConfig = {
      id: uuidv4(),
      organizationId,
      windowMs: customLimits?.windowMs || tierDefaults.windowMs,
      maxRequests: customLimits?.maxRequests || tierDefaults.maxRequests,
      burstSize: customLimits?.burstSize || tierDefaults.burstSize,
      penaltyMultiplier: customLimits?.penaltyMultiplier || tierDefaults.penaltyMultiplier,
    };

    this.configs.set(config.id, config);

    await ppmManager.add({
      content: `Rate limit configured for organization: ${organizationId}`,
      type: 'rate-limit-configured',
      importance: 5,
      metadata: {
        configId: config.id,
        organizationId,
        tier,
        maxRequests: config.maxRequests,
      },
    });

    console.log(`✓ Rate limit configured for organization: ${organizationId} (${tier})`);
    return config;
  }

  /**
   * Check API endpoint limit
   */
  async checkEndpointLimit(
    userId: string,
    endpoint: string,
    method: string
  ): Promise<RateLimitResult> {
    const key = `${userId}:${method}:${endpoint}`;
    return this.checkLimit(key, 'pro');
  }

  /**
   * Check AI operation limit
   */
  async checkAILimit(userId: string, operationType: string): Promise<RateLimitResult> {
    const key = `ai:${userId}:${operationType}`;
    return this.checkLimit(key, 'pro', {
      windowMs: 60000,
      maxRequests: 100, // 100 AI calls per minute
    });
  }

  /**
   * Get rate limit status
   */
  async getStatus(key: string): Promise<RateLimitResult | null> {
    await this.initialize();

    const bucket = this.buckets.get(key);
    if (!bucket) return null;

    this.refillTokens(bucket);

    return {
      allowed: bucket.tokens >= 1 && (!bucket.blockedUntil || new Date() >= bucket.blockedUntil),
      limit: bucket.maxTokens,
      remaining: Math.floor(bucket.tokens),
      resetTime: new Date(bucket.lastRefill.getTime() + bucket.windowMs),
      violations: bucket.violations,
      blocked: bucket.blockedUntil ? new Date() < bucket.blockedUntil : false,
    };
  }

  /**
   * Reset rate limit for key
   */
  async resetLimit(key: string): Promise<boolean> {
    await this.initialize();

    const bucket = this.buckets.get(key);
    if (!bucket) return false;

    bucket.tokens = bucket.maxTokens;
    bucket.violations = 0;
    bucket.blockedUntil = undefined;
    bucket.lastRefill = new Date();

    await auditLogger.log({
      type: 'security.alert',
      severity: 'info',
      action: 'RATE_LIMIT_RESET',
      resource: 'rate-limiter',
      resourceId: key,
      details: {
        maxTokens: bucket.maxTokens,
      },
    });

    console.log(`✓ Rate limit reset for: ${key}`);
    return true;
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<{
    totalBuckets: number;
    totalViolations: number;
    blockedBuckets: number;
    averageTokens: number;
  }> {
    await this.initialize();

    let totalViolations = 0;
    let blockedCount = 0;
    let totalTokens = 0;

    for (const bucket of this.buckets.values()) {
      totalViolations += bucket.violations;
      totalTokens += bucket.tokens;

      if (bucket.blockedUntil && new Date() < bucket.blockedUntil) {
        blockedCount++;
      }
    }

    return {
      totalBuckets: this.buckets.size,
      totalViolations,
      blockedBuckets: blockedCount,
      averageTokens: this.buckets.size > 0 ? totalTokens / this.buckets.size : 0,
    };
  }

  /**
   * Cleanup old buckets
   */
  async cleanup(): Promise<number> {
    await this.initialize();

    const cutoff = Date.now() - 24 * 3600000; // 24 hours
    let cleaned = 0;

    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.lastRefill.getTime() < cutoff && bucket.violations === 0) {
        this.buckets.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiterService();
export default rateLimiter;
