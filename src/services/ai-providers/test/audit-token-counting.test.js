import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { AnthropicProvider } from '../anthropic.js';
import { Claude4Provider } from '../claude4.js';
import { CohereProvider } from '../cohere.js';
import { DeepSeekProvider } from '../deepseek.js';
import { FireworksProvider } from '../fireworks.js';
import { Gemini25Provider } from '../gemini25.js';
import { GoogleProvider } from '../google.js';
import { GPT5Provider } from '../gpt5.js';
import { Grok3Provider } from '../grok3.js';
import { GroqProvider } from '../groq.js';
import { Llama4Provider } from '../llama4.js';
import { MistralProvider } from '../mistral.js';
import { OpenAIProvider } from '../openai.js';
import { PerplexityProvider } from '../perplexity.js';
import { TogetherProvider } from '../together.js';

import { AIProviderRouter } from '../router.js';

const originalFetch = global.fetch;

describe('Token Counting Accuracy Audit', () => {
  let mockFetch;

  beforeEach(() => {
    mockFetch = (url, options) => {
      // Default mock response based on provider type detection (simple heuristics)
      let responseBody = {};

      if (url.includes('anthropic.com')) {
        responseBody = {
          content: [{ text: 'response', type: 'text' }],
          usage: { input_tokens: 10, output_tokens: 20 },
          model: 'claude-3-5-sonnet',
          stop_reason: 'end_turn'
        };
      } else if (url.includes('cohere.com')) {
        responseBody = {
          message: { content: [{ text: 'response' }] },
          usage: { tokens: { input_tokens: 10, output_tokens: 20 } },
          finish_reason: 'COMPLETE'
        };
      } else if (url.includes('googleapis.com')) {
        responseBody = {
          candidates: [{
            content: { parts: [{ text: 'response' }] },
            finishReason: 'STOP'
          }],
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 20,
            totalTokenCount: 30 // Google provides total
          }
        };
      } else {
        // OpenAI-compatible format (DeepSeek, Fireworks, GPT5, Grok3, Groq, Llama4, Mistral, OpenAI, Perplexity, Together)
        responseBody = {
          choices: [{
            message: { content: 'response' },
            finish_reason: 'stop'
          }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30 // Standard OpenAI format provides total
          },
          model: 'gpt-4o'
        };

        // Specific overrides for reasoning models
        if (url.includes('deepseek') || url.includes('grok') || url.includes('gpt-5')) {
           // Add reasoning tokens if needed by specific providers?
           // DeepSeek uses reasoning_content but standard usage
        }
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(responseBody),
        text: () => Promise.resolve(JSON.stringify(responseBody))
      });
    };
    global.fetch = mockFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const providers = [
    { name: 'Anthropic', Class: AnthropicProvider },
    { name: 'Claude4', Class: Claude4Provider },
    { name: 'Cohere', Class: CohereProvider },
    { name: 'DeepSeek', Class: DeepSeekProvider },
    { name: 'Fireworks', Class: FireworksProvider },
    { name: 'Gemini25', Class: Gemini25Provider },
    { name: 'Google', Class: GoogleProvider },
    { name: 'GPT5', Class: GPT5Provider },
    { name: 'Grok3', Class: Grok3Provider },
    { name: 'Groq', Class: GroqProvider },
    { name: 'Llama4', Class: Llama4Provider },
    { name: 'Mistral', Class: MistralProvider },
    { name: 'OpenAI', Class: OpenAIProvider },
    { name: 'Perplexity', Class: PerplexityProvider },
    { name: 'Together', Class: TogetherProvider },
  ];

  for (const { name, Class } of providers) {
    test(`${name} should report accurate token usage`, async () => {
      const provider = new Class({ apiKey: 'test' });
      const result = await provider.chat([{ role: 'user', content: 'hello' }]);

      assert.ok(result.usage, `${name} must return usage object`);
      assert.equal(result.usage.inputTokens, 10, `${name} inputTokens mismatch`);
      assert.equal(result.usage.outputTokens, 20, `${name} outputTokens mismatch`);
      assert.equal(result.usage.totalTokens, 30, `${name} totalTokens mismatch`);
    });
  }
});
