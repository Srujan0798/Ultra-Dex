# Ultra-Dex SDK Usage Guide (JavaScript)

This guide demonstrates how to use the Ultra-Dex SDK in JavaScript projects, focusing on practical examples and real-world usage patterns.

## Installation

```bash
npm install @ultra-dex/sdk
```

## Basic Setup

```javascript
const { UltraDex } = require('@ultra-dex/sdk');

// Initialize Ultra-Dex client
const ultraDex = new UltraDex({
  apiKey: process.env.ULTRA_DEX_API_KEY,
  defaultProvider: 'openai',
  timeoutMs: 30000,
});

// Register providers (you'll need to install provider packages)
const { OpenAIProvider } = require('@ultra-dex/provider-openai');
const { AnthropicProvider } = require('@ultra-dex/provider-anthropic');

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

```javascript
const messages = [
  { role: 'system', content: 'You are a helpful coding assistant.' },
  { role: 'user', content: 'Write a function to reverse a string in JavaScript.' },
];

ultraDex
  .chat(messages, {
    model: 'gpt-4',
    temperature: 0.3,
    maxTokens: 500,
  })
  .then((response) => {
    console.log('Response:', response.content);
    console.log('Tokens used:', response.usage.totalTokens);
    console.log('Cost:', response.usage.totalCost);
  })
  .catch(console.error);
```

### Async/Await Pattern

```javascript
async function chatWithAI() {
  try {
    const messages = [{ role: 'user', content: 'Explain how async/await works in JavaScript.' }];

    const response = await ultraDex.chat(messages, {
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229',
    });

    console.log('AI Response:', response.content);
    console.log(`Response took ${response.latencyMs}ms`);
  } catch (error) {
    console.error('Chat failed:', error.message);
  }
}

chatWithAI();
```

### Streaming Responses

```javascript
async function streamResponse() {
  const messages = [
    { role: 'user', content: 'Write a comprehensive guide about Node.js best practices.' },
  ];

  try {
    for await (const chunk of ultraDex.stream(messages, {
      model: 'gpt-4',
      temperature: 0.7,
    })) {
      switch (chunk.type) {
        case 'text':
          process.stdout.write(chunk.content);
          break;
        case 'tool_call':
          console.log('Tool call:', chunk.content);
          break;
        case 'done':
          console.log('\n--- Stream complete ---');
          break;
      }
    }
  } catch (error) {
    console.error('Streaming failed:', error.message);
  }
}

streamResponse();
```

## Smart Routing and Failover

```javascript
// Enable smart routing with multiple providers
ultraDex.enableRouter({
  strategy: 'fallback-chain',
  fallbackOrder: ['openai', 'anthropic', 'google'],
  circuitBreaker: {
    failureThreshold: 3,
    resetTimeoutMs: 60000,
  },
});

async function resilientChat() {
  const messages = [
    { role: 'user', content: 'What are the benefits of microservices architecture?' },
  ];

  try {
    const response = await ultraDex.chat(messages);
    console.log('Success with provider:', response.model);
    console.log('Response:', response.content);
  } catch (error) {
    console.error('All providers failed:', error.message);
  }
}

resilientChat();
```

## Middleware for Enhanced Functionality

### Request Logging

```javascript
const { loggingMiddleware } = require('@ultra-dex/sdk');

// Add logging to all requests
ultraDex.useMiddleware('logging', loggingMiddleware());
```

### Automatic Retries

```javascript
const { retryMiddleware } = require('@ultra-dex/sdk');

ultraDex.useMiddleware(
  'retry',
  retryMiddleware({
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
  })
);
```

### Response Caching

```javascript
const { cacheMiddleware } = require('@ultra-dex/sdk');

ultraDex.useMiddleware(
  'cache',
  cacheMiddleware({
    ttlMs: 10 * 60 * 1000, // 10 minutes
    maxSize: 100, // Max cached responses
  })
);
```

### Rate Limiting

```javascript
const { rateLimitMiddleware } = require('@ultra-dex/sdk');

ultraDex.useMiddleware(
  'rate-limit',
  rateLimitMiddleware({
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minute window
  })
);
```

## Agent System

### Creating Custom Agents

```javascript
const { Agent } = require('@ultra-dex/sdk');

const blogWriterAgent = new Agent({
  id: 'blog-writer',
  name: 'Technical Blog Writer',
  description: 'Writes technical blog posts about programming',
  capabilities: ['writing', 'research', 'seo'],
  meta: {
    specialties: ['JavaScript', 'Node.js', 'React'],
    tone: 'educational',
  },
});

// Register agent
ultraDex.registerAgent(blogWriterAgent);

// Agent memory - remember preferences and context
blogWriterAgent.remember('writing-style', {
  tone: 'conversational',
  includeCodeExamples: true,
  targetAudience: 'intermediate',
});

blogWriterAgent.remember('recent-topics', ['async patterns', 'testing strategies']);
```

### Running Agents

```javascript
async function writeBlogPost() {
  const task = {
    topic: 'Modern JavaScript Testing Strategies',
    wordCount: 1500,
    includeExamples: true,
    targetAudience: 'developers',
  };

  try {
    const result = await ultraDex.runAgent('blog-writer', task);
    console.log('Blog post written:', result.result.title);
    console.log('Content length:', result.result.content.length);
  } catch (error) {
    console.error('Agent execution failed:', error.message);
  }
}

writeBlogPost();
```

## Task Execution

### Simple Task Execution

```javascript
async function executeTask() {
  try {
    const result = await ultraDex.execute('Create a Node.js Express server with authentication', {
      mode: 'detailed',
      trace: true,
      timeout: 300000, // 5 minutes
    });

    if (result.status === 'completed') {
      console.log('Task completed successfully');
      console.log('Generated files:', Object.keys(result.results || {}));
    } else {
      console.log('Task failed:', result.errors);
    }
  } catch (error) {
    console.error('Execution error:', error.message);
  }
}

executeTask();
```

### Real-time Progress Monitoring

```javascript
async function monitorExecution() {
  const executionStream = ultraDex.executeStream('Build a full-stack e-commerce application', {
    mode: 'iterative',
    agents: ['frontend-developer', 'backend-developer', 'database-admin'],
    onProgress: (progress) => {
      console.log(`[${progress.type}] Step ${progress.stepIndex}/${progress.totalSteps}`);
      if (progress.agent) {
        console.log(`Agent: ${progress.agent}`);
      }
    },
  });

  try {
    for await (const progress of executionStream) {
      switch (progress.type) {
        case 'start':
          console.log('🚀 Execution started');
          break;
        case 'step_start':
          console.log(`▶️  Starting: ${progress.stepType}`);
          break;
        case 'step_complete':
          console.log(`✅ Completed: ${progress.stepType} (${progress.duration}ms)`);
          break;
        case 'step_error':
          console.log(`❌ Failed: ${progress.stepType} - ${progress.error}`);
          break;
        case 'complete':
          console.log('🎉 All tasks completed successfully');
          break;
        case 'error':
          console.log('💥 Execution failed:', progress.error);
          break;
        case 'peer_selected':
          console.log(`🌐 Distributed to peer: ${progress.peerId}`);
          break;
      }
    }
  } catch (error) {
    console.error('Streaming error:', error.message);
  }
}

monitorExecution();
```

## Distributed Execution

### Setting up a Distributed Network

```javascript
const { DistributedCoordinator } = require('@ultra-dex/sdk');

async function setupDistributed() {
  const coordinator = new DistributedCoordinator({
    instanceId: `node-${process.pid}`,
    port: 8080,
    host: '0.0.0.0',
    enableWebSocket: true,
    enableHttpApi: true,
    enableDiscovery: true,
    heartbeatInterval: 30000,
    maxConcurrentTasks: 5,
  });

  try {
    await coordinator.initialize();
    console.log('Coordinator initialized with ID:', coordinator.instanceId);

    // Add peer nodes
    coordinator.addDistributedPeer('http://192.168.1.100:8080');
    coordinator.addDistributedPeer('http://192.168.1.101:8080');

    // List connected peers
    const peers = coordinator.listDistributedPeers();
    console.log('Connected peers:', peers.length);

    // Integrate with Ultra-Dex
    ultraDex.distributedCoordinator = coordinator;

    return coordinator;
  } catch (error) {
    console.error('Failed to setup distributed coordinator:', error.message);
  }
}

setupDistributed();
```

### Distributed Task Execution

```javascript
async function runDistributedTask() {
  const task = {
    type: 'data-processing',
    dataset: 'large-dataset.csv',
    operations: ['clean', 'transform', 'analyze'],
    output: 'processed-data.json',
  };

  try {
    const result = await ultraDex.execute(task, {
      mode: 'distributed',
      priority: 2,
      timeout: 600000, // 10 minutes
    });

    console.log('Distributed execution result:', result.status);
    if (result.distributed) {
      console.log('Task was distributed across peers');
    }
  } catch (error) {
    console.error('Distributed task failed:', error.message);
  }
}

runDistributedTask();
```

## Error Handling and Resilience

```javascript
const { UltraDexError, ValidationError, NetworkError, ProviderError } = require('@ultra-dex/sdk');

async function robustAIInteraction() {
  const messages = [
    { role: 'user', content: 'Generate a complex algorithm for sorting large datasets.' },
  ];

  try {
    const response = await ultraDex.chat(messages, {
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.1,
    });

    console.log('Success:', response.content.substring(0, 100) + '...');
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error('❌ Validation Error: Please check your input format');
      console.error('Details:', error.details);
    } else if (error instanceof NetworkError) {
      console.error('🌐 Network Error: Check your internet connection');
      console.error('Cause:', error.cause?.message);
    } else if (error instanceof ProviderError) {
      console.error(`🤖 Provider Error (${error.provider}): API issue`);
      console.error('Try switching providers or check API key');
    } else if (error instanceof UltraDexError) {
      console.error('⚠️  Ultra-Dex Error:', error.code);
      console.error('Message:', error.message);
    } else {
      console.error('💥 Unknown Error:', error.message);
    }

    // Attempt fallback
    console.log('🔄 Attempting fallback...');
    try {
      const fallbackResponse = await ultraDex.chat(messages, {
        provider: 'anthropic', // Try different provider
      });
      console.log('Fallback successful:', fallbackResponse.content.substring(0, 100) + '...');
    } catch (fallbackError) {
      console.error('Fallback also failed');
    }
  }
}

robustAIInteraction();
```

## Plugins for Extensibility

### Creating Custom Plugins

```javascript
const { PluginDefinition } = require('@ultra-dex/sdk');

const metricsPlugin = {
  id: 'metrics-collector',
  version: '1.0.0',
  setup: (loader) => {
    let requestCount = 0;
    let errorCount = 0;
    let totalLatency = 0;

    loader.on('execution:start', () => {
      requestCount++;
    });

    loader.on('execution:complete', (payload) => {
      totalLatency += payload.duration || 0;
    });

    loader.on('execution:error', () => {
      errorCount++;
    });

    // Custom hook for metrics reporting
    loader.on('metrics:report', () => {
      console.log('📊 Metrics Report:');
      console.log(`Requests: ${requestCount}`);
      console.log(`Errors: ${errorCount}`);
      console.log(`Avg Latency: ${totalLatency / Math.max(requestCount, 1)}ms`);
    });
  },
};

// Load plugin
ultraDex.use(metricsPlugin);

// Trigger metrics report every 5 minutes
setInterval(
  () => {
    ultraDex.plugins.emit('metrics:report');
  },
  5 * 60 * 1000
);
```

## Real-World Examples

### API Development Assistant

```javascript
async function buildAPI() {
  const apiSpec = {
    name: 'User Management API',
    endpoints: [
      { path: '/users', method: 'GET', description: 'List users' },
      { path: '/users', method: 'POST', description: 'Create user' },
      { path: '/users/:id', method: 'GET', description: 'Get user by ID' },
    ],
    database: 'PostgreSQL',
    framework: 'Express.js',
  };

  const result = await ultraDex.execute(
    `Build a complete ${apiSpec.framework} API with the following specification: ${JSON.stringify(apiSpec, null, 2)}`,
    {
      mode: 'detailed',
      agents: ['api-developer', 'database-admin', 'tester'],
      trace: true,
    }
  );

  console.log('API built with', Object.keys(result.results || {}).length, 'files');
}
```

### Data Processing Pipeline

```javascript
async function processLargeDataset() {
  const pipeline = {
    input: 'raw-data.csv',
    operations: ['validate', 'clean', 'transform', 'aggregate', 'export'],
    output: 'processed-report.json',
  };

  const result = await ultraDex.execute(
    `Process large dataset with pipeline: ${JSON.stringify(pipeline)}`,
    {
      mode: 'distributed',
      priority: 1,
      timeout: 1800000, // 30 minutes
    }
  );

  console.log('Data processing completed:', result.status);
}
```

This guide provides practical JavaScript examples for using the Ultra-Dex SDK. For TypeScript-specific features and type safety, see the [TypeScript guide](./sdk-usage-typescript.md).</content>
<parameter name="filePath">guides/sdk-usage-javascript.md
