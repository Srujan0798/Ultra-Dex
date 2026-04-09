// Copyright (c) 2026 Ultra-Dex
/**
 * Task Router Tests - Semantic routing for agent selection
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { TaskRouter, TfIdfVectorizer } from '../../src/core/orchestration/task-router.js';

describe('TfIdfVectorizer', () => {
  it('should tokenize text correctly', () => {
    const vectorizer = new TfIdfVectorizer();
    const tokens = vectorizer.tokenize('Build a React component for user authentication');

    assert.ok(tokens.includes('react'), 'Should include react');
    assert.ok(tokens.includes('component'), 'Should include component');
    assert.ok(tokens.includes('authentication'), 'Should include authentication');
  });

  it('should fit on documents and build vocabulary', () => {
    const vectorizer = new TfIdfVectorizer();
    const docs = [
      { id: 'frontend', text: 'react component ui css styling' },
      { id: 'backend', text: 'api server database endpoint' },
    ];

    vectorizer.fit(docs);

    assert.ok(vectorizer.vocabulary.has('react'), 'Should have react in vocab');
    assert.ok(vectorizer.vocabulary.has('api'), 'Should have api in vocab');
    assert.ok(vectorizer.idf.has('react'), 'Should have IDF for react');
  });

  it('should transform text to vector', () => {
    const vectorizer = new TfIdfVectorizer();
    const docs = [
      { id: 'frontend', text: 'react component ui css' },
      { id: 'backend', text: 'api server database' },
    ];

    vectorizer.fit(docs);
    const vector = vectorizer.transform('react ui');

    assert.ok(vector.has('react'), 'Vector should have react');
    assert.ok(vector.has('ui'), 'Vector should have ui');
    assert.ok(vector.get('react') > 0, 'TF-IDF score should be positive');
  });

  it('should calculate cosine similarity', () => {
    const vectorizer = new TfIdfVectorizer();
    const vecA = new Map([
      ['react', 1.0],
      ['component', 0.5],
    ]);
    const vecB = new Map([
      ['react', 0.8],
      ['component', 0.4],
    ]);

    const similarity = vectorizer.cosineSimilarity(vecA, vecB);

    assert.ok(similarity > 0.9 && similarity <= 1.0, 'Similar vectors should have high similarity');
  });
});

describe('TaskRouter', () => {
  let router;

  beforeEach(() => {
    router = new TaskRouter();
    // Register agents with capabilities
    router.registerAgent('frontend', ['react', 'component', 'ui', 'css', 'styling', 'dom', 'html']);
    router.registerAgent('backend', [
      'api',
      'server',
      'database',
      'endpoint',
      'middleware',
      'controller',
    ]);
    router.registerAgent('database', ['sql', 'schema', 'migration', 'query', 'table', 'index']);
    router.registerAgent('testing', ['jest', 'vitest', 'test', 'spec', 'coverage', 'mock']);
  });

  it('should register agents', () => {
    const agents = router.getAgents();
    assert.strictEqual(agents.length, 4);
    assert.ok(agents.includes('frontend'));
    assert.ok(agents.includes('backend'));
  });

  it('should route UI tasks to frontend agent', () => {
    const result = router.route('Build a React login form with CSS styling');

    assert.strictEqual(result.agentId, 'frontend');
    assert.strictEqual(result.method, 'semantic');
    assert.ok(result.confidence > 0.3, 'Should have high confidence for clear match');
  });

  it('should route API tasks to backend agent', () => {
    const result = router.route('Create REST API endpoint for user management');

    assert.strictEqual(result.agentId, 'backend');
    assert.ok(result.confidence > 0.3);
  });

  it('should route database tasks to database agent', () => {
    const result = router.route('Create SQL schema for users table with indexes');

    assert.strictEqual(result.agentId, 'database');
    assert.ok(result.confidence > 0.3);
  });

  it('should route test tasks to testing agent', () => {
    const result = router.route('Write Jest unit tests for authentication module coverage');

    assert.strictEqual(result.agentId, 'testing');
    assert.ok(result.confidence > 0.2);
  });

  it('should provide alternative matches', () => {
    const result = router.route('Build React component with API integration');

    assert.ok(result.alternatives.length > 0, 'Should provide alternatives');
    // Frontend should be first, backend should be in alternatives
    const hasBackendAlt = result.alternatives.some((alt) => alt.agentId === 'backend');
    assert.ok(
      hasBackendAlt || result.agentId === 'backend',
      'Should consider backend for API-related task'
    );
  });

  it('should fall back to keyword matching for low similarity', () => {
    // Create a router with high threshold to force fallback
    const strictRouter = new TaskRouter({ similarityThreshold: 0.9 });
    strictRouter.registerAgent('frontend', ['react', 'ui']);
    strictRouter.registerAgent('backend', ['api', 'server']);

    const result = strictRouter.route('ui css design');

    assert.strictEqual(result.method, 'fallback');
    assert.strictEqual(result.agentId, 'frontend');
  });

  it('should use fallback for orchestrator when no match', () => {
    // Task with no clear match
    const result = router.route('xyz unknown random task');

    assert.strictEqual(result.method, 'fallback');
  });

  it('should handle object tasks', () => {
    const task = { type: 'component', framework: 'react', feature: 'login' };
    const result = router.route(task);

    assert.strictEqual(result.agentId, 'frontend');
  });

  it('should get scores for all agents', () => {
    const scores = router.getScores('React component testing');

    assert.strictEqual(scores.length, 4);
    assert.ok(scores[0].similarity >= scores[1].similarity, 'Scores should be sorted');
  });

  it('should handle empty task', () => {
    const result = router.route('');

    assert.ok(result.agentId);
    assert.strictEqual(result.method, 'fallback');
  });

  it('should re-fit when new agents are registered', () => {
    router.route('react component'); // First route triggers fit

    router.registerAgent('devops', ['docker', 'kubernetes', 'deploy']);

    const result = router.route('docker deployment');
    assert.strictEqual(result.agentId, 'devops');
  });
});

describe('TaskRouter Edge Cases', () => {
  it('should handle single agent', () => {
    const router = new TaskRouter({ similarityThreshold: 0 }); // Lower threshold for single agent
    router.registerAgent('only', ['everything', 'task', 'any', 'generic']);

    const result = router.route('any task');
    assert.strictEqual(result.agentId, 'only');
  });

  it('should handle no agents', () => {
    const router = new TaskRouter();

    const result = router.route('any task');
    assert.strictEqual(result.agentId, 'orchestrator');
  });

  it('should handle duplicate capabilities', () => {
    const router = new TaskRouter();
    router.registerAgent('agent1', ['react', 'react', 'react']);
    router.registerAgent('agent2', ['react', 'vue']);

    const result = router.route('react');
    // Should not throw and should return one of the agents
    assert.ok(['agent1', 'agent2'].includes(result.agentId));
  });

  it('should handle very long tasks', () => {
    const router = new TaskRouter();
    router.registerAgent('frontend', ['react', 'ui']);
    router.registerAgent('backend', ['api', 'server']);

    const longTask = 'react '.repeat(1000);
    const result = router.route(longTask);

    assert.strictEqual(result.agentId, 'frontend');
  });
});

describe('TaskRouter Integration with AgentOrchestrator patterns', () => {
  it('should match legacy keyword patterns', () => {
    const router = new TaskRouter();
    router.registerAgent('frontend', ['ui', 'css', 'component', 'react', 'html', 'dom', 'style']);
    router.registerAgent('backend', ['api', 'route', 'server', 'endpoint', 'middleware']);
    router.registerAgent('database', ['db', 'schema', 'sql', 'query', 'table']);
    router.registerAgent('testing', ['test', 'spec', 'jest', 'coverage']);

    // Test cases that match legacy patterns
    const testCases = [
      { task: 'Create UI component', expected: 'frontend' },
      { task: 'Build CSS styles', expected: 'frontend' },
      { task: 'Design API endpoint', expected: 'backend' },
      { task: 'Setup database schema', expected: 'database' },
      { task: 'Write unit tests', expected: 'testing' },
    ];

    for (const { task, expected } of testCases) {
      const result = router.route(task);
      assert.strictEqual(result.agentId, expected, `Task "${task}" should route to ${expected}`);
    }
  });
});
