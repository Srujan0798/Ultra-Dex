# Ultra-Dex Deployment Guide

This guide covers deploying Ultra-Dex v3.0.0 to production environments. Ultra-Dex is an AI orchestration meta-layer that coordinates multiple AI providers, manages agent swarms, and provides persistent memory across conversations.

## Prerequisites

Before deploying Ultra-Dex, ensure your environment meets these requirements:

**System Requirements:**

- Node.js 22 or higher (LTS recommended)
- npm 10 or higher
- Minimum 512 MB RAM (1 GB recommended for production)
- 100 MB free disk space for application files
- Additional space for logs and persistent data (varies by usage)

**Optional Components:**

- Docker 24+ and Docker Compose v2 (for containerized deployment)
- Redis 7+ (for distributed mesh communication)
- PostgreSQL 15+ (for audit database persistence)

## Environment Variables

Ultra-Dex requires several environment variables for proper operation. Create a `.env` file in your deployment directory with the following configuration:

**AI Provider API Keys (at least one required):**

```bash
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
GOOGLE_API_KEY=your-google-ai-key-here
NVIDIA_API_KEY=nvapi-your-nvidia-key-here
MISTRAL_API_KEY=your-mistral-key-here
GROQ_API_KEY=gsk-your-groq-key-here
DEEPSEEK_API_KEY=sk-your-deepseek-key-here
COHERE_API_KEY=your-cohere-key-here
TOGETHER_API_KEY=your-together-key-here
FIREWORKS_API_KEY=fw-your-fireworks-key-here
PERPLEXITY_API_KEY=pplx-your-perplexity-key-here
GROK_API_KEY=xai-your-grok-key-here
```

**Core Application Settings:**

```bash
NODE_ENV=production
PORT=3000
BUS_TYPE=redis
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:password@localhost:5432/ultra_dex
```

**Security Configuration:**

```bash
NEXTAUTH_SECRET=your-32-character-secret-key
NEXTAUTH_URL=https://yourdomain.com
SESSION_SECRET=another-32-character-secret
```

**Memory and Performance Tuning:**

```bash
NODE_OPTIONS="--max-old-space-size=512"
GOVERNANCE_STRICT_MODE=true
MEMORY_TIER_PROMOTION_THRESHOLD=10
MEMORY_TIER_DEMOTION_THRESHOLD=100
```

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

## Quick Start Deployment

For a basic deployment on a single server, follow these steps:

**Step 1: Clone and Install**

```bash
git clone https://github.com/yourusername/Ultra-Dex.git
cd Ultra-Dex
npm install --production
```

**Step 2: Configure Environment**
Copy the `.env.example` file to `.env` and fill in your API keys and configuration values. Ensure all required AI provider keys are set.

**Step 3: Build Application**

```bash
npm run build
```

**Step 4: Start Application**

```bash
npm start
```

The application will start on the configured port (default 3000). Access the web interface at `http://localhost:3000` or your configured domain.

## Docker Deployment

For containerized deployment with better isolation and easier scaling, use the provided Docker configuration:

**Single Container Deployment:**

```bash
docker build -f Dockerfile.prod -t ultra-dex:v3.0.0 .
docker run -d \
  --name ultra-dex \
  -p 3000:3000 \
  --env-file .env \
  -v ultra-dex-data:/app/data \
  -v ultra-dex-logs:/app/logs \
  ultra-dex:v3.0.0
```

**Full Stack with Docker Compose:**

```bash
cp .env.example .env
# Edit .env with your configuration
docker-compose -f docker-compose.prod.yml up -d
```

This will start Ultra-Dex with Redis and PostgreSQL services. The application will be available at `http://localhost:3000`.

## Configuration Files

Ultra-Dex supports environment-specific configuration files in the `config/` directory:

**config/production.json:**

```json
{
  "server": {
    "port": 3000,
    "cors": {
      "origin": ["https://yourdomain.com"],
      "credentials": true
    }
  },
  "ai": {
    "defaultProvider": "openai",
    "fallbackChain": ["openai", "anthropic", "google"],
    "rateLimiting": {
      "enabled": true,
      "maxRequestsPerMinute": 60
    }
  },
  "governance": {
    "strictMode": true,
    "auditLevel": "full"
  }
}
```

**config/staging.json:**

```json
{
  "server": {
    "port": 3000,
    "cors": {
      "origin": true
    }
  },
  "ai": {
    "defaultProvider": "openai",
    "rateLimiting": {
      "maxRequestsPerMinute": 120
    }
  },
  "governance": {
    "strictMode": false,
    "auditLevel": "minimal"
  }
}
```

## SSL/TLS Setup

For production deployments, always use HTTPS. You can terminate SSL at several points:

**Reverse Proxy (Recommended):**
Use nginx or Apache as a reverse proxy to handle SSL termination:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Load Balancer SSL:**
If using cloud load balancers (AWS ALB, GCP Load Balancer), configure SSL termination at the load balancer level and ensure the `X-Forwarded-Proto` header is properly set.

## Troubleshooting

**Application Won't Start:**

- Check that all required environment variables are set with `npm run config:check`
- Verify Node.js version with `node --version` (should be 22+)
- Check port availability with `lsof -i :3000`
- Review startup logs for missing dependencies

**AI Provider Errors:**

- Verify API keys are valid and have sufficient quota
- Test individual providers with `npm run test:providers`
- Check rate limiting settings in your provider dashboards
- Ensure network connectivity to provider APIs

**Memory Issues:**

- Increase `NODE_OPTIONS="--max-old-space-size=1024"` for larger workloads
- Monitor memory usage with `npm run stats:memory`
- Configure memory tier settings to optimize for your use case
- Consider scaling horizontally if single-instance limits are reached

**Database Connection Issues:**

- Verify database credentials and network connectivity
- Check that the database exists and schema is up to date
- Run `npm run db:migrate` to apply any pending migrations
- Monitor connection pool settings for high-load scenarios

**Redis Connection Problems:**

- Verify Redis is running and accessible at the configured URL
- Check Redis authentication settings match your configuration
- Monitor Redis memory usage and configure appropriate eviction policies
- Test Redis connectivity with `redis-cli ping`

For additional troubleshooting, enable debug logging by setting `DEBUG=ultra-dex:*` in your environment and examine the detailed logs for specific error messages and stack traces.
