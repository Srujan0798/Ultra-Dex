var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
import { EventEmitter } from 'events';
let SelfHealingOrchestrator = class extends EventEmitter {
  constructor(options = {}) {
    super();
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1e3;
    this.circuitBreakers = /* @__PURE__ */ new Map();
    this.failureCounts = /* @__PURE__ */ new Map();
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
        if (circuitBreakerName) {
          this.resetFailureCount(circuitBreakerName);
        }
        this.emit('success', { attempt, operation: circuitBreakerName });
        return result;
      } catch (error) {
        lastError = error;
        this.emit('error', { error, attempt, operation: circuitBreakerName });
        if (!shouldRetry(error) || attempt >= maxRetries) {
          if (circuitBreakerName) {
            this.recordFailure(circuitBreakerName);
          }
          break;
        }
        const delay = baseDelay * Math.pow(2, attempt - 1);
        this.emit('retry-wait', { delay, attempt });
        await this.sleep(delay);
      }
    }
    if (fallback) {
      this.emit('fallback', { error: lastError, operation: circuitBreakerName });
      try {
        return await fallback(lastError);
      } catch (fallbackError) {
        lastError = fallbackError;
      }
    }
    this.emit('failed', { error: lastError, attempts: attempt, operation: circuitBreakerName });
    throw lastError;
  }
  // Circuit breaker methods
  isCircuitOpen(name) {
    const breaker = this.circuitBreakers.get(name);
    if (!breaker) return false;
    if (breaker.openUntil && Date.now() > breaker.openUntil) {
      this.circuitBreakers.set(name, { state: 'closed', failures: 0 });
      return false;
    }
    return breaker.state === 'open';
  }
  recordFailure(name) {
    this.failureCounts.set(name, (this.failureCounts.get(name) || 0) + 1);
    const breaker = this.circuitBreakers.get(name) || { state: 'closed', failures: 0 };
    breaker.failures++;
    if (breaker.failures >= 5) {
      breaker.state = 'open';
      breaker.openUntil = Date.now() + 6e4;
      this.emit('circuit-opened', { name, failures: breaker.failures });
    }
    this.circuitBreakers.set(name, breaker);
  }
  resetFailureCount(name) {
    this.failureCounts.set(name, 0);
    this.circuitBreakers.set(name, { state: 'closed', failures: 0 });
  }
  async reportAgentError(agentId, error, details = {}) {
    const name = `agent:${agentId}`;
    this.recordFailure(name);
    this.emit('agent-error', { agentId, error, ...details });
  }
  classifyRecoveryStrategy(error, details = {}) {
    const message = (error?.message || String(error)).toLowerCase();
    if (details.requiresFallback || message.includes('permission') || message.includes('access')) {
      return 'fallback';
    }
    if (
      message.includes('memory') ||
      message.includes('resource') ||
      message.includes('oom') ||
      message.includes('heap')
    ) {
      return 'restart';
    }
    return 'retry';
  }
  async recoverAgentFailure(agentId, error, details = {}) {
    const circuitBreakerName = `agent:${agentId}`;
    await this.reportAgentError(agentId, error, details);
    const strategy = this.classifyRecoveryStrategy(error, details);
    const diagnostics = {
      agentId,
      strategy,
      phase: details.phase || 'unknown',
      iteration: details.iteration || null,
      recoverable: strategy !== 'fallback' || Boolean(details.fallbackAvailable),
      circuitState: this.getCircuitState(circuitBreakerName),
      error: {
        name: error?.name || 'Error',
        message: error?.message || String(error),
      },
    };
    const recovery = {
      agentId,
      recovered: false,
      strategy,
      timestamp: /* @__PURE__ */ new Date().toISOString(),
      diagnostics,
    };
    this.emit('agent-recovery', recovery);
    return recovery;
  }
  getCircuitState(name) {
    return this.circuitBreakers.get(name) || { state: 'closed', failures: 0 };
  }
  // Utility methods
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
};
SelfHealingOrchestrator = __decorateClass([singleton()], SelfHealingOrchestrator);
const orchestrator = new SelfHealingOrchestrator();
var self_healing_default = orchestrator;
export { SelfHealingOrchestrator, self_healing_default as default, orchestrator };
