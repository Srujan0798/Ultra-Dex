import { test } from 'node:test';
import * as assert from 'node:assert';
import { Dispatcher, Verifier } from '../../dexgraph/dispatcher.js';
import { StateMachine } from '../../dexgraph/stateMachine.js';
import { GraphNode } from '../../dexgraph/types.js';
import { ExecutionAdapter, ExecutionContext, ExecutionResult } from '../../adapters/executionAdapter.js';

class MockAdapter implements ExecutionAdapter {
  private delay: number;
  private shouldFail: boolean;
  private shouldTimeout: boolean;

  constructor(options: { delay?: number; shouldFail?: boolean; shouldTimeout?: boolean } = {}) {
    this.delay = options.delay || 10;
    this.shouldFail = options.shouldFail || false;
    this.shouldTimeout = options.shouldTimeout || false;
  }

  async run(context: ExecutionContext): Promise<ExecutionResult> {
    if (this.shouldTimeout) {
      await new Promise(r => setTimeout(r, context.timeout + 100)); // sleep longer than timeout
    } else {
      await new Promise(r => setTimeout(r, this.delay));
    }

    if (this.shouldFail) {
      return {
        status: 'FAILED',
        logs: ['Mock failure'],
        error: 'Intentional failure',
        cost: { tokens: 10, estimatedUSD: 0.001, provider: 'mock' },
        confidence: 0.5,
        duration: this.delay,
        timestamp: new Date().toISOString()
      };
    }

    return {
      status: 'SUCCESS',
      output: { result: 'ok', input: context.input },
      logs: ['Mock success'],
      cost: { tokens: 100, estimatedUSD: 0.01, provider: 'mock' },
      confidence: 0.95,
      duration: this.delay,
      timestamp: new Date().toISOString()
    };
  }

  async cancel(): Promise<void> {}
  async status(): Promise<{ running: boolean; progress?: number }> { return { running: true }; }
  name(): string { return 'MockAdapter'; }
}

class MockVerifier implements Verifier {
  private reject: boolean;
  constructor(reject: boolean = false) {
    this.reject = reject;
  }
  async verify(node: GraphNode, result: ExecutionResult) {
    if (this.reject) {
      return { valid: false, reason: 'Failed verification', confidence: 0.1 };
    }
    return { valid: true };
  }
}

function createNode(id: string): GraphNode {
  return {
    id,
    role: 'engineer',
    instruction: 'test',
    dependencies: [],
    context: { customVar: '123' },
    parallel: false,
    state: 'CREATED',
  };
}

test('Dispatcher', async (t) => {
  await t.test('dispatch() enqueues task and returns promise', async () => {
    const adapter = new MockAdapter();
    const dispatcher = new Dispatcher({ maxConcurrent: 4, adapter });
    const node = createNode('n1');

    const promise = dispatcher.dispatch(node);
    assert.strictEqual(dispatcher.inflightCount(), 1);
    assert.strictEqual(dispatcher.isInflight('n1'), true);

    const result = await promise;
    assert.strictEqual(result.status, 'SUCCESS');
    assert.strictEqual(dispatcher.inflightCount(), 0);
  });

  await t.test('respects maxConcurrent (canDispatch)', () => {
    const adapter = new MockAdapter({ delay: 50 });
    const dispatcher = new Dispatcher({ maxConcurrent: 2, adapter });
    
    assert.strictEqual(dispatcher.canDispatch(), true);
    dispatcher.dispatch(createNode('n1'));
    assert.strictEqual(dispatcher.canDispatch(), true);
    dispatcher.dispatch(createNode('n2'));
    assert.strictEqual(dispatcher.canDispatch(), false);
  });

  await t.test('getResult() returns completed result', async () => {
    const adapter = new MockAdapter();
    const dispatcher = new Dispatcher({ maxConcurrent: 4, adapter });
    const node = createNode('n1');

    await dispatcher.dispatch(node);
    const result = dispatcher.getResult('n1');
    assert.ok(result);
    assert.strictEqual(result.status, 'SUCCESS');
  });

  await t.test('adapter FAILED result propagates error', async () => {
    const adapter = new MockAdapter({ shouldFail: true });
    const dispatcher = new Dispatcher({ maxConcurrent: 4, adapter });
    const result = await dispatcher.dispatch(createNode('n1'));
    
    assert.strictEqual(result.status, 'FAILED');
    assert.strictEqual(result.error, 'Intentional failure');
  });

  await t.test('context includes node input + injected context', async () => {
    const adapter = new MockAdapter();
    const dispatcher = new Dispatcher({ maxConcurrent: 4, adapter });
    const node = createNode('n1');
    const result = await dispatcher.dispatch(node);
    
    const output = result.output as any;
    assert.deepStrictEqual(output.input.context, { customVar: '123' });
    assert.strictEqual(output.input.instruction, 'test');
  });

  await t.test('waitForResult() waits for completion', async () => {
    const adapter = new MockAdapter({ delay: 20 });
    const dispatcher = new Dispatcher({ maxConcurrent: 4, adapter });
    dispatcher.dispatch(createNode('n1'));
    
    const result = await dispatcher.waitForResult('n1');
    assert.strictEqual(result.status, 'SUCCESS');
  });

  await t.test('waitForResult() timeout throws', async () => {
    const adapter = new MockAdapter({ delay: 100 });
    const dispatcher = new Dispatcher({ maxConcurrent: 4, adapter });
    dispatcher.dispatch(createNode('n1'));
    
    await assert.rejects(
      () => dispatcher.waitForResult('n1', 10),
      /Dispatcher timeout/
    );
  });

  await t.test('dispatchWithVerification calls verifier on SUCCESS', async () => {
    const adapter = new MockAdapter();
    const dispatcher = new Dispatcher({ maxConcurrent: 4, adapter });
    const verifier = new MockVerifier(false);
    
    const result = await dispatcher.dispatchWithVerification(createNode('n1'), verifier);
    assert.strictEqual(result.status, 'SUCCESS');
  });

  await t.test('dispatchWithVerification respects verifier rejection', async () => {
    const adapter = new MockAdapter();
    const dispatcher = new Dispatcher({ maxConcurrent: 4, adapter });
    const verifier = new MockVerifier(true);
    
    const result = await dispatcher.dispatchWithVerification(createNode('n1'), verifier);
    assert.strictEqual(result.status, 'FAILED');
    assert.strictEqual(result.error, 'Failed verification');
    assert.strictEqual(result.confidence, 0.1);
  });

  await t.test('handleResult updates state machine on SUCCESS', async () => {
    const adapter = new MockAdapter();
    const dispatcher = new Dispatcher({ maxConcurrent: 4, adapter });
    const sm = new StateMachine();
    const node = createNode('n1');
    sm.transition(node, 'READY');
    sm.transition(node, 'RUNNING');
    
    const result = await adapter.run({
      nodeId: 'n1', taskType: 't', input: {}, timeout: 100
    });

    await dispatcher.handleResult('n1', result, sm, () => node);
    assert.strictEqual(node.state, 'VERIFYING');
  });

  await t.test('handleResult throws on invalid result schema', async () => {
    const dispatcher = new Dispatcher({ maxConcurrent: 4, adapter: new MockAdapter() });
    const sm = new StateMachine();
    const node = createNode('n1');
    
    const badResult = { status: 'SUCCESS' } as ExecutionResult; // missing cost, etc.
    await assert.rejects(
      () => dispatcher.handleResult('n1', badResult, sm, () => node),
      /Invalid result/
    );
  });
});
