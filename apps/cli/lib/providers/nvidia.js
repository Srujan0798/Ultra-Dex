// Copyright (c) 2026 Ultra-Dex

/**
 * NVIDIA Nemotron Provider
 * Integration with NVIDIA's 220+ models via a single API key
 */

import {
  initNVIDIAKeys,
  createRotatingClient,
  NEMOTRON_MODELS
} from '../../../../src/services/ai-providers/nemotron.js';

export class NVIDIAProvider {
  /**
   * @param {string} apiKey - Optional API key
   * @param {Object} options - Provider options
   */
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.model = options.model || NEMOTRON_MODELS.primary.id;
    this.options = options;
    
    // Initialize key manager (handles multiple keys from environment)
    initNVIDIAKeys();
  }

  /**
   * Get provider name
   * @returns {string}
   */
  getName() {
    return 'nvidia';
  }

  /**
   * Get current model
   * @returns {string}
   */
  getModel() {
    return this.model;
  }

  /**
   * Generate completion
   * @param {string} systemPrompt 
   * @param {string} userPrompt 
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async generate(systemPrompt, userPrompt, options = {}) {
    const { client } = createRotatingClient(this.model);
    const model = options.model || this.model;

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: userPrompt });

    try {
      const res = await client.chat.completions.create({
        model,
        messages,
        temperature: options.temperature || this.options.temperature || 1.0,
        top_p: options.topP || this.options.topP || 0.95,
        max_tokens: options.maxTokens || this.options.maxTokens || 4096,
        extra_body: {
          chat_template_kwargs: {
            enable_thinking: options.enableThinking ?? true,
          },
        },
      });

      return {
        content: res.choices[0].message.content,
        usage: {
          inputTokens: res.usage?.prompt_tokens || 0,
          outputTokens: res.usage?.completion_tokens || 0,
          totalTokens: res.usage?.total_tokens || 0,
        },
        model: res.model || model,
        finishReason: res.choices[0].finish_reason,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate streaming completion
   * @param {string} systemPrompt 
   * @param {string} userPrompt 
   * @param {Function} onToken 
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async generateStream(systemPrompt, userPrompt, onToken, options = {}) {
    const { client } = createRotatingClient(this.model);
    const model = options.model || this.model;

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: userPrompt });

    try {
      const stream = await client.chat.completions.create({
        model,
        messages,
        temperature: options.temperature || this.options.temperature || 1.0,
        top_p: options.topP || this.options.topP || 0.95,
        max_tokens: options.maxTokens || this.options.maxTokens || 4096,
        stream: true,
        extra_body: {
          chat_template_kwargs: {
            enable_thinking: options.enableThinking ?? true,
          },
        },
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          fullResponse += delta;
          if (onToken) onToken(delta);
        }
      }

      return {
        content: fullResponse,
        model: model,
      };
    } catch (error) {
      throw error;
    }
  }
}
