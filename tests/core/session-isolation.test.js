// Copyright (c) 2026 Ultra-Dex
import assert from 'node:assert';
import { describe, test } from 'node:test';
import { AgentOrchestrator } from '../../src/core/orchestration/index.js';

describe('Session-isolated TaskGraph execution', () => {
  test('executeNexus creates an isolated ExecutionContext per concurrent session', async () => {
    const startedContexts = [];
    const releaseByObjective = new Map();

    const orchestrator = new AgentOrchestrator({
      nexusExecutor: async (objective, options, runtimeOrchestrator, executionContext) => {
        startedContexts.push(executionContext);

        const taskId = executionContext.taskGraph.addTask({
          id: `${objective}-task`,
          task: `Work on ${objective}`,
          objective,
        });

        executionContext.steps.push({ id: taskId, task: `Work on ${objective}` });

        await new Promise((resolve) => {
          releaseByObjective.set(objective, resolve);
        });

        assert.strictEqual(runtimeOrchestrator.activeSessions.has(executionContext.sessionId), true);
        executionContext.taskGraph.markComplete(taskId);

        return {
          objective,
          sessionId: executionContext.sessionId,
          taskIds: Array.from(executionContext.taskGraph.tasks.keys()),
          taskObjectives: Array.from(executionContext.taskGraph.tasks.values()).map((task) => task.objective),
        };
      },
    });

    orchestrator.memory = { init: async () => {} };

    const firstRun = orchestrator.executeNexus('alpha-objective');
    const secondRun = orchestrator.executeNexus('beta-objective');

    await new Promise((resolve) => setTimeout(resolve, 25));

    assert.strictEqual(startedContexts.length, 2);
    assert.notStrictEqual(startedContexts[0], startedContexts[1]);
    assert.notStrictEqual(startedContexts[0].taskGraph, startedContexts[1].taskGraph);
    assert.deepStrictEqual(
      startedContexts.map((ctx) => ctx.objective).sort(),
      ['alpha-objective', 'beta-objective']
    );
    assert.strictEqual(orchestrator.getActiveSessions().length, 2);

    releaseByObjective.get('alpha-objective')();
    releaseByObjective.get('beta-objective')();

    const [alphaResult, betaResult] = await Promise.all([firstRun, secondRun]);

    assert.deepStrictEqual(alphaResult.taskIds, ['alpha-objective-task']);
    assert.deepStrictEqual(betaResult.taskIds, ['beta-objective-task']);
    assert.deepStrictEqual(alphaResult.taskObjectives, ['alpha-objective']);
    assert.deepStrictEqual(betaResult.taskObjectives, ['beta-objective']);
    assert.notStrictEqual(alphaResult.sessionId, betaResult.sessionId);
    assert.strictEqual(orchestrator.getActiveSessions().length, 0);
  });
});
