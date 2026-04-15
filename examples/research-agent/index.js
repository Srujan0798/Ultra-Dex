#!/usr/bin/env node

/**
 * Ultra-Dex Research Agent Example
 *
 * This example demonstrates:
 * 1. @ultra-dex/sdk — SmartRouter that dynamically picks the cheapest AI provider
 * 2. @ultra-dex/dexgraph — Orchestrates a 3-step research workflow as a DAG
 *
 * No API keys needed — uses simulated providers.
 */

import { UltraDex } from '@ultra-dex/sdk';
import { DexGraph, parse, Scheduler, UltraDexAdapter } from '@ultra-dex/dexgraph';

// ──────────────────────────────────────────────────────────────────────────────
// 1. Create simulated AI providers with different cost/latency profiles
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
    async *stream() {
      yield { content: `[${name}] ${messages.at(-1)?.content ?? ''}` };
    },
    async embed() {
      return { embedding: [0.1, 0.2, 0.3] };
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. Set up the Ultra-Dex SDK with SmartRouter
// ──────────────────────────────────────────────────────────────────────────────

const dex = new UltraDex({ defaultProvider: 'openai' });

const profiles = [
  { name: 'openai', cost: 0.005, latency: 150, failRate: 0 },
  { name: 'anthropic', cost: 0.003, latency: 120, failRate: 0 },
  { name: 'google', cost: 0.001, latency: 200, failRate: 0 },
];

for (const p of profiles) {
  dex.registerProvider(p.name, createMockProvider(p.name, p.cost, p.latency, p.failRate));
}

// Use the CHEAPEST routing strategy — the SDK will route each call to the
// provider with the lowest estimated cost
dex.enableRouter({
  strategy: 'cheapest',
  costPerToken: {
    openai: 0.005,
    anthropic: 0.003,
    google: 0.001,
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. Load the DexGraph workflow from YAML
// ──────────────────────────────────────────────────────────────────────────────

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workflowPath = join(__dirname, 'workflow.yaml');
const parsed = parse(workflowPath);

const graph = new DexGraph();
for (const node of parsed.nodes) graph.addNode(node);
for (const edge of parsed.edges) graph.addEdge(edge);

// ──────────────────────────────────────────────────────────────────────────────
// 4. Connect DexGraph to the SDK via UltraDexAdapter
// ──────────────────────────────────────────────────────────────────────────────

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
        timeout: 30000,
      }),
  },
  { maxRetries: 1, timeoutMs: 30000, onFailure: 'halt' }
);

// ──────────────────────────────────────────────────────────────────────────────
// 5. Run the workflow
// ──────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 Ultra-Dex Research Agent Example\n');
  const executionOrder = (() => {
    const visited = new Set();
    const order = [];
    function visit(nodeId) {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      for (const dep of graph.getDependencies(nodeId)) visit(dep);
      order.push(nodeId);
    }
    for (const node of graph.getAllNodes()) visit(node.id);
    return order;
  })();

  console.log('Workflow:', parsed.metadata.name);
  console.log('Description:', parsed.metadata.description);
  console.log('Execution order:', executionOrder.join(' → '));
  console.log('\nRunning with CHEAPEST routing strategy...\n');

  const result = await scheduler.run();

  console.log('✅ Workflow Complete\n');
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

  const totalCost = Object.values(stats).reduce((sum, s) => sum + s.totalCost, 0);
  const totalRequests = Object.values(stats).reduce((sum, s) => sum + s.requestCount, 0);
  const tokensPerRequest = 15;
  const openaiCostPerToken = 0.005;
  const singleProviderCost = totalRequests * tokensPerRequest * openaiCostPerToken;
  const savings = singleProviderCost > 0
    ? (((singleProviderCost - totalCost) / singleProviderCost) * 100).toFixed(0)
    : '0';

  console.log('\n💡 Cost Optimization');
  console.log(`This workflow routed ${totalRequests} requests and cost $${totalCost.toFixed(4)}.`);
  console.log(`Using OpenAI for all steps would have cost $${singleProviderCost.toFixed(4)}.`);
  console.log(`Dynamic routing saved ~${savings}% automatically.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
