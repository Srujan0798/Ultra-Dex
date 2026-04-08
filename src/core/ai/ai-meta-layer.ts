var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
import { singleton } from "tsyringe";
import { logger } from '../../utils/logging.js';
import { performance } from "perf_hooks";
import { RateLimiter } from '../infrastructure/rate-limiter.js';
import { StreamPipeline } from '../infrastructure/stream-pipeline.js';
import { RedisCache } from '../cache/redis-cache.js';
import { usageMeter } from '../billing/usage-meter.js';
import { billingService } from '../billing/billing-service.js';
import {
  container,
  registerAlias,
  registerSingleton,
  resolveFromContainer
} from '../di/container.js';
import { DI_TOKENS } from '../di/tokens.js';

interface BatchRequest {
  model: string;
  messages: any[];
  options: any;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

let AIMetaLayer = class {
  private batchQueue: BatchRequest[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly batchWindowMs = 50;
  private readonly maxBatchSize = 10;
  private redisCache?: RedisCache;

  constructor(config: any = {}) {
    this.providers = /* @__PURE__ */ new Map();
    this.activeProvider = null;
    this.config = {
      defaultProvider: config.defaultProvider || "openai",
      enableRouting: config.enableRouting !== false,
      enableFallback: config.enableFallback !== false,
      enableCaching: config.enableCaching !== false,
      enableMonitoring: config.enableMonitoring !== false,
      enableBatching: config.enableBatching || false,
      ...config
    };
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      totalTokens: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    this.cache = /* @__PURE__ */ new Map(); // Local fallback cache
    this.cacheExpiry = config.cacheExpiry || 3e5;
    this.mockMode = config.mockMode || process.env.MOCK_AI === "true";
    this.rateLimiter = config.rateLimiter instanceof RateLimiter ? config.rateLimiter : config.rateLimiter ? new RateLimiter(config.rateLimiter) : null;
    this.streamPipeline = config.streamPipeline instanceof StreamPipeline ? config.streamPipeline : config.streamPipeline ? new StreamPipeline(config.streamPipeline) : null;
    
    // Resolve RedisCache manually from container
    try {
      if (container.isRegistered(DI_TOKENS.RedisCache)) {
        this.redisCache = container.resolve(DI_TOKENS.RedisCache);
      }
    } catch {
      // Optional dependency
    }

    this.initializeProviders();
  }
  /**
   * Initialize all configured AI providers
   */
  initializeProviders() {
    this.providers.set("mock", {
      client: (_model) => ({
        call: async (opts) => ({
          text: `Mock response for: ${opts.messages[opts.messages.length - 1].content}`,
          usage: { totalTokens: 10 }
        }),
        generateObject: async (opts) => ({
          object: this.generateMockObject(opts.schema),
          usage: { totalTokens: 15 }
        }),
        generateText: async (opts) => {
          const lastMessage = opts.messages[opts.messages.length - 1].content;
          if ((lastMessage.includes("Objective") || lastMessage.includes("Relevant")) && !opts.messages.some((m) => m.role === "tool")) {
            return {
              text: "I should check the codebase first.",
              toolCalls: [
                {
                  toolCallId: "call_" + Math.random().toString(36).substr(2, 9),
                  toolName: "query_codebase",
                  args: { query: "server", type: "files" }
                }
              ],
              usage: { totalTokens: 20 }
            };
          }
          return {
            text: `Mock response for: ${lastMessage.substring(0, 50)}...`,
            usage: { totalTokens: 10 }
          };
        },
        stream: async (_opts) => ({
          // Minimal stream mock
          async *[Symbol.asyncIterator]() {
            yield { text: "Mock " };
            yield { text: "stream " };
            yield { text: "response" };
          }
        })
      }),
      defaultModel: "mock-model",
      config: {}
    });
    if (this.config.providers?.openai?.enabled !== false) {
      const openaiConfig = this.config.providers?.openai || {};
      this.providers.set("openai", {
        client: null,
        loadClient: async () => (await import("@ai-sdk/openai")).openai,
        defaultModel: openaiConfig.defaultModel || "gpt-4o-2024-11-20",
        apiKey: openaiConfig.apiKey || process.env.OPENAI_API_KEY,
        config: openaiConfig
      });
    }
    if (this.config.providers?.anthropic?.enabled !== false) {
      const anthropicConfig = this.config.providers?.anthropic || {};
      this.providers.set("anthropic", {
        client: null,
        loadClient: async () => (await import("@ai-sdk/anthropic")).anthropic,
        defaultModel: anthropicConfig.defaultModel || "claude-3-5-sonnet-latest",
        apiKey: anthropicConfig.apiKey || process.env.ANTHROPIC_API_KEY,
        config: anthropicConfig
      });
    }
    if (this.config.providers?.google?.enabled !== false) {
      const googleConfig = this.config.providers?.google || {};
      this.providers.set("google", {
        client: null,
        loadClient: async () => (await import("@ai-sdk/google")).google,
        defaultModel: googleConfig.defaultModel || "gemini-2.0-flash-exp",
        apiKey: googleConfig.apiKey || process.env.GOOGLE_API_KEY,
        config: googleConfig
      });
    }
    if (this.config.providers?.ollama?.enabled !== false) {
      const ollamaConfig = this.config.providers?.ollama || {};
      this.providers.set("ollama", {
        client: null,
        loadClient: async () => {
          const { createOpenAI } = await import("@ai-sdk/openai");
          return createOpenAI({
            baseURL: ollamaConfig.baseUrl || "http://localhost:11434/v1",
            apiKey: ollamaConfig.apiKey || "ollama"
          });
        },
        defaultModel: ollamaConfig.defaultModel || "llama3.2",
        config: ollamaConfig
      });
    }
    if (this.config.providers?.azure?.enabled !== false) {
      const azureConfig = this.config.providers?.azure || {};
      if (azureConfig.endpoint && azureConfig.apiKey) {
        this.providers.set("azure", {
          client: null,
          loadClient: async () => {
            const { createOpenAI } = await import("@ai-sdk/openai");
            return createOpenAI({
              baseURL: `${azureConfig.endpoint}/openai/deployments/${azureConfig.deploymentName}`,
              apiKey: azureConfig.apiKey,
              defaultHeaders: { "api-key": azureConfig.apiKey }
            });
          },
          defaultModel: azureConfig.deploymentName,
          config: azureConfig
        });
      }
    }
    this.activeProvider = this.providers.get(this.config.defaultProvider) || this.providers.values().next().value;
  }
  /**
   * Select the best provider based on the request
   */
  selectProvider(request) {
    if (this.mockMode) {
      return this.providers.get("mock");
    }
    if (!this.config.enableRouting) {
      return this.activeProvider;
    }
    const { taskType, complexity, urgency, costConstraints } = request.metadata || {};
    if (taskType === "creative") {
      return this.providers.get("anthropic") || this.activeProvider;
    }
    if (taskType === "coding") {
      return this.providers.get("openai") || this.activeProvider;
    }
    if (taskType === "analysis") {
      return this.providers.get("google") || this.activeProvider;
    }
    if (complexity === "high") {
      return this.providers.get("anthropic") || this.providers.get("openai") || this.activeProvider;
    }
    if (urgency === "high") {
      return this.providers.get("google") || this.activeProvider;
    }
    if (costConstraints === "low") {
      return this.providers.get("ollama") || this.activeProvider;
    }
    return this.activeProvider;
  }
  setRateLimiter(rateLimiter) {
    this.rateLimiter = rateLimiter;
    return this;
  }
  setStreamPipeline(streamPipeline) {
    this.streamPipeline = streamPipeline;
    return this;
  }
  getProviderName(providerInstance) {
    for (const [name, provider] of this.providers.entries()) {
      if (provider === providerInstance) {
        return name;
      }
    }
    return null;
  }
  async executeProviderCall(providerName, provider, model, messages, options = {}) {
    const lease = this.rateLimiter ? await this.rateLimiter.acquire(providerName, {
      wait: options.rateLimitWait !== false,
      timeoutMs: options.rateLimitTimeoutMs
    }) : null;
    try {
      const client = await this.ensureProviderClient(provider);
      const providerModel = client(model || provider.defaultModel);
      const { rateLimitWait, rateLimitTimeoutMs, ...providerOptions } = options;
      return await providerModel.call({
        model: providerModel,
        messages,
        ...providerOptions
      });
    } finally {
      if (lease) {
        this.rateLimiter.release(lease);
      }
    }
  }
  /**
   * Main method to call AI providers with unified interface
   */
  async call(model, messages, options = {}) {
    if (this.config.enableBatching && !options.noBatch) {
      return new Promise((resolve, reject) => {
        this.addToBatchQueue({ model, messages, options, resolve, reject });
      });
    }
    return this.executeCall(model, messages, options);
  }

  private async executeCall(model, messages, options = {}) {
    const startTime = performance.now();
    this.metrics.totalRequests++;
    try {
      const cacheKey = this.generateCacheKey(model, messages, options);
      if (this.config.enableCaching) {
        const cachedResult = await this.getFromCache(cacheKey);
        if (cachedResult) {
          this.metrics.cacheHits++;
          this.metrics.successfulRequests++;
          this.updateMetrics(startTime, cachedResult.usage);
          this.recordUsageFromResult(options, cachedResult);
          return cachedResult;
        }
        this.metrics.cacheMisses++;
      }
      const provider = this.selectProvider({
        ...options,
        metadata: { ...options.metadata || {}, model, messages }
      });
      if (!provider) {
        throw new Error("No AI provider available");
      }
      const providerName = this.getProviderName(provider) || this.config.defaultProvider;
      const result = await this.executeProviderCall(providerName, provider, model, messages, options);
      if (this.config.enableCaching) {
        await this.putInCache(cacheKey, result);
      }
      this.metrics.successfulRequests++;
      this.updateMetrics(startTime, result.usage);
      if (this.config.enableMonitoring) {
        this.logCall(model, messages.length, result, performance.now() - startTime);
      }
      this.recordUsageFromResult(options, result);
      return result;
    } catch (error) {
      this.metrics.failedRequests++;
      this.updateMetrics(startTime);
      if (this.config.enableMonitoring) {
        logger.warn("AI call failed", {
          model,
          provider: this.selectProvider({
            ...options,
            metadata: { ...options.metadata || {}, model, messages }
          })?.defaultModel,
          error: error instanceof Error ? error.message : String(error)
        });
      }
      if (this.config.enableFallback) {
        return this.callWithFallback(model, messages, options, error);
      }
      throw error;
    }
  }

  private addToBatchQueue(request: BatchRequest) {
    this.batchQueue.push(request);
    
    if (this.batchQueue.length >= this.maxBatchSize) {
      this.processBatch();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.processBatch(), this.batchWindowMs);
    }
  }

  private async processBatch() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.batchQueue.length === 0) return;

    const currentBatch = [...this.batchQueue];
    this.batchQueue = [];

    logger.info(`Processing AI request batch of size ${currentBatch.length}`);

    // Process each request in the batch
    // In a real implementation, some providers support actual batch APIs
    // Here we parallelize them but could combine them if the provider supports it
    await Promise.all(currentBatch.map(async (req) => {
      try {
        const result = await this.executeCall(req.model, req.messages, { ...req.options, noBatch: true });
        req.resolve(result);
      } catch (error) {
        req.reject(error);
      }
    }));
  }

  /**
   * Call with fallback to other providers
   */
  async callWithFallback(model, messages, options, originalError) {
    const providerEntries = Array.from(this.providers.entries());
    const currentProvider = this.selectProvider({
      ...options,
      metadata: { ...options.metadata || {}, model, messages }
    });
    const currentProviderName = this.getProviderName(currentProvider);
    const currentIndex = providerEntries.findIndex(([name]) => name === currentProviderName);
    for (let i = currentIndex + 1; i < providerEntries.length; i++) {
      try {
        const [providerName, provider] = providerEntries[i];
        const result = await this.executeProviderCall(
          providerName,
          provider,
          model,
          messages,
          options
        );
        if (this.config.enableMonitoring) {
          logger.info(`Fallback succeeded with provider: ${providerName}`);
        }
        return result;
      } catch (fallbackError) {
        if (this.config.enableMonitoring) {
          logger.warn("Fallback provider failed", {
            error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
          });
        }
        continue;
      }
    }
    throw originalError;
  }
  /**
   * Stream response from AI provider
   */
  async stream(model, messages, options = {}) {
    const provider = this.selectProvider({
      ...options,
      metadata: { ...options.metadata || {}, model, messages }
    });
    if (!provider) {
      throw new Error("No AI provider available");
    }
    try {
      const client = await this.ensureProviderClient(provider);
      const providerModel = client(model || provider.defaultModel);
      const rawStream = await providerModel.stream({
        model: providerModel,
        messages,
        ...options
      });
      if (!this.streamPipeline || options.streamPipeline === false) {
        return rawStream;
      }
      return this.streamPipeline.pipe(rawStream, {
        provider: this.getProviderName(provider) || this.config.defaultProvider,
        model: model || provider.defaultModel,
        messageCount: messages.length
      });
    } catch (error) {
      if (this.config.enableMonitoring) {
        logger.warn("AI stream failed", {
          model,
          error: error instanceof Error ? error.message : String(error)
        });
      }
      throw error;
    }
  }
  /**
   * Generate structured output using Zod schema
   */
  async generateObject(model, messages, schema, options = {}) {
    const provider = this.selectProvider({
      ...options,
      metadata: { ...options.metadata || {}, model, messages }
    });
    if (!provider) {
      throw new Error("No AI provider available");
    }
    try {
      const client = await this.ensureProviderClient(provider);
      const providerModel = client(model || provider.defaultModel);
      return providerModel.generateObject({
        model: providerModel,
        messages,
        schema,
        ...options
      });
    } catch (error) {
      if (this.config.enableMonitoring) {
        logger.warn("AI object generation failed", {
          model,
          error: error instanceof Error ? error.message : String(error)
        });
      }
      throw error;
    }
  }
  /**
   * Generate text with tool calling capability
   */
  async generateTextWithTools(model, messages, tools, options = {}) {
    const provider = this.selectProvider({
      ...options,
      metadata: { ...options.metadata || {}, model, messages }
    });
    if (!provider) {
      throw new Error("No AI provider available");
    }
    try {
      const client = await this.ensureProviderClient(provider);
      const providerModel = client(model || provider.defaultModel);
      return providerModel.generateText({
        model: providerModel,
        messages,
        tools,
        ...options
      });
    } catch (error) {
      if (this.config.enableMonitoring) {
        logger.warn("AI tool-enabled generation failed", {
          model,
          error: error instanceof Error ? error.message : String(error)
        });
      }
      throw error;
    }
  }
  /**
   * Cache management
   */
  generateCacheKey(model, messages, options) {
    const key = JSON.stringify({ model, messages, options });
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `ai_cache:${hash.toString()}`;
  }
  async getFromCache(key) {
    if (this.redisCache) {
      const cached = await this.redisCache.get(key);
      if (cached) return JSON.parse(cached);
    }
    
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.value;
    }
    this.cache.delete(key);
    return null;
  }
  async putInCache(key, value) {
    if (this.redisCache) {
      await this.redisCache.set(key, JSON.stringify(value), Math.floor(this.cacheExpiry / 1000));
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  async ensureProviderClient(provider) {
    if (provider?.client) {
      return provider.client;
    }
    if (!provider?.loadClient) {
      throw new Error(`Provider '${provider?.defaultModel || "unknown"}' is not configured`);
    }
    provider.client = await provider.loadClient();
    return provider.client;
  }
  /**
   * Generate a mock object based on a schema (simplified)
   */
  generateMockObject(schema) {
    if (schema.paths) {
      return {
        paths: [
          { name: "Path A: Monolithic", description: "Fast implementation", steps: ["1", "2"] },
          { name: "Path B: Microservices", description: "Scalable but complex", steps: ["1", "2", "3"] },
          { name: "Path C: Serverless", description: "Lowest maintenance", steps: ["1"] }
        ]
      };
    }
    if (schema.steps) {
      return {
        steps: [
          { id: "1", task: "Mock Step 1", description: "Description for mock step 1" },
          { id: "2", task: "Mock Step 2", description: "Description for mock step 2" }
        ]
      };
    }
    return { status: "ok", data: "mock data" };
  }
  /**
   * Metrics and monitoring
   */
  updateMetrics(startTime, usage = null) {
    const responseTime = performance.now() - startTime;
    if (this.metrics.successfulRequests > 0) {
      this.metrics.avgResponseTime = (this.metrics.avgResponseTime * (this.metrics.successfulRequests - 1) + responseTime) / this.metrics.successfulRequests;
    }
    if (usage?.totalTokens) {
      this.metrics.totalTokens += usage.totalTokens;
    }
  }
  logCall(model, messageCount, result, responseTime) {
    logger.info("AI Call", {
      model,
      messageCount,
      responseTime: Math.round(responseTime),
      tokens: result.usage?.totalTokens,
      provider: this.selectProvider({ metadata: { model } })?.defaultModel,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  extractUsageTokens(result) {
    const usage = result?.usage;
    if (!usage) return 0;
    if (typeof usage.totalTokens === "number") return usage.totalTokens;
    if (typeof usage.total_tokens === "number") return usage.total_tokens;
    if (typeof usage.outputTokens === "number") return usage.outputTokens;
    return 0;
  }
  recordUsageFromResult(options, result) {
    const userId = options?.metadata?.userId;
    if (typeof userId !== "string" || userId.length === 0) {
      return;
    }
    const tokens = this.extractUsageTokens(result);
    try {
      usageMeter.increment(userId, { requests: 1, tokens });
    } catch (error) {
      logger.warn("Failed to increment usage meter", {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    billingService.recordUsage(userId, 1, tokens).catch((error) => {
      logger.warn("Failed to record billing usage from AI call", {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
    });
  }
  /**
   * Get current metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }
  /**
   * Get provider status
   */
  getProviderStatus() {
    const status = {};
    for (const [name, provider] of this.providers) {
      status[name] = {
        available: !!provider.apiKey || name === "ollama" || name === "mock",
        // Ollama/mock don't need API keys
        defaultModel: provider.defaultModel,
        config: provider.config
      };
    }
    return status;
  }
};
AIMetaLayer = __decorateClass([
  singleton()
], AIMetaLayer);
registerSingleton(AIMetaLayer, () => resolveFromContainer(AIMetaLayer));
registerAlias(DI_TOKENS.aiMetaLayer, AIMetaLayer);
const aiMetaLayer = resolveFromContainer(AIMetaLayer);
var ai_meta_layer_default = aiMetaLayer;
export {
  AIMetaLayer,
  aiMetaLayer,
  ai_meta_layer_default as default
};
