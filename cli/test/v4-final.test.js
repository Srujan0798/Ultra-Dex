import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import { context } from '../lib/kernel/context.js';
import { projectGraph } from '../lib/mcp/graph.js';

test('Context: tech stack detection', async () => {
  // We can't easily mock the entire filesystem for ContextScanner without complex dependency injection
  // but we can test the logic if we point it to a controlled dir.
  // For now, test the singleton's existing state from the current project.
  const ctx = await context.scan();
  assert.ok(ctx.dependencies['commander']);
  assert.ok(ctx.stack.includes('Node'));
});

test('Graph: complex impact chains', async () => {
  projectGraph.clearCache();
  projectGraph.edges = [
    { from: 'leaf.js', to: 'middle.js', type: 'depends_on' },
    { from: 'middle.js', to: 'root.js', type: 'depends_on' },
    { from: 'another-leaf.js', to: 'middle.js', type: 'depends_on' },
    { from: 'unrelated.js', to: 'other.js', type: 'depends_on' },
  ];

  const impact = projectGraph.getImpact('root.js');
  // root.js <- middle.js <- leaf.js
  // root.js <- middle.js <- another-leaf.js
  assert.ok(impact.includes('middle.js'));
  assert.ok(impact.includes('leaf.js'));
  assert.ok(impact.includes('another-leaf.js'));
  assert.strictEqual(impact.length, 3);
  assert.ok(!impact.includes('unrelated.js'));
});

test('Graph: circular dependency impact', async () => {
  projectGraph.clearCache();
  projectGraph.edges = [
    { from: 'A.js', to: 'B.js', type: 'depends_on' },
    { from: 'B.js', to: 'A.js', type: 'depends_on' },
    { from: 'C.js', to: 'A.js', type: 'depends_on' },
  ];

  const impact = projectGraph.getImpact('A.js');
  assert.ok(impact.includes('B.js'));
  assert.ok(impact.includes('C.js'));
  assert.strictEqual(impact.length, 2);
});
