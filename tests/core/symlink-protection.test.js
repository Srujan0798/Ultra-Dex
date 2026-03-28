// Copyright (c) 2026 Ultra-Dex

import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { GovernanceEngine } from '../../apps/cli/lib/governance/index.js';

describe('Symlink Path Traversal Protection', () => {
  let tempDir;
  let projectRoot;
  let governance;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ultra-dex-symlink-test-'));
    projectRoot = path.join(tempDir, 'project');
    fs.mkdirSync(projectRoot);
    governance = new GovernanceEngine(projectRoot);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('isPathSafe should allow files within project root', () => {
    const safePath = path.join(projectRoot, 'safe.txt');
    fs.writeFileSync(safePath, 'safe');
    assert.strictEqual(governance.isPathSafe('safe.txt'), true);
    assert.strictEqual(governance.isPathSafe(safePath), true);
  });

  test('isPathSafe should block path traversal via ..', () => {
    const sensitivePath = path.join(tempDir, 'sensitive.txt');
    fs.writeFileSync(sensitivePath, 'sensitive');
    
    assert.strictEqual(governance.isPathSafe('../sensitive.txt'), false);
    assert.strictEqual(governance.isPathSafe(path.join(projectRoot, '../../sensitive.txt')), false);
  });

  test('isPathSafe should detect symlink escape (WAVE 2)', () => {
    const sensitivePath = path.join(tempDir, 'outside.txt');
    fs.writeFileSync(sensitivePath, 'secrets');
    
    const symlinkPath = path.join(projectRoot, 'evil-link.txt');
    try {
      fs.symlinkSync(sensitivePath, symlinkPath);
    } catch (e) {
      // On Windows, symlink creation might fail without admin rights
      console.warn('Skipping symlink test: symlink creation failed.');
      return;
    }

    // This is the core WAVE 2 test.
    // Before fix: isPathSafe('evil-link.txt') would return true because 'evil-link.txt' is within projectRoot
    // After fix: isPathSafe should resolve the symlink and see it points outside projectRoot
    
    // We expect it to be FALSE if fixed.
    const isSafe = governance.isPathSafe('evil-link.txt');
    
    // If this fails, it means the fix isn't implemented or isn't working.
    // Note: The current implementation in apps/cli/lib/governance/index.js (which I read earlier)
    // ONLY uses path.resolve(this.projectRoot, filePath).startsWith(this.projectRoot)
    // which DOES NOT resolve symlinks.
    
    assert.strictEqual(isSafe, false, 'Symlink pointing outside project root should be blocked');
  });

  test('isSensitivePath should detect symlink to sensitive file (WAVE 2)', () => {
    const envPath = path.join(projectRoot, '.env');
    fs.writeFileSync(envPath, 'SECRET=123');
    
    const safeLink = path.join(projectRoot, 'not-an-env.txt');
    try {
      fs.symlinkSync(envPath, safeLink);
    } catch (e) {
      return;
    }

    // isSensitivePath('not-an-env.txt')
    // Before fix: returns false because 'not-an-env.txt' doesn't match .env pattern
    // After fix: resolves to .env and returns true
    
    assert.strictEqual(governance.isSensitivePath('not-an-env.txt'), true, 'Symlink to sensitive file should be blocked');
  });
});
