# 🚀 Ultra-Dex v4.3.0 - Production Deployment Guide

## 📋 **DEPLOYMENT OVERVIEW**

This guide provides comprehensive instructions for deploying Ultra-Dex v4.3.0 in production environments with all enhanced features.

### **Architecture Components**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Clients    │    │   MCP Server    │    │   Ultra-Dex     │
│ (Claude/Cursor) │◄──►│   (Context)     │◄──►│   (Orchestration) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
    ┌────▼────┐            ┌─────▼─────┐           ┌─────▼─────┐
    │ MCP     │            │ Context   │           │ Core      │
    │ Protocol│            │ Bus       │           │ Engine    │
    └─────────┘            └───────────┘           └───────────┘
```

## 🛠️ **PREREQUISITES**

### **System Requirements**
```bash
# Node.js (v18+ required)
node --version  # Should be >= 18.0.0

# npm (v8+ required) 
npm --version   # Should be >= 8.0.0

# Docker (for sandbox execution)
docker --version  # Required for secure code execution

# Git (for version control)
git --version     # Required for context management
```

### **Infrastructure Requirements**
- **CPU**: 4+ cores (8+ recommended)
- **Memory**: 8GB+ RAM (16GB+ for production)
- **Storage**: 50GB+ available space
- **Network**: Stable internet connection
- **Ports**: 8866 (MCP), 3000 (Dashboard), 9000+ (Agents)

## 📦 **INSTALLATION METHODS**

### **Method 1: Global Installation (Recommended)**
```bash
# Install globally
npm install -g ultra-dex@4.3.0

# Verify installation
ultra-dex --version  # Should show 4.3.0
ultra-dex --help     # Verify all commands available
```

### **Method 2: Docker Deployment**
```dockerfile
# Dockerfile for production
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    git \
    bash

WORKDIR /app

# Install ultra-dex globally
RUN npm install -g ultra-dex@4.3.0

# Create non-root user
RUN addgroup -g 1001 -S ultra-dex && \
    adduser -S ultra-dex -u 1001

# Switch to non-root user
USER ultra-dex

# Expose MCP server port
EXPOSE 8866

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD ultra-dex health check || exit 1

CMD ["ultra-dex", "serve"]
```

```bash
# Build and run
docker build -t ultra-dex:4.3.0 .
docker run -d --name ultra-dex \
  -p 8866:8866 \
  -v ultra-dex-data:/home/ultra-dex/.ultra-dex \
  -e OPENAI_API_KEY=your-key \
  ultra-dex:4.3.0
```

### **Method 3: Kubernetes Deployment**
```yaml
# k8s-deployment.yaml
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
        image: ultra-dex:4.3.0
        ports:
        - containerPort: 8866
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ultra-dex-secrets
              key: openai-api-key
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: ultra-dex-secrets
              key: anthropic-api-key
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8866
          initialDelaySeconds: 60
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 8866
          initialDelaySeconds: 30
          periodSeconds: 10

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
      port: 8866
      targetPort: 8866
  type: ClusterIP
```

## 🔐 **SECURITY CONFIGURATION**

### **API Key Management**
```bash
# Create secure .env file
cat > .env << EOF
# AI Provider Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=...
GOOGLE_API_KEY=...

# Ultra-Dex Configuration
ULTRA_DEX_THEME=dark
ULTRA_DEX_PROVIDER=openai
ULTRA_DEX_MODEL=gpt-4-turbo

# Security Settings
ULTRA_DEX_SECURITY_AUDIT_ENABLED=true
ULTRA_DEX_RATE_LIMIT_ENABLED=true
ULTRA_DEX_LOG_LEVEL=info
EOF

# Secure file permissions
chmod 600 .env
```

### **MCP Server Security**
```javascript
// ultra-dex.config.js
export default {
  mcp: {
    server: {
      port: 8866,
      host: '0.0.0.0',  // Bind to all interfaces in production
      cors: {
        origin: ['https://your-domain.com'],  // Restrict origins
        credentials: true
      },
      auth: {
        enabled: true,
        apiKey: process.env.ULTRA_DEX_MCP_API_KEY
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // Limit each IP to 100 requests per windowMs
      }
    }
  },
  security: {
    sandbox: {
      enabled: true,
      docker: {
        enabled: true,
        timeout: 300000, // 5 minutes
        memoryLimit: '1g',
        cpuLimit: '1.0'
      }
    },
    validation: {
      enabled: true,
      inputSanitization: true,
      outputFiltering: true
    }
  }
};
```

## ⚙️ **CONFIGURATION MANAGEMENT**

### **Production Configuration**
```json
{
  "ultra-dex": {
    "version": "4.3.0",
    "environment": "production",
    "features": {
      "mcpServer": {
        "enabled": true,
        "port": 8866,
        "autoStart": true
      },
      "persistentMemory": {
        "enabled": true,
        "autoPrune": true,
        "pruneThreshold": 0.8
      },
      "agentSwarm": {
        "maxConcurrency": 5,
        "retryAttempts": 3,
        "timeout": 300000
      },
      "qualityAssurance": {
        "enabled": true,
        "verificationProtocol": 21,
        "autoVerify": true
      }
    },
    "security": {
      "rateLimiting": {
        "enabled": true,
        "requestsPerMinute": 1000
      },
      "sandbox": {
        "enabled": true,
        "docker": true
      },
      "auditLogging": {
        "enabled": true,
        "level": "info"
      }
    },
    "performance": {
      "maxWorkers": 8,
      "memoryLimit": "4GB",
      "cache": {
        "enabled": true,
        "ttl": 3600
      }
    }
  }
}
```

## 🚀 **DEPLOYMENT WORKFLOW**

### **1. Environment Setup**
```bash
# Clone repository (if needed)
git clone https://github.com/Srujan0798/Ultra-Dex.git
cd Ultra-Dex

# Install dependencies
npm install

# Verify system health
npx ultra-dex doctor
npx ultra-dex health check
```

### **2. Configuration**
```bash
# Create production config
npx ultra-dex config init --environment production

# Set production-specific settings
npx ultra-dex config set mcp.server.port 8866
npx ultra-dex config set security.sandbox.enabled true
npx ultra-dex config set performance.maxWorkers 8
```

### **3. Database Initialization**
```bash
# Initialize databases (if using persistent storage)
npx ultra-dex db:init
npx ultra-dex migrate:latest
```

### **4. MCP Server Deployment**
```bash
# Start MCP server in production mode
npx ultra-dex serve --port 8866 --production

# Or as a systemd service
sudo tee /etc/systemd/system/ultra-dex.service << EOF
[Unit]
Description=Ultra-Dex MCP Server
After=network.target

[Service]
Type=simple
User=ultra-dex
WorkingDirectory=/opt/ultra-dex
ExecStart=/usr/bin/npm run ultra-dex serve -- --port 8866
Restart=always
Environment=NODE_ENV=production
EnvironmentFile=/opt/ultra-dex/.env

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable ultra-dex
sudo systemctl start ultra-dex
```

### **5. Health Checks**
```bash
# Verify MCP server is running
curl http://localhost:8866/health

# Check system status
npx ultra-dex health check --full

# Monitor resource usage
npx ultra-dex performance monitor
```

## 📊 **MONITORING & OBSERVABILITY**

### **Metrics Collection**
```bash
# Enable metrics
npx ultra-dex config set monitoring.enabled true
npx ultra-dex config set monitoring.provider prometheus

# View metrics endpoint
curl http://localhost:8866/metrics
```

### **Logging Configuration**
```javascript
// logging.config.js
export const loggingConfig = {
  level: 'info',
  format: 'json',
  transports: [
    {
      type: 'file',
      filename: '/var/log/ultra-dex/app.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    },
    {
      type: 'console',
      format: '{timestamp} {level} {message}'
    }
  ],
  silent: false
};
```

### **Alerting Setup**
```bash
# Set up alerts for critical metrics
npx ultra-dex alerts configure --provider slack --webhook YOUR_WEBHOOK_URL
npx ultra-dex alerts add --metric response-time --threshold 1000 --action notify
npx ultra-dex alerts add --metric error-rate --threshold 5 --action notify
```

## 🔧 **TROUBLESHOOTING**

### **Common Issues**
```bash
# MCP server not starting
npx ultra-dex doctor
npx ultra-dex logs recent

# Agent swarm hanging
npx ultra-dex swarm status
npx ultra-dex swarm stop --all

# Memory issues
npx ultra-dex memory status
npx ultra-dex memory prune --force

# Context synchronization problems
npx ultra-dex context sync --force
npx ultra-dex verify --full
```

### **Diagnostic Commands**
```bash
# Comprehensive system check
npx ultra-dex diagnostics run

# Performance profiling
npx ultra-dex performance profile

# Security audit
npx ultra-dex security audit --deep

# Configuration validation
npx ultra-dex config validate --all
```

## 🔄 **UPGRADE PROCEDURES**

### **From Previous Versions**
```bash
# Backup current configuration
npx ultra-dex backup create --destination ./backup/

# Update to latest version
npm update -g ultra-dex

# Run migration scripts
npx ultra-dex migrate:run

# Verify upgrade
npx ultra-dex verify --full
npx ultra-dex health check
```

## 📋 **VERIFICATION CHECKLIST**

### **Pre-Deployment**
- [ ] All tests passing (`npm test`)
- [ ] Security scan passed
- [ ] Performance benchmarks met
- [ ] Configuration validated
- [ ] Backup created

### **Post-Deployment**
- [ ] MCP server accessible
- [ ] Health checks passing
- [ ] Context synchronization working
- [ ] Agent swarm functional
- [ ] Monitoring active
- [ ] Security measures active

## 🆘 **SUPPORT & MAINTENANCE**

### **Support Channels**
- **Documentation**: https://ultra-dex.github.io/docs
- **GitHub Issues**: https://github.com/Srujan0798/Ultra-Dex/issues
- **Community Forum**: [Coming Soon]
- **Enterprise Support**: [Contact Information]

### **Maintenance Schedule**
- **Daily**: Health checks and log rotation
- **Weekly**: Security scans and performance review
- **Monthly**: Backup verification and updates
- **Quarterly**: Architecture review and optimization

---

**Deployment Version**: Ultra-Dex v4.3.0  
**Guide Version**: 1.0  
**Last Updated**: February 8, 2026  
**Status**: Production Ready