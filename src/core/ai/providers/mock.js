// Copyright (c) 2026 Ultra-Dex
// Mock AI Provider for testing and development

export class MockProvider {
  constructor(config = {}) {
    this.config = config;
    this.name = 'mock';
  }

  async chat(messages, options = {}) {
    return {
      text: 'Mock response from MockProvider',
      usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
      model: options.model || 'mock-model'
    };
  }

  async stream(messages, options = {}) {
    async function* generator() {
      yield { text: 'Mock ' };
      yield { text: 'stream ' };
      yield { text: 'response' };
    }
    return generator();
  }

  async embed(text) {
    return new Array(1536).fill(0).map(() => Math.random());
  }
}

export default MockProvider;
