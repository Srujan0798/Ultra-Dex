// Copyright (c) 2026 Ultra-Dex
// Gemini 2.5 Pro Provider Adapter — Google's latest multimodal model

import { BaseProvider } from './base-provider.js';

export class Gemini25Provider extends BaseProvider {
  constructor(config = {}) {
    super('gemini25', {
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      defaultModel: 'gemini-2.5-pro',
      ...config,
    });
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

    const result = await this._request(`/models/${model}:generateContent?key=${this.apiKey}`, {
      contents,
      systemInstruction: systemInstruction
        ? { parts: [{ text: systemInstruction.content }] }
        : undefined,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens || 8192,
        thinkingConfig: { thinkingBudget: options.thinkingBudget || 2048 },
      },
    });

    const parts = result.candidates?.[0]?.content?.parts || [];
    const textParts = parts.filter((p) => p.text).map((p) => p.text);
    const thoughtParts = parts.filter((p) => p.thought).map((p) => p.thought);

    return {
      content: textParts.join(''),
      thinking: thoughtParts.length ? thoughtParts.join('') : null,
      usage: {
        inputTokens: result.usageMetadata?.promptTokenCount || 0,
        outputTokens: result.usageMetadata?.candidatesTokenCount || 0,
        thinkingTokens: result.usageMetadata?.thoughtsTokenCount || 0,
        totalTokens: result.usageMetadata?.totalTokenCount || 0,
      },
      model,
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
      `/models/${model}:streamGenerateContent?key=${this.apiKey}`,
      { contents }
    )) {
      const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        yield { type: 'content', content: text };
      }
    }
  }

  async embed(input, options = {}) {
    const model = options.model || 'text-embedding-005';
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
