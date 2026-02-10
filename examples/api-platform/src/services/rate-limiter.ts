/**
 * @fileoverview Rate Limiter module
 * @module services/rate-limiter
 */

import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

// In-memory fallback for demo
const rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

export class RateLimiterService {
  private redis: Redis | null = null;

  constructor() {
    try {
      this.redis = new Redis(config.redis.url);
    } catch (error) {
      logger.warn('Redis not available, using in-memory rate limiting');
    }
  }

  async checkLimit(keyId: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const resetTime = windowStart + windowMs;
    const redisKey = `ratelimit:${keyId}:${windowStart}`;

    try {
      if (this.redis) {
        // Use Redis for distributed rate limiting
        const current = await this.redis.incr(redisKey);
        if (current === 1) {
          await this.redis.pexpire(redisKey, windowMs);
        }

        return {
          allowed: current <= limit,
          remaining: Math.max(0, limit - current),
          resetTime,
        };
      }
    } catch (error) {
      logger.warn('Redis rate limiting failed, falling back to memory');
    }

    // In-memory fallback
    const storeKey = `${keyId}:${windowStart}`;
    const data = rateLimitStore.get(storeKey);

    if (!data || now > data.resetTime) {
      rateLimitStore.set(storeKey, { count: 1, resetTime });
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime,
      };
    }

    data.count++;
    rateLimitStore.set(storeKey, data);

    return {
      allowed: data.count <= limit,
      remaining: Math.max(0, limit - data.count),
      resetTime,
    };
  }
}
