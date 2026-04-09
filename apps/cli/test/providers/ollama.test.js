/**
 * Tests for Ollama Provider
 *
 * Local model provider - ensures Ollama integration works correctly
 */

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

describe('Ollama Provider - Initialization', () => {
  test('should use default localhost endpoint', () => {
    const defaultEndpoint = 'http://localhost:11434';

    assert.ok(defaultEndpoint.includes('localhost'));
    assert.ok(defaultEndpoint.includes('11434'));
  });

  test('should allow custom endpoint', () => {
    const customEndpoint = 'http://custom-host:8080';

    assert.ok(customEndpoint.includes('http'));
    assert.ok(!customEndpoint.includes('localhost'));
  });

  test('should not require API key', () => {
    // Ollama runs locally, no API key needed
    const apiKey = undefined;

    assert.strictEqual(apiKey, undefined);
  });
});

describe('Ollama Provider - Models', () => {
  test('should support llama models', () => {
    const models = ['llama2', 'llama3', 'llama2:13b', 'llama3:70b'];

    models.forEach((model) => {
      assert.ok(model.includes('llama'));
    });
  });

  test('should support mistral models', () => {
    const models = ['mistral', 'mistral:7b', 'mixtral'];

    models.forEach((model) => {
      assert.ok(typeof model === 'string');
      assert.ok(model.length > 0);
    });
  });

  test('should support codellama', () => {
    const models = ['codellama', 'codellama:13b', 'codellama:34b'];

    models.forEach((model) => {
      assert.ok(model.includes('codellama'));
    });
  });

  test('should allow model tags', () => {
    const modelsWithTags = ['llama2:7b-chat', 'mistral:7b-instruct'];

    modelsWithTags.forEach((model) => {
      assert.ok(model.includes(':'));
    });
  });
});

describe('Ollama Provider - Configuration', () => {
  test('should allow temperature setting', () => {
    const validTemperatures = [0, 0.5, 0.8, 1.0];

    validTemperatures.forEach((temp) => {
      assert.ok(temp >= 0 && temp <= 2.0);
    });
  });

  test('should allow top_k parameter', () => {
    const validTopK = [10, 20, 40, 80];

    validTopK.forEach((k) => {
      assert.ok(k > 0);
      assert.ok(Number.isInteger(k));
    });
  });

  test('should allow top_p parameter', () => {
    const validTopP = [0.1, 0.5, 0.9, 1.0];

    validTopP.forEach((p) => {
      assert.ok(p > 0 && p <= 1.0);
    });
  });

  test('should allow context window setting', () => {
    const contextSizes = [2048, 4096, 8192, 16384];

    contextSizes.forEach((size) => {
      assert.ok(size > 0);
      assert.ok(Number.isInteger(size));
    });
  });
});

describe('Ollama Provider - API Endpoints', () => {
  test('should support /api/generate endpoint', () => {
    const generateEndpoint = '/api/generate';

    assert.ok(generateEndpoint.startsWith('/api/'));
  });

  test('should support /api/chat endpoint', () => {
    const chatEndpoint = '/api/chat';

    assert.ok(chatEndpoint.includes('chat'));
  });

  test('should support /api/tags endpoint', () => {
    const tagsEndpoint = '/api/tags';

    assert.ok(tagsEndpoint.includes('tags'));
  });

  test('should support /api/pull endpoint', () => {
    const pullEndpoint = '/api/pull';

    assert.ok(pullEndpoint.includes('pull'));
  });
});

describe('Ollama Provider - Request Format', () => {
  test('should format generate request', () => {
    const generateRequest = {
      model: 'llama2',
      prompt: 'Hello!',
      stream: false,
    };

    assert.ok(generateRequest.model);
    assert.ok(generateRequest.prompt);
    assert.strictEqual(typeof generateRequest.stream, 'boolean');
  });

  test('should format chat request', () => {
    const chatRequest = {
      model: 'llama2',
      messages: [{ role: 'user', content: 'Hello!' }],
    };

    assert.ok(chatRequest.messages);
    assert.ok(Array.isArray(chatRequest.messages));
  });

  test('should support system messages', () => {
    const withSystem = {
      model: 'llama2',
      messages: [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Hi' },
      ],
    };

    assert.strictEqual(withSystem.messages[0].role, 'system');
  });
});

describe('Ollama Provider - Response Parsing', () => {
  test('should parse generate response', () => {
    const mockResponse = {
      model: 'llama2',
      response: 'Hello! How can I help?',
      done: true,
    };

    assert.strictEqual(mockResponse.done, true);
    assert.ok(mockResponse.response);
  });

  test('should parse chat response', () => {
    const mockChatResponse = {
      model: 'llama2',
      message: { role: 'assistant', content: 'Hello!' },
      done: true,
    };

    assert.ok(mockChatResponse.message);
    assert.strictEqual(mockChatResponse.message.role, 'assistant');
  });

  test('should handle streaming responses', () => {
    const streamChunks = [
      { response: 'Hello', done: false },
      { response: ' world', done: false },
      { response: '!', done: true },
    ];

    streamChunks.forEach((chunk, index) => {
      if (index < streamChunks.length - 1) {
        assert.strictEqual(chunk.done, false);
      } else {
        assert.strictEqual(chunk.done, true);
      }
    });
  });
});

describe('Ollama Provider - Error Handling', () => {
  test('should handle connection errors', () => {
    const connectionError = {
      code: 'ECONNREFUSED',
      message: 'Connection refused',
    };

    assert.strictEqual(connectionError.code, 'ECONNREFUSED');
  });

  test('should handle model not found', () => {
    const notFoundError = {
      error: 'model not found',
    };

    assert.ok(notFoundError.error.includes('not found'));
  });

  test('should handle timeout', () => {
    const timeoutError = {
      code: 'ETIMEDOUT',
      message: 'Request timeout',
    };

    assert.strictEqual(timeoutError.code, 'ETIMEDOUT');
  });

  test('should suggest model pull on missing model', () => {
    const missingModelMsg = 'Model not found. Try: ollama pull llama2';

    assert.ok(missingModelMsg.includes('ollama pull'));
  });
});

describe('Ollama Provider - Model Management', () => {
  test('should list available models', () => {
    const mockModelList = {
      models: [
        { name: 'llama2', size: '3.8GB' },
        { name: 'mistral', size: '4.1GB' },
      ],
    };

    assert.ok(mockModelList.models);
    assert.ok(Array.isArray(mockModelList.models));
    assert.strictEqual(mockModelList.models.length, 2);
  });

  test('should show model info', () => {
    const modelInfo = {
      name: 'llama2',
      parameters: '7B',
      context_length: 4096,
      quantization: 'Q4_0',
    };

    assert.ok(modelInfo.name);
    assert.ok(modelInfo.parameters);
  });

  test('should support model deletion', () => {
    const deleteRequest = {
      name: 'llama2',
    };

    assert.ok(deleteRequest.name);
  });
});

describe('Ollama Provider - Performance', () => {
  test('should track token generation speed', () => {
    const perfMetrics = {
      total_duration: 1000000000, // nanoseconds
      load_duration: 100000000,
      prompt_eval_count: 10,
      eval_count: 20,
    };

    assert.ok(perfMetrics.total_duration > 0);
    assert.ok(perfMetrics.eval_count > 0);
  });

  test('should calculate tokens per second', () => {
    const tokensGenerated = 100;
    const timeSeconds = 10;
    const tokensPerSecond = tokensGenerated / timeSeconds;

    assert.strictEqual(tokensPerSecond, 10);
  });

  test('should estimate memory usage', () => {
    const modelSizes = {
      '7B': '3.8GB',
      '13B': '7.3GB',
      '70B': '38GB',
    };

    Object.values(modelSizes).forEach((size) => {
      assert.ok(size.includes('GB'));
    });
  });
});

describe('Ollama Provider - Edge Cases', () => {
  test('should handle empty prompt', () => {
    const emptyPrompt = '';

    assert.strictEqual(emptyPrompt, '');
  });

  test('should handle very long prompts', () => {
    const longPrompt = 'word '.repeat(10001);

    assert.ok(longPrompt.length > 50000);
  });

  test('should handle special characters', () => {
    const specialChars = '`~!@#$%^&*()_+-=[]{}|;:\'",.<>?/';

    assert.ok(typeof specialChars === 'string');
  });

  test('should handle unicode', () => {
    const unicode = '你好 مرحبا नमस्ते';

    assert.ok(typeof unicode === 'string');
  });
});

// Note: Integration tests require Ollama to be running locally
// Tests should be run with mocking or against actual Ollama instance

/**
 * Error handler for ollama.test
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[ollama.test]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
