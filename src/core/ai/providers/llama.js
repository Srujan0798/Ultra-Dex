/**
 * @fileoverview Llama Provider module (Meta via Ollama)
 * @module core/ai/providers/llama
 */

import OpenAI from 'openai';

/**
 * Llama Provider Class (Meta via Ollama)
 * Implements local and remote Llama model access
 */
export class LlamaProvider {
  constructor(config = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.OLLAMA_API_KEY || 'ollama',
      baseURL: config.baseURL || process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
      model: config.model || 'llama3.2',
      timeout: config.timeout || 60000,
      maxRetries: config.maxRetries || 3,
      ...config,
    };

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
    });
  }

  /**
   * Generate text with Llama model
   * @param {string} prompt - Input prompt
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generation result
   */
  async generate(prompt, options = {}) {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048,
        top_p: options.topP || 1,
        frequency_penalty: options.frequencyPenalty || 0,
        presence_penalty: options.presencePenalty || 0,
        ...options,
      });

      return {
        content: response.choices[0]?.message?.content || '',
        model: response.model,
        usage: response.usage,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Llama generation failed: ${error.message}`);
    }
  }

  /**
   * Generate with system context
   * @param {string} prompt - Input prompt
   * @param {string} systemPrompt - System context
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generation result
   */
  async generateWithContext(prompt, systemPrompt = '', options = {}) {
    try {
      const messages = [];
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      messages.push({ role: 'user', content: prompt });

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048,
        ...options,
      });

      return {
        content: response.choices[0]?.message?.content || '',
        model: response.model,
        usage: response.usage,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Llama generation with context failed: ${error.message}`);
    }
  }

  /**
   * Chat completion with conversation history
   * @param {Array} messages - Conversation history
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generation result
   */
  async chat(messages = [], options = {}) {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages.map(msg => ({
          role: msg.role || 'user',
          content: msg.content
        })),
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048,
        ...options,
      });

      return {
        content: response.choices[0]?.message?.content || '',
        model: response.model,
        usage: response.usage,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Llama chat completion failed: ${error.message}`);
    }
  }

  /**
   * Generate structured output with Llama
   * @param {string} prompt - Input prompt
   * @param {Object} schema - Expected output schema
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Structured result
   */
  async generateStructured(prompt, schema, options = {}) {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{
          role: 'system',
          content: `You are a helpful assistant that responds with valid JSON according to the provided schema. Only return the JSON object, nothing else.`
        }, {
          role: 'user',
          content: `Generate JSON for: ${prompt}\n\nSchema: ${JSON.stringify(schema)}`
        }],
        temperature: options.temperature || 0.3,
        max_tokens: options.maxTokens || 2048,
        response_format: { type: 'json_object' },
        ...options,
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
      
      return {
        structured_output: parsed,
        model: response.model,
        usage: response.usage,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Llama structured generation failed: ${error.message}`);
    }
  }

  /**
   * Get available models from Ollama
   * @returns {Promise<Array>} List of available models
   */
  async listModels() {
    try {
      const response = await this.client.models.list();
      return response.data;
    } catch (error) {
      throw new Error(`Failed to list Ollama models: ${error.message}`);
    }
  }

  /**
   * Get provider info
   * @returns {Object} Provider information
   */
  getInfo() {
    return {
      name: 'llama',
      type: 'local-model',
      capabilities: ['text-generation', 'chat', 'structured-output', 'local-processing'],
      model: this.config.model,
      baseUrl: this.config.baseURL,
    };
  }
}

export default LlamaProvider;