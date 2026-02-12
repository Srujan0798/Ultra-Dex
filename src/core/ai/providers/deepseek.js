// Copyright (c) 2026 Ultra-Dex

import { OpenAICompatibleProvider } from './openai-compatible-provider.js';

export class DeepSeekProvider extends OpenAICompatibleProvider {
  constructor(config = {}) {
    super('deepseek', {
      apiKey: config.apiKey || process.env.DEEPSEEK_API_KEY,
      baseUrl: config.baseUrl || 'https://api.deepseek.com/v1',
      defaultModel: config.defaultModel || 'deepseek-chat',
      embeddingModel: config.embeddingModel || 'text-embedding-3-small',
      timeoutMs: config.timeoutMs,
      extraHeaders: config.extraHeaders,
    });
  }
}

export default DeepSeekProvider;
