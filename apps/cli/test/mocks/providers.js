/**
 * Mock AI Provider for Testing
 * Simulates AI responses without making actual API calls
 */

export class MockAIProvider {
  constructor(options = {}) {
    this.name = options.name || 'MockProvider';
    this.model = options.model || 'mock-model';
    this.responses = options.responses || {};
    this.callHistory = [];
    this.delay = options.delay || 0;
    this.shouldFail = options.shouldFail || false;
    this.failureMessage = options.failureMessage || 'Mock provider failure';
  }

  getName() {
    return this.name;
  }

  getModel() {
    return this.model;
  }

  async generate(systemPrompt, userPrompt, options = {}) {
    this.callHistory.push({ systemPrompt, userPrompt, options, timestamp: Date.now() });

    if (this.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delay));
    }

    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }

    // Check for custom response
    const key = userPrompt.slice(0, 50);
    if (this.responses[key]) {
      return {
        content: this.responses[key],
        usage: { inputTokens: 100, outputTokens: 50 },
        model: this.model,
      };
    }

    // Default mock response
    return {
      content: this.generateMockResponse(systemPrompt, userPrompt),
      usage: { inputTokens: 100, outputTokens: 50 },
      model: this.model,
    };
  }

  generateMockResponse(systemPrompt, userPrompt) {
    if (userPrompt.toLowerCase().includes('review')) {
      return `## Code Review

✅ **Overall**: Code looks good

### Suggestions:
1. Consider adding error handling
2. Add unit tests
3. Document public functions`;
    }

    if (userPrompt.toLowerCase().includes('plan')) {
      return `## Implementation Plan

### Phase 1: Setup
- Initialize project structure
- Configure dependencies

### Phase 2: Core
- Implement main logic
- Add validation

### Phase 3: Testing
- Write unit tests
- Integration tests`;
    }

    if (userPrompt.toLowerCase().includes('generate')) {
      return `\`\`\`javascript
// Generated code
export function example() {
  return 'Hello, World!';
}
\`\`\``;
    }

    return `Mock response for: ${userPrompt.slice(0, 100)}...`;
  }

  async stream(systemPrompt, userPrompt, onChunk) {
    const response = await this.generate(systemPrompt, userPrompt);
    const chunks = response.content.split(' ');

    for (const chunk of chunks) {
      if (this.delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.delay / chunks.length));
      }
      onChunk(chunk + ' ');
    }

    return response;
  }

  getCallHistory() {
    return this.callHistory;
  }

  clearHistory() {
    this.callHistory = [];
  }

  setResponse(key, response) {
    this.responses[key] = response;
  }

  setFailure(shouldFail, message = 'Mock provider failure') {
    this.shouldFail = shouldFail;
    this.failureMessage = message;
  }
}

export class MockOpenAIProvider extends MockAIProvider {
  constructor(options = {}) {
    super({ ...options, name: 'MockOpenAI', model: 'gpt-4-mock' });
  }
}

export class MockAnthropicProvider extends MockAIProvider {
  constructor(options = {}) {
    super({ ...options, name: 'MockAnthropic', model: 'claude-3-mock' });
  }
}

export class MockGeminiProvider extends MockAIProvider {
  constructor(options = {}) {
    super({ ...options, name: 'MockGemini', model: 'gemini-pro-mock' });
  }
}

export default {
  MockAIProvider,
  MockOpenAIProvider,
  MockAnthropicProvider,
  MockGeminiProvider,
};

/**
 * Error handler for providers
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[providers]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
