/**
 * Tests for Memory Compression Utilities
 *
 * Critical performance module - ensures efficient memory summarization
 */

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeMemory, compressEntries } from '../../lib/memory/compression.js';

describe('summarizeMemory - Basic Functionality', () => {
  test('should summarize single entry', () => {
    const entries = [
      { content: 'This is a test. It has multiple sentences. Here is another one.' }
    ];

    const summary = summarizeMemory(entries);

    assert.ok(summary.includes('This is a test'));
    assert.ok(summary.includes('It has multiple sentences'));
  });

  test('should limit summary to 5 sentences', () => {
    const entries = [
      {
        content: 'Sentence 1. Sentence 2. Sentence 3. Sentence 4. Sentence 5. Sentence 6. Sentence 7.'
      }
    ];

    const summary = summarizeMemory(entries);
    const sentenceCount = summary.split('.').filter(Boolean).length;

    // Should have 5 sentences + ellipsis indicator
    assert.ok(sentenceCount <= 5);
    assert.ok(summary.includes('...'));
  });

  test('should handle multiple entries', () => {
    const entries = [
      { content: 'First entry content.' },
      { content: 'Second entry content.' },
      { text: 'Third entry text field.' }
    ];

    const summary = summarizeMemory(entries);

    assert.ok(summary.includes('First entry'));
    assert.ok(summary.includes('Second entry'));
    assert.ok(summary.includes('Third entry'));
  });

  test('should use text field if content is missing', () => {
    const entries = [
      { text: 'Using text field instead.' }
    ];

    const summary = summarizeMemory(entries);

    assert.strictEqual(summary, 'Using text field instead');
  });

  test('should handle newlines as sentence separators', () => {
    const entries = [
      { content: 'Line one\nLine two\nLine three' }
    ];

    const summary = summarizeMemory(entries);

    assert.ok(summary.includes('Line one'));
    assert.ok(summary.includes('Line two'));
    assert.ok(summary.includes('Line three'));
  });
});

describe('summarizeMemory - Edge Cases', () => {
  test('should handle empty entries array', () => {
    const summary = summarizeMemory([]);

    assert.strictEqual(summary, '');
  });

  test('should handle undefined input', () => {
    const summary = summarizeMemory(undefined);

    assert.strictEqual(summary, '');
  });

  test('should throw error for null input', () => {
    assert.throws(
      () => summarizeMemory(null),
      TypeError,
      'Should throw TypeError when given null'
    );
  });

  test('should handle entries with no content or text field', () => {
    const entries = [
      { id: '123' },
      { timestamp: Date.now() }
    ];

    const summary = summarizeMemory(entries);

    assert.strictEqual(summary, '');
  });

  test('should handle empty strings', () => {
    const entries = [
      { content: '' },
      { text: '' }
    ];

    const summary = summarizeMemory(entries);

    assert.strictEqual(summary, '');
  });

  test('should handle whitespace-only content', () => {
    const entries = [
      { content: '   \n\t   ' }
    ];

    const summary = summarizeMemory(entries);

    assert.strictEqual(summary, '');
  });

  test('should trim whitespace from sentences', () => {
    const entries = [
      { content: '  First sentence  .  Second sentence  .' }
    ];

    const summary = summarizeMemory(entries);

    assert.strictEqual(summary, 'First sentence. Second sentence');
  });

  test('should handle single sentence without ellipsis', () => {
    const entries = [
      { content: 'Just one sentence.' }
    ];

    const summary = summarizeMemory(entries);

    assert.strictEqual(summary, 'Just one sentence');
    assert.ok(!summary.includes('...'));
  });

  test('should handle exactly 5 sentences without ellipsis', () => {
    const entries = [
      { content: 'One. Two. Three. Four. Five.' }
    ];

    const summary = summarizeMemory(entries);

    assert.strictEqual(summary, 'One. Two. Three. Four. Five');
    assert.ok(!summary.includes('...'));
  });

  test('should handle very long sentences', () => {
    const longSentence = 'word '.repeat(1000) + '.';
    const entries = [
      { content: longSentence }
    ];

    const summary = summarizeMemory(entries);

    assert.ok(summary.includes('word'));
  });

  test('should handle special characters', () => {
    const entries = [
      { content: 'Special chars: @#$%^&*(). More text here.' }
    ];

    const summary = summarizeMemory(entries);

    assert.ok(summary.includes('Special chars'));
  });

  test('should handle unicode characters', () => {
    const entries = [
      { content: 'Unicode: café résumé naïve 日本語. More text.' }
    ];

    const summary = summarizeMemory(entries);

    assert.ok(summary.includes('Unicode'));
  });
});

describe('compressEntries - Basic Functionality', () => {
  test('should compress array of entries', () => {
    const entries = [
      {
        id: 'entry-1',
        content: 'First entry content. More details.',
        createdAt: '2026-01-01T00:00:00Z',
        extraField: 'should be removed'
      },
      {
        id: 'entry-2',
        content: 'Second entry content. Additional info.',
        createdAt: '2026-01-02T00:00:00Z'
      }
    ];

    const compressed = compressEntries(entries);

    assert.strictEqual(compressed.length, 2);
    assert.strictEqual(compressed[0].id, 'entry-1');
    assert.strictEqual(compressed[1].id, 'entry-2');
  });

  test('should include only id, summary, and createdAt', () => {
    const entries = [
      {
        id: 'test',
        content: 'Test content.',
        createdAt: '2026-01-01',
        type: 'decision',
        source: 'user',
        metadata: { key: 'value' }
      }
    ];

    const compressed = compressEntries(entries);

    assert.strictEqual(compressed[0].id, 'test');
    assert.ok(compressed[0].summary);
    assert.strictEqual(compressed[0].createdAt, '2026-01-01');

    // Extra fields should be removed
    assert.strictEqual(compressed[0].type, undefined);
    assert.strictEqual(compressed[0].source, undefined);
    assert.strictEqual(compressed[0].metadata, undefined);
  });

  test('should generate summary for each entry', () => {
    const entries = [
      {
        id: 'entry-1',
        content: 'First entry. Has content.',
        createdAt: '2026-01-01'
      }
    ];

    const compressed = compressEntries(entries);

    assert.ok(compressed[0].summary);
    assert.ok(compressed[0].summary.includes('First entry'));
  });

  test('should preserve entry order', () => {
    const entries = [
      { id: 'first', content: 'First.', createdAt: '2026-01-01' },
      { id: 'second', content: 'Second.', createdAt: '2026-01-02' },
      { id: 'third', content: 'Third.', createdAt: '2026-01-03' }
    ];

    const compressed = compressEntries(entries);

    assert.strictEqual(compressed[0].id, 'first');
    assert.strictEqual(compressed[1].id, 'second');
    assert.strictEqual(compressed[2].id, 'third');
  });
});

describe('compressEntries - Edge Cases', () => {
  test('should handle empty array', () => {
    const compressed = compressEntries([]);

    assert.strictEqual(compressed.length, 0);
  });

  test('should handle undefined input', () => {
    const compressed = compressEntries(undefined);

    assert.strictEqual(compressed.length, 0);
  });

  test('should throw error for null input', () => {
    assert.throws(
      () => compressEntries(null),
      TypeError,
      'Should throw TypeError when given null'
    );
  });

  test('should handle entries with missing fields', () => {
    const entries = [
      { id: 'test-1' },
      { id: 'test-2', content: 'Has content.' }
    ];

    const compressed = compressEntries(entries);

    assert.strictEqual(compressed.length, 2);
    assert.strictEqual(compressed[0].id, 'test-1');
    assert.strictEqual(compressed[0].summary, ''); // Empty content = empty summary
  });

  test('should handle entries without createdAt', () => {
    const entries = [
      { id: 'test', content: 'Content without timestamp.' }
    ];

    const compressed = compressEntries(entries);

    assert.strictEqual(compressed[0].id, 'test');
    assert.strictEqual(compressed[0].createdAt, undefined);
  });

  test('should handle large arrays', () => {
    const entries = [];
    for (let i = 0; i < 1000; i++) {
      entries.push({
        id: `entry-${i}`,
        content: `Content ${i}.`,
        createdAt: `2026-01-${String(i % 30 + 1).padStart(2, '0')}`
      });
    }

    const compressed = compressEntries(entries);

    assert.strictEqual(compressed.length, 1000);
    assert.strictEqual(compressed[0].id, 'entry-0');
    assert.strictEqual(compressed[999].id, 'entry-999');
  });

  test('should handle entries with very long content', () => {
    const entries = [
      {
        id: 'long',
        content: 'Sentence. '.repeat(100),
        createdAt: '2026-01-01'
      }
    ];

    const compressed = compressEntries(entries);

    assert.strictEqual(compressed[0].id, 'long');
    assert.ok(compressed[0].summary);
    // Summary should be limited to 5 sentences
    assert.ok(compressed[0].summary.includes('...'));
  });

  test('should handle entries with special characters in id', () => {
    const entries = [
      {
        id: 'test-id_123.456@special',
        content: 'Content.',
        createdAt: '2026-01-01'
      }
    ];

    const compressed = compressEntries(entries);

    assert.strictEqual(compressed[0].id, 'test-id_123.456@special');
  });

  test('should handle entries with empty content', () => {
    const entries = [
      { id: 'empty', content: '', createdAt: '2026-01-01' }
    ];

    const compressed = compressEntries(entries);

    assert.strictEqual(compressed[0].id, 'empty');
    assert.strictEqual(compressed[0].summary, '');
  });
});

describe('compression - Integration', () => {
  test('should compress and maintain essential information', () => {
    const entries = [
      {
        id: 'decision-1',
        type: 'decision',
        content: 'Decided to use React for the frontend. This provides better component reusability. Team has React experience.',
        createdAt: '2026-01-15T10:30:00Z',
        source: 'architect',
        metadata: { priority: 'high' }
      },
      {
        id: 'constraint-1',
        type: 'constraint',
        content: 'Must support IE11. Budget is limited to $50k. Deadline is Q2 2026.',
        createdAt: '2026-01-16T14:20:00Z',
        source: 'product-manager'
      }
    ];

    const compressed = compressEntries(entries);

    // Should preserve IDs
    assert.strictEqual(compressed[0].id, 'decision-1');
    assert.strictEqual(compressed[1].id, 'constraint-1');

    // Should preserve timestamps
    assert.strictEqual(compressed[0].createdAt, '2026-01-15T10:30:00Z');
    assert.strictEqual(compressed[1].createdAt, '2026-01-16T14:20:00Z');

    // Should generate meaningful summaries
    assert.ok(compressed[0].summary.includes('React'));
    assert.ok(compressed[1].summary.includes('IE11') || compressed[1].summary.includes('Budget'));

    // Should remove extra metadata
    assert.strictEqual(compressed[0].type, undefined);
    assert.strictEqual(compressed[0].source, undefined);
    assert.strictEqual(compressed[0].metadata, undefined);
  });

  test('should significantly reduce entry size', () => {
    const entries = [
      {
        id: 'large-entry',
        content: 'This is a very long entry. '.repeat(50),
        createdAt: '2026-01-01',
        type: 'log',
        source: 'system',
        metadata: { tags: ['tag1', 'tag2', 'tag3'], data: { nested: { deep: 'value' } } },
        relations: ['rel-1', 'rel-2'],
        timestamp: Date.now(),
        version: '1.0.0'
      }
    ];

    const compressed = compressEntries(entries);

    // Compressed entry should only have 3 fields
    const compressedKeys = Object.keys(compressed[0]);
    assert.strictEqual(compressedKeys.length, 3);
    assert.ok(compressedKeys.includes('id'));
    assert.ok(compressedKeys.includes('summary'));
    assert.ok(compressedKeys.includes('createdAt'));
  });
});
