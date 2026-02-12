// Copyright (c) 2026 Ultra-Dex
// Claude 4 Provider Adapter — Anthropic's next-gen model

import { BaseProvider } from './base-provider.js';

export class Claude4Provider extends BaseProvider {
  constructor(config = {}) {
    super('claude4', {
      baseUrl: 'https://api.anthropic.com/v1',
      defaultModel: 'claude-4-opus',
      ...config,
    });
  }

  _getHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': '2025-06-01',
    };
  }

  async chat(messages, options = {}) {
    const systemMsg = messages.find((m) => m.role === 'system');
    const userMessages = messages.filter((m) => m.role !== 'system');

    const result = await this._request('/messages', {
      model: options.model || this.defaultModel,
      max_tokens: options.maxTokens || 8192,
      system: systemMsg?.content || '',
      messages: userMessages,
      thinking: options.thinking ?? true,
    });

    return {
      content: result.content?.map((c) => c.text).join('') || '',
      thinking: result.content?.find((c) => c.type === 'thinking')?.thinking || null,
      usage: {
        inputTokens: result.usage?.input_tokens || 0,
        outputTokens: result.usage?.output_tokens || 0,
        totalTokens: (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0),
      },
      model: result.model,
      stop_reason: result.stop_reason,
    };
  }

  async *stream(messages, options = {}) {
    const systemMsg = messages.find((m) => m.role === 'system');
    const userMessages = messages.filter((m) => m.role !== 'system');

    for await (const chunk of this._streamRequest('/messages', {
      model: options.model || this.defaultModel,
      max_tokens: options.maxTokens || 8192,
      system: systemMsg?.content || '',
      messages: userMessages,
      stream: true,
    })) {
      if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
        yield { type: 'content', content: chunk.delta.text };
      }
    }
  }

  async embed(input) {
    // Anthropic doesn't have native embeddings — use Voyage AI
    const result = await this._request('/embeddings', {
      model: 'voyage-3-large',
      input: Array.isArray(input) ? input : [input],
    });
    return {
      embedding: result.data?.[0]?.embedding || [],
      dimensions: result.data?.[0]?.embedding?.length || 0,
    };
  }
}
