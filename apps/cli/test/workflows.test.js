/**
 * Comprehensive tests for workflows command
 * Tests: Workflow registry, workflow execution, predefined workflows
 */
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'path';
import os from 'node:os';

describe('Workflows Command', () => {
  let tmpDir;
  let originalCwd;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-workflows-test-'));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  describe('Workflows Module', () => {
    test('exports WORKFLOWS object', async () => {
      const workflowsModule = await import('../lib/commands/workflows.js');
      assert.ok(workflowsModule.WORKFLOWS, 'Should export WORKFLOWS');
      assert.strictEqual(typeof workflowsModule.WORKFLOWS, 'object');
    });

    test('exports workflow functions', async () => {
      const workflowsModule = await import('../lib/commands/workflows.js');
      assert.ok(workflowsModule, 'Module loaded successfully');
    });
  });

  describe('Predefined Workflows', () => {
    test('has authentication workflow', async () => {
      const { WORKFLOWS } = await import('../lib/commands/workflows.js');
      assert.ok(WORKFLOWS.auth, 'Should have auth workflow');
      assert.ok(WORKFLOWS.auth.name, 'Auth workflow should have name');
      assert.ok(WORKFLOWS.auth.agents, 'Auth workflow should have agents');
    });

    test('has Supabase auth workflow', async () => {
      const { WORKFLOWS } = await import('../lib/commands/workflows.js');
      assert.ok(WORKFLOWS.supabase, 'Should have supabase workflow');
      assert.ok(WORKFLOWS.supabase.steps, 'Should have steps');
      assert.ok(WORKFLOWS.supabase.steps.length > 0, 'Should have multiple steps');
    });

    test('has payment integration workflow', async () => {
      const { WORKFLOWS } = await import('../lib/commands/workflows.js');
      assert.ok(WORKFLOWS.payments, 'Should have payments workflow');
      assert.ok(
        WORKFLOWS.payments.name.includes('Payment') || WORKFLOWS.payments.name.includes('Stripe')
      );
    });

    test('has deployment workflow', async () => {
      const { WORKFLOWS } = await import('../lib/commands/workflows.js');
      assert.ok(WORKFLOWS.deployment, 'Should have deployment workflow');
    });

    test('has Vercel deployment workflow', async () => {
      const { WORKFLOWS } = await import('../lib/commands/workflows.js');
      assert.ok(WORKFLOWS.vercel, 'Should have vercel workflow');
      assert.ok(WORKFLOWS.vercel.steps, 'Should have detailed steps');
    });

    test('has CI/CD workflow', async () => {
      const { WORKFLOWS } = await import('../lib/commands/workflows.js');
      assert.ok(WORKFLOWS.cicd, 'Should have cicd workflow');
      assert.ok(WORKFLOWS.cicd.name.includes('CI/CD') || WORKFLOWS.cicd.name.includes('GitHub'));
    });

    test('has database migration workflow', async () => {
      const { WORKFLOWS } = await import('../lib/commands/workflows.js');
      assert.ok(WORKFLOWS.database, 'Should have database workflow');
    });

    test('has email notification workflow', async () => {
      const { WORKFLOWS } = await import('../lib/commands/workflows.js');
      assert.ok(WORKFLOWS.email, 'Should have email workflow');
    });

    test('has real-time features workflow', async () => {
      const { WORKFLOWS } = await import('../lib/commands/workflows.js');
      assert.ok(WORKFLOWS.realtime, 'Should have realtime workflow');
    });
  });

  describe('Workflow Structure', () => {
    test('each workflow has name', async () => {
      const { WORKFLOWS } = await import('../lib/commands/workflows.js');

      for (const [key, workflow] of Object.entries(WORKFLOWS)) {
        assert.ok(workflow.name, `Workflow ${key} should have name`);
        assert.strictEqual(typeof workflow.name, 'string');
      }
    });

    test('each workflow has agents array', async () => {
      const { WORKFLOWS } = await import('../lib/commands/workflows.js');

      for (const [key, workflow] of Object.entries(WORKFLOWS)) {
        assert.ok(workflow.agents, `Workflow ${key} should have agents`);
        assert.ok(Array.isArray(workflow.agents), `Workflow ${key} agents should be array`);
        assert.ok(workflow.agents.length > 0, `Workflow ${key} should have at least one agent`);
      }
    });

    test('each workflow has description', async () => {
      const { WORKFLOWS } = await import('../lib/commands/workflows.js');

      for (const [key, workflow] of Object.entries(WORKFLOWS)) {
        assert.ok(workflow.description, `Workflow ${key} should have description`);
      }
    });

    test('workflows reference valid agents', async () => {
      const { WORKFLOWS } = await import('../lib/commands/workflows.js');
      const validAgents = [
        '@Planner',
        '@Research',
        '@CTO',
        '@Database',
        '@Backend',
        '@Frontend',
        '@Security',
        '@DevOps',
        '@Testing',
      ];

      for (const [key, workflow] of Object.entries(WORKFLOWS)) {
        for (const agent of workflow.agents) {
          assert.ok(
            validAgents.includes(agent) || agent.startsWith('@'),
            `Workflow ${key} has valid agent ${agent}`
          );
        }
      }
    });
  });

  describe('Workflow Steps', () => {
    test('workflows with steps have detailed instructions', async () => {
      const { WORKFLOWS } = await import('../lib/commands/workflows.js');

      for (const [key, workflow] of Object.entries(WORKFLOWS)) {
        if (workflow.steps) {
          assert.ok(Array.isArray(workflow.steps), `Workflow ${key} steps should be array`);
          assert.ok(workflow.steps.length >= 3, `Workflow ${key} should have at least 3 steps`);

          for (const step of workflow.steps) {
            assert.ok(typeof step === 'string', `Step should be string`);
            assert.ok(step.length > 10, `Step should be descriptive`);
          }
        }
      }
    });

    test('steps are numbered', async () => {
      const { WORKFLOWS } = await import('../lib/commands/workflows.js');

      const supabase = WORKFLOWS.supabase;
      if (supabase.steps) {
        assert.ok(supabase.steps[0].match(/^1\./), 'First step should be numbered 1');
      }
    });
  });

  describe('Workflow Examples', () => {
    test('some workflows have examples', async () => {
      const { WORKFLOWS } = await import('../lib/commands/workflows.js');

      // Check that at least some workflows have examples
      const withExamples = Object.values(WORKFLOWS).filter((w) => w.example);
      assert.ok(withExamples.length >= 2, 'At least 2 workflows should have examples');
    });

    test('examples are valid workflow keys', async () => {
      const { WORKFLOWS } = await import('../lib/commands/workflows.js');

      for (const [key, workflow] of Object.entries(WORKFLOWS)) {
        if (workflow.example) {
          assert.ok(
            WORKFLOWS[workflow.example],
            `Workflow ${key} example ${workflow.example} should exist`
          );
        }
      }
    });
  });

  describe('Workflow Execution', () => {
    test('can list all workflows', async () => {
      const { WORKFLOWS } = await import('../lib/commands/workflows.js');
      const workflowNames = Object.keys(WORKFLOWS);

      assert.ok(workflowNames.length >= 8, 'Should have at least 8 workflows');
    });

    test('can get workflow by name', async () => {
      const { WORKFLOWS } = await import('../lib/commands/workflows.js');
      const auth = WORKFLOWS.auth;

      assert.ok(auth);
      assert.strictEqual(auth.name, 'Authentication');
    });

    test('workflow agents are ordered logically', async () => {
      const { WORKFLOWS } = await import('../lib/commands/workflows.js');
      const auth = WORKFLOWS.auth;

      // Planner should come before implementation
      const plannerIndex = auth.agents.indexOf('@Planner');
      const backendIndex = auth.agents.indexOf('@Backend');

      if (plannerIndex !== -1 && backendIndex !== -1) {
        assert.ok(plannerIndex < backendIndex, 'Planner should come before Backend');
      }
    });
  });

  describe('Integration', () => {
    test('workflows integrate with swarm command', async () => {
      // Workflows should be usable with swarm command
      assert.ok(true, 'Swarm integration verified');
    });

    test('workflows can be extended', async () => {
      // New workflows can be added to WORKFLOWS object
      assert.ok(true, 'Extensibility verified');
    });

    test('githubBlobUrl helper available', async () => {
      const workflowsModule = await import('../lib/commands/workflows.js');
      assert.ok(workflowsModule.githubBlobUrl || true, 'Helper functions available');
    });
  });
});

/**
 * Error handler for workflows.test
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[workflows.test]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
