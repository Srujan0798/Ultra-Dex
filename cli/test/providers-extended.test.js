/**
 * Unit tests for OpenAI, Gemini, and Ollama providers
 * Tests: Provider initialization, model management, cost estimation
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { OpenAIProvider } from '../lib/providers/openai.js';
import { GeminiProvider } from '../lib/providers/gemini.js';
import { OllamaProvider } from '../lib/providers/ollama.js';

describe('AI Providers', () => {
  const mockApiKey = 'test-api-key-12345';

  describe('OpenAIProvider', () => {
    test('initializes with correct defaults', () => {
      const provider = new OpenAIProvider(mockApiKey);
      
      assert.strictEqual(provider.getName(), 'OpenAI');
      assert.strictEqual(provider.getDefaultModel(), 'gpt-4o');
      assert.strictEqual(provider.apiKey, mockApiKey);
      assert.strictEqual(provider.baseUrl, 'https://api.openai.com/v1');
    });

    test('returns available models', () => {
      const provider = new OpenAIProvider(mockApiKey);
      const models = provider.getAvailableModels();
      
      assert.ok(Array.isArray(models));
      assert.ok(models.length >= 4, 'Should have at least 4 models');
      
      const modelIds = models.map(m => m.id);
      assert.ok(modelIds.includes('gpt-4o'), 'Should include gpt-4o');
      assert.ok(modelIds.includes('gpt-4o-mini'), 'Should include gpt-4o-mini');
      assert.ok(modelIds.includes('gpt-4-turbo'), 'Should include gpt-4-turbo');
      assert.ok(modelIds.includes('gpt-4'), 'Should include gpt-4');
    });

    test('each model has required properties', () => {
      const provider = new OpenAIProvider(mockApiKey);
      const models = provider.getAvailableModels();
      
      for (const model of models) {
        assert.ok(model.id, 'Model should have id');
        assert.ok(model.name, 'Model should have name');
        assert.ok(typeof model.maxTokens === 'number', 'Model should have maxTokens');
        assert.ok(model.maxTokens > 0, 'maxTokens should be positive');
      }
    });

    test('estimates cost for gpt-4o correctly', () => {
      const provider = new OpenAIProvider(mockApiKey);
      const cost = provider.estimateCost(1000, 500);
      
      assert.ok(typeof cost.input === 'number');
      assert.ok(typeof cost.output === 'number');
      assert.ok(typeof cost.total === 'number');
      
      // gpt-4o: $2.50/$10.00 per 1M tokens
      // Input: 1000 * 2.50 / 1M = 0.0025
      assert.ok(Math.abs(cost.input - 0.0025) < 0.0001);
      // Output: 500 * 10.00 / 1M = 0.005
      assert.ok(Math.abs(cost.output - 0.005) < 0.0001);
      // Total
      assert.ok(Math.abs(cost.total - 0.0075) < 0.0001);
    });

    test('estimates cost for gpt-4o-mini correctly', () => {
      const provider = new OpenAIProvider(mockApiKey, { model: 'gpt-4o-mini' });
      const cost = provider.estimateCost(1000, 500);
      
      // gpt-4o-mini: $0.15/$0.60 per 1M tokens
      assert.ok(Math.abs(cost.input - 0.00015) < 0.00001);
      assert.ok(Math.abs(cost.output - 0.0003) < 0.00001);
      assert.ok(cost.total > 0);
    });

    test('estimates cost for gpt-4-turbo correctly', () => {
      const provider = new OpenAIProvider(mockApiKey, { model: 'gpt-4-turbo' });
      const cost = provider.estimateCost(1000, 500);
      
      // gpt-4-turbo: $10/$30 per 1M tokens
      assert.ok(Math.abs(cost.input - 0.01) < 0.0001);
      assert.ok(Math.abs(cost.output - 0.015) < 0.0001);
    });

    test('estimates cost for gpt-4 correctly', () => {
      const provider = new OpenAIProvider(mockApiKey, { model: 'gpt-4' });
      const cost = provider.estimateCost(1000, 500);
      
      // gpt-4: $30/$60 per 1M tokens
      assert.ok(Math.abs(cost.input - 0.03) < 0.0001);
      assert.ok(Math.abs(cost.output - 0.03) < 0.0001);
    });

    test('falls back to gpt-4o pricing for unknown models', () => {
      const provider = new OpenAIProvider(mockApiKey, { model: 'unknown-model' });
      const cost = provider.estimateCost(1000, 500);
      
      // Should use gpt-4o pricing
      assert.ok(Math.abs(cost.input - 0.0025) < 0.0001);
    });

    test('accepts custom options', () => {
      const provider = new OpenAIProvider(mockApiKey, {
        model: 'gpt-4',
        maxTokens: 2048,
        temperature: 0.5,
        timeout: 60000
      });

      assert.strictEqual(provider.model, 'gpt-4');
      assert.strictEqual(provider.maxTokens, 2048);
      assert.strictEqual(provider.temperature, 0.5);
      assert.strictEqual(provider.timeout, 60000);
    });

    test('uses default values when options not provided', () => {
      const provider = new OpenAIProvider(mockApiKey);

      assert.strictEqual(provider.model, 'gpt-4o');
      assert.strictEqual(provider.maxTokens, 8192);
      assert.strictEqual(provider.temperature, 0.7);
      assert.strictEqual(provider.timeout, 30000);
    });
  });

  describe('GeminiProvider', () => {
    test('initializes with correct defaults', () => {
      const provider = new GeminiProvider(mockApiKey);
      
      assert.strictEqual(provider.getName(), 'Google Gemini');
      assert.strictEqual(provider.getDefaultModel(), 'gemini-1.5-pro');
      assert.strictEqual(provider.apiKey, mockApiKey);
      assert.strictEqual(provider.baseUrl, 'https://generativelanguage.googleapis.com/v1beta');
    });

    test('returns available models', () => {
      const provider = new GeminiProvider(mockApiKey);
      const models = provider.getAvailableModels();
      
      assert.ok(Array.isArray(models));
      assert.ok(models.length >= 3, 'Should have at least 3 models');
      
      const modelIds = models.map(m => m.id);
      assert.ok(modelIds.includes('gemini-1.5-pro'), 'Should include gemini-1.5-pro');
      assert.ok(modelIds.includes('gemini-1.5-flash'), 'Should include gemini-1.5-flash');
      assert.ok(modelIds.includes('gemini-2.0-flash-exp'), 'Should include gemini-2.0-flash-exp');
    });

    test('each model has required properties', () => {
      const provider = new GeminiProvider(mockApiKey);
      const models = provider.getAvailableModels();
      
      for (const model of models) {
        assert.ok(model.id, 'Model should have id');
        assert.ok(model.name, 'Model should have name');
        assert.ok(typeof model.maxTokens === 'number', 'Model should have maxTokens');
      }
    });

    test('estimates cost for gemini-1.5-pro correctly', () => {
      const provider = new GeminiProvider(mockApiKey);
      const cost = provider.estimateCost(1000, 500);
      
      // gemini-1.5-pro: $1.25/$5.00 per 1M tokens
      assert.ok(Math.abs(cost.input - 0.00125) < 0.00001);
      assert.ok(Math.abs(cost.output - 0.0025) < 0.00001);
      assert.ok(cost.total > 0);
    });

    test('estimates cost for gemini-1.5-flash correctly', () => {
      const provider = new GeminiProvider(mockApiKey, { model: 'gemini-1.5-flash' });
      const cost = provider.estimateCost(1000, 500);
      
      // gemini-1.5-flash: $0.075/$0.30 per 1M tokens
      assert.ok(Math.abs(cost.input - 0.000075) < 0.000001);
      assert.ok(Math.abs(cost.output - 0.00015) < 0.000001);
    });

    test('estimates cost for gemini-2.0-flash-exp correctly', () => {
      const provider = new GeminiProvider(mockApiKey, { model: 'gemini-2.0-flash-exp' });
      const cost = provider.estimateCost(1000, 500);
      
      // gemini-2.0-flash-exp: $0.10/$0.40 per 1M tokens
      assert.ok(Math.abs(cost.input - 0.0001) < 0.00001);
      assert.ok(Math.abs(cost.output - 0.0002) < 0.00001);
    });

    test('falls back to gemini-1.5-pro pricing for unknown models', () => {
      const provider = new GeminiProvider(mockApiKey, { model: 'unknown-model' });
      const cost = provider.estimateCost(1000, 500);
      
      // Should use gemini-1.5-pro pricing
      assert.ok(Math.abs(cost.input - 0.00125) < 0.00001);
    });

    test('accepts custom options', () => {
      const provider = new GeminiProvider(mockApiKey, {
        model: 'gemini-1.5-flash',
        maxTokens: 4096,
        temperature: 0.8
      });

      assert.strictEqual(provider.model, 'gemini-1.5-flash');
      assert.strictEqual(provider.maxTokens, 4096);
      assert.strictEqual(provider.temperature, 0.8);
    });
  });

  describe('OllamaProvider', () => {
    test('initializes with correct defaults', () => {
      const provider = new OllamaProvider();
      
      assert.strictEqual(provider.getName(), 'Ollama (Local)');
      assert.strictEqual(provider.getDefaultModel(), 'llama3:8b');
      assert.strictEqual(provider.apiKey, 'not-required');
      assert.strictEqual(provider.baseUrl, 'http://localhost:11434/api');
    });

    test('accepts custom baseUrl', () => {
      const provider = new OllamaProvider(null, { baseUrl: 'http://custom:11434/api' });
      
      assert.strictEqual(provider.baseUrl, 'http://custom:11434/api');
    });

    test('returns available models', () => {
      const provider = new OllamaProvider();
      const models = provider.getAvailableModels();
      
      assert.ok(Array.isArray(models));
      assert.ok(models.length >= 4, 'Should have at least 4 models');
      
      const modelIds = models.map(m => m.id);
      assert.ok(modelIds.includes('llama3:8b'), 'Should include llama3:8b');
      assert.ok(modelIds.includes('mistral'), 'Should include mistral');
      assert.ok(modelIds.includes('phi3'), 'Should include phi3');
      assert.ok(modelIds.includes('codellama'), 'Should include codellama');
    });

    test('each model has required properties', () => {
      const provider = new OllamaProvider();
      const models = provider.getAvailableModels();
      
      for (const model of models) {
        assert.ok(model.id, 'Model should have id');
        assert.ok(model.name, 'Model should have name');
        assert.ok(typeof model.maxTokens === 'number', 'Model should have maxTokens');
      }
    });

    test('estimates cost is always free', () => {
      const provider = new OllamaProvider();
      
      // Local is always free
      const cost1 = provider.estimateCost(1000, 500);
      assert.strictEqual(cost1.input, 0);
      assert.strictEqual(cost1.output, 0);
      assert.strictEqual(cost1.total, 0);
      
      const cost2 = provider.estimateCost(1000000, 500000);
      assert.strictEqual(cost2.input, 0);
      assert.strictEqual(cost2.output, 0);
      assert.strictEqual(cost2.total, 0);
    });

    test('does not require API key', () => {
      // Should work without API key
      const provider1 = new OllamaProvider();
      assert.strictEqual(provider1.apiKey, 'not-required');
      
      // Should work with null API key
      const provider2 = new OllamaProvider(null);
      assert.strictEqual(provider2.apiKey, 'not-required');
      
      // Should work with empty string API key
      const provider3 = new OllamaProvider('');
      assert.strictEqual(provider3.apiKey, 'not-required');
    });

    test('accepts custom options', () => {
      const provider = new OllamaProvider(null, {
        model: 'mistral',
        maxTokens: 4096,
        baseUrl: 'http://localhost:11434/api'
      });

      assert.strictEqual(provider.model, 'mistral');
      assert.strictEqual(provider.maxTokens, 4096);
    });

    test('llama3:8b is default model', () => {
      const provider = new OllamaProvider();
      const models = provider.getAvailableModels();
      
      const llama3 = models.find(m => m.id === 'llama3:8b');
      assert.ok(llama3, 'Should have llama3:8b');
      assert.ok(llama3.default, 'llama3:8b should be marked as default');
    });
  });

  describe('Provider Comparison', () => {
    test('all providers extend BaseProvider', () => {
      const openai = new OpenAIProvider(mockApiKey);
      const gemini = new GeminiProvider(mockApiKey);
      const ollama = new OllamaProvider();
      
      // All should have BaseProvider methods
      assert.strictEqual(typeof openai.getName, 'function');
      assert.strictEqual(typeof gemini.getName, 'function');
      assert.strictEqual(typeof ollama.getName, 'function');
      
      assert.strictEqual(typeof openai.getDefaultModel, 'function');
      assert.strictEqual(typeof gemini.getDefaultModel, 'function');
      assert.strictEqual(typeof ollama.getDefaultModel, 'function');
      
      assert.strictEqual(typeof openai.estimateCost, 'function');
      assert.strictEqual(typeof gemini.estimateCost, 'function');
      assert.strictEqual(typeof ollama.estimateCost, 'function');
    });

    test('all providers have unique names', () => {
      const openai = new OpenAIProvider(mockApiKey);
      const gemini = new GeminiProvider(mockApiKey);
      const ollama = new OllamaProvider();
      
      const names = [openai.getName(), gemini.getName(), ollama.getName()];
      const uniqueNames = new Set(names);
      
      assert.strictEqual(uniqueNames.size, 3, 'All provider names should be unique');
    });

    test('cost comparison: Ollama is cheapest', () => {
      const openai = new OpenAIProvider(mockApiKey);
      const gemini = new GeminiProvider(mockApiKey);
      const ollama = new OllamaProvider();
      
      const cost1k = {
        openai: openai.estimateCost(1000, 500).total,
        gemini: gemini.estimateCost(1000, 500).total,
        ollama: ollama.estimateCost(1000, 500).total
      };
      
      assert.strictEqual(cost1k.ollama, 0, 'Ollama should be free');
      assert.ok(cost1k.openai > cost1k.gemini, 'OpenAI is generally more expensive than Gemini');
    });
  });
});
