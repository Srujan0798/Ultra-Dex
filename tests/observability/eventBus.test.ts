import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  EventBus,
  createEventBus,
  getGlobalEventBus,
  now,
  WorkflowStartedEvent,
  TaskCompletedEvent,
  TaskFailedEvent,
} from '../../core/events.js';

function makeWorkflowStarted(overrides: Partial<WorkflowStartedEvent> = {}): WorkflowStartedEvent {
  return {
    type: 'workflow.started',
    workflowId: 'wf-1',
    timestamp: now(),
    totalNodes: 5,
    ...overrides,
  };
}

function makeTaskCompleted(overrides: Partial<TaskCompletedEvent> = {}): TaskCompletedEvent {
  return {
    type: 'task.completed',
    taskId: 'task-1',
    workflowId: 'wf-1',
    timestamp: now(),
    output: { result: 'ok' },
    cost: { tokens: 100, estimatedUSD: 0.01, provider: 'mock' },
    durationMs: 500,
    confidence: 0.95,
    ...overrides,
  };
}

describe('EventBus', () => {
  it('emits event to registered listener', () => {
    const bus = createEventBus();
    let received: WorkflowStartedEvent | undefined;
    bus.on('workflow.started', e => { received = e; });
    const evt = makeWorkflowStarted();
    bus.emit(evt);
    assert.deepStrictEqual(received, evt);
  });

  it('emits event to multiple listeners', () => {
    const bus = createEventBus();
    const calls: string[] = [];
    bus.on('workflow.started', () => calls.push('a'));
    bus.on('workflow.started', () => calls.push('b'));
    bus.emit(makeWorkflowStarted());
    assert.deepStrictEqual(calls, ['a', 'b']);
  });

  it('does not emit to listeners of other event types', () => {
    const bus = createEventBus();
    let called = false;
    bus.on('task.completed', () => { called = true; });
    bus.emit(makeWorkflowStarted());
    assert.strictEqual(called, false);
  });

  it('removes listener with off()', () => {
    const bus = createEventBus();
    let count = 0;
    const listener = () => { count++; };
    bus.on('workflow.started', listener);
    bus.emit(makeWorkflowStarted());
    bus.off('workflow.started', listener);
    bus.emit(makeWorkflowStarted());
    assert.strictEqual(count, 1);
  });

  it('once() fires exactly one time', () => {
    const bus = createEventBus();
    let count = 0;
    bus.once('workflow.started', () => { count++; });
    bus.emit(makeWorkflowStarted());
    bus.emit(makeWorkflowStarted());
    assert.strictEqual(count, 1);
  });

  it('listenerCount returns correct count', () => {
    const bus = createEventBus();
    assert.strictEqual(bus.listenerCount('workflow.started'), 0);
    bus.on('workflow.started', () => {});
    bus.on('workflow.started', () => {});
    assert.strictEqual(bus.listenerCount('workflow.started'), 2);
  });

  it('removeAllListeners clears all handlers', () => {
    const bus = createEventBus();
    bus.on('workflow.started', () => {});
    bus.on('task.completed', () => {});
    bus.removeAllListeners();
    assert.strictEqual(bus.listenerCount('workflow.started'), 0);
    assert.strictEqual(bus.listenerCount('task.completed'), 0);
  });

  it('listener throwing does not propagate error', () => {
    const bus = createEventBus();
    bus.on('workflow.started', () => { throw new Error('crash'); });
    assert.doesNotThrow(() => bus.emit(makeWorkflowStarted()));
  });

  it('event payloads are typed correctly', () => {
    const bus = createEventBus();
    let received: TaskCompletedEvent | undefined;
    bus.on('task.completed', e => { received = e; });
    const evt = makeTaskCompleted();
    bus.emit(evt);
    assert.strictEqual(received?.cost.provider, 'mock');
    assert.strictEqual(received?.confidence, 0.95);
  });

  it('supports chaining with on()', () => {
    const bus = createEventBus();
    const result = bus.on('workflow.started', () => {});
    assert.strictEqual(result, bus);
  });
});

describe('getGlobalEventBus', () => {
  it('returns the same instance on multiple calls', () => {
    const a = getGlobalEventBus();
    const b = getGlobalEventBus();
    assert.strictEqual(a, b);
  });

  it('is an EventBus instance', () => {
    assert.ok(getGlobalEventBus() instanceof EventBus);
  });
});

describe('createEventBus', () => {
  it('returns a fresh bus each time', () => {
    const a = createEventBus();
    const b = createEventBus();
    assert.notStrictEqual(a, b);
  });
});

describe('now() helper', () => {
  it('returns ISO string', () => {
    const n = now();
    assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(n));
    assert.doesNotThrow(() => new Date(n));
  });
});

describe('Event type coverage', () => {
  it('task.started fires and has correct shape', () => {
    const bus = createEventBus();
    let count = 0;
    bus.on('task.started', e => {
      assert.strictEqual(e.type, 'task.started');
      assert.ok(e.taskId);
      assert.ok(e.workflowId);
      count++;
    });
    bus.emit({ type: 'task.started', taskId: 't1', workflowId: 'wf1', timestamp: now(), agentType: 'engineer' });
    assert.strictEqual(count, 1);
  });

  it('task.failed fires and has correct shape', () => {
    const bus = createEventBus();
    let received: TaskFailedEvent | undefined;
    bus.on('task.failed', e => { received = e; });
    bus.emit({
      type: 'task.failed', taskId: 't1', workflowId: 'wf1',
      timestamp: now(), error: 'err', reason: 'timeout', retryCount: 2,
    });
    assert.strictEqual(received?.retryCount, 2);
  });

  it('workflow.completed fires with status and cost', () => {
    const bus = createEventBus();
    let called = false;
    bus.on('workflow.completed', e => {
      assert.ok(['SUCCESS', 'FAILED', 'PARTIAL'].includes(e.status));
      called = true;
    });
    bus.emit({
      type: 'workflow.completed', workflowId: 'wf1', timestamp: now(),
      status: 'SUCCESS', totalCost: { tokens: 100, estimatedUSD: 0.01, provider: 'mock' },
      durationMs: 1000, completedNodes: ['a', 'b'], failedNodes: [],
    });
    assert.strictEqual(called, true);
  });

  it('state.transition event fires', () => {
    const bus = createEventBus();
    let called = false;
    bus.on('state.transition', e => {
      assert.strictEqual(e.from, 'READY');
      assert.strictEqual(e.to, 'RUNNING');
      called = true;
    });
    bus.emit({
      type: 'state.transition', nodeId: 'n1',
      timestamp: now(), from: 'READY', to: 'RUNNING',
    });
    assert.strictEqual(called, true);
  });
});
