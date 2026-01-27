/**
 * Ollama AI Provider (Local)
 * Provides local intelligence for Ultra-Dex
 */

import { BaseProvider } from './base.js';

const MODELS = [
  { id: 'llama3:8b', name: 'Llama 3 (8B)', maxTokens: 8192, default: true },
  { id: 'mistral', name: 'Mistral', maxTokens: 8192 },
  { id: 'phi3', name: 'Phi-3', maxTokens: 4096 },
  { id: 'codellama', name: 'CodeLlama', maxTokens: 8192 },
];

export class OllamaProvider extends BaseProvider {
  constructor(apiKey, options = {}) {
    // Ollama doesn't typically require an API key
    super(apiKey || 'not-required', options);
    this.baseUrl = options.baseUrl || 'http://localhost:11434/api';
  }

  getName() {
    return 'Ollama (Local)';
  }

  getDefaultModel() {
    return 'llama3:8b';
  }

  getAvailableModels() {
    return MODELS;
  }

  estimateCost(inputTokens, outputTokens) {
    // Local is free!
    return {
      input: 0,
      output: 0,
      total: 0,
    };
  }

  async generate(systemPrompt, userPrompt, options = {}) {
    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        stream: false,
        options: {
          num_predict: options.maxTokens || this.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => response.statusText);
      throw new Error(`Ollama API error: ${error}`);
    }

    const data = await response.json();
    
    return {
      content: data.response || '',
      usage: {
        inputTokens: data.prompt_eval_count || 0,
        outputTokens: data.eval_count || 0,
      },
    };
  }

  async generateStream(systemPrompt, userPrompt, onChunk, options = {}) {
    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        stream: true,
        options: {
          num_predict: options.maxTokens || this.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.response) {
            fullContent += parsed.response;
            onChunk(parsed.response);
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }

    return { 
      content: fullContent, 
      usage: { inputTokens: 0, outputTokens: 0 } // Ollama streaming usage is complex to track line by line
    };
  }

  async validateApiKey() {
    try {
      const response = await fetch(`${this.baseUrl}/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default OllamaProvider;
