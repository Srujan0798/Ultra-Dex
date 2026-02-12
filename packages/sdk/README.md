# Ultra-Dex SDK

Official JavaScript/TypeScript SDK for Ultra-Dex AI orchestration platform.

## Installation

```bash
npm install @ultra-dex/sdk
```

## Quick Start

```javascript
import { UltraDex } from '@ultra-dex/sdk';

// Initialize client
const ultra = new UltraDex({
  apiKey: 'your-api-key',
  providers: ['openai', 'anthropic'],
  defaultStrategy: 'cost',
});

await ultra.initialize();

// Run an agent
const result = await ultra.run('architect', 'Design a scalable API');
console.log(result);

// Chat with AI
const response = await ultra.chat([{ role: 'user', content: 'Hello!' }]);
console.log(response.content);

// Stream responses
for await (const chunk of ultra.stream(messages)) {
  console.log(chunk.content);
}
```

## Configuration

```javascript
const ultra = new UltraDex({
  apiKey: process.env.ULTRA_DEX_API_KEY,
  baseUrl: 'https://api.ultra-dex.ai',
  providers: ['openai', 'anthropic', 'google'],
  defaultStrategy: 'balanced', // 'cost', 'latency', 'quality', 'fallback'
});
```

## Agents

```javascript
// List available agents
const agents = await ultra.listAgents();

// Get agent details
const agent = await ultra.getAgent('architect');

// Run specific agent
const result = await ultra.run('coder', 'Implement user authentication', {
  language: 'typescript',
  framework: 'express',
});
```

## Plugins

```javascript
// Load a plugin
await ultra.loadPlugin('github-integration', {
  token: process.env.GITHUB_TOKEN,
});

// List loaded plugins
const plugins = await ultra.listPlugins();
```

## License

MIT
