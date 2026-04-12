// Copyright (c) 2026 Ultra-Dex

import { OpenAICompatibleProvider } from './openai-compatible-provider.js';

export class TogetherProvider extends OpenAICompatibleProvider {
  constructor(config = {}) {
    super('together', {
      apiKey: config.apiKey || process.env.TOGETHER_API_KEY,
      baseUrl: config.baseUrl || 'https://api.together.xyz/v1',
      defaultModel: config.defaultModel || 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      embeddingModel: config.embeddingModel || 'togethercomputer/m2-bert-80M-8k-retrieval',
      timeoutMs: config.timeoutMs,
      extraHeaders: config.extraHeaders,
    });
  }
}

export default TogetherProvider;
