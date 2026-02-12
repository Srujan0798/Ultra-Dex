// Copyright (c) 2026 Ultra-Dex

import {
  deterministicEmbedding,
  joinUrl,
  normalizeMessages,
  normalizeUsage,
  postJson,
  ProviderError,
  streamSse,
} from './http-utils.js';

export class CohereProvider {
  constructor(config = {}) {
    this.providerName = 'cohere';
    this.config = {
      apiKey: config.apiKey || process.env.COHERE_API_KEY,
      baseUrl: config.baseUrl || 'https://api.cohere.com/v2',
      defaultModel: config.defaultModel || 'command-r-plus',
      embeddingModel: config.embeddingModel || 'embed-english-v3.0',
      timeoutMs: config.timeoutMs || 45000,
      extraHeaders: config.extraHeaders || {},
    };

    if (!this.config.apiKey) {
      throw new ProviderError(this.providerName, 'apiKey is required', { code: 'INVALID_CONFIG' });
    }
  }

  get headers() {
    return {
      authorization: `Bearer ${this.config.apiKey}`,
      ...this.config.extraHeaders,
    };
  }

  async chat(messages, opts = {}) {
    const model = opts.model || this.config.defaultModel;

    const payload = await postJson(this.providerName, joinUrl(this.config.baseUrl, '/chat'), {
      headers: this.headers,
      timeoutMs: opts.timeoutMs || this.config.timeoutMs,
      signal: opts.signal,
      body: {
        model,
        messages: normalizeMessages(messages),
        temperature: opts.temperature,
        max_tokens: opts.maxTokens,
        stream: false,
      },
    });

    const content =
      payload?.message?.content?.map((entry) => entry.text).filter(Boolean).join('') ||
      payload?.text ||
      '';

    return {
      content,
      usage: normalizeUsage(payload?.usage || payload?.meta?.billed_units || {}),
      model: payload?.model || model,
    };
  }

  async stream(messages, opts = {}) {
    const model = opts.model || this.config.defaultModel;

    return streamSse(this.providerName, joinUrl(this.config.baseUrl, '/chat'), {
      headers: this.headers,
      timeoutMs: opts.timeoutMs || this.config.timeoutMs,
      signal: opts.signal,
      body: {
        model,
        messages: normalizeMessages(messages),
        temperature: opts.temperature,
        max_tokens: opts.maxTokens,
        stream: true,
      },
    });
  }

  async embed(text, opts = {}) {
    const model = opts.model || this.config.embeddingModel;

    try {
      const payload = await postJson(this.providerName, joinUrl(this.config.baseUrl, '/embed'), {
        headers: this.headers,
        timeoutMs: opts.timeoutMs || this.config.timeoutMs,
        signal: opts.signal,
        body: {
          model,
          texts: [text],
          input_type: opts.inputType || 'search_document',
          embedding_types: ['float'],
        },
      });

      const embedding =
        payload?.embeddings?.float?.[0] ||
        payload?.embeddings?.[0] ||
        payload?.data?.[0]?.embedding;

      if (!Array.isArray(embedding)) {
        throw new ProviderError(this.providerName, 'Invalid embedding response', {
          code: 'INVALID_RESPONSE',
        });
      }

      return {
        embedding,
        dimensions: embedding.length,
      };
    } catch (error) {
      if (error instanceof ProviderError && error.status && error.status < 500) {
        const fallback = deterministicEmbedding(text);
        return {
          embedding: fallback,
          dimensions: fallback.length,
        };
      }
      throw error;
    }
  }

  async complete(prompt, opts = {}) {
    return this.chat([{ role: 'user', content: prompt }], opts);
  }
}

export default CohereProvider;
