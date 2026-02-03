# Plugin Development Guide

> **Extend Ultra-Dex with custom capabilities.**
> Learn how to build, test, and publish plugins for the Ultra-Dex ecosystem.

---

## 🔌 Introduction

Ultra-Dex plugins allow you to:
- Add new CLI commands
- Hook into existing workflows (pre-init, post-build, etc.)
- Register custom AI agents
- Add new project templates

Plugins are simple JavaScript modules that export an `activate` function.

## 🚀 Quick Start

1. **Create a plugin file** (e.g., `my-plugin.js`):

```javascript
export const name = 'my-plugin';
export const version = '1.0.0';
export const description = 'A sample Ultra-Dex plugin';

export async function activate(context) {
  const { program, eventBus } = context;

  // 1. Register a new command
  program
    .command('hello')
    .description('Say hello from my plugin')
    .action(() => {
      console.log('Hello world!');
    });

  // 2. Listen for events
  eventBus.on('project:init', (data) => {
    console.log(`Project initialized: ${data.name}`);
  });
}
```

2. **Install it locally:**

```bash
npx ultra-dex plugin install ./my-plugin.js
```

3. **Run your command:**

```bash
npx ultra-dex hello
```

## 🧩 Plugin Structure

A plugin module must export the following:

| Export | Type | Description |
|--------|------|-------------|
| `name` | string | Unique name of your plugin (e.g., `ultra-dex-stripe`) |
| `version` | string | Semantic version (e.g., `1.0.0`) |
| `activate` | function | Entry point called when CLI starts |
| `deactivate` | function | (Optional) Cleanup function |

### The `activate` Context

The `activate` function receives a `context` object with:

- `program`: The Commander.js instance (to add commands).
- `eventBus`: An EventEmitter for system events.
- `config`: Access to the user's configuration.
- `agents`: The agent registry (to add/modify agents).

## 🪝 Hooks & Events

Ultra-Dex emits events during its lifecycle. You can subscribe to them:

```javascript
eventBus.on('agent:start', (agentName) => { ... });
eventBus.on('build:complete', (stats) => { ... });
eventBus.on('error', (err) => { ... });
```

## 🤖 Adding Custom Agents

You can register specialized AI agents:

```javascript
export async function activate({ agents }) {
  agents.register({
    name: 'sql-expert',
    role: 'Database Optimizer',
    capabilities: ['sql-optimization', 'index-tuning'],
    systemPrompt: 'You are an expert in PostgreSQL performance...'
  });
}
```

## 📦 Publishing

Currently, plugins are distributed as npm packages or local files.
To publish to the upcoming Ultra-Dex Registry:

1. Ensure your package name starts with `ultra-dex-plugin-`
2. Publish to npm: `npm publish`
3. Users install via: `npx ultra-dex plugin install ultra-dex-plugin-myname`

## 🧪 Testing

Test your plugin by installing it in a local Ultra-Dex project:

```bash
# In your plugin dir
npm link

# In your test project
npx ultra-dex plugin link my-plugin
```

---

*Need help? Check the [examples/plugins](../examples/plugins) directory.*
