# Ultra-Dex Extension Development Guide

> Build extensions for the Ultra-Dex ecosystem — VS Code, CLI plugins, cursor rules, and integrations.

## Extension Types

| Type              | Location                      | Format                   |
| ----------------- | ----------------------------- | ------------------------ |
| VS Code Extension | `packages/extensions/vscode/` | TypeScript + VS Code API |
| CLI Plugins       | `packages/plugins/`           | ESM JavaScript modules   |
| Cursor Rules      | `packages/cursor-rules/`      | `.cursorrules` YAML      |
| Integrations      | `apps/cli/lib/integrations/`  | ESM with Commander.js    |

## Quick Start: CLI Plugin

### 1. Create plugin structure

```
packages/plugins/my-plugin/
├── manifest.json
├── index.js
└── README.md
```

### 2. Define manifest

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "My Ultra-Dex plugin",
  "main": "index.js",
  "capabilities": ["custom-task"],
  "requiredPermissions": ["file-read", "ai-chat"]
}
```

### 3. Implement plugin

```javascript
export default class MyPlugin {
  constructor(context) {
    this.context = context;
    this.name = 'my-plugin';
  }

  async activate() {
    console.log(`[${this.name}] activated`);
  }

  async execute(task) {
    const provider = this.context.getProvider();
    const result = await provider.chat([{ role: 'user', content: task.prompt }]);
    return { output: result.content };
  }

  async deactivate() {
    console.log(`[${this.name}] deactivated`);
  }
}
```

### 4. Load plugin

```javascript
import { PluginLoader } from '@ultra-dex/sdk';

const loader = new PluginLoader();
await loader.load('./packages/plugins/my-plugin');
```

## Quick Start: AI Provider

Every provider must implement the `BaseProvider` interface:

```javascript
import { BaseProvider } from '../../src/services/ai-providers/base-provider.js';

export class MyProvider extends BaseProvider {
  constructor(config = {}) {
    super('myprovider', {
      baseUrl: 'https://api.myprovider.com/v1',
      defaultModel: 'my-model',
      ...config,
    });
  }

  async chat(messages, options = {}) {
    const result = await this._request('/chat/completions', {
      model: options.model || this.defaultModel,
      messages,
    });
    return {
      content: result.choices?.[0]?.message?.content || '',
      usage: {
        inputTokens: result.usage?.prompt_tokens || 0,
        outputTokens: result.usage?.completion_tokens || 0,
        totalTokens: result.usage?.total_tokens || 0,
      },
      model: result.model,
    };
  }

  async *stream(messages, options = {}) {
    for await (const chunk of this._streamRequest('/chat/completions', {
      model: options.model || this.defaultModel,
      messages,
      stream: true,
    })) {
      if (chunk.choices?.[0]?.delta?.content) {
        yield { type: 'content', content: chunk.choices[0].delta.content };
      }
    }
  }

  async embed(input) {
    const result = await this._request('/embeddings', {
      input: Array.isArray(input) ? input : [input],
    });
    return {
      embedding: result.data?.[0]?.embedding || [],
      dimensions: result.data?.[0]?.embedding?.length || 0,
    };
  }
}
```

Register in `src/services/ai-providers/index.js`:

```javascript
export { MyProvider } from './myprovider.js';
```

## Quick Start: Integration Command

```javascript
// apps/cli/lib/integrations/myservice.js

export function deploy(options = {}) {
  /* ... */
}
export function status(options = {}) {
  /* ... */
}
export function logs(options = {}) {
  /* ... */
}

export function registerCommands(program) {
  const cmd = program.command('myservice').description('MyService integration');
  cmd.command('deploy').action((opts) => console.log(deploy(opts)));
  cmd.command('status').action((opts) => console.log(status(opts)));
  cmd.command('logs').action((opts) => console.log(logs(opts)));
  return cmd;
}
```

## Provider Interface Spec

See full spec: [PROVIDER-SPEC.md](../src/core/ai/PROVIDER-SPEC.md)

### Required Methods

| Method     | Signature                                      | Returns                     |
| ---------- | ---------------------------------------------- | --------------------------- |
| `chat()`   | `(messages, options?) → Promise<ChatResult>`   | `{ content, usage, model }` |
| `stream()` | `(messages, options?) → AsyncGenerator<Chunk>` | `{ type, content }`         |
| `embed()`  | `(input, options?) → Promise<EmbedResult>`     | `{ embedding, dimensions }` |

### Optional Methods

| Method        | Purpose                      |
| ------------- | ---------------------------- |
| `vision()`    | Image understanding          |
| `code()`      | Code generation with context |
| `reasoning()` | Chain-of-thought with trace  |

## Testing Extensions

```bash
# Run core tests to verify nothing broke
node --test tests/core/*.test.js tests/cli/*.test.js

# Run governance checks
node gitFail/compliance/check-governance-files.js
```

## License

All extensions must be MIT-compatible. See `LICENSE`.
