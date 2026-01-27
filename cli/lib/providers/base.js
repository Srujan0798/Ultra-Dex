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
  }

  /**
   * Get the default model for this provider
   * @returns {string} Default model identifier
   */
  getDefaultModel() {
    throw new Error('getDefaultModel() must be implemented by subclass');
  }

  /**
   * Get available models for this provider
   * @returns {Array<{id: string, name: string, maxTokens: number}>}
   */
  getAvailableModels() {
    throw new Error('getAvailableModels() must be implemented by subclass');
  }

  /**
   * Estimate the cost for a given number of tokens
   * @param {number} inputTokens - Number of input tokens
   * @param {number} outputTokens - Number of output tokens
   * @returns {{input: number, output: number, total: number}} Cost in USD
   */
  estimateCost(inputTokens, outputTokens) {
    throw new Error('estimateCost() must be implemented by subclass');
  }

  /**
   * Generate a completion from the AI model
   * @param {string} systemPrompt - System instructions
   * @param {string} userPrompt - User message/request
   * @param {Object} options - Additional options
   * @returns {Promise<{content: string, usage: {inputTokens: number, outputTokens: number}}>}
   */
  async generate(systemPrompt, userPrompt, options = {}) {
    throw new Error('generate() must be implemented by subclass');
  }

  /**
   * Generate a completion with streaming support
   * @param {string} systemPrompt - System instructions
   * @param {string} userPrompt - User message/request
   * @param {Function} onChunk - Callback for each chunk: (text: string) => void
   * @param {Object} options - Additional options
   * @returns {Promise<{content: string, usage: {inputTokens: number, outputTokens: number}}>}
   */
  async generateStream(systemPrompt, userPrompt, onChunk, options = {}) {
    throw new Error('generateStream() must be implemented by subclass');
  }

  /**
   * Validate that the API key is configured and working
   * @returns {Promise<boolean>}
   */
  async validateApiKey() {
    throw new Error('validateApiKey() must be implemented by subclass');
  }

  /**
   * Get the provider name
   * @returns {string}
   */
  getName() {
    throw new Error('getName() must be implemented by subclass');
  }
}

export default BaseProvider;
