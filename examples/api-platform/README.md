# API Platform

A production-ready API Platform template demonstrating modern API-first product development. Inspired by Stripe, Twilio, and SendGrid.

## Features

- ✅ **RESTful API** with semantic versioning (v1, v2)
- ✅ **API Key Authentication** with secure key management
- ✅ **Rate Limiting** with tiered plans (Free/Pro/Enterprise)
- ✅ **Request/Response Logging** with correlation IDs
- ✅ **OpenAPI Documentation** with Swagger UI
- ✅ **Webhook System** with retry logic and signature verification
- ✅ **Developer Portal** for API key management
- ✅ **TypeScript** throughout for type safety
- ✅ **PostgreSQL** for data persistence
- ✅ **Redis** for caching and rate limiting

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- npm or yarn

### Installation

1. **Clone and navigate to the project**
```bash
cd examples/api-platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your database and Redis credentials
```

4. **Set up the database**
```bash
npx prisma migrate dev
npx prisma generate
```

5. **Start the development server**
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## API Documentation

Once the server is running, you can access:

- **Swagger UI**: http://localhost:3000/api-docs
- **OpenAPI Spec**: http://localhost:3000/openapi.yaml
- **Health Check**: http://localhost:3000/health

## Developer Portal

The developer portal provides a user-friendly interface for:
- Managing API keys
- Viewing usage analytics
- Testing webhooks
- Browsing API documentation

To start the developer portal:
```bash
cd developer-portal
npm install
npm start
```

Access at: http://localhost:3001

## Project Structure

```
api-platform/
├── src/
│   ├── config/          # Configuration management
│   ├── middleware/      # Express middleware
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic
│   ├── models/          # Data models
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript types
│   ├── events/          # Event system
│   ├── queue/           # Job queues
│   └── validation/      # Input validation
├── developer-portal/    # React-based developer UI
├── prisma/             # Database schema
├── tests/              # Test suites
├── openapi.yaml        # API specification
└── docs/               # Additional documentation
```

## Usage Examples

### Authentication

Include your API key in the `X-API-Key` header:

```bash
curl -H "X-API-Key: your-api-key-here" \
  http://localhost:3000/v1/resources
```

### Creating a Resource

```bash
curl -X POST http://localhost:3000/v1/resources \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Resource",
    "description": "A sample resource"
  }'
```

### Registering a Webhook

```bash
curl -X POST http://localhost:3000/v1/webhook-endpoints \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks",
    "events": ["resource.created", "resource.updated"]
  }'
```

### Webhook Payload

When events occur, webhooks are sent with this structure:

```json
{
  "id": "evt_1234567890",
  "type": "resource.created",
  "created_at": "2024-01-15T10:30:00Z",
  "data": {
    "id": "res_9876543210",
    "name": "My Resource",
    "status": "active"
  }
}
```

Verify the signature using the webhook secret:

```javascript
const crypto = require('crypto');

const verifyWebhook = (payload, signature, secret) => {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
};
```

## API Versioning

The API supports versioning via URL path:

- Current stable: `/v1/`
- Latest (may have breaking changes): `/v2/`

Specify version in the `Accept-Version` header as an alternative.

## Rate Limits

Rate limits are applied per API key:

| Tier | Limit | Window |
|------|-------|--------|
| Free | 100 | 1 hour |
| Pro | 1,000 | 1 hour |
| Enterprise | 10,000 | 1 hour |

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1640995200
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for signing tokens | Required |
| `WEBHOOK_SECRET` | Secret for webhook signatures | Required |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | `info` |
| `RATE_LIMIT_ENABLED` | Enable rate limiting | `true` |

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.ts

# Run in watch mode
npm run test:watch
```

## Deployment

### Docker

```bash
# Build image
docker build -t api-platform .

# Run with docker-compose
docker-compose up -d
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure proper `DATABASE_URL`
- [ ] Set strong `JWT_SECRET` and `WEBHOOK_SECRET`
- [ ] Enable SSL/TLS
- [ ] Configure log aggregation
- [ ] Set up monitoring and alerting
- [ ] Configure rate limiting tiers
- [ ] Test webhook delivery
- [ ] Review security headers

## Architecture

```
┌─────────────────┐
│   API Gateway   │
│  ┌───────────┐  │
│  │Rate Limit │  │
│  │   Auth    │  │
│  │  Logging  │  │
│  └───────────┘  │
└────────┬────────┘
         │
    ┌────┴────┬──────────┐
    ▼         ▼          ▼
┌───────┐ ┌───────┐ ┌────────┐
│ API   │ │ API   │ │Webhook │
│  v1   │ │  v2   │ │ Handler│
└───┬───┘ └───┬───┘ └───┬────┘
    │         │         │
    └────┬────┴─────────┘
         ▼
┌─────────────────┐
│     Services    │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│Postgre│ │ Redis │
│  SQL  │ │       │
└───────┘ └───────┘
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Redis Documentation](https://redis.io/documentation)

## License

MIT License - see LICENSE file for details

## Support

For questions or issues:
- Open an issue on GitHub
- Check the [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md) for detailed build steps
- Review [CONTEXT.md](./CONTEXT.md) for architecture overview
