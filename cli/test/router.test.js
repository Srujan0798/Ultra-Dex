/**
 * Comprehensive tests for Router Provider (Semantic Router)
 * Tests: Provider routing, complexity assessment, local/cloud switching
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { RouterProvider } from '../lib/providers/router.js';

describe('Router Provider', () => {
  const mockApiKey = 'test-api-key';

  describe('Provider Initialization', () => {
    test('initializes with local and cloud providers', () => {
      const mockLocalProvider = {
        getName: () => 'Local Provider',
        generate: async () => ({ content: 'local' }),
        generateStream: async () => ({ content: 'local' }),
      };

      const mockCloudProvider = {
        getName: () => 'Cloud Provider',
        generate: async () => ({ content: 'cloud' }),
        generateStream: async () => ({ content: 'cloud' }),
      };

      const router = new RouterProvider(mockApiKey, {
        localProvider: mockLocalProvider,
        cloudProvider: mockCloudProvider,
      });

      assert.ok(router.localProvider, 'Should have local provider');
      assert.ok(router.cloudProvider, 'Should have cloud provider');
      assert.strictEqual(router.localProvider.getName(), 'Local Provider');
      assert.strictEqual(router.cloudProvider.getName(), 'Cloud Provider');
    });

    test('has default complexity threshold', () => {
      const router = new RouterProvider(mockApiKey, {});
      assert.strictEqual(router.threshold, 'medium');
    });

    test('accepts custom threshold', () => {
      const router = new RouterProvider(mockApiKey, {
        threshold: 'high',
      });
      assert.strictEqual(router.threshold, 'high');
    });
  });

  describe('Provider Information', () => {
    test('getName returns router name with providers', () => {
      const mockLocal = { getName: () => 'Ollama' };
      const mockCloud = { getName: () => 'Claude' };

      const router = new RouterProvider(mockApiKey, {
        localProvider: mockLocal,
        cloudProvider: mockCloud,
      });

      const name = router.getName();
      assert.ok(name.includes('Semantic Router'));
      assert.ok(name.includes('Ollama'));
      assert.ok(name.includes('Claude'));
    });

    test('getName handles missing providers gracefully', () => {
      const router = new RouterProvider(mockApiKey, {});
      const name = router.getName();
      assert.ok(name.includes('Semantic Router'));
    });

    test('getDefaultModel returns router-v1', () => {
      const router = new RouterProvider(mockApiKey, {});
      assert.strictEqual(router.getDefaultModel(), 'router-v1');
    });
  });

  describe('Complexity Assessment', () => {
    test('detects complex keywords', () => {
      const router = new RouterProvider(mockApiKey, {});

      const complexPrompts = [
        'Please refactor this code',
        'Architect a new system',
        'Perform a security audit',
        'Apply design patterns',
        'Plan a migration strategy',
        'Do performance optimization',
        'Handle this complex scenario',
        'Fix the bug in production',
      ];

      for (const prompt of complexPrompts) {
        const isComplex = router.assessComplexity('', prompt);
        assert.strictEqual(isComplex, true, `Should detect complexity in: ${prompt}`);
      }
    });

    test('detects long prompts as complex', () => {
      const router = new RouterProvider(mockApiKey, {});

      // Create a prompt longer than 2000 characters
      const longPrompt = 'a'.repeat(2001);

      const isComplex = router.assessComplexity('', longPrompt);
      assert.strictEqual(isComplex, true, 'Should flag long prompts as complex');
    });

    test('simple prompts are not complex', () => {
      const router = new RouterProvider(mockApiKey, {});

      const simplePrompts = [
        'Hello',
        'What is 2+2?',
        'Explain this function',
        'Short question',
        'Quick help needed',
      ];

      for (const prompt of simplePrompts) {
        const isComplex = router.assessComplexity('', prompt);
        assert.strictEqual(isComplex, false, `Should not flag as complex: ${prompt}`);
      }
    });

    test('assessComplexity is case-insensitive', () => {
      const router = new RouterProvider(mockApiKey, {});

      assert.strictEqual(router.assessComplexity('', 'REFACTOR this'), true);
      assert.strictEqual(router.assessComplexity('', 'Refactor This'), true);
      assert.strictEqual(router.assessComplexity('', 'refactor this'), true);
    });

    test('assessComplexity combines system and user prompts', () => {
      const router = new RouterProvider(mockApiKey, {});

      // Complex keyword in system prompt
      assert.strictEqual(router.assessComplexity('Security audit needed', 'Simple question'), true);

      // Complex keyword in user prompt
      assert.strictEqual(router.assessComplexity('Simple system', 'Refactor this code'), true);
    });
  });

  describe('Provider Routing', () => {
    test('routes complex tasks to cloud provider', async () => {
      let usedProvider = null;

      const mockLocal = {
        getName: () => 'Local',
        generate: async () => {
          usedProvider = 'local';
          return { content: 'local' };
        },
      };

      const mockCloud = {
        getName: () => 'Cloud',
        generate: async () => {
          usedProvider = 'cloud';
          return { content: 'cloud' };
        },
      };

      const router = new RouterProvider(mockApiKey, {
        localProvider: mockLocal,
        cloudProvider: mockCloud,
      });

      await router.generate('System', 'Please refactor this codebase');

      assert.strictEqual(usedProvider, 'cloud', 'Should route complex task to cloud');
    });

    test('routes simple tasks to local provider', async () => {
      let usedProvider = null;

      const mockLocal = {
        getName: () => 'Local',
        generate: async () => {
          usedProvider = 'local';
          return { content: 'local' };
        },
      };

      const mockCloud = {
        getName: () => 'Cloud',
        generate: async () => {
          usedProvider = 'cloud';
          return { content: 'cloud' };
        },
      };

      const router = new RouterProvider(mockApiKey, {
        localProvider: mockLocal,
        cloudProvider: mockCloud,
      });

      await router.generate('System', 'What is the weather?');

      assert.strictEqual(usedProvider, 'local', 'Should route simple task to local');
    });

    test('uses cloud when local provider is missing', async () => {
      let usedProvider = null;

      const mockCloud = {
        getName: () => 'Cloud',
        generate: async () => {
          usedProvider = 'cloud';
          return { content: 'cloud' };
        },
      };

      const router = new RouterProvider(mockApiKey, {
        cloudProvider: mockCloud,
      });

      await router.generate('System', 'Simple question');

      assert.strictEqual(usedProvider, 'cloud', 'Should use cloud when no local');
    });

    test('generate passes options to underlying provider', async () => {
      const receivedOptions = [];

      const mockLocal = {
        getName: () => 'Local',
        generate: async (system, user, options) => {
          receivedOptions.push(options);
          return { content: 'local' };
        },
      };

      const router = new RouterProvider(mockApiKey, {
        localProvider: mockLocal,
      });

      const testOptions = { maxTokens: 100, temperature: 0.5 };
      await router.generate('System', 'Simple', testOptions);

      assert.deepStrictEqual(receivedOptions[0], testOptions);
    });
  });

  describe('Streaming Support', () => {
    test('generateStream routes to appropriate provider', async () => {
      let usedProvider = null;

      const mockLocal = {
        getName: () => 'Local',
        generateStream: async () => {
          usedProvider = 'local';
          return { content: 'local' };
        },
      };

      const mockCloud = {
        getName: () => 'Cloud',
        generateStream: async () => {
          usedProvider = 'cloud';
          return { content: 'cloud' };
        },
      };

      const router = new RouterProvider(mockApiKey, {
        localProvider: mockLocal,
        cloudProvider: mockCloud,
      });

      await router.generateStream('System', 'Refactor this', () => {});

      assert.strictEqual(usedProvider, 'cloud');
    });

    test('generateStream passes onChunk callback', async () => {
      const receivedCallbacks = [];

      const mockLocal = {
        getName: () => 'Local',
        generateStream: async (system, user, onChunk) => {
          receivedCallbacks.push(onChunk);
          return { content: 'local' };
        },
      };

      const router = new RouterProvider(mockApiKey, {
        localProvider: mockLocal,
      });

      const testCallback = (chunk) => console.log(chunk);
      await router.generateStream('System', 'Simple', testCallback);

      assert.strictEqual(receivedCallbacks[0], testCallback);
    });
  });

  describe('API Key Validation', () => {
    test('validateApiKey checks cloud provider', async () => {
      const mockCloud = {
        getName: () => 'Cloud',
        validateApiKey: async () => true,
      };

      const router = new RouterProvider(mockApiKey, {
        cloudProvider: mockCloud,
      });

      const isValid = await router.validateApiKey();
      assert.strictEqual(isValid, true);
    });

    test('validateApiKey returns false for invalid key', async () => {
      const mockCloud = {
        getName: () => 'Cloud',
        validateApiKey: async () => false,
      };

      const router = new RouterProvider(mockApiKey, {
        cloudProvider: mockCloud,
      });

      const isValid = await router.validateApiKey();
      assert.strictEqual(isValid, false);
    });

    test('validateApiKey returns false when no cloud provider', async () => {
      const router = new RouterProvider(mockApiKey, {});

      const isValid = await router.validateApiKey();
      assert.strictEqual(isValid, false);
    });
  });

  describe('Integration', () => {
    test('full routing workflow', async () => {
      const mockLocal = {
        getName: () => 'Ollama',
        generate: async () => ({ content: 'local-response', usage: {} }),
      };

      const mockCloud = {
        getName: () => 'Claude',
        generate: async () => ({ content: 'cloud-response', usage: {} }),
      };

      const router = new RouterProvider(mockApiKey, {
        localProvider: mockLocal,
        cloudProvider: mockCloud,
      });

      // Simple task
      const simpleResult = await router.generate('System', 'Hello');
      assert.ok(simpleResult.content);

      // Complex task
      const complexResult = await router.generate('System', 'Refactor this architecture');
      assert.ok(complexResult.content);
    });

    test('provider names in output', async () => {
      const mockLocal = { getName: () => 'Ollama (Local)' };
      const mockCloud = { getName: () => 'Claude (Cloud)' };

      const router = new RouterProvider(mockApiKey, {
        localProvider: mockLocal,
        cloudProvider: mockCloud,
      });

      const name = router.getName();
      assert.ok(name.includes('Ollama'));
      assert.ok(name.includes('Claude'));
    });
  });
});

/**
 * Error handler for router.test
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[router.test]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
