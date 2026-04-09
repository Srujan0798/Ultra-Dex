import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { RALPHLoop } from '../../src/core/agents/ralph-loop.js';
import { SelfHealingOrchestrator } from '../../src/core/reliability/self-healing.js';
import { AgentAutopsy } from '../../src/core/reliability/agent-autopsy.js';
import { AgentOrchestrator } from './orchestrator-minimal.js';

describe('Reliability integration', () => {
  it('emits recovery diagnostics when self-healing handles a RALPH iteration failure', async () => {
    const selfHealing = new SelfHealingOrchestrator();
    const loop = new RALPHLoop({
      maxIterations: 3,
      selfHealing,
    });
    const recoveryEvents = [];

    loop.reason = async () => {
      throw new Error('Reasoning failed');
    };
    loop.on('agent.recovery', (event) => recoveryEvents.push(event));

    const result = await loop.executeRALPHLoop('Failing problem');
    const history = loop.getIterationHistory();

    assert.strictEqual(result.iterations, 1);
    assert.strictEqual(recoveryEvents.length, 1);
    assert.strictEqual(recoveryEvents[0].phase, 'reasoning');
    assert.strictEqual(recoveryEvents[0].recovery.strategy, 'retry');
    assert.strictEqual(recoveryEvents[0].recovery.diagnostics.circuitState.failures, 1);
    assert.strictEqual(history[0].error.message, 'Reasoning failed');
    assert.strictEqual(history[0].recovery.strategy, 'retry');
    assert.strictEqual(history[0].recovery.diagnostics.phase, 'reasoning');
  });

  it('stores autopsy reports in the governance audit trail when task execution fails', async () => {
    const auditRecords = [];
    const selfHealingCalls = [];
    const autopsyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ultra-dex-autopsy-'));
    const autopsy = new AgentAutopsy({
      logPath: autopsyDir,
      logger: { log() {} },
    });

    const orchestrator = new AgentOrchestrator({
      ai: {
        async call() {
          throw new Error('sql query failed');
        },
      },
      autopsy,
      selfHealing: {
        async reportAgentError(agentId, error, details) {
          selfHealingCalls.push({ agentId, error: error.message, details });
        },
      },
    });

    orchestrator.memory = {
      async init() {
        return true;
      },
      async search() {
        return [];
      },
      async add() {
        return true;
      },
    };
    orchestrator.governance = {
      async gate() {
        return { allowed: true };
      },
      audit: {
        async record(entry) {
          auditRecords.push(entry);
        },
      },
    };

    const autopsyEvents = [];
    orchestrator.on('task:autopsy', (event) => autopsyEvents.push(event));

    await assert.rejects(
      () =>
        orchestrator.executeTask('Investigate failed query', {
          agentId: 'db-agent',
          taskType: 'analysis',
        }),
      /sql query failed/
    );

    const autopsyRecord = auditRecords.find((entry) => entry.action === 'task_autopsy');
    const failureRecord = auditRecords.find(
      (entry) => entry.action === 'task_execution' && entry.result === 'failure'
    );

    assert.ok(autopsyRecord, 'Expected a task_autopsy audit record');
    assert.ok(failureRecord, 'Expected a failed task_execution audit record');
    assert.strictEqual(autopsyEvents.length, 1);
    assert.strictEqual(autopsyEvents[0].agentId, 'db-agent');
    assert.strictEqual(autopsyRecord.agentId, 'db-agent');
    assert.strictEqual(autopsyRecord.details.autopsy.analysis.type, 'database');
    assert.strictEqual(failureRecord.details.autopsyId, autopsyRecord.details.autopsy.id);
    assert.strictEqual(selfHealingCalls.length, 1);
    assert.strictEqual(selfHealingCalls[0].agentId, 'db-agent');

    fs.rmSync(autopsyDir, { recursive: true, force: true });
  });
});
