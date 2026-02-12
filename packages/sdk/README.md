# @ultra-dex/sdk

JavaScript/TypeScript SDK for integrating Ultra-Dex providers, agents, and plugins into your app.

## Install

```bash
npm install @ultra-dex/sdk
```

## Quick Start

```js
import { UltraDex } from '@ultra-dex/sdk/client';
import { BaseProvider } from '@ultra-dex/sdk/provider';
import { Agent } from '@ultra-dex/sdk/agent';

class MockProvider extends BaseProvider {
  async chat(messages) {
    return {
      content: `echo: ${messages.at(-1)?.content ?? ''}`,
      usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
      model: 'mock-v1',
    };
  }

  async *stream(messages) {
    yield { type: 'text', content: `echo: ${messages.at(-1)?.content ?? ''}` };
    yield { type: 'done' };
  }

  async embed() {
    return { embedding: [0.1, 0.2, 0.3], dimensions: 3 };
  }
}

class PlannerAgent extends Agent {
  async run(task) {
    return { steps: [`Plan for: ${task}`] };
  }
}

const sdk = new UltraDex({ defaultProvider: 'mock' });
sdk.registerProvider('mock', new MockProvider());
sdk.registerAgent(new PlannerAgent({ id: 'planner' }));

const reply = await sdk.chat([{ role: 'user', content: 'Design auth flow' }]);
console.log(reply.content);

const plan = await sdk.runAgent('planner', 'Build project roadmap');
console.log(plan.result);
```

## Plugin Example

```js
sdk.use({
  id: 'audit-plugin',
  hooks: {
    afterChat: async (payload) => {
      console.log('chat completed', payload);
    },
  },
});

await sdk.plugins.emit('afterChat', { ok: true });
```

## API Surface

- `UltraDex`: provider registry + agent runner + plugin host
- `Agent`: base class for custom agents
- `BaseProvider`: base contract for `chat`, `stream`, `embed`
- `PluginLoader`: hook-based plugin loader

## License

MIT
