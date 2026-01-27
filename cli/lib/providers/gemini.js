/**
 * Google Gemini Provider
 * Gemini models for Ultra-Dex generate command
 */

import { BaseProvider } from './base.js';

// Model pricing per 1M tokens (as of Jan 2026)
const PRICING = {
  'gemini-1.5-pro': { input: 1.25, output: 5.00 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  'gemini-2.0-flash-exp': { input: 0.10, output: 0.40 },
};

const MODELS = [
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', maxTokens: 8192, default: true },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Fast)', maxTokens: 8192 },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)', maxTokens: 8192 },
];

export class GeminiProvider extends BaseProvider {
  constructor(apiKey, options = {}) {
    super(apiKey, options);
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  getName() {
    return 'Google Gemini';
  }

  getDefaultModel() {
    return 'gemini-1.5-pro';
  }

  getAvailableModels() {
    return MODELS;
  }

  estimateCost(inputTokens, outputTokens) {
    const pricing = PRICING[this.model] || PRICING['gemini-1.5-pro'];
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    return {
      input: inputCost,
      output: outputCost,
      total: inputCost + outputCost,
    };
  }

  async generate(systemPrompt, userPrompt, options = {}) {
    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: options.maxTokens || this.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return {
      content,
      usage: {
        inputTokens: data.usageMetadata?.promptTokenCount || 0,
        outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
      },
    };
  }

  async generateStream(systemPrompt, userPrompt, onChunk, options = {}) {
    const url = `${this.baseUrl}/models/${this.model}:streamGenerateContent?key=${this.apiKey}&alt=sse`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: options.maxTokens || this.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
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
          
          try {
            const parsed = JSON.parse(data);
            
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              fullContent += text;
              onChunk(text);
            }
            
            if (parsed.usageMetadata) {
              usage.inputTokens = parsed.usageMetadata.promptTokenCount || 0;
              usage.outputTokens = parsed.usageMetadata.candidatesTokenCount || 0;
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }

    return { content: fullContent, usage };
  }

  async validateApiKey() {
    try {
      const url = `${this.baseUrl}/models?key=${this.apiKey}`;
      const response = await fetch(url);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default GeminiProvider;
