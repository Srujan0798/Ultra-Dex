// Copyright (c) 2026 Ultra-Dex

import { OpenAICompatibleProvider } from './openai-compatible-provider.js';

export class OpenClawProvider extends OpenAICompatibleProvider {
  constructor(config = {}) {
    super('openclaw', {
      apiKey: config.apiKey || process.env.OPENCLAW_API_KEY,
      baseUrl: config.baseUrl || 'https://api.openclaw.ai/v1',
      defaultModel: config.defaultModel || 'openclaw-vision',
      embeddingModel: config.embeddingModel || 'text-embedding-3-small',
      timeoutMs: config.timeoutMs,
      extraHeaders: config.extraHeaders,
    });
  }
}

export default OpenClawProvider;
