import { test, describe, after } from 'node:test';
import assert from 'node:assert';

const LIVE = process.env.ULTRA_DEX_LIVE === '1';

describe('Live Provider E2E', { skip: !LIVE ? 'Set ULTRA_DEX_LIVE=1 to run' : false }, () => {
  const results = [];

  test('openai: chat("ping") returns non-empty response', async (t) => {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) { t.skip('OPENAI_API_KEY not set'); return; }

    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: openaiKey });

    const start = Date.now();
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'ping' }],
    });
    const latency = Date.now() - start;

    const content = response.choices[0]?.message?.content;
    assert.ok(content?.length > 0, 'openai: empty response');
    results.push({ provider: 'openai', latency, success: true });
  });

  test('anthropic: chat("ping") returns non-empty response', async (t) => {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) { t.skip('ANTHROPIC_API_KEY not set'); return; }

    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: anthropicKey });

    const start = Date.now();
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [{ role: 'user', content: 'ping' }],
    });
    const latency = Date.now() - start;

    const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
    assert.ok(content.length > 0, 'anthropic: empty response');
    results.push({ provider: 'anthropic', latency, success: true });
  });

  test('google: chat("ping") returns non-empty response', async (t) => {
    const googleKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!googleKey) { t.skip('GOOGLE_API_KEY not set'); return; }

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(googleKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const start = Date.now();
    const result = await model.generateContent('ping');
    const latency = Date.now() - start;

    const content = result.response.text();
    assert.ok(content.length > 0, 'google: empty response');
    results.push({ provider: 'google', latency, success: true });
  });

  test('fallback: at least one provider is reachable', async (t) => {
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
    if (!hasOpenAI && !hasAnthropic) {
      t.skip('requires OPENAI_API_KEY or ANTHROPIC_API_KEY');
      return;
    }

    let reached = false;

    if (hasAnthropic) {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      try {
        await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'ping' }],
        });
        reached = true;
      } catch { /* try next */ }
    }

    if (!reached && hasOpenAI) {
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      try {
        await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'ping' }],
        });
        reached = true;
      } catch { /* failed */ }
    }

    assert.ok(reached, 'fallback: could not reach any provider');
    results.push({ provider: 'fallback', latency: 0, success: true });
  });

  after(() => {
    if (results.length === 0) return;
    console.log('\n=== Live Provider Latency Table ===');
    console.log('Provider     | Latency (ms) | Status');
    console.log('-------------|--------------|--------');
    for (const r of results) {
      console.log(`${r.provider.padEnd(12)} | ${String(r.latency).padEnd(12)} | ${r.success ? '✓ OK' : '✗ FAIL'}`);
    }
    console.log('===================================\n');
  });
});
