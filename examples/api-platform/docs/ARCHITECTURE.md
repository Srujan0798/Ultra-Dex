# Architecture Deep Dive

## Authentication Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│   API Key    │────▶│   Verify    │
│             │     │   Header     │     │   Hash      │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                       ┌─────────────┐◀─────────┘
                       │   Attach    │
                       │   User      │
                       └──────┬──────┘
                              │
                       ┌──────▼──────┐
                       │  Next       │
                       │  Middleware │
                       └─────────────┘
```

## Rate Limiting Algorithm

We use a **sliding window counter** algorithm:

1. Divide time into fixed windows (e.g., 1 hour)
2. Track request count per window in Redis
3. Check if current window count exceeds limit
4. Return remaining requests in headers

Advantages:

- Simple to implement
- Memory efficient
- No clock synchronization issues

## Webhook Delivery Flow

```
┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│   Event      │───▶│   Queue     │───▶│   Worker    │
│   Triggered  │    │   (Redis)   │    │   Process   │
└──────────────┘    └─────────────┘    └──────┬──────┘
                                              │
                    ┌─────────────┐◀──────────┘
                    │   HTTP      │
                    │   POST      │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Webhook    │
                    │  Endpoint   │
                    └─────────────┘
```

### Retry Strategy

- **Exponential backoff**: 1s, 2s, 4s, 8s, 16s
- **Max retries**: 5 attempts
- **Timeout**: 30 seconds per attempt
- **Dead letter queue**: Failed webhooks logged for analysis

## Database Schema

### API Keys Table

- `id`: UUID primary key
- `user_id`: Foreign key to users
- `name`: Human-readable name
- `prefix`: First 8 characters of key (for identification)
- `hash`: SHA-256 hash of full key
- `tier`: Rate limit tier (free/pro/enterprise)
- `status`: active/revoked
- `last_used_at`: Timestamp for analytics

### Resources Table

- `id`: UUID primary key
- `user_id`: Foreign key
- `name`: Resource name
- `description`: Optional description
- `status`: active/inactive/archived
- `metadata`: JSONB for flexible data

### Webhook Endpoints Table

- `id`: UUID primary key
- `user_id`: Foreign key
- `url`: HTTPS URL only
- `events`: Array of event types
- `secret`: HMAC signing secret
- `status`: active/disabled

### Webhook Deliveries Table

- `id`: UUID primary key
- `endpoint_id`: Foreign key
- `event_id`: Reference to event
- `status`: pending/delivered/failed
- `http_status`: Response code
- `retry_count`: Number of attempts

## Security Considerations

### API Keys

- Never store full keys in database (only hashes)
- Use constant-time comparison for validation
- Support key rotation without changing ID
- Automatic revocation on suspicious activity

### Webhooks

- Sign payloads with HMAC-SHA256
- Use HTTPS only
- Verify TLS certificates
- IP allowlisting option
- Idempotency via event IDs

### Rate Limiting

- Per-key limits prevent abuse
- Different tiers for different customers
- Redis-backed for distributed systems
- Headers inform clients of limits

## Performance Optimizations

1. **Connection Pooling**: Database and Redis connections pooled
2. **Caching**: API key metadata cached in Redis
3. **Async Processing**: Webhooks sent asynchronously
4. **Pagination**: Cursor-based for large datasets
5. **Compression**: Gzip for API responses
6. **CDN**: Static assets served via CDN

## Monitoring & Observability

### Metrics to Track

- Request rate (per endpoint, per API key)
- Error rate (4xx, 5xx)
- Latency (p50, p95, p99)
- Webhook delivery success rate
- Rate limit hits

### Logging

- Structured JSON logs
- Correlation IDs across services
- Sensitive data redaction
- Log levels: ERROR, WARN, INFO, DEBUG

### Alerts

- Error rate > 1%
- P99 latency > 500ms
- Webhook delivery failure rate > 5%
- Database connection pool exhaustion
