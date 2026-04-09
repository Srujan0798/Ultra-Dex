// Copyright (c) 2026 Ultra-Dex
import { test, describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ExecutionContext, TaskGraph } from '../../src/core/orchestration/execution-context.js';

describe('TaskGraph', () => {
  let graph;

  beforeEach(() => {
    graph = new TaskGraph();
  });

  it('should add tasks and generate IDs', () => {
    const id = graph.addTask({ title: 'Task 1' });
    assert.ok(id);
    assert.strictEqual(graph.tasks.get(id).title, 'Task 1');
    assert.strictEqual(graph.tasks.get(id).status, 'pending');
  });

  it('should mark tasks as complete', () => {
    const id = graph.addTask({ title: 'Task 1' });
    graph.markComplete(id, { result: 'done' });

    const task = graph.tasks.get(id);
    assert.strictEqual(task.status, 'completed');
    assert.deepStrictEqual(task.result, { result: 'done' });
    assert.ok(task.completedAt);
  });

  it('should return ready tasks when dependencies are met', () => {
    const id1 = graph.addTask({ title: 'Task 1' });
    const id2 = graph.addTask({ title: 'Task 2', dependencies: [id1] });

    // Task 2 should not be ready yet
    let ready = graph.getReadyTasks();
    assert.strictEqual(ready.length, 1);
    assert.strictEqual(ready[0].id, id1);

    // Complete Task 1
    graph.markComplete(id1);

    // Task 2 should now be ready
    ready = graph.getReadyTasks();
    assert.strictEqual(ready.length, 1);
    assert.strictEqual(ready[0].id, id2);
  });

  it('should check for pending tasks', () => {
    const id = graph.addTask({ title: 'Task 1' });
    assert.strictEqual(graph.hasPending(), true);

    graph.markComplete(id);
    assert.strictEqual(graph.hasPending(), false);
  });

  it('should prune completed tasks', async () => {
    const id = graph.addTask({ title: 'Task 1' });
    graph.markComplete(id);

    // Modify completedAt to be old
    graph.tasks.get(id).completedAt = Date.now() - 10000;

    // Prune with 5s age
    graph.prune(5000);
    assert.strictEqual(graph.tasks.has(id), false);
  });
});

describe('ExecutionContext', () => {
  it('should initialize with objective and session ID', () => {
    const context = new ExecutionContext('sid_123', 'Build a website');
    assert.strictEqual(context.sessionId, 'sid_123');
    assert.strictEqual(context.objective, 'Build a website');
    assert.strictEqual(context.status, 'running');
    assert.ok(context.tasks instanceof TaskGraph);
  });

  it('should add tasks to its task graph', () => {
    const context = new ExecutionContext('sid', 'obj');
    const id = context.addTask({ title: 'Subtask' });
    assert.ok(id);
    assert.strictEqual(context.tasks.tasks.get(id).sessionId, 'sid');
  });

  it('should proxy task graph methods', () => {
    const context = new ExecutionContext('sid', 'obj');
    const id = context.addTask({ title: 'Subtask' });

    assert.strictEqual(context.getReadyTasks().length, 1);
    assert.strictEqual(context.hasPendingTasks(), true);

    context.markComplete(id);
    assert.strictEqual(context.hasPendingTasks(), false);
  });
});
