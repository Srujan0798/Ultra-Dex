/**
 * Ultra-Dex SDK — Middleware Pipeline Example
 *
 * Demonstrates composable middleware:
 *   - Logging (timing + token tracking)
 *   - Caching (skip duplicate requests)
 *   - Rate limiting (prevent overuse)
 *   - Custom middleware (add your own logic)
 *
 * Usage:
 *   node packages/sdk/examples/middleware-pipeline.js
 */

import {
  MiddlewarePipeline,
  loggingMiddleware,
  cacheMiddleware,
  rateLimitMiddleware,
} from '../index.ts';

// ---------------------------------------------------------------------------
// 1. Build a middleware pipeline
// ---------------------------------------------------------------------------

const pipeline = new MiddlewarePipeline();

// Layer 1: Logging — captures timing and token usage
pipeline.use(loggingMiddleware());

// Layer 2: Cache — identical requests return cached results (TTL: 5 seconds)
pipeline.use(cacheMiddleware({ ttlMs: 5000, maxSize: 50 }));

// Layer 3: Rate Limit — max 10 requests per minute
pipeline.use(rateLimitMiddleware({ maxRequests: 10, windowMs: 60_000 }));

// Layer 4: Custom — add a watermark to all responses
pipeline.use('watermark', async (ctx, next) => {
  await next();
  if (ctx.result && typeof ctx.result.content === 'string') {
    ctx.result.content += ' [via Ultra-Dex]';
  }
});

console.log('🔧 Middleware Pipeline Demo\n');
console.log(`  Loaded middleware: ${pipeline.list().join(' → ')}\n`);

// ---------------------------------------------------------------------------
// 2. Simulate requests through the pipeline
// ---------------------------------------------------------------------------

// Simulate a "provider" as the final handler
const mockHandler = async (ctx, next) => {
  ctx.result = {
    content: `Response to: ${ctx.args?.[0] || 'unknown'}`,
    usage: { promptTokens: 15, completionTokens: 25 },
  };
};

pipeline.use('handler', mockHandler);

// Request 1: Fresh request
const ctx1 = { method: 'chat', args: ['What is Ultra-Dex?'], provider: 'mock' };
await pipeline.execute(ctx1);
console.log(`  Request 1: "${ctx1.result.content}"`);
console.log(`    Cached: ${ctx1.cached}, Latency: ${ctx1.log.latencyMs}ms`);

// Request 2: Same args → should be cached
const ctx2 = { method: 'chat', args: ['What is Ultra-Dex?'], provider: 'mock' };
await pipeline.execute(ctx2);
console.log(`  Request 2: "${ctx2.result.content}"`);
console.log(`    Cached: ${ctx2.cached} ← cache hit!`);

// Request 3: Different args → not cached
const ctx3 = { method: 'chat', args: ['How does the router work?'], provider: 'mock' };
await pipeline.execute(ctx3);
console.log(`  Request 3: "${ctx3.result.content}"`);
console.log(`    Cached: ${ctx3.cached}, Latency: ${ctx3.log.latencyMs}ms`);

console.log('\n✅ Pipeline executed successfully');
