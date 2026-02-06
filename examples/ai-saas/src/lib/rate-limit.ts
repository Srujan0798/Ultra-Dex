import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Create rate limiters for different use cases
export const ratelimit = {
  // Strict limit for AI chat (expensive operation)
  chat: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1m'), // 10 requests per minute
    analytics: true,
  }),

  // Moderate limit for general API
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1m'), // 100 requests per minute
    analytics: true,
  }),

  // Generous limit for auth (but prevent abuse)
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '5m'), // 5 attempts per 5 minutes
    analytics: true,
  }),
};

// In-memory fallback for development without Redis
const inMemoryCache = new Map<string, { count: number; resetTime: number }>();

export async function rateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  // Try Redis first, fallback to memory
  try {
    const result = await ratelimit.api.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch {
    // Fallback to in-memory rate limiting
    const now = Date.now();
    const key = identifier;
    const windowMs = windowSeconds * 1000;

    const record = inMemoryCache.get(key);

    if (!record || now > record.resetTime) {
      inMemoryCache.set(key, { count: 1, resetTime: now + windowMs });
      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: now + windowMs,
      };
    }

    if (record.count >= limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset: record.resetTime,
      };
    }

    record.count++;
    return {
      success: true,
      limit,
      remaining: limit - record.count,
      reset: record.resetTime,
    };
  }
}
