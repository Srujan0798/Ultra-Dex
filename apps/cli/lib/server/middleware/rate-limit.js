// Copyright (c) 2026 Ultra-Dex

/**
 * Enterprise Rate Limiting
 * Rate limiting for API and user requests
 */

/**
 * Rate Limiter
 */
export class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // 1 minute default
    this.maxRequests = options.maxRequests || 100;
    this.storage = new Map();
    this.keyPrefix = options.keyPrefix || 'rl_';
  }

  /**
   * Check if request is allowed
   */
  async check(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const storageKey = `${this.keyPrefix}${key}`;

    let record = this.storage.get(storageKey);

    if (!record) {
      record = {
        requests: [],
        blocked: false,
        blockedUntil: null,
      };
    }

    // Check if blocked
    if (record.blocked && record.blockedUntil > now) {
      return {
        allowed: false,
        retryAfter: Math.ceil((record.blockedUntil - now) / 1000),
        limit: this.maxRequests,
        remaining: 0,
      };
    }

    // Clear block if expired
    if (record.blocked && record.blockedUntil <= now) {
      record.blocked = false;
      record.blockedUntil = null;
      record.requests = [];
    }

    // Remove old requests outside window
    record.requests = record.requests.filter((time) => time > windowStart);

    // Check limit
    if (record.requests.length >= this.maxRequests) {
      // Block for a short period
      record.blocked = true;
      record.blockedUntil = now + this.windowMs;
      this.storage.set(storageKey, record);

      return {
        allowed: false,
        retryAfter: Math.ceil(this.windowMs / 1000),
        limit: this.maxRequests,
        remaining: 0,
      };
    }

    // Add current request
    record.requests.push(now);
    this.storage.set(storageKey, record);

    return {
      allowed: true,
      limit: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - record.requests.length),
      resetTime: now + this.windowMs,
    };
  }

  /**
   * Get current usage for a key
   */
  async getUsage(key) {
    const storageKey = `${this.keyPrefix}${key}`;
    const record = this.storage.get(storageKey);

    if (!record) {
      return {
        requests: 0,
        limit: this.maxRequests,
        remaining: this.maxRequests,
      };
    }

    const now = Date.now();
    const windowStart = now - this.windowMs;
    const recentRequests = record.requests.filter((time) => time > windowStart);

    return {
      requests: recentRequests.length,
      limit: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - recentRequests.length),
    };
  }

  /**
   * Reset rate limit for a key
   */
  async reset(key) {
    const storageKey = `${this.keyPrefix}${key}`;
    this.storage.delete(storageKey);
  }

  /**
   * Clean up old entries
   */
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    let cleaned = 0;

    for (const [key, record] of this.storage) {
      // Remove old requests
      record.requests = record.requests.filter((time) => time > windowStart);

      // Remove empty records
      if (record.requests.length === 0 && !record.blocked) {
        this.storage.delete(key);
        cleaned++;
      }
    }

    return { cleaned };
  }
}

/**
 * Rate limiting middleware for Express
 */
export function rateLimitMiddleware(options = {}) {
  const limiter = new RateLimiter(options);

  // Start cleanup interval
  setInterval(() => limiter.cleanup(), options.cleanupInterval || 60000);

  return async (req, res, next) => {
    const key = req.user?.id || req.ip || req.connection?.remoteAddress || 'anonymous';

    const result = await limiter.check(key);

    // Set headers
    res.setHeader('X-RateLimit-Limit', result.limit);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.resetTime || Date.now() + limiter.windowMs);

    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfter);
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: result.retryAfter,
      });
      return;
    }

    next();
  };
}

/**
 * Role-based rate limiting
 */
export function roleBasedRateLimit(roleLimits = {}) {
  const limiters = {};

  // Create limiter for each role
  for (const [role, config] of Object.entries(roleLimits)) {
    limiters[role] = new RateLimiter(config);
  }

  // Default limiter
  const defaultLimiter = new RateLimiter();

  return async (req, res, next) => {
    const role = req.user?.role || 'default';
    const limiter = limiters[role] || defaultLimiter;
    const key = req.user?.id || req.ip || 'anonymous';

    const result = await limiter.check(key);

    res.setHeader('X-RateLimit-Limit', result.limit);
    res.setHeader('X-RateLimit-Remaining', result.remaining);

    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfter);
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded for your role.',
        retryAfter: result.retryAfter,
      });
      return;
    }

    next();
  };
}

// Predefined role limits
export const DEFAULT_ROLE_LIMITS = {
  admin: { windowMs: 60000, maxRequests: 1000 },
  maintainer: { windowMs: 60000, maxRequests: 500 },
  member: { windowMs: 60000, maxRequests: 100 },
  viewer: { windowMs: 60000, maxRequests: 50 },
  default: { windowMs: 60000, maxRequests: 100 },
};

// Export singleton
export const rateLimiter = new RateLimiter();

/**
 * Safe execution wrapper with error handling for rate-limit
 * @param {Function} fn - Async function to execute
 * @param {string} [context='rate-limit'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function _safeExecute(fn, context = 'rate-limit') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
