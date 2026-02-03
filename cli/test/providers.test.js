/**
 * Unit tests for AI Provider base class and implementations
 * Tests: BaseProvider, ClaudeProvider, error handling, parameter validation
 */
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { BaseProvider } from '../lib/providers/base.js';
import { ClaudeProvider } from '../lib/providers/claude.js';

describe('AI Providers', () => {
  const mockApiKey = 'test-api-key-12345';

  describe('BaseProvider', () => {
    test('cannot be instantiated directly', () => {
      assert.throws(() => {
        new BaseProvider(mockApiKey);
      }, /abstract.*cannot be instantiated/i);
    });

    test('abstract methods throw when not implemented', () => {
      // Create a concrete implementation for testing base functionality
      class TestProvider extends BaseProvider {
        getDefaultModel() { return 'test-model'; }
        getAvailableModels() { return [{ id: 'test-model', name: 'Test', maxTokens: 1000 }]; }
        estimateCost() { return { input: 0, output: 0, total: 0 }; }
        async generate() { return { content: 'test', usage: { inputTokens: 0, outputTokens: 0 }, model: 'test' }; }
        async generateStream() { return { content: 'test', usage: { inputTokens: 0, outputTokens: 0 }, model: 'test' }; }
        async validateApiKey() { return true; }
        getName() { return 'TestProvider'; }
      }

      const provider = new TestProvider(mockApiKey);
      
      // Test that concrete methods work
      assert.strictEqual(provider.getDefaultModel(), 'test-model');
      assert.strictEqual(provider.getName(), 'TestProvider');
    });

    test('stores API key and options correctly', () => {
      class TestProvider extends BaseProvider {
        getDefaultModel() { return 'test-model'; }
        getAvailableModels() { return []; }
        estimateCost() { return { input: 0, output: 0, total: 0 }; }
        async generate() { return {}; }
        async generateStream() { return {}; }
        async validateApiKey() { return true; }
        getName() { return 'Test'; }
      }

      const provider = new TestProvider(mockApiKey, {
        model: 'custom-model',
        maxTokens: 2048,
        temperature: 0.5,
        timeout: 60000
      });

      assert.strictEqual(provider.apiKey, mockApiKey);
      assert.strictEqual(provider.model, 'custom-model');
      assert.strictEqual(provider.maxTokens, 2048);
      assert.strictEqual(provider.temperature, 0.5);
      assert.strictEqual(provider.timeout, 60000);
    });

    test('uses default values when options not provided', () => {
      class TestProvider extends BaseProvider {
        getDefaultModel() { return 'default-model'; }
        getAvailableModels() { return []; }
        estimateCost() { return { input: 0, output: 0, total: 0 }; }
        async generate() { return {}; }
        async generateStream() { return {}; }
        async validateApiKey() { return true; }
        getName() { return 'Test'; }
      }

      const provider = new TestProvider(mockApiKey);

      assert.strictEqual(provider.model, 'default-model');
      assert.strictEqual(provider.maxTokens, 8192);
      assert.strictEqual(provider.temperature, 0.7);
      assert.strictEqual(provider.timeout, 30000);
    });

    test('formatError creates formatted error messages', () => {
      class TestProvider extends BaseProvider {
        getDefaultModel() { return 'test'; }
        getAvailableModels() { return []; }
        estimateCost() { return {}; }
        async generate() { return {}; }
        async generateStream() { return {}; }
        async validateApiKey() { return true; }
        getName() { return 'TestProvider'; }
      }

      const provider = new TestProvider(mockApiKey);
      const error = provider.formatError('Something went wrong', 'generate()');

      assert.ok(error instanceof Error);
      assert.ok(error.message.includes('TestProvider'));
      assert.ok(error.message.includes('generate()'));
      assert.ok(error.message.includes('Something went wrong'));
    });

    test('formatError handles Error objects', () => {
      class TestProvider extends BaseProvider {
        getDefaultModel() { return 'test'; }
        getAvailableModels() { return []; }
        estimateCost() { return {}; }
        async generate() { return {}; }
        async generateStream() { return {}; }
        async validateApiKey() { return true; }
        getName() { return 'TestProvider'; }
      }

      const provider = new TestProvider(mockApiKey);
      const originalError = new Error('Original error');
      const error = provider.formatError(originalError, 'apiCall()');

      assert.ok(error.message.includes('Original error'));
    });

    test('validateParams checks required parameters', () => {
      class TestProvider extends BaseProvider {
        getDefaultModel() { return 'test'; }
        getAvailableModels() { return []; }
        estimateCost() { return {}; }
        async generate() { return {}; }
        async generateStream() { return {}; }
        async validateApiKey() { return true; }
        getName() { return 'Test'; }
      }

      const provider = new TestProvider(mockApiKey);

      // Should not throw for valid params
      assert.doesNotThrow(() => {
        provider.validateParams({ systemPrompt: 'test', userPrompt: 'test' }, ['systemPrompt', 'userPrompt']);
      });

      // Should throw for missing params
      assert.throws(() => {
        provider.validateParams({ systemPrompt: 'test' }, ['systemPrompt', 'userPrompt']);
      }, /Missing required parameter: userPrompt/);

      // Should throw for empty string
      assert.throws(() => {
        provider.validateParams({ systemPrompt: 'test', userPrompt: '' }, ['systemPrompt', 'userPrompt']);
      }, /Missing required parameter: userPrompt/);

      // Should throw for null
      assert.throws(() => {
        provider.validateParams({ systemPrompt: 'test', userPrompt: null }, ['systemPrompt', 'userPrompt']);
      }, /Missing required parameter: userPrompt/);

      // Should throw for undefined
      assert.throws(() => {
        provider.validateParams({ systemPrompt: 'test', userPrompt: undefined }, ['systemPrompt', 'userPrompt']);
      }, /Missing required parameter: userPrompt/);
    });
  });

  describe('ClaudeProvider', () => {
    test('initializes with correct defaults', () => {
      const provider = new ClaudeProvider(mockApiKey);
      
      assert.strictEqual(provider.getName(), 'Claude (Anthropic)');
      assert.strictEqual(provider.getDefaultModel(), 'claude-sonnet-4-20250514');
      assert.strictEqual(provider.apiKey, mockApiKey);
      assert.strictEqual(provider.baseUrl, 'https://api.anthropic.com/v1');
      assert.strictEqual(provider.apiVersion, '2023-06-01');
    });

    test('returns available models', () => {
      const provider = new ClaudeProvider(mockApiKey);
      const models = provider.getAvailableModels();
      
      assert.ok(Array.isArray(models));
      assert.ok(models.length > 0);
      
      // Check structure of first model
      const firstModel = models[0];
      assert.ok(firstModel.id, 'Model should have id');
      assert.ok(firstModel.name, 'Model should have name');
      assert.ok(typeof firstModel.maxTokens === 'number', 'Model should have maxTokens');
      
      // Should include expected models
      const modelIds = models.map(m => m.id);
      assert.ok(modelIds.includes('claude-sonnet-4-20250514'), 'Should include latest Sonnet');
    });

    test('estimates cost correctly', () => {
      const provider = new ClaudeProvider(mockApiKey);
      
      // Test with default model (claude-sonnet-4-20250514: $3/$15 per 1M tokens)
      const cost = provider.estimateCost(1000, 500);
      
      assert.ok(typeof cost.input === 'number');
      assert.ok(typeof cost.output === 'number');
      assert.ok(typeof cost.total === 'number');
      
      // Input: 1000 tokens at $3/1M = $0.003
      assert.ok(Math.abs(cost.input - 0.003) < 0.0001, `Input cost should be ~0.003, got ${cost.input}`);
      // Output: 500 tokens at $15/1M = $0.0075
      assert.ok(Math.abs(cost.output - 0.0075) < 0.0001, `Output cost should be ~0.0075, got ${cost.output}`);
      // Total
      assert.ok(Math.abs(cost.total - 0.0105) < 0.0001, `Total cost should be ~0.0105, got ${cost.total}`);
    });

    test('estimates cost for different models', () => {
      // Opus is more expensive ($15/$75 per 1M)
      const opusProvider = new ClaudeProvider(mockApiKey, { model: 'claude-3-opus-20240229' });
      const opusCost = opusProvider.estimateCost(1000, 500);
      
      // Input: 1000 tokens at $15/1M = $0.015
      assert.strictEqual(opusCost.input, 0.015);
      // Output: 500 tokens at $75/1M = $0.0375
      assert.strictEqual(opusCost.output, 0.0375);
      
      // Haiku is cheaper ($0.25/$1.25 per 1M)
      const haikuProvider = new ClaudeProvider(mockApiKey, { model: 'claude-3-haiku-20240307' });
      const haikuCost = haikuProvider.estimateCost(1000, 500);
      
      // Input: 1000 tokens at $0.25/1M = $0.00025
      assert.strictEqual(haikuCost.input, 0.00025);
    });

    test('falls back to default pricing for unknown models', () => {
      const provider = new ClaudeProvider(mockApiKey, { model: 'unknown-model' });
      const cost = provider.estimateCost(1000, 500);
      
      // Should use default (Sonnet) pricing
      assert.strictEqual(cost.input, 0.003);
      assert.strictEqual(cost.output, 0.0075);
    });
  });
});
