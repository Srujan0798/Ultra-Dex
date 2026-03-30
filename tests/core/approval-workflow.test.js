import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ApprovalWorkflow, APPROVAL_STATUS } from '../../src/core/governance/approval-workflow.js';

describe('ApprovalWorkflow', () => {
  let workflow;

  beforeEach(() => {
    workflow = new ApprovalWorkflow();
    workflow.definePolicy('deploy-prod', {
      steps: [
        { name: 'QA Review', approvers: ['qa-lead'] },
        { name: 'CTO Sign-off', approvers: ['cto'] }
      ]
    });
  });

  it('should create a request with correct steps', async () => {
    const req = await workflow.createRequest('deploy-prod', 'dev-1');
    assert.strictEqual(req.status, APPROVAL_STATUS.PENDING);
    assert.strictEqual(req.steps.length, 2);
    assert.strictEqual(req.steps[0].name, 'QA Review');
  });

  it('should advance step on approval', async () => {
    const req = await workflow.createRequest('deploy-prod', 'dev-1');

    // Step 1: QA Review
    await workflow.submitDecision(req.id, 'qa-lead', 'approve', 'Looks good');

    assert.strictEqual(req.steps[0].status, APPROVAL_STATUS.APPROVED);
    assert.strictEqual(req.currentStep, 1); // Advanced to next step
    assert.strictEqual(req.status, APPROVAL_STATUS.PENDING); // Workflow still pending
  });

  it('should complete workflow when all steps approved', async () => {
    const req = await workflow.createRequest('deploy-prod', 'dev-1');

    await workflow.submitDecision(req.id, 'qa-lead', 'approve');
    await workflow.submitDecision(req.id, 'cto', 'approve');

    assert.strictEqual(req.status, APPROVAL_STATUS.APPROVED);
  });

  it('should reject workflow immediately on rejection', async () => {
    const req = await workflow.createRequest('deploy-prod', 'dev-1');

    await workflow.submitDecision(req.id, 'qa-lead', 'reject', 'Bugs found');

    assert.strictEqual(req.status, APPROVAL_STATUS.REJECTED);
    assert.strictEqual(req.steps[0].status, APPROVAL_STATUS.REJECTED);
  });
});
