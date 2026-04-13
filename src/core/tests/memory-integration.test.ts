// Copyright (c) 2026 Ultra-Dex

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { MemoryManager } from '../memory/manager.js';
import { SQLiteProvider } from '../memory/sqlite.js';
import { VectorStore } from '../memory/vector-store.js';
import { GraphEngine } from '../memory/graph-engine.js';

let tempDir;
let sqliteProvider;
let memoryManager;
let vectorStore;
let graph;

async function setupMemoryHarness() {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-memory-'));

  sqliteProvider = new SQLiteProvider(path.join(tempDir, 'memory.db'));
  await sqliteProvider.init();

  memoryManager = new MemoryManager();
  memoryManager.provider = sqliteProvider;
  memoryManager.initialized = false;

  vectorStore = new VectorStore({
    storagePath: path.join(tempDir, 'vectors.db'),
    dimensions: 128,
    provider: 'simulated', // Use simulated provider for tests
  });
  await vectorStore.initialize();

  graph = new GraphEngine();
  graph.provider = sqliteProvider;
}

async function teardownMemoryHarness() {
  if (vectorStore) {
    await vectorStore.close();
    vectorStore = null;
  }

  if (sqliteProvider) {
    await sqliteProvider.close();
    sqliteProvider = null;
  }

  if (tempDir) {
    await fs.rm(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
}

test('MemoryManager store/retrieve cycle', async () => {
  await setupMemoryHarness();

  const record = await memoryManager.add({
    id: 'mem-decision-1',
    content: 'Use Postgres for transactional consistency',
    type: 'decision',
    source: 'integration-test',
    importance: 9,
    metadata: { domain: 'database' },
  });

  assert.equal(record.id, 'mem-decision-1');

  const searchResults = await memoryManager.search('Postgres', 5);
  assert.ok(searchResults.length >= 1);
  assert.equal(searchResults[0].id, 'mem-decision-1');

  const stats = await memoryManager.stats();
  assert.ok(stats.hot >= 1);
  assert.ok(stats.warm >= 1);
  assert.ok(stats.cold >= 1);

  await teardownMemoryHarness();
});

test('VectorStore similarity search', async () => {
  await setupMemoryHarness();

  await vectorStore.upsert([
    {
      id: 'vec-1',
      content: 'Postgres scales for analytics workloads',
      metadata: { category: 'database' },
    },
  ]);
  await vectorStore.upsert([
    {
      id: 'vec-2',
      content: 'Redis speeds up cache-heavy API responses',
      metadata: { category: 'cache' },
    },
  ]);

  const results = await vectorStore.search('Postgres scales for analytics workloads', 1);
  assert.equal(results.length, 1);
  assert.equal(results[0].id, 'vec-1');
  assert.ok(typeof results[0].score === 'number');

  await teardownMemoryHarness();
});

test('GraphEngine node insertion and traversal', async () => {
  await setupMemoryHarness();

  await sqliteProvider.add('cold', {
    id: 'node-a',
    content: 'Adopt CQRS write model',
    type: 'decision',
    source: 'integration-test',
    metadata: {},
  });
  await sqliteProvider.add('cold', {
    id: 'node-b',
    content: 'Introduce event store',
    type: 'decision',
    source: 'integration-test',
    metadata: {},
  });
  await sqliteProvider.add('cold', {
    id: 'node-c',
    content: 'Add replay projector',
    type: 'decision',
    source: 'integration-test',
    metadata: {},
  });

  await graph.relate('node-a', 'node-b', 'DEPENDS_ON');
  await graph.relate('node-b', 'node-c', 'DEPENDS_ON');

  const pathResult = await graph.findPath('node-a', 'node-c', 5);
  assert.ok(pathResult);
  assert.equal(pathResult[0].id, 'node-a');
  assert.equal(pathResult[pathResult.length - 1].id, 'node-c');

  const impact = await graph.getImpact('node-a');
  assert.ok(impact.includes('node-c'));

  await teardownMemoryHarness();
});

test('Integrated memory flow: store -> embed -> graph retrieve', async () => {
  await setupMemoryHarness();

  const decisionA = await memoryManager.add({
    id: 'arch-1',
    content: 'Store architecture decisions in tiered memory',
    type: 'decision',
    source: 'integration-test',
    importance: 9,
    metadata: {},
  });

  const decisionB = await memoryManager.add({
    id: 'arch-2',
    content: 'Embed each decision and connect related nodes',
    type: 'decision',
    source: 'integration-test',
    importance: 9,
    metadata: {},
  });

  await vectorStore.upsert([
    { id: decisionA.id, content: decisionA.content, metadata: { type: decisionA.type } },
  ]);
  await vectorStore.upsert([
    { id: decisionB.id, content: decisionB.content, metadata: { type: decisionB.type } },
  ]);

  await graph.relate(decisionA.id, decisionB.id, 'ENABLES');

  const keywordResults = await memoryManager.search('architecture decisions', 5);
  assert.ok(keywordResults.some((entry) => entry.id === 'arch-1'));

  const semanticResults = await vectorStore.search('embed related decisions', 2);
  assert.ok(semanticResults.length >= 1);

  const graphPath = await graph.findPath('arch-1', 'arch-2', 3);
  assert.ok(graphPath);
  assert.equal(graphPath[0].id, 'arch-1');
  assert.equal(graphPath[graphPath.length - 1].id, 'arch-2');

  await teardownMemoryHarness();
});
