// Copyright (c) 2026 Ultra-Dex

/**
 * NVIDIA Provider (OpenAI-compatible API)
 */

import { OpenAIProvider } from './openai.js';

const MODELS = [
  {
    id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1',
    name: 'Nemotron Ultra 253B',
    maxTokens: 16384,
    default: true,
  },
  {
    id: 'nvidia/nemotron-4-340b-instruct',
    name: 'Nemotron 4 340B Instruct',
    maxTokens: 8192,
  },
  {
    id: 'meta/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B Instruct',
    maxTokens: 8192,
  },
];

export class NVIDIAProvider {
  /**
   * @param {string} apiKey - Optional API key
   * @param {Object} options - Provider options
   */
  constructor(apiKey, options = {}) {
    this.openAICompatible = new OpenAIProvider(apiKey, {
      ...options,
      model: options.model || this.getDefaultModel(),
    });
    this.openAICompatible.baseUrl = options.baseUrl || 'https://integrate.api.nvidia.com/v1';
    this.openAICompatible.model = options.model || this.getDefaultModel();
    this.model = this.openAICompatible.model;
  }

  /**
   * Get provider name
   * @returns {string}
   */
  getName() {
    return 'nvidia';
  }

  getDefaultModel() {
    return MODELS.find((model) => model.default)?.id || MODELS[0].id;
  }

  getAvailableModels() {
    return MODELS;
  }

  /**
   * Get current model
   * @returns {string}
   */
  getModel() {
    return this.openAICompatible.model;
  }

  /**
   * Generate completion
   * @param {string} systemPrompt 
   * @param {string} userPrompt 
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async generate(systemPrompt, userPrompt, options = {}) {
    return this.openAICompatible.generate(systemPrompt, userPrompt, options);
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
    return this.openAICompatible.generateStream(systemPrompt, userPrompt, onToken, options);
  }
}
