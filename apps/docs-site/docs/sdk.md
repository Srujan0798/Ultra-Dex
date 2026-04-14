# SDK Reference

## UltraDex

Main client class.

```javascript
import { UltraDex } from '@ultra-dex/sdk'

const dex = new UltraDex({
  defaultProvider: 'openai', // optional
  timeoutMs: 45000,          // optional
})
```

### Methods

| Method | Description |
|--------|-------------|
| `registerProvider(name, provider)` | Add a provider implementing `chat`, `stream`, `embed` |
| `enableRouter(config)` | Activate SmartRouter with a strategy |
| `chat(messages, opts)` | Send a chat completion request |
| `embed(text, opts)` | Generate embeddings |
| `getRouterStats()` | Return per-provider latency/cost/error stats |

## SmartRouter

### Config

```javascript
dex.enableRouter({
  strategy: 'cheapest',        // 'cheapest' | 'fastest' | 'round-robin' | 'fallback-chain'
  fallbackOrder: ['openai'],   // used by fallback-chain
  costPerToken: {},            // used by cheapest
  budgetLimit: 100,            // auto-reject after $100 total cost
})
```

## Cost Tracking

```javascript
const stats = dex.getRouterStats()
// {
//   openai: {
//     avgLatency: 340,
//     p50: 310,
//     p95: 520,
//     totalCost: 12.50,
//     errorRate: 0.02,
//     requestCount: 120
//   },
//   ...
// }
```

## Types

```typescript
type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

type ChatResponse = {
  content: string
  usage?: { promptTokens: number; completionTokens: number }
  provider: string
  model: string
}
```
