# Ultra-Dex Plugin Examples

> Complete, working plugin examples you can use as starting points.

---

## Table of Contents

- [Example 1: Code Review Bot (Agent Plugin)](#example-1-code-review-bot-agent-plugin)
- [Example 2: Jira Integration (Tool Plugin)](#example-2-jira-integration-tool-plugin)
- [Example 3: Full-Stack Dev Team (Multi-Agent Plugin)](#example-3-full-stack-dev-team-multi-agent-plugin)

---

## Example 1: Code Review Bot (Agent Plugin)

A plugin that adds a `code-reviewer` agent to Ultra-Dex. The agent reviews code for bugs, security issues, and style violations.

### Directory Structure

```
code-reviewer-plugin/
├── package.json
├── src/
│   ├── index.ts
│   ├── agent.json
│   └── prompt.md
└── tests/
    └── plugin.test.ts
```

### package.json

```json
{
  "name": "@ultra-dex/plugin-code-reviewer",
  "version": "1.0.0",
  "description": "Code review agent plugin for Ultra-Dex",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "node --test tests/*.test.ts"
  },
  "dependencies": {
    "@ultra-dex/plugins": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

### src/agent.json

```json
{
  "id": "code-reviewer",
  "name": "Code Reviewer",
  "role": "reviewer",
  "description": "Reviews code for bugs, security issues, and style violations",
  "capabilities": ["code-review", "security-audit", "style-check"],
  "version": "1.0.0",
  "promptFile": "./prompt.md",
  "provider": "claude",
  "model": "claude-sonnet-4"
}
```

### src/prompt.md

```markdown
You are an expert code reviewer with deep knowledge of TypeScript, security best practices, and software architecture.

Review the provided code for:

1. **Bugs** — Logic errors, null references, race conditions, off-by-one errors
2. **Security** — Injection vulnerabilities, exposed secrets, insecure defaults, XSS
3. **Style** — Consistency, readability, naming conventions, DRY violations

For each issue found, provide:
- **Location**: file:line
- **Severity**: critical | high | medium | low
- **Description**: What's wrong and why it matters
- **Suggested Fix**: Concrete code change

Be concise. Only report actual issues. If the code looks good, say so.
```

### src/index.ts

```typescript
import { Plugin, PluginManifest, PluginContext, PluginHook } from '@ultra-dex/plugins';
import agentDef from './agent.json';

export class CodeReviewerPlugin implements Plugin {
  manifest: PluginManifest = {
    name: 'code-reviewer',
    version: '1.0.0',
    description: 'Automated code review agent',
    hooks: ['pre-execute', 'post-execute'],
  };

  async initialize(ctx: PluginContext): Promise<void> {
    ctx.logger.info(`CodeReviewerPlugin initialized (agent: ${agentDef.id})`);
  }

  async execute(hook: PluginHook, data: unknown): Promise<unknown> {
    if (hook === 'pre-execute') {
      const ctx = data as any;
      if (ctx.task?.agent === 'code-reviewer') {
        ctx.logger.info('Code review task starting');
      }
    }

    if (hook === 'post-execute') {
      const ctx = data as any;
      if (ctx.task?.agent === 'code-reviewer') {
        ctx.logger.info('Code review task completed');
      }
    }

    return data;
  }

  async destroy(): Promise<void> {
    // No cleanup needed
  }
}
```

### Usage

```typescript
import { pluginManager } from '@ultra-dex/plugins';
import { CodeReviewerPlugin } from '@ultra-dex/plugin-code-reviewer';

await pluginManager.register(new CodeReviewerPlugin());

// Now you can run:
// ultra-dex run code-reviewer -t "Review src/auth.ts"
```

---

## Example 2: Jira Integration (Tool Plugin)

A plugin that adds Jira tools so agents can create and update issues.

### Directory Structure

```
jira-plugin/
├── package.json
├── src/
│   ├── index.ts
│   └── tools/
│       ├── create-issue.ts
│       └── update-issue.ts
└── tests/
    └── plugin.test.ts
```

### src/tools/create-issue.ts

```typescript
import type { ToolDef } from '@ultra-dex/plugins';

export const createIssueTool: ToolDef = {
  name: 'jira-create-issue',
  description: 'Create a new Jira issue',
  inputSchema: {
    type: 'object',
    properties: {
      project: { type: 'string', description: 'Jira project key (e.g., "PROJ")' },
      summary: { type: 'string', description: 'Issue summary/title' },
      description: { type: 'string', description: 'Issue description in markdown' },
      issueType: { type: 'string', description: 'Issue type', enum: ['Bug', 'Task', 'Story', 'Epic'] },
      priority: { type: 'string', description: 'Priority', enum: ['Highest', 'High', 'Medium', 'Low', 'Lowest'] },
      labels: { type: 'array', items: { type: 'string' }, description: 'Labels to apply' },
    },
    required: ['project', 'summary', 'issueType'],
  },
  handler: async (args) => {
    const { project, summary, description, issueType, priority, labels } = args;

    const response = await fetch(`${process.env.JIRA_URL}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          project: { key: project },
          summary,
          description: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: description || '' }] }] },
          issuetype: { name: issueType },
          priority: priority ? { name: priority } : undefined,
          labels: labels || [],
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },
};
```

### src/tools/update-issue.ts

```typescript
import type { ToolDef } from '@ultra-dex/plugins';

export const updateIssueTool: ToolDef = {
  name: 'jira-update-issue',
  description: 'Update an existing Jira issue',
  inputSchema: {
    type: 'object',
    properties: {
      issueKey: { type: 'string', description: 'Jira issue key (e.g., "PROJ-123")' },
      summary: { type: 'string', description: 'New summary' },
      description: { type: 'string', description: 'New description' },
      status: { type: 'string', description: 'New status', enum: ['To Do', 'In Progress', 'Done'] },
    },
    required: ['issueKey'],
  },
  handler: async (args) => {
    const { issueKey, summary, description, status } = args;
    const fields: Record<string, unknown> = {};

    if (summary) fields.summary = summary;
    if (description) fields.description = description;

    const response = await fetch(`${process.env.JIRA_URL}/rest/api/3/issue/${issueKey}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });

    if (!response.ok) {
      throw new Error(`Jira API error: ${response.status}`);
    }

    // Transition if status change requested
    if (status) {
      const transitions = await fetch(`${process.env.JIRA_URL}/rest/api/3/issue/${issueKey}/transitions`, {
        headers: { 'Authorization': `Basic ${Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_TOKEN}`).toString('base64')}` },
      });
      const { transitions: available } = await transitions.json();
      const transition = available.find((t: any) => t.name === status);
      if (transition) {
        await fetch(`${process.env.JIRA_URL}/rest/api/3/issue/${issueKey}/transitions`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_TOKEN}`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ transition: { id: transition.id } }),
        });
      }
    }

    return { issueKey, updated: true };
  },
};
```

### src/index.ts

```typescript
import { Plugin, PluginManifest, PluginContext, PluginHook } from '@ultra-dex/plugins';
import { createIssueTool } from './tools/create-issue';
import { updateIssueTool } from './tools/update-issue';

export class JiraPlugin implements Plugin {
  manifest: PluginManifest = {
    name: 'jira-integration',
    version: '1.0.0',
    description: 'Jira integration for Ultra-Dex agents',
    hooks: ['pre-execute'],
  };

  async initialize(ctx: PluginContext): Promise<void> {
    if (!process.env.JIRA_URL || !process.env.JIRA_TOKEN) {
      ctx.logger.warn('JIRA_URL and JIRA_TOKEN environment variables are required');
    } else {
      ctx.logger.info('JiraPlugin initialized with tools: create-issue, update-issue');
    }
  }

  async execute(hook: PluginHook, data: unknown): Promise<unknown> {
    // Inject tools into task context
    if (hook === 'pre-execute') {
      const ctx = data as any;
      ctx.tools = ctx.tools || [];
      ctx.tools.push(createIssueTool, updateIssueTool);
    }
    return data;
  }

  async destroy(): Promise<void> {
    // No cleanup needed
  }
}
```

### Usage

```bash
# Set environment variables
export JIRA_URL=https://your-company.atlassian.net
export JIRA_EMAIL=your-email@company.com
export JIRA_TOKEN=your-api-token

# Run with the plugin
ultra-dex run planner -t "Create a Jira ticket for the auth bug in PROJ"
```

---

## Example 3: Full-Stack Dev Team (Multi-Agent Plugin)

A plugin that registers a complete dev team of agents that can work together on features.

### Directory Structure

```
fullstack-team-plugin/
├── package.json
├── src/
│   ├── index.ts
│   ├── agents/
│   │   ├── architect.json
│   │   ├── backend.json
│   │   ├── frontend.json
│   │   └── qa.json
│   └── prompts/
│       ├── architect.md
│       ├── backend.md
│       ├── frontend.md
│       └── qa.md
└── tests/
    └── plugin.test.ts
```

### src/index.ts

```typescript
import { Plugin, PluginManifest, PluginContext, PluginHook } from '@ultra-dex/plugins';
import architectDef from './agents/architect.json';
import backendDef from './agents/backend.json';
import frontendDef from './agents/frontend.json';
import qaDef from './agents/qa.json';

const AGENTS = [architectDef, backendDef, frontendDef, qaDef];

export class FullStackTeamPlugin implements Plugin {
  manifest: PluginManifest = {
    name: 'fullstack-team',
    version: '1.0.0',
    description: 'A complete dev team: architect, backend, frontend, and QA agents',
    hooks: ['pre-execute', 'post-execute', 'on-error'],
  };

  private taskLog: Array<{ agent: string; status: string; timestamp: number }> = [];

  async initialize(ctx: PluginContext): Promise<void> {
    ctx.logger.info(`FullStackTeamPlugin initialized with ${AGENTS.length} agents:`);
    for (const agent of AGENTS) {
      ctx.logger.info(`  - ${agent.id} (${agent.role})`);
    }
  }

  async execute(hook: PluginHook, data: unknown): Promise<unknown> {
    const ctx = data as any;

    if (hook === 'pre-execute') {
      const agentName = ctx.task?.agent;
      if (AGENTS.some(a => a.id === agentName)) {
        this.taskLog.push({ agent: agentName, status: 'started', timestamp: Date.now() });
        ctx.logger.info(`Agent "${agentName}" starting task`);
      }
    }

    if (hook === 'post-execute') {
      const agentName = ctx.task?.agent;
      if (AGENTS.some(a => a.id === agentName)) {
        this.taskLog.push({ agent: agentName, status: 'completed', timestamp: Date.now() });
        ctx.logger.info(`Agent "${agentName}" completed task`);
      }
    }

    if (hook === 'on-error') {
      const agentName = ctx.task?.agent;
      if (AGENTS.some(a => a.id === agentName)) {
        this.taskLog.push({ agent: agentName, status: 'failed', timestamp: Date.now() });
        ctx.logger.error(`Agent "${agentName}" failed: ${(data as Error).message}`);
      }
    }

    return data;
  }

  async destroy(): Promise<void> {
    // Save task log
    console.log(`FullStackTeamPlugin: ${this.taskLog.length} tasks logged`);
    this.taskLog = [];
  }

  /**
   * Get the list of agents this plugin provides.
   */
  getAgents() {
    return AGENTS;
  }

  /**
   * Get the task log.
   */
  getTaskLog() {
    return [...this.taskLog];
  }
}
```

### src/agents/architect.json

```json
{
  "id": "architect",
  "name": "Software Architect",
  "role": "architect",
  "description": "Designs system architecture, API contracts, and database schemas",
  "capabilities": ["system-design", "api-design", "database-design", "tech-stack-selection"],
  "version": "1.0.0",
  "promptFile": "../prompts/architect.md",
  "provider": "claude",
  "model": "claude-opus-4"
}
```

### src/agents/backend.json

```json
{
  "id": "backend",
  "name": "Backend Developer",
  "role": "backend",
  "description": "Implements server-side logic, APIs, and database operations",
  "capabilities": ["api-implementation", "database-queries", "authentication", "testing"],
  "version": "1.0.0",
  "promptFile": "../prompts/backend.md",
  "provider": "claude",
  "model": "claude-sonnet-4"
}
```

### src/agents/frontend.json

```json
{
  "id": "frontend",
  "name": "Frontend Developer",
  "role": "frontend",
  "description": "Builds UI components, pages, and client-side logic",
  "capabilities": ["react", "typescript", "css", "state-management", "testing"],
  "version": "1.0.0",
  "promptFile": "../prompts/frontend.md",
  "provider": "claude",
  "model": "claude-sonnet-4"
}
```

### src/agents/qa.json

```json
{
  "id": "qa",
  "name": "QA Engineer",
  "role": "qa",
  "description": "Writes tests, finds edge cases, and validates implementations",
  "capabilities": ["unit-testing", "integration-testing", "e2e-testing", "edge-case-analysis"],
  "version": "1.0.0",
  "promptFile": "../prompts/qa.md",
  "provider": "claude",
  "model": "claude-sonnet-4"
}
```

### Usage

```bash
# Run the full team as a swarm
ultra-dex swarm "Build a user authentication system with login, registration, and password reset"

# Or run individual agents
ultra-dex run architect -t "Design a microservices architecture for an e-commerce platform"
ultra-dex run backend -t "Implement the user registration API with Express and PostgreSQL"
ultra-dex run frontend -t "Build a login form with React and form validation"
ultra-dex run qa -t "Write comprehensive tests for the authentication module"
```

---

## Running All Examples

```bash
# Clone the Ultra-Dex repo
git clone https://github.com/Srujan0798/Ultra-Dex.git
cd Ultra-Dex

# Install dependencies
npm install

# Build the plugin system
npm run build

# Run plugin tests
npm test -- tests/core/plugins*.test.js
```
