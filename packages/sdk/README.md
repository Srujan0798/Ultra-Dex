# @ultra-dex/sdk

Standalone JavaScript and TypeScript SDK for Ultra-Dex.

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/Srujan0798/Ultra-Dex)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

## Install

```bash
npm install @ultra-dex/sdk
```

## Quickstart

```js
import { UltraDex } from '@ultra-dex/sdk';

const sdk = new UltraDex({ defaultProvider: 'mock' });

sdk.registerProvider('mock', {
  async chat(messages) {
    return { content: `echo: ${messages.at(-1)?.content ?? ''}`, usage: {} };
  },
  async *stream() {
    yield { type: 'done' };
  },
  async embed(text) {
    return { embedding: [text.length] };
  },
});

const reply = await sdk.chat([{ role: 'user', content: 'Hello' }]);
console.log(reply.content);
```

## Subpath Imports

```js
import { Agent } from '@ultra-dex/sdk/agent';
import { BaseProvider } from '@ultra-dex/sdk/provider';
import { PluginLoader } from '@ultra-dex/sdk/plugin';
import { MemoryManager } from '@ultra-dex/sdk/memory';
import { TaskRouter } from '@ultra-dex/sdk/router';
```

## Features

### AI Provider Management

```js
import { UltraDex, BaseProvider } from '@ultra-dex/sdk';

// Create a custom provider
class MyProvider extends BaseProvider {
  async chat(messages) {
    // Your AI implementation
    return {
      content: 'AI response',
      usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
      model: 'my-model-v1',
    };
  }

  async *stream(messages) {
    // Streaming implementation
    yield { type: 'content', content: 'Hello' };
    yield { type: 'done' };
  }

  async embed(text) {
    return {
      embedding: [0.1, 0.2, 0.3],
      dimensions: 3,
    };
  }
}

const sdk = new UltraDex({ defaultProvider: 'custom' });
sdk.registerProvider('custom', new MyProvider());
```

### Agent System

```js
import { Agent } from '@ultra-dex/sdk/agent';

const agent = new Agent({
  name: 'code-reviewer',
  capabilities: ['code-review', 'suggestions'],
  provider: 'openai',
});

await agent.initialize();

const result = await agent.execute({
  task: 'Review this code for security issues',
  context: { code: '...' },
});
```

### Memory Management

```js
import { MemoryManager } from '@ultra-dex/sdk/memory';

const memory = new MemoryManager({
  storage: 'redis', // or 'file', 'memory'
  namespace: 'my-app',
});

await memory.initialize();

// Store with importance scoring
await memory.store({
  content: 'Important decision about API design',
  importance: 0.9,
  tags: ['architecture', 'api'],
});

// Search memories
const results = await memory.search({
  query: 'API design',
  limit: 10,
});
```

### Task Routing

```js
import { TaskRouter } from '@ultra-dex/sdk/router';

const router = new TaskRouter({
  providers: ['openai', 'anthropic', 'google'],
  strategy: 'cost-optimized', // or 'quality', 'latency', 'fallback'
});

const result = await router.route({
  task: 'Generate API documentation',
  requirements: {
    maxCost: 0.05,
    maxLatency: 2000,
  },
});
```

### Plugin System

```js
import { PluginLoader } from '@ultra-dex/sdk/plugin';

const loader = new PluginLoader({
  directory: './plugins',
  autoLoad: true,
});

await loader.initialize();

// Load a specific plugin
const myPlugin = await loader.load('my-plugin');
await myPlugin.activate();
```

## Configuration

```js
const sdk = new UltraDex({
  defaultProvider: 'openai',
  providers: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4',
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: 'claude-3-opus',
    },
  },
  memory: {
    enabled: true,
    storage: 'redis',
    redisUrl: process.env.REDIS_URL,
  },
  caching: {
    enabled: true,
    ttl: 3600,
  },
});
```

## Error Handling

```js
try {
  const result = await sdk.chat(messages);
} catch (error) {
  if (error.code === 'PROVIDER_ERROR') {
    // Handle provider failure
    console.error('Provider failed:', error.message);
  } else if (error.code === 'RATE_LIMIT') {
    // Handle rate limiting
    await delay(error.retryAfter);
  }
}
```

## Streaming Responses

```js
const stream = sdk.chatStream(messages);

for await (const chunk of stream) {
  if (chunk.type === 'content') {
    process.stdout.write(chunk.content);
  } else if (chunk.type === 'error') {
    console.error('Stream error:', chunk.error);
  } else if (chunk.type === 'done') {
    console.log('\nDone!');
  }
}
```

## TypeScript Support

```ts
import { UltraDex, ChatMessage, ProviderConfig } from '@ultra-dex/sdk';

const messages: ChatMessage[] = [
  { role: 'system', content: 'You are a helpful assistant' },
  { role: 'user', content: 'Hello!' },
];

const config: ProviderConfig = {
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4',
  temperature: 0.7,
};

const sdk = new UltraDex({ defaultProvider: 'openai' });
```

## API Reference

### UltraDex Class

- `chat(messages: ChatMessage[]): Promise<ChatResponse>`
- `chatStream(messages: ChatMessage[]): AsyncGenerator<StreamChunk>`
- `embed(text: string): Promise<EmbeddingResponse>`
- `registerProvider(name: string, provider: BaseProvider): void`
- `setDefaultProvider(name: string): void`

### Agent Class

- `initialize(): Promise<void>`
- `execute(task: Task): Promise<TaskResult>`
- `addCapability(capability: Capability): void`
- `setProvider(provider: string): void`

### MemoryManager Class

- `initialize(): Promise<void>`
- `store(entry: MemoryEntry): Promise<string>`
- `retrieve(id: string): Promise<MemoryEntry>`
- `search(query: SearchQuery): Promise<MemoryEntry[]>`
- `delete(id: string): Promise<void>`

### TaskRouter Class

- `route(task: Task): Promise<RoutedTask>`
- `addProvider(provider: string, config: ProviderConfig): void`
- `setStrategy(strategy: RoutingStrategy): void`

## Examples

See the `examples/` directory for more usage examples:

- `basic-chat.js` - Simple chat completion
- `streaming.js` - Streaming responses
- `agent-workflow.js` - Agent-based workflows
- `memory-persistence.js` - Memory management
- `plugin-development.js` - Plugin development

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.

## License

MIT. See [LICENSE](../../LICENSE).
