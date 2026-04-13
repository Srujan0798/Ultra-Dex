#!/usr/bin/env node

import { UltraDex } from '../dist/index.js';

// Simulated providers with different cost/latency profiles
function createMockProvider(name, costPerRequest, latencyMs, failRate = 0) {
  return {
    name,
    async chat(messages, opts = {}) {
      const shouldFail = Math.random() < failRate;
      await new Promise(r => setTimeout(r, latencyMs));
      if (shouldFail) {
        throw new Error(`${name}: simulated failure`);
      }
      return {
        content: `echo: ${messages.at(-1)?.content ?? ''}`,
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        provider: name,
        model: opts.model || 'mock-model',
        cost: costPerRequest,
      };
    },
    async *stream(messages, opts = {}) {
      yield { content: `echo: ${messages.at(-1)?.content ?? ''}` };
    },
    async embed(text, opts = {}) {
      return { embedding: [0.1, 0.2, 0.3] };
    },
  };
}

async function runDemo() {
  console.log('\n🚀 @ultra-dex/sdk Demo\n');

  const dex = new UltraDex({ defaultProvider: 'premium' });

  // Provider profiles: name, cost, latency, failRate
  const profiles = [
    { name: 'premium', cost: 0.005, latency: 150, failRate: 0 },
    { name: 'standard', cost: 0.003, latency: 120, failRate: 0 },
    { name: 'budget', cost: 0.001, latency: 200, failRate: 0 },
  ];

  for (const p of profiles) {
    dex.registerProvider(p.name, createMockProvider(p.name, p.cost, p.latency, p.failRate));
  }

  // Enable router with cheapest strategy
  dex.enableRouter({
    strategy: 'cheapest',
    costPerToken: {
      premium: 0.005,
      standard: 0.003,
      budget: 0.001,
    },
  });

  const totalRequests = 20;
  const messages = [{ role: 'user', content: 'Hello' }];

  console.log(`Routing ${totalRequests} requests using the CHEAPEST strategy...\n`);

  for (let i = 0; i < totalRequests; i++) {
    try {
      await dex.chat(messages);
    } catch (err) {
      // ignore for demo
    }
  }

  const stats = dex.getRouterStats();

  // Build table
  const rows = Object.entries(stats).map(([name, s]) => ({
    Provider: name,
    Routed: s.requestCount,
    'Avg Latency (ms)': s.avgLatency,
    'Total Cost ($)': s.totalCost.toFixed(4),
    'Error Rate (%)': (s.errorRate * 100).toFixed(1),
  }));

  // Print simple aligned table
  const headers = Object.keys(rows[0]);
  const colWidths = headers.map((h) =>
    Math.max(h.length, ...rows.map((r) => String(r[h]).length))
  );

  function printRow(row) {
    const cells = headers.map((h, i) => String(row[h]).padEnd(colWidths[i]));
    console.log('  ' + cells.join('  '));
  }

  printRow(Object.fromEntries(headers.map((h) => [h, h])));
  console.log('  ' + headers.map((h, i) => '-'.repeat(colWidths[i])).join('  '));
  rows.forEach(printRow);

  // Savings calculation vs always using the most expensive provider
  const tokensPerRequest = 15; // 10 prompt + 5 completion
  const mostExpensivePerToken = Math.max(...profiles.map((p) => p.cost));
  const actualTotal = Object.values(stats).reduce((sum, s) => sum + s.totalCost, 0);
  const hypotheticalTotal = totalRequests * tokensPerRequest * mostExpensivePerToken;
  const savings = hypotheticalTotal - actualTotal;
  const savingsPercent = (savings / hypotheticalTotal) * 100;

  console.log(`\n💰 With 'cheapest' strategy, you would have saved $${savings.toFixed(4)} vs always using the most expensive provider (${savingsPercent.toFixed(0)}%).`);
  console.log('\nTry it with real providers:');
  console.log('  npm install @ultra-dex/sdk\n');
}

runDemo().catch((err) => {
  console.error('Demo failed:', err.message);
  process.exit(1);
});
