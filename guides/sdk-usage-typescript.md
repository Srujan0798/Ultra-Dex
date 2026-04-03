# Ultra-Dex SDK Usage Guide (TypeScript)

This guide demonstrates how to use the Ultra-Dex SDK in TypeScript projects, including advanced features like routing, middleware, and distributed execution.

## Installation

```bash
npm install @ultra-dex/sdk
```

## Basic Setup

```typescript
import { UltraDex, ChatMessage, ChatOptions } from '@ultra-dex/sdk';

// Initialize Ultra-Dex client
const ultraDex = new UltraDex({
  apiKey: process.env.ULTRA_DEX_API_KEY,
  defaultProvider: 'openai',
  timeoutMs: 30000,
});

// Register providers
ultraDex.registerProvider(
  'openai',
  new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

ultraDex.registerProvider(
  'anthropic',
  new AnthropicProvider({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })
);
```

## Chat and AI Operations

### Basic Chat

```typescript
const messages: ChatMessage[] = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Explain TypeScript generics.' },
];

const response = await ultraDex.chat(messages, {
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 1000,
});

console.log(response.content);
console.log(`Tokens used: ${response.usage.totalTokens}`);
```

### Streaming Responses

```typescript
const messages: ChatMessage[] = [{ role: 'user', content: 'Write a short story about AI.' }];

for await (const chunk of ultraDex.stream(messages)) {
  if (chunk.type === 'text') {
    process.stdout.write(chunk.content as string);
  }
}
```

### Smart Routing

```typescript
// Enable smart routing with fallback
ultraDex.enableRouter({
  strategy: 'fallback-chain',
  fallbackOrder: ['openai', 'anthropic', 'google'],
  circuitBreaker: {
    failureThreshold: 3,
    resetTimeoutMs: 60000,
  },
});

// Chat with automatic provider selection and failover
const response = await ultraDex.chat(messages);
console.log(`Used provider: ${response.model}`);
```

## Middleware

### Logging Middleware

```typescript
ultraDex.useMiddleware('logging', loggingMiddleware());

// Custom middleware
ultraDex.useMiddleware('request-timing', async (context, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`Request took ${duration}ms`);
});
```

### Retry with Exponential Backoff

```typescript
ultraDex.useMiddleware(
  'retry',
  retryMiddleware({
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
  })
);
```

### Caching

```typescript
ultraDex.useMiddleware(
  'cache',
  cacheMiddleware({
    ttlMs: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
  })
);
```

### Rate Limiting

```typescript
ultraDex.useMiddleware(
  'rate-limit',
  rateLimitMiddleware({
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minute
  })
);
```

## Agent Management

### Creating and Registering Agents

```typescript
import { Agent } from '@ultra-dex/sdk';

const codeReviewerAgent = new Agent({
  id: 'code-reviewer',
  name: 'Code Reviewer',
  description: 'Reviews code for best practices and security',
  capabilities: ['code-review', 'security-audit', 'style-check'],
});

// Register agent
ultraDex.registerAgent(codeReviewerAgent);

// Use agent memory
codeReviewerAgent.remember('lastReview', {
  file: 'auth.ts',
  issues: ['missing validation', 'weak password policy'],
});

const lastReview = codeReviewerAgent.recall('lastReview');
```

### Running Agents

```typescript
const result = await ultraDex.runAgent('code-reviewer', {
  task: 'review-pull-request',
  prNumber: 123,
  repository: 'my-org/my-repo',
});
```

## Task Execution

### Simple Execution

```typescript
const result = await ultraDex.execute('Analyze this codebase for security vulnerabilities', {
  mode: 'detailed',
  trace: true,
  timeout: 300000, // 5 minutes
});

console.log('Execution completed:', result.status);
console.log('Results:', result.results);
```

### Streaming Execution with Progress

```typescript
const executionStream = ultraDex.executeStream('Build a full-stack application', {
  mode: 'iterative',
  onProgress: (progress) => {
    console.log(`Step ${progress.stepIndex}/${progress.totalSteps}: ${progress.stepType}`);
  },
});

for await (const progress of executionStream) {
  switch (progress.type) {
    case 'complete':
      console.log('Task completed successfully');
      break;
    case 'error':
      console.error('Task failed:', progress.error);
      break;
    case 'step_complete':
      console.log(`Completed step: ${progress.stepType}`);
      break;
  }
}
```

## Distributed Execution

### Setting up Distributed Coordinator

```typescript
import { DistributedCoordinator } from '@ultra-dex/sdk';

const coordinator = new DistributedCoordinator({
  instanceId: 'node-1',
  port: 8080,
  enableWebSocket: true,
  enableHttpApi: true,
  enableDiscovery: true,
  loadBalanceThreshold: 0.8,
  maxConcurrentTasks: 10,
});

await coordinator.initialize();

// Add peer nodes
coordinator.addDistributedPeer('http://node-2:8080');
coordinator.addDistributedPeer('http://node-3:8080');

// Submit distributed task
const taskResult = await coordinator.submitTask({
  type: 'code-generation',
  prompt: 'Build a REST API with authentication',
  language: 'typescript',
});

console.log('Distributed task result:', taskResult);
```

### Integrating with Ultra-Dex

```typescript
// Enable distributed execution in Ultra-Dex
ultraDex.distributedCoordinator = coordinator;

// Execute tasks that may be distributed across peers
const result = await ultraDex.execute('Train ML model on large dataset', {
  mode: 'distributed',
  priority: 1,
});
```

## Error Handling

```typescript
import { UltraDexError, ValidationError, NetworkError, ProviderError } from '@ultra-dex/sdk';

try {
  const response = await ultraDex.chat(messages);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
  } else if (error instanceof NetworkError) {
    console.error('Network issue:', error.message);
  } else if (error instanceof ProviderError) {
    console.error(`Provider ${error.provider} error:`, error.message);
  } else if (error instanceof UltraDexError) {
    console.error('Ultra-Dex error:', error.code, error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

## Plugins

### Creating a Custom Plugin

```typescript
import { PluginDefinition } from '@ultra-dex/sdk';

const monitoringPlugin: PluginDefinition = {
  id: 'monitoring',
  version: '1.0.0',
  setup: (loader) => {
    loader.on('execution:start', (payload) => {
      console.log('Execution started:', payload);
    });

    loader.on('execution:complete', (payload) => {
      console.log('Execution completed:', payload);
    });
  },
};

// Load plugin
ultraDex.use(monitoringPlugin);
```

## Best Practices

### Configuration Management

```typescript
// Use environment variables for sensitive data
const config = {
  apiKey: process.env.ULTRA_DEX_API_KEY,
  providers: {
    openai: { apiKey: process.env.OPENAI_API_KEY },
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY },
  },
  distributed: {
    peers: process.env.DISTRIBUTED_PEERS?.split(',') || [],
  },
};

const ultraDex = new UltraDex(config);
```

### Resource Cleanup

```typescript
// Always clean up resources
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  if (ultraDex.distributedCoordinator) {
    await ultraDex.distributedCoordinator.shutdown();
  }
  process.exit(0);
});
```

### Type Safety

```typescript
// Define custom types for your use cases
interface CodeReviewTask {
  type: 'code-review';
  files: string[];
  rules: string[];
}

interface APIGenerationTask {
  type: 'api-generation';
  endpoints: Array<{
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    schema: object;
  }>;
}

type CustomTask = CodeReviewTask | APIGenerationTask;

// Use with type safety
const task: CustomTask = {
  type: 'code-review',
  files: ['src/auth.ts', 'src/api.ts'],
  rules: ['security', 'performance'],
};

const result = await ultraDex.execute(task);
```

This guide covers the core features of the Ultra-Dex SDK in TypeScript. For more advanced examples, check the [examples directory](../examples/) and [JavaScript guide](./sdk-usage-javascript.md).</content>
<parameter name="filePath">guides/sdk-usage-typescript.md
