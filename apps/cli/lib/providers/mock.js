// Copyright (c) 2026 Ultra-Dex

/**
 * Mock AI Providers for testing
 * Predictable, deterministic responses without external APIs
 */

import { BaseProvider } from './base.js';

class MockProviderBase extends BaseProvider {
  constructor(providerName, options = {}) {
    super('mock-key', options);
    this.providerName = providerName;
    this.mockResponse = options.mockResponse || null;
  }

  getName() {
    return this.providerName;
  }

  getDefaultModel() {
    return 'mock-1';
  }

  getAvailableModels() {
    return [{ id: 'mock-1', name: 'Mock Model', maxTokens: 8192 }];
  }

  estimateCost(_inputTokens, _outputTokens) {
    return { input: 0, output: 0, total: 0 };
  }

  async validateApiKey() {
    return true;
  }

  buildResponse(systemPrompt, userPrompt) {
    if (this.mockResponse) return this.mockResponse;
    const system = (systemPrompt || '').trim();
    const user = (userPrompt || '').trim();
    const summary = [
      system ? `system:${system.slice(0, 60)}` : 'system:<empty>',
      user ? `user:${user.slice(0, 60)}` : 'user:<empty>',
    ].join(' | ');
    return `[${this.providerName}] ${summary}`;
  }

  async generate(systemPrompt, userPrompt) {
    const content = this.buildResponse(systemPrompt, userPrompt);
    return {
      content,
      usage: { inputTokens: 0, outputTokens: content.length },
      model: this.model,
    };
  }

  async generateStream(systemPrompt, userPrompt, onChunk) {
    const content = this.buildResponse(systemPrompt, userPrompt);
    const chunks = content.match(/.{1,20}/g) || [content];
    for (const chunk of chunks) {
      if (onChunk) onChunk(chunk);
    }
    return {
      content,
      usage: { inputTokens: 0, outputTokens: content.length },
      model: this.model,
    };
  }

  async generateWithTools(systemPrompt, userPrompt, tools, options = {}) {
    const content = this.buildResponse(systemPrompt, userPrompt);

    // If tools are provided, simulate a tool call response
    let toolCalls = undefined;
    if (tools && tools.length > 0) {
      // Randomly decide if we should simulate a tool call
      if (Math.random() > 0.7) { // 30% chance of tool call
        const randomTool = tools[Math.floor(Math.random() * tools.length)];
        toolCalls = [{
          id: `call_${Math.random().toString(36).substr(2, 9)}`,
          type: 'function',
          function: {
            name: randomTool.function?.name || 'unknown_tool',
            arguments: JSON.stringify(randomTool.function?.parameters || {})
          }
        }];
      }
    }

    return {
      content,
      toolCalls,
      usage: { inputTokens: 0, outputTokens: content.length },
      model: this.model,
    };
  }
}

export class MockOpenAI extends MockProviderBase {
  constructor(options = {}) {
    super('MockOpenAI', options);
  }
}

export class MockAnthropic extends MockProviderBase {
  constructor(options = {}) {
    super('MockAnthropic', options);
  }
}

export class MockGoogle extends MockProviderBase {
  constructor(options = {}) {
    super('MockGoogle', options);
  }
}

export default {
  MockOpenAI,
  MockAnthropic,
  MockGoogle,
};

/**
 * Safe execution wrapper with error handling for mock
 * @param {Function} fn - Async function to execute
 * @param {string} [context='mock'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'mock') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
