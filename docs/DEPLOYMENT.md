# Ultra-Dex Deployment Guide

> See the full deployment guide at [deployment/index.md](deployment/index.md).

## Database Setup

Ultra-Dex v2.0+ introduces a persistent database layer for production-grade memory, audit trails, and usage tracking.

**Components:**

- **Redis** — powers the memory tier (L2/L3) and vector semantic search. Required for agent swarm coordination and prompt enhancement with semantic context.
- **PostgreSQL** — stores audit trails, usage tracking, and execution traces. Required for enterprise governance and compliance.

**Docker Compose (recommended for local development):**

```bash
# Start all services (Ultra-Dex + Redis + Postgres)
docker compose up

# Or start just the infrastructure
docker compose up redis postgres
```

**Manual Setup:**

1. Install Redis 7+ and PostgreSQL 15+ on your system
2. Set `REDIS_URL` and `DATABASE_URL` in your `.env` file
3. Run migrations: `npm run db:migrate`
4. Verify connectivity: `ultra-dex doctor`

**Fallback — File-based mode (no database required):**

```bash
MEMORY_BACKEND=file ultra-dex run "Your task here"
```

This uses local JSON files for memory persistence. Suitable for development and light workloads.

## Quick Links

- [Full Deployment Guide](deployment/index.md)
- [Docker Compose Config](../docker-compose.yml)
- [Environment Variables](../.env.example)
