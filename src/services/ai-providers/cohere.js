// Copyright (c) 2026 Ultra-Dex — Cohere Provider

import { BaseProvider } from './base-provider.js';

export class CohereProvider extends BaseProvider {
  constructor(config = {}) {
    super('cohere', {
      baseUrl: 'https://api.cohere.com/v2',
      defaultModel: 'command-r-plus',
      ...config,
    });
  }

  _authHeaders() {
    return { Authorization: `Bearer ${this.apiKey}` };
  }

  async chat(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const result = await this._request('/chat', {
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
    });

    return {
      content: result.message?.content?.[0]?.text || '',
      usage: {
        inputTokens: result.usage?.tokens?.input_tokens || 0,
        outputTokens: result.usage?.tokens?.output_tokens || 0,
        totalTokens:
          (result.usage?.tokens?.input_tokens || 0) + (result.usage?.tokens?.output_tokens || 0),
      },
      model,
      finishReason: result.finish_reason,
    };
  }

  async *stream(messages, options = {}) {
    const model = options.model || this.defaultModel;
    for await (const chunk of this._streamRequest('/chat', {
      model,
      messages,
      stream: true,
    })) {
      if (chunk.type === 'content-delta' && chunk.delta?.message?.content?.text) {
        yield { type: 'content', content: chunk.delta.message.content.text };
      }
      if (chunk.type === 'message-end') {
        yield { type: 'done', finishReason: chunk.delta?.finish_reason || 'stop' };
      }
    }
  }

  async embed(input, options = {}) {
    const model = options.model || 'embed-english-v3.0';
    const texts = Array.isArray(input) ? input : [input];
    const result = await this._request('/embed', {
      model,
      texts,
      input_type: options.inputType || 'search_document',
      embedding_types: ['float'],
    });

    return {
      embedding: result.embeddings?.float?.[0] || [],
      dimensions: result.embeddings?.float?.[0]?.length || 0,
    };
  }
}
