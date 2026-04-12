// Copyright (c) 2026 Ultra-Dex

import { OpenAICompatibleProvider } from './openai-compatible-provider.js';

export class YiProvider extends OpenAICompatibleProvider {
  constructor(config = {}) {
    super('yi', {
      apiKey: config.apiKey || process.env.YI_API_KEY,
      baseUrl: config.baseUrl || 'https://api.lingyiwanwu.com/v1',
      defaultModel: config.defaultModel || 'yi-large',
      embeddingModel: config.embeddingModel || 'text-embedding-3-small',
      timeoutMs: config.timeoutMs,
      extraHeaders: config.extraHeaders,
    });
  }
}

export default YiProvider;
