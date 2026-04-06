// Copyright (c) 2026 Ultra-Dex

import { OpenAICompatibleProvider } from './openai-compatible-provider.js';

export class LlamaProvider extends OpenAICompatibleProvider {
  constructor(config = {}) {
    super('llama', {
      apiKey: config.apiKey || process.env.OLLAMA_API_KEY || 'ollama',
      baseUrl: config.baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
      defaultModel: config.defaultModel || 'llama3.2',
      embeddingModel: config.embeddingModel || 'nomic-embed-text',
      timeoutMs: config.timeoutMs || 90000,
      extraHeaders: config.extraHeaders,
    });
  }
}

export default LlamaProvider;
