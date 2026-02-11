// Copyright (c) 2026 Ultra-Dex
// src/core/ai/ai-meta-layer.js

import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { logger } from '../../utils/logging.js';
import { performance } from 'perf_hooks';

/**
 * AI Provider Abstraction Layer
 * Provides a unified interface for all AI providers
 */
export class AIMetaLayer {
  constructor(config = {}) {
    this.providers = new Map();
    this.activeProvider = null;
    this.config = {
      defaultProvider: config.defaultProvider || 'openai',
      enableRouting: config.enableRouting !== false,
      enableFallback: config.enableFallback !== false,
      enableCaching: config.enableCaching !== false,
      enableMonitoring: config.enableMonitoring !== false,
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
    
    this.cache = new Map();
    this.cacheExpiry = config.cacheExpiry || 300000; // 5 minutes
    this.mockMode = config.mockMode || process.env.MOCK_AI === 'true';
    
    this.initializeProviders();
  }

  /**
   * Initialize all configured AI providers
   */
  initializeProviders() {
    // Mock Provider
    this.providers.set('mock', {
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
          
          // Simulate tool call if certain keywords are present
          if ((lastMessage.includes('Objective') || lastMessage.includes('Relevant')) && !opts.messages.some(m => m.role === 'tool')) {
            return {
              text: 'I should check the codebase first.',
              toolCalls: [
                {
                  toolCallId: 'call_' + Math.random().toString(36).substr(2, 9),
                  toolName: 'query_codebase',
                  args: { query: 'server', type: 'files' }
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
            yield { text: 'Mock ' };
            yield { text: 'stream ' };
            yield { text: 'response' };
          }
        })
      }),
      defaultModel: 'mock-model',
      config: {}
    });
    // OpenAI Provider
    if (this.config.providers?.openai?.enabled !== false) {
      const openaiConfig = this.config.providers?.openai || {};
      this.providers.set('openai', {
        client: openai,
        defaultModel: openaiConfig.defaultModel || 'gpt-4o-2024-11-20',
        apiKey: openaiConfig.apiKey || process.env.OPENAI_API_KEY,
        config: openaiConfig
      });
    }

    // Anthropic Provider
    if (this.config.providers?.anthropic?.enabled !== false) {
      const anthropicConfig = this.config.providers?.anthropic || {};
      this.providers.set('anthropic', {
        client: anthropic,
        defaultModel: anthropicConfig.defaultModel || 'claude-3-5-sonnet-latest',
        apiKey: anthropicConfig.apiKey || process.env.ANTHROPIC_API_KEY,
        config: anthropicConfig
      });
    }

    // Google Provider
    if (this.config.providers?.google?.enabled !== false) {
      const googleConfig = this.config.providers?.google || {};
      this.providers.set('google', {
        client: google,
        defaultModel: googleConfig.defaultModel || 'gemini-2.0-flash-exp',
        apiKey: googleConfig.apiKey || process.env.GOOGLE_API_KEY,
        config: googleConfig
      });
    }

    // Ollama Provider (for local models)
    if (this.config.providers?.ollama?.enabled !== false) {
      const ollamaConfig = this.config.providers?.ollama || {};
      const ollama = createOpenAI({
        baseURL: ollamaConfig.baseUrl || 'http://localhost:11434/v1',
        apiKey: ollamaConfig.apiKey || 'ollama',
      });
      
      this.providers.set('ollama', {
        client: ollama,
        defaultModel: ollamaConfig.defaultModel || 'llama3.2',
        config: ollamaConfig
      });
    }

    // Azure OpenAI Provider
    if (this.config.providers?.azure?.enabled !== false) {
      const azureConfig = this.config.providers?.azure || {};
      if (azureConfig.endpoint && azureConfig.apiKey) {
        const azure = createOpenAI({
          baseURL: `${azureConfig.endpoint}/openai/deployments/${azureConfig.deploymentName}`,
          apiKey: azureConfig.apiKey,
          defaultHeaders: { 'api-key': azureConfig.apiKey }
        });
        
        this.providers.set('azure', {
          client: azure,
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
      return this.providers.get('mock');
    }

    if (!this.config.enableRouting) {
      return this.activeProvider;
    }

    // Implement intelligent routing logic
    const { taskType, complexity, urgency, costConstraints } = request.metadata || {};
    
    // Route based on task type
    if (taskType === 'creative') {
      return this.providers.get('anthropic') || this.activeProvider;
    }
    
    if (taskType === 'coding') {
      return this.providers.get('openai') || this.activeProvider;
    }
    
    if (taskType === 'analysis') {
      return this.providers.get('google') || this.activeProvider;
    }
    
    // Route based on complexity
    if (complexity === 'high') {
      return this.providers.get('anthropic') || this.providers.get('openai') || this.activeProvider;
    }
    
    // Route based on urgency
    if (urgency === 'high') {
      return this.providers.get('google') || this.activeProvider; // Generally faster
    }
    
    // Route based on cost constraints
    if (costConstraints === 'low') {
      return this.providers.get('ollama') || this.activeProvider; // Local models are cheaper
    }
    
    return this.activeProvider;
  }

  /**
   * Main method to call AI providers with unified interface
   */
  async call(model, messages, options = {}) {
    const startTime = performance.now();
    this.metrics.totalRequests++;

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(model, messages, options);
      if (this.config.enableCaching) {
        const cachedResult = this.getFromCache(cacheKey);
        if (cachedResult) {
          this.metrics.cacheHits++;
          this.metrics.successfulRequests++;
          this.updateMetrics(startTime, cachedResult.usage);
          return cachedResult;
        }
        this.metrics.cacheMisses++;
      }

      // Select provider
      const provider = this.selectProvider({
        ...options,
        metadata: { ...(options.metadata || {}), model, messages },
      });
      if (!provider) {
        throw new Error('No AI provider available');
      }

      // Prepare the call
      const callOptions = {
        model: provider.client(model || provider.defaultModel),
        messages,
        ...options
      };

      // Make the call
      const result = await provider.client(model || provider.defaultModel).call(callOptions);

      // Cache the result
      if (this.config.enableCaching) {
        this.putInCache(cacheKey, result);
      }

      this.metrics.successfulRequests++;
      this.updateMetrics(startTime, result.usage);

      if (this.config.enableMonitoring) {
        this.logCall(model, messages.length, result, performance.now() - startTime);
      }

      return result;
    } catch (error) {
      this.metrics.failedRequests++;
      this.updateMetrics(startTime);
      if (this.config.enableMonitoring) {
        logger.warn('AI call failed', {
          model,
          provider: this.selectProvider({
            ...options,
            metadata: { ...(options.metadata || {}), model, messages },
          })?.defaultModel,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      if (this.config.enableFallback) {
        return this.callWithFallback(model, messages, options, error);
      }

      throw error;
    }
  }

  /**
   * Call with fallback to other providers
   */
  async callWithFallback(model, messages, options, originalError) {
    const providerEntries = Array.from(this.providers.entries());
    const currentProvider = this.selectProvider({
      ...options,
      metadata: { ...(options.metadata || {}), model, messages },
    });
    const currentIndex = providerEntries.findIndex(([, provider]) => provider === currentProvider);

    for (let i = currentIndex + 1; i < providerEntries.length; i++) {
      try {
        const [providerName, provider] = providerEntries[i];
        const result = await provider.client(model || provider.defaultModel).call({
          model: provider.client(model || provider.defaultModel),
          messages,
          ...options
        });

        if (this.config.enableMonitoring) {
          logger.info(`Fallback succeeded with provider: ${providerName}`);
        }

        return result;
      } catch (fallbackError) {
        if (this.config.enableMonitoring) {
          logger.warn('Fallback provider failed', {
            error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          });
        }
        continue; // Try next provider
      }
    }

    // If all fallbacks failed, throw original error
    throw originalError;
  }

  /**
   * Stream response from AI provider
   */
  async stream(model, messages, options = {}) {
    const provider = this.selectProvider({
      ...options,
      metadata: { ...(options.metadata || {}), model, messages },
    });
    if (!provider) {
      throw new Error('No AI provider available');
    }

    try {
      return provider.client(model || provider.defaultModel).stream({
        model: provider.client(model || provider.defaultModel),
        messages,
        ...options
      });
    } catch (error) {
      if (this.config.enableMonitoring) {
        logger.warn('AI stream failed', {
          model,
          error: error instanceof Error ? error.message : String(error),
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
      metadata: { ...(options.metadata || {}), model, messages },
    });
    if (!provider) {
      throw new Error('No AI provider available');
    }

    try {
      return provider.client(model || provider.defaultModel).generateObject({
        model: provider.client(model || provider.defaultModel),
        messages,
        schema,
        ...options
      });
    } catch (error) {
      if (this.config.enableMonitoring) {
        logger.warn('AI object generation failed', {
          model,
          error: error instanceof Error ? error.message : String(error),
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
      metadata: { ...(options.metadata || {}), model, messages },
    });
    if (!provider) {
      throw new Error('No AI provider available');
    }

    try {
      return provider.client(model || provider.defaultModel).generateText({
        model: provider.client(model || provider.defaultModel),
        messages,
        tools,
        ...options
      });
    } catch (error) {
      if (this.config.enableMonitoring) {
        logger.warn('AI tool-enabled generation failed', {
          model,
          error: error instanceof Error ? error.message : String(error),
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
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.value;
    }
    // Remove expired cache
    this.cache.delete(key);
    return null;
  }

  putInCache(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * Generate a mock object based on a schema (simplified)
   */
  generateMockObject(schema) {
    // Simple mock object generation based on common patterns
    if (schema.paths) {
      return {
        paths: [
          { name: 'Path A: Monolithic', description: 'Fast implementation', steps: ['1', '2'] },
          { name: 'Path B: Microservices', description: 'Scalable but complex', steps: ['1', '2', '3'] },
          { name: 'Path C: Serverless', description: 'Lowest maintenance', steps: ['1'] }
        ]
      };
    }
    if (schema.steps) {
      return {
        steps: [
          { id: '1', task: 'Mock Step 1', description: 'Description for mock step 1' },
          { id: '2', task: 'Mock Step 2', description: 'Description for mock step 2' }
        ]
      };
    }
    return { status: 'ok', data: 'mock data' };
  }

  /**
   * Metrics and monitoring
   */
  updateMetrics(startTime, usage = null) {
    const responseTime = performance.now() - startTime;
    if (this.metrics.successfulRequests > 0) {
      this.metrics.avgResponseTime =
        (this.metrics.avgResponseTime * (this.metrics.successfulRequests - 1) + responseTime) /
        this.metrics.successfulRequests;
    }

    if (usage?.totalTokens) {
      this.metrics.totalTokens += usage.totalTokens;
    }
  }

  logCall(model, messageCount, result, responseTime) {
    logger.info('AI Call', {
      model,
      messageCount,
      responseTime: Math.round(responseTime),
      tokens: result.usage?.totalTokens,
      provider: this.selectProvider({ metadata: { model } }),
      timestamp: new Date().toISOString()
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
        available: !!provider.apiKey || name === 'ollama' || name === 'mock', // Ollama/mock don't need API keys
        defaultModel: provider.defaultModel,
        config: provider.config
      };
    }
    return status;
  }
}

// Export singleton instance
export const aiMetaLayer = new AIMetaLayer();

// Export for direct import
export default aiMetaLayer;
