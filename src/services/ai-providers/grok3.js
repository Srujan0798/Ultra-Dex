// Copyright (c) 2026 Ultra-Dex
// Grok-3 Provider Adapter — xAI's reasoning model

import { BaseProvider } from './base-provider.js';

export class Grok3Provider extends BaseProvider {
  constructor(config = {}) {
    super('grok3', {
      baseUrl: 'https://api.x.ai/v1',
      defaultModel: 'grok-3',
      ...config,
    });
  }

  async chat(messages, options = {}) {
    const result = await this._request('/chat/completions', {
      model: options.model || this.defaultModel,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
      reasoning_effort: options.reasoningEffort ?? 'high',
    });

    return {
      content: result.choices?.[0]?.message?.content || '',
      reasoning: result.choices?.[0]?.message?.reasoning_content || null,
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
      model: options.model || 'grok-3-embedding',
      input: Array.isArray(input) ? input : [input],
    });
    return {
      embedding: result.data?.[0]?.embedding || [],
      dimensions: result.data?.[0]?.embedding?.length || 0,
    };
  }
}
