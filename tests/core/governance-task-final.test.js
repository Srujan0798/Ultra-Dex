import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { AgentOrchestrator } from '../../src/core/orchestration/index.js';
import { GovernanceDeniedException } from '../../src/core/governance/governance-manager.js';

describe('Governance Task Blocking - Final', () => {
  it('MUST block tasks via governance', async () => {
    const orchestrator = new AgentOrchestrator();
    
    // Mock selfHealing
    orchestrator.selfHealing = {
      reportAgentError: mock.fn()
    };
    
    // Add blocking policy
    orchestrator.governance.policies.addPolicy({
      id: 'block-dangerous',
      condition: (ctx) => !ctx.resource.includes('dangerous'),
      enforcement: 'block'
    });

    // Governance should block
    await assert.rejects(
      async () => await orchestrator.executeTask('dangerous task', {}),
      (error) => {
        // Verify it's a governance denial
        assert.ok(error.message.includes('blocked by governance'), 
          `Expected governance block message but got: ${error.message}`);
        return true;
      }
    );
  });

  it('MUST log blocked tasks in audit trail', async () => {
    const orchestrator = new AgentOrchestrator();
    
    orchestrator.selfHealing = {
      reportAgentError: mock.fn()
    };
    
    orchestrator.governance.policies.addPolicy({
      id: 'block-all',
      condition: () => false,
      enforcement: 'block'
    });

    try {
      await orchestrator.executeTask('any task', {});
    } catch (e) {}

    const entries = orchestrator.governance.audit.query({ action: 'executeTask' });
    assert.ok(entries.length > 0, 'MUST have audit entry');
    assert.strictEqual(entries[0].outcome, 'blocked', 'MUST show blocked');
  });
});
