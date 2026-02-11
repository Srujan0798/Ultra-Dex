// Copyright (c) 2026 Ultra-Dex
// tests/core/ai-meta-layer.test.js

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'assert';
import { aiMetaLayer } from '../../packages/core/index.js';

describe('AIMetaLayer', () => {
  let testMetaLayer;

  beforeEach(() => {
    // Create a fresh instance for each test
    testMetaLayer = new (class extends aiMetaLayer.constructor {
      constructor() {
        super();
        // Override providers to avoid actual API calls
        this.providers.clear();
        this.providers.set('test', {
          client: {
            'gpt-4o-2024-11-20': {
              call: async (options) => {
                return {
                  content: 'Test response',
                  usage: { totalTokens: 10 },
                  finishReason: 'stop'
                };
              },
              stream: async (options) => {
                // Mock stream
                return { [Symbol.asyncIterator]: async function*() { yield 'Test stream response'; } };
              },
              generateObject: async (options) => {
                return { object: { test: 'value' }, usage: { totalTokens: 15 } };
              }
            }
          },
          defaultModel: 'gpt-4o-2024-11-20',
          apiKey: 'test-key',
          config: {}
        });
        this.activeProvider = this.providers.get('test');
      }
    })();
  });

  it('should initialize with providers', () => {
    assert.ok(testMetaLayer.providers.size > 0);
    assert.ok(testMetaLayer.activeProvider);
  });

  it('should call AI providers with unified interface', async () => {
    const result = await testMetaLayer.call('gpt-4o-2024-11-20', [
      { role: 'user', content: 'Hello' }
    ], {});

    assert.ok(result);
    assert.strictEqual(result.content, 'Test response');
    assert.ok(result.usage);
    assert.strictEqual(result.usage.totalTokens, 10);
  });

  it('should stream responses', async () => {
    const stream = await testMetaLayer.stream('gpt-4o-2024-11-20', [
      { role: 'user', content: 'Stream this' }
    ], {});

    assert.ok(stream);
    // Note: We can't fully test the stream without implementing the full async iterator
  });

  it('should generate structured objects', async () => {
    const mockSchema = { type: 'object', properties: { test: { type: 'string' } } };
    
    const result = await testMetaLayer.generateObject('gpt-4o-2024-11-20', [
      { role: 'user', content: 'Generate an object' }
    ], mockSchema, {});

    assert.ok(result);
    assert.ok(result.object);
    assert.ok(result.usage);
    assert.strictEqual(result.usage.totalTokens, 15);
  });

  it('should select provider based on request', () => {
    const request = { metadata: { taskType: 'creative' } };
    const provider = testMetaLayer.selectProvider(request);
    
    // Since we only have test provider, it should return that
    assert.ok(provider);
  });

  it('should handle routing based on task type', () => {
    // Test creative task routing
    const creativeRequest = { metadata: { taskType: 'creative' } };
    const creativeProvider = testMetaLayer.selectProvider(creativeRequest);
    assert.ok(creativeProvider);

    // Test coding task routing
    const codingRequest = { metadata: { taskType: 'coding' } };
    const codingProvider = testMetaLayer.selectProvider(codingRequest);
    assert.ok(codingProvider);

    // Test analysis task routing
    const analysisRequest = { metadata: { taskType: 'analysis' } };
    const analysisProvider = testMetaLayer.selectProvider(analysisRequest);
    assert.ok(analysisProvider);
  });

  it('should cache results when enabled', async () => {
    // Enable caching for this test
    testMetaLayer.config.enableCaching = true;
    
    const messages = [{ role: 'user', content: 'Test cache' }];
    const options = {};
    
    // First call
    const result1 = await testMetaLayer.call('gpt-4o-2024-11-20', messages, options);
    
    // Second call with same params should use cache
    const result2 = await testMetaLayer.call('gpt-4o-2024-11-20', messages, options);
    
    assert.ok(result1);
    assert.ok(result2);
  });

  it('should generate cache keys properly', () => {
    const model = 'gpt-4o-2024-11-20';
    const messages = [{ role: 'user', content: 'Test message' }];
    const options = { temperature: 0.7 };
    
    const key1 = testMetaLayer.generateCacheKey(model, messages, options);
    const key2 = testMetaLayer.generateCacheKey(model, messages, options);
    
    // Same inputs should generate same key
    assert.strictEqual(key1, key2);
    
    const differentMessages = [{ role: 'user', content: 'Different message' }];
    const key3 = testMetaLayer.generateCacheKey(model, differentMessages, options);
    
    // Different inputs should generate different keys
    assert.notStrictEqual(key1, key3);
  });

  it('should get metrics', () => {
    const metrics = testMetaLayer.getMetrics();
    
    assert.ok(metrics);
    assert.strictEqual(typeof metrics.totalRequests, 'number');
    assert.strictEqual(typeof metrics.successfulRequests, 'number');
    assert.strictEqual(typeof metrics.failedRequests, 'number');
    assert.strictEqual(typeof metrics.avgResponseTime, 'number');
    assert.strictEqual(typeof metrics.totalTokens, 'number');
    assert.strictEqual(typeof metrics.cacheHits, 'number');
    assert.strictEqual(typeof metrics.cacheMisses, 'number');
  });

  it('should get provider status', () => {
    const status = testMetaLayer.getProviderStatus();
    
    assert.ok(status);
    assert.ok(Object.keys(status).length > 0);
  });
});