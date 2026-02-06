/**
 * Tests for Semantic Knowledge Graph
 *
 * Critical RAG module - ensures accurate code relationship modeling
 */

import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { SemanticKnowledgeGraph } from '../../lib/graph/semantic-graph.js';

describe('SemanticKnowledgeGraph - Initialization', () => {
  let graph;

  beforeEach(() => {
    graph = new SemanticKnowledgeGraph({ backend: 'memory' });
  });

  test('should initialize with memory backend', () => {
    assert.strictEqual(graph.backend, 'memory');
    assert.ok(graph.nodes instanceof Map);
    assert.ok(Array.isArray(graph.edges));
    assert.ok(graph.embeddings instanceof Map);
  });

  test('should initialize with custom backend', () => {
    const neo4jGraph = new SemanticKnowledgeGraph({
      backend: 'neo4j',
      connectionString: 'bolt://localhost:7687',
    });

    assert.strictEqual(neo4jGraph.backend, 'neo4j');
    assert.strictEqual(neo4jGraph.connectionString, 'bolt://localhost:7687');
  });

  test('should start with empty graph', () => {
    assert.strictEqual(graph.nodes.size, 0);
    assert.strictEqual(graph.edges.length, 0);
  });
});

describe('SemanticKnowledgeGraph - Add Semantic Node', () => {
  let graph;

  beforeEach(() => {
    graph = new SemanticKnowledgeGraph();
  });

  test('should add node with basic properties', () => {
    const node = graph.addSemanticNode('test-1', {
      type: 'file',
      name: 'test.js',
      path: '/src/test.js',
      content: 'function test() {}',
    });

    assert.strictEqual(node.id, 'test-1');
    assert.strictEqual(node.type, 'file');
    assert.strictEqual(node.name, 'test.js');
    assert.strictEqual(node.path, '/src/test.js');
  });

  test('should extract concepts from content', () => {
    const node = graph.addSemanticNode('auth-1', {
      name: 'auth.js',
      content: 'function login(username, password) { const token = generateJWT(); }',
    });

    assert.ok(node.concepts.includes('auth'));
  });

  test('should infer domain from path', () => {
    const frontendNode = graph.addSemanticNode('comp-1', {
      name: 'Button.jsx',
      path: '/src/components/Button.jsx',
    });

    assert.strictEqual(frontendNode.domain, 'frontend');

    const backendNode = graph.addSemanticNode('api-1', {
      name: 'users.js',
      path: '/api/users.js',
    });

    assert.strictEqual(backendNode.domain, 'backend');
  });

  test('should calculate complexity', () => {
    const simpleNode = graph.addSemanticNode('simple', {
      name: 'util.js',
      loc: 50,
      imports: ['lodash'],
      exports: ['helper'],
    });

    assert.ok(simpleNode.complexity >= 1);
    assert.ok(simpleNode.complexity <= 5);

    const complexNode = graph.addSemanticNode('complex', {
      name: 'service.js',
      loc: 500,
      imports: Array(15).fill('dep'),
      exports: Array(5).fill('func'),
    });

    assert.ok(complexNode.complexity >= 4);
  });

  test('should truncate long content', () => {
    const longContent = 'x'.repeat(2000);
    const node = graph.addSemanticNode('long', {
      name: 'big.js',
      content: longContent,
    });

    assert.ok(node.content.length <= 1000);
  });

  test('should handle node without content', () => {
    const node = graph.addSemanticNode('empty', {
      name: 'empty.js',
      path: '/src/empty.js',
    });

    assert.ok(node);
    assert.strictEqual(node.id, 'empty');
  });

  test('should store node in graph', () => {
    graph.addSemanticNode('stored', { name: 'test.js' });

    assert.strictEqual(graph.nodes.size, 1);
    assert.ok(graph.nodes.has('stored'));
  });
});

describe('SemanticKnowledgeGraph - Extract Concepts', () => {
  let graph;

  beforeEach(() => {
    graph = new SemanticKnowledgeGraph();
  });

  test('should extract auth concepts', () => {
    const node = { content: 'login session password token jwt authenticate' };
    const concepts = graph.extractConcepts(node);

    assert.ok(concepts.includes('auth'));
  });

  test('should extract payment concepts', () => {
    const node = { content: 'stripe payment billing subscription checkout' };
    const concepts = graph.extractConcepts(node);

    assert.ok(concepts.includes('payment'));
  });

  test('should extract database concepts', () => {
    const node = { content: 'prisma db query model schema migration' };
    const concepts = graph.extractConcepts(node);

    assert.ok(concepts.includes('database'));
  });

  test('should extract API concepts', () => {
    const node = { content: 'api endpoint route handler controller' };
    const concepts = graph.extractConcepts(node);

    assert.ok(concepts.includes('api'));
  });

  test('should extract UI concepts', () => {
    const node = { content: 'component button modal form input page' };
    const concepts = graph.extractConcepts(node);

    assert.ok(concepts.includes('ui'));
  });

  test('should extract test concepts', () => {
    const node = { content: 'test spec mock fixture expect assert' };
    const concepts = graph.extractConcepts(node);

    assert.ok(concepts.includes('test'));
  });

  test('should extract config concepts', () => {
    const node = { content: 'config env settings options' };
    const concepts = graph.extractConcepts(node);

    assert.ok(concepts.includes('config'));
  });

  test('should extract multiple concepts', () => {
    const node = { content: 'api endpoint with auth token and database query' };
    const concepts = graph.extractConcepts(node);

    assert.ok(concepts.includes('api'));
    assert.ok(concepts.includes('auth'));
    assert.ok(concepts.includes('database'));
  });

  test('should return empty array when no concepts match', () => {
    const node = { content: 'some random content xyz' };
    const concepts = graph.extractConcepts(node);

    assert.strictEqual(concepts.length, 0);
  });

  test('should be case insensitive', () => {
    const node = { content: 'AUTH LOGIN PASSWORD' };
    const concepts = graph.extractConcepts(node);

    assert.ok(concepts.includes('auth'));
  });
});

describe('SemanticKnowledgeGraph - Infer Domain', () => {
  let graph;

  beforeEach(() => {
    graph = new SemanticKnowledgeGraph();
  });

  test('should infer backend domain', () => {
    assert.strictEqual(graph.inferDomain({ path: '/api/users.js' }), 'backend');
    assert.strictEqual(graph.inferDomain({ path: '/routes/auth.js' }), 'backend');
  });

  test('should infer frontend domain', () => {
    assert.strictEqual(graph.inferDomain({ path: '/components/Button.jsx' }), 'frontend');
    assert.strictEqual(graph.inferDomain({ path: '/pages/index.tsx' }), 'frontend');
  });

  test('should infer core domain', () => {
    assert.strictEqual(graph.inferDomain({ path: '/lib/helpers.js' }), 'core');
    assert.strictEqual(graph.inferDomain({ path: '/utils/format.js' }), 'core');
  });

  test('should infer testing domain', () => {
    assert.strictEqual(graph.inferDomain({ path: '/test/unit.test.js' }), 'testing');
    assert.strictEqual(graph.inferDomain({ path: '/src/component.test.tsx' }), 'testing');
  });

  test('should infer config domain', () => {
    assert.strictEqual(graph.inferDomain({ path: '/config/database.js' }), 'config');
    assert.strictEqual(graph.inferDomain({ path: '/jest.config.js' }), 'config');
  });

  test('should default to general domain', () => {
    assert.strictEqual(graph.inferDomain({ path: '/index.js' }), 'general');
    assert.strictEqual(graph.inferDomain({ path: '' }), 'general');
    assert.strictEqual(graph.inferDomain({}), 'general');
  });
});

describe('SemanticKnowledgeGraph - Calculate Complexity', () => {
  let graph;

  beforeEach(() => {
    graph = new SemanticKnowledgeGraph();
  });

  test('should calculate minimum complexity', () => {
    const node = { loc: 50, imports: [], exports: [] };
    const complexity = graph.calculateComplexity(node);

    assert.strictEqual(complexity, 1);
  });

  test('should increase complexity with LOC', () => {
    const small = graph.calculateComplexity({ loc: 50 });
    const medium = graph.calculateComplexity({ loc: 150 });
    const large = graph.calculateComplexity({ loc: 400 });

    assert.ok(small < medium);
    assert.ok(medium < large);
  });

  test('should increase complexity with imports', () => {
    const few = graph.calculateComplexity({ imports: ['a', 'b'] });
    const some = graph.calculateComplexity({ imports: Array(8).fill('dep') });
    const many = graph.calculateComplexity({ imports: Array(12).fill('dep') });

    assert.ok(few < some);
    assert.ok(some < many);
  });

  test('should increase complexity with exports', () => {
    const few = graph.calculateComplexity({ exports: ['a'] });
    const many = graph.calculateComplexity({ exports: ['a', 'b', 'c', 'd', 'e'] });

    assert.ok(few <= many);
  });

  test('should cap at 5', () => {
    const node = {
      loc: 1000,
      imports: Array(50).fill('dep'),
      exports: Array(50).fill('func'),
    };
    const complexity = graph.calculateComplexity(node);

    assert.strictEqual(complexity, 5);
  });

  test('should handle missing properties', () => {
    const complexity = graph.calculateComplexity({});

    assert.ok(complexity >= 1);
    assert.ok(complexity <= 5);
  });
});

describe('SemanticKnowledgeGraph - Add Semantic Edge', () => {
  let graph;

  beforeEach(() => {
    graph = new SemanticKnowledgeGraph();
  });

  test('should add edge between nodes', () => {
    const edge = graph.addSemanticEdge({
      source: 'node-1',
      target: 'node-2',
      type: 'imports',
    });

    assert.strictEqual(edge.source, 'node-1');
    assert.strictEqual(edge.target, 'node-2');
    assert.strictEqual(edge.type, 'imports');
  });

  test('should default to depends_on type', () => {
    const edge = graph.addSemanticEdge({
      source: 'a',
      target: 'b',
    });

    assert.strictEqual(edge.type, 'depends_on');
  });

  test('should default weight to 1', () => {
    const edge = graph.addSemanticEdge({
      source: 'a',
      target: 'b',
    });

    assert.strictEqual(edge.weight, 1);
  });

  test('should support custom weight', () => {
    const edge = graph.addSemanticEdge({
      source: 'a',
      target: 'b',
      weight: 5,
    });

    assert.strictEqual(edge.weight, 5);
  });

  test('should store edge in graph', () => {
    graph.addSemanticEdge({ source: 'a', target: 'b' });

    assert.strictEqual(graph.edges.length, 1);
  });

  test('should allow multiple edges between same nodes', () => {
    graph.addSemanticEdge({ source: 'a', target: 'b', type: 'imports' });
    graph.addSemanticEdge({ source: 'a', target: 'b', type: 'calls' });

    assert.strictEqual(graph.edges.length, 2);
  });
});

describe('SemanticKnowledgeGraph - Query by Concepts', () => {
  let graph;

  beforeEach(() => {
    graph = new SemanticKnowledgeGraph();
    graph.addSemanticNode('auth-1', { name: 'login.js', content: 'login password auth' });
    graph.addSemanticNode('payment-1', { name: 'stripe.js', content: 'payment stripe billing' });
    graph.addSemanticNode('mixed-1', { name: 'checkout.js', content: 'payment auth checkout' });
  });

  test('should find nodes by single concept', () => {
    const results = graph.queryByConcepts(['auth']);

    assert.ok(results.length >= 1);
    assert.ok(results.some((r) => r.id === 'auth-1'));
  });

  test('should find nodes by multiple concepts', () => {
    const results = graph.queryByConcepts(['auth', 'payment']);

    assert.ok(results.length >= 1);
    // Mixed node should have high score
    assert.ok(results.some((r) => r.id === 'mixed-1'));
  });

  test('should return empty array when no matches', () => {
    const results = graph.queryByConcepts(['nonexistent']);

    assert.strictEqual(results.length, 0);
  });

  test('should include score for each result', () => {
    const results = graph.queryByConcepts(['auth']);

    results.forEach((result) => {
      assert.ok(result.score !== undefined);
      assert.ok(result.score > 0);
      assert.ok(result.score <= 1);
    });
  });

  test('should sort by score descending', () => {
    const results = graph.queryByConcepts(['auth', 'payment']);

    for (let i = 0; i < results.length - 1; i++) {
      assert.ok(results[i].score >= results[i + 1].score);
    }
  });

  test('should respect limit parameter', () => {
    graph.addSemanticNode('auth-2', { content: 'auth' });
    graph.addSemanticNode('auth-3', { content: 'auth' });

    const results = graph.queryByConcepts(['auth'], { limit: 1 });

    assert.strictEqual(results.length, 1);
  });

  test('should use default limit of 10', () => {
    for (let i = 0; i < 20; i++) {
      graph.addSemanticNode(`auth-${i}`, { content: 'auth' });
    }

    const results = graph.queryByConcepts(['auth']);

    assert.strictEqual(results.length, 10);
  });
});

describe('SemanticKnowledgeGraph - Query by Domain', () => {
  let graph;

  beforeEach(() => {
    graph = new SemanticKnowledgeGraph();
    graph.addSemanticNode('fe-1', { name: 'Button.jsx', path: '/components/Button.jsx' });
    graph.addSemanticNode('fe-2', { name: 'Modal.jsx', path: '/components/Modal.jsx' });
    graph.addSemanticNode('be-1', { name: 'users.js', path: '/api/users.js' });
  });

  test('should find nodes by domain', () => {
    const frontendNodes = graph.queryByDomain('frontend');

    assert.strictEqual(frontendNodes.length, 2);
    assert.ok(frontendNodes.some((n) => n.id === 'fe-1'));
    assert.ok(frontendNodes.some((n) => n.id === 'fe-2'));
  });

  test('should return empty array when no matches', () => {
    const results = graph.queryByDomain('mobile');

    assert.strictEqual(results.length, 0);
  });

  test('should respect limit parameter', () => {
    const results = graph.queryByDomain('frontend', { limit: 1 });

    assert.strictEqual(results.length, 1);
  });

  test('should use default limit of 20', () => {
    for (let i = 0; i < 30; i++) {
      graph.addSemanticNode(`comp-${i}`, { path: '/components/Test.jsx' });
    }

    const results = graph.queryByDomain('frontend');

    assert.strictEqual(results.length, 20);
  });
});

describe('SemanticKnowledgeGraph - Find Related Nodes', () => {
  let graph;

  beforeEach(() => {
    graph = new SemanticKnowledgeGraph();
    graph.addSemanticNode('a', { name: 'a.js' });
    graph.addSemanticNode('b', { name: 'b.js' });
    graph.addSemanticNode('c', { name: 'c.js' });
    graph.addSemanticNode('d', { name: 'd.js' });

    graph.addSemanticEdge({ source: 'a', target: 'b', type: 'imports' });
    graph.addSemanticEdge({ source: 'b', target: 'c', type: 'calls' });
    graph.addSemanticEdge({ source: 'c', target: 'd', type: 'depends_on' });
  });

  test('should find directly connected nodes', () => {
    const related = graph.findRelated('a', { depth: 1 });

    assert.ok(related.some((n) => n.id === 'b'));
  });

  test('should find nodes at depth 2', () => {
    const related = graph.findRelated('a', { depth: 2 });

    assert.ok(related.some((n) => n.id === 'b'));
    assert.ok(related.some((n) => n.id === 'c'));
  });

  test('should include relationship type', () => {
    const related = graph.findRelated('a');

    const bNode = related.find((n) => n.id === 'b');
    assert.strictEqual(bNode.relationship, 'imports');
  });

  test('should include distance', () => {
    const related = graph.findRelated('a', { depth: 3 });

    const bNode = related.find((n) => n.id === 'b');
    const cNode = related.find((n) => n.id === 'c');

    assert.ok(bNode.distance < cNode.distance);
  });

  test('should sort by distance', () => {
    const related = graph.findRelated('a', { depth: 3 });

    for (let i = 0; i < related.length - 1; i++) {
      assert.ok(related[i].distance <= related[i + 1].distance);
    }
  });

  test('should respect limit parameter', () => {
    const related = graph.findRelated('a', { depth: 3, limit: 1 });

    assert.strictEqual(related.length, 1);
  });

  test('should use default limit of 10', () => {
    // Add many nodes
    for (let i = 0; i < 20; i++) {
      const id = `node-${i}`;
      graph.addSemanticNode(id, { name: `${id}.js` });
      graph.addSemanticEdge({ source: 'a', target: id });
    }

    const related = graph.findRelated('a');

    assert.strictEqual(related.length, 10);
  });

  test('should return empty array for isolated node', () => {
    graph.addSemanticNode('isolated', { name: 'isolated.js' });

    const related = graph.findRelated('isolated');

    assert.strictEqual(related.length, 0);
  });
});

describe('SemanticKnowledgeGraph - Get Architecture Overview', () => {
  let graph;

  beforeEach(() => {
    graph = new SemanticKnowledgeGraph();
  });

  test('should provide total counts', () => {
    graph.addSemanticNode('a', { name: 'a.js', path: '/api/a.js' });
    graph.addSemanticNode('b', { name: 'b.js', path: '/components/b.jsx' });
    graph.addSemanticEdge({ source: 'a', target: 'b' });

    const overview = graph.getArchitectureOverview();

    assert.strictEqual(overview.totalNodes, 2);
    assert.strictEqual(overview.totalEdges, 1);
  });

  test('should count nodes by domain', () => {
    graph.addSemanticNode('fe-1', { path: '/components/Button.jsx' });
    graph.addSemanticNode('fe-2', { path: '/pages/Home.tsx' });
    graph.addSemanticNode('be-1', { path: '/api/users.js' });

    const overview = graph.getArchitectureOverview();

    assert.strictEqual(overview.domains.frontend, 2);
    assert.strictEqual(overview.domains.backend, 1);
  });

  test('should count nodes by concept', () => {
    graph.addSemanticNode('a', { content: 'auth login' });
    graph.addSemanticNode('b', { content: 'auth password' });
    graph.addSemanticNode('c', { content: 'payment stripe' });

    const overview = graph.getArchitectureOverview();

    assert.strictEqual(overview.concepts.auth, 2);
    assert.strictEqual(overview.concepts.payment, 1);
  });

  test('should identify complex nodes', () => {
    graph.addSemanticNode('simple', { loc: 50 });
    graph.addSemanticNode('complex', { loc: 500, imports: Array(15).fill('dep') });

    const overview = graph.getArchitectureOverview();

    assert.ok(overview.complexNodes.length >= 1);
    assert.ok(overview.complexNodes.some((n) => n.id === 'complex'));
  });

  test('should identify core abstractions', () => {
    graph.addSemanticNode('util', { name: 'util.js' });
    graph.addSemanticNode('a', { name: 'a.js' });
    graph.addSemanticNode('b', { name: 'b.js' });
    graph.addSemanticNode('c', { name: 'c.js' });

    // Make util highly connected
    ['a', 'b', 'c'].forEach((id) => {
      graph.addSemanticEdge({ source: id, target: 'util' });
      graph.addSemanticEdge({ source: 'util', target: id });
    });

    const overview = graph.getArchitectureOverview();

    assert.ok(overview.coreAbstractions.length >= 1);
    assert.ok(overview.coreAbstractions.some((n) => n.id === 'util'));
  });
});

describe('SemanticKnowledgeGraph - Cypher Export', () => {
  let graph;

  beforeEach(() => {
    graph = new SemanticKnowledgeGraph();
  });

  test('should generate Cypher for nodes', () => {
    graph.addSemanticNode('test', {
      name: 'test.js',
      type: 'file',
      path: '/test.js',
      loc: 100,
    });

    const cypher = graph.toCypher();

    assert.ok(cypher.includes('CREATE'));
    assert.ok(cypher.includes('test'));
    assert.ok(cypher.includes('test.js'));
  });

  test('should generate Cypher for relationships', () => {
    graph.addSemanticNode('a', { name: 'a.js' });
    graph.addSemanticNode('b', { name: 'b.js' });
    graph.addSemanticEdge({ source: 'a', target: 'b', type: 'imports' });

    const cypher = graph.toCypher();

    assert.ok(cypher.includes('MATCH'));
    assert.ok(cypher.includes('IMPORTS'));
  });

  test('should generate valid Cypher syntax', () => {
    graph.addSemanticNode('test', { name: 'test.js', path: '/test.js' });

    const cypher = graph.toCypher();

    assert.ok(cypher.includes('CREATE (n:'));
    assert.ok(cypher.includes('{'));
    assert.ok(cypher.includes('}'));
  });

  test('should handle empty graph', () => {
    const cypher = graph.toCypher();

    assert.strictEqual(cypher, '');
  });
});
