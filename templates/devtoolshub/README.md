# DevToolsHub Template

DevToolsHub is an API platform template with secure API key management, rate limiting, usage analytics, and webhook delivery.

## Included
- Prisma schema for API keys, usage logs, rate limits, webhook endpoints
- API key creation, revoke, and rotation helpers
- Token bucket rate limiter with persistent windowed counters
- Usage tracking and analytics helpers
- Webhook delivery with retries

## Directory

```text
templates/devtoolshub/
  schema.prisma
  api/
    keys.ts
    usage.ts
    webhooks.ts
  lib/
    prisma.ts
    key-generator.ts
    rate-limiting.ts
    usage.ts
    webhook-delivery.ts
```

## Data Model
- ApiKey: workspace-scoped keys with hash + prefix storage.
- Usage: request-level usage logs for analytics.
- RateLimit: per-key windowed counters.
- WebhookEndpoint: delivery targets and secrets.

## Setup

1. Copy template into your project.
2. Install Prisma dependencies:

```bash
npm install prisma @prisma/client
```

3. Configure database:

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/devtoolshub"
```

4. Generate client and run migration:

```bash
npx prisma generate
npx prisma migrate dev --name init_devtoolshub
```

## Core APIs

### API Keys
- createApiKey(workspaceId, name, rateLimit?)
- listApiKeys(workspaceId)
- revokeApiKey(id, workspaceId)
- rotateApiKey(id, workspaceId)
- validateApiKey(rawKey)

### Usage Tracking
- recordUsage({ keyId, endpoint, responseTime, statusCode })
- listUsage(keyId, since?)

### Webhooks
- createWebhook(url, secret, workspaceId?)
- listWebhooks(workspaceId?)
- disableWebhook(id)
- deleteWebhook(id)

## Rate Limiting

`lib/rate-limiting.ts` provides:
- tokenBucketAllow(keyId, { capacity, refillPerSecond, cost })
- checkLimit(keyId, limit)
- incrementUsage(keyId)

Use tokenBucketAllow for fast in-memory checks and the persistent windowed counters for multi-instance environments.

## Webhook Delivery

`lib/webhook-delivery.ts` provides:
- deliverWebhook(url, payload, { attempts, backoffMs, timeoutMs, headers })

It retries on failure with backoff and returns delivery status metadata.

## Production Notes
- Always store only key hashes (never raw keys).
- Rotate keys on suspected exposure.
- Rate limit request bursts at the edge.
