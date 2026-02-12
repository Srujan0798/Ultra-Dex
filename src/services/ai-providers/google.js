// Copyright (c) 2026 Ultra-Dex — Google (Gemini) Provider

import { BaseProvider } from './base-provider.js';

export class GoogleProvider extends BaseProvider {
  constructor(config = {}) {
    super('google', {
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      defaultModel: 'gemini-1.5-pro',
      ...config,
    });
  }

  _authHeaders() {
    return {};
  }

  async chat(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const systemInstruction = messages.find((m) => m.role === 'system');
    const body = { contents };
    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction.content }] };
    }

    const result = await this._request(`/models/${model}:generateContent?key=${this.apiKey}`, body);

    const text = result.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    return {
      content: text,
      usage: {
        inputTokens: result.usageMetadata?.promptTokenCount || 0,
        outputTokens: result.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: result.usageMetadata?.totalTokenCount || 0,
      },
      model,
      finishReason: result.candidates?.[0]?.finishReason,
    };
  }

  async *stream(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    for await (const chunk of this._streamRequest(
      `/models/${model}:streamGenerateContent?key=${this.apiKey}&alt=sse`,
      { contents }
    )) {
      const text = chunk.candidates?.[0]?.content?.parts?.map((p) => p.text).join('');
      if (text) yield { type: 'content', content: text };
      if (chunk.candidates?.[0]?.finishReason) {
        yield { type: 'done', finishReason: chunk.candidates[0].finishReason };
      }
    }
  }

  async embed(input, options = {}) {
    const model = options.model || 'text-embedding-004';
    const result = await this._request(`/models/${model}:embedContent?key=${this.apiKey}`, {
      model: `models/${model}`,
      content: { parts: [{ text: Array.isArray(input) ? input[0] : input }] },
    });

    return {
      embedding: result.embedding?.values || [],
      dimensions: result.embedding?.values?.length || 0,
    };
  }
}
