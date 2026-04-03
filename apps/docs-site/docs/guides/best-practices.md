# Best Practices Guide

This guide outlines best practices for developing, deploying, and maintaining Ultra-Dex applications and integrations.

## Development Best Practices

### Code Organization

#### Project Structure
```
your-project/
├── src/
│   ├── agents/           # Custom agent implementations
│   ├── providers/        # Custom provider adapters
│   ├── tools/           # Custom tools and integrations
│   ├── workflows/       # Workflow definitions
│   └── utils/           # Utility functions
├── tests/
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── e2e/             # End-to-end tests
├── docs/                # Documentation
├── config/              # Configuration files
└── scripts/             # Build and deployment scripts
```

#### Agent Development
```typescript
// ✅ Good: Well-structured agent with proper error handling
class CodeReviewerAgent extends Agent {
  constructor() {
    super({
      id: 'code-reviewer',
      name: 'Code Reviewer',
      capabilities: ['code-review', 'security-audit'],
      model: 'claude-3-opus-20240229',
      provider: 'anthropic'
    });
  }

  async execute(task: Task): Promise<TaskResult> {
    try {
      const { code, language } = task.input;

      // Input validation
      if (!code || !language) {
        throw new ValidationError('Code and language are required');
      }

      // Analysis with timeout protection
      const analysis = await this.withTimeout(
        this.analyzeCode(code, language),
        30000
      );

      return {
        output: analysis,
        metadata: {
          language,
          issuesFound: analysis.issues.length,
          severity: this.calculateSeverity(analysis.issues)
        }
      };
    } catch (error) {
      return this.handleError(error, task);
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new TimeoutError('Analysis timed out')), timeout)
      )
    ]);
  }
}

// ❌ Bad: Monolithic agent without error handling
class BadAgent extends Agent {
  async execute(task: Task) {
    const result = await this.chat(`Review this code: ${task.input.code}`);
    return { output: result.content };
  }
}
```

### Error Handling

#### Comprehensive Error Handling
```typescript
// ✅ Good: Structured error handling with recovery
class RobustAgent extends Agent {
  async execute(task: Task): Promise<TaskResult> {
    try {
      // Primary execution logic
      const result = await this.performTask(task);
      return result;
    } catch (error) {
      // Log error with context
      this.logger.error('Task execution failed', {
        taskId: task.id,
        error: error.message,
        stack: error.stack
      });

      // Attempt recovery for recoverable errors
      if (this.isRecoverable(error)) {
        return await this.attemptRecovery(task, error);
      }

      // Return structured error response
      return {
        status: 'failed',
        error: {
          type: error.constructor.name,
          message: error.message,
          recoverable: false
        }
      };
    }
  }

  private isRecoverable(error: Error): boolean {
    return error instanceof NetworkError ||
           error instanceof RateLimitError;
  }

  private async attemptRecovery(task: Task, error: Error): Promise<TaskResult> {
    // Implement recovery logic (retry with backoff, fallback provider, etc.)
    await this.delay(1000);
    return this.execute(task);
  }
}
```

#### Custom Error Classes
```typescript
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string, public timeout: number) {
    super(message);
    this.name = 'TimeoutError';
  }
}
```

### Performance Optimization

#### Efficient Memory Usage
```typescript
// ✅ Good: Memory-efficient processing
class MemoryEfficientAgent extends Agent {
  async execute(task: Task): Promise<TaskResult> {
    const { files } = task.input;

    // Process files in batches to avoid memory spikes
    const results = [];
    const batchSize = 10;

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(file => this.processFile(file))
      );
      results.push(...batchResults);

      // Allow event loop to process other operations
      await new Promise(resolve => setImmediate(resolve));
    }

    return { output: { results } };
  }

  private async processFile(file: File) {
    // Process one file at a time
    const content = await this.readFile(file);
    const analysis = await this.analyzeContent(content);
    return { file: file.name, analysis };
  }
}
```

#### Caching Strategies
```typescript
class CachingAgent extends Agent {
  private cache = new Map<string, { data: any; expires: number }>();

  async execute(task: Task): Promise<TaskResult> {
    const cacheKey = this.generateCacheKey(task);

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Execute task
    const result = await this.performTask(task);

    // Cache result
    this.setCache(cacheKey, result, 300000); // 5 minutes

    return result;
  }

  private generateCacheKey(task: Task): string {
    return `${task.type}:${JSON.stringify(task.input)}`;
  }

  private getFromCache(key: string) {
    const item = this.cache.get(key);
    if (item && Date.now() < item.expires) {
      return item.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttl: number) {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    });
  }
}
```

### Testing Best Practices

#### Unit Testing
```typescript
// tests/agents/code-reviewer.test.ts
import { CodeReviewerAgent } from '../src/agents/code-reviewer';

describe('CodeReviewerAgent', () => {
  let agent: CodeReviewerAgent;

  beforeEach(() => {
    agent = new CodeReviewerAgent();
  });

  describe('execute', () => {
    it('should review JavaScript code successfully', async () => {
      const task = {
        id: 'test-task',
        type: 'code_review',
        input: {
          code: 'function add(a, b) { return a + b; }',
          language: 'javascript'
        }
      };

      const result = await agent.execute(task);

      expect(result.status).toBe('completed');
      expect(result.output).toHaveProperty('issues');
      expect(result.output).toHaveProperty('score');
    });

    it('should handle invalid input gracefully', async () => {
      const task = {
        id: 'test-task',
        type: 'code_review',
        input: {} // Missing required fields
      };

      const result = await agent.execute(task);

      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
    });

    it('should timeout on long-running analysis', async () => {
      // Mock a slow analysis
      jest.spyOn(agent, 'analyzeCode').mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 60000))
      );

      const task = {
        id: 'test-task',
        type: 'code_review',
        input: { code: 'long code...', language: 'javascript' }
      };

      const result = await agent.execute(task);

      expect(result.status).toBe('failed');
      expect(result.error.type).toBe('TimeoutError');
    });
  });
});
```

#### Integration Testing
```typescript
// tests/integration/task-execution.test.ts
describe('Task Execution Integration', () => {
  let client: UltraDex;

  beforeAll(async () => {
    client = new UltraDex({
      provider: 'mock',
      apiKey: 'test-key'
    });
  });

  it('should execute a complete workflow', async () => {
    const task = {
      type: 'feature_implementation',
      title: 'Implement user login',
      input: {
        requirements: ['email/password login', 'JWT tokens'],
        techStack: ['React', 'Node.js', 'PostgreSQL']
      },
      options: {
        agents: ['planner', 'coder', 'reviewer']
      }
    };

    const result = await client.executeTask(task);

    expect(result.status).toBe('completed');
    expect(result.output).toHaveProperty('plan');
    expect(result.output).toHaveProperty('code');
    expect(result.output).toHaveProperty('tests');
    expect(result.metadata.executionTime).toBeLessThan(300000); // 5 minutes
  });

  it('should handle provider failures gracefully', async () => {
    // Simulate provider failure
    mockProvider.setFailMode(true);

    const task = {
      type: 'code_generation',
      input: { prompt: 'Write a hello world function' }
    };

    const result = await client.executeTask(task);

    // Should either succeed with fallback or fail gracefully
    expect(['completed', 'failed']).toContain(result.status);
    if (result.status === 'failed') {
      expect(result.error).toBeDefined();
    }
  });
});
```

### Security Best Practices

#### Input Validation
```typescript
class SecureAgent extends Agent {
  async execute(task: Task): Promise<TaskResult> {
    // Validate input thoroughly
    const validation = this.validateInput(task.input);
    if (!validation.valid) {
      throw new ValidationError(`Invalid input: ${validation.errors.join(', ')}`);
    }

    // Sanitize input
    const sanitizedInput = this.sanitizeInput(task.input);

    // Execute with sanitized input
    return this.performSecureTask(sanitizedInput);
  }

  private validateInput(input: any): ValidationResult {
    const schema = {
      code: (value: any) => typeof value === 'string' && value.length < 100000,
      language: (value: any) => ['javascript', 'python', 'java', 'typescript'].includes(value),
      // Add more validations
    };

    const errors = [];
    for (const [field, validator] of Object.entries(schema)) {
      if (!validator(input[field])) {
        errors.push(`${field} is invalid`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private sanitizeInput(input: any): any {
    return {
      ...input,
      code: this.sanitizeCode(input.code),
      // Sanitize other fields
    };
  }

  private sanitizeCode(code: string): string {
    // Remove potentially dangerous patterns
    return code
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }
}
```

#### API Key Management
```typescript
class SecureProvider extends BaseProvider {
  constructor(config: ProviderConfig) {
    super(config);
    this.validateApiKey(config.apiKey);
  }

  private validateApiKey(apiKey: string) {
    if (!apiKey) {
      throw new Error('API key is required');
    }

    if (apiKey.length < 20) {
      throw new Error('API key appears to be invalid');
    }

    // Additional validation logic
  }

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    try {
      return await this.makeRequest(messages);
    } catch (error) {
      // Don't log API keys in error messages
      throw new Error(`Provider request failed: ${error.message}`);
    }
  }
}
```

### Configuration Management

#### Environment-Based Configuration
```typescript
// config/index.ts
import { z } from 'zod';

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'test', 'production']),
  port: z.number().default(3000),
  database: z.object({
    url: z.string().url(),
    poolSize: z.number().min(1).max(100).default(10),
  }),
  ai: z.object({
    providers: z.array(z.object({
      name: z.string(),
      apiKey: z.string().min(20),
      baseUrl: z.string().url().optional(),
      timeout: z.number().default(30000),
    })),
    defaultProvider: z.string(),
  }),
  security: z.object({
    jwtSecret: z.string().min(32),
    bcryptRounds: z.number().default(12),
    rateLimit: z.object({
      windowMs: z.number().default(900000), // 15 minutes
      maxRequests: z.number().default(100),
    }),
  }),
  monitoring: z.object({
    enabled: z.boolean().default(true),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    metrics: z.object({
      collectInterval: z.number().default(60000), // 1 minute
    }),
  }),
});

type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
  const config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000'),
    database: {
      url: process.env.DATABASE_URL!,
      poolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
    },
    ai: {
      providers: [
        {
          name: 'openai',
          apiKey: process.env.OPENAI_API_KEY!,
          timeout: parseInt(process.env.AI_TIMEOUT || '30000'),
        },
        // Add more providers
      ],
      defaultProvider: process.env.DEFAULT_AI_PROVIDER || 'openai',
    },
    security: {
      jwtSecret: process.env.JWT_SECRET!,
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100'),
      },
    },
    monitoring: {
      enabled: process.env.MONITORING_ENABLED !== 'false',
      logLevel: (process.env.LOG_LEVEL as any) || 'info',
      metrics: {
        collectInterval: parseInt(process.env.METRICS_INTERVAL || '60000'),
      },
    },
  };

  return configSchema.parse(config);
}

export const config = loadConfig();
```

## Deployment Best Practices

### Containerization
```dockerfile
# Dockerfile
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
```

### Kubernetes Deployment
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ultra-dex-app
  labels:
    app: ultra-dex
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
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
        image: myregistry/ultra-dex:v2.0.0
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: ultra-dex-config
        - secretRef:
            name: ultra-dex-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          runAsNonRoot: true
          runAsUser: 1001
          capabilities:
            drop:
            - ALL
      securityContext:
        fsGroup: 1001
```

### Monitoring and Observability

#### Structured Logging
```typescript
// logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ultra-dex' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// Add request ID tracking
declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function requestLogger(req: any, res: any, next: any) {
  req.requestId = req.headers['x-request-id'] || generateRequestId();

  logger.info('Request started', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      requestId: req.requestId,
      statusCode: res.statusCode,
      duration
    });
  });

  next();
}

export { logger };
```

#### Metrics Collection
```typescript
// metrics.ts
import { collectDefaultMetrics, register, Gauge, Counter, Histogram } from 'prom-client';

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics();

// Custom metrics
export const metrics = {
  activeConnections: new Gauge({
    name: 'ultra_dex_active_connections',
    help: 'Number of active connections'
  }),

  tasksCompleted: new Counter({
    name: 'ultra_dex_tasks_completed_total',
    help: 'Total number of tasks completed',
    labelNames: ['type', 'status']
  }),

  taskDuration: new Histogram({
    name: 'ultra_dex_task_duration_seconds',
    help: 'Task execution duration in seconds',
    labelNames: ['type'],
    buckets: [1, 5, 10, 30, 60, 120, 300]
  }),

  apiRequests: new Counter({
    name: 'ultra_dex_api_requests_total',
    help: 'Total API requests',
    labelNames: ['method', 'endpoint', 'status']
  }),

  providerLatency: new Histogram({
    name: 'ultra_dex_provider_latency_seconds',
    help: 'AI provider response latency',
    labelNames: ['provider', 'model'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  })
};

// Middleware to collect API metrics
export function metricsMiddleware(req: any, res: any, next: any) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;

    metrics.apiRequests
      .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
      .inc();

    // Record task metrics if applicable
    if (req.taskType) {
      metrics.taskDuration
        .labels(req.taskType)
        .observe(duration);
    }
  });

  next();
}
```

### Scaling Strategies

#### Horizontal Scaling
```typescript
// Auto-scaling based on queue depth
export class AutoScaler {
  constructor(
    private k8sClient: any,
    private queue: TaskQueue
  ) {}

  async scale() {
    const queueDepth = await this.queue.getDepth();
    const currentReplicas = await this.getCurrentReplicas();

    let targetReplicas = currentReplicas;

    if (queueDepth > 100) {
      targetReplicas = Math.min(currentReplicas * 2, 50); // Max 50 replicas
    } else if (queueDepth < 10) {
      targetReplicas = Math.max(currentReplicas / 2, 3); // Min 3 replicas
    }

    if (targetReplicas !== currentReplicas) {
      await this.setReplicas(targetReplicas);
      logger.info(`Scaled from ${currentReplicas} to ${targetReplicas} replicas`);
    }
  }

  private async getCurrentReplicas(): Promise<number> {
    // Get current replica count from Kubernetes API
  }

  private async setReplicas(count: number): Promise<void> {
    // Update deployment replicas via Kubernetes API
  }
}
```

#### Load Balancing
```typescript
// Load balancer with health checks
export class LoadBalancer {
  private workers: Worker[] = [];

  async addWorker(worker: Worker) {
    this.workers.push(worker);
    await this.startHealthCheck(worker);
  }

  async distributeTask(task: Task): Promise<Worker> {
    const healthyWorkers = this.workers.filter(w => w.isHealthy);

    if (healthyWorkers.length === 0) {
      throw new Error('No healthy workers available');
    }

    // Least loaded worker
    return healthyWorkers.reduce((least, current) =>
      current.load < least.load ? current : least
    );
  }

  private async startHealthCheck(worker: Worker) {
    setInterval(async () => {
      try {
        await worker.ping();
        worker.isHealthy = true;
        worker.lastHealthCheck = Date.now();
      } catch (error) {
        worker.isHealthy = false;
        logger.warn(`Worker ${worker.id} health check failed`, { error });
      }
    }, 30000); // Check every 30 seconds
  }
}
```

## Operational Best Practices

### Backup and Recovery

#### Automated Backups
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_DIR/db_$DATE.sql

# Configuration backup
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /app/config/

# Upload to cloud storage
aws s3 cp $BACKUP_DIR/db_$DATE.sql s3://ultra-dex-backups/database/
aws s3 cp $BACKUP_DIR/config_$DATE.tar.gz s3://ultra-dex-backups/config/

# Cleanup old backups (keep last 30 days)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

#### Disaster Recovery
```typescript
// disaster-recovery.ts
export class DisasterRecovery {
  async createRecoveryPoint() {
    const timestamp = Date.now();

    // Snapshot database
    await this.snapshotDatabase(timestamp);

    // Backup configurations
    await this.backupConfigurations(timestamp);

    // Create recovery manifest
    await this.createManifest(timestamp);

    logger.info(`Recovery point created: ${timestamp}`);
  }

  async recover(timestamp: number) {
    logger.info(`Starting recovery from: ${timestamp}`);

    // Validate recovery point
    const manifest = await this.validateRecoveryPoint(timestamp);

    // Restore database
    await this.restoreDatabase(timestamp);

    // Restore configurations
    await this.restoreConfigurations(timestamp);

    // Verify recovery
    await this.verifyRecovery();

    logger.info(`Recovery completed successfully`);
  }

  private async validateRecoveryPoint(timestamp: number) {
    // Check if all required backups exist and are valid
  }

  private async restoreDatabase(timestamp: number) {
    // Restore database from snapshot
  }
}
```

### Incident Response

#### Incident Response Plan
```typescript
// incident-response.ts
export class IncidentResponse {
  async handleIncident(incident: Incident) {
    // Log incident
    await this.logIncident(incident);

    // Assess severity
    const severity = this.assessSeverity(incident);

    // Notify team
    await this.notifyTeam(incident, severity);

    // Execute response plan
    switch (severity) {
      case 'critical':
        await this.handleCriticalIncident(incident);
        break;
      case 'high':
        await this.handleHighIncident(incident);
        break;
      case 'medium':
        await this.handleMediumIncident(incident);
        break;
      default:
        await this.handleLowIncident(incident);
    }

    // Document resolution
    await this.documentResolution(incident);
  }

  private assessSeverity(incident: Incident): Severity {
    if (incident.affectsAllUsers) return 'critical';
    if (incident.affectsManyUsers) return 'high';
    if (incident.affectsSomeUsers) return 'medium';
    return 'low';
  }

  private async handleCriticalIncident(incident: Incident) {
    // Immediate actions for critical incidents
    await this.enableMaintenanceMode();
    await this.scaleUpResources();
    await this.rollbackToLastGoodState();
  }
}
```

## Performance Best Practices

### Database Optimization

#### Query Optimization
```sql
-- Optimized queries with proper indexing

-- Create indexes for common queries
CREATE INDEX idx_tasks_status_created ON tasks(status, created_at);
CREATE INDEX idx_tasks_type ON tasks(type);
CREATE INDEX idx_memory_context_type ON memory_entries(context, type);

-- Use EXPLAIN to analyze query performance
EXPLAIN ANALYZE
SELECT * FROM tasks
WHERE status = 'completed'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 100;

-- Use proper data types
ALTER TABLE tasks ADD COLUMN metadata JSONB;
CREATE INDEX idx_tasks_metadata ON tasks USING GIN(metadata);
```

#### Connection Pooling
```typescript
// db.ts
import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: parseInt(process.env.DB_POOL_MAX || '20'), // Maximum connections
  min: parseInt(process.env.DB_POOL_MIN || '5'),  // Minimum connections
  idleTimeoutMillis: 30000,  // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Connection timeout
  query_timeout: 10000, // Query timeout
  statement_timeout: 10000, // Statement timeout
});

// Connection monitoring
pool.on('connect', (client) => {
  logger.debug('New database connection established');
});

pool.on('error', (err, client) => {
  logger.error('Database connection error', { error: err });
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Query executed', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Query failed', { text, duration, error });
    throw error;
  }
}
```

### Caching Strategies

#### Multi-Level Caching
```typescript
// cache.ts
import Redis from 'ioredis';
import NodeCache from 'node-cache';

export class MultiLevelCache {
  private l1Cache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 minutes
  private l2Cache = new Redis(process.env.REDIS_URL);

  async get(key: string): Promise<any> {
    // Check L1 cache first
    let value = this.l1Cache.get(key);
    if (value !== undefined) {
      return value;
    }

    // Check L2 cache
    value = await this.l2Cache.get(key);
    if (value) {
      // Populate L1 cache
      this.l1Cache.set(key, JSON.parse(value));
      return JSON.parse(value);
    }

    return null;
  }

  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    // Set both caches
    this.l1Cache.set(key, value, ttl);
    await this.l2Cache.setex(key, ttl, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    // Invalidate L1 cache
    const keys = this.l1Cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    matchingKeys.forEach(key => this.l1Cache.del(key));

    // Invalidate L2 cache
    const l2Keys = await this.l2Cache.keys(`*${pattern}*`);
    if (l2Keys.length > 0) {
      await this.l2Cache.del(...l2Keys);
    }
  }
}
```

## Security Best Practices

### Authentication and Authorization

#### JWT Implementation
```typescript
// auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(payload: object): string {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '24h',
      issuer: 'ultra-dex',
      audience: 'api'
    });
  }

  verifyToken(token: string): object | null {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!, {
        issuer: 'ultra-dex',
        audience: 'api'
      });
    } catch (error) {
      return null;
    }
  }

  async authenticate(req: any, res: any, next: any) {
    const token = this.extractToken(req);

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const payload = this.verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = payload;
    next();
  }

  private extractToken(req: any): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }
}
```

#### Rate Limiting
```typescript
// rate-limit.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

export const createRateLimiter = (redis: any) => {
  return rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'rate-limit:',
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        url: req.url,
        userAgent: req.headers['user-agent']
      });
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(res.getHeader('Retry-After') / 1000)
      });
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.url === '/health';
    }
  });
};
```

### Data Protection

#### Encryption at Rest
```typescript
// encryption.ts
import crypto from 'crypto';

export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32;
  private ivLength = 16;
  private tagLength = 16;

  constructor(private masterKey: string) {}

  encrypt(text: string): string {
    const salt = crypto.randomBytes(32);
    const key = crypto.pbkdf2Sync(this.masterKey, salt, 100000, this.keyLength, 'sha256');
    const iv = crypto.randomBytes(this.ivLength);

    const cipher = crypto.createCipher(this.algorithm, key);
    cipher.setAAD(salt);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')]).toString('base64');
  }

  decrypt(encryptedText: string): string {
    const buffer = Buffer.from(encryptedText, 'base64');

    const salt = buffer.subarray(0, 32);
    const iv = buffer.subarray(32, 32 + this.ivLength);
    const tag = buffer.subarray(32 + this.ivLength, 32 + this.ivLength + this.tagLength);
    const encrypted = buffer.subarray(32 + this.ivLength + this.tagLength);

    const key = crypto.pbkdf2Sync(this.masterKey, salt, 100000, this.keyLength, 'sha256');

    const decipher = crypto.createDecipher(this.algorithm, key);
    decipher.setAAD(salt);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted);
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

### Compliance and Auditing

#### Audit Logging
```typescript
// audit.ts
export class AuditLogger {
  async log(event: AuditEvent): Promise<void> {
    const auditEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      event: event.type,
      actor: event.actor,
      resource: event.resource,
      action: event.action,
      details: event.details,
      ip: event.ip,
      userAgent: event.userAgent,
      sessionId: event.sessionId
    };

    // Store in database
    await this.storeAuditEntry(auditEntry);

    // Log to security monitoring system
    logger.security('Audit event', auditEntry);

    // Check for suspicious activity
    await this.checkForAnomalies(auditEntry);
  }

  async queryAuditLog(filters: AuditQuery): Promise<AuditEntry[]> {
    // Query audit logs with filters
    return this.query(filters);
  }

  private async checkForAnomalies(entry: AuditEntry): Promise<void> {
    // Implement anomaly detection logic
    const recentEvents = await this.getRecentEvents(entry.actor, 3600000); // 1 hour

    if (this.isBruteForceAttempt(recentEvents)) {
      await this.handleBruteForce(entry);
    }

    if (this.isPrivilegeEscalation(recentEvents)) {
      await this.handlePrivilegeEscalation(entry);
    }
  }

  private isBruteForceAttempt(events: AuditEntry[]): boolean {
    const failedLogins = events.filter(e =>
      e.event === 'login_failed' &&
      e.timestamp > Date.now() - 300000 // 5 minutes
    );
    return failedLogins.length > 5;
  }
}
```

This comprehensive best practices guide covers development, deployment, security, and operational excellence for Ultra-Dex applications. Following these practices will help ensure reliable, secure, and maintainable systems.