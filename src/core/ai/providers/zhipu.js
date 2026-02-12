// Copyright (c) 2026 Ultra-Dex

import { OpenAICompatibleProvider } from './openai-compatible-provider.js';

export class ZhipuProvider extends OpenAICompatibleProvider {
  constructor(config = {}) {
    super('zhipu', {
      apiKey: config.apiKey || process.env.ZHIPU_API_KEY,
      baseUrl: config.baseUrl || 'https://open.bigmodel.cn/api/paas/v4',
      defaultModel: config.defaultModel || 'glm-4',
      embeddingModel: config.embeddingModel || 'text-embedding-3-small',
      timeoutMs: config.timeoutMs,
      extraHeaders: config.extraHeaders,
    });
  }
}

export default ZhipuProvider;
