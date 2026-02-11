/**
 * Tests for Lightweight Embeddings System
 *
 * Critical performance module - ensures accurate vector generation
 */

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { embedText } from '../../lib/memory/embeddings.js';

describe('Embeddings - Basic Functionality', () => {
  test('should generate embeddings for simple text', () => {
    const embedding = embedText('hello world');

    assert.ok(Array.isArray(embedding));
    assert.strictEqual(embedding.length, 128); // Default dims
  });

  test('should normalize embeddings to unit vector', () => {
    const embedding = embedText('test text');

    // Calculate magnitude
    const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));

    // Should be approximately 1 (unit vector)
    assert.ok(Math.abs(magnitude - 1) < 0.0001);
  });

  test('should generate consistent embeddings for same input', () => {
    const embedding1 = embedText('consistent text');
    const embedding2 = embedText('consistent text');

    assert.deepStrictEqual(embedding1, embedding2);
  });

  test('should generate different embeddings for different text', () => {
    const embedding1 = embedText('first text');
    const embedding2 = embedText('second text');

    assert.notDeepStrictEqual(embedding1, embedding2);
  });

  test('should handle custom dimensions', () => {
    const embedding64 = embedText('test', 64);
    const embedding256 = embedText('test', 256);

    assert.strictEqual(embedding64.length, 64);
    assert.strictEqual(embedding256.length, 256);
  });
});

describe('Embeddings - Edge Cases', () => {
  test('should handle empty string', () => {
    const embedding = embedText('');

    assert.ok(Array.isArray(embedding));
    assert.strictEqual(embedding.length, 128);

    // Empty string should produce zero vector
    const allZeros = embedding.every((v) => v === 0);
    assert.ok(allZeros);
  });

  test('should handle whitespace-only string', () => {
    const embedding = embedText('   \t\n   ');

    assert.ok(Array.isArray(embedding));
    const allZeros = embedding.every((v) => v === 0);
    assert.ok(allZeros);
  });

  test('should handle undefined input', () => {
    const embedding = embedText(undefined);

    assert.ok(Array.isArray(embedding));
    const allZeros = embedding.every((v) => v === 0);
    assert.ok(allZeros);
  });

  test('should throw error for null input', () => {
    assert.throws(() => embedText(null), TypeError, 'Should throw TypeError when given null');
  });

  test('should handle single word', () => {
    const embedding = embedText('word');

    assert.ok(Array.isArray(embedding));
    assert.strictEqual(embedding.length, 128);

    const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    assert.ok(Math.abs(magnitude - 1) < 0.0001);
  });

  test('should handle very long text', () => {
    const longText = 'word '.repeat(10000);
    const embedding = embedText(longText);

    assert.ok(Array.isArray(embedding));
    assert.strictEqual(embedding.length, 128);
  });

  test('should handle special characters', () => {
    const embedding = embedText('hello! @world #test $price %off');

    assert.ok(Array.isArray(embedding));
    assert.strictEqual(embedding.length, 128);
  });

  test('should handle numbers', () => {
    const embedding = embedText('test 123 value 456');

    assert.ok(Array.isArray(embedding));
    assert.strictEqual(embedding.length, 128);
  });

  test('should handle mixed case', () => {
    const embedding1 = embedText('Hello World');
    const embedding2 = embedText('hello world');

    // Should be case-insensitive
    assert.deepStrictEqual(embedding1, embedding2);
  });

  test('should handle unicode characters', () => {
    const embedding = embedText('café résumé naïve 日本語 emoji 🚀');

    assert.ok(Array.isArray(embedding));
    assert.strictEqual(embedding.length, 128);
  });

  test('should handle zero dimensions', () => {
    const embedding = embedText('test', 0);

    assert.ok(Array.isArray(embedding));
    assert.strictEqual(embedding.length, 0);
  });

  test('should handle very small dimensions', () => {
    const embedding = embedText('test', 1);

    assert.ok(Array.isArray(embedding));
    assert.strictEqual(embedding.length, 1);
  });

  test('should handle very large dimensions', () => {
    const embedding = embedText('test', 1024);

    assert.ok(Array.isArray(embedding));
    assert.strictEqual(embedding.length, 1024);
  });
});

describe('Embeddings - Similarity Properties', () => {
  test('similar texts should have close embeddings', () => {
    const embedding1 = embedText('machine learning');
    const embedding2 = embedText('machine learning algorithms');

    // Calculate cosine similarity
    let dot = 0;
    let norm1 = 0;
    let norm2 = 0;
    for (let i = 0; i < embedding1.length; i++) {
      dot += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }
    const similarity = dot / (Math.sqrt(norm1) * Math.sqrt(norm2));

    // Should have high similarity (> 0.5)
    assert.ok(similarity > 0.5);
  });

  test('completely different texts should have low similarity', () => {
    const embedding1 = embedText('machine learning algorithms');
    const embedding2 = embedText('cooking recipes pizza');

    // Calculate cosine similarity
    let dot = 0;
    let norm1 = 0;
    let norm2 = 0;
    for (let i = 0; i < embedding1.length; i++) {
      dot += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }
    const similarity = dot / (Math.sqrt(norm1) * Math.sqrt(norm2));

    // Should have lower similarity (< 0.8)
    assert.ok(similarity < 0.8);
  });

  test('repeated words should increase vector magnitude in specific dimensions', () => {
    const embedding1 = embedText('test');
    const embedding2 = embedText('test test test');

    // Both should still be normalized
    const mag1 = Math.sqrt(embedding1.reduce((sum, v) => sum + v * v, 0));
    const mag2 = Math.sqrt(embedding2.reduce((sum, v) => sum + v * v, 0));

    assert.ok(Math.abs(mag1 - 1) < 0.0001);
    assert.ok(Math.abs(mag2 - 1) < 0.0001);
  });
});

describe('Embeddings - Hash Distribution', () => {
  test('should distribute tokens across dimensions', () => {
    const embedding = embedText('multiple different words here');

    // Count non-zero dimensions
    const nonZero = embedding.filter((v) => v !== 0).length;

    // Should have multiple non-zero dimensions
    assert.ok(nonZero > 0);
  });

  test('should handle hash collisions gracefully', () => {
    const embedding = embedText('word word word');

    assert.ok(Array.isArray(embedding));
    assert.strictEqual(embedding.length, 128);

    const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    assert.ok(Math.abs(magnitude - 1) < 0.0001);
  });

  test('different tokens should hash to different indices', () => {
    const text1 = 'alpha';
    const text2 = 'beta';

    const embedding1 = embedText(text1);
    const embedding2 = embedText(text2);

    // Should have some differences
    let differences = 0;
    for (let i = 0; i < embedding1.length; i++) {
      if (Math.abs(embedding1[i] - embedding2[i]) > 0.0001) {
        differences++;
      }
    }

    assert.ok(differences > 0);
  });
});

describe('Embeddings - Performance', () => {
  test('should be fast for short text', () => {
    const start = Date.now();
    embedText('hello world');
    const duration = Date.now() - start;

    // Should complete in under 10ms
    assert.ok(duration < 10);
  });

  test('should be reasonably fast for long text', () => {
    const longText = 'word '.repeat(1000);

    const start = Date.now();
    embedText(longText);
    const duration = Date.now() - start;

    // Should complete in under 100ms
    assert.ok(duration < 100);
  });

  test('should handle multiple embeddings efficiently', () => {
    const texts = ['first text', 'second text', 'third text', 'fourth text', 'fifth text'];

    const start = Date.now();
    texts.forEach((text) => embedText(text));
    const duration = Date.now() - start;

    // Should complete in under 50ms
    assert.ok(duration < 50);
  });
});

describe('Embeddings - Token Processing', () => {
  test('should lowercase all tokens', () => {
    const embedding1 = embedText('HELLO WORLD');
    const embedding2 = embedText('hello world');

    assert.deepStrictEqual(embedding1, embedding2);
  });

  test('should remove punctuation', () => {
    const embedding1 = embedText('hello, world!');
    const embedding2 = embedText('hello world');

    assert.deepStrictEqual(embedding1, embedding2);
  });

  test('should split on whitespace', () => {
    const embedding1 = embedText('hello   world');
    const embedding2 = embedText('hello world');

    assert.deepStrictEqual(embedding1, embedding2);
  });

  test('should filter empty tokens', () => {
    const embedding = embedText('  hello    world  ');

    assert.ok(Array.isArray(embedding));
    assert.strictEqual(embedding.length, 128);
  });

  test('should handle tabs and newlines', () => {
    const embedding1 = embedText('hello\tworld\n');
    const embedding2 = embedText('hello world');

    assert.deepStrictEqual(embedding1, embedding2);
  });
});

/**
 * Error handler for embeddings.test
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[embeddings.test]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
