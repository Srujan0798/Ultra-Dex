import { monitoring } from './monitoring.js';
const CIRCUIT_STATES = {
  CLOSED: "closed",
  OPEN: "open",
  HALF_OPEN: "half-open"
};
const RECOVERY_STRATEGIES = {
  RETRY: "retry",
  FALLBACK: "fallback",
  CIRCUIT_BREAKER: "circuit-breaker",
  TIMEOUT: "timeout",
  DEGRADED_MODE: "degraded-mode"
};
class CircuitBreaker {
  failureThreshold;
  timeout;
  resetTimeout;
  state;
  failureCount;
  lastFailureTime;
  nextAttemptTime;
  name;
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.timeout = options.timeout || 6e4;
    this.resetTimeout = options.resetTimeout || 3e4;
    this.state = CIRCUIT_STATES.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    this.name = options.name || "default";
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
        this.close();
        monitoring.info(`Circuit breaker ${this.name} closed after successful call`, {
          circuit: this.name,
          state: this.state
        });
      }
      return result;
    } catch (error) {
      this.onFailure(error instanceof Error ? error : new Error(String(error)));
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
  circuitBreakers;
  fallbackHandlers;
  retryPolicies;
  degradedServices;
  errorHistory;
  maxErrorHistory;
  constructor() {
    this.circuitBreakers = /* @__PURE__ */ new Map();
    this.fallbackHandlers = /* @__PURE__ */ new Map();
    this.retryPolicies = /* @__PURE__ */ new Map();
    this.degradedServices = /* @__PURE__ */ new Set();
    this.errorHistory = [];
    this.maxErrorHistory = 100;
  }
  registerCircuitBreaker(name, options = {}) {
    const circuitBreaker = new CircuitBreaker({
      name,
      ...options
    });
    this.circuitBreakers.set(name, circuitBreaker);
    return circuitBreaker;
  }
  registerFallback(serviceName, fallbackHandler) {
    this.fallbackHandlers.set(serviceName, fallbackHandler);
  }
  registerRetryPolicy(serviceName, policy) {
    this.retryPolicies.set(serviceName, policy);
  }
  async executeWithRecovery(serviceName, operation, options = {}) {
    const startTime = Date.now();
    const recoveryOptions = {
      strategy: options.strategy || RECOVERY_STRATEGIES.RETRY,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1e3,
      exponentialBackoff: options.exponentialBackoff !== false,
      fallback: options.fallback,
      timeout: options.timeout || 3e4,
      circuitBreaker: options.circuitBreaker !== false
    };
    let lastError = null;
    let retryCount = 0;
    if (recoveryOptions.circuitBreaker) {
      const circuitBreaker = this.getCircuitBreaker(serviceName);
      if (circuitBreaker && circuitBreaker.getStatus().state === CIRCUIT_STATES.OPEN) {
        monitoring.warn(`Operation blocked by open circuit breaker: ${serviceName}`, {
          service: serviceName,
          strategy: recoveryOptions.strategy
        });
        const fallback2 = this.fallbackHandlers.get(serviceName) || recoveryOptions.fallback;
        if (fallback2) {
          try {
            const result = await fallback2();
            monitoring.info(`Fallback executed for ${serviceName}`, {
              service: serviceName,
              strategy: "fallback"
            });
            return result;
          } catch (fallbackError) {
            throw new Error(
              `Circuit breaker open and fallback failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`
            );
          }
        }
        throw new Error(`Circuit breaker for ${serviceName} is open`);
      }
    }
    while (retryCount <= recoveryOptions.maxRetries) {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Operation timeout")), recoveryOptions.timeout);
        });
        const operationPromise = operation();
        const result = await Promise.race([operationPromise, timeoutPromise]);
        const circuitBreaker = this.getCircuitBreaker(serviceName);
        if (circuitBreaker) {
          circuitBreaker.reset();
        }
        this.recordOperation(serviceName, "success", Date.now() - startTime);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        retryCount++;
        this.recordOperation(serviceName, "failure", Date.now() - startTime, lastError);
        const circuitBreaker = this.getCircuitBreaker(serviceName);
        if (circuitBreaker) {
          circuitBreaker.onFailure(lastError);
        }
        if (retryCount <= recoveryOptions.maxRetries) {
          const delay = recoveryOptions.exponentialBackoff ? recoveryOptions.retryDelay * Math.pow(2, retryCount - 1) : recoveryOptions.retryDelay;
          monitoring.warn(
            `Operation failed, retrying (${retryCount}/${recoveryOptions.maxRetries}): ${serviceName}`,
            {
              service: serviceName,
              retryCount,
              error: lastError.message,
              delay
            }
          );
          await this.sleep(delay);
        }
      }
    }
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
          originalError: lastError?.message,
          fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        });
      }
    }
    throw lastError || new Error("Unknown error occurred");
  }
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
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  getCircuitBreaker(serviceName) {
    if (!this.circuitBreakers.has(serviceName)) {
      this.registerCircuitBreaker(serviceName);
    }
    return this.circuitBreakers.get(serviceName);
  }
  getCircuitBreakerStatus(serviceName) {
    const circuitBreaker = this.getCircuitBreaker(serviceName);
    return circuitBreaker ? circuitBreaker.getStatus() : null;
  }
  resetCircuitBreaker(serviceName) {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (circuitBreaker) {
      circuitBreaker.reset();
      monitoring.info(`Circuit breaker reset: ${serviceName}`, {
        service: serviceName
      });
    }
  }
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
  isInDegradedMode(serviceName) {
    return this.degradedServices.has(serviceName);
  }
  recordOperation(serviceName, status, duration, error = null) {
    const record = {
      serviceName,
      status,
      duration,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      error: error ? error.message : null
    };
    this.errorHistory.push(record);
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(-this.maxErrorHistory);
    }
    if (status === "failure") {
      monitoring.incrementCounter("errors");
    }
    monitoring.recordPerformance(`service.${serviceName}`, duration, { status });
  }
  getErrorHistory(serviceName = null) {
    if (serviceName) {
      return this.errorHistory.filter((record) => record.serviceName === serviceName);
    }
    return [...this.errorHistory];
  }
  getErrorStatistics(serviceName = null) {
    const history = serviceName ? this.getErrorHistory(serviceName) : this.errorHistory;
    const total = history.length;
    const failures = history.filter((r) => r.status === "failure").length;
    const successRate = total > 0 ? (total - failures) / total * 100 : 100;
    const durations = history.map((r) => r.duration);
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    return {
      total,
      failures,
      successRate: successRate.toFixed(2) + "%",
      averageDuration: avgDuration,
      errorRate: total > 0 ? (failures / total * 100).toFixed(2) + "%" : "0.00%"
    };
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  getStatus() {
    const circuitStatus = {};
    for (const [name, circuit] of this.circuitBreakers) {
      circuitStatus[name] = circuit.getStatus();
    }
    return {
      circuitBreakers: circuitStatus,
      degradedServices: Array.from(this.degradedServices),
      totalErrors: this.errorHistory.filter((r) => r.status === "failure").length,
      totalOperations: this.errorHistory.length,
      errorHistoryCount: this.errorHistory.length
    };
  }
  emergencyReset() {
    for (const [, circuit] of this.circuitBreakers) {
      circuit.reset();
    }
    this.degradedServices.clear();
    monitoring.warn("Emergency reset performed - all circuits reset and degraded mode cleared");
  }
}
const errorRecovery = new ErrorRecoveryManager();
errorRecovery.registerCircuitBreaker("mcp-server", {
  failureThreshold: 3,
  timeout: 6e4,
  resetTimeout: 3e4
});
errorRecovery.registerCircuitBreaker("ai-provider", {
  failureThreshold: 5,
  timeout: 12e4,
  resetTimeout: 6e4
});
errorRecovery.registerCircuitBreaker("file-operations", {
  failureThreshold: 10,
  timeout: 3e4,
  resetTimeout: 15e3
});
var error_recovery_default = errorRecovery;
export {
  error_recovery_default as default,
  errorRecovery
};
