import { test, describe } from 'node:test';
import assert from 'node:assert';
import { estimateDuration, parsePlanFromMarkdown } from '../../apps/cli/lib/commands/plan.js';

describe('CLI Command: plan', () => {
  test('estimateDuration calculation', () => {
    // Base case: default factors include testing (0.25) and codeReview (0.1) -> 1.35 multiplier
    assert.strictEqual(estimateDuration(10, {}), 13.5, 'Base duration should include defaults');

    // Explicitly disable defaults
    assert.strictEqual(
      estimateDuration(10, { testing: false, codeReview: false }),
      10,
      'Should match base when defaults disabled'
    );

    // With factors
    const duration = estimateDuration(10, { newTech: true, testing: false, codeReview: false });
    // newTech adds 0.3, so 1.3 multiplier. 10 * 1.3 = 13
    assert.strictEqual(duration, 13, 'Factor should increase duration');
  });

  test('parsePlanFromMarkdown processes file correctly', async () => {
    const fs = await import('fs/promises');
    const path = await import('path');

    const testFile = path.resolve(process.cwd(), 'IMPLEMENTATION-PLAN.md');
    const backupFile = testFile + '.bak';
    const hasExisting = await fs
      .access(testFile)
      .then(() => true)
      .catch(() => false);

    // Backup existing if any
    if (hasExisting) {
      await fs.rename(testFile, backupFile);
    }

    try {
      // Create dummy plan
      const content = `
# Project Plan

## Phase 1: Setup
- [x] Initial setup
- [ ] Config

## Phase 2: Core
- [ ] Database
        `;
      await fs.writeFile(testFile, content);

      const phases = await parsePlanFromMarkdown();

      assert.ok(Array.isArray(phases), 'Should return an array of phases');
      assert.strictEqual(phases.length, 2, 'Should find 2 phases');

      const phase1 = phases[0];
      assert.strictEqual(phase1.name, 'Phase 1: Setup');
      assert.strictEqual(phase1.steps.length, 2);
      assert.strictEqual(phase1.steps[0].status, 'completed');
      assert.strictEqual(phase1.steps[0].task, 'Initial setup');
    } finally {
      // Cleanup
      await fs.unlink(testFile).catch(() => {});
      if (hasExisting) {
        await fs.rename(backupFile, testFile);
      }
    }
  });
});
