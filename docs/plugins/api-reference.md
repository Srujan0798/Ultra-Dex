# Ultra-Dex Plugin API Reference

> Complete API reference for building Ultra-Dex plugins.

---

## Table of Contents

- [PluginManifest](#pluginmanifest)
- [PluginHook](#pluginhook)
- [PluginContext](#plugincontext)
- [Plugin](#plugin)
- [PluginManager](#pluginmanager)
- [AgentDef](#agentdef)
- [ToolDef](#tooldef)
- [Lifecycle Hook Context](#lifecycle-hook-context)

---

## PluginManifest

Defines the metadata and capabilities of a plugin.

```typescript
interface PluginManifest {
  /** Unique plugin name (lowercase, hyphenated) */
  name: string;

  /** Semantic version string (e.g., "1.0.0") */
  version: string;

  /** Human-readable description of the plugin */
  description: string;

  /** Author name or organization */
  author?: string;

  /** Array of lifecycle hooks this plugin subscribes to */
  hooks: PluginHook[];

  /** Names of plugins this plugin depends on (must be registered first) */
  dependencies?: string[];
}
```

### Example

```typescript
const manifest: PluginManifest = {
  name: 'code-reviewer',
  version: '2.1.0',
  description: 'Automated code review with security scanning',
  author: 'Acme Corp',
  hooks: ['pre-execute', 'post-execute', 'on-error'],
  dependencies: ['eslint-plugin'],
};
```

---

## PluginHook

Union type of all available lifecycle hooks.

```typescript
type PluginHook =
  | 'pre-execute'    // Before task execution
  | 'post-execute'   // After task completion
  | 'pre-routing'    // Before provider routing
  | 'post-routing'   // After provider selection
  | 'pre-memory'     // Before memory retrieval
  | 'post-memory'    // After memory retrieval
  | 'on-error'       // When an error occurs
  | 'on-shutdown';   // When Ultra-Dex shuts down
```

### Hook Execution Order

```
Task Start
  ↓
pre-routing    → Plugin can modify provider selection
  ↓
post-routing   → Plugin receives selected provider info
  ↓
pre-memory     → Plugin can enrich memory query
  ↓
post-memory    → Plugin receives retrieved memories
  ↓
pre-execute    → Plugin can modify task input
  ↓
[Task Execution]
  ↓
post-execute   → Plugin receives task result
  ↓
(on-error if failed)
```

---

## PluginContext

The context object passed to `initialize()`.

```typescript
interface PluginContext {
  /** Plugin-specific configuration from user settings */
  config: Record<string, unknown>;

  /** Structured logger for this plugin */
  logger: {
    info: (msg: string, ...args: unknown[]) => void;
    warn: (msg: string, ...args: unknown[]) => void;
    error: (msg: string, ...args: unknown[]) => void;
  };
}
```

### Usage

```typescript
async initialize(ctx: PluginContext): Promise<void> {
  const apiKey = ctx.config.apiKey as string;
  if (!apiKey) {
    ctx.logger.warn('No API key configured, some features disabled');
  }
  ctx.logger.info('Plugin initialized with config', ctx.config);
}
```

---

## Plugin

The core interface that all plugins must implement.

```typescript
interface Plugin {
  /** Plugin manifest declaring metadata and hooks */
  manifest: PluginManifest;

  /**
   * Called when the plugin is registered.
   * Use for initialization, connection setup, validation.
   */
  initialize(ctx: PluginContext): Promise<void>;

  /**
   * Called when a subscribed lifecycle hook fires.
   * @param hook - The hook that fired
   * @param data - Context data for the hook
   * @returns Modified data or side-effect result
   */
  execute(hook: PluginHook, data: unknown): Promise<unknown>;

  /**
   * Called when the plugin is unregistered or Ultra-Dex shuts down.
   * Clean up connections, timers, file handles, etc.
   */
  destroy(): Promise<void>;
}
```

---

## PluginManager

The runtime that manages plugin registration, hook dispatch, and lifecycle.

### `register(plugin: Plugin): Promise<void>`

Register a plugin. Validates the manifest, checks dependencies, calls `initialize()`.

```typescript
import { pluginManager } from '@ultra-dex/plugins';
import { MyPlugin } from './my-plugin';

await pluginManager.register(new MyPlugin());
```

**Throws:**
- `Error` if plugin name is already registered
- `Error` if a dependency is not yet registered

### `unregister(name: string): Promise<void>`

Unregister a plugin. Calls `destroy()` and removes from all hook registries.

```typescript
await pluginManager.unregister('my-plugin');
```

### `executeHook(hook: PluginHook, data: unknown): Promise<unknown[]>`

Execute all plugins subscribed to a hook. Returns an array of results. Errors are caught and logged.

```typescript
const results = await pluginManager.executeHook('pre-execute', {
  task: { agent: 'planner', input: 'hello' },
});
```

### `get(name: string): Plugin | undefined`

Get a registered plugin by name.

```typescript
const plugin = pluginManager.get('my-plugin');
```

### `list(): Array<{ name: string; version: string; hooks: PluginHook[] }>`

List all registered plugins with their metadata.

```typescript
const plugins = pluginManager.list();
// [
//   { name: 'plugin-a', version: '1.0.0', hooks: ['pre-execute'] },
//   { name: 'plugin-b', version: '2.0.0', hooks: ['post-execute', 'on-error'] },
// ]
```

### `destroyAll(): Promise<void>`

Destroy all registered plugins. Called automatically on shutdown.

```typescript
await pluginManager.destroyAll();
```

---

## AgentDef

Defines an agent that can be used in task execution.

```typescript
interface AgentDef {
  /** Unique agent identifier */
  id: string;

  /** Human-readable name */
  name: string;

  /** Agent role (e.g., "planner", "reviewer", "backend") */
  role: string;

  /** Description of the agent's capabilities */
  description: string;

  /** List of capability tags */
  capabilities: string[];

  /** Agent version */
  version: string;

  /** Path to the system prompt file */
  promptFile?: string;

  /** List of tool names this agent can use */
  tools?: string[];

  /** Default provider for this agent */
  provider?: string;

  /** Default model for this agent */
  model?: string;
}
```

### Example

```json
{
  "id": "security-auditor",
  "name": "Security Auditor",
  "role": "reviewer",
  "description": "Audits code for security vulnerabilities",
  "capabilities": ["security-audit", "vulnerability-scan", "compliance-check"],
  "version": "1.0.0",
  "promptFile": "./prompt.md",
  "tools": ["semgrep", "trivy"],
  "provider": "claude",
  "model": "claude-sonnet-4"
}
```

---

## ToolDef

Defines a tool that agents can invoke.

```typescript
interface ToolDef {
  /** Unique tool name (lowercase, hyphenated) */
  name: string;

  /** Human-readable description of what the tool does */
  description: string;

  /** JSON Schema for the tool's input parameters */
  inputSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
      required?: boolean;
    }>;
    required?: string[];
  };

  /** Tool implementation */
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}
```

### Example

```typescript
const githubTool: ToolDef = {
  name: 'github-create-pr',
  description: 'Create a GitHub Pull Request',
  inputSchema: {
    type: 'object',
    properties: {
      repo: { type: 'string', description: 'Repository in owner/repo format' },
      title: { type: 'string', description: 'PR title' },
      body: { type: 'string', description: 'PR description' },
      base: { type: 'string', description: 'Base branch' },
      head: { type: 'string', description: 'Head branch' },
    },
    required: ['repo', 'title', 'base', 'head'],
  },
  handler: async (args) => {
    const { repo, title, body, base, head } = args;
    const response = await fetch(`https://api.github.com/repos/${repo}/pulls`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({ title, body, base, head }),
    });
    return response.json();
  },
};
```

---

## Lifecycle Hook Context

The data object passed to each hook's `execute()` method.

### Pre-Execute / Post-Execute

```typescript
interface ExecuteHookContext {
  task: {
    id: string;
    agent: string;
    input: string;
    provider?: string;
    model?: string;
  };
  config: Record<string, unknown>;
  logger: PluginContext['logger'];
  metadata: {
    runId: string;
    startedAt: number;
    attempt: number;
  };
}
```

### Pre-Routing / Post-Routing

```typescript
interface RoutingHookContext {
  task: ExecuteHookContext['task'];
  availableProviders: string[];
  selectedProvider?: string;  // post-routing only
  strategy: string;           // e.g., "bandit", "manual", "cheapest"
  config: Record<string, unknown>;
  logger: PluginContext['logger'];
}
```

### Pre-Memory / Post-Memory

```typescript
interface MemoryHookContext {
  query: string;
  retrievedMemories?: unknown[];  // post-memory only
  memoryBackend: 'redis' | 'file';
  config: Record<string, unknown>;
  logger: PluginContext['logger'];
}
```

### On-Error

```typescript
interface ErrorHookContext {
  error: Error;
  task: ExecuteHookContext['task'];
  stack: string;
  config: Record<string, unknown>;
  logger: PluginContext['logger'];
}
```

---

## Import Paths

```typescript
// Core plugin API
import {
  Plugin,
  PluginManifest,
  PluginHook,
  PluginContext,
  PluginManager,
  pluginManager,
} from '@ultra-dex/plugins';

// Agent and tool types
import type { AgentDef, ToolDef } from '@ultra-dex/plugins';

// MCP server (for tool exposure)
import { MCPServer, createUltraDexTools } from '@ultra-dex/mcp-server';
```
