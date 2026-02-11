/**
 * @fileoverview DeepSeek R1 Provider module
 * @module core/ai/providers/deepseek-r1
 */

import OpenAI from 'openai';

/**
 * DeepSeek R1 Provider Class
 * Implements Chain of Thought (CoT) reasoning capabilities
 */
export class DeepSeekR1Provider {
  constructor(config = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.DEEPSEEK_API_KEY,
      baseURL: config.baseURL || 'https://api.deepseek.com',
      model: config.model || 'deepseek-r1',
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      ...config,
    };

    if (!this.config.apiKey) {
      throw new Error('DeepSeek API key is required');
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
    });
  }

  /**
   * Chain of Thought reasoning implementation
   * @param {string} prompt - Input prompt
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Reasoning result
   */
  async chainOfThought(prompt, options = {}) {
    const cotPrompt = this._buildChainOfThoughtPrompt(prompt);
    
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert reasoning engine. Use Chain of Thought methodology to solve problems step by step. 
            Think through each step logically and provide your reasoning process before giving the final answer. 
            Format your response as: 
            1. Problem Analysis
            2. Step-by-step reasoning
            3. Final conclusion`
          },
          {
            role: 'user',
            content: cotPrompt
          }
        ],
        temperature: options.temperature || 0.3,
        max_tokens: options.maxTokens || 4096,
        stream: false,
      });

      return {
        reasoning: response.choices[0]?.message?.content || '',
        model: response.model,
        usage: response.usage,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`DeepSeek R1 CoT failed: ${error.message}`);
    }
  }

  /**
   * Build Chain of Thought prompt
   * @param {string} originalPrompt - Original prompt
   * @returns {string} Enhanced prompt with CoT instructions
   */
  _buildChainOfThoughtPrompt(originalPrompt) {
    return `Let's approach this step by step using logical reasoning:

Problem: ${originalPrompt}

Please think through this systematically:
1. Analyze the problem components
2. Consider relevant facts and principles
3. Work through the solution step by step
4. Verify your reasoning
5. Provide the final answer

Show your complete reasoning process.`;
  }

  /**
   * Generate text with DeepSeek R1
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
      throw new Error(`DeepSeek R1 generation failed: ${error.message}`);
    }
  }

  /**
   * Get provider info
   * @returns {Object} Provider information
   */
  getInfo() {
    return {
      name: 'deepseek-r1',
      type: 'reasoning',
      capabilities: ['cot', 'text-generation', 'structured-output'],
      model: this.config.model,
    };
  }
}

export default DeepSeekR1Provider;