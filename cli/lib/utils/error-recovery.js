/**
 * Ultra-Dex Advanced Error Recovery System
 * Provides comprehensive error handling, recovery, and circuit breaker patterns
 */

import { monitoring } from './monitoring.js';

// Circuit breaker states
const CIRCUIT_STATES = {
  CLOSED: 'closed',      // Normal operation
  OPEN: 'open',          // Tripped, requests blocked
  HALF_OPEN: 'half-open' // Testing if service recovered
};

// Error recovery strategies
const RECOVERY_STRATEGIES = {
  RETRY: 'retry',
  FALLBACK: 'fallback',
  CIRCUIT_BREAKER: 'circuit-breaker',
  TIMEOUT: 'timeout',
  DEGRADED_MODE: 'degraded-mode'
};

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.timeout = options.timeout || 60000; // 1 minute
    this.resetTimeout = options.resetTimeout || 30000; // 30 seconds
    this.state = CIRCUIT_STATES.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    this.name = options.name || 'default';
  }

  async call(fn, ...args) {
    if (this.state === CIRCUIT_STATES.OPEN) {
      if (Date.now() >= this.nextAttemptTime) {
        this.state = CIRCUIT_STATES.HALF_OPEN;
        monitoring.info(`Circuit breaker ${this.name} entering half-open state`, {
          circuit: this.name,
          state: this.state
        });
      } else {
        monitoring.warn(`Circuit breaker ${this.name} is open, rejecting request`, {
          circuit: this.name,
          state: this.state
        });
        throw new Error(`Circuit breaker ${this.name} is open`);
      }
    }

    try {
      const result = await fn(...args);
      
      if (this.state === CIRCUIT_STATES.HALF_OPEN) {
        this.close(); // Success in half-open state closes the circuit
        monitoring.info(`Circuit breaker ${this.name} closed after successful call`, {
          circuit: this.name,
          state: this.state
        });
      }
      
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  onFailure(error) {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.open();
      monitoring.error(`Circuit breaker ${this.name} opened due to failures`, {
        circuit: this.name,
        state: this.state,
        failureCount: this.failureCount,
        error: error.message
      });
    }
  }

  open() {
    this.state = CIRCUIT_STATES.OPEN;
    this.nextAttemptTime = Date.now() + this.resetTimeout;
  }

  close() {
    this.state = CIRCUIT_STATES.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
  }

  reset() {
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    this.state = CIRCUIT_STATES.CLOSED;
  }

  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      threshold: this.failureThreshold,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      canTry: this.state === CIRCUIT_STATES.CLOSED || Date.now() >= this.nextAttemptTime
    };
  }
}

class ErrorRecoveryManager {
  constructor() {
    this.circuitBreakers = new Map();
    this.fallbackHandlers = new Map();
    this.retryPolicies = new Map();
    this.degradedServices = new Set();
    this.errorHistory = [];
    this.maxErrorHistory = 100;
  }

  /**
   * Register a circuit breaker for a service
   */
  registerCircuitBreaker(name, options = {}) {
    const circuitBreaker = new CircuitBreaker({
      name,
      ...options
    });
    this.circuitBreakers.set(name, circuitBreaker);
    return circuitBreaker;
  }

  /**
   * Register a fallback handler for a service
   */
  registerFallback(serviceName, fallbackHandler) {
    this.fallbackHandlers.set(serviceName, fallbackHandler);
  }

  /**
   * Register retry policy for a service
   */
  registerRetryPolicy(serviceName, policy) {
    this.retryPolicies.set(serviceName, policy);
  }

  /**
   * Execute operation with error recovery
   */
  async executeWithRecovery(serviceName, operation, options = {}) {
    const startTime = Date.now();
    const recoveryOptions = {
      strategy: options.strategy || RECOVERY_STRATEGIES.RETRY,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      exponentialBackoff: options.exponentialBackoff !== false,
      fallback: options.fallback,
      timeout: options.timeout || 30000,
      circuitBreaker: options.circuitBreaker !== false,
      ...options
    };

    let lastError = null;
    let retryCount = 0;

    // Check circuit breaker if enabled
    if (recoveryOptions.circuitBreaker) {
      const circuitBreaker = this.getCircuitBreaker(serviceName);
      if (circuitBreaker && circuitBreaker.getStatus().state === CIRCUIT_STATES.OPEN) {
        monitoring.warn(`Operation blocked by open circuit breaker: ${serviceName}`, {
          service: serviceName,
          strategy: recoveryOptions.strategy
        });

        // Try fallback if available
        const fallback = this.fallbackHandlers.get(serviceName) || recoveryOptions.fallback;
        if (fallback) {
          try {
            const result = await fallback();
            monitoring.info(`Fallback executed for ${serviceName}`, {
              service: serviceName,
              strategy: 'fallback'
            });
            return result;
          } catch (fallbackError) {
            throw new Error(`Circuit breaker open and fallback failed: ${fallbackError.message}`);
          }
        }

        throw new Error(`Circuit breaker for ${serviceName} is open`);
      }
    }

    // Execute with retry logic
    while (retryCount <= recoveryOptions.maxRetries) {
      try {
        // Apply timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Operation timeout')), recoveryOptions.timeout);
        });

        const operationPromise = operation();
        const result = await Promise.race([operationPromise, timeoutPromise]);

        // Success - reset circuit breaker if it exists
        const circuitBreaker = this.getCircuitBreaker(serviceName);
        if (circuitBreaker) {
          circuitBreaker.reset();
        }

        // Record success
        this.recordOperation(serviceName, 'success', Date.now() - startTime);
        
        return result;
      } catch (error) {
        lastError = error;
        retryCount++;
        
        // Record failure
        this.recordOperation(serviceName, 'failure', Date.now() - startTime, error);

        // Update circuit breaker
        const circuitBreaker = this.getCircuitBreaker(serviceName);
        if (circuitBreaker) {
          circuitBreaker.onFailure(error);
        }

        // Check if we should continue retrying
        if (retryCount <= recoveryOptions.maxRetries) {
          const delay = recoveryOptions.exponentialBackoff 
            ? recoveryOptions.retryDelay * Math.pow(2, retryCount - 1)
            : recoveryOptions.retryDelay;

          monitoring.warn(`Operation failed, retrying (${retryCount}/${recoveryOptions.maxRetries}): ${serviceName}`, {
            service: serviceName,
            retryCount,
            error: error.message,
            delay
          });

          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted - try fallback or throw
    const fallback = this.fallbackHandlers.get(serviceName) || recoveryOptions.fallback;
    if (fallback) {
      try {
        const result = await fallback();
        monitoring.info(`Fallback executed after retries failed: ${serviceName}`, {
          service: serviceName,
          retries: retryCount - 1
        });
        return result;
      } catch (fallbackError) {
        monitoring.error(`Both operation and fallback failed: ${serviceName}`, {
          service: serviceName,
          originalError: lastError.message,
          fallbackError: fallbackError.message
        });
      }
    }

    throw lastError;
  }

  /**
   * Execute operation in degraded mode
   */
  async executeInDegradedMode(serviceName, operation, degradedOperation) {
    try {
      return await this.executeWithRecovery(serviceName, operation, {
        strategy: RECOVERY_STRATEGIES.DEGRADED_MODE,
        maxRetries: 1,
        fallback: degradedOperation
      });
    } catch (error) {
      monitoring.error(`Degraded mode operation failed: ${serviceName}`, {
        service: serviceName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get or create circuit breaker for service
   */
  getCircuitBreaker(serviceName) {
    if (!this.circuitBreakers.has(serviceName)) {
      this.registerCircuitBreaker(serviceName);
    }
    return this.circuitBreakers.get(serviceName);
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(serviceName) {
    const circuitBreaker = this.getCircuitBreaker(serviceName);
    return circuitBreaker ? circuitBreaker.getStatus() : null;
  }

  /**
   * Force reset a circuit breaker
   */
  resetCircuitBreaker(serviceName) {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (circuitBreaker) {
      circuitBreaker.reset();
      monitoring.info(`Circuit breaker reset: ${serviceName}`, {
        service: serviceName
      });
    }
  }

  /**
   * Put service in degraded mode
   */
  setDegradedMode(serviceName, degraded = true) {
    if (degraded) {
      this.degradedServices.add(serviceName);
      monitoring.warn(`Service set to degraded mode: ${serviceName}`, {
        service: serviceName
      });
    } else {
      this.degradedServices.delete(serviceName);
      monitoring.info(`Service restored from degraded mode: ${serviceName}`, {
        service: serviceName
      });
    }
  }

  /**
   * Check if service is in degraded mode
   */
  isInDegradedMode(serviceName) {
    return this.degradedServices.has(serviceName);
  }

  /**
   * Record operation for monitoring
   */
  recordOperation(serviceName, status, duration, error = null) {
    const record = {
      serviceName,
      status,
      duration,
      timestamp: new Date().toISOString(),
      error: error ? error.message : null
    };

    this.errorHistory.push(record);
    
    // Keep only recent history
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(-this.maxErrorHistory);
    }

    // Update metrics
    if (status === 'failure') {
      monitoring.incrementCounter('errors');
    }
    
    monitoring.recordPerformance(`service.${serviceName}`, duration, { status });
  }

  /**
   * Get error history
   */
  getErrorHistory(serviceName = null) {
    if (serviceName) {
      return this.errorHistory.filter(record => record.serviceName === serviceName);
    }
    return [...this.errorHistory];
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(serviceName = null) {
    const history = serviceName ? 
      this.getErrorHistory(serviceName) : 
      this.errorHistory;

    const total = history.length;
    const failures = history.filter(r => r.status === 'failure').length;
    const successRate = total > 0 ? ((total - failures) / total) * 100 : 100;

    // Calculate average duration
    const durations = history.map(r => r.duration);
    const avgDuration = durations.length > 0 ? 
      durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    return {
      total,
      failures,
      successRate: successRate.toFixed(2) + '%',
      averageDuration: avgDuration,
      errorRate: total > 0 ? ((failures / total) * 100).toFixed(2) + '%' : '0.00%'
    };
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get recovery status summary
   */
  getStatus() {
    const circuitStatus = {};
    for (const [name, circuit] of this.circuitBreakers) {
      circuitStatus[name] = circuit.getStatus();
    }

    return {
      circuitBreakers: circuitStatus,
      degradedServices: Array.from(this.degradedServices),
      totalErrors: this.errorHistory.filter(r => r.status === 'failure').length,
      totalOperations: this.errorHistory.length,
      errorHistoryCount: this.errorHistory.length
    };
  }

  /**
   * Emergency reset - reset all circuit breakers and clear degraded mode
   */
  emergencyReset() {
    for (const [, circuit] of this.circuitBreakers) {
      circuit.reset();
    }
    
    this.degradedServices.clear();
    monitoring.warn('Emergency reset performed - all circuits reset and degraded mode cleared');
  }
}

// Global error recovery manager instance
export const errorRecovery = new ErrorRecoveryManager();

// Initialize with default circuit breakers for critical services
errorRecovery.registerCircuitBreaker('mcp-server', {
  failureThreshold: 3,
  timeout: 60000,
  resetTimeout: 30000
});

errorRecovery.registerCircuitBreaker('ai-provider', {
  failureThreshold: 5,
  timeout: 120000,
  resetTimeout: 60000
});

errorRecovery.registerCircuitBreaker('file-operations', {
  failureThreshold: 10,
  timeout: 30000,
  resetTimeout: 15000
});

// Export for use in other modules
export default errorRecovery;