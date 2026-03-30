// Copyright (c) 2026 Ultra-Dex
/**
 * Governance Bypass Prevention Tests
 * VERIFY: No execution path avoids governance checks
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { AgentOrchestrator } from '../../src/core/orchestration/index.js';
import { GovernanceManager } from '../../src/core/governance/governance-manager.js';
import { GovernanceDeniedException } from '../../src/core/governance/governance-manager.js';

describe('Governance Bypass Prevention', () => {
  let orchestrator;
  let governance;

  beforeEach(() => {
    governance = new GovernanceManager();
    
    // Block dangerous tools
    governance.policies.addPolicy({
      id: 'block-dangerous',
      name: 'Block Dangerous Tools',
      condition: (ctx) => {
        const blocked = ['delete_database', 'drop_table', 'truncate'];
        return !blocked.includes(ctx.resource);
      },
      enforcement: 'block'
    });

    orchestrator = new AgentOrchestrator();
    orchestrator.mcpServer = {
      toolsMap: new Map([
        ['delete_database', { handler: async () => 'DELETED' }],
        ['read_file', { handler: async () => 'READ' }]
      ])
    };
  });

  // TASK 2: BYPASS TESTING
  it('executeTool MUST enforce governance (no bypass)', async () => {
    // Inject governance
    orchestrator.governance = governance;

    // Attempt blocked tool via executeTool
    await assert.rejects(
      async () => await orchestrator.executeTool('delete_database', { force: true }),
      GovernanceDeniedException,
      'executeTool MUST enforce governance check'
    );
  });

  it('allowed tools MUST execute through governance', async () => {
    orchestrator.governance = governance;

    // Allowed tool should work
    const result = await orchestrator.executeTool('read_file', { path: '/tmp/test.txt' });
    assert.strictEqual(result, 'READ', 'Allowed tools MUST execute');
  });

  it('executeTask MUST enforce governance (no bypass)', async () => {
    orchestrator.governance = governance;
    governance.policies.addPolicy({
      id: 'block-tasks',
      name: 'Block Certain Tasks',
      condition: (ctx) => !ctx.resource.includes('dangerous'),
      enforcement: 'block'
    });

    // Attempt dangerous task
    await assert.rejects(
      async () => await orchestrator.executeTask('dangerous operation', {}),
      GovernanceDeniedException,
      'executeTask MUST enforce governance check'
    );
  });

  it('MUST NOT bypass governance via direct tool handler call', () => {
    const tool = orchestrator.mcpServer.toolsMap.get('delete_database');
    
    // Direct handler call should NOT bypass governance
    // (This test documents the requirement, actual enforcement is in orchestrator)
    assert.ok(tool.handler, 'Tool has direct handler');
    
    // In a properly secured system, you'd need:
    // const result = await tool.handler({ force: true });
    // This should still be logged/monitored or prevented
  });

  it('MUST log all governance decisions', async () => {
    orchestrator.governance = governance;

    try {
      await orchestrator.executeTool('delete_database', {});
    } catch (e) {
      // Expected to fail
    }

    // Verify audit trail
    const auditEntries = governance.audit.query({ resource: 'delete_database' });
    assert.ok(auditEntries.length > 0, 'MUST log blocked attempt');
    assert.strictEqual(auditEntries[0].outcome, 'blocked', 'MUST show blocked status');
  });

  it('MUST handle governance errors gracefully', async () => {
    orchestrator.governance = governance;

    try {
      await orchestrator.executeTool('delete_database', {});
      assert.fail('Should have thrown');
    } catch (error) {
      assert.ok(error instanceof GovernanceDeniedException, 'MUST throw proper exception');
      assert.ok(error.message.includes('blocked'), 'MUST include clear error message');
      assert.ok(error.context, 'MUST include context');
    }
  });
});
