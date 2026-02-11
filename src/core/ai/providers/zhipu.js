/**
 * @fileoverview Zhipu AI Provider module (GLM-4)
 * @module core/ai/providers/zhipu
 */

import OpenAI from 'openai';

/**
 * Zhipu AI Provider Class (GLM-4 Model)
 * Implements Chinese language and multimodal capabilities
 */
export class ZhipuProvider {
  constructor(config = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.ZHIPU_API_KEY,
      baseURL: config.baseURL || 'https://open.bigmodel.cn/api/paas/v4',
      model: config.model || 'glm-4',
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      ...config,
    };

    if (!this.config.apiKey) {
      throw new Error('Zhipu API key is required');
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
    });
  }

  /**
   * Generate text with Zhipu GLM-4
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
      throw new Error(`Zhipu GLM-4 generation failed: ${error.message}`);
    }
  }

  /**
   * Generate Chinese text with cultural awareness
   * @param {string} prompt - Input prompt in Chinese or English
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generation result
   */
  async generateChinese(prompt, options = {}) {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{
          role: 'system',
          content: '你是一个专业的中文AI助手，擅长理解和生成高质量的中文内容。请根据用户的需求提供准确、流畅的中文回复。'
        }, {
          role: 'user',
          content: `请用中文回答以下问题：${prompt}`
        }],
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
      throw new Error(`Zhipu Chinese generation failed: ${error.message}`);
    }
  }

  /**
   * Tool calling with GLM-4
   * @param {string} prompt - Input prompt
   * @param {Array} tools - Array of available tools
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Tool calling result
   */
  async toolCall(prompt, tools = [], options = {}) {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: 'auto',
        temperature: options.temperature || 0.3,
        max_tokens: options.maxTokens || 2048,
        ...options,
      });

      const choice = response.choices[0];
      
      return {
        content: choice?.message?.content || '',
        tool_calls: choice?.message?.tool_calls || [],
        model: response.model,
        usage: response.usage,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Zhipu tool calling failed: ${error.message}`);
    }
  }

  /**
   * Generate with function calling
   * @param {string} prompt - Input prompt
   * @param {Array} functions - Array of available functions
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Function calling result
   */
  async functionCall(prompt, functions = [], options = {}) {
    try {
      const tools = functions.map(func => ({
        type: 'function',
        function: func
      }));

      return await this.toolCall(prompt, tools, options);
    } catch (error) {
      throw new Error(`Zhipu function calling failed: ${error.message}`);
    }
  }

  /**
   * Get provider info
   * @returns {Object} Provider information
   */
  getInfo() {
    return {
      name: 'zhipu',
      type: 'language-model',
      capabilities: ['text-generation', 'chinese-support', 'tool-calling', 'function-calling'],
      model: this.config.model,
    };
  }
}

export default ZhipuProvider;