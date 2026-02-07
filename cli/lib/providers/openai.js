// Copyright (c) 2026 Ultra-Dex

/**
 * OpenAI Provider
 * GPT models for Ultra-Dex generate command
 */

import { BaseProvider } from './base.js';

// Model pricing per 1M tokens (as of Jan 2026)
const PRICING = {
  'gpt-4o': { input: 2.5, output: 10.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4-turbo': { input: 10.0, output: 30.0 },
  'gpt-4': { input: 30.0, output: 60.0 },
  'text-embedding-3-small': { input: 0.02, output: 0 }, // For reference
};

const MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o (Latest)', maxTokens: 16384, default: true },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast)', maxTokens: 16384 },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', maxTokens: 4096 },
  { id: 'gpt-4', name: 'GPT-4', maxTokens: 8192 },
];

export function isValidOpenAIModel(model) {
  if (!model || typeof model !== 'string') return false;
  const normalized = model.trim().toLowerCase();
  if (normalized.length === 0) return false;
  return normalized.startsWith('gpt-') || normalized.startsWith('text-embedding-');
}

export class OpenAIProvider extends BaseProvider {
  constructor(apiKey, options = {}) {
    super(apiKey, options);
    this.baseUrl = 'https://api.openai.com/v1';
    this.embeddingModel = options.embeddingModel || 'text-embedding-3-small';
  }

  getName() {
    return 'OpenAI';
  }

  getDefaultModel() {
    return 'gpt-4o';
  }

  getAvailableModels() {
    return MODELS;
  }

  estimateCost(inputTokens, outputTokens) {
    const pricing = PRICING[this.model] || PRICING['gpt-4o'];
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    return {
      input: inputCost,
      output: outputCost,
      total: inputCost + outputCost,
    };
  }

  async generate(systemPrompt, userPrompt, options = {}) {
    // Retry logic with exponential backoff
    const maxRetries = options.maxRetries || 3;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            max_tokens: options.maxTokens || this.maxTokens,
            temperature: options.temperature !== undefined ? options.temperature : this.temperature,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));

          // Handle rate limiting
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000; // Exponential backoff

            if (attempt < maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, delay));
              continue; // Retry
            }
          }

          throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();

        return {
          content: data.choices[0]?.message?.content || '',
          usage: {
            inputTokens: data.usage?.prompt_tokens || 0,
            outputTokens: data.usage?.completion_tokens || 0,
          },
        };
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue; // Retry
        }

        throw error;
      }
    }

    // This should not be reached, but just in case
    throw lastError || new Error('Max retries exceeded');
  }

  async generateStream(systemPrompt, userPrompt, onChunk, options = {}) {
    // Retry logic with exponential backoff
    const maxRetries = options.maxRetries || 3;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            max_tokens: options.maxTokens || this.maxTokens,
            temperature: options.temperature !== undefined ? options.temperature : this.temperature,
            stream: true,
            stream_options: { include_usage: true },
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));

          // Handle rate limiting
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000; // Exponential backoff

            if (attempt < maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, delay));
              continue; // Retry
            }
          }

          throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let usage = { inputTokens: 0, outputTokens: 0 };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);

                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullContent += content;
                  onChunk(content);
                }

                if (parsed.usage) {
                  usage.inputTokens = parsed.usage.prompt_tokens || 0;
                  usage.outputTokens = parsed.usage.completion_tokens || 0;
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }

        return { content: fullContent, usage };
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue; // Retry
        }

        throw error;
      }
    }

    // This should not be reached, but just in case
    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Get embeddings for text using OpenAI
   * Uses 'text-embedding-3-small' by default
   */
  async getEmbedding(text) {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.embeddingModel,
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI Embeddings API error: ${error.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  async validateApiKey() {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default OpenAIProvider;
