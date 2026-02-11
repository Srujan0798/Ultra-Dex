// Copyright (c) 2026 Ultra-Dex

/**
 * Base AI Provider Interface
 * All providers (Claude, OpenAI, Gemini) must implement this interface
 */

export class BaseProvider {
  constructor(apiKey, options = {}) {
    if (new.target === BaseProvider) {
      throw new Error('BaseProvider is abstract and cannot be instantiated directly');
    }
    this.apiKey = apiKey;
    this.model = options.model || this.getDefaultModel();
    this.maxTokens = options.maxTokens || 8192;
    this.temperature = options.temperature !== undefined ? options.temperature : 0.7;
    this.timeout = options.timeout || 30000; // 30 seconds default
  }

  /**
   * Get the default model for this provider
   * @returns {string} Default model identifier
   */
  getDefaultModel() {
    throw new Error('BaseProvider.getDefaultModel() must be implemented by subclass');
  }

  /**
   * Get available models for this provider
   * @returns {Array<{id: string, name: string, maxTokens: number}>}
   */
  getAvailableModels() {
    throw new Error('BaseProvider.getAvailableModels() must be implemented by subclass');
  }

  /**
   * Estimate the cost for a given number of tokens
   * @param {number} inputTokens - Number of input tokens
   * @param {number} outputTokens - Number of output tokens
   * @returns {{input: number, output: number, total: number}} Cost in USD
   */
  estimateCost(_inputTokens, _outputTokens) {
    throw new Error('BaseProvider.estimateCost() must be implemented by subclass');
  }

  /**
   * Generate a completion from the AI model
   * @param {string} systemPrompt - System instructions
   * @param {string} userPrompt - User message/request
   * @param {Object} options - Additional options
   * @returns {Promise<{content: string, usage: {inputTokens: number, outputTokens: number}, model: string}>}
   */
  async generate(systemPrompt, userPrompt, _options = {}) {
    throw new Error('BaseProvider.generate() must be implemented by subclass');
  }

  /**
   * Generate a completion with streaming support
   * @param {string} systemPrompt - System instructions
   * @param {string} userPrompt - User message/request
   * @param {Function} onChunk - Callback for each chunk: (text: string) => void
   * @param {Object} options - Additional options
   * @returns {Promise<{content: string, usage: {inputTokens: number, outputTokens: number}, model: string}>}
   */
  async generateStream(systemPrompt, userPrompt, onChunk, _options = {}) {
    throw new Error('BaseProvider.generateStream() must be implemented by subclass');
  }

  /**
   * Validate that the API key is configured and working
   * @returns {Promise<boolean>}
   */
  async validateApiKey() {
    throw new Error('BaseProvider.validateApiKey() must be implemented by subclass');
  }

  /**
   * Get the provider name
   * @returns {string}
   */
  getName() {
    throw new Error('BaseProvider.getName() must be implemented by subclass');
  }

  /**
   * Format error messages consistently
   * @param {Error|string} error - The error to format
   * @param {string} context - Context of where the error occurred
   * @returns {Error} Formatted error
   */
  formatError(error, context) {
    const errorMessage = typeof error === 'string' ? error : error.message || 'Unknown error';
    const formattedError = new Error(`[${this.getName()}] ${context}: ${errorMessage}`);

    // Preserve original error for debugging
    if (typeof error !== 'string' && error) {
      formattedError.originalError = error;
      formattedError.stack = error.stack;
    }

    return formattedError;
  }

  /**
   * Validate required parameters before making API calls
   * @param {Object} params - Parameters to validate
   * @param {string[]} required - Required parameter names
   * @throws {Error} If any required parameter is missing
   */
  validateParams(params, required) {
    for (const param of required) {
      if (params[param] === undefined || params[param] === null || params[param] === '') {
        throw new Error(`Missing required parameter: ${param}`);
      }
    }
  }
}

export default BaseProvider;

/**
 * Safe execution wrapper with error handling for base
 * @param {Function} fn - Async function to execute
 * @param {string} [context='base'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'base') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
