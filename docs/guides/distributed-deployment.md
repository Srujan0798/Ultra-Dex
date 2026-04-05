# Distributed Deployment Guide

Ultra-Dex supports distributed deployment for high availability, load balancing, and horizontal scaling. This guide covers setting up and managing distributed Ultra-Dex deployments across multiple servers or cloud instances.

## Architecture Overview

A distributed Ultra-Dex deployment consists of:

- **Coordinator Nodes**: Handle task orchestration and distribution
- **Worker Nodes**: Execute tasks and process workloads
- **Discovery Service**: Automatic peer discovery and registration
- **Load Balancer**: Distributes incoming requests
- **Shared Storage**: For session state and caching (Redis/PostgreSQL)

## Quick Start with Docker Compose

### 1. Single-Node Distributed Setup

```yaml
# docker-compose.distributed.yml
version: '3.8'
services:
  ultradex-coordinator:
    image: ultradex/ultra-dex:latest
    environment:
      - ULTRA_DEX_MODE=coordinator
      - ULTRA_DEX_INSTANCE_ID=coord-1
      - REDIS_URL=redis://redis:6379
    ports:
      - '8080:8080'
    depends_on:
      - redis

  ultradex-worker-1:
    image: ultradex/ultra-dex:latest
    environment:
      - ULTRA_DEX_MODE=worker
      - ULTRA_DEX_INSTANCE_ID=worker-1
      - ULTRA_DEX_COORDINATOR_URL=http://ultradex-coordinator:8080
      - REDIS_URL=redis://redis:6379
    depends_on:
      - ultradex-coordinator
      - redis

  ultradex-worker-2:
    image: ultradex/ultra-dex:latest
    environment:
      - ULTRA_DEX_MODE=worker
      - ULTRA_DEX_INSTANCE_ID=worker-2
      - ULTRA_DEX_COORDINATOR_URL=http://ultradex-coordinator:8080
      - REDIS_URL=redis://redis:6379
    depends_on:
      - ultradex-coordinator
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
```

### 2. Deploy the Stack

```bash
docker-compose -f docker-compose.distributed.yml up -d
```

### 3. Verify Deployment

```bash
# Check coordinator status
curl http://localhost:8080/api/v1/status

# Check worker status
curl http://localhost:8080/api/v1/workers
```

## Multi-Node Deployment

### Using Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.distributed.yml ultradex
```

### Using Kubernetes

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ultradex-coordinator
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ultradex
      component: coordinator
  template:
    metadata:
      labels:
        app: ultradex
        component: coordinator
    spec:
      containers:
        - name: ultradex
          image: ultradex/ultra-dex:latest
          env:
            - name: ULTRA_DEX_MODE
              value: 'coordinator'
            - name: REDIS_URL
              value: 'redis://redis-service:6379'
          ports:
            - containerPort: 8080
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ultradex-worker
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ultradex
      component: worker
  template:
    metadata:
      labels:
        app: ultradex
        component: worker
    spec:
      containers:
        - name: ultradex
          image: ultradex/ultra-dex:latest
          env:
            - name: ULTRA_DEX_MODE
              value: 'worker'
            - name: ULTRA_DEX_COORDINATOR_URL
              value: 'http://ultradex-coordinator:8080'
            - name: REDIS_URL
              value: 'redis://redis-service:6379'
```

```bash
kubectl apply -f k8s-deployment.yaml
```

## Cloud Deployment Examples

### AWS ECS (Fargate)

```hcl
# main.tf
resource "aws_ecs_cluster" "ultradex" {
  name = "ultradex-cluster"
}

resource "aws_ecs_task_definition" "coordinator" {
  family                   = "ultradex-coordinator"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"
  memory                   = "2048"

  container_definitions = jsonencode([
    {
      name  = "ultradex-coordinator"
      image = "ultradex/ultra-dex:latest"
      environment = [
        { name = "ULTRA_DEX_MODE", value = "coordinator" },
        { name = "REDIS_URL", value = "redis://redis-cluster:6379" }
      ]
      portMappings = [
        {
          containerPort = 8080
          hostPort      = 8080
        }
      ]
    }
  ])
}

resource "aws_ecs_service" "coordinator" {
  name            = "ultradex-coordinator"
  cluster         = aws_ecs_cluster.ultradex.id
  task_definition = aws_ecs_task_definition.coordinator.arn
  desired_count   = 1

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.ultradex.id]
  }
}
```

### Google Cloud Run

```yaml
# cloud-run-service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: ultradex-coordinator
spec:
  template:
    spec:
      containers:
        - image: ultradex/ultra-dex:latest
          env:
            - name: ULTRA_DEX_MODE
              value: 'coordinator'
            - name: REDIS_URL
              value: 'redis://redis-cluster:6379'
          ports:
            - containerPort: 8080
          resources:
            limits:
              cpu: '1000m'
              memory: '2Gi'
```

### Azure Container Instances

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "resources": [
    {
      "type": "Microsoft.ContainerInstance/containerGroups",
      "apiVersion": "2021-07-01",
      "name": "ultradex-coordinator",
      "location": "[resourceGroup().location]",
      "properties": {
        "containers": [
          {
            "name": "ultradex",
            "properties": {
              "image": "ultradex/ultra-dex:latest",
              "environmentVariables": [
                {
                  "name": "ULTRA_DEX_MODE",
                  "value": "coordinator"
                }
              ],
              "ports": [
                {
                  "port": 8080
                }
              ],
              "resources": {
                "requests": {
                  "cpu": 1,
                  "memoryInGB": 2
                }
              }
            }
          }
        ],
        "osType": "Linux",
        "ipAddress": {
          "type": "Public",
          "ports": [
            {
              "protocol": "tcp",
              "port": 8080
            }
          ]
        }
      }
    }
  ]
}
```

## Configuration Management

### Environment Variables

```bash
# Core Configuration
ULTRA_DEX_MODE=coordinator|worker
ULTRA_DEX_INSTANCE_ID=unique-instance-id
ULTRA_DEX_COORDINATOR_URL=http://coordinator:8080

# Networking
ULTRA_DEX_PORT=8080
ULTRA_DEX_HOST=0.0.0.0
ULTRA_DEX_DISCOVERY_URLS=http://peer1:8080,http://peer2:8080

# Storage
REDIS_URL=redis://redis:6379
DATABASE_URL=postgresql://user:pass@db:5432/ultradex

# Security
JWT_SECRET=your-secret-key
API_KEYS=key1,key2,key3

# Performance
MAX_CONCURRENT_TASKS=10
TASK_TIMEOUT_MS=300000
ENABLE_CACHING=true
CACHE_TTL_MS=3600000
```

### Configuration Files

```javascript
// config/production.js
export default {
  mode: 'worker',
  coordinator: {
    url: process.env.ULTRA_DEX_COORDINATOR_URL,
    heartbeatInterval: 30000,
  },
  redis: {
    url: process.env.REDIS_URL,
    cluster: true,
  },
  security: {
    jwtSecret: process.env.JWT_SECRET,
    apiKeys: process.env.API_KEYS?.split(','),
  },
  performance: {
    maxConcurrentTasks: parseInt(process.env.MAX_CONCURRENT_TASKS) || 10,
    taskTimeoutMs: parseInt(process.env.TASK_TIMEOUT_MS) || 300000,
    enableCaching: process.env.ENABLE_CACHING === 'true',
    cacheTtlMs: parseInt(process.env.CACHE_TTL_MS) || 3600000,
  },
};
```

## Load Balancing and Scaling

### Nginx Load Balancer

```nginx
# nginx.conf
upstream ultradex_backend {
    least_conn;
    server ultradex-coord-1:8080 weight=3;
    server ultradex-coord-2:8080 weight=3;
    server ultradex-coord-3:8080 weight=2;
    server ultradex-worker-1:8080 weight=1;
    server ultradex-worker-2:8080 weight=1;
}

server {
    listen 80;
    server_name api.ultra-dex.ai;

    location / {
        proxy_pass http://ultradex_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Health check for load balancer
        health_check interval=10 fails=3 passes=2;
    }

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### Auto Scaling

```javascript
// auto-scaler.js
import { ECS } from '@aws-sdk/client-ecs';
import { CloudWatch } from '@aws-sdk/client-cloudwatch';

const ecs = new ECS();
const cloudwatch = new CloudWatch();

async function scaleBasedOnLoad() {
  const metrics = await cloudwatch.getMetricStatistics({
    Namespace: 'AWS/ECS',
    MetricName: 'CPUUtilization',
    Dimensions: [
      { Name: 'ClusterName', Value: 'ultradex-cluster' },
      { Name: 'ServiceName', Value: 'ultradex-worker' },
    ],
    StartTime: new Date(Date.now() - 300000), // 5 minutes ago
    EndTime: new Date(),
    Period: 300,
    Statistics: ['Average'],
  });

  const avgCpu = metrics.Datapoints?.[0]?.Average || 0;

  if (avgCpu > 80) {
    // Scale up
    await ecs.updateService({
      cluster: 'ultradex-cluster',
      service: 'ultradex-worker',
      desiredCount: 5,
    });
  } else if (avgCpu < 30) {
    // Scale down
    await ecs.updateService({
      cluster: 'ultradex-cluster',
      service: 'ultradex-worker',
      desiredCount: 2,
    });
  }
}

// Run every 5 minutes
setInterval(scaleBasedOnLoad, 300000);
```

## Monitoring and Observability

### Health Checks

```javascript
// health-check.js
import express from 'express';
import { redisClient } from './redis.js';

const app = express();

app.get('/health', async (req, res) => {
  try {
    // Check Redis connectivity
    await redisClient.ping();

    // Check coordinator connectivity if worker
    if (process.env.ULTRA_DEX_MODE === 'worker') {
      await checkCoordinatorHealth();
    }

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      instance: process.env.ULTRA_DEX_INSTANCE_ID,
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/ready', async (req, res) => {
  // Readiness check - can accept traffic
  const isReady = await checkReadiness();
  res.status(isReady ? 200 : 503).json({
    ready: isReady,
    timestamp: new Date().toISOString(),
  });
});

app.get('/metrics', async (req, res) => {
  const metrics = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    activeTasks: getActiveTaskCount(),
    completedTasks: getCompletedTaskCount(),
    peers: getConnectedPeers(),
  };

  res.json(metrics);
});

app.listen(8080, () => {
  console.log('Health check server running on port 8080');
});
```

### Distributed Tracing

```javascript
// tracing.js
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { trace, SpanKind } from '@opentelemetry/api';

// Initialize tracing
const provider = new NodeTracerProvider();
const exporter = new JaegerExporter({
  endpoint: process.env.JAEGER_ENDPOINT || 'http://jaeger:14268/api/traces',
});

provider.addSpanProcessor(new BatchSpanProcessor(exporter));
provider.register();

// Middleware for tracing requests
export function tracingMiddleware(req, res, next) {
  const tracer = trace.getTracer('ultra-dex');
  const span = tracer.startSpan(`HTTP ${req.method} ${req.path}`, {
    kind: SpanKind.SERVER,
    attributes: {
      'http.method': req.method,
      'http.url': req.url,
      'instance.id': process.env.ULTRA_DEX_INSTANCE_ID,
    },
  });

  res.on('finish', () => {
    span.setAttribute('http.status_code', res.statusCode);
    span.end();
  });

  next();
}
```

### Centralized Logging

```javascript
// logger.js
import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'ultra-dex',
    instance: process.env.ULTRA_DEX_INSTANCE_ID,
    distributed: true,
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new ElasticsearchTransport({
      level: 'info',
      indexPrefix: 'ultra-dex-logs',
      clientOpts: {
        node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200',
      },
    }),
  ],
});

// Distributed tracing correlation
logger.distributedTrace = (traceId, message, meta = {}) => {
  logger.info(message, {
    ...meta,
    traceId,
    distributed: {
      traceId,
      instanceId: process.env.ULTRA_DEX_INSTANCE_ID,
    },
  });
};

export default logger;
```

## Real-World Use Cases

### API Development Platform

```javascript
// Distributed API generation service
const apiGenerator = new DistributedCoordinator({
  instanceId: 'api-generator-1',
  discoveryUrls: ['http://api-gen-2:8080', 'http://api-gen-3:8080'],
});

// Handle API generation requests
app.post('/generate-api', async (req, res) => {
  const { spec, language } = req.body;

  const result = await apiGenerator.submitTask({
    type: 'api-generation',
    spec,
    language,
    priority: 2,
  });

  res.json(result);
});
```

### Data Processing Pipeline

```javascript
// Distributed data processing
const dataProcessor = new DistributedCoordinator({
  instanceId: 'data-processor-1',
  maxConcurrentTasks: 20,
});

// Process large datasets
app.post('/process-dataset', async (req, res) => {
  const { datasetUrl, operations } = req.body;

  const result = await dataProcessor.submitTask({
    type: 'data-processing',
    datasetUrl,
    operations, // ['clean', 'transform', 'analyze']
    distributed: true,
  });

  res.json(result);
});
```

### ML Model Training

```javascript
// Distributed ML training coordinator
const mlCoordinator = new DistributedCoordinator({
  instanceId: 'ml-trainer-1',
  enableLoadBalancing: true,
});

// Train models across multiple GPUs
app.post('/train-model', async (req, res) => {
  const { modelConfig, dataset, epochs } = req.body;

  const result = await mlCoordinator.submitTask({
    type: 'ml-training',
    modelConfig,
    dataset,
    epochs,
    distributed: true,
    gpuRequired: true,
  });

  res.json(result);
});
```

## Security Best Practices

### Network Security

```bash
# Firewall rules
ufw allow 8080/tcp
ufw allow from 10.0.0.0/8 to any port 6379  # Redis internal
ufw allow from 10.0.0.0/8 to any port 5432  # PostgreSQL internal
```

### Secrets Management

```javascript
// secrets.js
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { GoogleSecretManager } from '@google-cloud/secret-manager';

export class SecretsManager {
  constructor(provider = 'aws') {
    this.provider = provider;
    this.client = provider === 'aws' ? new SecretsManager() : new GoogleSecretManager();
  }

  async getSecret(name) {
    if (this.provider === 'aws') {
      const response = await this.client.getSecretValue({ SecretId: name });
      return response.SecretString;
    } else {
      const [version] = await this.client.accessSecretVersion({
        name: `projects/project/secrets/${name}/versions/latest`,
      });
      return version.payload.data.toString();
    }
  }
}
```

### TLS Configuration

```javascript
// tls-config.js
import fs from 'fs';
import https from 'https';

const options = {
  key: fs.readFileSync('/etc/ssl/private/ultra-dex.key'),
  cert: fs.readFileSync('/etc/ssl/certs/ultra-dex.crt'),
  ca: fs.readFileSync('/etc/ssl/certs/ca.crt'),
  requestCert: true,
  rejectUnauthorized: true,
};

const server = https.createServer(options, app);

server.listen(8443, () => {
  console.log('HTTPS server running on port 8443');
});
```

## Troubleshooting

### Common Issues

#### Network Connectivity

```bash
# Test connectivity between nodes
telnet coordinator-host 8080

# Check DNS resolution
nslookup ultradex-coordinator

# Test API endpoints
curl -v http://coordinator:8080/api/v1/status
```

#### Load Imbalance

```bash
# Check worker loads
curl http://coordinator:8080/api/v1/workers | jq '.workers[] | {id, load}'

# View task distribution
curl http://coordinator:8080/api/v1/tasks | jq '.tasks[] | {id, worker, status}'
```

#### Performance Issues

```bash
# Monitor system resources
top -p $(pgrep -f "ultra-dex")

# Check memory usage
free -h

# Monitor network traffic
iftop -i eth0
```

### Debug Commands

```bash
# Enable debug logging
export DEBUG=ultra-dex:*

# Test with verbose output
curl -v http://localhost:8080/api/v1/status

# Check distributed logs
docker-compose logs -f ultradex-worker-1
kubectl logs -f deployment/ultradex-worker
```

This guide provides a comprehensive foundation for deploying Ultra-Dex in distributed environments. For specific cloud provider optimizations or advanced configurations, consult the cloud-specific documentation sections.</content>
<parameter name="filePath">guides/distributed-deployment.md
