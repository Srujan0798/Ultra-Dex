/**
 * Ultra-Dex Middleware Pipeline
 *
 * Composable request/response middleware for the SDK.
 * Each middleware receives (context, next) and can modify
 * the request before calling next() or the response after.
 */

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

export class MiddlewarePipeline {
  constructor() {
    /** @type {Array<{ name: string, fn: Function }>} */
    this.stack = [];
  }

  use(name, fn) {
    if (typeof name === 'function') {
      fn = name;
      name = fn.name || `mw-${this.stack.length}`;
    }
    this.stack.push({ name, fn });
    return this;
  }

  async execute(context) {
    let index = 0;

    const next = async () => {
      if (index >= this.stack.length) return;
      const { fn } = this.stack[index++];
      await fn(context, next);
    };

    await next();
    return context;
  }

  get length() {
    return this.stack.length;
  }

  list() {
    return this.stack.map((m) => m.name);
  }
}

// ---------------------------------------------------------------------------
// Built-in Middleware
// ---------------------------------------------------------------------------

/**
 * Logging middleware — captures timing, provider, method, and token usage.
 * Populates context.log after execution.
 */
export function loggingMiddleware() {
  return async function logging(ctx, next) {
    const start = Date.now();
    ctx.log = { startedAt: new Date().toISOString() };

    await next();

    const elapsed = Date.now() - start;
    ctx.log.latencyMs = elapsed;
    ctx.log.provider = ctx.provider || 'unknown';
    ctx.log.method = ctx.method || 'unknown';
    ctx.log.success = !ctx.error;

    if (ctx.result?.usage) {
      ctx.log.tokens = {
        prompt: ctx.result.usage.promptTokens || 0,
        completion: ctx.result.usage.completionTokens || 0,
        total: (ctx.result.usage.promptTokens || 0) + (ctx.result.usage.completionTokens || 0),
      };
    }
  };
}

/**
 * Retry middleware — retries on failure with exponential backoff.
 * @param {object} opts
 * @param {number} opts.maxRetries    Max retries (default 2)
 * @param {number} opts.baseDelayMs   Initial delay (default 1000)
 * @param {number} opts.maxDelayMs    Max delay cap (default 10000)
 */
export function retryMiddleware({ maxRetries = 2, baseDelayMs = 1000, maxDelayMs = 10_000 } = {}) {
  return async function retry(ctx, next) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        ctx.attempt = attempt + 1;
        await next();
        return; // success
      } catch (err) {
        lastError = err;
        if (attempt < maxRetries) {
          const delay = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
    ctx.error = lastError;
    throw lastError;
  };
}

/**
 * Cache middleware — caches identical requests for a configurable TTL.
 * Uses a simple in-memory Map. Cache key = JSON(method + messages).
 * @param {object} opts
 * @param {number} opts.ttlMs   Time-to-live in ms (default 60000 = 1 min)
 * @param {number} opts.maxSize Max cache entries (default 100)
 */
export function cacheMiddleware({ ttlMs = 60_000, maxSize = 100 } = {}) {
  const cache = new Map();

  return async function caching(ctx, next) {
    const key = JSON.stringify({ method: ctx.method, args: ctx.args });
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttlMs) {
      ctx.result = cached.result;
      ctx.cached = true;
      return;
    }

    await next();

    // Store result in cache
    if (ctx.result && !ctx.error) {
      if (cache.size >= maxSize) {
        // Evict oldest entry
        const oldest = cache.keys().next().value;
        cache.delete(oldest);
      }
      cache.set(key, { result: ctx.result, timestamp: Date.now() });
    }

    ctx.cached = false;
  };
}

/**
 * Rate limiter middleware — sliding window token bucket.
 * @param {object} opts
 * @param {number} opts.maxRequests   Max requests per window (default 60)
 * @param {number} opts.windowMs      Window size in ms (default 60000 = 1 min)
 */
export function rateLimitMiddleware({ maxRequests = 60, windowMs = 60_000 } = {}) {
  const timestamps = [];

  return async function rateLimit(ctx, next) {
    const now = Date.now();

    // Remove timestamps outside the window
    while (timestamps.length > 0 && timestamps[0] < now - windowMs) {
      timestamps.shift();
    }

    if (timestamps.length >= maxRequests) {
      const waitMs = timestamps[0] + windowMs - now;
      throw new Error(
        `Rate limit exceeded (${maxRequests} req/${windowMs}ms). Retry in ${waitMs}ms.`
      );
    }

    timestamps.push(now);
    await next();
  };
}

export default MiddlewarePipeline;
