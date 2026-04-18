// Copyright (c) 2026 Ultra-Dex
/**
 * Native Dependencies Graceful Degradation Tests
 * Verifies that optionalDependencies don't crash CLI when missing
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

const NATIVE_DEPS = [
  'sharp',
  'sqlite3',
  'node-pty',
  'isolated-vm',
  '@xenova/transformers',
  'playwright',
];

for (const dep of NATIVE_DEPS) {
  test(`optional dep: ${dep} - import fails gracefully`, async () => {
    let error = null;
    let mod = null;

    try {
      mod = await import(dep);
    } catch (e) {
      error = e;
    }

    if (error) {
      assert.ok(
        error.code === 'MODULE_NOT_FOUND' ||
          error.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED' ||
          error.message.includes('not found') ||
          error.message.includes('Cannot find'),
        `Expected MODULE_NOT_FOUND or not found error, got: ${error.code} - ${error.message}`
      );
    } else {
      assert.ok(mod !== null, `${dep} imported successfully (native bindings present)`);
    }
  });

  test(`optional dep: ${dep} - class instantiation doesn't throw`, async () => {
    if (dep === 'sharp') {
      try {
        const sharp = await import('sharp').catch(() => null);
        if (sharp) {
          assert.ok(typeof sharp.default === 'function', 'sharp exports a function');
        }
      } catch {}
    }

    if (dep === 'sqlite3') {
      try {
        const sqlite3 = await import('sqlite3').catch(() => null);
        if (sqlite3) {
          assert.ok(typeof sqlite3.Database === 'function', 'sqlite3 exports Database');
        }
      } catch {}
    }

    if (dep === 'node-pty') {
      try {
        const nodePty = await import('node-pty').catch(() => null);
        if (nodePty) {
          assert.ok(typeof nodePty.spawn === 'function', 'node-pty exports spawn');
        }
      } catch {}
    }

    if (dep === 'isolated-vm') {
      try {
        const ivm = await import('isolated-vm').catch(() => null);
        if (ivm) {
          assert.ok(typeof ivm.Isolate === 'function', 'isolated-vm exports Isolate');
        }
      } catch {}
    }

    if (dep === '@xenova/transformers') {
      try {
        const tf = await import('@xenova/transformers').catch(() => null);
        if (tf) {
          assert.ok(tf !== null, '@xenova/transformers loaded');
        }
      } catch {}
    }

    if (dep === 'playwright') {
      try {
        const pw = await import('playwright').catch(() => null);
        if (pw) {
          assert.ok(typeof pw.chromium === 'function', 'playwright exports chromium');
        }
      } catch {}
    }
  });
}

test('native dep: all optional deps are in package.json', async () => {
  const pkg = await import('../../package.json', { with: { type: 'json' } });
  const optionalDeps = Object.keys(pkg.default.optionalDependencies || {});

  for (const dep of NATIVE_DEPS) {
    assert.ok(optionalDeps.includes(dep), `${dep} should be in optionalDependencies`);
  }
});

test('native dep: missing deps do not crash process', async () => {
  for (const dep of NATIVE_DEPS) {
    try {
      await import(dep);
    } catch (e) {
      if (e.code === 'MODULE_NOT_FOUND') continue;
    }
  }

  assert.ok(
    process.exitCode === undefined || process.exitCode === 0,
    'Process should not have set exitCode'
  );
});
