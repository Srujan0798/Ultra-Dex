/**
 * @fileoverview OpenClaw Provider module
 * @module core/ai/providers/openclaw
 */

import OpenAI from 'openai';

/**
 * OpenClaw Provider Class
 * Implements advanced reasoning and multimodal capabilities
 */
export class OpenClawProvider {
  constructor(config = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.OPENCLAW_API_KEY,
      baseURL: config.baseURL || 'https://api.openclaw.ai/v1',
      model: config.model || 'openclaw-vision',
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      ...config,
    };

    if (!this.config.apiKey) {
      throw new Error('OpenClaw API key is required');
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
    });
  }

  /**
   * Generate text with OpenClaw
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
      throw new Error(`OpenClaw generation failed: ${error.message}`);
    }
  }

  /**
   * Multimodal generation with vision capabilities
   * @param {string} prompt - Text prompt
   * @param {Array} images - Array of image URLs or base64 strings
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generation result
   */
  async generateWithVision(prompt, images = [], options = {}) {
    try {
      const messages = [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...images.map(image => ({
            type: 'image_url',
            image_url: { url: image }
          }))
        ]
      }];

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
      throw new Error(`OpenClaw vision generation failed: ${error.message}`);
    }
  }

  /**
   * Advanced reasoning with structured output
   * @param {string} prompt - Input prompt
   * @param {Object} schema - Expected output schema
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Structured result
   */
  async structuredReasoning(prompt, schema, options = {}) {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{
          role: 'user',
          content: `Analyze the following problem and provide a structured response according to the given schema:\n\nProblem: ${prompt}\n\nSchema: ${JSON.stringify(schema)}`
        }],
        temperature: options.temperature || 0.3,
        max_tokens: options.maxTokens || 4096,
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
      throw new Error(`OpenClaw structured reasoning failed: ${error.message}`);
    }
  }

  /**
   * Get provider info
   * @returns {Object} Provider information
   */
  getInfo() {
    return {
      name: 'openclaw',
      type: 'multimodal',
      capabilities: ['text-generation', 'vision', 'structured-output', 'reasoning'],
      model: this.config.model,
    };
  }
}

export default OpenClawProvider;