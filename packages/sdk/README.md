# @ultra-dex/sdk

> Route AI calls across providers. Cut costs 30–50%. Automatic failover.

## Install

```bash
npm install @ultra-dex/sdk
```

## Quickstart (5 lines)

```js
import { UltraDex } from '@ultra-dex/sdk'

const dex = new UltraDex({ defaultProvider: 'openai' })

// Register providers
dex.registerProvider('openai', new OpenAIProvider({ apiKey: process.env.OPENAI_KEY }))
dex.registerProvider('anthropic', new AnthropicProvider({ apiKey: process.env.ANTHROPIC_KEY }))

// Enable smart routing
dex.enableRouter({ strategy: 'cheapest' })

// Use it — same API you already know
const response = await dex.chat([{ role: 'user', content: 'Hello' }])
// → Automatically routes to cheapest available provider
```

## Why @ultra-dex/sdk?

| Feature | @ultra-dex/sdk | LiteLLM | Raw OpenAI SDK |
|---------|---------------|---------|----------------|
| Multi-provider routing | ✅ 4 strategies | ✅ basic | ❌ |
| Circuit breakers | ✅ auto-disable unhealthy | ❌ | ❌ |
| Cost tracking (p50/p95/p99) | ✅ per-provider | ❌ | ❌ |
| Budget limits | ✅ auto-cutoff | ❌ | ❌ |
| Middleware pipeline | ✅ logging, retry, cache, rate-limit | ❌ | ❌ |
| TypeScript-first | ✅ | ❌ Python | ✅ |
| Zero config | ✅ works in 5 lines | ⚠️ proxy server needed | ✅ |

## Routing Strategies

### cheapest — minimize cost
Routes to the provider with the lowest cost-per-token based on live stats.

### fastest — minimize latency
Routes to the provider with the best p50 latency.

### round-robin — distribute evenly
Rotates across all healthy providers evenly.

### fallback-chain — primary with automatic failover
Uses your preferred order. If one fails, instantly tries the next.

```js
dex.enableRouter({
  strategy: 'fallback-chain',
  fallbackOrder: ['anthropic', 'openai', 'google']
})
```

## Cost Tracking

```js
const stats = dex.getRouterStats()
// → { openai: { avgLatency: 340, totalCost: 12.50, errorRate: 0.02 }, ... }
```

## Middleware

```js
import { loggingMiddleware, retryMiddleware, cacheMiddleware } from '@ultra-dex/sdk'

dex.middleware.use('log', loggingMiddleware())
dex.middleware.use('retry', retryMiddleware({ maxRetries: 3 }))
dex.middleware.use('cache', cacheMiddleware({ ttlMs: 60000 }))
```

## Provider Wrappers

Bring your own provider SDKs and wrap them in ~10 lines:

```js
import OpenAI from 'openai'

class OpenAIProvider {
  constructor({ apiKey, model = 'gpt-4o' }) {
    this.client = new OpenAI({ apiKey })
    this.model = model
  }

  async chat(messages, opts = {}) {
    const res = await this.client.chat.completions.create({
      model: opts.model || this.model,
      messages,
    })
    return {
      content: res.choices[0].message.content,
      usage: {
        promptTokens: res.usage.prompt_tokens,
        completionTokens: res.usage.completion_tokens,
      },
      provider: 'openai',
      model: res.model,
    }
  }

  async *stream(messages, opts = {}) {
    const res = await this.client.chat.completions.create({
      model: opts.model || this.model,
      messages,
      stream: true,
    })
    for await (const chunk of res) {
      yield { content: chunk.choices[0]?.delta?.content || '' }
    }
  }

  async embed(text, opts = {}) {
    const res = await this.client.embeddings.create({
      model: opts.model || 'text-embedding-3-small',
      input: text,
    })
    return { embedding: res.data[0].embedding }
  }
}
```

## Pro Dashboard (optional, $29/mo)

See real-time cost analytics at [app.ultra-dex.dev](https://app.ultra-dex.dev)

## License

MIT
