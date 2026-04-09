# Ultra-Dex Monitoring & Observability Strategy

## Monitoring Architecture

### Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        MONITORING LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  Application Metrics  │  Infrastructure Metrics  │  Logs      │
│  (Prometheus)        │  (Datadog)             │  (ELK)     │
├─────────────────────────────────────────────────────────────────┤
│                    Tracing Layer                               │
│                    (Jaeger/OpenTelemetry)                     │
├─────────────────────────────────────────────────────────────────┤
│                   Alerting & Notification                      │
│                   (PagerDuty, Slack, Email)                   │
└─────────────────────────────────────────────────────────────────┘
```

## Metrics Collection

### Application Metrics (Prometheus)

#### Custom Metrics Implementation

```javascript
// src/metrics/appMetrics.js
import promClient from 'prom-client';

// Create custom metrics
export const metrics = {
  // Request metrics
  httpRequestDuration: new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  }),

  httpRequestTotal: new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  }),

  httpRequestActive: new promClient.Gauge({
    name: 'http_requests_active',
    help: 'Number of active HTTP requests',
  }),

  // Agent metrics
  agentExecutionsTotal: new promClient.Counter({
    name: 'agent_executions_total',
    help: 'Total number of agent executions',
    labelNames: ['agent_id', 'status'],
  }),

  agentExecutionDuration: new promClient.Histogram({
    name: 'agent_execution_duration_seconds',
    help: 'Duration of agent executions in seconds',
    labelNames: ['agent_id'],
    buckets: [1, 5, 10, 30, 60, 120, 300],
  }),

  agentQueueSize: new promClient.Gauge({
    name: 'agent_queue_size',
    help: 'Current size of agent execution queue',
    labelNames: ['queue_type'],
  }),

  // Memory metrics
  memoryOperationsTotal: new promClient.Counter({
    name: 'memory_operations_total',
    help: 'Total number of memory operations',
    labelNames: ['operation', 'type'],
  }),

  memoryOperationDuration: new promClient.Histogram({
    name: 'memory_operation_duration_seconds',
    help: 'Duration of memory operations in seconds',
    labelNames: ['operation'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
  }),

  // Database metrics
  databaseQueryDuration: new promClient.Histogram({
    name: 'database_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['query_type', 'table'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  }),

  databaseConnections: new promClient.Gauge({
    name: 'database_connections',
    help: 'Current number of database connections',
    labelNames: ['pool'],
  }),

  // Cache metrics
  cacheHits: new promClient.Counter({
    name: 'cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['cache_type'],
  }),

  cacheMisses: new promClient.Counter({
    name: 'cache_misses_total',
    help: 'Total number of cache misses',
    labelNames: ['cache_type'],
  }),

  cacheHitRatio: new promClient.Gauge({
    name: 'cache_hit_ratio',
    help: 'Cache hit ratio',
    labelNames: ['cache_type'],
  }),
};

// Middleware to collect metrics
export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  // Increment active requests
  metrics.httpRequestActive.inc();

  // Capture original end method
  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    // Calculate duration
    const duration = (Date.now() - start) / 1000;

    // Record metrics
    metrics.httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);

    metrics.httpRequestsTotal.labels(req.method, req.route?.path || req.path, res.statusCode).inc();

    // Decrement active requests
    metrics.httpRequestActive.dec();

    // Call original end
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Agent execution metrics
export const recordAgentExecution = (agentId, status, duration) => {
  metrics.agentExecutionsTotal.labels(agentId, status).inc();

  metrics.agentExecutionDuration.labels(agentId).observe(duration);
};

// Memory operation metrics
export const recordMemoryOperation = (operation, type, duration) => {
  metrics.memoryOperationsTotal.labels(operation, type).inc();

  metrics.memoryOperationDuration.labels(operation).observe(duration);
};
```

#### Prometheus Configuration

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - 'alert_rules.yml'

scrape_configs:
  - job_name: 'ultra-dex-api'
    static_configs:
      - targets: ['api-service:3000']
    metrics_path: /metrics
    scrape_interval: 5s

  - job_name: 'ultra-dex-dashboard'
    static_configs:
      - targets: ['dashboard-service:3000']
    metrics_path: /metrics
    scrape_interval: 15s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']
```

### Infrastructure Metrics (Datadog)

#### Datadog Configuration

```javascript
// src/monitoring/datadog.js
import dogapi from 'dogapi';

// Initialize Datadog
dogapi.initialize({
  api_key: process.env.DATADOG_API_KEY,
  app_key: process.env.DATADOG_APP_KEY,
});

export class DatadogService {
  static async sendEvent(title, text, tags = []) {
    return dogapi.event.create({
      title,
      text,
      tags: [...tags, `env:${process.env.NODE_ENV}`, `service:ultra-dex`],
      priority: 'normal',
    });
  }

  static async sendMetric(name, value, tags = []) {
    const series = [
      {
        metric: name,
        points: [[Date.now() / 1000, value]],
        tags: [...tags, `env:${process.env.NODE_ENV}`, `service:ultra-dex`],
      },
    ];

    return dogapi.metric.send(series);
  }

  static async queryMetrics(query, from, to) {
    return dogapi.series.query({
      query,
      from: Math.floor(from / 1000),
      to: Math.floor(to / 1000),
    });
  }

  // Custom dashboards
  static async createDashboard() {
    const dashboard = {
      title: 'Ultra-Dex Application Dashboard',
      widgets: [
        {
          type: 'timeseries',
          x: 0,
          y: 0,
          width: 32,
          height: 8,
          title: 'Request Rate',
          queries: ['avg:ultra_dex.http_requests_total{*}.as_rate()'],
        },
        {
          type: 'timeseries',
          x: 0,
          y: 8,
          width: 32,
          height: 8,
          title: 'Response Time (p95)',
          queries: ['avg:ultra_dex.http_request_duration_seconds.quantile{quantile:0.95}'],
        },
        {
          type: 'toplist',
          x: 0,
          y: 16,
          width: 16,
          height: 8,
          title: 'Top Agents by Execution Count',
          queries: [
            'top(avg:ultra_dex.agent_executions_total{*} by {agent_id}, 10, "mean", "desc")',
          ],
        },
      ],
      template_variables: [],
      layout_type: 'ordered',
    };

    return dogapi.dashboard.create(dashboard);
  }
}

export default DatadogService;
```

## Logging Strategy (ELK Stack)

### Application Logging

```javascript
// src/utils/logger.js
import winston from 'winston';
import LokiTransport from 'winston-loki';

// Create logger with multiple transports
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'ultra-dex-api' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      silent: process.env.NODE_ENV === 'test',
    }),

    // File transport for production
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add Loki transport for centralized logging
if (process.env.LOKI_URL) {
  logger.add(
    new LokiTransport({
      host: process.env.LOKI_URL,
      json: true,
      labels: {
        job: 'ultra-dex',
        env: process.env.NODE_ENV || 'development',
      },
      level: process.env.LOG_LEVEL || 'info',
    })
  );
}

// Structured logging functions
export const logRequest = (req, res, duration) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
  });
};

export const logAgentExecution = (agentId, executionId, status, duration, error = null) => {
  const level = status === 'error' ? 'error' : 'info';
  logger[level]('Agent Execution', {
    agentId,
    executionId,
    status,
    duration: `${duration}ms`,
    error: error?.message,
    stack: error?.stack,
  });
};

export const logDatabaseQuery = (query, duration, error = null) => {
  const level = error ? 'error' : 'debug';
  logger[level]('Database Query', {
    query: query.slice(0, 200) + (query.length > 200 ? '...' : ''),
    duration: `${duration}ms`,
    error: error?.message,
  });
};

export default logger;
```

### Log Aggregation Configuration

```yaml
# elk/elasticsearch.yml
cluster.name: 'ultra-dex-cluster'
node.name: 'node-1'
network.host: 0.0.0.0
http.port: 9200
discovery.type: single-node
xpack.security.enabled: false
```

```yaml
# elk/logstash.conf
input {
beats {
port => 5044
}
}

filter {
if [type] == "ultra-dex" {
json {
source => "message"
}
mutate {
remove_field => ["message"]
}
}
}

output {
elasticsearch {
hosts => ["elasticsearch:9200"]
index => "ultra-dex-%{+YYYY.MM.dd}"
}
}
```

```yaml
# elk/kibana.yml
server.name: kibana
server.host: '0'
elasticsearch.hosts: ['http://elasticsearch:9200']
xpack.security.enabled: false
```

## Distributed Tracing (Jaeger/OpenTelemetry)

### Tracing Implementation

```javascript
// src/monitoring/tracing.js
import opentelemetry from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { SimpleSpanProcessor, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';

// Initialize tracing
export const initTracing = () => {
  const provider = new NodeTracerProvider({
    resource: {
      'service.name': 'ultra-dex-api',
      'service.version': process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
  });

  // Jaeger exporter
  const jaegerExporter = new JaegerExporter({
    endpoint: process.env.JAEGER_ENDPOINT || 'http://jaeger:14268/api/traces',
  });

  // Span processors
  provider.addSpanProcessor(new BatchSpanProcessor(jaegerExporter));

  // Initialize the provider
  provider.register();

  // Register instrumentations
  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new PgInstrumentation(),
      new RedisInstrumentation(),
    ],
  });

  return provider;
};

// Custom tracing utilities
export const traceFunction = (name, fn) => {
  return async (...args) => {
    const tracer = opentelemetry.trace.getTracer('ultra-dex');
    return tracer.startActiveSpan(name, async (span) => {
      try {
        const result = await fn(...args);
        span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({
          code: opentelemetry.SpanStatusCode.ERROR,
          message: error.message,
        });
        span.recordException(error);
        throw error;
      } finally {
        span.end();
      }
    });
  };
};

export const addTraceAttributes = (attributes) => {
  const span = opentelemetry.trace.getActiveSpan();
  if (span) {
    span.setAttributes(attributes);
  }
};

export default initTracing;
```

## Alerting System

### Alert Rules (Prometheus)

```yaml
# prometheus/alert_rules.yml
groups:
  - name: ultra-dex.rules
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: 'High error rate detected'
          description: 'Error rate is {{ $value | humanizePercentage }} over the last 5 minutes'

      # High response time
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'High response time'
          description: '95th percentile response time is {{ $value }}s'

      # Agent execution failures
      - alert: AgentExecutionFailures
        expr: rate(agent_executions_total{status="error"}[10m]) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: 'High agent execution failure rate'
          description: '{{ $value }} agent execution failures per second'

      # Database connection issues
      - alert: DatabaseConnectionIssues
        expr: rate(database_query_duration_seconds_count[5m]) == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: 'Database connection issues'
          description: 'No database queries in the last 5 minutes'

      # Cache hit ratio low
      - alert: LowCacheHitRatio
        expr: cache_hit_ratio < 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'Low cache hit ratio'
          description: 'Cache hit ratio is {{ $value | humanizePercentage }}'
```

### Alertmanager Configuration

```yaml
# prometheus/alertmanager.yml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@ultra-dex.ai'
  smtp_auth_username: 'alerts@ultra-dex.ai'
  smtp_auth_password: 'your-app-password'

route:
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'default'

receivers:
  - name: 'default'
    email_configs:
      - to: 'oncall@ultra-dex.ai'
        send_resolved: true
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
        channel: '#alerts'
        send_resolved: true
        text: '{{ template "slack.default" . }}'

templates:
  - '/etc/alertmanager/template/*.tmpl'
```

### Slack Alert Template

```
{{ define "slack.default" }}
{
  "attachments": [
    {
      "color": "{{ if eq .Status "firing" }}danger{{ else }}good{{ end }}",
      "title": "{{ .CommonAnnotations.summary }}",
      "text": "{{ .CommonAnnotations.description }}",
      "fields": [
        {
          "title": "Severity",
          "value": "{{ range .Alerts }}{{ .Labels.severity }}{{ end }}",
          "short": true
        },
        {
          "title": "Status",
          "value": "{{ .Status }}",
          "short": true
        }
      ],
      "footer": "Prometheus Alertmanager",
      "footer_icon": "https://avatars3.githubusercontent.com/u/3380462"
    }
  ]
}
{{ end }}
```

## Dashboard Configuration

### Grafana Dashboards

```json
{
  "dashboard": {
    "id": null,
    "title": "Ultra-Dex Application Dashboard",
    "tags": ["ultra-dex", "application"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[1m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ],
        "yAxes": [
          {
            "label": "Requests/sec",
            "format": "reqps"
          }
        ]
      },
      {
        "id": 2,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "p95"
          },
          {
            "expr": "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "p99"
          }
        ],
        "yAxes": [
          {
            "label": "Seconds",
            "format": "s"
          }
        ]
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[1m])",
            "legendFormat": "5xx errors"
          }
        ],
        "yAxes": [
          {
            "label": "Errors/sec",
            "format": "reqps"
          }
        ]
      }
    ],
    "time": {
      "from": "now-6h",
      "to": "now"
    },
    "refresh": "10s"
  }
}
```

## Monitoring Implementation Plan

### Week 9 Tasks:

- [ ] Set up Prometheus and Grafana (Days 1-2)
- [ ] Implement custom metrics collection (Days 2-3)
- [ ] Configure ELK stack for logging (Days 3-4)
- [ ] Set up distributed tracing (Days 4-5)
- [ ] Configure alerting rules (Days 5-6)
- [ ] Create dashboards (Days 6-7)

### Week 10 Tasks:

- [ ] Integrate with existing applications (Days 1-2)
- [ ] Set up notification channels (Days 2-3)
- [ ] Performance testing with monitoring (Days 3-4)
- [ ] Fine-tune alert thresholds (Days 4-5)
- [ ] Documentation and runbooks (Days 5-6)
- [ ] Team training on monitoring tools (Day 7)

## Success Metrics

### Technical Metrics:

- **Monitoring Coverage**: 100% of critical services monitored
- **Alert Accuracy**: <5% false positives
- **Mean Time to Detection**: <2 minutes for critical issues
- **Dashboard Load Time**: <5 seconds for all dashboards

### Operational Metrics:

- **Incident Response Time**: <15 minutes for critical issues
- **System Visibility**: 99% of system state observable
- **Alert Fatigue**: <10 alerts per engineer per day
- **Monitoring Uptime**: 99.9% monitoring system availability

## Incident Response

### On-Call Procedures

1. **Alert Receipt**: Acknowledge within 5 minutes
2. **Initial Assessment**: Determine severity and impact
3. **Communication**: Notify team and stakeholders
4. **Resolution**: Follow runbooks or escalate
5. **Post-Incident**: Document and improve processes

### Runbooks

- Database performance issues
- High error rates
- Memory leaks
- Security incidents
- Service outages

This comprehensive monitoring and observability strategy ensures Ultra-Dex has complete visibility into system performance, enabling rapid issue detection and resolution while maintaining high availability and performance standards.
