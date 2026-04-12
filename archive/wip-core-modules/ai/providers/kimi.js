// Copyright (c) 2026 Ultra-Dex

import { OpenAICompatibleProvider } from './openai-compatible-provider.js';

export class KimiProvider extends OpenAICompatibleProvider {
  constructor(config = {}) {
    super('kimi', {
      apiKey: config.apiKey || process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY,
      baseUrl: config.baseUrl || 'https://api.moonshot.ai/v1',
      defaultModel: config.defaultModel || 'moonshot-v1-128k',
      timeoutMs: config.timeoutMs,
      extraHeaders: config.extraHeaders,
    });
  }

  async embed(text, opts = {}) {
    throw new Error('Kimi: Embedding API not currently supported');
  }
}

export default KimiProvider;
