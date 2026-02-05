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
    return [
      { id: 'mock-1', name: 'Mock Model', maxTokens: 8192 }
    ];
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
      user ? `user:${user.slice(0, 60)}` : 'user:<empty>'
    ].join(' | ');
    return `[${this.providerName}] ${summary}`;
  }

  async generate(systemPrompt, userPrompt) {
    const content = this.buildResponse(systemPrompt, userPrompt);
    return {
      content,
      usage: { inputTokens: 0, outputTokens: content.length },
      model: this.model
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
      model: this.model
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
  MockGoogle
};
