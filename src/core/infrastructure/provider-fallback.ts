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
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
let CircuitBreaker = class extends EventEmitter {
  constructor(config = {}) {
    super();
    this.name = config.name || 'provider';
    this.failureThreshold = config.failureThreshold || 3;
    this.resetTimeoutMs = config.resetTimeoutMs || 3e4;
    this.successThreshold = config.successThreshold || 1;
    this.timeoutMs = config.timeoutMs || 0;
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.halfOpenSuccesses = 0;
    this.openedAt = null;
    this.lastError = null;
    this.stats = {
      success: 0,
      failure: 0,
      rejected: 0,
    };
  }
  canExecute() {
    if (this.state !== 'OPEN') {
      return true;
    }
    if (this.openedAt && Date.now() - this.openedAt >= this.resetTimeoutMs) {
      this.transitionTo('HALF_OPEN');
      return true;
    }
    return false;
  }
  async execute(operation, fallback = null) {
    if (!this.canExecute()) {
      this.stats.rejected++;
      const error = new Error(`Circuit breaker "${this.name}" is OPEN`);
      if (fallback) {
        return await fallback(error);
      }
      throw error;
    }
    try {
      const result = await this.withTimeout(operation);
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure(error);
      if (fallback) {
        return await fallback(error);
      }
      throw error;
    }
  }
  async withTimeout(operation) {
    if (!this.timeoutMs) {
      return await operation();
    }
    return await Promise.race([
      operation(),
      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(new Error(`Circuit breaker "${this.name}" timed out after ${this.timeoutMs}ms`)),
          this.timeoutMs
        )
      ),
    ]);
  }
  recordSuccess() {
    this.stats.success++;
    this.consecutiveFailures = 0;
    this.lastError = null;
    if (this.state === 'HALF_OPEN') {
      this.halfOpenSuccesses++;
      if (this.halfOpenSuccesses >= this.successThreshold) {
        this.transitionTo('CLOSED');
      }
      return;
    }
    this.transitionTo('CLOSED');
  }
  recordFailure(error) {
    this.stats.failure++;
    this.consecutiveFailures++;
    this.lastError = error?.message || String(error);
    this.halfOpenSuccesses = 0;
    if (this.state === 'HALF_OPEN' || this.consecutiveFailures >= this.failureThreshold) {
      this.openedAt = Date.now();
      this.transitionTo('OPEN');
    }
  }
  transitionTo(state) {
    if (this.state === state) {
      return;
    }
    const previous = this.state;
    this.state = state;
    if (state !== 'OPEN') {
      this.openedAt = null;
    }
    if (state === 'CLOSED') {
      this.consecutiveFailures = 0;
      this.halfOpenSuccesses = 0;
    }
    this.emit('state-change', { name: this.name, from: previous, to: state });
  }
  forceState(state) {
    if (state === 'OPEN') {
      this.openedAt = Date.now();
    }
    this.transitionTo(state);
  }
  reset() {
    this.forceState('CLOSED');
    this.lastError = null;
  }
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureThreshold: this.failureThreshold,
      resetTimeoutMs: this.resetTimeoutMs,
      lastError: this.lastError,
      consecutiveFailures: this.consecutiveFailures,
      openedAt: this.openedAt,
      stats: { ...this.stats },
    };
  }
};
CircuitBreaker = __decorateClass([singleton()], CircuitBreaker);
let CircuitBreakerRegistry = class {
  constructor(config = {}) {
    this.config = {
      failureThreshold: config.failureThreshold || 3,
      resetTimeoutMs: config.resetTimeoutMs || 3e4,
      successThreshold: config.successThreshold || 1,
      timeoutMs: config.timeoutMs || 0,
    };
    this.breakers = /* @__PURE__ */ new Map();
  }
  get(name, overrides = {}) {
    if (!this.breakers.has(name)) {
      this.breakers.set(
        name,
        new CircuitBreaker({
          name,
          ...this.config,
          ...overrides,
        })
      );
    }
    return this.breakers.get(name);
  }
  resetAll() {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
  getDashboard() {
    const statuses = Array.from(this.breakers.values()).map((breaker) => breaker.getStatus());
    return {
      total: statuses.length,
      closed: statuses.filter((status) => status.state === 'CLOSED').length,
      open: statuses.filter((status) => status.state === 'OPEN').length,
      halfOpen: statuses.filter((status) => status.state === 'HALF_OPEN').length,
      breakers: Object.fromEntries(statuses.map((status) => [status.name, status])),
    };
  }
};
CircuitBreakerRegistry = __decorateClass([singleton()], CircuitBreakerRegistry);
let ProviderFallback = class extends EventEmitter {
  constructor(config = {}) {
    super();
    this.strategy = config.strategy || 'priority';
    this.failureThreshold = config.failureThreshold || 3;
    this.resetTimeoutMs = config.resetTimeoutMs || 3e4;
    this.timeoutMs = config.timeoutMs || 3e4;
    this.fallbackDelayMs = config.fallbackDelayMs || 0;
    this.registry =
      config.circuitBreakers ||
      new CircuitBreakerRegistry({
        failureThreshold: this.failureThreshold,
        resetTimeoutMs: this.resetTimeoutMs,
        timeoutMs: this.timeoutMs,
      });
    this.providers = /* @__PURE__ */ new Map();
    this.stats = {
      executions: 0,
      successes: 0,
      failures: 0,
      failovers: 0,
    };
  }
  addProvider(name, config = {}) {
    const current = this.providers.get(name);
    const circuitBreaker =
      current?.circuitBreaker ||
      this.registry.get(name, {
        name,
        failureThreshold: config.failureThreshold || this.failureThreshold,
        resetTimeoutMs: config.resetTimeoutMs || this.resetTimeoutMs,
        timeoutMs: config.timeoutMs || this.timeoutMs,
      });
    const provider = {
      name,
      priority:
        config.priority !== void 0
          ? config.priority
          : current?.priority !== void 0
            ? current.priority
            : 1,
      costPer1kTokens:
        config.costPer1kTokens !== void 0
          ? config.costPer1kTokens
          : current?.costPer1kTokens !== void 0
            ? current.costPer1kTokens
            : 0,
      enabled:
        config.enabled !== void 0
          ? config.enabled
          : current?.enabled !== void 0
            ? current.enabled
            : true,
      execute: config.execute || current?.execute || (async () => ({ ok: true })),
      healthCheck: config.healthCheck || current?.healthCheck || null,
      metadata: config.metadata || current?.metadata || {},
      circuitBreaker,
    };
    this.providers.set(name, provider);
    return provider;
  }
  syncProviders(providers = []) {
    for (const provider of providers) {
      this.addProvider(provider.name, provider);
    }
    return this;
  }
  setEnabled(name, enabled) {
    const provider = this.providers.get(name);
    if (!provider) {
      return false;
    }
    provider.enabled = enabled;
    return true;
  }
  getExecutionOrder(providerOrder = null) {
    const entries = providerOrder
      ? providerOrder.map((name) => this.providers.get(name)).filter(Boolean)
      : Array.from(this.providers.values());
    const enabledEntries = entries.filter((provider) => provider.enabled !== false);
    if (providerOrder) {
      return enabledEntries;
    }
    if (this.strategy === 'cost-optimized') {
      return enabledEntries.sort((left, right) => {
        if (left.costPer1kTokens !== right.costPer1kTokens) {
          return left.costPer1kTokens - right.costPer1kTokens;
        }
        return left.priority - right.priority;
      });
    }
    return enabledEntries.sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority - right.priority;
      }
      return left.costPer1kTokens - right.costPer1kTokens;
    });
  }
  async execute(payload, options = {}) {
    const order = this.getExecutionOrder(options.providerOrder);
    if (!order.length) {
      throw new Error('No providers available');
    }
    this.stats.executions++;
    const attemptedProviders = [];
    let lastError = null;
    for (let index = 0; index < order.length; index++) {
      const provider = order[index];
      attemptedProviders.push(provider.name);
      options.onProviderAttempt?.({
        provider: provider.name,
        attempt: index + 1,
        attemptedProviders: [...attemptedProviders],
      });
      const startedAt = Date.now();
      try {
        const result = await provider.circuitBreaker.execute(
          async () =>
            await provider.execute(payload, { providerName: provider.name, attempt: index + 1 }),
          async (error) => {
            throw error;
          }
        );
        const latencyMs = Date.now() - startedAt;
        if (index > 0) {
          this.stats.failovers++;
        }
        this.stats.successes++;
        const summary = {
          provider: provider.name,
          result,
          latencyMs,
          attemptedProviders: [...attemptedProviders],
        };
        this.emit('provider:success', summary);
        options.onProviderSuccess?.(summary);
        return summary;
      } catch (error) {
        lastError = error;
        const failure = {
          provider: provider.name,
          error,
          attemptedProviders: [...attemptedProviders],
        };
        this.emit('provider:failure', failure);
        options.onProviderFailure?.(failure);
        if (index < order.length - 1 && this.fallbackDelayMs > 0) {
          await sleep(this.fallbackDelayMs);
        }
      }
    }
    this.stats.failures++;
    throw new Error(
      `All providers failed [${attemptedProviders.join(', ')}]: ${lastError?.message || 'unknown error'}`
    );
  }
  async healthCheck() {
    const results = {};
    for (const [name, provider] of this.providers.entries()) {
      let customHealth = null;
      if (typeof provider.healthCheck === 'function') {
        try {
          customHealth = await provider.healthCheck();
        } catch (error) {
          customHealth = {
            status: 'unhealthy',
            error: error?.message || String(error),
          };
        }
      }
      results[name] = {
        enabled: provider.enabled !== false,
        priority: provider.priority,
        costPer1kTokens: provider.costPer1kTokens,
        circuitBreaker: provider.circuitBreaker.getStatus(),
        ...(customHealth || {}),
      };
    }
    return results;
  }
  getStats() {
    return {
      ...this.stats,
      totalProviders: this.providers.size,
      strategy: this.strategy,
    };
  }
  getDashboard() {
    return {
      ...this.getStats(),
      circuitBreakers: this.registry.getDashboard(),
      providers: Object.fromEntries(
        Array.from(this.providers.entries()).map(([name, provider]) => [
          name,
          {
            enabled: provider.enabled !== false,
            priority: provider.priority,
            costPer1kTokens: provider.costPer1kTokens,
            state: provider.circuitBreaker.getStatus().state,
          },
        ])
      ),
    };
  }
};
ProviderFallback = __decorateClass([singleton()], ProviderFallback);
var provider_fallback_default = ProviderFallback;
export {
  CircuitBreaker,
  CircuitBreakerRegistry,
  ProviderFallback,
  provider_fallback_default as default,
};
