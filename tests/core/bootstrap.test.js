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
  await resetForTesting();
  await bootstrap({ skipMonitor: true, skipAnalytics: true });
  assert.strictEqual(isBootstrapped(), true);
  assert.ok(container.isRegistered(DI_TOKENS.memoryManager));
  await shutdown();
});

test('bootstrap - idempotency', { timeout: 10000 }, async () => {
  await resetForTesting();
  await bootstrap({ skipMonitor: true, skipAnalytics: true });
  await bootstrap({ skipMonitor: true, skipAnalytics: true });
  assert.strictEqual(isBootstrapped(), true);
  await shutdown();
});

test('bootstrap - shutdown', { timeout: 10000 }, async () => {
  await resetForTesting();
  await bootstrap({ skipMonitor: true, skipAnalytics: true });
  await shutdown();
  assert.strictEqual(isBootstrapped(), false);
});
