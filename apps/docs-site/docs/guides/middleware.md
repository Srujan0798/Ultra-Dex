# Middleware

Ultra-Dex includes a built-in middleware pipeline. Each middleware runs before and/or after every `chat()`, `stream()`, and `embed()` call.

## Built-in middleware

### loggingMiddleware

Records latency and success/failure of every request.

```javascript
import { loggingMiddleware } from '@ultra-dex/sdk'

dex.middleware.use('log', loggingMiddleware())
```

### retryMiddleware

Retries failed requests with exponential backoff.

```javascript
import { retryMiddleware } from '@ultra-dex/sdk'

dex.middleware.use('retry', retryMiddleware({ maxRetries: 3 }))
```

### cacheMiddleware

Caches identical requests for a TTL.

```javascript
import { cacheMiddleware } from '@ultra-dex/sdk'

dex.middleware.use('cache', cacheMiddleware({ ttlMs: 60000 }))
```

### rateLimitMiddleware

Enforces a local rate limit.

```javascript
import { rateLimitMiddleware } from '@ultra-dex/sdk'

dex.middleware.use('rateLimit', rateLimitMiddleware({ maxRequests: 60, windowMs: 60000 }))
```

## Custom middleware

```javascript
dex.middleware.use('myHook', {
  async before(ctx) {
    console.log('Before:', ctx.provider)
  },
  async after(ctx, result) {
    console.log('After:', result.provider)
    return result
  },
})
```
