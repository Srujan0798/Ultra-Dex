// Copyright (c) 2026 Ultra-Dex
/**
 * Bootstrap DI Container Tests
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as bootstrapModule from '../../src/core/bootstrap.js';
import { container } from '../../src/core/di/container.js';
import { DI_TOKENS } from '../../src/core/di/tokens.js';

const { bootstrap, shutdown, isBootstrapped, resetForTesting } = bootstrapModule.default || bootstrapModule;

test('bootstrap - initialization', { timeout: 10000 }, async () => {
  console.log('Test 1: Starting');
  await resetForTesting();
  console.log('Test 1: Reset complete');
  await bootstrap({ skipMonitor: true, skipAnalytics: true });
  console.log('Test 1: Bootstrap complete');
  assert.strictEqual(isBootstrapped(), true);
  assert.ok(container.isRegistered(DI_TOKENS.memoryManager));
  await shutdown();
  console.log('Test 1: Shutdown complete');
});

test('bootstrap - idempotency', { timeout: 10000 }, async () => {
  console.log('Test 2: Starting');
  await resetForTesting();
  console.log('Test 2: Reset complete');
  await bootstrap({ skipMonitor: true, skipAnalytics: true });
  console.log('Test 2: First bootstrap complete');
  await bootstrap({ skipMonitor: true, skipAnalytics: true });
  console.log('Test 2: Second bootstrap complete');
  assert.strictEqual(isBootstrapped(), true);
  await shutdown();
  console.log('Test 2: Shutdown complete');
});

test('bootstrap - shutdown', { timeout: 10000 }, async () => {
  console.log('Test 3: Starting');
  await resetForTesting();
  console.log('Test 3: Reset complete');
  await bootstrap({ skipMonitor: true, skipAnalytics: true });
  console.log('Test 3: Bootstrap complete');
  await shutdown();
  console.log('Test 3: Shutdown complete');
  assert.strictEqual(isBootstrapped(), false);
});
