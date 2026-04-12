# Ultra-Dex Dashboard Deployment Guide

> Deploy the Ultra-Dex web dashboard to any environment — local, Docker, or cloud.

---

## Table of Contents

- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Environment Variables](#environment-variables)
- [Reverse Proxy (Nginx)](#reverse-proxy-nginx)
- [SSL/TLS Setup](#ssltls-setup)
- [Monitoring and Health Checks](#monitoring-and-health-checks)

---

## Local Development

### Prerequisites

- Node.js 20+
- npm 8+

### Quick Start

```bash
cd apps/dashboard
npm install
npm run dev
```

The dashboard will be available at `http://localhost:5173`.

### Build for Production

```bash
cd apps/dashboard
npm run build
npm run preview
```

---

## Docker Deployment

### Single Command

```bash
cd apps/dashboard
docker compose up -d
```

This starts:
- **Dashboard** on `http://localhost:3000`
- **Redis** on port 6379 (session + cache)
- **PostgreSQL** on port 5432 (persistent data)

### Build Image Manually

```bash
cd apps/dashboard
docker build -t ultra-dex-dashboard .
docker run -d -p 3000:3000 --name dashboard ultra-dex-dashboard
```

### With Custom Environment

```bash
# Copy and edit environment file
cp .env.example .env
# Edit .env with your configuration

docker compose up -d
```

### View Logs

```bash
docker compose logs -f dashboard
```

### Stop

```bash
docker compose down
# Or with data removal:
docker compose down -v
```

---

## Cloud Deployment

### Vercel (Recommended)

The dashboard includes a `vercel.json` configuration for zero-config deployment.

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from dashboard directory
cd apps/dashboard
vercel --prod
```

**Environment variables to set in Vercel dashboard:**
- `ULTRA_DEX_API_URL` — URL of your Ultra-Dex API server
- `REDIS_URL` — Redis connection string (if using Redis)
- `DATABASE_URL` — PostgreSQL connection string (if using Postgres)

### Railway

1. Connect your GitHub repo to Railway
2. Select `apps/dashboard` as the root directory
3. Add environment variables
4. Deploy

**Railway `railway.json`:**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd apps/dashboard && npm install && npm run build"
  },
  "deploy": {
    "startCommand": "cd apps/dashboard && npx serve dist -p $PORT",
    "healthcheckPath": "/",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Initialize app
cd apps/dashboard
fly launch

# Deploy
fly deploy
```

**`fly.toml`:**

```toml
app = "ultra-dex-dashboard"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "3000"

[[services]]
  http_checks = []
  internal_port = 3000
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [services.concurrency]
    hard_limit = 25
    soft_limit = 20
    type = "connections"
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | No | `production` | Runtime environment |
| `PORT` | No | `3000` | HTTP port |
| `ULTRA_DEX_HOME` | No | `~/.ultra-dex` | Ultra-Dex data directory |
| `ULTRA_DEX_API_URL` | No | `http://localhost:3001` | Backend API URL |
| `REDIS_URL` | No | — | Redis connection string for sessions |
| `DATABASE_URL` | No | — | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | No | — | Auth session secret |
| `NEXTAUTH_URL` | No | — | Auth callback URL |

---

## Reverse Proxy (Nginx)

### Basic Configuration

```nginx
server {
    listen 80;
    server_name dashboard.yourdomain.com;

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

### With WebSocket Support (for live logs)

```nginx
server {
    listen 80;
    server_name dashboard.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;  # Keep WebSocket connections alive
    }
}
```

---

## SSL/TLS Setup

### Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d dashboard.yourdomain.com

# Auto-renewal (certbot sets this up automatically)
sudo certbot renew --dry-run
```

### Updated Nginx Config (after SSL)

```nginx
server {
    listen 443 ssl http2;
    server_name dashboard.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/dashboard.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dashboard.yourdomain.com/privkey.pem;

    # Modern SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name dashboard.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Monitoring and Health Checks

### Health Endpoint

The dashboard serves static assets — health is determined by the HTTP server responding:

```bash
curl -f http://localhost:3000/ || echo "Dashboard unhealthy"
```

### Docker Health Check

Add to `docker-compose.yml`:

```yaml
services:
  dashboard:
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

### Uptime Monitoring

**Better Stack (already configured in root project):**

```bash
# Set in .env
BETTER_STACK_SOURCE_TOKEN=your-token-here
```

**UptimeRobot / Pingdom:**

Configure HTTP check against `https://dashboard.yourdomain.com/` with 5-minute intervals.

### Log Aggregation

Dashboard logs are written to stdout/stderr. In Docker:

```bash
# View recent logs
docker compose logs --tail=100 dashboard

# Follow logs
docker compose logs -f dashboard
```

For production log aggregation, forward Docker logs to your logging provider:

```bash
# Example: forward to Better Stack via vector
docker compose -f docker-compose.yml -f docker-compose.logging.yml up -d
```

---

## Troubleshooting

### Dashboard won't start

```bash
# Check build output
cd apps/dashboard
npm run build 2>&1 | tail -20

# Check Docker build
docker build --no-cache -t ultra-dex-dashboard .
```

### WebSocket connections failing

1. Verify reverse proxy passes `Upgrade` and `Connection` headers
2. Check `proxy_read_timeout` is set high (86400s recommended)
3. Verify firewall allows WebSocket traffic

### Static assets 404

Ensure the build output directory matches the serve path:

```bash
# Check build output
ls apps/dashboard/dist/

# Dockerfile should serve from dist
CMD ["serve", "-s", "dist", "-l", "3000"]
```
