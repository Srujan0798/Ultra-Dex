/**
 * Tests for SQLite-backed Vector Store
 *
 * Critical memory module - ensures vector storage and retrieval accuracy
 */

import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { VectorStore } from '../../lib/memory/vector-store.js';

describe('VectorStore - Initialization', () => {
  let store;
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-vector-'));
    store = new VectorStore({ storagePath: path.join(tempDir, 'test.db') });
  });

  afterEach(async () => {
    if (store) {
      await store.close();
    }
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  test('should initialize successfully', async () => {
    await store.init();

    assert.ok(store.db);
  });

  test('should create storage directory if missing', async () => {
    const deepPath = path.join(tempDir, 'deep', 'nested', 'path', 'test.db');
    const deepStore = new VectorStore({ storagePath: deepPath });

    await deepStore.init();

    const stats = await fs.stat(path.dirname(deepPath));
    assert.ok(stats.isDirectory());

    await deepStore.close();
  });

  test('should create vectors table on init', async () => {
    await store.init();

    // Query table schema
    const tables = await store.db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='vectors'"
    );

    assert.strictEqual(tables.length, 1);
    assert.strictEqual(tables[0].name, 'vectors');
  });

  test('should use default path if not specified', () => {
    const defaultStore = new VectorStore();

    const expectedPath = path.resolve(process.cwd(), '.ultra-dex', 'memory.db');
    assert.strictEqual(defaultStore.storagePath, expectedPath);
  });
});

describe('VectorStore - Add Operations', () => {
  let store;
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-vector-'));
    store = new VectorStore({ storagePath: path.join(tempDir, 'test.db') });
    await store.init();
  });

  afterEach(async () => {
    if (store) {
      await store.close();
    }
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore
    }
  });

  test('should add a vector', async () => {
    const result = await store.add('test-1', 'hello world', { type: 'test' });

    assert.strictEqual(result.id, 'test-1');
    assert.strictEqual(result.text, 'hello world');
    assert.ok(result.embedding);
    assert.ok(result.created_at);
  });

  test('should store embedding as JSON string', async () => {
    const result = await store.add('test-2', 'test text');

    const embedding = JSON.parse(result.embedding);
    assert.ok(Array.isArray(embedding));
    assert.strictEqual(embedding.length, 128);
  });

  test('should store metadata', async () => {
    const metadata = { type: 'code', language: 'javascript' };
    const result = await store.add('test-3', 'function test() {}', metadata);

    const storedMetadata = JSON.parse(result.metadata);
    assert.deepStrictEqual(storedMetadata, metadata);
  });

  test('should handle empty metadata', async () => {
    const result = await store.add('test-4', 'text without metadata');

    const storedMetadata = JSON.parse(result.metadata);
    assert.deepStrictEqual(storedMetadata, {});
  });

  test('should replace existing vector with same ID', async () => {
    await store.add('duplicate', 'first text');
    await store.add('duplicate', 'second text');

    const list = await store.list();
    const duplicates = list.filter(item => item.id === 'duplicate');

    assert.strictEqual(duplicates.length, 1);
    assert.strictEqual(duplicates[0].text, 'second text');
  });

  test('should handle multiple vectors', async () => {
    await store.add('vec-1', 'first text');
    await store.add('vec-2', 'second text');
    await store.add('vec-3', 'third text');

    const list = await store.list();
    assert.strictEqual(list.length, 3);
  });
});

describe('VectorStore - List Operations', () => {
  let store;
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-vector-'));
    store = new VectorStore({ storagePath: path.join(tempDir, 'test.db') });
    await store.init();
  });

  afterEach(async () => {
    if (store) {
      await store.close();
    }
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore
    }
  });

  test('should list all vectors', async () => {
    await store.add('vec-1', 'text 1');
    await store.add('vec-2', 'text 2');

    const list = await store.list();
    assert.strictEqual(list.length, 2);
  });

  test('should return most recent first', async () => {
    await store.add('old', 'old text');
    await new Promise(resolve => setTimeout(resolve, 10)); // Ensure time difference
    await store.add('new', 'new text');

    const list = await store.list();
    assert.strictEqual(list[0].id, 'new');
    assert.strictEqual(list[1].id, 'old');
  });

  test('should respect limit parameter', async () => {
    for (let i = 0; i < 10; i++) {
      await store.add(`vec-${i}`, `text ${i}`);
    }

    const list = await store.list(3);
    assert.strictEqual(list.length, 3);
  });

  test('should use default limit of 50', async () => {
    for (let i = 0; i < 60; i++) {
      await store.add(`vec-${i}`, `text ${i}`);
    }

    const list = await store.list();
    assert.strictEqual(list.length, 50);
  });

  test('should parse metadata correctly', async () => {
    await store.add('meta', 'text', { type: 'test', count: 42 });

    const list = await store.list();
    assert.strictEqual(list[0].metadata.type, 'test');
    assert.strictEqual(list[0].metadata.count, 42);
  });

  test('should return empty array when no vectors exist', async () => {
    const list = await store.list();
    assert.strictEqual(list.length, 0);
  });
});

describe('VectorStore - Remove Operations', () => {
  let store;
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-vector-'));
    store = new VectorStore({ storagePath: path.join(tempDir, 'test.db') });
    await store.init();
  });

  afterEach(async () => {
    if (store) {
      await store.close();
    }
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore
    }
  });

  test('should remove vector by ID', async () => {
    await store.add('remove-me', 'text to remove');
    await store.remove('remove-me');

    const list = await store.list();
    assert.strictEqual(list.length, 0);
  });

  test('should not affect other vectors', async () => {
    await store.add('keep-1', 'text 1');
    await store.add('remove', 'text 2');
    await store.add('keep-2', 'text 3');

    await store.remove('remove');

    const list = await store.list();
    assert.strictEqual(list.length, 2);
    assert.ok(list.some(v => v.id === 'keep-1'));
    assert.ok(list.some(v => v.id === 'keep-2'));
  });

  test('should succeed when removing non-existent ID', async () => {
    await store.remove('does-not-exist');

    const list = await store.list();
    assert.strictEqual(list.length, 0);
  });
});

describe('VectorStore - Query Operations', () => {
  let store;
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-vector-'));
    store = new VectorStore({ storagePath: path.join(tempDir, 'test.db') });
    await store.init();
  });

  afterEach(async () => {
    if (store) {
      await store.close();
    }
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore
    }
  });

  test('should find similar vectors', async () => {
    await store.add('ml-1', 'machine learning algorithms');
    await store.add('ml-2', 'deep learning neural networks');
    await store.add('cooking', 'pizza recipe ingredients');

    const results = await store.query('machine learning', 2);

    assert.strictEqual(results.length, 2);
    // ML-related should be top results
    assert.ok(results[0].text.includes('machine') || results[0].text.includes('learning'));
  });

  test('should include similarity scores', async () => {
    await store.add('test-1', 'hello world');
    await store.add('test-2', 'goodbye world');

    const results = await store.query('hello world');

    assert.ok(results[0].score !== undefined);
    assert.ok(typeof results[0].score === 'number');
    assert.ok(results[0].score >= -1 && results[0].score <= 1);
  });

  test('should sort by similarity score descending', async () => {
    await store.add('exact', 'machine learning');
    await store.add('similar', 'machine learning algorithms');
    await store.add('different', 'cooking recipes');

    const results = await store.query('machine learning');

    assert.strictEqual(results[0].id, 'exact'); // Exact match should be first
    assert.ok(results[0].score > results[1].score);
    assert.ok(results[1].score > results[2].score);
  });

  test('should respect limit parameter', async () => {
    for (let i = 0; i < 10; i++) {
      await store.add(`vec-${i}`, `text number ${i}`);
    }

    const results = await store.query('text', 3);
    assert.strictEqual(results.length, 3);
  });

  test('should use default limit of 5', async () => {
    for (let i = 0; i < 10; i++) {
      await store.add(`vec-${i}`, `text ${i}`);
    }

    const results = await store.query('text');
    assert.strictEqual(results.length, 5);
  });

  test('should parse metadata in results', async () => {
    await store.add('meta-test', 'test text', { type: 'test' });

    const results = await store.query('test text');
    assert.strictEqual(results[0].metadata.type, 'test');
  });

  test('should return empty array when no vectors exist', async () => {
    const results = await store.query('anything');
    assert.strictEqual(results.length, 0);
  });

  test('should handle exact matches', async () => {
    await store.add('exact', 'test query text');

    const results = await store.query('test query text');

    assert.strictEqual(results[0].id, 'exact');
    // Exact match should have very high score
    assert.ok(results[0].score > 0.9);
  });
});

describe('VectorStore - Clear Operations', () => {
  let store;
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-vector-'));
    store = new VectorStore({ storagePath: path.join(tempDir, 'test.db') });
    await store.init();
  });

  afterEach(async () => {
    if (store) {
      await store.close();
    }
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore
    }
  });

  test('should clear all vectors', async () => {
    await store.add('vec-1', 'text 1');
    await store.add('vec-2', 'text 2');

    await store.clear();

    const list = await store.list();
    assert.strictEqual(list.length, 0);
  });

  test('should clear vectors older than date', async () => {
    const oldDate = new Date('2020-01-01').toISOString();
    const recentDate = new Date('2026-01-01').toISOString();

    // Manually insert with specific dates
    await store.db.run(
      `INSERT INTO vectors (id, text, embedding, metadata, created_at) VALUES (?, ?, ?, ?, ?)`,
      'old', 'old text', JSON.stringify([0.1, 0.2]), '{}', oldDate
    );
    await store.db.run(
      `INSERT INTO vectors (id, text, embedding, metadata, created_at) VALUES (?, ?, ?, ?, ?)`,
      'recent', 'recent text', JSON.stringify([0.3, 0.4]), '{}', recentDate
    );

    await store.clear({ olderThan: '2025-01-01' });

    const list = await store.list();
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].id, 'recent');
  });

  test('should succeed when clearing empty store', async () => {
    await store.clear();

    const list = await store.list();
    assert.strictEqual(list.length, 0);
  });
});

describe('VectorStore - Close Operations', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-vector-'));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore
    }
  });

  test('should close database connection', async () => {
    const store = new VectorStore({ storagePath: path.join(tempDir, 'test.db') });
    await store.init();

    await store.close();

    assert.strictEqual(store.db, null);
  });

  test('should handle close when not initialized', async () => {
    const store = new VectorStore({ storagePath: path.join(tempDir, 'test.db') });

    await store.close();

    assert.strictEqual(store.db, null);
  });

  test('should handle multiple close calls', async () => {
    const store = new VectorStore({ storagePath: path.join(tempDir, 'test.db') });
    await store.init();

    await store.close();
    await store.close();

    assert.strictEqual(store.db, null);
  });
});

describe('VectorStore - Edge Cases', () => {
  let store;
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-vector-'));
    store = new VectorStore({ storagePath: path.join(tempDir, 'test.db') });
    await store.init();
  });

  afterEach(async () => {
    if (store) {
      await store.close();
    }
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore
    }
  });

  test('should handle empty text', async () => {
    await store.add('empty', '');

    const list = await store.list();
    assert.strictEqual(list[0].text, '');
  });

  test('should handle very long text', async () => {
    const longText = 'word '.repeat(10000);
    await store.add('long', longText);

    const list = await store.list();
    assert.strictEqual(list[0].text, longText);
  });

  test('should handle special characters in text', async () => {
    const specialText = 'hello! @world #test $price %off ^power &more *star (paren) [bracket] {brace}';
    await store.add('special', specialText);

    const list = await store.list();
    assert.strictEqual(list[0].text, specialText);
  });

  test('should handle unicode in text', async () => {
    const unicodeText = 'café résumé naïve 日本語 emoji 🚀';
    await store.add('unicode', unicodeText);

    const list = await store.list();
    assert.strictEqual(list[0].text, unicodeText);
  });

  test('should handle special characters in ID', async () => {
    const specialId = 'id-with-dashes_and_underscores.and.dots';
    await store.add(specialId, 'text');

    const list = await store.list();
    assert.strictEqual(list[0].id, specialId);
  });

  test('should handle null metadata gracefully', async () => {
    // Manually insert with null metadata
    await store.db.run(
      `INSERT INTO vectors (id, text, embedding, metadata, created_at) VALUES (?, ?, ?, ?, ?)`,
      'null-meta', 'text', JSON.stringify([0.1]), null, new Date().toISOString()
    );

    const list = await store.list();
    assert.strictEqual(list[0].metadata, null);
  });

  test('should handle malformed metadata gracefully', async () => {
    // Manually insert with invalid JSON metadata
    await store.db.run(
      `INSERT INTO vectors (id, text, embedding, metadata, created_at) VALUES (?, ?, ?, ?, ?)`,
      'bad-meta', 'text', JSON.stringify([0.1]), 'not-valid-json', new Date().toISOString()
    );

    const list = await store.list();
    assert.strictEqual(list[0].metadata, null);
  });
});

describe('VectorStore - Cosine Similarity', () => {
  let store;
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-vector-'));
    store = new VectorStore({ storagePath: path.join(tempDir, 'test.db') });
    await store.init();
  });

  afterEach(async () => {
    if (store) {
      await store.close();
    }
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore
    }
  });

  test('identical texts should have similarity close to 1', async () => {
    await store.add('same', 'machine learning algorithms');

    const results = await store.query('machine learning algorithms');

    assert.ok(results[0].score > 0.99);
  });

  test('completely different texts should have low similarity', async () => {
    await store.add('different', 'pizza recipe cooking');

    const results = await store.query('machine learning algorithms');

    assert.ok(results[0].score < 0.5);
  });

  test('similar texts should have moderate similarity', async () => {
    await store.add('similar', 'machine learning neural networks');

    const results = await store.query('deep learning algorithms');

    assert.ok(results[0].score > 0.1); // Lower threshold for simple hash-based embeddings
    assert.ok(results[0].score < 1.0);
  });
});
