import { test, describe } from 'node:test';
import assert from 'node:assert';
import { PluginManager } from '../lib/utils/plugin-system.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Plugin System', () => {
  test('PluginManager should initialize with project root', () => {
    const manager = new PluginManager('/tmp/test-project');
    assert.strictEqual(manager.projectRoot, '/tmp/test-project');
    assert.strictEqual(manager.plugins.size, 0);
  });

  test('PluginManager should register and execute hooks', async () => {
    const manager = new PluginManager('/tmp/test-project');
    let hookCalled = false;

    manager.registerHook('test-hook', async (context) => {
      hookCalled = true;
      assert.strictEqual(context.foo, 'bar');
      return 'hook-result';
    });

    const results = await manager.executeHook('test-hook', { foo: 'bar' });
    assert.strictEqual(hookCalled, true);
    assert.strictEqual(results[0], 'hook-result');
  });

  test('PluginManager should handle failed hooks gracefully', async () => {
    const manager = new PluginManager('/tmp/test-project');
    manager.registerHook('fail-hook', async () => {
      throw new Error('Hook failed');
    });

    const results = await manager.executeHook('fail-hook');
    assert.strictEqual(results.length, 0); // result is ignored on failure but doesn't crash
  });
});

/**
 * Error handler for plugins.test
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[plugins.test]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
