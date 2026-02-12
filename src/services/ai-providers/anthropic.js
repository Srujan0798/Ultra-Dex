// Copyright (c) 2026 Ultra-Dex — Anthropic Provider

import { BaseProvider } from './base-provider.js';

export class AnthropicProvider extends BaseProvider {
  constructor(config = {}) {
    super('anthropic', {
      baseUrl: 'https://api.anthropic.com/v1',
      defaultModel: 'claude-3-5-sonnet-20241022',
      ...config,
    });
  }

  _authHeaders() {
    return {
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
    };
  }

  async chat(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const system = messages.find((m) => m.role === 'system')?.content;
    const filtered = messages.filter((m) => m.role !== 'system');

    const body = {
      model,
      messages: filtered,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature ?? 0.7,
    };
    if (system) body.system = system;

    const result = await this._request('/messages', body);

    return {
      content: result.content?.map((c) => c.text).join('') || '',
      usage: {
        inputTokens: result.usage?.input_tokens || 0,
        outputTokens: result.usage?.output_tokens || 0,
        totalTokens: (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0),
      },
      model: result.model,
      finishReason: result.stop_reason,
    };
  }

  async *stream(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const system = messages.find((m) => m.role === 'system')?.content;
    const filtered = messages.filter((m) => m.role !== 'system');

    const body = {
      model,
      messages: filtered,
      max_tokens: options.maxTokens || 4096,
      stream: true,
    };
    if (system) body.system = system;

    for await (const chunk of this._streamRequest('/messages', body)) {
      if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
        yield { type: 'content', content: chunk.delta.text };
      }
      if (chunk.type === 'message_stop') {
        yield { type: 'done', finishReason: 'stop' };
      }
    }
  }

  async embed() {
    throw new Error('[anthropic] Anthropic does not natively support embeddings');
  }
}
