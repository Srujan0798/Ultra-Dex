// Copyright (c) 2026 Ultra-Dex

import {
  deterministicEmbedding,
  joinUrl,
  normalizeUsage,
  postJson,
  ProviderError,
  streamSse,
} from './http-utils.js';

function normalizeAnthropicMessages(messages = []) {
  return messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
    }));
}

function getSystemPrompt(messages = [], explicitSystem) {
  if (explicitSystem) return explicitSystem;
  const systemMessage = messages.find((message) => message.role === 'system');
  return typeof systemMessage?.content === 'string' ? systemMessage.content : undefined;
}

export class AnthropicProvider {
  constructor(config = {}) {
    this.providerName = 'anthropic';
    this.config = {
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
      baseUrl: config.baseUrl || 'https://api.anthropic.com/v1',
      defaultModel: config.defaultModel || 'claude-sonnet-4-0',
      timeoutMs: config.timeoutMs || 45000,
      anthropicVersion: config.anthropicVersion || '2023-06-01',
      embeddingDimensions: config.embeddingDimensions || 256,
      extraHeaders: config.extraHeaders || {},
    };

    if (!this.config.apiKey) {
      throw new ProviderError(this.providerName, 'apiKey is required', { code: 'INVALID_CONFIG' });
    }
  }

  get headers() {
    return {
      'x-api-key': this.config.apiKey,
      'anthropic-version': this.config.anthropicVersion,
      ...this.config.extraHeaders,
    };
  }

  async chat(messages, opts = {}) {
    const model = opts.model || this.config.defaultModel;

    const payload = await postJson(this.providerName, joinUrl(this.config.baseUrl, '/messages'), {
      headers: this.headers,
      timeoutMs: opts.timeoutMs || this.config.timeoutMs,
      signal: opts.signal,
      body: {
        model,
        system: getSystemPrompt(messages, opts.system),
        messages: normalizeAnthropicMessages(messages),
        max_tokens: opts.maxTokens || 2048,
        temperature: opts.temperature,
      },
    });

    const content = (payload?.content || [])
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('');

    return {
      content,
      usage: normalizeUsage(payload?.usage),
      model: payload?.model || model,
    };
  }

  async stream(messages, opts = {}) {
    const model = opts.model || this.config.defaultModel;

    return streamSse(this.providerName, joinUrl(this.config.baseUrl, '/messages'), {
      headers: this.headers,
      timeoutMs: opts.timeoutMs || this.config.timeoutMs,
      signal: opts.signal,
      body: {
        model,
        system: getSystemPrompt(messages, opts.system),
        messages: normalizeAnthropicMessages(messages),
        max_tokens: opts.maxTokens || 2048,
        temperature: opts.temperature,
        stream: true,
      },
    });
  }

  async embed(text, opts = {}) {
    const dimensions = opts.dimensions || this.config.embeddingDimensions;
    const embedding = deterministicEmbedding(text, dimensions);

    return {
      embedding,
      dimensions: embedding.length,
    };
  }

  async complete(prompt, opts = {}) {
    return this.chat([{ role: 'user', content: prompt }], opts);
  }
}

export default AnthropicProvider;
