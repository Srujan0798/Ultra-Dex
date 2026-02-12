import { test, describe } from 'node:test';
import assert from 'node:assert';
import { swarmCommand } from '../../apps/cli/lib/commands/swarm.js';

describe('CLI Command: swarm', () => {
  test('swarmCommand executes dryRun successfully', async () => {
    const task = 'Test functionality';
    const options = { dryRun: true };

    try {
      // This will print to stdout/stderr, which is fine for now
      await swarmCommand(task, options);
      assert.ok(true, 'swarmCommand with dryRun should complete without error');
    } catch (error) {
      assert.fail(`swarmCommand failed: ${error.message}`);
    }
  });

  test('swarmCommand executes dryRun with parallel option', async () => {
    const task = 'Test parallel';
    const options = { dryRun: true, parallel: true };

    try {
      await swarmCommand(task, options);
      assert.ok(true, 'swarmCommand with dryRun+parallel should complete without error');
    } catch (error) {
      assert.fail(`swarmCommand parallel failed: ${error.message}`);
    }
  });
});
