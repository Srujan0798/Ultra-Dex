// Copyright (c) 2026 Ultra-Dex

import {
  MODEL_PROVIDER_MAP,
  PROVIDER_COST_TABLE,
  STRATEGY_PROVIDER_PRIORITIES,
  PROVIDER_PRIORITY_CONFIG,
  loadRouterConfigSync,
  mergeConfig,
} from './router-config.js';
import providerRegistry, {
  autoDiscoverProviders,
  getProvider,
  resolveModel as resolveProviderByModel,
} from './provider-registry.js';

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

export class SmartAIRouter {
  constructor(config = {}) {
    const loaded = loadRouterConfigSync();
    this.config = mergeConfig({ ...loaded, ...config });
    this.metrics = new Map();
    this.initialized = false;
    this.registry = providerRegistry;
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

    const configuredOrder =
      this.config?.strategies?.[normalizedStrategy]?.providerPriority ||
      STRATEGY_PROVIDER_PRIORITIES[normalizedStrategy] ||
      STRATEGY_PROVIDER_PRIORITIES.quality;

    const available = configuredOrder.filter((providerName) => this.registry.getProvider(providerName));

    // Apply different sorting based on strategy
    if (normalizedStrategy === 'latency') {
      return this.sortProvidersByLatency(available);
    }

    if (normalizedStrategy === 'cost') {
      return this.sortProvidersByCost(available);
    }

    // For quality and other strategies, use priority-based sorting
    return this.sortProvidersByPriority(available, normalizedStrategy);
  }

  // Load balancing: distribute requests across providers based on their capacity
  async selectProviderWithLoadBalancing(strategy, opts = {}) {
    const providers = this.pickProviders(strategy, opts);
    
    // Get metrics for each provider to determine load
    const providerLoads = providers.map(provider => {
      const metrics = this.metrics.get(provider) || { requests: 0, errors: 0 };
      // Calculate a load score (lower is better)
      const loadScore = metrics.requests - metrics.errors; // Fewer requests and more errors = higher load
      return { provider, loadScore };
    });
    
    // Sort by load score (ascending - lowest load first)
    providerLoads.sort((a, b) => a.loadScore - b.loadScore);
    
    return providerLoads.map(item => item.provider);
  }

  // Latency fallback: try fastest providers first, fall back to slower ones
  async selectProviderWithLatencyFallback(opts = {}) {
    const providers = this.pickProviders('latency', opts);
    
    // Sort by historical latency if available
    return [...providers].sort((left, right) => {
      const leftMetric = this.metrics.get(left);
      const rightMetric = this.metrics.get(right);
      const leftP50 = leftMetric?.latencyP50 ?? Number.MAX_SAFE_INTEGER;
      const rightP50 = rightMetric?.latencyP50 ?? Number.MAX_SAFE_INTEGER;
      return leftP50 - rightP50;
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

  async routeRequest(messages, strategy = 'quality', opts = {}) {
    await this.initialize();

    const normalizedStrategy = normalizeStrategy(strategy);

    // Use enhanced provider selection based on strategy
    let providers = [];
    if (normalizedStrategy === 'latency') {
      providers = await this.selectProviderWithLatencyFallback(opts);
    } else {
      providers = await this.selectProviderWithLoadBalancing(normalizedStrategy, opts);
    }

    if (!providers.length) {
      throw new Error('[router] No providers available for routeRequest');
    }

    const attemptedProviders = [];
    let lastError = null;
    
    // Add timeout for the entire routing operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('[router] Request timeout exceeded')), opts.timeout || 120000); // 2 minute default timeout
    });
    
    const routingPromise = (async () => {
      for (let index = 0; index < providers.length; index++) {
        const providerName = providers[index];
        const provider = getProvider(providerName);
        if (!provider) continue;

        attemptedProviders.push(providerName);
        const startedAt = Date.now();

        try {
          // Add individual provider timeout
          const providerTimeout = opts.providerTimeout || 60000; // 1 minute default
          
          const resultPromise = provider.chat(messages, {
            ...opts,
            model: this.resolveModelForProvider(providerName, opts.model) || opts.model,
          });
          
          // Race the provider call with its timeout
          const result = await Promise.race([
            resultPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`[router] Provider ${providerName} timeout`)), providerTimeout)
            )
          ]);

          this.updateMetrics(providerName, {
            latencyMs: Date.now() - startedAt,
            success: true,
          });

          return {
            ...result,
            provider: providerName,
            strategy: normalizedStrategy,
            attemptedProviders,
          };
        } catch (error) {
          this.updateMetrics(providerName, {
            success: false,
            error,
          });

          lastError = error;

          const allowFallback = opts.fallback !== false || normalizedStrategy === 'fallback';
          if (!allowFallback) {
            break;
          }
          
          // Add small delay before trying next provider to avoid overwhelming
          if (index < providers.length - 1) {
            await new Promise(resolve => setTimeout(resolve, opts.providerDelay || 100)); // 100ms default delay
          }
        }
      }

      const reason = lastError?.message || 'unknown routing failure';
      throw new Error(`[router] Request failed after providers [${attemptedProviders.join(', ')}]: ${reason}`);
    })();

    // Race the routing operation with the overall timeout
    return Promise.race([routingPromise, timeoutPromise]);
  }

  async routeStream(messages, strategy = 'latency', opts = {}) {
    await this.initialize();

    const normalizedStrategy = normalizeStrategy(strategy);

    // Use enhanced provider selection based on strategy
    let providers = [];
    if (normalizedStrategy === 'latency') {
      providers = await this.selectProviderWithLatencyFallback(opts);
    } else {
      providers = await this.selectProviderWithLoadBalancing(normalizedStrategy, opts);
    }

    if (!providers.length) {
      throw new Error('[router] No providers available for routeStream');
    }

    let lastError = null;
    
    // Add timeout for the entire stream routing operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('[router] Stream request timeout exceeded')), opts.timeout || 120000); // 2 minute default timeout
    });
    
    const routingPromise = (async () => {
      for (const providerName of providers) {
        const provider = getProvider(providerName);
        if (!provider) continue;

        try {
          // Add individual provider timeout for stream initialization
          const providerTimeout = opts.providerTimeout || 30000; // 30 seconds default for stream init
          
          const streamPromise = provider.stream(messages, opts);
          
          // Race the provider stream call with its timeout
          const stream = await Promise.race([
            streamPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`[router] Provider ${providerName} stream timeout`)), providerTimeout)
            )
          ]);

          return stream;
        } catch (error) {
          this.updateMetrics(providerName, { success: false, error });
          lastError = error;
          
          // Add small delay before trying next provider to avoid overwhelming
          await new Promise(resolve => setTimeout(resolve, opts.providerDelay || 100)); // 100ms default delay
        }
      }

      throw new Error(`[router] Stream failed for all providers: ${lastError?.message || 'unknown error'}`);
    })();

    // Race the routing operation with the overall timeout
    return Promise.race([routingPromise, timeoutPromise]);
  }
}

export const smartRouter = new SmartAIRouter();

// Backward-compatible utility exports
export function selectModel(agentId, strategy = 'quality') {
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

export function estimateCost(model, inputTokens = 0, outputTokens = 0) {
  const provider = toProviderName(model) || 'openai';
  const rates = PROVIDER_COST_TABLE[provider] || PROVIDER_COST_TABLE.openai;
  return ((inputTokens * rates.input) + (outputTokens * rates.output)) / 1000000;
}

export default smartRouter;
