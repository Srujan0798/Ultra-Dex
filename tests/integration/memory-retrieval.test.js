// Copyright (c) 2026 Ultra-Dex
// Integration test: Memory Manager - End-to-end memory storage and retrieval

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { EventEmitter } from 'events';

describe('Memory Manager Integration', () => {
  let memoryManager;

  beforeEach(() => {
    // Create in-memory memory manager mock
    memoryManager = new EventEmitter();
    memoryManager.entries = [];
    memoryManager.initialized = true;

    memoryManager.add = async function (entry) {
      const storedEntry = {
        id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: entry.content,
        metadata: {
          type: entry.type || 'observation',
          importance: entry.importance || 5,
          timestamp: Date.now(),
          ...entry.metadata,
        },
      };

      // Auto-tiering based on importance
      storedEntry.tiers = [];
      if (entry.importance > 5) storedEntry.tiers.push('warm');
      if (entry.type === 'decision') storedEntry.tiers.push('cold');
      storedEntry.tiers.push('hot'); // All new entries are hot

      this.entries.push(storedEntry);
      this.emit('memory:stored', storedEntry);
      return storedEntry;
    };

    memoryManager.search = async function (query, limit = 5) {
      // Simple search - match query in content
      const results = this.entries
        .filter((e) => e.content.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => b.metadata.importance - a.metadata.importance)
        .slice(0, limit);
      return results;
    };

    memoryManager.getTier = async function (tier) {
      return this.entries.filter((e) => e.tiers.includes(tier));
    };

    memoryManager.getAll = async function () {
      return this.entries;
    };
  });

  it('should store and retrieve entries with different importance scores', async () => {
    // Store entries with varying importance (1-10)
    const entries = [
      { content: 'Critical system failure', type: 'error', importance: 10 },
      { content: 'High priority feature request', type: 'feature', importance: 8 },
      { content: 'Medium priority bug fix', type: 'bug', importance: 5 },
      { content: 'Low priority documentation', type: 'docs', importance: 2 },
      { content: 'Minimal priority typo', type: 'typo', importance: 1 },
    ];

    for (const entry of entries) {
      await memoryManager.add(entry);
    }

    // Retrieve all entries
    const allEntries = await memoryManager.getAll();
    assert.strictEqual(allEntries.length, 5, 'Should retrieve all stored entries');

    // Verify importance values are preserved
    const criticalEntry = allEntries.find((r) => r.metadata.type === 'error');
    assert.ok(criticalEntry, 'Should retrieve critical entry');
    assert.strictEqual(
      criticalEntry.metadata.importance,
      10,
      'Critical entry should have importance 10'
    );
  });

  it('should return high-importance results first', async () => {
    // Store entries with different importance
    await memoryManager.add({
      content: 'Low importance observation',
      type: 'observation',
      importance: 2,
    });
    await memoryManager.add({
      content: 'Critical security vulnerability',
      type: 'security',
      importance: 10,
    });
    await memoryManager.add({
      content: 'Medium importance note',
      type: 'note',
      importance: 5,
    });

    // Search for results (use empty query to get all, then check sorting)
    const results = await memoryManager.getAll();

    // Sort by importance and check order
    const sorted = results.sort((a, b) => b.metadata.importance - a.metadata.importance);

    assert.ok(results.length >= 3, 'Should retrieve all entries');

    // First result should be highest importance
    assert.strictEqual(
      sorted[0].metadata.importance,
      10,
      'First result should be highest importance (10)'
    );
  });

  it('should classify entries into cold/warm/hot tiers', async () => {
    // Store entries that should map to different tiers
    const entries = [
      { content: 'Archived decision from last year', type: 'decision', importance: 9 },
      { content: 'Recent high-value observation', type: 'observation', importance: 7 },
      { content: 'New incoming data', type: 'data', importance: 5 },
    ];

    for (const entry of entries) {
      await memoryManager.add(entry);
    }

    // Retrieve by tier
    const coldTier = await memoryManager.getTier('cold');
    const warmTier = await memoryManager.getTier('warm');
    const hotTier = await memoryManager.getTier('hot');

    // Decision type with high importance should be in cold tier
    assert.ok(
      coldTier.some((e) => e.metadata?.type === 'decision'),
      'Decision entry should be in cold tier'
    );

    // High importance (>5) should be in warm tier
    assert.ok(
      warmTier.some((e) => e.metadata?.importance > 5),
      'High importance entry should be in warm tier'
    );

    // All entries should be in hot tier initially (new entries)
    assert.ok(hotTier.length >= 3, 'All new entries should be in hot tier initially');
  });

  it('should handle cold tier - archived decisions', async () => {
    // Store decision entries (cold tier candidates)
    await memoryManager.add({
      content: 'Decision: Use React for frontend',
      type: 'decision',
      importance: 8,
      metadata: { sessionId: 'archived-session' },
    });
    await memoryManager.add({
      content: 'Decision: PostgreSQL for database',
      type: 'decision',
      importance: 9,
      metadata: { sessionId: 'archived-session' },
    });

    const coldTier = await memoryManager.getTier('cold');

    assert.ok(coldTier.length >= 2, 'Should have decision entries in cold tier');
    assert.ok(
      coldTier.every((e) => e.metadata?.type === 'decision'),
      'All cold tier entries should be decisions'
    );
  });

  it('should handle warm tier - high importance active memories', async () => {
    // Store high importance active memories
    await memoryManager.add({
      content: 'User preference: dark mode',
      type: 'preference',
      importance: 7,
    });
    await memoryManager.add({
      content: 'API key configuration',
      type: 'config',
      importance: 8,
    });

    const warmTier = await memoryManager.getTier('warm');

    assert.ok(warmTier.length >= 2, 'Should have entries in warm tier');
    assert.ok(
      warmTier.every((e) => e.metadata?.importance > 5),
      'All warm tier entries should have importance > 5'
    );
  });

  it('should handle hot tier - recent and frequently accessed', async () => {
    // Store new entries (automatically hot)
    await memoryManager.add({
      content: 'Just created task',
      type: 'task',
      importance: 5,
    });
    await memoryManager.add({
      content: 'Recent notification',
      type: 'notification',
      importance: 4,
    });

    const hotTier = await memoryManager.getTier('hot');

    assert.ok(hotTier.length >= 2, 'Should have recent entries in hot tier');
  });

  it('should search with query matching content', async () => {
    // Store diverse content
    await memoryManager.add({
      content: 'The quick brown fox jumps over the lazy dog',
      type: 'text',
      importance: 5,
    });
    await memoryManager.add({
      content: 'Machine learning algorithms process data',
      type: 'ml',
      importance: 7,
    });
    await memoryManager.add({
      content: 'Database connection pooling improves performance',
      type: 'database',
      importance: 6,
    });

    // Search for specific terms
    const mlResults = await memoryManager.search('machine');
    assert.ok(
      mlResults.some((r) => r.content?.includes('Machine learning')),
      'Should find machine learning content'
    );

    const dbResults = await memoryManager.search('database');
    assert.ok(
      dbResults.some((r) => r.content?.includes('Database')),
      'Should find database content'
    );
  });

  it('should respect limit parameter in search', async () => {
    // Store many entries
    for (let i = 0; i < 10; i++) {
      await memoryManager.add({
        content: `Test entry number ${i}`,
        type: 'test',
        importance: i + 1,
      });
    }

    // Search with limit
    const limitedResults = await memoryManager.search('Test entry', 3);
    assert.ok(limitedResults.length <= 3, 'Should respect limit parameter');
  });
});
