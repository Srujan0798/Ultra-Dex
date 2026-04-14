# @ultra-dex/sdk

> Route AI calls across providers. Cut costs 30–50%. Automatic failover.

## What is it?

`@ultra-dex/sdk` is an open-source TypeScript SDK that sits between your app and AI providers. It intelligently routes each request based on cost, latency, or your custom rules — with built-in circuit breakers, middleware, and cost tracking.

## Install

```bash
npm install @ultra-dex/sdk
```

## 5-line quickstart

```javascript
import { UltraDex } from '@ultra-dex/sdk'

const dex = new UltraDex()
dex.enableRouter({ strategy: 'cheapest' })

const response = await dex.chat([{ role: 'user', content: 'Hello' }])
// → Automatically routed to the cheapest available provider
```

## Documentation

- [Installation](./getting-started/installation)
- [Quick Start](./getting-started/quick-start)
- [Provider Setup](./providers)
- [Routing Strategies](./guides/routing-strategies)
- [Middleware](./guides/middleware)
- [SDK Reference](./sdk)

## Why use it?

| Feature | @ultra-dex/sdk | LiteLLM | Raw OpenAI SDK |
|---------|---------------|---------|----------------|
| Multi-provider routing | ✅ 4 strategies | ✅ basic | ❌ |
| Circuit breakers | ✅ auto-disable unhealthy | ❌ | ❌ |
| Cost tracking (p50/p95/p99) | ✅ per-provider | ❌ | ❌ |
| Budget limits | ✅ auto-cutoff | ❌ | ❌ |
| Middleware pipeline | ✅ logging, retry, cache, rate-limit | ❌ | ❌ |
| TypeScript-first | ✅ | ❌ Python | ✅ |
