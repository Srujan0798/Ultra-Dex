/**
 * AI Provider Router with Fallback
 * Routes requests across multiple providers with automatic failover
 *
 * @module AIProviderRouter
 * @version 1.0.0
 */

import { EventEmitter } from 'events';

class AIProviderRouter extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      defaultProvider: config.defaultProvider || 'openai',
      fallbackEnabled: config.fallbackEnabled !== false,
      costOptimization: config.costOptimization !== false,
      latencyTarget: config.latencyTarget || 2000,
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 30000,
      ...config,
    };

    this.providers = new Map();
    this.models = new Map();
    this.healthStatus = new Map();
    this.costTracking = new Map();
    this.metrics = {
      requests: 0,
      successes: 0,
      failures: 0,
      fallbacks: 0,
      tokensIn: 0,
      tokensOut: 0,
      cost: 0,
    };

    this.initialized = false;
  }

  /**
   * Initialize the router
   */
  async initialize() {
    // Initialize health checks
    this._startHealthChecks();

    this.initialized = true;
    this.emit('initialized');
    return true;
  }

  /**
   * Register an AI provider
   * @param {string} providerId - Provider ID
   * @param {Object} provider - Provider instance
   * @param {Object} config - Provider configuration
   */
  registerProvider(providerId, provider, config = {}) {
    if (this.providers.has(providerId)) {
      throw new Error(`Provider '${providerId}' already registered`);
    }

    const providerConfig = {
      id: providerId,
      name: config.name || providerId,
      instance: provider,
      models: config.models || [],
      priority: config.priority || 1,
      costPer1kTokens: config.costPer1kTokens || { input: 0.01, output: 0.03 },
      maxTokens: config.maxTokens || 4096,
      enabled: config.enabled !== false,
      timeout: config.timeout || this.config.timeout,
      ...config,
    };

    this.providers.set(providerId, providerConfig);
    this.healthStatus.set(providerId, {
      status: 'unknown',
      lastCheck: null,
      consecutiveFailures: 0,
      averageLatency: 0,
    });

    // Index models
    providerConfig.models.forEach((model) => {
      this.models.set(model.id, {
        ...model,
        provider: providerId,
      });
    });

    this.emit('provider:registered', { providerId, models: providerConfig.models.length });
  }

  /**
   * Chat completion with routing and fallback
   * @param {Array<Object>} messages - Chat messages
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Completion result
   */
  async chat(messages, options = {}) {
    this._ensureInitialized();

    const {
      model: requestedModel,
      provider: requestedProvider,
      strategy = 'cost', // 'cost', 'quality', 'latency', 'fallback'
      maxCost = null,
      timeout = this.config.timeout,
      stream = false,
    } = options;

    this.metrics.requests++;
    const startTime = Date.now();

    try {
      // Select provider based on strategy
      const provider = await this._selectProvider({
        requestedProvider,
        requestedModel,
        strategy,
        maxCost,
      });

      if (!provider) {
        throw new Error('No available provider found');
      }

      // Execute request
      const result = await this._executeWithTimeout(provider, messages, options, timeout);

      const latency = Date.now() - startTime;

      // Update metrics
      this.metrics.successes++;
      this.metrics.tokensIn += result.usage?.inputTokens || 0;
      this.metrics.tokensOut += result.usage?.outputTokens || 0;

      const cost = this._calculateCost(provider, result.usage);
      this.metrics.cost += cost;

      // Update health status
      this._updateHealthStatus(provider.id, 'healthy', latency);

      this.emit('request:success', {
        provider: provider.id,
        model: result.model,
        latency,
        cost,
      });

      return {
        ...result,
        provider: provider.id,
        latency,
        cost,
      };
    } catch (error) {
      this.metrics.failures++;

      // Try fallback if enabled
      if (this.config.fallbackEnabled && strategy !== 'fallback') {
        this.emit('request:fallback', { error: error.message });
        this.metrics.fallbacks++;

        return this.chat(messages, {
          ...options,
          strategy: 'fallback',
          excludeProvider: requestedProvider,
        });
      }

      this.emit('request:error', { error });
      throw error;
    }
  }

  /**
   * Stream chat completion
   * @param {Array<Object>} messages - Chat messages
   * @param {Object} options - Request options
   * @returns {AsyncGenerator} Stream generator
   */
  async *streamChat(messages, options = {}) {
    this._ensureInitialized();

    const provider = await this._selectProvider({
      requestedProvider: options.provider,
      requestedModel: options.model,
      strategy: options.strategy || 'cost',
    });

    if (!provider) {
      throw new Error('No available provider found');
    }

    try {
      const stream = provider.instance.stream(messages, options);

      for await (const chunk of stream) {
        yield {
          ...chunk,
          provider: provider.id,
        };
      }
    } catch (error) {
      this.metrics.failures++;
      throw error;
    }
  }

  /**
   * Get embeddings from provider
   * @param {string|Array<string>} input - Text to embed
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Embeddings result
   */
  async embed(input, options = {}) {
    this._ensureInitialized();

    const provider = await this._selectProvider({
      requestedProvider: options.provider,
      capability: 'embeddings',
      strategy: 'cost',
    });

    if (!provider) {
      throw new Error('No provider with embedding capability found');
    }

    return provider.instance.embed(input, options);
  }

  /**
   * Get provider health status
   * @param {string} providerId - Provider ID
   * @returns {Object} Health status
   */
  getHealth(providerId) {
    if (providerId) {
      return this.healthStatus.get(providerId) || null;
    }

    return Object.fromEntries(this.healthStatus);
  }

  /**
   * Get routing statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const successRate =
      this.metrics.requests > 0
        ? ((this.metrics.successes / this.metrics.requests) * 100).toFixed(2)
        : 0;

    return {
      ...this.metrics,
      successRate: `${successRate}%`,
      providers: this.providers.size,
      models: this.models.size,
    };
  }

  /**
   * List available models
   * @param {Object} filters - Filter options
   * @returns {Array<Object>} List of models
   */
  listModels(filters = {}) {
    let models = Array.from(this.models.values());

    if (filters.capability) {
      models = models.filter((m) => m.capabilities?.includes(filters.capability));
    }

    if (filters.provider) {
      models = models.filter((m) => m.provider === filters.provider);
    }

    return models;
  }

  /**
   * Enable/disable provider
   * @param {string} providerId - Provider ID
   * @param {boolean} enabled - Enabled status
   */
  setProviderStatus(providerId, enabled) {
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.enabled = enabled;
      this.emit('provider:status', { providerId, enabled });
    }
  }

  // Private methods
  _ensureInitialized() {
    if (!this.initialized) {
      throw new Error('Router not initialized. Call initialize() first.');
    }
  }

  async _selectProvider(options) {
    const { requestedProvider, requestedModel, strategy, maxCost, excludeProvider, capability } =
      options;

    let candidates = Array.from(this.providers.values()).filter(
      (p) => p.enabled && p.id !== excludeProvider
    );

    // Filter by capability if specified
    if (capability) {
      candidates = candidates.filter((p) =>
        p.models.some((m) => m.capabilities?.includes(capability))
      );
    }

    // Filter by max cost
    if (maxCost) {
      candidates = candidates.filter((p) => p.costPer1kTokens.input <= maxCost);
    }

    // Filter healthy providers
    candidates = candidates.filter((p) => {
      const health = this.healthStatus.get(p.id);
      return health.status !== 'unhealthy' || health.consecutiveFailures < 3;
    });

    if (candidates.length === 0) {
      return null;
    }

    // If specific provider requested
    if (requestedProvider) {
      return candidates.find((p) => p.id === requestedProvider) || candidates[0];
    }

    // If specific model requested
    if (requestedModel) {
      const model = this.models.get(requestedModel);
      if (model) {
        return candidates.find((p) => p.id === model.provider) || candidates[0];
      }
    }

    // Apply routing strategy
    switch (strategy) {
      case 'cost':
        return candidates.sort((a, b) => a.costPer1kTokens.input - b.costPer1kTokens.input)[0];

      case 'quality':
        return candidates.sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];

      case 'latency':
        return candidates.sort((a, b) => {
          const healthA = this.healthStatus.get(a.id);
          const healthB = this.healthStatus.get(b.id);
          return (healthA?.averageLatency || Infinity) - (healthB?.averageLatency || Infinity);
        })[0];

      case 'fallback':
        // Try providers in order of priority until one works
        return candidates.sort((a, b) => (a.priority || 1) - (b.priority || 1))[0];

      default:
        return candidates[0];
    }
  }

  async _executeWithTimeout(provider, messages, options, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);

      provider.instance
        .chat(messages, options)
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  _calculateCost(provider, usage) {
    if (!usage) return 0;

    const inputCost = (usage.inputTokens / 1000) * provider.costPer1kTokens.input;
    const outputCost = (usage.outputTokens / 1000) * provider.costPer1kTokens.output;

    return inputCost + outputCost;
  }

  _updateHealthStatus(providerId, status, latency) {
    const health = this.healthStatus.get(providerId);
    if (!health) return;

    health.status = status;
    health.lastCheck = new Date().toISOString();

    if (status === 'healthy') {
      health.consecutiveFailures = 0;
    } else {
      health.consecutiveFailures++;
      if (health.consecutiveFailures >= 3) {
        health.status = 'unhealthy';
      }
    }

    // Update average latency
    health.averageLatency = health.averageLatency
      ? health.averageLatency * 0.9 + latency * 0.1
      : latency;
  }

  _startHealthChecks() {
    setInterval(async () => {
      for (const [providerId, provider] of this.providers) {
        if (!provider.enabled) continue;

        try {
          // Simple health check - try to list models
          await provider.instance.listModels?.();
          this._updateHealthStatus(providerId, 'healthy', 100);
        } catch (error) {
          this._updateHealthStatus(providerId, 'error', 0);
        }
      }
    }, 60000); // Check every minute
  }
}

export { AIProviderRouter };
export default AIProviderRouter;
