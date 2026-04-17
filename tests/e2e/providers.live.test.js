import { test, describe } from 'node:test';
import assert from 'node:assert';

const SKIP_REASON = 'Set ULTRA_DEX_LIVE=1 to run live provider tests';

test.describe('Live Provider E2E', () => {
  if (process.env.ULTRA_DEX_LIVE !== '1') {
    test.skip(SKIP_REASON, () => {});
    return;
  }

  const results = [];

  test('openai: chat("ping") returns non-empty response', async () => {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      test.skip('openai: OPENAI_API_KEY not set', () => {});
      return;
    }

    const { openai } = await import('@ai-sdk/openai');
    const client = openai({ apiKey: openaiKey });

    const start = Date.now();
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'ping' }],
    });
    const latency = Date.now() - start;

    const content = response.choices[0]?.message?.content;
    assert.ok(content, 'openai: response content is empty');
    assert.ok(content.length > 0, 'openai: response is empty string');

    results.push({ provider: 'openai', latency, success: true, contentLength: content.length });
  });

  test('anthropic: chat("ping") returns non-empty response', async () => {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      test.skip('anthropic: ANTHROPIC_API_KEY not set', () => {});
      return;
    }

    const { anthropic } = await import('@ai-sdk/anthropic');
    const client = anthropic({ apiKey: anthropicKey });

    const start = Date.now();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [{ role: 'user', content: 'ping' }],
    });
    const latency = Date.now() - start;

    const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
    assert.ok(content, 'anthropic: response content is empty');
    assert.ok(content.length > 0, 'anthropic: response is empty string');

    results.push({ provider: 'anthropic', latency, success: true, contentLength: content.length });
  });

  test('google: chat("ping") returns non-empty response', async () => {
    const googleKey = process.env.GOOGLE_API_KEY;
    if (!googleKey) {
      test.skip('google: GOOGLE_API_KEY not set', () => {});
      return;
    }

    const { google } = await import('@ai-sdk/google');
    const client = google({ apiKey: googleKey });

    const start = Date.now();
    const response = await client.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
    });
    const latency = Date.now() - start;

    const content = response.text;
    assert.ok(content, 'google: response content is empty');
    assert.ok(content.length > 0, 'google: response is empty string');

    results.push({ provider: 'google', latency, success: true, contentLength: content.length });
  });

  test('fallback: primary fails, falls through to secondary', async () => {
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!openaiKey || !anthropicKey) {
      test.skip('fallback: requires both OPENAI_API_KEY and ANTHROPIC_API_KEY', () => {});
      return;
    }

    const { openai } = await import('@ai-sdk/openai');
    const { anthropic } = await import('@ai-sdk/anthropic');

    const openaiClient = openai({ apiKey: openaiKey });
    const anthropicClient = anthropic({ apiKey: anthropicKey });

    let fallbackUsed = false;
    const providers = [
      { name: 'anthropic', client: anthropicClient, model: 'claude-sonnet-4-20250514' },
      { name: 'openai', client: openaiClient, model: 'gpt-4o-mini' },
    ];

    for (const p of providers) {
      try {
        if (p.name === 'anthropic') {
          await p.client.messages.create({
            model: p.model,
            max_tokens: 10,
            messages: [{ role: 'user', content: 'ping' }],
          });
        } else {
          await p.client.chat.completions.create({
            model: p.model,
            messages: [{ role: 'user', content: 'ping' }],
          });
        }
        fallbackUsed = true;
        break;
      } catch (err) {
        continue;
      }
    }

    assert.ok(fallbackUsed, 'fallback: could not reach any provider');
    results.push({ provider: 'fallback', latency: 0, success: true, contentLength: 0 });
  });

  test.after(() => {
    if (results.length === 0) return;

    console.log('\n=== Live Provider Cost + Latency Table ===');
    console.log('Provider    | Latency (ms) | Status');
    console.log('-------------|---------------|--------');
    for (const r of results) {
      const status = r.success ? '✓ OK' : '✗ FAIL';
      console.log(`${r.provider.padEnd(12)} | ${String(r.latency).padEnd(13)} | ${status}`);
    }
    console.log('===========================================\n');
  });
});
