// Copyright (c) 2026 Ultra-Dex

import { OpenAICompatibleProvider } from './openai-compatible-provider.js';

export class OpenAIProvider extends OpenAICompatibleProvider {
  constructor(config = {}) {
    super('openai', {
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      baseUrl: config.baseUrl || 'https://api.openai.com/v1',
      defaultModel: config.defaultModel || 'gpt-4o',
      embeddingModel: config.embeddingModel || 'text-embedding-3-small',
      timeoutMs: config.timeoutMs,
      extraHeaders: config.extraHeaders,
    });
  }
}

export default OpenAIProvider;
