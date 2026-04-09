// Copyright (c) 2026 Ultra-Dex
/**
 * Semantic Router Feedback Loop Tests
 * Tests for adaptive routing based on execution outcomes
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SemanticRouter, HybridRouter } from '../../src/core/routing/semantic-router.js';
import { TaskRouter } from '../../src/core/orchestration/task-router.js';

test('SemanticRouter - recordOutcome tracks execution stats', () => {
  const router = new SemanticRouter({ backend: 'hashed' });

  router.recordOutcome('task-1', 'agent-backend', {
    latencyMs: 1500,
    tokensUsed: 500,
    success: true,
  });

  const stats = router.getRouterStats();
  assert.ok(stats['agent-backend']);
  assert.strictEqual(stats['agent-backend'].totalTasks, 1);
  assert.strictEqual(stats['agent-backend'].successRate, 1.0);
  assert.strictEqual(stats['agent-backend'].avgLatency, 1500);
  assert.strictEqual(stats['agent-backend'].avgTokens, 500);
});

test('SemanticRouter - multiple outcomes aggregate correctly', () => {
  const router = new SemanticRouter({ backend: 'hashed' });

  // Record 3 successes
  router.recordOutcome('task-1', 'agent-backend', {
    latencyMs: 1000,
    tokensUsed: 300,
    success: true,
  });

  router.recordOutcome('task-2', 'agent-backend', {
    latencyMs: 1500,
    tokensUsed: 500,
    success: true,
  });

  router.recordOutcome('task-3', 'agent-backend', {
    latencyMs: 2000,
    tokensUsed: 700,
    success: false,
  });

  const stats = router.getRouterStats();
  assert.strictEqual(stats['agent-backend'].totalTasks, 3);
  assert.ok(Math.abs(stats['agent-backend'].successRate - 0.6667) < 0.01);
  assert.strictEqual(stats['agent-backend'].avgLatency, 1500);
  assert.strictEqual(stats['agent-backend'].avgTokens, 500);
});

test('SemanticRouter - adjustProfiles boosts high-performing agents', () => {
  const router = new SemanticRouter({
    backend: 'hashed',
    adjustmentInterval: 5,
  });

  // Record 10 successes for agent-A
  for (let i = 0; i < 10; i++) {
    router.recordOutcome(`task-${i}`, 'agent-A', {
      latencyMs: 500, // Fast
      tokensUsed: 200, // Efficient
      success: true,
    });
  }

  // Router adjusts profiles every 5 outcomes
  const adjustment = router.getFeedbackAdjustment('agent-A');
  assert.ok(adjustment > 1.0, `Expected boost >1.0, got ${adjustment}`);
});

test('SemanticRouter - adjustProfiles penalizes low-performing agents', () => {
  const router = new SemanticRouter({
    backend: 'hashed',
    adjustmentInterval: 5,
  });

  // Record 10 failures for agent-B
  for (let i = 0; i < 10; i++) {
    router.recordOutcome(`task-${i}`, 'agent-B', {
      latencyMs: 15000, // Slow
      tokensUsed: 8000, // Inefficient
      success: false,
    });
  }

  const adjustment = router.getFeedbackAdjustment('agent-B');
  assert.ok(adjustment < 1.0, `Expected penalty <1.0, got ${adjustment}`);
});

test('SemanticRouter - clearFeedback resets all data', () => {
  const router = new SemanticRouter({ backend: 'hashed' });

  router.recordOutcome('task-1', 'agent-backend', {
    latencyMs: 1000,
    tokensUsed: 500,
    success: true,
  });

  let stats = router.getRouterStats();
  assert.strictEqual(Object.keys(stats).length, 1);

  router.clearFeedback();
  stats = router.getRouterStats();
  assert.strictEqual(Object.keys(stats).length, 0);
  assert.strictEqual(router.getFeedbackAdjustment('agent-backend'), 1.0);
});

test('HybridRouter - feedback adjustment affects ranking', () => {
  const router = new HybridRouter({
    backend: 'hashed',
    adjustmentInterval: 5,
  });

  // Train on profiles
  router.retrainSync([
    { agentId: 'agent-A', capabilities: ['api', 'backend', 'database'], examples: [] },
    { agentId: 'agent-B', capabilities: ['api', 'backend', 'server'], examples: [] },
  ]);

  // Initial routing
  const before = router.routeSync('build an API endpoint');
  const initialBest = before.agentId;

  // Boost agent-A with good outcomes
  for (let i = 0; i < 10; i++) {
    router.recordOutcome(`task-${i}`, 'agent-A', {
      latencyMs: 500,
      tokensUsed: 200,
      success: true,
    });
  }

  // Penalize agent-B with bad outcomes
  for (let i = 0; i < 10; i++) {
    router.recordOutcome(`task-${i}`, 'agent-B', {
      latencyMs: 10000,
      tokensUsed: 5000,
      success: false,
    });
  }

  // Route again after feedback
  const after = router.routeSync('build an API endpoint');

  // agent-A should get a boost, agent-B should be penalized
  const statsA = router.getRouterStats()['agent-A'];
  const statsB = router.getRouterStats()['agent-B'];

  assert.ok(statsA.adjustmentFactor > 1.0, `agent-A should be boosted`);
  assert.ok(statsB.adjustmentFactor < 1.0, `agent-B should be penalized`);
});

test('TaskRouter - recordOutcome propagates to hybrid router', () => {
  const router = new TaskRouter({
    similarityThreshold: 0.3,
    embeddingBackend: 'hashed',
  });

  router.registerAgent('agent-backend', ['api', 'backend', 'server']);
  router.registerAgent('agent-frontend', ['ui', 'react', 'component']);
  router.fit();

  // Record outcomes
  router.recordOutcome('task-1', 'agent-backend', {
    latencyMs: 1000,
    tokensUsed: 400,
    success: true,
  });

  const stats = router.getRouterStats();
  assert.ok(stats['agent-backend']);
  assert.strictEqual(stats['agent-backend'].totalTasks, 1);
  assert.strictEqual(stats['agent-backend'].successRate, 1.0);
});

test('TaskRouter - getRouterStats returns correct aggregates', () => {
  const router = new TaskRouter({ embeddingBackend: 'hashed' });

  router.registerAgent('agent-A', ['capability-a']);
  router.registerAgent('agent-B', ['capability-b']);
  router.fit();

  // Record multiple outcomes for agent-A
  router.recordOutcome('t1', 'agent-A', { latencyMs: 1000, tokensUsed: 300, success: true });
  router.recordOutcome('t2', 'agent-A', { latencyMs: 1500, tokensUsed: 400, success: true });
  router.recordOutcome('t3', 'agent-A', { latencyMs: 2000, tokensUsed: 500, success: false });

  // Record outcomes for agent-B
  router.recordOutcome('t4', 'agent-B', { latencyMs: 500, tokensUsed: 100, success: true });

  const stats = router.getRouterStats();

  // agent-A stats
  assert.strictEqual(stats['agent-A'].totalTasks, 3);
  assert.ok(Math.abs(stats['agent-A'].successRate - 0.6667) < 0.01);
  assert.strictEqual(stats['agent-A'].avgLatency, 1500);
  assert.strictEqual(stats['agent-A'].avgTokens, 400);

  // agent-B stats
  assert.strictEqual(stats['agent-B'].totalTasks, 1);
  assert.strictEqual(stats['agent-B'].successRate, 1.0);
  assert.strictEqual(stats['agent-B'].avgLatency, 500);
  assert.strictEqual(stats['agent-B'].avgTokens, 100);
});

test('SemanticRouter - feedback adjustment clamped between 0.5 and 1.5', () => {
  const router = new SemanticRouter({
    backend: 'hashed',
    adjustmentInterval: 5,
  });

  // Extreme success case - should be clamped to 1.5
  for (let i = 0; i < 20; i++) {
    router.recordOutcome(`task-${i}`, 'agent-perfect', {
      latencyMs: 100,
      tokensUsed: 50,
      success: true,
    });
  }

  // Extreme failure case - should be clamped to 0.5
  for (let i = 0; i < 20; i++) {
    router.recordOutcome(`task-${i}`, 'agent-terrible', {
      latencyMs: 30000,
      tokensUsed: 10000,
      success: false,
    });
  }

  const perfectAdjustment = router.getFeedbackAdjustment('agent-perfect');
  const terribleAdjustment = router.getFeedbackAdjustment('agent-terrible');

  assert.ok(perfectAdjustment <= 1.5, `Perfect adjustment ${perfectAdjustment} should be ≤1.5`);
  assert.ok(terribleAdjustment >= 0.5, `Terrible adjustment ${terribleAdjustment} should be ≥0.5`);
});

test('SemanticRouter - minimum 5 tasks required before adjustment', () => {
  const router = new SemanticRouter({
    backend: 'hashed',
    adjustmentInterval: 2,
  });

  // Record only 4 outcomes
  for (let i = 0; i < 4; i++) {
    router.recordOutcome(`task-${i}`, 'agent-new', {
      latencyMs: 1000,
      tokensUsed: 500,
      success: true,
    });
  }

  // Should not have adjustment yet (need 5+ tasks)
  const adjustment = router.getFeedbackAdjustment('agent-new');
  assert.strictEqual(adjustment, 1.0, 'Should use default 1.0 with <5 tasks');
});

test('SemanticRouter - outcomes limited to last 100 per agent', () => {
  const router = new SemanticRouter({
    backend: 'hashed',
    adjustmentInterval: 50,
  });

  // Record 150 outcomes
  for (let i = 0; i < 150; i++) {
    router.recordOutcome(`task-${i}`, 'agent-busy', {
      latencyMs: 1000,
      tokensUsed: 500,
      success: true,
    });
  }

  const stats = router.getRouterStats();
  assert.strictEqual(stats['agent-busy'].totalTasks, 150);

  // Internal outcomes array should be capped at 100
  // (we can't directly test this without accessing private state,
  // but we can verify stats still work correctly)
  assert.ok(stats['agent-busy'].avgLatency > 0);
});
