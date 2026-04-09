import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { projectGraph } from '../lib/mcp/graph.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('Graph Integrity & Optimization', () => {
  let tmpDir;
  let originalCwd;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-graph-integrity-'));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
    projectGraph.clearCache();
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tmpDir, { recursive: true, force: true });
    projectGraph.clearCache();
  });

  test('Orphaned Nodes: Deleting a file removes incoming edges', async () => {
    // Setup: A -> B
    await fs.writeFile('a.js', 'import "./b.js";');
    await fs.writeFile('b.js', 'export const x = 1;');

    // Initial scan
    await projectGraph.scan(false);

    // Verify initial state
    // Note: scan resolves paths relative to CWD.
    // 'a.js' might be stored as 'a.js' or absolute path depending on implementation.
    // Logic in scan uses relative paths for edges if import starts with '.'
    // "newEdges.push({ from: filePath, to: relativeResolved, ... });"

    // Let's inspect nodes to be sure of keys
    // console.log('Nodes:', Array.from(projectGraph.nodes.keys()));

    // Find edge A->B
    // Since we are in tmpDir, files are 'a.js' and 'b.js'.
    // Import "./b.js" should resolve to "b.js"

    const edge = projectGraph.edges.find((e) => e.from === 'a.js' && e.to === 'b.js');
    assert.ok(edge, 'Edge A->B should exist');

    // Delete B
    await fs.unlink('b.js');

    // Rescan
    await projectGraph.scan(false);

    // Verify B is gone
    assert.ok(!projectGraph.nodes.has('b.js'), 'Node b.js should be removed');

    // Verify edge is gone (orphaned node fix)
    const dangling = projectGraph.edges.find((e) => e.to === 'b.js');
    assert.equal(dangling, undefined, 'Dangling edge to b.js should be removed');
  });

  test('Cycle Detection: Detects simple A <-> B cycle', async () => {
    // Manually inject cycle
    projectGraph.nodes.set('cycle_a.js', { id: 'cycle_a.js' });
    projectGraph.nodes.set('cycle_b.js', { id: 'cycle_b.js' });

    projectGraph.edges.push({ from: 'cycle_a.js', to: 'cycle_b.js', type: 'depends_on' });
    projectGraph.edges.push({ from: 'cycle_b.js', to: 'cycle_a.js', type: 'depends_on' });

    // Force rebuild index just in case (though cycle detection builds its own adjacency map currently)
    projectGraph._rebuildIndex();

    const cycles = await projectGraph.findCircularDependencies();
    assert.ok(cycles.length > 0, 'Should detect cycle');

    // Check if cycle contains both nodes
    const cycle = cycles.find((c) => c.includes('cycle_a.js') && c.includes('cycle_b.js'));
    assert.ok(cycle, 'Cycle should contain both nodes');
  });

  test('Performance Index: findReferences uses optimized index', async () => {
    // Setup: A -> B, C -> B
    projectGraph.nodes.set('idx_a.js', { id: 'idx_a.js' });
    projectGraph.nodes.set('idx_b.js', { id: 'idx_b.js' });
    projectGraph.nodes.set('idx_c.js', { id: 'idx_c.js' });

    const edge1 = { from: 'idx_a.js', to: 'idx_b.js', type: 'depends_on' };
    const edge2 = { from: 'idx_c.js', to: 'idx_b.js', type: 'depends_on' };

    projectGraph.edges.push(edge1, edge2);
    projectGraph._rebuildIndex();

    // Verify index population
    assert.ok(projectGraph.incomingEdges.has('idx_b.js'), 'Index should have idx_b.js');
    assert.equal(
      projectGraph.incomingEdges.get('idx_b.js').length,
      2,
      'Index should have 2 edges for idx_b.js'
    );

    // Verify findReferences
    const refs = projectGraph.findReferences('idx_b.js');
    assert.equal(refs.length, 2);
    assert.ok(refs.includes(edge1));
    assert.ok(refs.includes(edge2));
  });
});
