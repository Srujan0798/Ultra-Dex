// Copyright (c) 2026 Ultra-Dex

import { OpenAICompatibleProvider } from './openai-compatible-provider.js';

export class GroqProvider extends OpenAICompatibleProvider {
  constructor(config = {}) {
    super('groq', {
      apiKey: config.apiKey || process.env.GROQ_API_KEY,
      baseUrl: config.baseUrl || 'https://api.groq.com/openai/v1',
      defaultModel: config.defaultModel || 'llama-3.3-70b-versatile',
      timeoutMs: config.timeoutMs,
      extraHeaders: config.extraHeaders,
    });
  }

  async embed(text, opts = {}) {
    throw new Error('Groq: Embedding API not currently supported');
  }
}

export default GroqProvider;
