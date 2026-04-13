import { test } from 'node:test';
import * as assert from 'node:assert';
import { MockAdapter } from '../../adapters/mockAdapter.js';
import { ExecutionContext } from '../../adapters/executionAdapter.js';

test('MockAdapter', async (t) => {
  const getContext = (id: string): ExecutionContext => ({
    nodeId: id,
    taskType: 'test',
    input: { key: 'value' },
    timeout: 1000
  });

  await t.test('run() succeeds, returns SUCCESS result', async () => {
    const adapter = new MockAdapter(10);
    const result = await adapter.run(getContext('node1'));
    
    assert.strictEqual(result.status, 'SUCCESS');
    assert.deepStrictEqual((result.output as any).input, { key: 'value' });
  });

  await t.test('run() includes all required cost fields', async () => {
    const adapter = new MockAdapter(10);
    const result = await adapter.run(getContext('node2'));
    
    assert.ok(result.cost);
    assert.strictEqual(result.cost.tokens, 100);
    assert.strictEqual(result.cost.estimatedUSD, 0.001);
    assert.strictEqual(result.cost.provider, 'mock');
  });

  await t.test('run() logs are captured', async () => {
    const adapter = new MockAdapter(10);
    const result = await adapter.run(getContext('node3'));
    
    assert.ok(result.logs.length > 0);
    assert.ok(result.logs[0].includes('Mock execution completed'));
  });

  await t.test('run() respects delay', async () => {
    const delay = 50;
    const adapter = new MockAdapter(delay);
    const start = Date.now();
    await adapter.run(getContext('node4'));
    const end = Date.now();
    
    assert.ok(end - start >= delay - 10, `Expected delay ~${delay}ms, got ${end - start}ms`);
  });

  await t.test('run() returns confidence >= 0.9 on success', async () => {
    const adapter = new MockAdapter(10);
    const result = await adapter.run(getContext('node5'));
    
    assert.ok(result.confidence >= 0.9);
  });

  await t.test('cancel(nodeId) removes from tracking', async () => {
    const adapter = new MockAdapter(100);
    const context = getContext('node6');
    
    // Start task but don't await immediately
    const promise = adapter.run(context);
    
    let status = await adapter.status('node6');
    assert.strictEqual(status.running, true);
    
    await adapter.cancel('node6');
    
    status = await adapter.status('node6');
    assert.strictEqual(status.running, false);
    
    await promise; // wait for it to finish
  });

  await t.test('status(nodeId) returns running state', async () => {
    const adapter = new MockAdapter(50);
    const context = getContext('node7');
    
    const promise = adapter.run(context);
    
    const status = await adapter.status('node7');
    assert.strictEqual(status.running, true);
    assert.strictEqual(status.progress, 0);
    
    await promise;
    
    const finalStatus = await adapter.status('node7');
    assert.strictEqual(finalStatus.running, false);
    assert.strictEqual(finalStatus.progress, 100);
  });

  await t.test('MockAdapter with failNodes returns FAILED', async () => {
    const adapter = new MockAdapter(10, ['fail-node']);
    const result = await adapter.run(getContext('fail-node'));
    
    assert.strictEqual(result.status, 'FAILED');
    assert.strictEqual(result.error, 'Intentional failure for testing');
    assert.strictEqual(result.confidence, 0.5);
  });

  await t.test('result is serializable to JSON', async () => {
    const adapter = new MockAdapter(10);
    const result = await adapter.run(getContext('node8'));
    
    const json = JSON.stringify(result);
    const parsed = JSON.parse(json);
    
    assert.strictEqual(parsed.status, 'SUCCESS');
    assert.strictEqual(parsed.cost.tokens, 100);
  });

  await t.test('ExecutionContext is properly passed through', async () => {
    const adapter = new MockAdapter(10);
    const context = getContext('node9');
    context.input = { complex: { nested: true } };
    
    const result = await adapter.run(context);
    assert.deepStrictEqual((result.output as any).input, { complex: { nested: true } });
  });
});
