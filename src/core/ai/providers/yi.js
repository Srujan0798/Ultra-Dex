/**
 * @fileoverview Yi AI Provider module (01.AI)
 * @module core/ai/providers/yi
 */

import OpenAI from 'openai';

/**
 * Yi AI Provider Class (01.AI)
 * Implements advanced reasoning and multilingual capabilities
 */
export class YiProvider {
  constructor(config = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.YI_API_KEY,
      baseURL: config.baseURL || 'https://api.lingyiwanwu.com/v1',
      model: config.model || 'yi-large',
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      ...config,
    };

    if (!this.config.apiKey) {
      throw new Error('Yi API key is required');
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
    });
  }

  /**
   * Generate text with Yi Large model
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
      throw new Error(`Yi generation failed: ${error.message}`);
    }
  }

  /**
   * Multilingual generation with Yi
   * @param {string} prompt - Input prompt
   * @param {string} language - Target language
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generation result
   */
  async generateMultilingual(prompt, language = 'en', options = {}) {
    try {
      const languageInstructions = {
        en: 'Respond in English',
        zh: '用中文回复',
        ja: '日本語で返答してください',
        ko: '한국어로 응답하세요',
        fr: 'Répondez en français',
        de: 'Antworten Sie auf Deutsch',
        es: 'Responda en español',
      };

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{
          role: 'system',
          content: `You are an expert AI assistant. ${languageInstructions[language] || languageInstructions.en}. Provide accurate and helpful responses.`
        }, {
          role: 'user',
          content: prompt
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
      throw new Error(`Yi multilingual generation failed: ${error.message}`);
    }
  }

  /**
   * Advanced reasoning with Yi
   * @param {string} prompt - Input prompt requiring reasoning
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Reasoning result
   */
  async advancedReasoning(prompt, options = {}) {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{
          role: 'system',
          content: `You are an advanced reasoning AI. Analyze the problem deeply, consider multiple perspectives, and provide a comprehensive solution with clear reasoning steps.`
        }, {
          role: 'user',
          content: `Please provide a detailed analysis and solution for: ${prompt}`
        }],
        temperature: options.temperature || 0.3,
        max_tokens: options.maxTokens || 4096,
        ...options,
      });

      return {
        content: response.choices[0]?.message?.content || '',
        model: response.model,
        usage: response.usage,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Yi advanced reasoning failed: ${error.message}`);
    }
  }

  /**
   * Code generation with Yi
   * @param {string} prompt - Code generation prompt
   * @param {string} language - Programming language
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Code generation result
   */
  async generateCode(prompt, language = 'javascript', options = {}) {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{
          role: 'system',
          content: `You are an expert programmer. Generate clean, efficient, and well-documented code in ${language}. Include comments and follow best practices.`
        }, {
          role: 'user',
          content: `Generate ${language} code for: ${prompt}`
        }],
        temperature: options.temperature || 0.5,
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
      throw new Error(`Yi code generation failed: ${error.message}`);
    }
  }

  /**
   * Get provider info
   * @returns {Object} Provider information
   */
  getInfo() {
    return {
      name: 'yi',
      type: 'language-model',
      capabilities: ['text-generation', 'multilingual', 'reasoning', 'code-generation'],
      model: this.config.model,
    };
  }
}

export default YiProvider;