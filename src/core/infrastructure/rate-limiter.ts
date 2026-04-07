import { singleton } from "tsyringe";
import { DI_TOKENS } from '../di/tokens.js';
import { container } from '../di/container.js';

@singleton()
class RateLimiter {
  public logger: any;
  public options: any;
  public tokens: number;
  public lastRefillTimestamp: number;
  public providerRequests: Map<string, any>;
  public providerLimits: Map<string, any>;
  public inFlightCounts: Map<string, number>;

  constructor(loggerOrOptions?: any, options: any = {}) {
    let actualLogger: any;
    let actualOptions: any;

    if (loggerOrOptions && typeof loggerOrOptions.info === 'function') {
      actualLogger = loggerOrOptions;
      actualOptions = options;
    } else if (loggerOrOptions && typeof loggerOrOptions === 'object') {
      actualOptions = loggerOrOptions;
      actualLogger = options?.logger || (container.isRegistered(DI_TOKENS.Logger) ? container.resolve(DI_TOKENS.Logger) : null);
    } else {
      actualOptions = options;
      actualLogger = loggerOrOptions || (container.isRegistered(DI_TOKENS.Logger) ? container.resolve(DI_TOKENS.Logger) : null);
    }

    this.logger = actualLogger || { 
      info: () => {}, 
      debug: () => {}, 
      warn: () => {}, 
      error: () => {} 
    };
    
    this.options = {
      tokensPerSecond: actualOptions?.tokensPerSecond || actualOptions?.defaultTokensPerSecond || 10,
      burstLimit: actualOptions?.burstLimit || actualOptions?.defaultCapacity || 50,
      defaultAcquireTimeoutMs: actualOptions?.defaultAcquireTimeoutMs || 5000
    };
    this.tokens = this.options.burstLimit;
    this.lastRefillTimestamp = Date.now();
    this.providerRequests = new Map();
    this.providerLimits = new Map();
    this.inFlightCounts = new Map();
    this.logger.info("RateLimiter initialized", this.options);
  }
  /**
   * Attempts to acquire a token for a given provider.
   * @param providerName The name of the provider making the request.
   * @param options Additional options (wait, timeout)
   * @returns Promise that resolves to a lease object or rejects if rate limited
   */
  async acquire(providerName: string, options: any = {}): Promise<any> {
    const wait = options.wait !== false;
    const timeout = options.timeout || this.options.defaultAcquireTimeoutMs;
    
    this.refillTokens();
    this.updateSlidingWindow(providerName);
    
    // Check provider-specific limits
    const providerLimit = this.providerLimits.get(providerName);
    if (providerLimit) {
      const providerData = this.providerRequests.get(providerName);
      const recentCount = providerData?.recentRequests?.length || 0;
      
      if (recentCount >= providerLimit.burstMaxRequests) {
        if (!wait) {
          throw new Error(`Rate limit exceeded for provider ${providerName}`);
        }
        // Wait for window to clear
        await new Promise(resolve => setTimeout(resolve, providerLimit.burstWindowMs || 1000));
      }
      
      if (this.tokens < 1 && providerLimit.tokensPerSecond < 0.5) {
        if (!wait) {
          throw new Error(`Rate limit exceeded for provider ${providerName}`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000 / providerLimit.tokensPerSecond));
      }
    }
    
    if (this.tokens < 1) {
      this.logger.debug(`RateLimiter: DENIED for ${providerName} - No tokens available.`);
      if (!wait) {
        throw new Error(`Rate limit exceeded: No tokens available`);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const providerData = this.providerRequests.get(providerName);
    if (providerData && providerData.count >= this.options.tokensPerSecond) {
      this.logger.debug(`RateLimiter: DENIED for ${providerName} - Sliding window limit reached.`);
      if (!wait) {
        throw new Error(`Rate limit exceeded for provider ${providerName}`);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.tokens--;
    
    // Track in-flight
    const currentInFlight = this.inFlightCounts.get(providerName) || 0;
    this.inFlightCounts.set(providerName, currentInFlight + 1);
    
    // Track recent requests for burst limiting
    if (!providerData) {
      this.providerRequests.set(providerName, {
        count: 0,
        windowStart: Date.now(),
        recentRequests: []
      });
    }
    const data = this.providerRequests.get(providerName);
    data.recentRequests = data.recentRequests || [];
    data.recentRequests.push(Date.now());
    
    this.logger.debug(`RateLimiter: ALLOWED for ${providerName}. Tokens remaining: ${this.tokens}`);
    
    return {
      provider: providerName,
      acquiredAt: Date.now()
    };
  }
  /**
   * Releases a token (e.g., after a successful operation or if not used).
   */
  release(lease: any): void {
    if (lease && lease.provider) {
      const currentInFlight = this.inFlightCounts.get(lease.provider) || 0;
      this.inFlightCounts.set(lease.provider, Math.max(0, currentInFlight - 1));
      
      // Track consumed
      const providerData = this.providerRequests.get(lease.provider);
      if (providerData) {
        providerData.totalConsumed = (providerData.totalConsumed || 0) + 1;
      }
    }
    this.logger.debug("RateLimiter: Release called", lease);
  }
  /**
   * Gets statistics about the rate limiter.
   * @returns An object containing current stats.
   */
  getStats(providerName?: string): any {
    if (providerName) {
      const data = this.providerRequests.get(providerName) || { count: 0, totalConsumed: 0 };
      const inFlight = this.inFlightCounts.get(providerName) || 0;
      return {
        inFlight,
        tokenBucket: {
          totalConsumed: data.totalConsumed || data.count || 0,
          remaining: this.tokens
        }
      };
    }
    return {
      currentTokens: this.tokens,
      lastRefill: new Date(this.lastRefillTimestamp).toISOString(),
      providerRequestCounts: Object.fromEntries(this.providerRequests)
    };
  }
  /**
   * Refills tokens based on the time elapsed since the last refill.
   */
  refillTokens(): void {
    const now = Date.now();
    const elapsedTime = now - this.lastRefillTimestamp;
    const tokensToAdd = elapsedTime / 1e3 * this.options.tokensPerSecond;
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.options.burstLimit, this.tokens + tokensToAdd);
      this.lastRefillTimestamp = now;
    }
  }
  /**
   * Updates the sliding window request count for a provider.
   * @param providerName The provider to update
   */
  updateSlidingWindow(providerName: string): void {
    const now = Date.now();
    const windowDuration = 1e3 / this.options.tokensPerSecond;
    if (!this.providerRequests.has(providerName)) {
      this.providerRequests.set(providerName, { count: 0, windowStart: now });
    }
    const providerData = this.providerRequests.get(providerName);
    if (now - providerData.windowStart > windowDuration) {
      providerData.count = 0;
      providerData.windowStart = now;
    }
    providerData.count++;
  }
  
  // Compatibility methods for tests
  setLimit(providerName: string, limits: any): void {
    this.providerLimits.set(providerName, {
      tokensPerSecond: limits.tokensPerSecond || this.options.tokensPerSecond,
      capacity: limits.capacity || this.options.burstLimit,
      burstMaxRequests: limits.burstMaxRequests || 100,
      burstWindowMs: limits.burstWindowMs || 60000
    });
  }
}

export { RateLimiter };
export default RateLimiter;
