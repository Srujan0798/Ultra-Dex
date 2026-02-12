// Copyright (c) 2026 Ultra-Dex
// Llama 4 Provider Adapter — Meta's open-weight flagship via Together/Groq

import { BaseProvider } from './base-provider.js';

export class Llama4Provider extends BaseProvider {
  constructor(config = {}) {
    super('llama4', {
      baseUrl: config.baseUrl || 'https://api.together.xyz/v1',
      defaultModel: 'meta-llama/Llama-4-Maverick-17B-128E',
      ...config,
    });
  }

  async chat(messages, options = {}) {
    const result = await this._request('/chat/completions', {
      model: options.model || this.defaultModel,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens || 4096,
    });

    return {
      content: result.choices?.[0]?.message?.content || '',
      usage: {
        inputTokens: result.usage?.prompt_tokens || 0,
        outputTokens: result.usage?.completion_tokens || 0,
        totalTokens: result.usage?.total_tokens || 0,
      },
      model: result.model,
    };
  }

  async *stream(messages, options = {}) {
    for await (const chunk of this._streamRequest('/chat/completions', {
      model: options.model || this.defaultModel,
      messages,
      stream: true,
    })) {
      if (chunk.choices?.[0]?.delta?.content) {
        yield { type: 'content', content: chunk.choices[0].delta.content };
      }
    }
  }

  async embed(input, options = {}) {
    const result = await this._request('/embeddings', {
      model: options.model || 'togethercomputer/m2-bert-80M-8k-retrieval',
      input: Array.isArray(input) ? input : [input],
    });
    return {
      embedding: result.data?.[0]?.embedding || [],
      dimensions: result.data?.[0]?.embedding?.length || 0,
    };
  }
}
