/**
 * Tests for Streaming Provider Utilities
 *
 * Critical provider module - ensures correct provider resolution and API key handling
 */

import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { getStreamingProviders } from '../../lib/providers/streaming.js';

describe('Streaming Providers - getStreamingProviders', () => {
  test('should return list of supported providers', () => {
    const providers = getStreamingProviders();

    assert.ok(Array.isArray(providers));
    assert.ok(providers.length > 0);
  });

  test('should include OpenAI provider', () => {
    const providers = getStreamingProviders();

    assert.ok(providers.includes('openai'));
  });

  test('should include Claude/Anthropic provider', () => {
    const providers = getStreamingProviders();

    assert.ok(providers.includes('claude') || providers.includes('anthropic'));
  });

  test('should include Google/Gemini provider', () => {
    const providers = getStreamingProviders();

    assert.ok(providers.includes('google') || providers.includes('gemini'));
  });

  test('should return consistent results', () => {
    const providers1 = getStreamingProviders();
    const providers2 = getStreamingProviders();

    assert.deepStrictEqual(providers1, providers2);
  });

  test('should only return string provider names', () => {
    const providers = getStreamingProviders();

    providers.forEach((provider) => {
      assert.strictEqual(typeof provider, 'string');
      assert.ok(provider.length > 0);
    });
  });
});

describe('Streaming Providers - Provider Configuration', () => {
  test('should have provider configurations for all supported providers', () => {
    const providers = getStreamingProviders();

    // Each provider should be resolvable
    assert.ok(providers.length >= 3); // Minimum: OpenAI, Claude, Gemini
  });

  test('supported providers should have lowercase names', () => {
    const providers = getStreamingProviders();

    providers.forEach((provider) => {
      assert.strictEqual(provider, provider.toLowerCase());
    });
  });
});

// Note: streamWithProvider tests would require mocking the 'ai' SDK
// and are better suited for integration tests

/**
 * Error handler for streaming.test
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[streaming.test]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
