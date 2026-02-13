/**
 * Ultra-Dex SDK — Smart Router Example
 *
 * Demonstrates intelligent provider routing with:
 *   - Multiple providers with different latency/cost profiles
 *   - Automatic fallback when a provider fails
 *   - Latency-based routing ("fastest" strategy)
 *   - Cost tracking and budget limits
 *   - Live stats monitoring
 *
 * Usage:
 *   node packages/sdk/examples/smart-router.js
 */

import { UltraDex } from '../index.ts';

// ---------------------------------------------------------------------------
// 1. Create the UltraDex instance and enable Smart Router
// ---------------------------------------------------------------------------

const dex = new UltraDex();

dex.enableRouter({
    strategy: 'fastest',              // Route to the fastest provider
    budgetLimit: 1.00,                // Stop if total cost exceeds $1.00
    costPerToken: {
        fast: 0.00003,               // Premium provider: $0.03 / 1K tokens
        medium: 0.00001,               // Mid-tier: $0.01 / 1K tokens
        cheap: 0.000002,              // Budget: $0.002 / 1K tokens
        flaky: 0.00001,               // Unreliable provider for testing fallback
    },
    circuitBreaker: {
        failureThreshold: 2,            // Trip after 2 consecutive failures
        resetTimeoutMs: 10_000,         // Re-try after 10 seconds
    },
});

// ---------------------------------------------------------------------------
// 2. Register providers with different characteristics
// ---------------------------------------------------------------------------

// Fast but expensive
dex.registerProvider('fast', {
    async chat(messages) {
        await sleep(50);   // 50ms latency
        return { role: 'assistant', content: 'Fast response!', usage: { promptTokens: 20, completionTokens: 30 } };
    },
    async *stream() { yield { delta: 'fast' }; },
    async embed() { return { embedding: [1, 0, 0] }; },
});

// Medium speed, medium cost
dex.registerProvider('medium', {
    async chat(messages) {
        await sleep(150);  // 150ms latency
        return { role: 'assistant', content: 'Medium response!', usage: { promptTokens: 20, completionTokens: 30 } };
    },
    async *stream() { yield { delta: 'medium' }; },
    async embed() { return { embedding: [0, 1, 0] }; },
});

// Slow but cheap
dex.registerProvider('cheap', {
    async chat(messages) {
        await sleep(300);  // 300ms latency
        return { role: 'assistant', content: 'Cheap response!', usage: { promptTokens: 20, completionTokens: 30 } };
    },
    async *stream() { yield { delta: 'cheap' }; },
    async embed() { return { embedding: [0, 0, 1] }; },
});

// Unreliable — fails every other request
let flakyCount = 0;
dex.registerProvider('flaky', {
    async chat(messages) {
        flakyCount++;
        if (flakyCount % 2 === 1) throw new Error('Flaky provider down!');
        return { role: 'assistant', content: 'Flaky survived!', usage: { promptTokens: 10, completionTokens: 10 } };
    },
    async *stream() { yield { delta: 'flaky' }; },
    async embed() { return { embedding: [0.5, 0.5, 0] }; },
});

// ---------------------------------------------------------------------------
// 3. Send requests — router handles provider selection automatically
// ---------------------------------------------------------------------------

console.log('🚀 Ultra-Dex Smart Router Demo\n');

const messages = [{ role: 'user', content: 'Hello!' }];

for (let i = 0; i < 8; i++) {
    const result = await dex.chat(messages);
    const stats = dex.getRouterStats();

    // Find which provider was used (cheapest latency match)
    const usedProvider = Object.entries(stats)
        .filter(([, s]) => s.requestCount > 0)
        .sort((a, b) => b[1].requestCount - a[1].requestCount)[0];

    console.log(`  Request ${i + 1}: "${result.content}" (via router)`);
}

// ---------------------------------------------------------------------------
// 4. View router statistics
// ---------------------------------------------------------------------------

console.log('\n📊 Router Statistics:\n');

const allStats = dex.getRouterStats();
for (const [name, stats] of Object.entries(allStats)) {
    const { requestCount, avgLatency, p95, errorRate, totalCost, circuitState } = stats;
    if (requestCount > 0) {
        console.log(`  ${name.padEnd(10)} │ ${requestCount} reqs │ avg ${avgLatency}ms │ p95 ${p95}ms │ err ${(errorRate * 100).toFixed(1)}% │ $${totalCost.toFixed(6)} │ circuit: ${circuitState}`);
    }
}

const router = dex.getRouter();
console.log(`\n  Total cost: $${router.totalCost.toFixed(6)} / $1.00 budget`);
console.log(`  Total requests: ${router.totalRequests}`);

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
