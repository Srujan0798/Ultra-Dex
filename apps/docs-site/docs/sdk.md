---
sidebar_position: 4
---

# SDK Reference

The Ultra-Dex SDK (`@ultra-dex/sdk`) provides programmatic access to the orchestration layer.

## Installation

```bash
npm install @ultra-dex/sdk
```

## Quick Start

```javascript
import { UltraDex } from '@ultra-dex/sdk';

const client = new UltraDex({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await client.chat('Build a REST API for a todo app');
console.log(response.content);
```

## Core Classes

### `UltraDex` — Client

```javascript
const client = new UltraDex({ provider, apiKey, model });
await client.chat(prompt, options);
await client.stream(prompt, options);
await client.embed(text);
```

### `Agent` — Base Class

```javascript
import { Agent } from '@ultra-dex/sdk';

class MyAgent extends Agent {
  constructor() {
    super({ id: 'my-agent', name: 'My Agent', capabilities: ['code-gen'] });
  }

  async execute(task) {
    return { output: `Processed: ${task.prompt}` };
  }
}
```

### `BaseProvider` — Provider Interface

```javascript
import { BaseProvider } from '@ultra-dex/sdk';

class MyProvider extends BaseProvider {
  async chat(messages, options) { /* ... */ }
  async *stream(messages, options) { /* ... */ }
  async embed(input) { /* ... */ }
}
```

### `PluginLoader` — Plugin System

```javascript
import { PluginLoader } from '@ultra-dex/sdk';

const loader = new PluginLoader();
await loader.load('./plugins/my-plugin');
const plugins = loader.getAll();
```
