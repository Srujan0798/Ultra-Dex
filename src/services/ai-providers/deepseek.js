// Copyright (c) 2026 Ultra-Dex — DeepSeek Provider

import { BaseProvider } from './base-provider.js';

export class DeepSeekProvider extends BaseProvider {
  constructor(config = {}) {
    super('deepseek', {
      baseUrl: 'https://api.deepseek.com/v1',
      defaultModel: 'deepseek-chat',
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
      reasoning: result.choices?.[0]?.message?.reasoning_content || null,
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
    })) {
      const delta = chunk.choices?.[0]?.delta;
      if (delta?.content) yield { type: 'content', content: delta.content };
      if (delta?.reasoning_content) yield { type: 'reasoning', content: delta.reasoning_content };
      if (chunk.choices?.[0]?.finish_reason) {
        yield { type: 'done', finishReason: chunk.choices[0].finish_reason };
      }
    }
  }

  async embed() {
    throw new Error('[deepseek] DeepSeek does not currently support embeddings');
  }
}
