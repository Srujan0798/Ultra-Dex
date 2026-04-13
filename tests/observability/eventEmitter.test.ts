import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter, createEvent } from '../../observability/eventEmitter.js';

describe('EventEmitter', () => {
  it('on() registers handler', () => {
    const ee = new EventEmitter();
    const handler = () => {};
    ee.on('node.dispatch', handler);
    assert.equal(ee.getListenerCount('node.dispatch'), 1);
  });

  it('emit() calls handler with event', () => {
    const ee = new EventEmitter();
    let received: any;
    ee.on('node.dispatch', (e) => { received = e; });
    const event = createEvent('node.dispatch', { foo: 'bar' }, 'node-1', 'wf-1');
    ee.emit(event);
    assert.equal(received.type, 'node.dispatch');
    assert.equal(received.nodeId, 'node-1');
    assert.equal(received.data.foo, 'bar');
  });

  it('off() removes handler', () => {
    const ee = new EventEmitter();
    const handler = () => {};
    ee.on('node.dispatch', handler);
    assert.equal(ee.getListenerCount('node.dispatch'), 1);
    ee.off('node.dispatch', handler);
    assert.equal(ee.getListenerCount('node.dispatch'), 0);
  });

  it('emit() calls all handlers for type', () => {
    const ee = new EventEmitter();
    let count = 0;
    ee.on('node.complete', () => { count++; });
    ee.on('node.complete', () => { count++; });
    ee.on('node.complete', () => { count++; });
    ee.emit(createEvent('node.complete', {}));
    assert.equal(count, 3);
  });

  it('emit() only calls handlers for matching type', () => {
    const ee = new EventEmitter();
    let count = 0;
    ee.on('node.dispatch', () => { count++; });
    ee.on('node.complete', () => { count++; });
    ee.emit(createEvent('node.dispatch', {}));
    assert.equal(count, 1);
  });

  it('getListenerCount() returns correct count', () => {
    const ee = new EventEmitter();
    assert.equal(ee.getListenerCount('node.dispatch'), 0);
    ee.on('node.dispatch', () => {});
    ee.on('node.dispatch', () => {});
    assert.equal(ee.getListenerCount('node.dispatch'), 2);
  });

  it('clear() removes all handlers', () => {
    const ee = new EventEmitter();
    ee.on('node.dispatch', () => {});
    ee.on('node.complete', () => {});
    ee.clear();
    assert.equal(ee.getListenerCount('node.dispatch'), 0);
    assert.equal(ee.getListenerCount('node.complete'), 0);
  });

  it('createEvent() creates properly shaped event', () => {
    const event = createEvent('scheduler.start', { key: 'val' }, 'n1', 'w1');
    assert.equal(event.type, 'scheduler.start');
    assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(event.timestamp));
    assert.equal(event.nodeId, 'n1');
    assert.equal(event.workflowId, 'w1');
    assert.equal(event.data.key, 'val');
  });

  it('multiple event types work independently', () => {
    const ee = new EventEmitter();
    let a = 0, b = 0;
    ee.on('node.dispatch', () => { a++; });
    ee.on('node.failed', () => { b++; });
    ee.emit(createEvent('node.dispatch', {}));
    ee.emit(createEvent('node.dispatch', {}));
    ee.emit(createEvent('node.failed', {}));
    assert.equal(a, 2);
    assert.equal(b, 1);
  });

  it('handler receives full event data', () => {
    const ee = new EventEmitter();
    let captured: any;
    ee.on('workflow.complete', (e) => { captured = e; });
    const event = createEvent('workflow.complete', { nodes: 5, duration: 1000 }, undefined, 'wf-1');
    ee.emit(event);
    assert.equal(captured.type, 'workflow.complete');
    assert.equal(captured.workflowId, 'wf-1');
    assert.equal(captured.data.nodes, 5);
    assert.equal(captured.data.duration, 1000);
  });
});
