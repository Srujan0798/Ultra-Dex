# MCP Plugin Specification

## Overview

Ultra-Dex plugins use the **Model Context Protocol (MCP)** for standardized integration. This specification defines the plugin format, manifest schema, security model, and API.

## Plugin Format

### Directory Structure

```
my-plugin/
├── package.json          # Plugin manifest
├── index.js              # Main entry point
├── README.md             # Documentation
├── LICENSE               # License file
├── src/                  # Source code
│   ├── index.js
│   ├── actions/
│   └── utils/
└── tests/                # Test files
    └── index.test.js
```

### package.json

```json
{
  "name": "@ultra-dex/plugin-my-plugin",
  "version": "1.0.0",
  "description": "My awesome plugin",
  "main": "index.js",
  "ultra-dex": {
    "id": "my-plugin",
    "name": "My Plugin",
    "version": "1.0.0",
    "author": "Your Name",
    "license": "MIT",
    "capabilities": ["task-automation", "data-processing"],
    "permissions": ["filesystem:read", "network"],
    "entryPoint": "index.js",
    "hooks": {
      "onInstall": "scripts/install.js",
      "onUninstall": "scripts/uninstall.js",
      "onTaskComplete": "hooks/task-complete.js"
    },
    "config": {
      "schema": {
        "apiKey": { "type": "string", "required": true },
        "endpoint": { "type": "string", "default": "https://api.example.com" }
      }
    }
  },
  "dependencies": {
    "axios": "^1.0.0"
  },
  "peerDependencies": {
    "@ultra-dex/core": ">=3.0.0"
  }
}
```

## Manifest Schema

### Required Fields

| Field          | Type     | Description                                |
| -------------- | -------- | ------------------------------------------ |
| `id`           | string   | Unique plugin identifier (kebab-case)      |
| `name`         | string   | Human-readable name                        |
| `version`      | string   | Semantic version (e.g., "1.0.0")           |
| `author`       | string   | Author name or organization                |
| `license`      | string   | SPDX license identifier                    |
| `capabilities` | string[] | Plugin capabilities                        |
| `entryPoint`   | string   | Main entry file (relative to package root) |

### Optional Fields

| Field              | Type     | Description          |
| ------------------ | -------- | -------------------- |
| `permissions`      | string[] | Required permissions |
| `hooks`            | object   | Lifecycle hooks      |
| `config`           | object   | Configuration schema |
| `dependencies`     | object   | NPM dependencies     |
| `peerDependencies` | object   | Peer dependencies    |

## Permissions

Plugins must declare required permissions:

| Permission         | Description           |
| ------------------ | --------------------- |
| `filesystem:read`  | Read files            |
| `filesystem:write` | Write files           |
| `network`          | Make HTTP requests    |
| `process:spawn`    | Spawn child processes |
| `memory:unlimited` | Remove memory limits  |

## Entry Point

The entry point must export an `activate` function:

```javascript
// index.js

/**
 * Plugin activation
 * @param {PluginContext} context - Plugin context
 * @returns {PluginAPI} Plugin API
 */
function activate(context) {
  const { logger, config, ultraDex } = context;

  logger.info('MyPlugin activated');

  // Register actions
  ultraDex.registerAction('myPlugin.doSomething', async (params) => {
    // Do something
    return { success: true };
  });

  // Return plugin API
  return {
    name: 'my-plugin',
    version: '1.0.0',

    // Cleanup on deactivation
    deactivate() {
      logger.info('MyPlugin deactivated');
    },
  };
}

module.exports = { activate };
```

## Plugin Context

The `context` object provides:

```typescript
interface PluginContext {
  // Plugin info
  pluginId: string;
  pluginName: string;
  version: string;

  // Utilities
  logger: ILogger;
  config: PluginConfig;

  // Ultra-Dex API
  ultraDex: {
    // Register an action
    registerAction(name: string, handler: Function): void;

    // Call another plugin's action
    callAction(pluginId: string, actionName: string, params: object): Promise<any>;

    // Subscribe to events
    on(event: string, handler: Function): void;

    // Emit event
    emit(event: string, data: any): void;

    // Get memory
    getMemory(key: string): Promise<any>;

    // Set memory
    setMemory(key: string, value: any): Promise<void>;
  };

  // Sandbox info
  sandbox: {
    timeout: number;
    memoryLimit: number;
    allowedModules: string[];
  };
}
```

## Lifecycle Hooks

### onInstall

Called when plugin is installed:

```javascript
// scripts/install.js
module.exports = async function onInstall(context) {
  const { logger, config } = context;

  logger.info('Installing my-plugin...');

  // Setup database tables
  // Create default config
  // etc.

  return { success: true };
};
```

### onUninstall

Called when plugin is uninstalled:

```javascript
// scripts/uninstall.js
module.exports = async function onUninstall(context) {
  const { logger } = context;

  logger.info('Uninstalling my-plugin...');

  // Cleanup
  // Remove data
  // etc.

  return { success: true };
};
```

### onTaskComplete

Called when a task completes:

```javascript
// hooks/task-complete.js
module.exports = async function onTaskComplete(context, task) {
  const { logger } = context;

  logger.info('Task completed', { taskId: task.id });

  // Post to Slack
  // Update dashboard
  // etc.
};
```

## Security Model

### Sandboxing

Plugins run in an isolated sandbox with:

- **Timeout**: Default 5s per execution
- **Memory Limit**: Default 128MB
- **Restricted Modules**: Dangerous modules blocked
- **No eval**: `eval()` and `new Function()` blocked

### Permission Enforcement

```javascript
// Plugin requests filesystem access
permissions: ['filesystem:read'];

// Code tries to write without permission
fs.writeFileSync('/tmp/test.txt', 'data');
// → Error: filesystem:write permission required
```

### Code Validation

Plugins are validated before execution:

```javascript
const violations = sandbox.validateCode(pluginCode);
if (violations.length > 0) {
  throw new Error(`Security violations: ${violations.map((v) => v.message).join(', ')}`);
}
```

## Example: Simple Plugin

```javascript
// index.js - Simple calculator plugin

function activate(context) {
  const { logger, ultraDex } = context;

  logger.info('Calculator plugin activated');

  ultraDex.registerAction('calculator.add', async ({ a, b }) => {
    return { result: a + b };
  });

  ultraDex.registerAction('calculator.multiply', async ({ a, b }) => {
    return { result: a * b };
  });

  return {
    name: 'calculator',
    version: '1.0.0',
    deactivate() {
      logger.info('Calculator plugin deactivated');
    },
  };
}

module.exports = { activate };
```

```json
// package.json
{
  "name": "@ultra-dex/plugin-calculator",
  "version": "1.0.0",
  "description": "Simple calculator plugin",
  "main": "index.js",
  "ultra-dex": {
    "id": "calculator",
    "name": "Calculator",
    "version": "1.0.0",
    "author": "Ultra-Dex Team",
    "license": "MIT",
    "capabilities": ["math"],
    "entryPoint": "index.js",
    "permissions": []
  }
}
```

## Publishing

### CLI Publish

```bash
# Navigate to plugin directory
cd my-plugin

# Publish to registry
ultra-dex mcp publish

# With specific registry
ultra-dex mcp publish --registry https://registry.ultra-dex.ai
```

### Registry Requirements

- Valid `package.json` with `ultra-dex` section
- No security violations
- Test coverage > 80%
- Documentation complete

## Best Practices

1. **Minimal Permissions**: Only request permissions you need
2. **Error Handling**: Always handle errors gracefully
3. **Logging**: Use provided logger, not console
4. **Cleanup**: Implement `deactivate()` for cleanup
5. **Testing**: Write comprehensive tests
6. **Documentation**: Document all actions and config options

## Versioning

Follow semantic versioning:

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

## Support

- Documentation: https://docs.ultra-dex.ai/mcp
- Registry: https://registry.ultra-dex.ai
- Issues: https://github.com/ultra-dex/plugins/issues
