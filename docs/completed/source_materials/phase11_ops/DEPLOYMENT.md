# Ultra-Dex CI/CD Configuration

## GitHub Actions Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Run linting
        run: npm run lint

      - name: Run security audit
        run: npm audit --audit-level moderate

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.x'
          registry-url: 'https://registry.npmjs.org/'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Run performance benchmarks
        run: node benchmark.js

      - name: Run comprehensive test suite
        run: node --test test-suite.js

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.x'
          registry-url: 'https://registry.npmjs.org/'

      - name: Install dependencies
        run: npm ci

      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Docker Configuration

### Dockerfile

```Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/info || exit 1

# Start command
CMD ["npx", "ultra-dex", "serve", "--port", "3001"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  ultradex:
    build: .
    ports:
      - '3001:3001'
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./projects:/app/projects
      - ultra-dex-data:/app/.ultra-dex
    restart: unless-stopped
    networks:
      - ultradex-network

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443.4.5'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - ultradex
    restart: unless-stopped
    networks:
      - ultradex-network

volumes:
  ultra-dex-data:

networks:
  ultradex-network:
    driver: bridge
```

## Kubernetes Configuration

### deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ultra-dex
  labels:
    app: ultra-dex
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ultra-dex
  template:
    metadata:
      labels:
        app: ultra-dex
    spec:
      containers:
        - name: ultra-dex
          image: ultradex/ultra-dex:latest
          ports:
            - containerPort: 3001
          env:
            - name: NODE_ENV
              value: 'production'
            - name: LOG_LEVEL
              value: 'info'
            - name: ANTHROPIC_API_KEY
              valueFrom:
                secretKeyRef:
                  name: ultra-dex-secrets
                  key: anthropic-api-key
            - name: OPENAI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: ultra-dex-secrets
                  key: openai-api-key
          resources:
            requests:
              memory: '256Mi'
              cpu: '250m'
            limits:
              memory: '512Mi'
              cpu: '500m'
          livenessProbe:
            httpGet:
              path: /api/info
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/info
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: ultra-dex-service
spec:
  selector:
    app: ultra-dex
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3001
  type: LoadBalancer
```

## Environment Configuration

### .env.production

```env
# Ultra-Dex Production Environment
NODE_ENV=production
LOG_LEVEL=info
PORT=3001

# API Keys (mounted as secrets in production)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_AI_KEY=

# Database Configuration
DATABASE_URL=

# Security Configuration
ALLOWED_ORIGINS=https://yourdomain.com
CORS_ENABLED=true

# Performance Configuration
CACHE_TIMEOUT=30000
MAX_CONCURRENT_TASKS=5

# Monitoring Configuration
LOG_FILE=.ultra-dex/logs/ultra-dex.log
METRICS_ENABLED=true
HEALTH_CHECK_INTERVAL=30000
```

### .env.staging

```env
# Ultra-Dex Staging Environment
NODE_ENV=staging
LOG_LEVEL=debug
PORT=3001

# API Keys (for testing)
ANTHROPIC_API_KEY=test_anthropic_key
OPENAI_API_KEY=test_openai_key
GOOGLE_AI_KEY=test_gemini_key

# Security Configuration
ALLOWED_ORIGINS=https://staging.yourdomain.com
CORS_ENABLED=true

# Performance Configuration
CACHE_TIMEOUT=15000
MAX_CONCURRENT_TASKS=3

# Monitoring Configuration
LOG_FILE=.ultra-dex/logs/staging.log
METRICS_ENABLED=true
HEALTH_CHECK_INTERVAL=15000
```

## Monitoring Configuration

### prometheus.yml

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'ultra-dex'
    static_configs:
      - targets: ['ultra-dex-service:3001']
    metrics_path: /api/metrics
    scrape_interval: 5s
```

### grafana-dashboard.json

```json
{
  "dashboard": {
    "id": null,
    "title": "Ultra-Dex Monitoring",
    "tags": ["ultra-dex", "ai", "orchestration"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "System Health",
        "type": "stat",
        "targets": [
          {
            "expr": "ultra_dex_health_status",
            "legendFormat": "Health Status"
          }
        ]
      },
      {
        "id": 2,
        "title": "API Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th Percentile"
          }
        ]
      }
    ]
  }
}
```

## Security Configuration

### .snykrc

```json
{
  "organization": "ultra-dex-org",
  "project": "ultra-dex-project",
  "severity-threshold": "high",
  "docker": {
    "platform": "linux/amd64"
  }
}
```

### .deepsource.toml

```toml
version = 1

[[analyzers]]
name = "javascript"
enabled = true

  [analyzers.meta]
  environment = ["nodejs"]

[[transformers]]
name = "prettier"
enabled = true

[[transformers]]
name = "eslint"
enabled = true
```

## Performance Configuration

### nginx.conf

```nginx
upstream ultradex_backend {
    server ultra-dex:3001;
}

server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://ultradex_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Performance optimizations
        proxy_cache_valid 200 302 10m;
        proxy_cache_valid 404 1m;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

This comprehensive CI/CD configuration provides:

1. **Automated Testing**: Multi-node version testing
2. **Security Scanning**: Vulnerability detection
3. **Containerization**: Docker and Kubernetes configs
4. **Monitoring**: Prometheus and Grafana integration
5. **Performance**: Optimized configurations
6. **Security**: Hardened deployment configurations
7. **Scalability**: Multi-replica deployment
8. **Observability**: Comprehensive monitoring setup
