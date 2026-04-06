// Copyright (c) 2026 Ultra-Dex

import { EventEmitter } from 'events';
import {
  RateLimiter as LegacyRateLimiter,
  SlidingWindow,
  TokenBucket,
} from '../rate-limiting/rate-limiter.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createLeaseId() {
  return `lease_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export class RateLimiter extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      defaultTokensPerSecond: config.defaultTokensPerSecond || 5,
      defaultCapacity: config.defaultCapacity || 10,
      defaultBurstWindowMs: config.defaultBurstWindowMs || 60000,
      defaultBurstMaxRequests: config.defaultBurstMaxRequests || 60,
      defaultAcquireTimeoutMs: config.defaultAcquireTimeoutMs || 30000,
      pollIntervalMs: config.pollIntervalMs || 50,
      ...config,
    };

    this.providerConfigs = new Map();
    this.tokenBuckets = new Map();
    this.slidingWindows = new Map();
    this.inFlight = new Map();
    this.leases = new Map();
    this.legacyLimiter = new LegacyRateLimiter({
      defaultWindowMs: this.config.defaultBurstWindowMs,
      defaultMaxRequests: this.config.defaultBurstMaxRequests,
      strategy: 'sliding-window',
    });
    this.stats = {
      acquisitions: 0,
      granted: 0,
      rejected: 0,
      waits: 0,
      releases: 0,
      totalWaitMs: 0,
    };
  }

  setLimit(providerName, config = {}) {
    const current = this.providerConfigs.get(providerName) || {};
    this.providerConfigs.set(providerName, { ...current, ...config });
    this.tokenBuckets.delete(providerName);
    this.slidingWindows.delete(providerName);
    this.legacyLimiter.setLimit(providerName, {
      maxRequests: config.burstMaxRequests || current.burstMaxRequests || this.config.defaultBurstMaxRequests,
      windowMs: config.burstWindowMs || current.burstWindowMs || this.config.defaultBurstWindowMs,
    });
  }

  getProviderConfig(providerName) {
    return {
      tokensPerSecond: this.config.defaultTokensPerSecond,
      capacity: this.config.defaultCapacity,
      burstWindowMs: this.config.defaultBurstWindowMs,
      burstMaxRequests: this.config.defaultBurstMaxRequests,
      ...this.providerConfigs.get(providerName),
    };
  }

  getTokenBucket(providerName) {
    if (!this.tokenBuckets.has(providerName)) {
      const config = this.getProviderConfig(providerName);
      this.tokenBuckets.set(
        providerName,
        new TokenBucket({
          capacity: config.capacity,
          refillRate: config.tokensPerSecond,
          refillIntervalMs: 1000,
        })
      );
    }

    return this.tokenBuckets.get(providerName);
  }

  getSlidingWindow(providerName) {
    if (!this.slidingWindows.has(providerName)) {
      const config = this.getProviderConfig(providerName);
      this.slidingWindows.set(
        providerName,
        new SlidingWindow({
          windowMs: config.burstWindowMs,
          maxRequests: config.burstMaxRequests,
        })
      );
    }

    return this.slidingWindows.get(providerName);
  }

  getRetryAfterMs(providerName, reason) {
    if (reason === 'burst-limit') {
      return this.getSlidingWindow(providerName).retryAfter();
    }

    const bucket = this.getTokenBucket(providerName);
    bucket._refill();
    if (bucket.tokens >= 1 || bucket.refillRate <= 0) {
      return 0;
    }

    return Math.ceil(((1 - bucket.tokens) / bucket.refillRate) * bucket.refillIntervalMs);
  }

  check(providerName) {
    const slidingWindow = this.getSlidingWindow(providerName);
    const tokenBucket = this.getTokenBucket(providerName);

    if (slidingWindow.remaining() < 1) {
      return {
        allowed: false,
        providerName,
        reason: 'burst-limit',
        retryAfterMs: this.getRetryAfterMs(providerName, 'burst-limit'),
        remaining: 0,
      };
    }

    if (tokenBucket.available() < 1) {
      return {
        allowed: false,
        providerName,
        reason: 'token-limit',
        retryAfterMs: this.getRetryAfterMs(providerName, 'token-limit'),
        remaining: 0,
      };
    }

    slidingWindow.allow();
    tokenBucket.consume(1);

    return {
      allowed: true,
      providerName,
      remaining: Math.min(slidingWindow.remaining(), tokenBucket.available()),
      retryAfterMs: 0,
    };
  }

  async acquire(providerName, options = {}) {
    const wait = options.wait !== false;
    const timeoutMs = options.timeoutMs || this.config.defaultAcquireTimeoutMs;
    const startedAt = Date.now();
    this.stats.acquisitions++;

    while (true) {
      const result = this.check(providerName);
      if (result.allowed) {
        const lease = {
          id: createLeaseId(),
          providerName,
          acquiredAt: Date.now(),
          waitMs: Date.now() - startedAt,
        };
        this.leases.set(lease.id, lease);
        this.inFlight.set(providerName, (this.inFlight.get(providerName) || 0) + 1);
        this.stats.granted++;
        this.stats.totalWaitMs += lease.waitMs;
        this.emit('acquire', { providerName, lease });
        return lease;
      }

      if (!wait || Date.now() - startedAt >= timeoutMs) {
        this.stats.rejected++;
        const error = new Error(
          `Rate limit exceeded for provider "${providerName}" (${result.reason})`
        );
        error.name = 'RateLimitExceededError';
        error.providerName = providerName;
        error.retryAfterMs = result.retryAfterMs;
        this.emit('reject', {
          providerName,
          reason: result.reason,
          retryAfterMs: result.retryAfterMs,
        });
        throw error;
      }

      this.stats.waits++;
      this.emit('wait', {
        providerName,
        reason: result.reason,
        retryAfterMs: result.retryAfterMs,
      });
      await sleep(Math.max(1, Math.min(result.retryAfterMs || this.config.pollIntervalMs, this.config.pollIntervalMs)));
    }
  }

  release(leaseOrProviderName) {
    const providerName =
      typeof leaseOrProviderName === 'string'
        ? leaseOrProviderName
        : leaseOrProviderName?.providerName;

    if (!providerName) {
      return false;
    }

    if (typeof leaseOrProviderName === 'object' && leaseOrProviderName?.id) {
      this.leases.delete(leaseOrProviderName.id);
    }

    const current = this.inFlight.get(providerName) || 0;
    if (current <= 1) {
      this.inFlight.delete(providerName);
    } else {
      this.inFlight.set(providerName, current - 1);
    }

    this.stats.releases++;
    this.emit('release', { providerName });
    return true;
  }

  getProviderStats(providerName) {
    const bucket = this.getTokenBucket(providerName);
    const window = this.getSlidingWindow(providerName);
    const config = this.getProviderConfig(providerName);

    return {
      config,
      inFlight: this.inFlight.get(providerName) || 0,
      tokenBucket: bucket.getStats(),
      slidingWindow: window.getStats(),
    };
  }

  getStats(providerName = null) {
    if (providerName) {
      return this.getProviderStats(providerName);
    }

    const providers = new Set([
      ...this.providerConfigs.keys(),
      ...this.tokenBuckets.keys(),
      ...this.slidingWindows.keys(),
      ...this.inFlight.keys(),
    ]);

    return {
      ...this.stats,
      activeLeases: this.leases.size,
      providers: Object.fromEntries(
        Array.from(providers).sort().map((name) => [name, this.getProviderStats(name)])
      ),
    };
  }

  getDashboard() {
    return this.getStats();
  }
}

export { SlidingWindow, TokenBucket };
export default RateLimiter;
