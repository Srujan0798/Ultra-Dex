// Copyright (c) 2026 Ultra-Dex

import { OpenAICompatibleProvider } from './openai-compatible-provider.js';

export class DeepSeekR1Provider extends OpenAICompatibleProvider {
  constructor(config = {}) {
    super('deepseek-r1', {
      apiKey: config.apiKey || process.env.DEEPSEEK_API_KEY,
      baseUrl: config.baseUrl || 'https://api.deepseek.com/v1',
      defaultModel: config.defaultModel || 'deepseek-r1',
      embeddingModel: config.embeddingModel || 'text-embedding-3-small',
      timeoutMs: config.timeoutMs,
      extraHeaders: config.extraHeaders,
    });
  }

  async chainOfThought(prompt, opts = {}) {
    return this.chat(
      [
        {
          role: 'system',
          content:
            'Think step by step and provide a concise reasoning trace followed by the final answer.',
        },
        { role: 'user', content: prompt },
      ],
      opts
    );
  }
}

export default DeepSeekR1Provider;
