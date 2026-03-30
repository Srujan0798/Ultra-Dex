// Copyright (c) 2026 Ultra-Dex

import { Readable } from 'stream';

/**
 * Mock AI Provider for testing and local-first execution without API keys.
 * Respects MOCK_AI_PROVIDERS environment variable.
 */
export class MockProvider {
  constructor(config = {}) {
    this.config = config;
    this.providerName = 'mock';
    this.defaultModel = config.defaultModel || 'ultra-dex-mock-v1';
  }

  async chat(messages, options = {}) {
    const lastMessage = messages[messages.length - 1]?.content || '';
    let responseText = `[MOCK RESPONSE] I am the Ultra-Dex Mock AI. You asked: "${lastMessage.substring(0, 50)}${lastMessage.length > 50 ? '...' : ''}"`;

    // Specialized responses for common planner/nexus tasks
    if (lastMessage.toLowerCase().includes('hello')) {
      responseText = "Hello! I am the Ultra-Dex autonomous agent. How can I help you build today?";
    } else if (lastMessage.toLowerCase().includes('planner') || lastMessage.toLowerCase().includes('steps')) {
      responseText = "1. Research dependencies\n2. Design architecture\n3. Implement core logic\n4. Write tests\n5. Final validation";
    }

    return {
      content: responseText,
      role: 'assistant',
      model: this.defaultModel,
      usage: {
        promptTokens: 10,
        completionTokens: 50,
        totalTokens: 60
      }
    };
  }

  async stream(messages, options = {}) {
    const result = await this.chat(messages, options);
    const content = result.content;
    const words = content.split(' ');
    
    const stream = new Readable({
      read() {}
    });

    // Simulate streaming
    let i = 0;
    const interval = setInterval(() => {
      if (i < words.length) {
        stream.push(words[i] + (i === words.length - 1 ? '' : ' '));
        i++;
      } else {
        stream.push(null);
        clearInterval(interval);
      }
    }, 10);

    return stream;
  }

  async embed(text) {
    // Generate a deterministic mock embedding
    const length = 1536;
    const embedding = new Array(length).fill(0).map((_, i) => Math.sin(i + text.length));
    
    return {
      embedding,
      model: 'mock-embedding-v1'
    };
  }
}

export default MockProvider;
