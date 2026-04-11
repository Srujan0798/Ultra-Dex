/**
 * Base AI Provider Interface
 * All AI providers must extend this class
 */

import { EventEmitter } from 'events';

export class BaseAIProvider extends EventEmitter {
  constructor(config = {}) {
    super();
    this.name = config.name || 'unknown';
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.defaultModel = config.defaultModel;
    this.models = config.models || [];
    this.pricing = config.pricing || {};
    this.circuitBreaker = {
      failures: 0,
      lastFailure: null,
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      threshold: config.failureThreshold || 5,
      timeout: config.resetTimeout || 60000,
    };
  }

  /**
   * Generate completion from the provider
   * @param {Array} messages - Array of {role, content} objects
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - {content, usage, model}
   */
  async generate(messages, options = {}) {
    throw new Error('generate() must be implemented by subclass');
  }

  /**
   * Stream completion from the provider
   * @param {Array} messages - Array of {role, content} objects
   * @param {Object} options - Stream options
   * @returns {AsyncIterable} - Stream of tokens
   */
  async *stream(messages, options = {}) {
    throw new Error('stream() must be implemented by subclass');
  }

  /**
   * Get available models from provider
   * @returns {Promise<Array>} - Array of model objects
   */
  async getModels() {
    return this.models;
  }

  /**
   * Calculate cost for token usage
   * @param {Object} usage - {prompt_tokens, completion_tokens}
   * @param {String} model - Model name
   * @returns {Number} - Cost in USD
   */
  calculateCost(usage, model) {
    const modelPricing = this.pricing[model] || this.pricing.default;
    if (!modelPricing) return 0;

    const promptCost = (usage.prompt_tokens / 1000) * modelPricing.input;
    const completionCost = (usage.completion_tokens / 1000) * modelPricing.output;
    return promptCost + completionCost;
  }

  /**
   * Check if provider is healthy
   * @returns {Boolean}
   */
  isHealthy() {
    if (this.circuitBreaker.state === 'OPEN') {
      if (Date.now() - this.circuitBreaker.lastFailure > this.circuitBreaker.timeout) {
        this.circuitBreaker.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }
    return true;
  }

  /**
   * Record success for circuit breaker
   */
  recordSuccess() {
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.state = 'CLOSED';
  }

  /**
   * Record failure for circuit breaker
   */
  recordFailure() {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = Date.now();

    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.state = 'OPEN';
      this.emit('circuitOpen', { provider: this.name });
    }
  }

  /**
   * Validate provider configuration
   * @returns {Boolean}
   */
  validate() {
    return !!this.apiKey && !!this.defaultModel;
  }

  /**
   * Get provider capabilities
   * @returns {Object}
   */
  getCapabilities() {
    return {
      streaming: false,
      functionCalling: false,
      vision: false,
      maxTokens: 4096,
      ...this.capabilities,
    };
  }
}

/**
 * Provider factory for creating provider instances
 */
export class ProviderFactory {
  static providers = new Map();

  static register(name, ProviderClass) {
    ProviderFactory.providers.set(name, ProviderClass);
  }

  static create(name, config) {
    const ProviderClass = ProviderFactory.providers.get(name);
    if (!ProviderClass) {
      throw new Error(`Unknown provider: ${name}`);
    }
    return new ProviderClass(config);
  }

  static getAvailable() {
    return Array.from(ProviderFactory.providers.keys());
  }
}
