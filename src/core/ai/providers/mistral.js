// Copyright (c) 2026 Ultra-Dex

import { OpenAICompatibleProvider } from './openai-compatible-provider.js';

export class MistralProvider extends OpenAICompatibleProvider {
  constructor(config = {}) {
    super('mistral', {
      apiKey: config.apiKey || process.env.MISTRAL_API_KEY,
      baseUrl: config.baseUrl || 'https://api.mistral.ai/v1',
      defaultModel: config.defaultModel || 'mistral-large-latest',
      embeddingModel: config.embeddingModel || 'mistral-embed',
      timeoutMs: config.timeoutMs,
      extraHeaders: config.extraHeaders,
    });
  }
}

export default MistralProvider;
