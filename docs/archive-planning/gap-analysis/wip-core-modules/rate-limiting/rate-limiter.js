// Copyright (c) 2026 Ultra-Dex
// Rate Limiter — Per-agent, per-provider throttling with sliding windows

import { EventEmitter } from 'events';

/**
 * SlidingWindow — tracks requests in a time window
 */
export class SlidingWindow {
  constructor({ windowMs = 60000, maxRequests = 100 }) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = [];
    this.totalAllowed = 0;
    this.totalDenied = 0;
  }

  /**
   * Try to allow a request
   */
  allow() {
    const now = Date.now();
    this._prune(now);

    if (this.requests.length >= this.maxRequests) {
      this.totalDenied++;
      return false;
    }

    this.requests.push(now);
    this.totalAllowed++;
    return true;
  }

  /**
   * Get remaining capacity
   */
  remaining() {
    this._prune(Date.now());
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  /**
   * Time until next slot opens (ms)
   */
  retryAfter() {
    if (this.remaining() > 0) return 0;
    this._prune(Date.now());
    if (this.requests.length === 0) return 0;
    return Math.max(0, this.requests[0] + this.windowMs - Date.now());
  }

  _prune(now) {
    const cutoff = now - this.windowMs;
    while (this.requests.length > 0 && this.requests[0] < cutoff) {
      this.requests.shift();
    }
  }

  getStats() {
    this._prune(Date.now());
    return {
      current: this.requests.length,
      maxRequests: this.maxRequests,
      windowMs: this.windowMs,
      remaining: this.remaining(),
      totalAllowed: this.totalAllowed,
      totalDenied: this.totalDenied,
    };
  }
}

/**
 * TokenBucket — for burst-tolerant rate limiting
 */
export class TokenBucket {
  constructor({ capacity = 100, refillRate = 10, refillIntervalMs = 1000 }) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate;
    this.refillIntervalMs = refillIntervalMs;
    this.lastRefill = Date.now();
    this.totalConsumed = 0;
  }

  /**
   * Try to consume tokens
   */
  consume(count = 1) {
    this._refill();
    if (this.tokens >= count) {
      this.tokens -= count;
      this.totalConsumed += count;
      return true;
    }
    return false;
  }

  /**
   * Get available tokens
   */
  available() {
    this._refill();
    return Math.floor(this.tokens);
  }

  _refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = (elapsed / this.refillIntervalMs) * this.refillRate;
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  getStats() {
    return {
      tokens: Math.floor(this.available()),
      capacity: this.capacity,
      refillRate: this.refillRate,
      totalConsumed: this.totalConsumed,
    };
  }
}

/**
 * RateLimiter — manages per-key rate limiting with multiple strategies
 */
export class RateLimiter extends EventEmitter {
  constructor({
    defaultWindowMs = 60000,
    defaultMaxRequests = 100,
    strategy = 'sliding-window', // 'sliding-window' | 'token-bucket'
    globalLimit = null,
  } = {}) {
    super();
    this.defaultWindowMs = defaultWindowMs;
    this.defaultMaxRequests = defaultMaxRequests;
    this.strategy = strategy;
    this.limiters = new Map(); // key → SlidingWindow | TokenBucket
    this.customLimits = new Map(); // key → { maxRequests, windowMs }
    this.globalLimiter = globalLimit ? this._createLimiter('__global__', globalLimit) : null;
    this.stats = { totalChecks: 0, totalAllowed: 0, totalDenied: 0 };
  }

  /**
   * Set custom rate limit for a key
   */
  setLimit(key, config) {
    this.customLimits.set(key, config);
    // Reset existing limiter
    this.limiters.delete(key);
  }

  /**
   * Check if a request is allowed
   */
  check(key) {
    this.stats.totalChecks++;

    // Check global limit first
    if (this.globalLimiter && !this.globalLimiter.allow()) {
      this.stats.totalDenied++;
      this.emit('rate-limit:denied', { key, reason: 'global-limit' });
      return {
        allowed: false,
        reason: 'Global rate limit exceeded',
        retryAfterMs: this.globalLimiter.retryAfter ? this.globalLimiter.retryAfter() : 1000,
      };
    }

    // Check per-key limit
    const limiter = this._getLimiter(key);
    const isWindow = limiter instanceof SlidingWindow;

    const allowed = isWindow ? limiter.allow() : limiter.consume(1);

    if (allowed) {
      this.stats.totalAllowed++;
      this.emit('rate-limit:allowed', { key });
      return {
        allowed: true,
        remaining: isWindow ? limiter.remaining() : limiter.available(),
      };
    } else {
      this.stats.totalDenied++;
      this.emit('rate-limit:denied', { key, reason: 'per-key-limit' });
      return {
        allowed: false,
        reason: `Rate limit exceeded for "${key}"`,
        retryAfterMs: isWindow ? limiter.retryAfter() : 1000,
        remaining: 0,
      };
    }
  }

  /**
   * Get or create a limiter for the key
   */
  _getLimiter(key) {
    if (!this.limiters.has(key)) {
      const config = this.customLimits.get(key) || {};
      this.limiters.set(key, this._createLimiter(key, config));
    }
    return this.limiters.get(key);
  }

  _createLimiter(key, config) {
    if (this.strategy === 'token-bucket') {
      return new TokenBucket({
        capacity: config.maxRequests || this.defaultMaxRequests,
        refillRate: config.refillRate || 10,
        refillIntervalMs: config.refillIntervalMs || 1000,
      });
    }

    return new SlidingWindow({
      windowMs: config.windowMs || this.defaultWindowMs,
      maxRequests: config.maxRequests || this.defaultMaxRequests,
    });
  }

  /**
   * Express-style middleware
   */
  middleware(keyExtractor = (req) => req.ip || 'default') {
    return (req, res, next) => {
      const key = keyExtractor(req);
      const result = this.check(key);

      res.setHeader('X-RateLimit-Remaining', result.remaining || 0);

      if (!result.allowed) {
        res.setHeader('Retry-After', Math.ceil((result.retryAfterMs || 1000) / 1000));
        res.status(429).json({
          error: 'Too Many Requests',
          message: result.reason,
          retryAfterMs: result.retryAfterMs,
        });
        return;
      }

      next();
    };
  }

  /**
   * Get stats for a specific key
   */
  getKeyStats(key) {
    const limiter = this.limiters.get(key);
    if (!limiter) return null;
    return limiter.getStats();
  }

  /**
   * Get overall dashboard
   */
  getDashboard() {
    const keyStats = {};
    for (const [key, limiter] of this.limiters) {
      if (key !== '__global__') {
        keyStats[key] = limiter.getStats();
      }
    }

    return {
      strategy: this.strategy,
      totalKeys: this.limiters.size - (this.globalLimiter ? 1 : 0),
      global: this.globalLimiter ? this.globalLimiter.getStats() : null,
      keys: keyStats,
      stats: { ...this.stats },
    };
  }

  /**
   * Reset limits for a key
   */
  reset(key) {
    this.limiters.delete(key);
    this.emit('rate-limit:reset', { key });
  }

  /**
   * Reset all limits
   */
  resetAll() {
    this.limiters.clear();
    if (this.globalLimiter) {
      this.globalLimiter = this._createLimiter(
        '__global__',
        this.customLimits.get('__global__') || { maxRequests: this.defaultMaxRequests * 10 }
      );
    }
    this.emit('rate-limit:reset-all');
  }
}

export default RateLimiter;
