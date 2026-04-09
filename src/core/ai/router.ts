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
import {
  MODEL_PROVIDER_MAP,
  PROVIDER_COST_TABLE,
  STRATEGY_PROVIDER_PRIORITIES,
  PROVIDER_PRIORITY_CONFIG,
  loadRouterConfigSync,
  mergeConfig,
} from './router-config.js';
import providerRegistry, { autoDiscoverProviders, getProvider } from './provider-registry.js';
import { ModelRouter } from './model-router.js';
import { ProviderFallback } from '../infrastructure/provider-fallback.js';
function toProviderName(modelId) {
  if (!modelId) return null;
  return MODEL_PROVIDER_MAP[modelId] || MODEL_PROVIDER_MAP[modelId.toLowerCase()] || null;
}
function ensureMetricsEntry(map, provider) {
  if (!map.has(provider)) {
    map.set(provider, {
      requests: 0,
      successes: 0,
      errors: 0,
      latencySamples: [],
      latencyP50: null,
      lastError: null,
    });
  }
  return map.get(provider);
}
function percentile(values, ratio) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * ratio)));
  return sorted[index];
}
function normalizeStrategy(strategy) {
  const normalized = (strategy || 'quality').toLowerCase();
  if (normalized === 'balanced') return 'quality';
  return normalized;
}
let SmartAIRouter = class {
  constructor(config = {}) {
    const loaded = loadRouterConfigSync();
    this.config = mergeConfig({ ...loaded, ...config });
    this.metrics = /* @__PURE__ */ new Map();
    this.initialized = false;
    this.registry = providerRegistry;
    this.providerFallback =
      config.providerFallback instanceof ProviderFallback
        ? config.providerFallback
        : new ProviderFallback(config.providerFallbackConfig || {});
  }
  async initialize() {
    if (this.initialized) return;
    await autoDiscoverProviders(this.config.providers || {});
    this.initialized = true;
  }
  getProviderMetrics() {
    const output = {};
    for (const [name, metric] of this.metrics.entries()) {
      output[name] = {
        ...metric,
      };
    }
    return output;
  }
  updateMetrics(provider, { latencyMs, success, error }) {
    const metric = ensureMetricsEntry(this.metrics, provider);
    metric.requests += 1;
    if (success) {
      metric.successes += 1;
      if (typeof latencyMs === 'number' && Number.isFinite(latencyMs)) {
        metric.latencySamples.push(latencyMs);
        if (metric.latencySamples.length > 100) {
          metric.latencySamples.shift();
        }
        metric.latencyP50 = percentile(metric.latencySamples, 0.5);
      }
    } else {
      metric.errors += 1;
      metric.lastError = error?.message || String(error);
    }
  }
  /**
   * Record the outcome of a routing decision for future optimization.
   * @param {Object} outcome - The outcome details
   */
  recordOutcome(outcome) {
    if (outcome.provider) {
      this.updateMetrics(outcome.provider, {
        latencyMs: outcome.latencyMs || 0,
        success: outcome.success !== false,
        error: outcome.error,
      });
    }
  }
  /**
   * Adjust provider profiles based on historical performance.
   */
  adjustProfiles() {
    return true;
  }
  /**
   * Clear all historical performance data and feedback.
   */
  clearFeedback() {
    this.metrics.clear();
    return true;
  }
  setProviderFallback(providerFallback) {
    this.providerFallback = providerFallback;
    return this;
  }
  getAvailableProviders() {
    return this.registry.listProviders();
  }
  sortProvidersByCost(providers) {
    return [...providers].sort((left, right) => {
      const leftCost = PROVIDER_COST_TABLE[left]?.input ?? Number.MAX_SAFE_INTEGER;
      const rightCost = PROVIDER_COST_TABLE[right]?.input ?? Number.MAX_SAFE_INTEGER;
      return leftCost - rightCost;
    });
  }
  sortProvidersByLatency(providers) {
    return [...providers].sort((left, right) => {
      const leftMetric = this.metrics.get(left);
      const rightMetric = this.metrics.get(right);
      const leftP50 = leftMetric?.latencyP50 ?? Number.MAX_SAFE_INTEGER;
      const rightP50 = rightMetric?.latencyP50 ?? Number.MAX_SAFE_INTEGER;
      return leftP50 - rightP50;
    });
  }
  sortProvidersByPriority(providers, strategy) {
    return [...providers].sort((left, right) => {
      const leftPriority = PROVIDER_PRIORITY_CONFIG[left]?.[strategy] ?? Number.MAX_SAFE_INTEGER;
      const rightPriority = PROVIDER_PRIORITY_CONFIG[right]?.[strategy] ?? Number.MAX_SAFE_INTEGER;
      return leftPriority - rightPriority;
    });
  }
  pickProviders(strategy, opts = {}) {
    const normalizedStrategy = normalizeStrategy(strategy);
    if (opts.provider) {
      return [opts.provider.toLowerCase()];
    }
    if (opts.model) {
      const mapped = toProviderName(opts.model);
      if (mapped) {
        return [mapped, ...STRATEGY_PROVIDER_PRIORITIES.fallback.filter((name) => name !== mapped)];
      }
    }
    if (normalizedStrategy === 'task-aware' && opts.task) {
      return this.pickProvidersByTask(opts.task, opts);
    }
    const configuredOrder =
      this.config?.strategies?.[normalizedStrategy]?.providerPriority ||
      STRATEGY_PROVIDER_PRIORITIES[normalizedStrategy] ||
      STRATEGY_PROVIDER_PRIORITIES.quality;
    const available = configuredOrder.filter((providerName) =>
      this.registry.getProvider(providerName)
    );
    if (normalizedStrategy === 'latency') {
      return this.sortProvidersByLatency(available);
    }
    if (normalizedStrategy === 'cost') {
      return this.sortProvidersByCost(available);
    }
    return this.sortProvidersByPriority(available, normalizedStrategy);
  }
  /**
   * Pick providers based on task classification using ModelRouter
   * @param {string} taskDescription - Task description for classification
   * @param {Object} opts - Options
   * @returns {string[]} Ordered list of provider names
   */
  pickProvidersByTask(taskDescription, opts = {}) {
    const modelRouter = new ModelRouter();
    const result = modelRouter.determineModel(taskDescription, opts);
    const primaryProvider = toProviderName(result.model);
    if (!primaryProvider) {
      return this.sortProvidersByPriority(
        STRATEGY_PROVIDER_PRIORITIES.quality.filter((name) => this.registry.getProvider(name)),
        'quality'
      );
    }
    const providers = [primaryProvider];
    for (const fallbackModel of result.routingConfig.fallbacks || []) {
      const fallbackProvider = toProviderName(fallbackModel);
      if (fallbackProvider && !providers.includes(fallbackProvider)) {
        providers.push(fallbackProvider);
      }
    }
    for (const provider of STRATEGY_PROVIDER_PRIORITIES.quality) {
      if (!providers.includes(provider) && this.registry.getProvider(provider)) {
        providers.push(provider);
      }
    }
    return providers.filter((name) => this.registry.getProvider(name));
  }
  // Load balancing: distribute requests across providers based on their capacity
  // Made deterministic by using provider name as tiebreaker
  async selectProviderWithLoadBalancing(strategy, opts = {}) {
    const providers = this.pickProviders(strategy, opts);
    const providerLoads = providers.map((provider) => {
      const metrics = this.metrics.get(provider) || { requests: 0, errors: 0 };
      const loadScore = metrics.requests - metrics.errors;
      return { provider, loadScore };
    });
    providerLoads.sort((a, b) => {
      if (a.loadScore !== b.loadScore) {
        return a.loadScore - b.loadScore;
      }
      return a.provider.localeCompare(b.provider);
    });
    return providerLoads.map((item) => item.provider);
  }
  // Latency fallback: try fastest providers first, fall back to slower ones
  // Made deterministic by using provider name as tiebreaker
  async selectProviderWithLatencyFallback(opts = {}) {
    const providers = this.pickProviders('latency', opts);
    return [...providers].sort((left, right) => {
      const leftMetric = this.metrics.get(left);
      const rightMetric = this.metrics.get(right);
      const leftP50 = leftMetric?.latencyP50 ?? Number.MAX_SAFE_INTEGER;
      const rightP50 = rightMetric?.latencyP50 ?? Number.MAX_SAFE_INTEGER;
      if (leftP50 !== rightP50) {
        return leftP50 - rightP50;
      }
      return left.localeCompare(right);
    });
  }
  resolveModelForProvider(providerName, requestedModel) {
    if (!requestedModel) return null;
    const mappedProvider = toProviderName(requestedModel);
    if (!mappedProvider || mappedProvider === providerName) {
      return requestedModel;
    }
    return null;
  }
  configureProviderFallback(providerNames, messages, opts = {}, stream = false) {
    const providerConfigs = [];
    for (let index = 0; index < providerNames.length; index++) {
      const providerName = providerNames[index];
      const provider = getProvider(providerName);
      if (!provider) {
        continue;
      }
      providerConfigs.push({
        name: providerName,
        priority: index + 1,
        costPer1kTokens: PROVIDER_COST_TABLE[providerName]?.input ?? Number.MAX_SAFE_INTEGER,
        enabled: true,
        execute: async () => {
          const providerTimeout = opts.providerTimeout || (stream ? 3e4 : 6e4);
          const operation = stream
            ? provider.stream(messages, opts)
            : provider.chat(messages, {
                ...opts,
                model: this.resolveModelForProvider(providerName, opts.model) || opts.model,
              });
          return await Promise.race([
            operation,
            new Promise((_, reject) =>
              setTimeout(
                () =>
                  reject(
                    new Error(`[router] Provider ${providerName} ${stream ? 'stream ' : ''}timeout`)
                  ),
                providerTimeout
              )
            ),
          ]);
        },
      });
    }
    this.providerFallback.syncProviders(providerConfigs);
    return providerConfigs.map((provider) => provider.name);
  }
  async routeRequest(messages, strategy = 'quality', opts = {}) {
    await this.initialize();
    const normalizedStrategy = normalizeStrategy(strategy);
    let providers = [];
    if (normalizedStrategy === 'latency') {
      providers = await this.selectProviderWithLatencyFallback(opts);
    } else {
      providers = await this.selectProviderWithLoadBalancing(normalizedStrategy, opts);
    }
    if (!providers.length) {
      throw new Error('[router] No providers available for routeRequest');
    }
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error('[router] Request timeout exceeded')),
        opts.timeout || 12e4
      );
    });
    const routingPromise = (async () => {
      if (providers.length === 0) {
        throw new Error('[router] No providers available for routeRequest');
      }
      const allowFallback = opts.fallback !== false || normalizedStrategy === 'fallback';
      const providerOrder = allowFallback ? providers : providers.slice(0, 1);
      this.configureProviderFallback(providerOrder, messages, opts, false);
      const result = await this.providerFallback.execute(
        { messages, opts },
        {
          providerOrder,
          onProviderSuccess: ({ provider, latencyMs }) => {
            this.updateMetrics(provider, {
              latencyMs,
              success: true,
            });
          },
          onProviderFailure: ({ provider, error }) => {
            this.updateMetrics(provider, {
              success: false,
              error,
            });
          },
        }
      );
      return {
        ...result.result,
        provider: result.provider,
        strategy: normalizedStrategy,
        attemptedProviders: result.attemptedProviders,
      };
    })();
    return Promise.race([routingPromise, timeoutPromise]);
  }
  async routeStream(messages, strategy = 'latency', opts = {}) {
    await this.initialize();
    const normalizedStrategy = normalizeStrategy(strategy);
    let providers = [];
    if (normalizedStrategy === 'latency') {
      providers = await this.selectProviderWithLatencyFallback(opts);
    } else {
      providers = await this.selectProviderWithLoadBalancing(normalizedStrategy, opts);
    }
    if (!providers.length) {
      throw new Error('[router] No providers available for routeStream');
    }
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error('[router] Stream request timeout exceeded')),
        opts.timeout || 12e4
      );
    });
    const routingPromise = (async () => {
      if (providers.length === 0) {
        throw new Error('[router] No providers available for routeStream');
      }
      this.configureProviderFallback(providers, messages, opts, true);
      const result = await this.providerFallback.execute(
        { messages, opts },
        {
          providerOrder: providers,
          onProviderFailure: ({ provider, error }) => {
            this.updateMetrics(provider, { success: false, error });
          },
        }
      );
      return result.result;
    })();
    return Promise.race([routingPromise, timeoutPromise]);
  }
};
SmartAIRouter = __decorateClass([singleton()], SmartAIRouter);
const smartRouter = new SmartAIRouter();
function selectModel(agentId, strategy = 'quality') {
  const lower = String(agentId || '').toLowerCase();
  const normalized = normalizeStrategy(strategy);
  if (lower.includes('reason') || lower.includes('plan') || lower.includes('review')) {
    return normalized === 'cost' ? 'deepseek-v3' : 'claude-sonnet-4-0';
  }
  if (lower.includes('code') || lower.includes('backend') || lower.includes('frontend')) {
    return normalized === 'latency' ? 'gpt-4o-mini' : 'gpt-4o';
  }
  if (normalized === 'cost') return 'deepseek-v3';
  if (normalized === 'latency') return 'llama-3.3-70b-versatile';
  return 'gpt-4o';
}
function estimateCost(model, inputTokens = 0, outputTokens = 0) {
  const provider = toProviderName(model) || 'openai';
  const rates = PROVIDER_COST_TABLE[provider] || PROVIDER_COST_TABLE.openai;
  return (inputTokens * rates.input + outputTokens * rates.output) / 1e6;
}
var router_default = smartRouter;
export { SmartAIRouter, router_default as default, estimateCost, selectModel, smartRouter };
