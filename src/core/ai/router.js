// Copyright (c) 2026 Ultra-Dex

import {
  MODEL_PROVIDER_MAP,
  PROVIDER_COST_TABLE,
  STRATEGY_PROVIDER_PRIORITIES,
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

    if (normalizedStrategy === 'latency') {
      return this.sortProvidersByLatency(available);
    }

    if (normalizedStrategy === 'cost') {
      return this.sortProvidersByCost(available);
    }

    return available;
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
    const providers = this.pickProviders(normalizedStrategy, opts);

    if (!providers.length) {
      throw new Error('[router] No providers available for routeRequest');
    }

    const attemptedProviders = [];
    let lastError = null;

    for (let index = 0; index < providers.length; index++) {
      const providerName = providers[index];
      const provider = getProvider(providerName);
      if (!provider) continue;

      attemptedProviders.push(providerName);
      const startedAt = Date.now();

      try {
        const model = this.resolveModelForProvider(providerName, opts.model);
        const result = await provider.chat(messages, {
          ...opts,
          model: model || opts.model,
        });

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
      }
    }

    const reason = lastError?.message || 'unknown routing failure';
    throw new Error(`[router] Request failed after providers [${attemptedProviders.join(', ')}]: ${reason}`);
  }

  async routeStream(messages, strategy = 'latency', opts = {}) {
    await this.initialize();

    const normalizedStrategy = normalizeStrategy(strategy);
    const providers = this.pickProviders(normalizedStrategy, opts);
    if (!providers.length) {
      throw new Error('[router] No providers available for routeStream');
    }

    let lastError = null;
    for (const providerName of providers) {
      const provider = getProvider(providerName);
      if (!provider) continue;

      try {
        return await provider.stream(messages, opts);
      } catch (error) {
        this.updateMetrics(providerName, { success: false, error });
        lastError = error;
      }
    }

    throw new Error(`[router] Stream failed for all providers: ${lastError?.message || 'unknown error'}`);
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
