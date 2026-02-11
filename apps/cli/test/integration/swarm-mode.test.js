/**
 * @fileoverview Swarm Mode Test module
 * @module integration/swarm-mode.test
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createTestProject, writeTestFile, cleanupTestProject, cleanupTempDir } from '../setup.js';
import { renderer } from '../../lib/ui/renderer.js';
import { swarmCommand } from '../../lib/commands/swarm.js';

describe('swarm mode integration tests', () => {
  let testProjectDir;

  before(async () => {
    testProjectDir = await createTestProject('swarm-test-project');
  });

  after(async () => {
    if (testProjectDir) {
      await cleanupTestProject(testProjectDir);
    }
    await cleanupTempDir();
  });

  it('should expose swarmCommand function', () => {
    assert.equal(typeof swarmCommand, 'function');
  });

  it('should handle dry run without throwing', async () => {
    const originalText = renderer.text;
    const originalClear = renderer.clearScreen;
    renderer.text = async () => {};
    renderer.clearScreen = () => {};

    const originalDir = process.cwd();
    process.chdir(testProjectDir);

    try {
      await writeTestFile(
        testProjectDir,
        'CONTEXT.md',
        `# Test Project Context\nThis is a test project for swarm mode integration.\n`
      );

      await swarmCommand('test task', { dryRun: true, parallel: true });
    } finally {
      process.chdir(originalDir);
      renderer.text = originalText;
      renderer.clearScreen = originalClear;
    }
  });
});
