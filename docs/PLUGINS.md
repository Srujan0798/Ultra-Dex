# 🔌 Ultra-Dex Plugin System

Ultra-Dex is highly extensible via a powerful plugin system. You can add custom hooks, commands, and logic to the core orchestration engine.

## 🚀 Quick Start

To see available community plugins:
```bash
ultra-dex plugin marketplace
```

To create your own:
```bash
ultra-dex plugin create my-plugin
```

## 🏗️ Architecture

Plugins are stored in `.ultra/plugins/` and consist of:
1.  `ultra-dex-plugin.json`: The manifest file.
2.  `index.js`: The entry point.

### Manifest (`ultra-dex-plugin.json`)

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Short description",
  "main": "index.js",
  "author": "Your Name",
  "hooks": ["pre-run", "post-run"],
  "commands": [
    { "name": "my-cmd", "description": "What it does" }
  ]
}
```

### Implementation (`index.js`)

Plugins must export a default object with an `activate` method.

```javascript
export default {
  async activate(manager) {
    // Subscribe to a hook
    manager.registerHook('pre-run', async (context) => {
      console.log('Task starting:', context.task);
    });
  },

  commands: {
    'my-cmd': async (args, options) => {
      console.log('Custom logic executed!');
    }
  }
};
```

## 🪝 Available Hooks

| Hook | When it fires | Context |
|---|---|---|
| `pre-init` | Before project scaffolding | `{ name, stack }` |
| `post-init` | After project scaffolding | `{ path }` |
| `pre-run` | Before an agent starts | `{ task, agent }` |
| `post-run` | After an agent finishes | `{ task, status, output }` |
| `pre-generate` | Before plan generation | `{ idea }` |
| `post-generate` | After plan generation | `{ sections }` |

## 📦 Example Plugins

See the `/plugins` directory in the repository for full examples:
- `logger`: Activity logging to file.
- `slack`: Webhook notifications.
- `clerk`: Auth scaffolding.
- `viz-dash`: Dashboard extensions.
- `docker-enhanced`: Sandbox profiles.
