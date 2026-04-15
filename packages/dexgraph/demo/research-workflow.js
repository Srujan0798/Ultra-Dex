#!/usr/bin/env node

/**
 * DexGraph + UltraDex SDK Integration Demo
 *
 * This demo shows a 3-step AI workflow where DexGraph orchestrates
 * the DAG and the SDK's SmartRouter dynamically picks the cheapest
 * provider for each step.
 *
 * No API keys needed — uses simulated providers.
 */

import { UltraDex } from '@ultra-dex/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  DexGraph,
  parse,
  Scheduler,
  UltraDexAdapter,
  nullLogger,
} from '@ultra-dex/dexgraph';

// ──────────────────────────────────────────────────────────────────────────────
// Simulated AI Providers
// ──────────────────────────────────────────────────────────────────────────────

function createMockProvider(name, costPerRequest, latencyMs, failRate = 0) {
  return {
    name,
    async chat(messages, opts = {}) {
      const shouldFail = Math.random() < failRate;
      await new Promise((r) => setTimeout(r, latencyMs));
      if (shouldFail) {
        throw new Error(`${name}: simulated failure`);
      }
      return {
        content: `[${name}] ${messages.at(-1)?.content ?? ''}`,
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        provider: name,
        model: opts.model || 'mock-model',
        cost: costPerRequest,
      };
    },
    async *stream(messages, opts = {}) {
      yield { content: `[${name}] ${messages.at(-1)?.content ?? ''}` };
    },
    async embed(text, opts = {}) {
      return { embedding: [0.1, 0.2, 0.3] };
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Workflow Definition (YAML)
// ──────────────────────────────────────────────────────────────────────────────

const workflowYAML = `
version: dexgraph/v1
name: research-and-summarize
description: Research a topic, analyze findings, and summarize
tasks:
  - id: research
    role: engineer
    instruction: Gather key facts about the topic
    output: research_findings
    context:
      topic: "agentic AI orchestration"

  - id: analyze
    role: architect
    instruction: Analyze the research findings and identify trends
    depends_on: [research]
    output: analysis
    context: {}

  - id: summarize
    role: reviewer
    instruction: Summarize the analysis into 3 bullet points
    depends_on: [analyze]
    output: summary
    context: {}
`;

// ──────────────────────────────────────────────────────────────────────────────
// Demo Runner
// ──────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 DexGraph + UltraDex SDK Demo\n');
  console.log('Orchestrating a 3-step workflow with dynamic provider routing...\n');

  // 1. Set up SDK with 3 simulated providers
  const dex = new UltraDex({ defaultProvider: 'openai' });

  const profiles = [
    { name: 'openai', cost: 0.005, latency: 150, failRate: 0 },
    { name: 'anthropic', cost: 0.003, latency: 120, failRate: 0 },
    { name: 'google', cost: 0.001, latency: 200, failRate: 0 },
  ];

  for (const p of profiles) {
    dex.registerProvider(p.name, createMockProvider(p.name, p.cost, p.latency, p.failRate));
  }

  // Enable SmartRouter with CHEAPEST strategy
  dex.enableRouter({
    strategy: 'cheapest',
    costPerToken: {
      openai: 0.005,
      anthropic: 0.003,
      google: 0.001,
    },
  });

  // 2. Set up DexGraph workflow
  const tmpFile = path.join(os.tmpdir(), 'dexgraph-demo-workflow.yaml');
  fs.writeFileSync(tmpFile, workflowYAML, 'utf-8');
  const parsed = parse(tmpFile);

  const graph = new DexGraph();
  for (const node of parsed.nodes) {
    graph.addNode(node);
  }
  for (const edge of parsed.edges) {
    graph.addEdge(edge);
  }

  // 3. Create the adapter that bridges DexGraph → SDK
  const adapter = new UltraDexAdapter(dex);

  // 4. Run the workflow
  const scheduler = new Scheduler(graph, {
    dispatch: (node) => adapter.run({
      nodeId: node.id,
      taskType: node.role,
      input: {
        prompt: `Task: ${node.instruction}\nContext: ${JSON.stringify(node.context)}`,
      },
      timeout: 30000,
    }),
  }, { maxRetries: 1, timeoutMs: 30000, onFailure: 'halt' });

  const result = await scheduler.run();

  // 5. Show results
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
      'Total Cost ($)': s.totalCost.toFixed(4),
    }))
  );

  console.log('\n💡 Key Insight');
  const totalCost = Object.values(stats).reduce((sum, s) => sum + s.totalCost, 0);
  const totalRequests = Object.values(stats).reduce((sum, s) => sum + s.requestCount, 0);
  const tokensPerRequest = 15; // mock provider: 10 prompt + 5 completion
  const openaiCostPerToken = 0.005;
  const singleProviderCost = totalRequests * tokensPerRequest * openaiCostPerToken;
  const savings = singleProviderCost > 0
    ? (((singleProviderCost - totalCost) / singleProviderCost) * 100).toFixed(0)
    : '0';
  console.log(`This workflow routed ${totalRequests} requests and cost $${totalCost.toFixed(4)}.`);
  console.log(`Using OpenAI for all steps would have cost $${singleProviderCost.toFixed(4)}.`);
  console.log(`Dynamic routing saved ~${savings}% automatically.`);
  console.log('\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
