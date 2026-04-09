// Copyright (c) 2026 Ultra-Dex
import { test, describe, it } from 'node:test';
import assert from 'node:assert';
import { RALPHLoop } from '../../src/core/agents/ralph-loop.js';

describe('RALPHLoop', () => {
  it('should execute the full RALPH loop and stop when solution is found', async () => {
    const loop = new RALPHLoop({ maxIterations: 5, feedbackThreshold: 0.8 });

    // Override formHypothesis to simulate finding a solution
    loop.formHypothesis = async (plan, context) => {
      return {
        hypothesis: 'Found it!',
        confidence: 0.9,
        findings: [],
        reasoning: [],
        nextSteps: [],
      };
    };

    const result = await loop.executeRALPHLoop('Test problem');

    assert.strictEqual(result.iterations, 1);
    assert.strictEqual(result.finalHypothesis.confidence, 0.9);
    assert.strictEqual(loop.state, 'completed');
  });

  it('should respect maxIterations', async () => {
    const loop = new RALPHLoop({ maxIterations: 3, feedbackThreshold: 0.99 });

    // Confidence always below threshold
    loop.formHypothesis = async () => ({ confidence: 0.5 });

    const result = await loop.executeRALPHLoop('Never-ending problem');

    assert.strictEqual(result.iterations, 3);
  });

  it('should emit events for each phase', async () => {
    const loop = new RALPHLoop({ maxIterations: 1 });
    const events = [];

    loop.on('ralph.reasoning', () => events.push('reasoning'));
    loop.on('ralph.analysis', () => events.push('analysis'));
    loop.on('ralph.planning', () => events.push('planning'));
    loop.on('ralph.hypothesis', () => events.push('hypothesis'));
    loop.on('ralph.learning', () => events.push('learning'));

    await loop.executeRALPHLoop('Event test');

    assert.deepStrictEqual(events, ['reasoning', 'analysis', 'planning', 'hypothesis', 'learning']);
  });

  it('should handle errors in a phase gracefully', async () => {
    const loop = new RALPHLoop({ maxIterations: 5 });

    loop.reason = async () => {
      throw new Error('Reasoning failed');
    };

    const result = await loop.executeRALPHLoop('Failing problem');

    assert.strictEqual(result.iterations, 1);
    const history = loop.getIterationHistory();
    assert.strictEqual(history[0].error.message, 'Reasoning failed');
  });

  it('should accumulate learnings across iterations', async () => {
    const loop = new RALPHLoop({ maxIterations: 2, feedbackThreshold: 0.9 });
    let learnCount = 0;
    loop.learn = async () => {
      learnCount++;
      return { keyLearnings: [`Learning ${learnCount}`] };
    };

    const result = await loop.executeRALPHLoop('Learning test');

    assert.strictEqual(result.learnings.length, 2);
    assert.deepStrictEqual(result.learnings[0].keyLearnings, ['Learning 1']);
    assert.deepStrictEqual(result.learnings[1].keyLearnings, ['Learning 2']);
  });
});
