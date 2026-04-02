# Ultra-Dex Core API Documentation

## Overview

Ultra-Dex is an AI Orchestration Meta-Layer for SaaS Development. This document provides API documentation for all core modules.

## Table of Contents

### 1. AI Providers

- [Provider Registry](#provider-registry)
- [AI Meta-Layer](#ai-meta-layer)
- [Model Router](#model-router)

### 2. Memory System

- [Memory Manager](#memory-manager)
- [Vector Store](#vector-store)
- [Graph Engine](#graph-engine)
- [Tiered Storage](#tiered-storage)

### 3. Orchestration

- [Ultra-Dex Core](#ultra-dex-core)
- [Execution Context](#execution-context)
- [Communication Bus](#communication-bus)
- [Agent Registry](#agent-registry)

### 4. Governance & Security

- [Governance Manager](#governance-manager)
- [RBAC Manager](#rbac-manager)
- [Audit Logger](#audit-logger)
- [Encryption](#encryption)

### 5. Performance & Optimization

- [Cache System](#cache-system)
- [Performance Monitor](#performance-monitor)
- [Token Optimizer](#token-optimizer)
- [DB Optimizer](#db-optimizer)

### 6. Reliability

- [Self-Healing](#self-healing)
- [Chaos Engine](#chaos-engine)

### 7. Enterprise Features

- [Billing Manager](#billing-manager)
- [Webhook Manager](#webhook-manager)
- [Analytics](#analytics)

---

## AI Providers

### Provider Registry

**File:** `src/core/ai/provider-registry.js`

Central registry for AI provider management.

#### Methods

- `registerProvider(name, provider)`: Register a new AI provider
- `getProvider(name)`: Get provider instance
- `listProviders()`: List all available providers
- `getDefaultProvider()`: Get configured default provider

#### Example

```javascript
import { providerRegistry } from 'src/core/ai/provider-registry.js';

// Register a provider
providerRegistry.registerProvider('openai', openAIClient);

// Get provider
const provider = providerRegistry.getProvider('openai');
const response = await provider.complete(prompt);
```

### AI Meta-Layer

**File:** `src/core/ai/ai-meta-layer.js`

High-level AI orchestration layer.

#### Methods

- `initialize(config)`: Initialize the AI system
- `processRequest(request, context)`: Process AI request
- `getCapabilities()`: Get available AI capabilities
- `getProviderStats()`: Get provider statistics

### Model Router

**File:** `src/core/ai/router.js`

Intelligent routing between AI models.

#### Methods

- `routeRequest(prompt, options)`: Route prompt to optimal model
- `evaluateModelPerformance(model, metrics)`: Track model performance
- `getOptimalModel(promptType, constraints)`: Find best model for task

---

## Memory System

### Memory Manager

**File:** `src/core/memory/manager.js`

Central memory management system.

#### Methods

- `save(sessionId, key, value)`: Save memory entry
- `get(sessionId, key)`: Retrieve memory entry
- `search(sessionId, query, limit)`: Semantic search in memory
- `clearSession(sessionId)`: Clear session memory
- `exportSession(sessionId)`: Export session data

#### Example

```javascript
import { memoryManager } from 'src/core/memory/manager.js';

// Save context
await memoryManager.save('session-123', 'user_preferences', {
  theme: 'dark',
  language: 'en',
});

// Retrieve
const prefs = await memoryManager.get('session-123', 'user_preferences');
```

### Vector Store

**File:** `src/core/memory/vector-store.js`

Vector embedding storage and similarity search.

#### Methods

- `embed(text)`: Generate vector embedding
- `store(vector, metadata)`: Store vector with metadata
- `similaritySearch(queryVector, limit)`: Find similar vectors
- `delete(id)`: Delete vector by ID

### Graph Engine

**File:** `src/core/memory/graph-engine.js`

Graph-based relationship modeling.

#### Methods

- `createNode(type, properties)`: Create graph node
- `createRelationship(sourceId, targetId, type, properties)`: Create relationship
- `traverse(startId, depth, direction)`: Traverse graph
- `findPaths(sourceId, targetId, maxDepth)`: Find paths between nodes

---

## Orchestration

### Ultra-Dex Core

**File:** `src/core/orchestration/ultra-dex-core.js`

Main orchestration engine.

#### Methods

- `initialize(config)`: Initialize orchestration system
- `createSession(sessionId, context)`: Create new session
- `executePlan(plan, sessionId)`: Execute AI plan
- `getSessionState(sessionId)`: Get session state
- `terminateSession(sessionId)`: Clean up session

### Execution Context

**File:** `src/core/orchestration/execution-context.js`

Execution context management.

#### Methods

- `createContext(sessionId, initialState)`: Create execution context
- `getContext(sessionId)`: Get current context
- `updateContext(sessionId, updates)`: Update context
- `saveCheckpoint(sessionId)`: Save execution checkpoint
- `restoreCheckpoint(sessionId, checkpointId)`: Restore from checkpoint

### Communication Bus

**File:** `src/core/orchestration/communication-bus.js`

Inter-agent communication system.

#### Methods

- `publish(channel, message)`: Publish message to channel
- `subscribe(channel, handler)`: Subscribe to channel
- `unsubscribe(channel, handler)`: Unsubscribe from channel
- `broadcast(message, exclude)`: Broadcast to all agents

---

## Governance & Security

### Governance Manager

**File:** `src/core/governance/governance-manager.js`

Policy-based governance system.

#### Methods

- `addPolicy(policy)`: Add governance policy
- `evaluate(action, context)`: Evaluate action against policies
- `recordAudit(action, decision, metadata)`: Record audit trail
- `getAuditLog(filters)`: Retrieve audit log entries

#### Example Policies

```javascript
const securityPolicy = {
  id: 'security-policy-1',
  name: 'Data Access Control',
  conditions: {
    role: ['admin', 'manager'],
    environment: 'production',
  },
  actions: ['read_sensitive_data', 'modify_config'],
  effect: 'allow',
};
```

### RBAC Manager

**File:** `src/core/auth/rbac-manager.js`

Role-Based Access Control.

#### Methods

- `assignRole(userId, role)`: Assign role to user
- `hasPermission(userId, permission)`: Check user permission
- `getUserRoles(userId)`: Get user roles
- `createRole(roleName, permissions)`: Create new role

#### Built-in Roles

- `viewer`: Read-only access
- `editor`: Read and write access
- `admin`: Full administrative access
- `system`: System-level access

### Audit Logger

**File:** `src/core/audit/audit-logger.js`

Comprehensive audit logging.

#### Methods

- `log(action, userId, metadata)`: Log action
- `query(filters)`: Query audit logs
- `export(startDate, endDate, format)`: Export audit logs
- `getStats(timeRange)`: Get audit statistics

### Encryption

**File:** `src/core/security/encryption.js`

Cryptographic utilities.

#### Methods

- `encrypt(plaintext, keyId)`: Encrypt data
- `decrypt(ciphertext, keyId)`: Decrypt data
- `generateKeyPair()`: Generate encryption key pair
- `sign(data, privateKey)`: Sign data
- `verify(data, signature, publicKey)`: Verify signature

---

## Performance & Optimization

### Cache System

**File:** `src/core/performance/cache.js`

Intelligent caching layer.

#### Methods

- `get(key)`: Get cached value
- `set(key, value, ttl)`: Set cached value with TTL
- `delete(key)`: Delete cached value
- `clear()`: Clear entire cache
- `stats()`: Get cache statistics

#### Features

- LRU eviction
- TTL-based expiration
- Memory usage tracking
- Hit/miss statistics

### Performance Monitor

**File:** `src/core/performance/monitor.js`

Real-time performance monitoring.

#### Methods

- `startTracking(operationId)`: Start tracking operation
- `endTracking(operationId, metadata)`: End tracking with metadata
- `getMetrics(timeRange)`: Get performance metrics
- `alertOnThreshold(metric, threshold, callback)`: Set alert threshold

### Token Optimizer

**File:** `src/core/performance/token-optimizer.js`

AI token optimization.

#### Methods

- `optimizePrompt(prompt, targetTokens)`: Optimize prompt token count
- `countTokens(text)`: Count tokens in text
- `chunkText(text, maxTokens)`: Chunk text by token limit
- `getOptimizationSuggestions(prompt)`: Get prompt optimization suggestions

### DB Optimizer

**File:** `src/core/performance/db-optimizer.js`

Database query optimization.

#### Methods

- `analyzeQuery(query)`: Analyze query performance
- `suggestIndexes(schema, queries)`: Suggest database indexes
- `optimizeSchema(schema, workload)`: Optimize database schema
- `profileQuery(query)`: Profile query execution

---

## Reliability

### Self-Healing

**File:** `src/core/reliability/self-healing.js`

Automatic failure recovery.

#### Methods

- `monitorComponent(componentId, healthCheck)`: Monitor component health
- `registerRecoveryAction(componentId, action)`: Register recovery action
- `triggerRecovery(componentId, failure)`: Trigger recovery process
- `getHealthReport()`: Get system health report

### Chaos Engine

**File:** `src/core/chaos/chaos-engine.js`

Chaos engineering for resilience testing.

#### Methods

- `injectFailure(failureType, component, duration)`: Inject failure
- `startChaosMonkey(config)`: Start automated chaos testing
- `stopChaosMonkey()`: Stop chaos testing
- `getResilienceScore()`: Calculate system resilience score

#### Failure Types

- `latency`: Network latency injection
- `error`: Error rate injection
- `resource`: Resource constraint injection
- `network`: Network partition injection

---

## Enterprise Features

### Billing Manager

**File:** `src/core/billing/billing-manager.js`

Usage-based billing system.

#### Methods

- `trackUsage(userId, feature, units)`: Track feature usage
- `calculateInvoice(userId, period)`: Calculate invoice
- `generateInvoice(userId, period)`: Generate invoice document
- `getUsageReport(userId, period)`: Get usage report

### Webhook Manager

**File:** `src/core/webhooks/webhook-manager.js`

Webhook delivery system.

#### Methods

- `registerWebhook(url, events, secret)`: Register webhook endpoint
- `triggerEvent(event, data)`: Trigger webhook event
- `getDeliveryStatus(webhookId, eventId)`: Get delivery status
- `retryFailed(webhookId, eventId)`: Retry failed delivery

### Analytics

**File:** `src/core/analytics/enterprise-analytics.js`

Enterprise analytics platform.

#### Methods

- `trackEvent(eventName, properties)`: Track custom event
- `getDashboard(metrics, timeRange)`: Get analytics dashboard
- `exportData(format, filters)`: Export analytics data
- `createReport(config)`: Create custom report

---

## Quality Assurance

### Protocol 21

**File:** `src/core/quality/protocol-21.js`

21-step verification protocol.

#### Methods

- `runVerification(sessionId)`: Run full verification
- `getVerificationReport(sessionId)`: Get verification report
- `fixIssues(sessionId, issues)`: Fix identified issues
- `validateCompletion(sessionId)`: Validate task completion

---

## Observability

### Trace Collector

**File:** `src/core/observability/trace-collector.js`

Distributed tracing system.

#### Methods

- `startTrace(traceId, operation)`: Start new trace
- `addSpan(traceId, spanName, metadata)`: Add span to trace
- `endTrace(traceId)`: End trace collection
- `getTrace(traceId)`: Get trace details
- `exportTraces(format)`: Export trace data

---

## Utility Modules

### Schema Migrator

**File:** `src/core/schema-migrator.js`

Database schema migration tool.

#### Methods

- `migrate(fromVersion, toVersion, data)`: Migrate data between schema versions
- `validateSchema(data, version)`: Validate data against schema
- `createMigrationPlan(current, target)`: Create migration plan
- `executeMigration(migrationPlan)`: Execute migration plan

### Team Manager

**File:** `src/core/team/team-manager.js`

Team collaboration management.

#### Methods

- `createTeam(name, ownerId)`: Create new team
- `addMember(teamId, userId, role)`: Add member to team
- `removeMember(teamId, userId)`: Remove member from team
- `getTeamProjects(teamId)`: Get team projects
- `setTeamPermission(teamId, resource, permission)`: Set team permissions

---

## Getting Started Examples

### Basic AI Request

```javascript
import { providerRegistry } from 'src/core/ai/provider-registry.js';
import { memoryManager } from 'src/core/memory/manager.js';

async function processUserQuery(sessionId, query) {
  // Get context from memory
  const context = await memoryManager.get(sessionId, 'conversation_context');

  // Get AI provider
  const provider = providerRegistry.getDefaultProvider();

  // Create prompt with context
  const prompt = `Context: ${JSON.stringify(context)}\n\nUser: ${query}`;

  // Get response
  const response = await provider.complete(prompt);

  // Save to memory
  await memoryManager.save(sessionId, 'last_response', response);

  return response;
}
```

### Agent Orchestration

```javascript
import { ultraDexCore } from 'src/core/orchestration/ultra-dex-core.js';
import { governanceManager } from 'src/core/governance/governance-manager.js';

async function executeSecureTask(sessionId, task) {
  // Check governance permissions
  const decision = await governanceManager.evaluate('execute_task', {
    task,
    sessionId,
    userId: 'user-123',
  });

  if (decision.effect === 'deny') {
    throw new Error(`Task execution denied: ${decision.reason}`);
  }

  // Create execution plan
  const plan = {
    steps: [
      { agent: 'planner', task: 'Analyze requirements' },
      { agent: 'cto', task: 'Design architecture' },
      { agent: 'backend', task: 'Implement solution' },
      { agent: 'reviewer', task: 'Code review' },
    ],
  };

  // Execute plan
  const result = await ultraDexCore.executePlan(plan, sessionId);

  // Record audit trail
  await governanceManager.recordAudit('task_execution', 'allowed', { task, sessionId, result });

  return result;
}
```

---

## Configuration

### Environment Variables

```bash
# AI Providers
ULTRA_DEX_DEFAULT_PROVIDER=openai
OPENAI_API_KEY=your_key_here

# Memory System
ULTRA_DEX_MEMORY_BACKEND=vector
VECTOR_STORE_URL=http://localhost:8080

# Governance
ULTRA_DEX_GOVERNANCE_MODE=strict
ULTRA_DEX_AUDIT_ENABLED=true

# Performance
ULTRA_DEX_CACHE_ENABLED=true
ULTRA_DEX_CACHE_TTL=3600
```

### Configuration File

```json
{
  "ai": {
    "defaultProvider": "openai",
    "providers": {
      "openai": {
        "apiKey": "${OPENAI_API_KEY}",
        "model": "gpt-4-turbo"
      }
    }
  },
  "memory": {
    "backend": "vector",
    "vectorStore": {
      "url": "http://localhost:8080",
      "dimension": 1536
    }
  },
  "governance": {
    "mode": "strict",
    "policies": [
      {
        "id": "default-security",
        "effect": "allow"
      }
    ]
  }
}
```

---

## Best Practices

### 1. Memory Management

- Use session-based memory isolation
- Implement LRU cache eviction for large sessions
- Regularly export and archive old sessions
- Use vector search for semantic retrieval

### 2. Security

- Always validate governance policies before execution
- Use RBAC for access control
- Encrypt sensitive data at rest and in transit
- Maintain comprehensive audit trails

### 3. Performance

- Enable caching for frequently accessed data
- Use token optimization for AI prompts
- Monitor performance metrics regularly
- Implement circuit breakers for external services

### 4. Reliability

- Implement self-healing mechanisms
- Use chaos engineering for resilience testing
- Maintain execution checkpoints
- Implement graceful degradation

---

## Troubleshooting

### Common Issues

1. **Memory Leaks**
   - Check session cleanup
   - Monitor cache size
   - Implement memory limits

2. **Performance Degradation**
   - Analyze query performance
   - Check cache hit rates
   - Monitor AI provider latency

3. **Security Issues**
   - Review audit logs
   - Check policy evaluations
   - Verify encryption status

4. **Integration Problems**
   - Validate webhook deliveries
   - Check provider connectivity
   - Verify data schema compatibility

---

## Support

For additional support:

- Documentation: [docs.ultra-dex.ai](https://docs.ultra-dex.ai)
- Community: [discord.gg/ultradex](https://discord.gg/ultradex)
- Issues: [GitHub Issues](https://github.com/Srujan0798/Ultra-Dex/issues)

---

_Last Updated: April 3, 2026_  
_Version: 6.0.0_
