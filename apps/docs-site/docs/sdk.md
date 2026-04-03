---
sidebar_position: 4
---

# SDK Reference

The Ultra-Dex SDK (`@ultra-dex/sdk`) provides programmatic access to the orchestration layer with TypeScript support and comprehensive examples.

## Installation

```bash
npm install @ultra-dex/sdk
# or
yarn add @ultra-dex/sdk
# or
pnpm add @ultra-dex/sdk
```

## TypeScript Setup

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## Quick Start Examples

### Basic Chat Completion

```javascript
import { UltraDex } from '@ultra-dex/sdk';

const client = new UltraDex({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4'
});

const response = await client.chat('Build a REST API for a todo app');
console.log(response.content);
```

### Streaming Responses

```javascript
import { UltraDex } from '@ultra-dex/sdk';

const client = new UltraDex({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY
});

const stream = client.stream('Write a React component for a user profile');
for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}
```

### Multi-Provider Orchestration

```javascript
import { UltraDex, ProviderRouter } from '@ultra-dex/sdk';

const router = new ProviderRouter({
  strategies: [
    { provider: 'openai', priority: 1, costWeight: 0.3 },
    { provider: 'anthropic', priority: 2, costWeight: 0.2 },
    { provider: 'google', priority: 3, costWeight: 0.1 }
  ]
});

const client = new UltraDex({
  router,
  fallback: true
});

const response = await client.chat('Optimize this database query', {
  maxTokens: 1000,
  temperature: 0.1
});
```

## Core Classes

### `UltraDex` — Main Client

```typescript
interface UltraDexConfig {
  provider?: string;
  apiKey?: string;
  model?: string;
  router?: ProviderRouter;
  fallback?: boolean;
  timeout?: number;
  maxRetries?: number;
}

class UltraDex {
  constructor(config: UltraDexConfig);

  async chat(
    prompt: string,
    options?: ChatOptions
  ): Promise<ChatResponse>;

  async *stream(
    prompt: string,
    options?: ChatOptions
  ): AsyncGenerator<StreamChunk>;

  async embed(
    text: string,
    options?: EmbedOptions
  ): Promise<EmbedResponse>;

  async executeTask(
    task: Task,
    agents?: string[]
  ): Promise<TaskResult>;
}
```

#### Chat Options

```typescript
interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  functions?: FunctionDefinition[];
  functionCall?: string | { name: string };
  stream?: boolean;
}
```

#### Usage Examples

```javascript
// Basic chat with options
const response = await client.chat('Explain quantum computing', {
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 500
});

// Function calling
const response = await client.chat('Calculate the fibonacci sequence', {
  functions: [{
    name: 'fibonacci',
    description: 'Calculate nth fibonacci number',
    parameters: {
      type: 'object',
      properties: {
        n: { type: 'number' }
      }
    }
  }],
  functionCall: 'auto'
});
```

### `Agent` — Custom Agent Base Class

```typescript
interface AgentConfig {
  id: string;
  name: string;
  capabilities: string[];
  model?: string;
  provider?: string;
  memory?: boolean;
}

abstract class Agent {
  constructor(config: AgentConfig);

  abstract async execute(task: Task): Promise<TaskResult>;

  protected async chat(prompt: string): Promise<ChatResponse>;
  protected async delegate(task: Task, targetAgent: string): Promise<TaskResult>;
  protected async storeMemory(key: string, value: any): Promise<void>;
  protected async retrieveMemory(key: string): Promise<any>;
}
```

#### Custom Agent Example

```typescript
import { Agent, Task, TaskResult } from '@ultra-dex/sdk';

class CodeReviewerAgent extends Agent {
  constructor() {
    super({
      id: 'code-reviewer',
      name: 'Code Review Agent',
      capabilities: ['code-review', 'security-audit', 'performance-check']
    });
  }

  async execute(task: Task): Promise<TaskResult> {
    const { code, language } = task.input;

    // Analyze code quality
    const analysis = await this.chat(`
      Review this ${language} code for:
      1. Security vulnerabilities
      2. Performance issues
      3. Code quality problems
      4. Best practices compliance

      Code:
      ${code}
    `);

    // Run automated checks
    const securityCheck = await this.runSecurityScan(code);
    const performanceCheck = await this.runPerformanceAnalysis(code);

    return {
      output: {
        analysis: analysis.content,
        security: securityCheck,
        performance: performanceCheck,
        recommendations: this.generateRecommendations(analysis, securityCheck, performanceCheck)
      },
      metadata: {
        reviewedAt: new Date().toISOString(),
        language,
        issues: this.countIssues(analysis)
      }
    };
  }

  private async runSecurityScan(code: string) {
    // Implementation for security scanning
    return { vulnerabilities: [], severity: 'low' };
  }

  private async runPerformanceAnalysis(code: string) {
    // Implementation for performance analysis
    return { bottlenecks: [], score: 85 };
  }

  private generateRecommendations(analysis: any, security: any, performance: any) {
    // Generate actionable recommendations
    return [];
  }

  private countIssues(analysis: any) {
    return 0;
  }
}
```

### `BaseProvider` — Custom Provider Implementation

```typescript
interface ProviderConfig {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  functionCall?: any;
}

interface ChatResponse {
  content: string;
  usage: TokenUsage;
  model: string;
  finishReason?: string;
}

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

abstract class BaseProvider {
  constructor(config: ProviderConfig);

  abstract async chat(
    messages: ChatMessage[],
    options?: ChatOptions
  ): Promise<ChatResponse>;

  abstract async *stream(
    messages: ChatMessage[],
    options?: ChatOptions
  ): AsyncGenerator<StreamChunk>;

  abstract async embed(
    input: string | string[],
    options?: EmbedOptions
  ): Promise<EmbedResponse>;

  abstract async listModels(): Promise<ModelInfo[]>;
}
```

#### Custom Provider Example

```typescript
import { BaseProvider, ChatMessage, ChatResponse, TokenUsage } from '@ultra-dex/sdk';

class CustomProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.client = new CustomAPIClient({ apiKey: config.apiKey });
  }

  async chat(messages: ChatMessage[], options = {}) {
    const response = await this.client.createChatCompletion({
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      model: options.model || 'custom-model',
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens
    });

    return {
      content: response.choices[0].message.content,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      },
      model: response.model,
      finishReason: response.choices[0].finish_reason
    };
  }

  async *stream(messages: ChatMessage[], options = {}) {
    const stream = await this.client.createChatCompletionStream({
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      model: options.model || 'custom-model',
      temperature: options.temperature || 0.7,
      stream: true
    });

    for await (const chunk of stream) {
      yield {
        content: chunk.choices[0]?.delta?.content || '',
        usage: chunk.usage ? {
          promptTokens: chunk.usage.prompt_tokens,
          completionTokens: chunk.usage.completion_tokens,
          totalTokens: chunk.usage.total_tokens
        } : undefined,
        done: chunk.choices[0]?.finish_reason !== null
      };
    }
  }

  async embed(input: string | string[], options = {}) {
    const inputs = Array.isArray(input) ? input : [input];
    const response = await this.client.createEmbeddings({
      input: inputs,
      model: options.model || 'custom-embedding'
    });

    return {
      embeddings: response.data.map(item => item.embedding),
      model: response.model,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: 0,
        totalTokens: response.usage.total_tokens
      }
    };
  }

  async listModels() {
    const response = await this.client.listModels();
    return response.data.map(model => ({
      id: model.id,
      name: model.id,
      contextLength: model.context_length || 4096,
      pricing: model.pricing || {}
    }));
  }
}
```

### `PluginLoader` — Plugin Management

```typescript
interface PluginManifest {
  name: string;
  version: string;
  description?: string;
  main: string;
  capabilities: string[];
  dependencies?: Record<string, string>;
}

class PluginLoader {
  async load(path: string): Promise<Plugin>;
  async loadMultiple(paths: string[]): Promise<Plugin[]>;
  get(name: string): Plugin | undefined;
  getAll(): Plugin[];
  unload(name: string): boolean;
  reload(name: string): Promise<boolean>;
}
```

#### Plugin Development Example

```typescript
// plugins/my-custom-plugin/index.js
export const manifest = {
  name: 'my-custom-plugin',
  version: '1.0.0',
  description: 'Custom plugin for specialized tasks',
  main: 'index.js',
  capabilities: ['custom-processing', 'data-analysis'],
  dependencies: {
    'lodash': '^4.17.21'
  }
};

export class MyCustomPlugin {
  constructor(config = {}) {
    this.config = config;
  }

  async initialize(context) {
    this.context = context;
    // Plugin initialization logic
  }

  async execute(task) {
    // Plugin execution logic
    switch (task.type) {
      case 'custom-processing':
        return this.processCustom(task.input);
      case 'data-analysis':
        return this.analyzeData(task.input);
      default:
        throw new Error(`Unsupported task type: ${task.type}`);
    }
  }

  async processCustom(input) {
    // Custom processing logic
    return { result: `Processed: ${input}`, processedAt: new Date() };
  }

  async analyzeData(input) {
    // Data analysis logic
    return { insights: [], metrics: {} };
  }

  async cleanup() {
    // Cleanup logic
  }
}

export default MyCustomPlugin;
```

## Advanced Usage Patterns

### Agent Orchestration

```typescript
import { UltraDex, AgentOrchestrator } from '@ultra-dex/sdk';

const orchestrator = new AgentOrchestrator({
  agents: [
    new CodeReviewerAgent(),
    new TestGeneratorAgent(),
    new DocumentationAgent()
  ],
  workflow: [
    { agent: 'code-reviewer', next: 'test-generator' },
    { agent: 'test-generator', next: 'documentation' },
    { agent: 'documentation' }
  ]
});

const result = await orchestrator.execute({
  type: 'feature-implementation',
  input: { code: '...', requirements: '...' }
});
```

### Memory Integration

```typescript
import { UltraDex, MemoryManager } from '@ultra-dex/sdk';

const memory = new MemoryManager({
  provider: 'redis',
  host: 'localhost',
  port: 6379
});

const client = new UltraDex({
  provider: 'openai',
  memory
});

// Chat with memory
const response1 = await client.chat('My name is John');
const response2 = await client.chat('What is my name?'); // Remembers "John"

// Explicit memory operations
await memory.store('user_preferences', { theme: 'dark', language: 'en' });
const prefs = await memory.retrieve('user_preferences');
```

### Error Handling and Retry

```typescript
import { UltraDex, RetryConfig } from '@ultra-dex/sdk';

const client = new UltraDex({
  provider: 'openai',
  retry: {
    maxAttempts: 3,
    backoff: 'exponential',
    baseDelay: 1000,
    maxDelay: 10000
  }
});

try {
  const response = await client.chat('Complex task that might fail');
} catch (error) {
  if (error.code === 'rate_limit_exceeded') {
    console.log('Rate limited, will retry automatically');
  } else {
    console.error('Failed after retries:', error);
  }
}
```

### Batch Processing

```typescript
import { UltraDex, BatchProcessor } from '@ultra-dex/sdk';

const processor = new BatchProcessor({
  client: new UltraDex({ provider: 'openai' }),
  batchSize: 10,
  concurrency: 3
});

const tasks = [
  'Summarize this article...',
  'Translate to French...',
  'Generate code for...'
];

const results = await processor.process(tasks, {
  onProgress: (completed, total) => {
    console.log(`Progress: ${completed}/${total}`);
  },
  onError: (error, task) => {
    console.error(`Failed task: ${task}`, error);
  }
});
```
