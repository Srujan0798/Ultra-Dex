// Copyright (c) 2026 Ultra-Dex

import { OpenAICompatibleProvider } from './openai-compatible-provider.js';

export class QwenProvider extends OpenAICompatibleProvider {
  constructor(config = {}) {
    super('qwen', {
      apiKey: config.apiKey || process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY,
      baseUrl: config.baseUrl || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
      defaultModel: config.defaultModel || 'qwen-plus',
      embeddingModel: config.embeddingModel || 'text-embedding-v3',
      timeoutMs: config.timeoutMs,
      extraHeaders: config.extraHeaders,
    });
  }
}

export default QwenProvider;
