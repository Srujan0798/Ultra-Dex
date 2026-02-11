// Copyright (c) 2026 Ultra-Dex
// src/core/ai/ai-meta-layer.js

import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';
import { z } from 'zod';
import { logger } from '../../src/utils/logging.js';
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
    
    this.initializeProviders();
  }

  /**
   * Initialize all configured AI providers
   */
  initializeProviders() {
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
        defaultModel: anthropicConfig.defaultModel || 'claude-3-5-sonnet-20241022',
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
      const provider = this.selectProvider({ ...options, metadata: { model, messages } });
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
    const providers = Array.from(this.providers.values());
    const currentIndex = providers.indexOf(this.selectProvider({ metadata: { model, messages } }));

    for (let i = currentIndex + 1; i < providers.length; i++) {
      try {
        const provider = providers[i];
        const result = await provider.client(model || provider.defaultModel).call({
          model: provider.client(model || provider.defaultModel),
          messages,
          ...options
        });

        if (this.config.enableMonitoring) {
          logger.info(`Fallback succeeded with provider: ${provider.constructor.name}`);
        }

        return result;
      } catch (fallbackError) {
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
    const provider = this.selectProvider({ ...options, metadata: { model, messages } });
    if (!provider) {
      throw new Error('No AI provider available');
    }

    return provider.client(model || provider.defaultModel).stream({
      model: provider.client(model || provider.defaultModel),
      messages,
      ...options
    });
  }

  /**
   * Generate structured output using Zod schema
   */
  async generateObject(model, messages, schema, options = {}) {
    const provider = this.selectProvider({ ...options, metadata: { model, messages } });
    if (!provider) {
      throw new Error('No AI provider available');
    }

    return provider.client(model || provider.defaultModel).generateObject({
      model: provider.client(model || provider.defaultModel),
      messages,
      schema,
      ...options
    });
  }

  /**
   * Generate text with tool calling capability
   */
  async generateTextWithTools(model, messages, tools, options = {}) {
    const provider = this.selectProvider({ ...options, metadata: { model, messages } });
    if (!provider) {
      throw new Error('No AI provider available');
    }

    return provider.client(model || provider.defaultModel).generateText({
      model: provider.client(model || provider.defaultModel),
      messages,
      tools,
      ...options
    });
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
   * Metrics and monitoring
   */
  updateMetrics(startTime, usage = null) {
    const responseTime = performance.now() - startTime;
    this.metrics.avgResponseTime = 
      ((this.metrics.avgResponseTime * (this.metrics.successfulRequests - 1)) + responseTime) / 
      this.metrics.successfulRequests;

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
        available: !!provider.apiKey || name === 'ollama', // Ollama doesn't need API key
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