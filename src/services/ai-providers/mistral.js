// Copyright (c) 2026 Ultra-Dex — Mistral AI Provider

import { BaseProvider } from './base-provider.js';

export class MistralProvider extends BaseProvider {
  constructor(config = {}) {
    super('mistral', {
      baseUrl: 'https://api.mistral.ai/v1',
      defaultModel: 'mistral-large-latest',
      ...config,
    });
  }

  async chat(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const result = await this._request('/chat/completions', {
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
    });

    return {
      content: result.choices?.[0]?.message?.content || '',
      usage: {
        inputTokens: result.usage?.prompt_tokens || 0,
        outputTokens: result.usage?.completion_tokens || 0,
        totalTokens: result.usage?.total_tokens || 0,
      },
      model: result.model,
      finishReason: result.choices?.[0]?.finish_reason,
    };
  }

  async *stream(messages, options = {}) {
    const model = options.model || this.defaultModel;
    for await (const chunk of this._streamRequest('/chat/completions', {
      model,
      messages,
      stream: true,
      temperature: options.temperature ?? 0.7,
    })) {
      const delta = chunk.choices?.[0]?.delta;
      if (delta?.content) yield { type: 'content', content: delta.content };
      if (chunk.choices?.[0]?.finish_reason) {
        yield { type: 'done', finishReason: chunk.choices[0].finish_reason };
      }
    }
  }

  async embed(input, options = {}) {
    const model = options.model || 'mistral-embed';
    const result = await this._request('/embeddings', {
      model,
      input: Array.isArray(input) ? input : [input],
    });

    return {
      embedding: result.data?.[0]?.embedding || [],
      dimensions: result.data?.[0]?.embedding?.length || 0,
    };
  }
}
