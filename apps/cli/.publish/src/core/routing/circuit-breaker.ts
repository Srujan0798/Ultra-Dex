/**
 * Circuit Breaker
 *
 * Per-provider circuit breaker pattern for fault tolerance.
 *
 * States:
 *   CLOSED   — Normal operation. Requests flow through.
 *   OPEN     — Too many failures. Requests are rejected immediately.
 *   HALF_OPEN — Testing recovery. One request allowed through as probe.
 *
 * Transitions:
 *   CLOSED → OPEN: When failure count exceeds threshold within a time window.
 *   OPEN → HALF_OPEN: After cooldown period expires.
 *   HALF_OPEN → CLOSED: When probe request succeeds.
 *   HALF_OPEN → OPEN: When probe request fails.
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold: number;    // Number of failures before opening circuit
  successThreshold: number;    // Number of successes in half-open before closing
  cooldownMs: number;          // Time to wait before trying half-open
  windowMs: number;            // Rolling window for failure counting
  provider: string;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
  totalRejected: number;
  lastFailureAt: number | null;
  lastStateChangeAt: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
}

const DEFAULT_OPTIONS: Omit<CircuitBreakerOptions, 'provider'> = {
  failureThreshold: 5,
  successThreshold: 2,
  cooldownMs: 30_000,     // 30 seconds
  windowMs: 60_000,       // 1 minute rolling window
};

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures: number[] = [];  // Timestamps of recent failures
  private successes: number[] = []; // Timestamps of recent successes
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;
  private totalRejected: number = 0;
  private lastFailureAt: number | null = null;
  private lastStateChangeAt: number = Date.now();
  private consecutiveFailures: number = 0;
  private consecutiveSuccesses: number = 0;

  private readonly failureThreshold: number;
  private readonly successThreshold: number;
  private readonly cooldownMs: number;
  private readonly windowMs: number;
  private readonly provider: string;

  constructor(options: Partial<CircuitBreakerOptions> & { provider: string }) {
    const merged = { ...DEFAULT_OPTIONS, ...options };
    this.failureThreshold = merged.failureThreshold;
    this.successThreshold = merged.successThreshold;
    this.cooldownMs = merged.cooldownMs;
    this.windowMs = merged.windowMs;
    this.provider = merged.provider;
  }

  /**
   * Check if a request is allowed through the circuit.
   * Returns true if allowed, false if rejected (circuit is open).
   */
  allowRequest(): boolean {
    this.totalRequests++;

    switch (this.state) {
      case 'CLOSED':
        return true;

      case 'OPEN': {
        // Check if cooldown has expired → transition to half-open
        const timeSinceOpen = Date.now() - this.lastStateChangeAt;
        if (timeSinceOpen >= this.cooldownMs) {
          this._transitionTo('HALF_OPEN');
          return true; // Allow probe request
        }
        this.totalRejected++;
        return false;
      }

      case 'HALF_OPEN':
        // Only allow one request at a time in half-open
        // (the first one that gets here is the probe)
        return true;

      default:
        return false;
    }
  }

  /**
   * Record a successful request.
   */
  recordSuccess(): void {
    this.totalSuccesses++;
    this.consecutiveSuccesses++;
    this.consecutiveFailures = 0;
    this.successes.push(Date.now());

    // Clean old successes
    this._cleanOldEntries(this.successes);

    switch (this.state) {
      case 'HALF_OPEN': {
        // Check if we've had enough successes to close
        const recentSuccesses = this._countRecent(this.successes);
        if (recentSuccesses >= this.successThreshold) {
          this._transitionTo('CLOSED');
        }
        break;
      }

      case 'CLOSED':
        // Reset consecutive failures on success
        break;
    }
  }

  /**
   * Record a failed request.
   */
  recordFailure(): void {
    this.totalFailures++;
    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;
    this.lastFailureAt = Date.now();
    this.failures.push(Date.now());

    // Clean old failures
    this._cleanOldEntries(this.failures);

    switch (this.state) {
      case 'CLOSED': {
        // Check if failure threshold exceeded within window
        const recentFailures = this._countRecent(this.failures);
        if (recentFailures >= this.failureThreshold) {
          this._transitionTo('OPEN');
        }
        break;
      }

      case 'HALF_OPEN':
        // Probe failed → back to open
        this._transitionTo('OPEN');
        break;
    }
  }

  /**
   * Get current circuit state and stats.
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
      totalRejected: this.totalRejected,
      lastFailureAt: this.lastFailureAt,
      lastStateChangeAt: this.lastStateChangeAt,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
    };
  }

  /**
   * Get the provider name.
   */
  getProvider(): string {
    return this.provider;
  }

  /**
   * Get current state.
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Check if circuit is open (rejecting requests).
   */
  isOpen(): boolean {
    return this.state === 'OPEN';
  }

  /**
   * Check if circuit is closed (allowing requests).
   */
  isClosed(): boolean {
    return this.state === 'CLOSED';
  }

  /**
   * Force open the circuit (manual override).
   */
  forceOpen(): void {
    this._transitionTo('OPEN');
  }

  /**
   * Force close the circuit (manual recovery).
   */
  forceClose(): void {
    this._transitionTo('CLOSED');
  }

  /**
   * Reset all statistics (keeps current state).
   */
  reset(): void {
    this.failures = [];
    this.successes = [];
    this.totalRequests = 0;
    this.totalFailures = 0;
    this.totalSuccesses = 0;
    this.totalRejected = 0;
    this.lastFailureAt = null;
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
  }

  // -----------------------------------------------------------------------
  // Private Methods
  // -----------------------------------------------------------------------

  private _transitionTo(newState: CircuitState): void {
    if (this.state === newState) return;

    this.state = newState;
    this.lastStateChangeAt = Date.now();

    if (newState === 'CLOSED') {
      this.failures = [];
      this.consecutiveFailures = 0;
    }

    if (newState === 'OPEN') {
      this.consecutiveSuccesses = 0;
    }
  }

  private _countRecent(timestamps: number[]): number {
    const cutoff = Date.now() - this.windowMs;
    let count = 0;
    for (const ts of timestamps) {
      if (ts >= cutoff) count++;
    }
    return count;
  }

  private _cleanOldEntries(timestamps: number[]): void {
    const cutoff = Date.now() - this.windowMs;
    while (timestamps.length > 0 && timestamps[0] < cutoff) {
      timestamps.shift();
    }
  }
}

/**
 * Circuit Breaker Registry — manages circuit breakers for all providers.
 */
export class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private defaultOptions: Partial<CircuitBreakerOptions> = {};

  constructor(defaultOptions: Partial<CircuitBreakerOptions> = {}) {
    this.defaultOptions = defaultOptions;
  }

  /**
   * Get or create a circuit breaker for a provider.
   */
  get(provider: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
    if (!this.breakers.has(provider)) {
      this.breakers.set(provider, new CircuitBreaker({
        ...this.defaultOptions,
        ...options,
        provider,
      }));
    }
    return this.breakers.get(provider)!;
  }

  /**
   * Check if a request is allowed for a provider.
   */
  allowRequest(provider: string): boolean {
    const breaker = this.breakers.get(provider);
    if (!breaker) return true; // No breaker = always allow
    return breaker.allowRequest();
  }

  /**
   * Record success for a provider.
   */
  recordSuccess(provider: string): void {
    const breaker = this.breakers.get(provider);
    if (breaker) breaker.recordSuccess();
  }

  /**
   * Record failure for a provider.
   */
  recordFailure(provider: string): void {
    const breaker = this.breakers.get(provider);
    if (breaker) breaker.recordFailure();
  }

  /**
   * Get stats for all providers.
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const result: Record<string, CircuitBreakerStats> = {};
    for (const [name, breaker] of this.breakers) {
      result[name] = breaker.getStats();
    }
    return result;
  }

  /**
   * Get all circuit breakers.
   */
  getAll(): Map<string, CircuitBreaker> {
    return this.breakers;
  }

  /**
   * Remove a provider's circuit breaker.
   */
  remove(provider: string): void {
    this.breakers.delete(provider);
  }

  /**
   * Reset all circuit breakers.
   */
  resetAll(): void {
    for (const [, breaker] of this.breakers) {
      breaker.reset();
    }
  }
}
