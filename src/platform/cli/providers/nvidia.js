// Copyright (c) 2026 Ultra-Dex — NVIDIA Nemotron Provider

/**
 * NVIDIA Nemotron AI Provider
 * Free tier API access to 220+ models via NVIDIA's API
 * Get free API key at: https://build.nvidia.com/
 */

import { BaseProvider } from './base.js';
import OpenAI from 'openai';

const NEMOTRON_MODELS = {
  'nvidia/nemotron-3-super-120b-a12b': {
    id: 'nvidia/nemotron-3-super-120b-a12b',
    name: 'Nemotron-3-Super 120B',
    maxTokens: 32768,
    default: true,
    bestFor: ['agentic workflows', 'complex reasoning', 'tool calling', 'planning', 'coding'],
  },
  'nvidia/nemotron-3-nano-30b-a3b': {
    id: 'nvidia/nemotron-3-nano-30b-a3b',
    name: 'Nemotron-3-Nano 30B',
    maxTokens: 32768,
    bestFor: ['quick responses', 'simple tasks', 'chat', 'fast inference'],
  },
  'meta/llama-3.1-70b-instruct': {
    id: 'meta/llama-3.1-70b-instruct',
    name: 'Llama-3.1 70B Instruct',
    maxTokens: 32768,
    bestFor: ['general chat', 'backup', 'multilingual'],
  },
  'meta/llama-3.1-8b-instruct': {
    id: 'meta/llama-3.1-8b-instruct',
    name: 'Llama-3.1 8B Instruct',
    maxTokens: 32768,
    bestFor: ['fast chat', 'lightweight tasks'],
  },
  'mistralai/mistral-large-3-675b-instruct-2512': {
    id: 'mistralai/mistral-large-3-675b-instruct-2512',
    name: 'Mistral Large 3 675B',
    maxTokens: 32768,
    bestFor: ['general purpose', 'multilingual', 'agentic tasks'],
  },
};

export class NvidiaProvider extends BaseProvider {
  constructor(apiKey, options = {}) {
    super(apiKey, options);
    this.baseUrl = 'https://integrate.api.nvidia.com/v1';
    this.client = null;
  }

  getName() {
    return 'NVIDIA Nemotron';
  }

  getDefaultModel() {
    return 'nvidia/nemotron-3-super-120b-a12b';
  }

  getAvailableModels() {
    return Object.values(NEMOTRON_MODELS);
  }

  estimateCost(_inputTokens, _outputTokens) {
    // NVIDIA free tier
    return {
      input: 0,
      output: 0,
      total: 0,
    };
  }

  _ensureClient() {
    if (!this.client) {
      if (!this.apiKey) {
        throw new Error(
          'NVIDIA API key required. Get one free at https://build.nvidia.com/'
        );
      }
      this.client = new OpenAI({
        baseURL: this.baseUrl,
        apiKey: this.apiKey,
      });
    }
    return this.client;
  }

  async generate(systemPrompt, userPrompt, options = {}) {
    const client = this._ensureClient();
    const model = options.model || this.model || this.getDefaultModel();

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    try {
      const response = await client.chat.completions.create({
        model,
        messages,
        max_tokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature ?? 0.7,
        top_p: options.topP ?? 0.95,
        extra_body: {
          chat_template_kwargs: {
            enable_thinking: options.enableThinking ?? true,
          },
        },
      });

      return {
        content: response.choices[0]?.message?.content || '',
        usage: {
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        model: response.model,
        finishReason: response.choices[0]?.finish_reason,
      };
    } catch (error) {
      throw this.formatError(error, 'NVIDIA generate');
    }
  }

  async generateStream(systemPrompt, userPrompt, onChunk, options = {}) {
    const client = this._ensureClient();
    const model = options.model || this.model || this.getDefaultModel();

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    try {
      const stream = await client.chat.completions.create({
        model,
        messages,
        max_tokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature ?? 0.7,
        top_p: options.topP ?? 0.95,
        stream: true,
        extra_body: {
          chat_template_kwargs: {
            enable_thinking: options.enableThinking ?? true,
          },
        },
      });

      let fullContent = '';
      let totalInputTokens = 0;
      let totalOutputTokens = 0;

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          fullContent += delta;
          onChunk?.(delta);
        }
        // Accumulate usage from chunks
        if (chunk.usage) {
          totalInputTokens = chunk.usage.prompt_tokens || 0;
          totalOutputTokens = chunk.usage.completion_tokens || 0;
        }
      }

      return {
        content: fullContent,
        usage: {
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          totalTokens: totalInputTokens + totalOutputTokens,
        },
        model,
        finishReason: 'stop',
      };
    } catch (error) {
      throw this.formatError(error, 'NVIDIA generateStream');
    }
  }

  async validateApiKey() {
    try {
      const client = this._ensureClient();
      // Simple test call
      await client.chat.completions.create({
        model: this.getDefaultModel(),
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 1,
      });
      return true;
    } catch {
      return false;
    }
  }
}

export default NvidiaProvider;
