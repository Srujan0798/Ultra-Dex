// Copyright (c) 2026 Ultra-Dex
// tests/core/ultra-dex-core.test.js

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'assert';
import { UltraDexMetaLayer } from '../../packages/core/index.js';

describe('UltraDexMetaLayer', () => {
  let ultraDex;

  beforeEach(() => {
    ultraDex = new UltraDexMetaLayer({ autoInitialize: false });
  });

  afterEach(async () => {
    if (ultraDex.isInitialized) {
      await ultraDex.shutdown();
    }
  });

  it('should initialize properly', async () => {
    await ultraDex.initialize();
    assert.strictEqual(ultraDex.isInitialized, true);
  });

  it('should process simple AI requests', async () => {
    await ultraDex.initialize();
    
    // Mock the AI call to avoid actual API calls during testing
    ultraDex.aiMetaLayer.call = async (model, messages, options = {}) => {
      return {
        text: 'Mocked response',
        usage: { totalTokens: 10 },
        finishReason: 'stop'
      };
    };

    const result = await ultraDex.processRequest('Hello, world!');
    assert.ok(result);
    assert.strictEqual(result.text, 'Mocked response');
  });

  it('should identify agent requests correctly', () => {
    assert.strictEqual(ultraDex.isAgentRequest('Execute a task'), false);
    assert.strictEqual(ultraDex.isAgentRequest('Run agent to do something'), true);
    assert.strictEqual(ultraDex.isAgentRequest('Coordinate the workflow'), true);
    assert.strictEqual(ultraDex.isAgentRequest('Delegate this task'), true);
  });

  it('should format messages correctly', () => {
    const simpleRequest = 'Simple text request';
    const formatted = ultraDex.formatAsMessages(simpleRequest);
    assert.deepStrictEqual(formatted, [{ role: 'user', content: 'Simple text request' }]);
    
    const arrayRequest = [{ role: 'system', content: 'System message' }];
    const arrayFormatted = ultraDex.formatAsMessages(arrayRequest);
    assert.deepStrictEqual(arrayFormatted, arrayRequest);
  });

  it('should generate valid request IDs', () => {
    const id = ultraDex.generateRequestId();
    assert.ok(typeof id === 'string');
    assert.ok(id.startsWith('req_'));
    assert.ok(id.length > 10);
  });

  it('should return proper status', () => {
    const status = ultraDex.getStatus();
    assert.ok(status);
    assert.strictEqual(status.status, 'initializing');
    
    // After initialization
    ultraDex.isInitialized = true;
    ultraDex.initializationStartTime = Date.now() - 1000;
    const readyStatus = ultraDex.getStatus();
    assert.strictEqual(readyStatus.status, 'ready');
  });

  it('should handle errors gracefully', async () => {
    await ultraDex.initialize();
    
    // Mock an error in AI call
    ultraDex.aiMetaLayer.call = async (model, messages, options = {}) => {
      throw new Error('API Error');
    };

    try {
      await ultraDex.processRequest('This should fail');
      assert.fail('Expected an error to be thrown');
    } catch (error) {
      assert.strictEqual(error.message, 'API Error');
    }
  });
});