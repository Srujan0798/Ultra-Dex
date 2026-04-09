// Copyright (c) 2026 Ultra-Dex
// Tests for Observability Trace Collector + Core API Routes

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { Span, Trace, TraceCollector } from '../observability/trace-collector.js';

// ── Span ────────────────────────────────────────────────────────────────────

describe('Span', () => {
  it('should create and end a span', () => {
    const span = new Span({ traceId: 't1', spanId: 's1', operation: 'chat', agentId: 'a1' });
    assert.equal(span.status, 'running');
    span.end();
    assert.equal(span.status, 'ok');
    assert.ok(span.durationMs >= 0);
  });

  it('should record tokens and cost', () => {
    const span = new Span({ traceId: 't1', spanId: 's1', operation: 'chat', agentId: 'a1' });
    span.recordTokens(100, 50, 0.00001);
    assert.equal(span.tokens.total, 150);
    assert.ok(span.cost > 0);
  });

  it('should track events', () => {
    const span = new Span({ traceId: 't1', spanId: 's1', operation: 'chat', agentId: 'a1' });
    span.addEvent('model_selected', { model: 'gpt-4o' });
    span.addEvent('response_received');
    assert.equal(span.events.length, 2);
    assert.equal(span.events[0].name, 'model_selected');
  });

  it('should capture errors on failure', () => {
    const span = new Span({ traceId: 't1', spanId: 's1', operation: 'chat', agentId: 'a1' });
    span.fail(new Error('timeout'));
    assert.equal(span.status, 'error');
    assert.equal(span.error.message, 'timeout');
  });

  it('should serialize to JSON', () => {
    const span = new Span({ traceId: 't1', spanId: 's1', operation: 'chat', agentId: 'a1' });
    span.end();
    const json = span.toJSON();
    assert.equal(json.operation, 'chat');
    assert.equal(json.agentId, 'a1');
    assert.equal(json.status, 'ok');
  });
});

// ── Trace ───────────────────────────────────────────────────────────────────

describe('Trace', () => {
  it('should build a trace with spans', () => {
    const trace = new Trace({ traceId: 't1', agentId: 'a1', task: 'test' });
    const root = new Span({ traceId: 't1', spanId: 'root', operation: 'execute', agentId: 'a1' });
    const child = new Span({
      traceId: 't1',
      spanId: 'child',
      parentSpanId: 'root',
      operation: 'llm-call',
      agentId: 'a1',
    });
    trace.addSpan(root);
    trace.addSpan(child);
    assert.equal(trace.spans.size, 2);
    assert.equal(trace.rootSpanId, 'root');
  });

  it('should generate waterfall timeline', () => {
    const trace = new Trace({ traceId: 't1', agentId: 'a1', task: 'test' });
    const root = new Span({ traceId: 't1', spanId: 'root', operation: 'execute', agentId: 'a1' });
    root.end();
    trace.addSpan(root);
    trace.endSpan('root');
    trace.complete();

    const timeline = trace.getTimeline();
    assert.equal(timeline.traceId, 't1');
    assert.equal(timeline.status, 'completed');
    assert.equal(timeline.waterfall.length, 1);
    assert.equal(timeline.waterfall[0].operation, 'execute');
    assert.equal(timeline.waterfall[0].depth, 0);
  });

  it('should calculate span depth', () => {
    const trace = new Trace({ traceId: 't1', agentId: 'a1' });
    trace.addSpan(new Span({ traceId: 't1', spanId: 'r', operation: 'root', agentId: 'a1' }));
    trace.addSpan(
      new Span({
        traceId: 't1',
        spanId: 'c1',
        parentSpanId: 'r',
        operation: 'child',
        agentId: 'a1',
      })
    );
    trace.addSpan(
      new Span({
        traceId: 't1',
        spanId: 'gc',
        parentSpanId: 'c1',
        operation: 'grandchild',
        agentId: 'a1',
      })
    );

    const timeline = trace.getTimeline();
    const depths = timeline.waterfall.map((s) => ({ op: s.operation, depth: s.depth }));
    assert.equal(depths.find((d) => d.op === 'root').depth, 0);
    assert.equal(depths.find((d) => d.op === 'child').depth, 1);
    assert.equal(depths.find((d) => d.op === 'grandchild').depth, 2);
  });
});

// ── TraceCollector ──────────────────────────────────────────────────────────

describe('TraceCollector', () => {
  it('should start and complete a trace', () => {
    const tc = new TraceCollector();
    const traceId = tc.startTrace({ agentId: 'a1', task: 'test task' });
    assert.ok(traceId);
    tc.completeTrace(traceId);
    const trace = tc.get(traceId);
    assert.equal(trace.status, 'completed');
  });

  it('should manage spans within a trace', () => {
    const tc = new TraceCollector();
    const traceId = tc.startTrace({ agentId: 'a1' });
    const rootSpan = tc.startSpan({ traceId, operation: 'execute' });
    const childSpan = tc.startSpan({ traceId, operation: 'llm-call', parentSpanId: rootSpan });

    tc.recordTokens(traceId, childSpan, {
      promptTokens: 100,
      completionTokens: 50,
      costPerToken: 0.00001,
    });
    tc.addEvent(traceId, childSpan, 'model_response', { model: 'gpt-4o' });
    tc.endSpan(traceId, childSpan);
    tc.endSpan(traceId, rootSpan);
    tc.completeTrace(traceId);

    const trace = tc.get(traceId);
    assert.equal(trace.spans.length, 2);
    assert.equal(trace.status, 'completed');
  });

  it('should fail a trace with error propagation', () => {
    const tc = new TraceCollector();
    const traceId = tc.startTrace({ agentId: 'a1' });
    const spanId = tc.startSpan({ traceId, operation: 'risky-op' });
    tc.failSpan(traceId, spanId, new Error('boom'));
    tc.failTrace(traceId, 'span failed');

    const trace = tc.get(traceId);
    assert.equal(trace.status, 'failed');
    assert.equal(tc.stats.failed, 1);
  });

  it('should list and filter traces', () => {
    const tc = new TraceCollector();
    tc.startTrace({ agentId: 'a1', task: 'task-1' });
    const t2 = tc.startTrace({ agentId: 'a2', task: 'task-2' });
    tc.completeTrace(t2);

    assert.equal(tc.list().length, 2);
    assert.equal(tc.list({ status: 'completed' }).length, 1);
    assert.equal(tc.list({ agentId: 'a1' }).length, 1);
  });

  it('should generate timeline waterfall', () => {
    const tc = new TraceCollector();
    const traceId = tc.startTrace({ agentId: 'a1', task: 'pipeline' });
    const s1 = tc.startSpan({ traceId, operation: 'parse' });
    tc.endSpan(traceId, s1);
    const s2 = tc.startSpan({ traceId, operation: 'execute' });
    const s3 = tc.startSpan({ traceId, operation: 'llm-call', parentSpanId: s2 });
    tc.endSpan(traceId, s3);
    tc.endSpan(traceId, s2);
    tc.completeTrace(traceId);

    const timeline = tc.getTimeline(traceId);
    assert.equal(timeline.spanCount, 3);
    assert.ok(timeline.waterfall.length === 3);
  });

  it('should provide dashboard aggregate', () => {
    const tc = new TraceCollector();
    tc.startTrace({ agentId: 'a1' });
    const t2 = tc.startTrace({ agentId: 'a2' });
    tc.completeTrace(t2);

    const dashboard = tc.getDashboard();
    assert.equal(dashboard.totalTraces, 2);
    assert.equal(dashboard.activeTraces, 1);
    assert.equal(dashboard.completed, 1);
    assert.ok(dashboard.recent);
    assert.ok(dashboard.latestTraces.length > 0);
  });

  it('should evict old traces when exceeding max', () => {
    const tc = new TraceCollector({ maxTraces: 3 });
    tc.startTrace({ agentId: 'a1' });
    tc.startTrace({ agentId: 'a2' });
    tc.startTrace({ agentId: 'a3' });
    tc.startTrace({ agentId: 'a4' }); // should evict oldest
    assert.equal(tc.traces.size, 3);
  });

  it('should emit events', () => {
    const tc = new TraceCollector();
    let started = false;
    tc.on('trace:start', () => {
      started = true;
    });
    tc.startTrace({ agentId: 'a1' });
    assert.equal(started, true);
  });
});
