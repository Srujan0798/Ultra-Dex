import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import { parse } from '../src/parser.js';
import { DexGraph } from '../src/graph.js';
import { Scheduler } from '../src/scheduler.js';
import { StateMachine } from '../src/stateMachine.js';
import { createVerifier } from '../src/verifier.js';
import { ContextInjector } from '../src/contextInjector.js';

const LINEAR_WORKFLOW = `
version: dexgraph/v1
name: linear-test
description: A->B->C linear test workflow

context:
  env: test

on_failure:
  retry: 1
  rollback: true

tasks:
  - id: plan
    role: architect
    instruction: Plan the system
    output: plan-doc

  - id: build
    role: engineer
    instruction: Build from plan
    depends_on: [plan]
    output: build-artifact

  - id: test
    role: tester
    instruction: Run tests
    depends_on: [build]
    verify:
      type: unit_test
      command: npm test
`;

function writeTmp(name: string, content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dexgraph-test-'));
  const filePath = path.join(dir, `${name}.dex`);
  fs.writeFileSync(filePath, content.trim(), 'utf-8');
  return filePath;
}

describe('DexGraph Package', () => {
  it('parses a workflow YAML into a DexGraphResult', () => {
    const filePath = writeTmp('linear', LINEAR_WORKFLOW);
    const result = parse(filePath);

    assert.equal(result.metadata.name, 'linear-test');
    assert.equal(result.nodes.length, 3);
    assert.ok(result.edges.length >= 2);
  });

  it('builds a DexGraph and detects cycles', () => {
    const filePath = writeTmp('linear', LINEAR_WORKFLOW);
    const parsed = parse(filePath);
    const graph = new DexGraph(parsed);

    assert.deepStrictEqual(graph.getExecutionOrder(), ['plan', 'build', 'test']);
    assert.equal(graph.hasCycles(), false);
  });

  it('schedules tasks in topological order', () => {
    const filePath = writeTmp('linear', LINEAR_WORKFLOW);
    const parsed = parse(filePath);
    const graph = new DexGraph(parsed);
    const scheduler = new Scheduler(graph);

    const batches = scheduler.getBatches();
    assert.equal(batches.length, 3);
    assert.deepStrictEqual(batches[0].map((n) => n.id), ['plan']);
    assert.deepStrictEqual(batches[1].map((n) => n.id), ['build']);
    assert.deepStrictEqual(batches[2].map((n) => n.id), ['test']);
  });

  it('runs state transitions correctly', () => {
    const sm = new StateMachine();
    const node = { id: 'n1', state: 'CREATED' } as any;

    sm.transition(node, 'READY');
    assert.equal(node.state, 'READY');

    sm.transition(node, 'RUNNING');
    assert.equal(node.state, 'RUNNING');

    sm.transition(node, 'SUCCESS');
    assert.equal(node.state, 'SUCCESS');
  });

  it('verifies execution results', () => {
    const verifier = createVerifier();
    const result = {
      status: 'SUCCESS',
      output: { test: true },
      confidence: 0.95,
      duration: 120,
    } as any;

    const v = verifier.verify({ id: 'n1', verification: { type: 'file_exists' } } as any, result);
    assert.equal(v.passed, true);
  });

  it('injects context between nodes', () => {
    const injector = new ContextInjector({ project: 'demo' });
    injector.registerOutput('plan', { architecture: 'microservices' });
    const ctx = injector.buildContext('build', ['plan']);
    assert.equal((ctx as any).project, 'demo');
    assert.deepStrictEqual((ctx as any).inputs.plan, { architecture: 'microservices' });
  });
});
