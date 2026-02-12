// Copyright (c) 2026 Ultra-Dex
// GPT-5 Provider Adapter — OpenAI's next-gen reasoning model

import { BaseProvider } from './base-provider.js';

export class GPT5Provider extends BaseProvider {
  constructor(config = {}) {
    super('gpt5', {
      baseUrl: 'https://api.openai.com/v1',
      defaultModel: 'gpt-5',
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
        reasoningTokens: result.usage?.reasoning_tokens || 0,
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
      reasoning_effort: options.reasoningEffort ?? 'high',
    })) {
      const delta = chunk.choices?.[0]?.delta;
      if (delta?.content) {
        yield { type: 'content', content: delta.content };
      }
      if (delta?.reasoning_content) {
        yield { type: 'reasoning', content: delta.reasoning_content };
      }
    }
  }

  async embed(input, options = {}) {
    const result = await this._request('/embeddings', {
      model: options.model || 'text-embedding-4-large',
      input: Array.isArray(input) ? input : [input],
      dimensions: options.dimensions || 3072,
    });
    return {
      embedding: result.data?.[0]?.embedding || [],
      dimensions: options.dimensions || 3072,
    };
  }
}
