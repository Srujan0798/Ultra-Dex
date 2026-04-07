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

  constructor(logger?: any, options: any = {}) {
    // Priority: 1. Passed logger, 2. Container logger, 3. No-op logger
    this.logger = logger || (container.isRegistered(DI_TOKENS.Logger) ? container.resolve(DI_TOKENS.Logger) : null) || { 
      info: () => {}, 
      debug: () => {}, 
      warn: () => {}, 
      error: () => {} 
    };
    
    this.options = {
      tokensPerSecond: options.tokensPerSecond || options.defaultTokensPerSecond || 10,
      burstLimit: options.burstLimit || options.defaultCapacity || 50
    };
    this.tokens = this.options.burstLimit;
    this.lastRefillTimestamp = Date.now();
    this.providerRequests = new Map();
    this.logger.info("RateLimiter initialized", this.options);
  }
  /**
   * Attempts to acquire a token for a given provider.
   * @param providerName The name of the provider making the request.
   * @returns True if the request is allowed, false otherwise.
   */
  acquire(providerName: string): boolean {
    this.refillTokens();
    this.updateSlidingWindow(providerName);
    if (this.tokens < 1) {
      this.logger.debug(`RateLimiter: DENIED for ${providerName} - No tokens available.`);
      return false;
    }
    const providerData = this.providerRequests.get(providerName);
    if (providerData && providerData.count >= this.options.tokensPerSecond) {
      this.logger.debug(`RateLimiter: DENIED for ${providerName} - Sliding window limit reached.`);
      return false;
    }
    this.tokens--;
    this.logger.debug(`RateLimiter: ALLOWED for ${providerName}. Tokens remaining: ${this.tokens}`);
    return true;
  }
  /**
   * Releases a token (e.g., after a successful operation or if not used).
   */
  release(): void {
    this.logger.debug("RateLimiter: Release called (no-op for this implementation).");
  }
  /**
   * Gets statistics about the rate limiter.
   * @returns An object containing current stats.
   */
  getStats(providerName?: string): any {
    if (providerName) {
      const data = this.providerRequests.get(providerName) || { count: 0 };
      return {
        inFlight: 0, // Simplified for this implementation
        tokenBucket: {
          totalConsumed: data.count,
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
    // This simple implementation uses global limits for all providers
    // but we can store provider-specific ones if needed.
    // For now, just a placeholder.
  }
}

export { RateLimiter };
export default RateLimiter;
