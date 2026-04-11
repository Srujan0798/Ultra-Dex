# Ultra-Dex Plugin Development Guide

> Build custom agents, tools, and workflows that extend Ultra-Dex's capabilities.

---

## Table of Contents

- [Plugin Structure](#plugin-structure)
- [Creating Your First Plugin](#creating-your-first-plugin)
- [Manifest Schema Reference](#manifest-schema-reference)
- [Agent Definition Guide](#agent-definition-guide)
- [Tool Definition Guide](#tool-definition-guide)
- [Lifecycle Hooks](#lifecycle-hooks)
- [Testing Plugins Locally](#testing-plugins-locally)

---

## Plugin Structure

An Ultra-Dex plugin is a TypeScript/JavaScript package that implements the `Plugin` interface. The standard directory layout:

```
my-plugin/
├── package.json          # Plugin metadata and dependencies
├── src/
│   ├── index.ts          # Plugin entry point (exports Plugin implementation)
│   ├── agent.json        # Agent definition (optional, for agent plugins)
│   ├── prompt.md         # System prompt for the agent (optional)
│   └── tools/            # Custom tool implementations (optional)
│       └── my-tool.ts
├── tests/
│   └── plugin.test.ts    # Plugin tests
└── README.md             # Plugin documentation
```

### Minimal Plugin

```
my-plugin/
├── package.json
└── src/
    └── index.ts
```

### Full Agent Plugin

```
code-reviewer/
├── package.json
├── src/
│   ├── index.ts          # Plugin implementation
│   ├── agent.json        # Agent metadata
│   └── prompt.md         # System prompt
└── tests/
    └── plugin.test.ts
```

---

## Creating Your First Plugin

### Step 1: Scaffold the Plugin

```bash
mkdir ultra-dex-hello-plugin
cd ultra-dex-hello-plugin
npm init -y
npm install typescript @types/node --save-dev
```

### Step 2: Create the Plugin Entry Point

Create `src/index.ts`:

```typescript
import { Plugin, PluginManifest, PluginContext, PluginHook } from '@ultra-dex/plugins';

export class HelloPlugin implements Plugin {
  manifest: PluginManifest = {
    name: 'hello-plugin',
    version: '1.0.0',
    description: 'A simple hello world plugin for Ultra-Dex',
    author: 'Your Name',
    hooks: ['pre-execute', 'post-execute'],
  };

  async initialize(ctx: PluginContext): Promise<void> {
    ctx.logger.info('HelloPlugin initialized');
  }

  async execute(hook: PluginHook, data: unknown): Promise<unknown> {
    switch (hook) {
      case 'pre-execute':
        this.log('Before task execution', data);
        return { injected: 'pre-execute-data' };
      case 'post-execute':
        this.log('After task execution', data);
        return { injected: 'post-execute-data' };
      default:
        return data;
    }
  }

  async destroy(): Promise<void> {
    console.log('HelloPlugin destroyed');
  }

  private log(hook: string, data: unknown): void {
    console.log(`[hello-plugin] Hook: ${hook}, Data:`, data);
  }
}
```

### Step 3: Register the Plugin

```typescript
import { pluginManager } from '@ultra-dex/plugins';
import { HelloPlugin } from './src/index';

const plugin = new HelloPlugin();
await pluginManager.register(plugin);

// Verify it's registered
console.log(pluginManager.list());
// [{ name: 'hello-plugin', version: '1.0.0', hooks: ['pre-execute', 'post-execute'] }]
```

### Step 4: Test It

```bash
npx tsx src/index.ts
```

---

## Manifest Schema Reference

The `PluginManifest` defines your plugin's metadata and capabilities:

```typescript
interface PluginManifest {
  /** Unique plugin identifier (lowercase, hyphenated) */
  name: string;

  /** Semantic version */
  version: string;

  /** Human-readable description */
  description: string;

  /** Author name or organization */
  author?: string;

  /** Lifecycle hooks this plugin subscribes to */
  hooks: PluginHook[];

  /** Other plugins this plugin depends on */
  dependencies?: string[];
}
```

### Available Hooks

| Hook | When It Fires | Data Passed | Use Case |
|---|---|---|---|
| `pre-execute` | Before a task executes | Task definition | Modify task input, inject context |
| `post-execute` | After a task completes | Task result | Log results, save artifacts |
| `pre-routing` | Before provider routing | Provider selection context | Override provider choice |
| `post-routing` | After provider is selected | Selected provider info | Log routing decisions |
| `pre-memory` | Before memory retrieval | Query parameters | Enrich query with context |
| `post-memory` | After memory retrieval | Retrieved memories | Filter or rank memories |
| `on-error` | When an error occurs | Error object | Custom error handling, alerts |
| `on-shutdown` | When Ultra-Dex shuts down | None | Cleanup, save state |

---

## Agent Definition Guide

Agent plugins define new agent roles that can be used with `ultra-dex run <agent>`.

### agent.json

```json
{
  "id": "code-reviewer",
  "name": "Code Reviewer",
  "role": "reviewer",
  "description": "Reviews code for bugs, security issues, and style violations",
  "capabilities": ["code-review", "security-audit", "style-check"],
  "version": "1.0.0",
  "promptFile": "./prompt.md",
  "tools": ["eslint-checker", "security-scanner"],
  "provider": "claude",
  "model": "claude-sonnet-4"
}
```

### prompt.md

```markdown
You are an expert code reviewer. Review the provided code for:

1. **Bugs** — Logic errors, null references, race conditions
2. **Security** — Injection vulnerabilities, exposed secrets, insecure defaults
3. **Style** — Consistency, readability, naming conventions

For each issue found, provide:
- Location (file:line)
- Severity (critical/high/medium/low)
- Description
- Suggested fix

Be concise. Only report actual issues.
```

---

## Tool Definition Guide

Tools extend what agents can do. They integrate with external services.

### Basic Tool

```typescript
export interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

export const jiraTool: ToolDef = {
  name: 'jira-create-issue',
  description: 'Create a Jira issue',
  inputSchema: {
    type: 'object',
    properties: {
      project: { type: 'string' },
      summary: { type: 'string' },
      description: { type: 'string' },
      issueType: { type: 'string', enum: ['Bug', 'Task', 'Story'] },
    },
    required: ['project', 'summary', 'issueType'],
  },
  handler: async (args) => {
    const response = await fetch(`${process.env.JIRA_URL}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${process.env.JIRA_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          project: { key: args.project },
          summary: args.summary,
          description: args.description,
          issuetype: { name: args.issueType },
        },
      }),
    });
    return response.json();
  },
};
```

### MCP Integration

Tools can be exposed as MCP (Model Context Protocol) tools for AI assistants:

```typescript
import { createUltraDexTools, MCPServer } from '@ultra-dex/mcp-server';

const mcpServer = new MCPServer({
  name: 'my-plugin',
  version: '1.0.0',
  tools: [jiraTool],
});

await mcpServer.start();
```

---

## Lifecycle Hooks

### Hook Context Object

Each hook receives a context object with the current execution state:

```typescript
interface HookContext {
  /** Current task being executed */
  task: {
    id: string;
    agent: string;
    input: string;
    provider?: string;
  };

  /** Plugin configuration */
  config: Record<string, unknown>;

  /** Logger for this plugin */
  logger: {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
  };

  /** Access to other registered plugins */
  pluginManager: PluginManager;

  /** Current execution metadata */
  metadata: {
    runId: string;
    startedAt: number;
    attempt: number;
  };
}
```

### Example: Pre-Execute Hook

```typescript
async execute(hook: PluginHook, data: unknown): Promise<unknown> {
  if (hook === 'pre-execute') {
    const ctx = data as HookContext;

    // Enforce a policy: all tasks must have a provider
    if (!ctx.task.provider) {
      ctx.logger.warn('No provider specified, defaulting to nvidia');
      return { ...ctx.task, provider: 'nvidia' };
    }

    return data;
  }
  return data;
}
```

### Example: On-Error Hook

```typescript
async execute(hook: PluginHook, data: unknown): Promise<unknown> {
  if (hook === 'on-error') {
    const error = data as Error;
    const ctx = (arguments[1] as HookContext);

    // Send alert to Slack
    await fetch(process.env.SLACK_WEBHOOK!, {
      method: 'POST',
      body: JSON.stringify({
        text: `Ultra-Dex Error: ${error.message}\nTask: ${ctx.task.id}`,
      }),
    });

    return data;
  }
  return data;
}
```

---

## Testing Plugins Locally

### Unit Tests

```typescript
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { pluginManager } from '@ultra-dex/plugins';
import { HelloPlugin } from '../src/index';

describe('HelloPlugin', () => {
  let plugin: HelloPlugin;

  before(async () => {
    plugin = new HelloPlugin();
    await pluginManager.register(plugin);
  });

  after(async () => {
    await pluginManager.unregister('hello-plugin');
  });

  it('should register successfully', () => {
    const registered = pluginManager.get('hello-plugin');
    assert.ok(registered);
  });

  it('should execute pre-execute hook', async () => {
    const results = await pluginManager.executeHook('pre-execute', { task: 'test' });
    assert.ok(results.length > 0);
  });

  it('should execute post-execute hook', async () => {
    const results = await pluginManager.executeHook('post-execute', { result: 'done' });
    assert.ok(results.length > 0);
  });

  it('should unregister cleanly', async () => {
    await pluginManager.unregister('hello-plugin');
    assert.strictEqual(pluginManager.get('hello-plugin'), undefined);
  });
});
```

### Integration Test with CLI

```bash
# Install plugin locally
cd my-plugin
npm link

# In your Ultra-Dex project
npm link my-plugin

# Run with plugin
ultra-dex run planner -t "test task"

# Verify plugin logs
ultra-dex doctor
```

---

## Publishing Your Plugin

1. Update `package.json` with `name`, `version`, `description`
2. Add `@ultra-dex/plugins` as a dependency
3. Publish to npm: `npm publish`
4. Users install with: `npm install your-plugin-name`

---

## Best Practices

1. **Keep plugins focused** — One responsibility per plugin
2. **Handle errors gracefully** — Never crash the host process
3. **Clean up on destroy** — Close connections, remove listeners
4. **Document your hooks** — List which lifecycle hooks you use
5. **Test with mock data** — Don't require real API keys for tests
6. **Version carefully** — Follow semver, document breaking changes
