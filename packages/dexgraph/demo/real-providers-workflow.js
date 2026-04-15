#!/usr/bin/env node

/**
 * DexGraph + UltraDex SDK — Real Providers Demo
 *
 * This demo runs a 3-step AI workflow using actual API providers.
 * Each step is dynamically routed by the SDK SmartRouter.
 *
 * Required environment variables (at least one):
 *   OPENAI_API_KEY
 *   ANTHROPIC_API_KEY
 *   GOOGLE_AI_KEY
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... ANTHROPIC_API_KEY=sk-... node demo/real-providers-workflow.js
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { UltraDex } from '@ultra-dex/sdk';
import { DexGraph, parse, Scheduler, UltraDexAdapter } from '@ultra-dex/dexgraph';

// ──────────────────────────────────────────────────────────────────────────────
// BaseProvider Wrappers for Real APIs
// ──────────────────────────────────────────────────────────────────────────────

function createOpenAIProvider(apiKey, model = 'gpt-4o-mini') {
  if (!apiKey) return null;
  return {
    name: 'openai',
    async chat(messages, opts = {}) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: opts.model || model,
          messages,
          max_tokens: 256,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenAI error: ${err}`);
      }
      const data = await res.json();
      const choice = data.choices[0];
      return {
        content: choice.message.content,
        usage: data.usage,
        provider: 'openai',
        model: data.model,
        cost: (data.usage?.totalTokens || 0) * 0.000005,
      };
    },
    async *stream() {
      yield { content: '' };
    },
    async embed() {
      return { embedding: [] };
    },
  };
}

function createAnthropicProvider(apiKey, model = 'claude-3-haiku-20240307') {
  if (!apiKey) return null;
  return {
    name: 'anthropic',
    async chat(messages, opts = {}) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: opts.model || model,
          max_tokens: 256,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Anthropic error: ${err}`);
      }
      const data = await res.json();
      const text = data.content?.[0]?.text || '';
      const usage = {
        prompt_tokens: data.usage?.input_tokens || 0,
        completion_tokens: data.usage?.output_tokens || 0,
        total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      };
      return {
        content: text,
        usage,
        provider: 'anthropic',
        model: data.model,
        cost: usage.total_tokens * 0.000003,
      };
    },
    async *stream() {
      yield { content: '' };
    },
    async embed() {
      return { embedding: [] };
    },
  };
}

function createGoogleProvider(apiKey, model = 'gemini-1.5-flash') {
  if (!apiKey) return null;
  return {
    name: 'google',
    async chat(messages, opts = {}) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${opts.model || model}:generateContent?key=${apiKey}`;
      const contents = messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Google error: ${err}`);
      }
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const usage = data.usageMetadata || {};
      const totalTokens = (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0);
      return {
        content: text,
        usage: {
          prompt_tokens: usage.promptTokenCount || 0,
          completion_tokens: usage.candidatesTokenCount || 0,
          total_tokens: totalTokens,
        },
        provider: 'google',
        model: opts.model || model,
        cost: totalTokens * 0.0000005,
      };
    },
    async *stream() {
      yield { content: '' };
    },
    async embed() {
      return { embedding: [] };
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Workflow Definition
// ──────────────────────────────────────────────────────────────────────────────

const workflowYAML = `
version: dexgraph/v1
name: research-and-summarize
description: Research a topic with real AI providers, analyze, and summarize
tasks:
  - id: research
    role: engineer
    instruction: Research the topic and return 3 key bullet points
    output: research_findings
    context:
      topic: "agentic AI orchestration"

  - id: analyze
    role: architect
    instruction: Analyze the research and identify the most important trend
    depends_on: [research]
    output: analysis
    context: {}

  - id: summarize
    role: reviewer
    instruction: Summarize the analysis into one actionable takeaway
    depends_on: [analyze]
    output: summary
    context: {}
`;

// ──────────────────────────────────────────────────────────────────────────────
// Demo Runner
// ──────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 DexGraph + UltraDex SDK — Real Providers Demo\n');

  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const googleKey = process.env.GOOGLE_AI_KEY;

  const providers = [];
  const openai = createOpenAIProvider(openaiKey);
  const anthropic = createAnthropicProvider(anthropicKey);
  const google = createGoogleProvider(googleKey);

  if (openai) providers.push(openai);
  if (anthropic) providers.push(anthropic);
  if (google) providers.push(google);

  if (providers.length === 0) {
    console.error('❌ No API keys found. Set at least one of:');
    console.error('   OPENAI_API_KEY');
    console.error('   ANTHROPIC_API_KEY');
    console.error('   GOOGLE_AI_KEY');
    process.exit(1);
  }

  console.log(`Active providers: ${providers.map((p) => p.name).join(', ')}\n`);

  const dex = new UltraDex();
  for (const p of providers) {
    dex.registerProvider(p.name, p);
  }

  dex.enableRouter({
    strategy: 'cheapest',
    costPerToken: {
      openai: 0.000005,
      anthropic: 0.000003,
      google: 0.0000005,
    },
  });

  const tmpFile = path.join(os.tmpdir(), 'dexgraph-real-demo.yaml');
  fs.writeFileSync(tmpFile, workflowYAML, 'utf-8');
  const parsed = parse(tmpFile);

  const graph = new DexGraph();
  for (const node of parsed.nodes) graph.addNode(node);
  for (const edge of parsed.edges) graph.addEdge(edge);

  const adapter = new UltraDexAdapter(dex);
  const scheduler = new Scheduler(
    graph,
    {
      dispatch: (node) =>
        adapter.run({
          nodeId: node.id,
          taskType: node.role,
          input: {
            prompt: `Task: ${node.instruction}\nContext: ${JSON.stringify(node.context)}`,
          },
          timeout: 60000,
        }),
    },
    { maxRetries: 1, timeoutMs: 60000, onFailure: 'halt' }
  );

  const result = await scheduler.run();

  console.log('\n✅ Workflow Complete\n');
  console.log('Nodes succeeded:', result.completedNodes.join(', '));
  console.log('Nodes failed:', result.failedNodes.join(', ') || 'none');
  console.log('Duration:', result.duration, 'ms');

  const stats = dex.getRouterStats();
  console.log('\n📊 Provider Routing Breakdown');
  console.table(
    Object.entries(stats).map(([name, s]) => ({
      Provider: name,
      'Requests Routed': s.requestCount,
      'Avg Latency (ms)': s.avgLatency,
      'Total Cost ($)': s.totalCost.toFixed(6),
    }))
  );

  console.log('\n💡 Key Insight');
  const totalCost = Object.values(stats).reduce((sum, s) => sum + s.totalCost, 0);
  const totalRequests = Object.values(stats).reduce((sum, s) => sum + s.requestCount, 0);
  const openaiCostPerToken = 0.000005;
  const avgTokens = totalRequests > 0
    ? Object.values(stats).reduce((sum, s) => sum + s.totalTokens, 0) / totalRequests
    : 0;
  const singleProviderCost = totalRequests * avgTokens * openaiCostPerToken;
  const savings = singleProviderCost > 0
    ? (((singleProviderCost - totalCost) / singleProviderCost) * 100).toFixed(0)
    : '0';
  console.log(`This workflow routed ${totalRequests} requests and cost $${totalCost.toFixed(6)}.`);
  if (singleProviderCost > 0) {
    console.log(`Using OpenAI for all steps would have cost ~$${singleProviderCost.toFixed(6)}.`);
    console.log(`Dynamic routing saved ~${savings}% automatically.`);
  }
  console.log('\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
