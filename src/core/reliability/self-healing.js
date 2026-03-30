/**
 * Self-Healing Orchestrator - REAL Implementation
 * Handles retries, fallbacks, and circuit breaker patterns
 */

import { EventEmitter } from 'events';

export class SelfHealingOrchestrator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000;
    this.circuitBreakers = new Map();
    this.failureCounts = new Map();
    this.initialized = false;
  }

  async initialize() {
    this.initialized = true;
    this.emit('initialized');
  }

  // Execute with automatic retry and circuit breaker
  async execute(options) {
    const {
      operation,
      circuitBreakerName,
      maxRetries = this.maxRetries,
      baseDelay = this.baseDelay,
      fallback,
      shouldRetry = (error) => true,
    } = options;

    // Check circuit breaker
    if (circuitBreakerName && this.isCircuitOpen(circuitBreakerName)) {
      this.emit('circuit-open', { name: circuitBreakerName });
      
      if (fallback) {
        return await fallback(new Error('Circuit breaker open'));
      }
      throw new Error(`Circuit breaker '${circuitBreakerName}' is open`);
    }

    let lastError;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        attempt++;
        this.emit('retry-attempt', { attempt, maxRetries, operation: circuitBreakerName });

        const result = await operation();
        
        // Success - reset failure count
        if (circuitBreakerName) {
          this.resetFailureCount(circuitBreakerName);
        }
        
        this.emit('success', { attempt, operation: circuitBreakerName });
        return result;

      } catch (error) {
        lastError = error;
        this.emit('error', { error, attempt, operation: circuitBreakerName });

        // Check if we should retry
        if (!shouldRetry(error) || attempt >= maxRetries) {
          // Record failure for circuit breaker
          if (circuitBreakerName) {
            this.recordFailure(circuitBreakerName);
          }
          break;
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        this.emit('retry-wait', { delay, attempt });
        await this.sleep(delay);
      }
    }

    // All retries failed - try fallback
    if (fallback) {
      this.emit('fallback', { error: lastError, operation: circuitBreakerName });
      try {
        return await fallback(lastError);
      } catch (fallbackError) {
        lastError = fallbackError;
      }
    }

    // Throw the last error
    this.emit('failed', { error: lastError, attempts: attempt, operation: circuitBreakerName });
    throw lastError;
  }

  // Circuit breaker methods
  isCircuitOpen(name) {
    const breaker = this.circuitBreakers.get(name);
    if (!breaker) return false;
    
    // Check if circuit should reset
    if (breaker.openUntil && Date.now() > breaker.openUntil) {
      this.circuitBreakers.set(name, { state: 'closed', failures: 0 });
      return false;
    }
    
    return breaker.state === 'open';
  }

  recordFailure(name) {
    const breaker = this.circuitBreakers.get(name) || { state: 'closed', failures: 0 };
    breaker.failures++;

    // Open circuit after 5 consecutive failures
    if (breaker.failures >= 5) {
      breaker.state = 'open';
      breaker.openUntil = Date.now() + 60000; // 1 minute cooldown
      this.emit('circuit-opened', { name, failures: breaker.failures });
    }

    this.circuitBreakers.set(name, breaker);
  }

  resetFailureCount(name) {
    this.circuitBreakers.set(name, { state: 'closed', failures: 0 });
  }

  getCircuitState(name) {
    return this.circuitBreakers.get(name) || { state: 'closed', failures: 0 };
  }

  // Utility methods
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check
  async healthCheck() {
    const circuits = {};
    for (const [name, state] of this.circuitBreakers.entries()) {
      circuits[name] = {
        ...state,
        isOpen: state.state === 'open',
        timeUntilReset: state.openUntil ? Math.max(0, state.openUntil - Date.now()) : 0,
      };
    }

    return {
      initialized: this.initialized,
      circuitBreakers: circuits,
      totalFailures: Array.from(this.failureCounts.values()).reduce((a, b) => a + b, 0),
    };
  }

  async shutdown() {
    this.initialized = false;
    this.circuitBreakers.clear();
    this.failureCounts.clear();
    this.emit('shutdown');
  }
}

// Also export a default instance
export const orchestrator = new SelfHealingOrchestrator();
export default orchestrator;
