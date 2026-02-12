---
sidebar_position: 5
---

# Extension Development

Build extensions for Ultra-Dex — CLI plugins, AI providers, integrations, and IDE extensions.

## Extension Types

| Type | Location | Runtime |
|---|---|---|
| CLI Plugins | `packages/plugins/` | Node.js ESM |
| AI Providers | `src/services/ai-providers/` | Node.js ESM |
| Integrations | `apps/cli/lib/integrations/` | Commander.js |
| VS Code | `packages/extensions/vscode/` | VS Code API |
| JetBrains | `packages/plugins/jetbrains/` | Kotlin |
| Neovim | `packages/plugins/neovim/` | Lua |
| Cursor | `packages/plugins/cursor/` | Cursor Rules |

## Creating a Plugin

### 1. Structure

```
packages/plugins/my-plugin/
├── manifest.json
├── index.js
└── README.md
```

### 2. Manifest

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

### 3. Implementation

```javascript
export default class MyPlugin {
  constructor(context) {
    this.context = context;
  }

  async activate() { console.log('Plugin activated'); }

  async execute(task) {
    const provider = this.context.getProvider();
    const result = await provider.chat([
      { role: 'user', content: task.prompt }
    ]);
    return { output: result.content };
  }

  async deactivate() { console.log('Plugin deactivated'); }
}
```

## Creating a Provider

See the [Provider Spec](https://github.com/Srujan0798/Ultra-Dex/blob/main/src/core/ai/PROVIDER-SPEC.md) for the full interface contract.

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

  async chat(messages, options = {}) { /* implement */ }
  async *stream(messages, options = {}) { /* implement */ }
  async embed(input) { /* implement */ }
}
```
