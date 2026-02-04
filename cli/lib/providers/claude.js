/**
 * Claude AI Provider (Anthropic)
 * Primary provider for Ultra-Dex generate command
 */

import { BaseProvider } from './base.js';

// Model pricing per 1M tokens (as of Jan 2026)
const PRICING = {
  'claude-sonnet-4-20250514': { input: 3.00, output: 15.00 },
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
  'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
};

const MODELS = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4 (Latest)', maxTokens: 8192, default: true },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', maxTokens: 8192 },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus (Premium)', maxTokens: 4096 },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku (Fast)', maxTokens: 4096 },
];

export class ClaudeProvider extends BaseProvider {
  constructor(apiKey, options = {}) {
    super(apiKey, options);
    this.baseUrl = 'https://api.anthropic.com/v1';
    this.apiVersion = '2023-06-01';
  }

  getName() {
    return 'Claude (Anthropic)';
  }

  getDefaultModel() {
    return 'claude-sonnet-4-20250514';
  }

  getAvailableModels() {
    return MODELS;
  }

  estimateCost(inputTokens, outputTokens) {
    const pricing = PRICING[this.model] || PRICING['claude-sonnet-4-20250514'];
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    return {
      input: inputCost,
      output: outputCost,
      total: inputCost + outputCost,
    };
  }

  async generate(systemPrompt, userPrompt, options = {}) {
    // Validate required parameters
    this.validateParams({ systemPrompt, userPrompt }, ['systemPrompt', 'userPrompt']);

    // Retry logic with exponential backoff
    const maxRetries = options.maxRetries || 3;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(`${this.baseUrl}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': this.apiVersion,
          },
          body: JSON.stringify({
            model: this.model,
            max_tokens: options.maxTokens || this.maxTokens,
            temperature: options.temperature !== undefined ? options.temperature : this.temperature,
            system: systemPrompt,
            messages: [
              { role: 'user', content: userPrompt }
            ],
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));

          // Handle rate limiting
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000; // Exponential backoff

            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, delay));
              continue; // Retry
            }
          }

          throw this.formatError(
            error.error?.message || response.statusText,
            'generate() API call failed'
          );
        }

        const data = await response.json();

        return {
          content: data.content[0]?.text || '',
          usage: {
            inputTokens: data.usage?.input_tokens || 0,
            outputTokens: data.usage?.output_tokens || 0,
          },
          model: data.model || this.model,
        };
      } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
          if (attempt < maxRetries) {
            // Exponential backoff for timeout
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue; // Retry
          }
          throw this.formatError('Request timed out', 'generate()');
        }

        lastError = error;

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry
        }

        throw this.formatError(lastError, 'generate()');
      }
    }

    // This should not be reached, but just in case
    throw this.formatError(lastError || new Error('Max retries exceeded'), 'generate()');
  }

  async generateStream(systemPrompt, userPrompt, onChunk, options = {}) {
    // Validate required parameters
    this.validateParams({ systemPrompt, userPrompt, onChunk }, ['systemPrompt', 'userPrompt', 'onChunk']);

    // Retry logic with exponential backoff
    const maxRetries = options.maxRetries || 3;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(`${this.baseUrl}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': this.apiVersion,
          },
          body: JSON.stringify({
            model: this.model,
            max_tokens: options.maxTokens || this.maxTokens,
            temperature: options.temperature !== undefined ? options.temperature : this.temperature,
            stream: true,
            system: systemPrompt,
            messages: [
              { role: 'user', content: userPrompt }
            ],
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));

          // Handle rate limiting
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000; // Exponential backoff

            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, delay));
              continue; // Retry
            }
          }

          throw this.formatError(
            error.error?.message || response.statusText,
            'generateStream() API call failed'
          );
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

                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  fullContent += parsed.delta.text;
                  onChunk(parsed.delta.text);
                }

                if (parsed.type === 'message_delta' && parsed.usage) {
                  usage.outputTokens = parsed.usage.output_tokens || 0;
                }

                if (parsed.type === 'message_start' && parsed.message?.usage) {
                  usage.inputTokens = parsed.message.usage.input_tokens || 0;
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }

        return { content: fullContent, usage, model: this.model };
      } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
          if (attempt < maxRetries) {
            // Exponential backoff for timeout
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue; // Retry
          }
          throw this.formatError('Request timed out', 'generateStream()');
        }

        lastError = error;

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry
        }

        throw this.formatError(lastError, 'generateStream()');
      }
    }

    // This should not be reached, but just in case
    throw this.formatError(lastError || new Error('Max retries exceeded'), 'generateStream()');
  }

  async validateApiKey() {
    try {
      // Make a minimal request to check API key validity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout / 2); // Half timeout for validation

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion,
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // 200 means valid key and successful request
      // 400 means valid key but bad request (which is expected for validation)
      // 401/403 means invalid key
      return response.ok || response.status === 400;
    } catch (error) {
      // If there's a timeout or network error, we can't validate
      return false;
    }
  }
}

export default ClaudeProvider;
