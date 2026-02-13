# Ultra-Dex Enterprise Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Security Setup](#security-setup)
6. [Scaling & Performance](#scaling--performance)
7. [Monitoring & Operations](#monitoring--operations)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

## Prerequisites

### System Requirements
- **CPU**: 8+ cores (16+ recommended for production)
- **Memory**: 32GB+ RAM (64GB+ recommended for production)
- **Storage**: 500GB+ SSD (1TB+ recommended for production)
- **OS**: Linux (Ubuntu 22.04 LTS, CentOS 8+, RHEL 8+), macOS 13+, Windows Server 2022
- **Node.js**: v18.17+ or v20.0+ (v20+ recommended)

### Network Requirements
- Outbound HTTPS access to AI providers (OpenAI, Anthropic, Google, etc.)
- Inbound access for API requests (typically ports 80/443)
- Optional: VPN access for private MCP servers

### Security Prerequisites
- Certificate authority for TLS termination
- Identity provider for SSO (SAML/OIDC)
- IAM roles and policies for cloud deployments
- Network security groups/firewall rules

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer                            │
│                    (TLS Termination)                           │
├─────────────────────────────────────────────────────────────────┤
│                        API Gateway                              │
│                   (Authentication & Rate Limit)                 │
├─────────────────────────────────────────────────────────────────┤
│                    Ultra-Dex Cluster                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │   Agent     │ │   Memory    │ │   MCP       │              │
│  │  Orchestrator│ │   Manager   │ │   Server    │              │
│  │             │ │             │ │             │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│                    Data Layer                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │   PostgreSQL│ │   Redis     │ │   Object    │              │
│  │   (Primary) │ │   (Cache)   │ │   Storage   │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### Components

1. **Agent Orchestrator**: Coordinates AI agents and tasks
2. **Memory Manager**: Handles hot/warm/cold memory tiers
3. **MCP Server**: Model Context Protocol for tool integration
4. **API Gateway**: Authentication, rate limiting, and routing
5. **Data Layer**: Persistent storage and caching

## Installation

### Option 1: Docker Compose (Recommended for Production)

```bash
# Clone the repository
git clone https://github.com/ultra-dex/enterprise.git
cd enterprise

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration

# Deploy with Docker Compose
docker-compose -f docker-compose.enterprise.yaml up -d
```

### Option 2: Kubernetes (For Large-Scale Deployments)

```bash
# Add Ultra-Dex Helm repository
helm repo add ultra-dex https://charts.ultra-dex.ai
helm repo update

# Install Ultra-Dex Enterprise
helm install ultra-dex ultra-dex/ultra-dex-enterprise \
  --namespace ultra-dex \
  --create-namespace \
  --values enterprise-values.yaml
```

### Option 3: Bare Metal/VM Deployment

```bash
# Install Node.js dependencies
npm install -g ultra-dex@enterprise

# Create system user
sudo useradd -r -s /bin/false ultra-dex
sudo mkdir -p /opt/ultra-dex /var/lib/ultra-dex /var/log/ultra-dex
sudo chown ultra-dex:ultra-dex /opt/ultra-dex /var/lib/ultra-dex /var/log/ultra-dex

# Configure systemd service
sudo cp config/systemd/ultra-dex.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable ultra-dex
sudo systemctl start ultra-dex
```

## Configuration

### Environment Variables

```bash
# Core Configuration
ULTRADEX_MODE=enterprise
ULTRADEX_CLUSTER_MODE=true
ULTRADEX_NODE_ID=node-1
ULTRADEX_SHARED_SECRET=your-super-secret-here

# Database Configuration
DATABASE_URL=postgresql://user:password@primary-db:5432/ultra_dex
DATABASE_REPLICA_URL=postgresql://user:password@replica-db:5432/ultra_dex
REDIS_URL=redis://cache-cluster:6379

# Security Configuration
JWT_SECRET=your-jwt-secret-here
ENCRYPTION_KEY=your-encryption-key-here
AUDIT_LOG_LEVEL=info

# AI Provider Configuration
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_API_KEY=your-google-key

# Network Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=443
TRUST_PROXY=true
MAX_BODY_SIZE=50mb

# Performance Configuration
MAX_CONCURRENT_AGENTS=50
MEMORY_CACHE_SIZE=1gb
AGENT_TIMEOUT=300s
```

### Configuration File (config/enterprise.yaml)

```yaml
server:
  host: 0.0.0.0
  port: 443
  ssl:
    enabled: true
    certificate: /path/to/certificate.pem
    key: /path/to/private-key.pem
  cors:
    origin: https://your-domain.com
    credentials: true

database:
  primary:
    url: postgresql://user:password@primary-db:5432/ultra_dex
    poolSize: 20
  replica:
    url: postgresql://user:password@replica-db:5432/ultra_dex
    poolSize: 10

cache:
  redis:
    url: redis://cache-cluster:6379
    ttl: 3600
    maxMemory: 2gb

security:
  jwt:
    secret: your-jwt-secret
    expiresIn: 24h
  encryption:
    algorithm: aes-256-gcm
    keyRotationDays: 30
  audit:
    enabled: true
    retentionDays: 90
    logLevel: info

aiProviders:
  openai:
    enabled: true
    apiKey: ${OPENAI_API_KEY}
    models:
      - gpt-4o-2024-11-20
      - gpt-4o-mini
  anthropic:
    enabled: true
    apiKey: ${ANTHROPIC_API_KEY}
    models:
      - claude-3-5-sonnet-latest
      - claude-3-haiku-20240307

agents:
  defaultConcurrency: 50
  maxRetries: 3
  timeout: 300000
  sandbox:
    enabled: true
    allowNetwork: false
    maxMemory: 1gb
    maxRuntime: 300000

logging:
  level: info
  format: json
  file:
    enabled: true
    path: /var/log/ultra-dex/app.log
    maxSize: 100mb
    maxFiles: 10
  loki:
    enabled: false
    url: http://loki:3100
```

## Security Setup

### 1. Identity & Access Management

#### SSO Configuration (SAML 2.0)
```bash
# Configure SAML with your identity provider
ultra-dex config sso \
  --provider saml \
  --entity-id https://your-domain.com \
  --acs-url https://your-domain.com/auth/saml/callback \
  --idp-metadata-url https://your-idp.com/metadata.xml
```

#### OIDC Configuration
```bash
# Configure OIDC with your identity provider
ultra-dex config sso \
  --provider oidc \
  --client-id your-client-id \
  --client-secret your-client-secret \
  --issuer https://your-idp.com \
  --redirect-uri https://your-domain.com/auth/oidc/callback
```

### 2. Network Security

#### Firewall Rules
```bash
# Required inbound ports
- 443/tcp: HTTPS API access
- 80/tcp: HTTP redirect to HTTPS
- 22/tcp: SSH (if needed for administration)

# Required outbound ports
- 443/tcp: AI provider APIs
- 5432/tcp: PostgreSQL (if external)
- 6379/tcp: Redis (if external)
- 53/udp: DNS resolution
```

#### TLS Configuration
```nginx
# Nginx configuration for TLS termination
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.pem;
    ssl_certificate_key /path/to/private-key.pem;
    ssl_protocols TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://ultra-dex-backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Data Protection

#### Encryption at Rest
```bash
# Enable transparent data encryption for PostgreSQL
ALTER SYSTEM SET ssl = 'on';
ALTER SYSTEM SET ssl_cert_file = '/path/to/server.crt';
ALTER SYSTEM SET ssl_key_file = '/path/to/server.key';
SELECT pg_reload_conf();
```

#### Backup Encryption
```bash
# Configure encrypted backups
BACKUP_ENCRYPTION_KEY=your-backup-encryption-key
BACKUP_RETENTION_DAYS=90
BACKUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM
```

## Scaling & Performance

### Horizontal Scaling

#### Cluster Configuration
```yaml
# cluster.yaml
cluster:
  mode: true
  nodes:
    - id: node-1
      host: ultra-dex-1.internal
      port: 4000
    - id: node-2
      host: ultra-dex-2.internal
      port: 4000
    - id: node-3
      host: ultra-dex-3.internal
      port: 4000
  loadBalancer: round-robin
  failover:
    enabled: true
    timeout: 30s
```

#### Auto-scaling with Kubernetes
```yaml
# autoscaler.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ultra-dex-agents
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ultra-dex-agents
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Performance Tuning

#### Database Optimization
```sql
-- PostgreSQL performance settings
ALTER SYSTEM SET shared_buffers = '8GB';
ALTER SYSTEM SET effective_cache_size = '24GB';
ALTER SYSTEM SET work_mem = '32MB';
ALTER SYSTEM SET maintenance_work_mem = '2GB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
SELECT pg_reload_conf();
```

#### Memory Optimization
```bash
# JVM/Node.js optimization
NODE_OPTIONS="--max-old-space-size=16384 --experimental-global-webcrypto"
ULTRADEX_MEMORY_HOT_TTL=3600
ULTRADEX_MEMORY_WARM_TTL=86400
ULTRADEX_MEMORY_COLD_TTL=2592000
```

## Monitoring & Operations

### 1. Infrastructure Monitoring

#### Prometheus Configuration
```yaml
# prometheus.yaml
scrape_configs:
  - job_name: 'ultra-dex'
    static_configs:
      - targets: ['ultra-dex-1:9090', 'ultra-dex-2:9090', 'ultra-dex-3:9090']
    metrics_path: /metrics
    scrape_interval: 15s
```

#### Key Metrics to Monitor
- `ultra_dex_agents_active` - Active agents
- `ultra_dex_memory_utilization` - Memory usage percentage
- `ultra_dex_api_requests_total` - Total API requests
- `ultra_dex_api_request_duration_seconds` - Request duration
- `ultra_dex_cost_daily` - Daily costs
- `ultra_dex_security_incidents_total` - Security incidents

### 2. Log Management

#### Centralized Logging
```bash
# Configure Fluent Bit for log forwarding
[SERVICE]
    Flush         1
    Log_Level     info
    Daemon        off
    Parsers_File  parsers.conf

[INPUT]
    Name              tail
    Path              /var/log/ultra-dex/*.log
    Parser            json
    Refresh_Interval  5

[OUTPUT]
    Name  forward
    Match *
    Host  log-aggregator
    Port  24224
```

### 3. Alerting

#### Alert Rules (Prometheus)
```yaml
groups:
- name: ultra-dex.rules
  rules:
  - alert: UltraDexHighErrorRate
    expr: rate(ultra_dex_api_requests_total{status=~"5.."}[5m]) > 0.1
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "Ultra-Dex high error rate"
      description: "More than 10% of requests are failing for more than 2 minutes"

  - alert: UltraDexHighLatency
    expr: histogram_quantile(0.95, ultra_dex_api_request_duration_seconds_bucket) > 2
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Ultra-Dex high latency"
      description: "95th percentile latency is above 2 seconds"
```

## Troubleshooting

### Common Issues

#### 1. Agent Connection Issues
```bash
# Check agent connectivity
ultra-dex debug agents --status

# Verify MCP server status
ultra-dex debug mcp --status

# Check network connectivity
telnet ai-provider-api.com 443
```

#### 2. Performance Issues
```bash
# Check system resources
top -p $(pgrep ultra-dex)
df -h /var/lib/ultra-dex
iostat -x 1 5

# Check database performance
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM agents WHERE status = 'active';
```

#### 3. Security Issues
```bash
# Check audit logs
tail -f /var/log/ultra-dex/audit.log

# Verify encryption
ultra-dex security verify --encryption
ultra-dex security verify --certificates
```

### Diagnostic Commands
```bash
# System health check
ultra-dex doctor

# Configuration validation
ultra-dex config validate

# Performance diagnostics
ultra-dex debug performance

# Security audit
ultra-dex security audit
```

## Best Practices

### 1. Security Best Practices
- Enable MFA for all administrative accounts
- Use short-lived API keys with rotation
- Implement network segmentation
- Regular security assessments and penetration testing
- Monitor for anomalous access patterns

### 2. Performance Best Practices
- Use CDN for static assets
- Implement caching strategies
- Optimize database queries
- Monitor resource utilization
- Plan for capacity growth

### 3. Operational Best Practices
- Implement comprehensive backup strategies
- Establish incident response procedures
- Regular system updates and patching
- Monitor SLA compliance
- Document operational procedures

---

**Document Version**: 6.0.0  
**Last Updated**: February 13, 2026  
**Next Review**: May 13, 2026