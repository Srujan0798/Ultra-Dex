import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DexGraph } from '../../dexgraph/graph.ts';
import { GraphNode, GraphEdge } from '../../dexgraph/types.ts';
import { GraphError } from '../../dexgraph/parser.ts';
import { parse } from '../../dexgraph/parser.ts';

function makeNode(id: string, deps: string[] = []): GraphNode {
  return {
    id,
    role: 'engineer',
    instruction: `task ${id}`,
    dependencies: deps,
    context: {},
    parallel: false,
    state: 'CREATED',
  };
}

function makeEdge(from: string, to: string): GraphEdge {
  return { from, to };
}

describe('DexGraph Node Registry', () => {
  it('addNode and getNode work', () => {
    const g = new DexGraph();
    const n = makeNode('a');
    g.addNode(n);
    assert.ok(g.hasNode('a'));
    assert.equal(g.getNode('a'), n);
  });

  it('throws on duplicate ID', () => {
    const g = new DexGraph();
    g.addNode(makeNode('a'));
    assert.throws(() => g.addNode(makeNode('a')), GraphError);
  });

  it('throws on getNode for missing ID', () => {
    const g = new DexGraph();
    assert.throws(() => g.getNode('missing'), GraphError);
  });

  it('getAllNodes returns all', () => {
    const g = new DexGraph();
    g.addNode(makeNode('a'));
    g.addNode(makeNode('b'));
    g.addNode(makeNode('c'));
    assert.equal(g.getAllNodes().length, 3);
  });

  it('getNodesByState filters correctly', () => {
    const g = new DexGraph();
    const a = makeNode('a');
    const b = makeNode('b');
    const c = makeNode('c');
    b.state = 'READY';
    c.state = 'READY';
    g.addNode(a);
    g.addNode(b);
    g.addNode(c);
    assert.equal(g.getNodesByState('READY').length, 2);
    assert.equal(g.getNodesByState('CREATED').length, 1);
  });

  it('size returnss correct count', () => {
    const g = new DexGraph();
    assert.equal(g.size, 0);
    g.addNode(makeNode('a'));
    g.addNode(makeNode('b'));
    assert.equal(g.size, 2);
  });
});

describe('DexGraph Edges', () => {
  it('addEdge creates connection', () => {
    const g = new DexGraph();
    g.addNode(makeNode('a'));
    g.addNode(makeNode('b'));
    g.addEdge(makeEdge('a', 'b'));
    assert.deepEqual(g.getEdges(), [{ from: 'a', to: 'b' }]);
  });

  it('throws if source node missing', () => {
    const g = new DexGraph();
    g.addNode(makeNode('b'));
    assert.throws(() => g.addEdge(makeEdge('a', 'b')), GraphError);
  });

  it('throws if target node missing', () => {
    const g = new DexGraph();
    g.addNode(makeNode('a'));
    assert.throws(() => g.addEdge(makeEdge('a', 'b')), GraphError);
  });

  it('getDependencies and getDependents work', () => {
    const g = new DexGraph();
    g.addNode(makeNode('a'));
    g.addNode(makeNode('b'));
    g.addNode(makeNode('c'));
    g.addEdge(makeEdge('a', 'b'));
    g.addEdge(makeEdge('a', 'c'));
    assert.deepEqual(g.getDependencies('b'), ['a']);
    assert.deepEqual(g.getDependents('a'), ['b', 'c']);
  });

  it('getRootNodes returns zero-indegree nodes', () => {
    const g = new DexGraph();
    g.addNode(makeNode('a'));
    g.addNode(makeNode('b', ['a']));
    g.addEdge(makeEdge('a', 'b'));
    const roots = g.getRootNodes();
    assert.equal(roots.length, 1);
    assert.equal(roots[0].id, 'a');
  });

  it('getLeafNodes returns zero-outdegree nodes', () => {
    const g = new DexGraph();
    g.addNode(makeNode('a'));
    g.addNode(makeNode('b', ['a']));
    g.addEdge(makeEdge('a', 'b'));
    const leaves = g.getLeafNodes();
    assert.equal(leaves.length, 1);
    assert.equal(leaves[0].id, 'b');
  });
});

describe('DexGraph Cycle Detection', () => {
  it('detectCycles returns null for DAG', () => {
    const g = new DexGraph();
    g.addNode(makeNode('a'));
    g.addNode(makeNode('b', ['a']));
    g.addNode(makeNode('c', ['b']));
    g.addEdge(makeEdge('a', 'b'));
    g.addEdge(makeEdge('b', 'c'));
    assert.equal(g.detectCycles(), null);
  });

  it('detectCycles finds simple cycle', () => {
    const g = new DexGraph();
    g.addNode(makeNode('a'));
    g.addNode(makeNode('b'));
    g.addNode(makeNode('c'));
    g.addEdge(makeEdge('a', 'b'));
    g.addEdge(makeEdge('b', 'c'));
    g.addEdge(makeEdge('c', 'a'));
    const cycles = g.detectCycles();
    assert.ok(cycles !== null);
    assert.ok(cycles.length > 0);
  });

  it('validateDAG throws on cycle', () => {
    const g = new DexGraph();
    g.addNode(makeNode('a'));
    g.addNode(makeNode('b'));
    g.addEdge(makeEdge('a', 'b'));
    g.addEdge(makeEdge('b', 'a'));
    assert.throws(() => g.validateDAG(), GraphError);
  });

  it('validateDAG passes on valid DAG', () => {
    const g = new DexGraph();
    g.addNode(makeNode('a'));
    g.addNode(makeNode('b'));
    g.addNode(makeNode('c'));
    g.addEdge(makeEdge('a', 'b'));
    g.addEdge(makeEdge('a', 'c'));
    g.addEdge(makeEdge('b', 'c'));
    assert.doesNotThrow(() => g.validateDAG());
  });
});

describe('DexGraph Topological Sort', () => {
  it('returns valid execution order', () => {
    const g = new DexGraph();
    g.addNode(makeNode('a'));
    g.addNode(makeNode('b', ['a']));
    g.addNode(makeNode('c', ['a']));
    g.addNode(makeNode('d', ['b', 'c']));
    g.addEdge(makeEdge('a', 'b'));
    g.addEdge(makeEdge('a', 'c'));
    g.addEdge(makeEdge('b', 'd'));
    g.addEdge(makeEdge('c', 'd'));
    const order = g.topologicalSort();
    assert.equal(order.length, 4);
    assert.equal(order[0], 'a');
    assert.ok(order.indexOf('b') < order.indexOf('d'));
    assert.ok(order.indexOf('c') < order.indexOf('d'));
  });

  it('throws on cyclic graph', () => {
    const g = new DexGraph();
    g.addNode(makeNode('a'));
    g.addNode(makeNode('b'));
    g.addEdge(makeEdge('a', 'b'));
    g.addEdge(makeEdge('b', 'a'));
    assert.throws(() => g.topologicalSort(), GraphError);
  });

  it('single node returns itself', () => {
    const g = new DexGraph();
    g.addNode(makeNode('solo'));
    assert.deepEqual(g.topologicalSort(), ['solo']);
  });
});

describe('DexGraph Integration', () => {
  it('fromParseResult builds graph from parser output', () => {
    const result = parse('examples/simple.dex');
    const g = DexGraph.fromParseResult(result);
    assert.equal(g.size, 5);
    assert.ok(g.hasNode('design-schema'));
    assert.ok(g.hasNode('implement-auth'));
    assert.ok(g.hasNode('code-review'));
  });

  it('fromParseResult validates DAG', () => {
    const result = parse('examples/simple.dex');
    const g = DexGraph.fromParseResult(result);
    assert.doesNotThrow(() => g.validateDAG());
  });

  it('getExecutableNodes returns ready nodes with satisfied deps', () => {
    const result = parse('examples/simple.dex');
    const g = DexGraph.fromParseResult(result);

    // Mark design-schema and setup-project as SUCCESS
    const ds = g.getNode('design-schema');
    const sp = g.getNode('setup-project');
    ds.state = 'SUCCESS';
    sp.state = 'SUCCESS';

    // Mark implement-auth as READY
    const ia = g.getNode('implement-auth');
    ia.state = 'READY';

    const executable = g.getExecutableNodes();
    assert.equal(executable.length, 1);
    assert.equal(executable[0].id, 'implement-auth');
  });
});
