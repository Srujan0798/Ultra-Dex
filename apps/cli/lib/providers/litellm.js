// Copyright (c) 2026 Ultra-Dex

/**
 * LiteLLM Provider
 * Supports 100+ providers through LiteLLM proxy (OpenAI-compatible)
 */

import { BaseProvider } from './base.js';

export class LiteLLMProvider extends BaseProvider {
  /**
   * @param {string} apiKey - Optional API key for LiteLLM proxy
   * @param {Object} options - Provider options
   * @param {string} [options.baseUrl] - Base URL for LiteLLM proxy (default: http://localhost:4000)
   */
  constructor(apiKey, options = {}) {
    super(apiKey, options);
    this.baseUrl = options.baseUrl || process.env.LITELLM_BASE_URL || 'http://localhost:4000';
    
    // Support model format: litellm/model-name
    if (this.model && this.model.startsWith('litellm/')) {
      this.model = this.model.replace('litellm/', '');
    }
  }

  getName() {
    return 'litellm';
  }

  getDefaultModel() {
    return 'gpt-4o';
  }

  /**
   * Discover available models from LiteLLM proxy
   * @returns {Promise<Array<{id: string, name: string, maxTokens: number}>>}
   */
  async listModels() {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
      });
      
      if (!response.ok) {
        throw new Error(`LiteLLM Error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data || [];
    } catch {
      // In case of error, return empty or a default list
      return [];
    }
  }

  async getAvailableModels() {
    const models = await this.listModels();
    if (models.length === 0) {
      return [{ id: 'gpt-4o', name: 'GPT-4o', maxTokens: 8192 }];
    }
    return models.map(m => ({
      id: m.id,
      name: m.id,
      maxTokens: 8192
    }));
  }

  estimateCost(_inputTokens, _outputTokens) {
    // LiteLLM doesn't expose fixed pricing through the /models endpoint usually
    // Returning 0 as it's handled by the proxy's own spend tracking
    return { input: 0, output: 0, total: 0 };
  }

  /**
   * Generate a completion from LiteLLM proxy
   */
  async generate(systemPrompt, userPrompt, options = {}) {
    const requestBody = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: options.temperature !== undefined ? options.temperature : this.temperature,
      max_tokens: options.maxTokens || this.maxTokens,
      // Pass through any other OpenAI-compatible parameters
      ...options.extraParams
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || response.statusText);
      }

      const data = await response.json();
      return {
        content: data.choices[0]?.message?.content || '',
        usage: {
          inputTokens: data.usage?.prompt_tokens || 0,
          outputTokens: data.usage?.completion_tokens || 0,
        },
        model: data.model || this.model
      };
    } catch (error) {
      throw this.formatError(error, 'generate');
    }
  }

  async validateApiKey() {
    // If no key is provided, we assume it's a local proxy that doesn't need one
    if (!this.apiKey) return true;
    
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default LiteLLMProvider;
