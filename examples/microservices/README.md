# Microservices Example Project

A complete microservices architecture template demonstrating modern patterns and best practices.

## Architecture Overview

```
                    ┌─────────────┐
                    │   Client    │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ API Gateway │  (Port 3000)
                    │   (Proxy)   │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  Auth Service │ │  Users Service│ │ Orders Service│
│   (Port 3001) │ │   (Port 3002) │ │   (Port 3003) │
└───────────────┘ └───────────────┘ └───────────────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│   Auth DB     │ │   Users DB    │ │   Orders DB   │
│  (PostgreSQL) │ │  (PostgreSQL) │ │  (PostgreSQL) │
└───────────────┘ └───────────────┘ └───────────────┘

┌─────────────────┐  ┌─────────────────────┐
│ Payments Service│  │ Notifications       │
│   (Port 3004)   │  │  Service            │
└───────────────┬─┘  │   (Port 3005)       │
                │    └──────────┬──────────┘
                │               │
                ▼               ▼
      ┌───────────────────────────┐
      │       RabbitMQ            │
      │   (Message Queue)         │
      └───────────────────────────┘
```

## Services

| Service | Port | Description | Database |
|---------|------|-------------|----------|
| API Gateway | 3000 | Request routing, auth validation, rate limiting | Redis |
| Auth Service | 3001 | JWT authentication, user credentials | PostgreSQL |
| Users Service | 3002 | User profiles, preferences | PostgreSQL |
| Orders Service | 3003 | Order management, status tracking | PostgreSQL |
| Payments Service | 3004 | Payment processing, refunds | PostgreSQL |
| Notifications Service | 3005 | Email, SMS, push notifications | PostgreSQL |

## Infrastructure

- **PostgreSQL**: 5 databases (one per service)
- **Redis**: Caching, session storage, rate limiting
- **RabbitMQ**: Message queue for async communication
- **Consul**: Service discovery
- **Jaeger**: Distributed tracing

## Quick Start

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 20+ (for local development)

### Start All Services

```bash
# Clone or navigate to the project
cd examples/microservices

# Copy environment file
cp .env.example .env

# Start all services
docker-compose up -d

# Or with build
docker-compose up -d --build
```

### Verify Services

```bash
# Check all services are running
docker-compose ps

# View logs
docker-compose logs -f

# Check specific service
docker-compose logs -f api-gateway
```

### Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| API Gateway | http://localhost:3000 | - |
| RabbitMQ Management | http://localhost:15672 | admin/admin123 |
| Consul UI | http://localhost:8500 | - |
| Jaeger UI | http://localhost:16686 | - |

## API Usage Examples

### 1. Register a User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "user": { "id": "...", "email": "user@example.com", "role": "user" },
  "tokens": {
    "accessToken": "<jwt-access-token>",
    "refreshToken": "uuid-refresh-token",
    "expiresIn": "15m"
  }
}
```

### 3. Create User Profile

```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "userId": "user-uuid-from-auth",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890"
  }'
```

### 4. Create an Order

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "items": [
      {
        "productId": "prod-1",
        "productName": "Widget",
        "quantity": 2,
        "unitPrice": 29.99
      }
    ],
    "shippingAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip": "10001"
    },
    "billingAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip": "10001"
    }
  }'
```

### 5. Process Payment

```bash
curl -X POST http://localhost:3000/api/v1/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "orderId": "order-uuid",
    "amount": 59.98,
    "currency": "USD",
    "paymentMethod": "credit_card"
  }'
```

### 6. Get Notifications

```bash
curl http://localhost:3000/api/v1/notifications \
  -H "Authorization: Bearer <accessToken>"
```

## Project Structure

```
microservices/
├── docker-compose.yml          # Docker orchestration
├── .env.example                # Environment template
├── package.json                # Root workspace config
├── CONTEXT.md                  # Architecture documentation
├── IMPLEMENTATION-PLAN.md      # Implementation guide
├── services/
│   ├── api-gateway/           # API Gateway service
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/
│   ├── auth-service/          # Authentication service
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── init.sql
│   │   └── src/
│   ├── users-service/         # User management service
│   ├── orders-service/        # Order management service
│   ├── payments-service/      # Payment processing service
│   └── notifications-service/ # Notification service
└── README.md                  # This file
```

## Communication Patterns

### Synchronous (REST API)
- API Gateway → All Services
- Service-to-Service (via Service Discovery)

### Asynchronous (Message Queue)
- Orders Service → RabbitMQ → Payments Service
- Orders Service → RabbitMQ → Notifications Service
- Payments Service → RabbitMQ → Notifications Service

## Development

### Local Development

```bash
# Install dependencies for all services
npm install

# Start infrastructure only (databases, redis, rabbitmq)
docker-compose up -d redis rabbitmq consul jaeger postgres-auth postgres-users postgres-orders postgres-payments postgres-notifications

# Start individual service locally
cd services/auth-service
npm install
npm run dev
```

### Running Tests

```bash
# Run tests for all services
npm test

# Run tests for specific service
cd services/auth-service
npm test
```

## Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `JWT_SECRET`: Secret key for JWT signing
- `NODE_ENV`: Environment (development/production)
- `DB_*`: Database connection settings
- `REDIS_URL`: Redis connection string
- `RABBITMQ_URL`: RabbitMQ connection string

## Monitoring & Observability

### Health Checks

All services expose `/health` endpoint for health checks.

### Distributed Tracing

Jaeger UI available at http://localhost:16686 for viewing traces.

### Logging

Structured JSON logging to console for all services.

## Scaling

To scale a service horizontally:

```bash
# Scale orders service to 3 instances
docker-compose up -d --scale orders-service=3
```

Note: Update API Gateway load balancing configuration for scaled services.

## Cleanup

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v

# Clean up everything including images
docker-compose down -v --rmi all
```

## Security Considerations

1. **JWT Tokens**: Change default JWT_SECRET in production
2. **Database Passwords**: Use strong passwords in production
3. **HTTPS**: Use TLS certificates in production
4. **Network**: Use Docker secrets for sensitive data
5. **Rate Limiting**: Configured in API Gateway

## Troubleshooting

### Services not starting

```bash
# Check logs
docker-compose logs [service-name]

# Restart specific service
docker-compose restart [service-name]
```

### Database connection issues

```bash
# Check database health
docker-compose exec postgres-auth pg_isready -U auth_user
```

### Message queue issues

```bash
# Check RabbitMQ management UI
open http://localhost:15672

# Check RabbitMQ logs
docker-compose logs rabbitmq
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT

## Resources

- [CONTEXT.md](CONTEXT.md) - Detailed architecture overview
- [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) - Implementation steps and guides

## Support

For issues and questions:
- Create an issue in the repository
- Check existing documentation
- Review logs with `docker-compose logs`
