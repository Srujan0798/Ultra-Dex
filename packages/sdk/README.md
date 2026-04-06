# @ultra-dex/sdk

Standalone JavaScript and TypeScript SDK for Ultra-Dex.

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

Subpath imports are also available:

```js
import { Agent } from '@ultra-dex/sdk/agent';
import { BaseProvider } from '@ultra-dex/sdk/provider';
import { PluginLoader } from '@ultra-dex/sdk/plugin';
```
