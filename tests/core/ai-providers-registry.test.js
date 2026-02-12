import assert from 'node:assert/strict';
import test from 'node:test';
import { createProvider, listProviders } from '../../src/services/ai-providers/index.js';

test('ai providers registry lists expected baseline providers', () => {
  const providers = listProviders();

  assert.ok(Array.isArray(providers));
  assert.ok(providers.includes('openai'));
  assert.ok(providers.includes('anthropic'));
  assert.ok(providers.includes('google'));
});

test('ai providers registry can instantiate openai provider', async () => {
  const provider = await createProvider('openai', { apiKey: 'test-key' });

  assert.equal(provider.name, 'openai');
  assert.equal(typeof provider.chat, 'function');
  assert.equal(typeof provider.stream, 'function');
  assert.equal(typeof provider.embed, 'function');
});

test('ai providers registry rejects unknown provider', async () => {
  await assert.rejects(
    async () => createProvider('unknown-provider', {}),
    /Unknown provider: unknown-provider/
  );
});
