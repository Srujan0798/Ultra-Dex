// Copyright (c) 2026 Ultra-Dex
/**
 * Governance Bypass Prevention Tests - FIXED
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { AgentOrchestrator } from '../../src/core/orchestration/index.js';
import { GovernanceManager } from '../../src/core/governance/governance-manager.js';
import { GovernanceDeniedException } from '../../src/core/governance/governance-manager.js';

describe('Governance Bypass Prevention', () => {
  let orchestrator;

  beforeEach(() => {
    orchestrator = new AgentOrchestrator();
    orchestrator.mcpServer = {
      toolsMap: new Map([
        ['delete_database', { handler: async () => 'DELETED' }],
        ['read_file', { handler: async () => 'READ' }]
      ])
    };
  });

  it('executeTool MUST enforce governance (no bypass)', async () => {
    // Block dangerous tool
    orchestrator.governance.policies.addPolicy({
      id: 'block-dangerous',
      condition: (ctx) => ctx.resource !== 'delete_database',
      enforcement: 'block'
    });

    await assert.rejects(
      async () => await orchestrator.executeTool('delete_database', {}),
      GovernanceDeniedException,
      'executeTool MUST enforce governance'
    );
  });

  it('allowed tools MUST execute', async () => {
    const result = await orchestrator.executeTool('read_file', {});
    assert.strictEqual(result, 'READ');
  });

  it('executeTask MUST enforce governance', async () => {
    orchestrator.governance.policies.addPolicy({
      id: 'block-dangerous-tasks',
      condition: (ctx) => !ctx.resource.includes('dangerous'),
      enforcement: 'block'
    });

    await assert.rejects(
      async () => await orchestrator.executeTask('dangerous task', {}),
      GovernanceDeniedException,
      'executeTask MUST enforce governance'
    );
  });

  it('MUST log blocked attempts', async () => {
    orchestrator.governance.policies.addPolicy({
      id: 'block-all',
      condition: () => false,
      enforcement: 'block'
    });

    try {
      await orchestrator.executeTool('delete_database', {});
    } catch (e) {}

    const entries = orchestrator.governance.audit.query({ resource: 'delete_database' });
    assert.ok(entries.length > 0);
    assert.strictEqual(entries[0].outcome, 'blocked');
  });

  it('MUST log successful executions', async () => {
    await orchestrator.executeTool('read_file', {});

    const entries = orchestrator.governance.audit.query({ resource: 'read_file' });
    assert.ok(entries.length > 0);
  });
});
