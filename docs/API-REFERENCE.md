# Ultra-Dex API Reference

## Overview
This document provides comprehensive API reference for the Ultra-Dex framework, including command-line interfaces, programmatic APIs, and integration points.

## Table of Contents
1. [CLI Commands](#cli-commands)
2. [Programmatic API](#programmatic-api)
3. [MCP Server API](#mcp-server-api)
4. [WebSocket API](#websocket-api)
5. [Plugin System API](#plugin-system-api)
6. [Configuration API](#configuration-api)
7. [Error Handling](#error-handling)
8. [Environment Variables](#environment-variables)

## CLI Commands

### Core Commands

#### `ultra-dex init [options]`
Initializes a new Ultra-Dex project with the required structure.

**Usage:**
```bash
ultra-dex init [options]
```

**Options:**
- `-n, --name <name>`: Project name
- `-d, --dir <directory>`: Output directory (default: ".")
- `--preview`: Preview files without creating them
- `--live`: Generate a runnable scaffold with a specific stack
- `--stack <preset>`: Choose a preset stack (next15-prisma-clerk, remix-supabase, sveltekit-drizzle)

**Examples:**
```bash
# Interactive initialization
ultra-dex init

# Initialize with specific name
ultra-dex init --name "my-saas"

# Generate with specific stack
ultra-dex init --stack next15-prisma-clerk
```

#### `ultra-dex generate <idea> [options]`
Generates a full 34-section implementation plan from an idea using AI.

**Usage:**
```bash
ultra-dex generate <idea> [options]
```

**Arguments:**
- `idea`: Your project idea (quoted if multiple words)

**Options:**
- `-p, --provider <provider>`: AI provider (claude, openai, gemini, ollama)
- `-m, --model <model>`: Specific model to use
- `-o, --output <directory>`: Output directory (default: current directory)
- `-k, --key <apiKey>`: API key (or use environment variable)
- `--stream`: Stream output in real-time (default: true)
- `--no-stream`: Disable streaming
- `--dry-run`: Preview without calling AI

**Examples:**
```bash
# Generate plan for an idea
ultra-dex generate "A task management SaaS for remote teams"

# Use specific provider
ultra-dex generate "idea" --provider openai

# Use specific model
ultra-dex generate "idea" --model gpt-4-turbo
```

#### `ultra-dex build [options]`
Executes the next pending task from the implementation plan using AI agents.

**Usage:**
```bash
ultra-dex build [options]
```

**Options:**
- `-p, --provider <provider>`: AI provider
- `-k, --key <apiKey>`: API key
- `--dry-run`: Preview the task without executing
- `--agent <agent>`: Use specific agent (@backend, @frontend, etc.)

**Examples:**
```bash
# Build next task in plan
ultra-dex build

# Build with specific provider
ultra-dex build --provider claude
```

#### `ultra-dex run <agent> [options]`
Execute a specific AI agent with a custom task.

**Usage:**
```bash
ultra-dex run <agent> [options]
```

**Arguments:**
- `agent`: Agent name (backend, frontend, database, etc.)

**Options:**
- `-t, --task <task>`: Specific task to execute
- `-p, --provider <provider>`: AI provider
- `-k, --key <apiKey>`: API key
- `--stream`: Stream output in real-time

**Examples:**
```bash
# Run backend agent with task
ultra-dex run backend --task "Create user API endpoints"

# Run database agent
ultra-dex run database --task "Design user schema"
```

#### `ultra-dex swarm <task> [options]`
Run an autonomous agent pipeline with multiple agents.

**Usage:**
```bash
ultra-dex swarm <task> [options]
```

**Arguments:**
- `task`: Task description for the swarm

**Options:**
- `--dry-run`: Show pipeline without executing
- `--parallel`: Run implementation tier agents in parallel
- `-p, --provider <provider>`: AI provider

**Examples:**
```bash
# Run swarm for feature implementation
ultra-dex swarm "Implement user authentication"

# Run with parallel execution
ultra-dex swarm "Build dashboard" --parallel
```

#### `ultra-dex serve [options]`
Start the Active Kernel (MCP + WebSocket + Dashboard).

**Usage:**
```bash
ultra-dex serve [options]
```

**Options:**
- `-p, --port <port>`: Port to listen on (default: "3001")
- `--stdio`: Run in Stdio mode (MCP Standard Only) (default: false)

**Examples:**
```bash
# Start server
ultra-dex serve

# Start on different port
ultra-dex serve --port 4000
```

#### `ultra-dex validate [options]`
Validates project structure against Ultra-Dex standards.

**Usage:**
```bash
ultra-dex validate [options]
```

**Options:**
- `-d, --dir <directory>`: Project directory to validate (default: current directory)
- `--scan`: Run deep code quality scan
- `--json`: Output as JSON format

**Examples:**
```bash
# Validate current project
ultra-dex validate

# Validate specific directory
ultra-dex validate --dir /path/to/project

# Deep scan with quality checks
ultra-dex validate --scan
```

### Advanced Commands

#### `ultra-dex plugin [command]`
Manage Ultra-Dex plugins.

**Subcommands:**
- `list`: List installed plugins
- `install <source>`: Install a plugin from a local file
- `uninstall <name>`: Uninstall a plugin by name
- `info <name>`: Show information about a specific plugin

**Examples:**
```bash
# List installed plugins
ultra-dex plugin list

# Install a plugin
ultra-dex plugin install ./my-plugin.js

# Get plugin information
ultra-dex plugin info my-plugin
```

#### `ultra-dex review [options]`
Reviews code against the implementation plan using AI.

**Usage:**
```bash
ultra-dex review [options]
```

**Options:**
- `-d, --dir <directory>`: Directory to review (default: current directory)
- `-p, --provider <provider>`: AI provider (claude, openai, gemini)
- `-k, --key <apiKey>`: API key
- `--quick`: Quick review without AI (checks file structure only)
- `--json`: Output as JSON

**Examples:**
```bash
# Review current project
ultra-dex review

# Quick review (no AI)
ultra-dex review --quick

# Review specific directory
ultra-dex review --dir /path/to/project
```

#### `ultra-dex dashboard [options]`
Starts the local web dashboard for monitoring Ultra-Dex projects.

**Usage:**
```bash
ultra-dex dashboard [options]
```

**Options:**
- `-p, --port <port>`: Port to listen on (default: "3002")

**Examples:**
```bash
# Start dashboard
ultra-dex dashboard

# Start on different port
ultra-dex dashboard --port 4000
```

#### `ultra-dex align [options]`
Checks project alignment score against the implementation plan.

**Usage:**
```bash
ultra-dex align [options]
```

**Options:**
- `--strict`: Exit with error if score < 70
- `--json`: Output as JSON
- `-d, --dir <directory>`: Project directory (default: current directory)

**Examples:**
```bash
# Check alignment score
ultra-dex align

# Strict mode (fails if score < 70)
ultra-dex align --strict
```

## Programmatic API

### Graph Analysis API

#### CodeGraph Class
The CodeGraph class provides programmatic access to the project structure analysis.

```javascript
import { CodeGraph } from './cli/lib/mcp/graph.js';

const graph = new CodeGraph();
```

##### `constructor()`
Creates a new CodeGraph instance with empty nodes and edges.

##### `async scan(useCache = true)`
Scans the project and builds the code property graph.

**Parameters:**
- `useCache` (boolean): Whether to use cached results (default: true)

**Returns:** Promise resolving to graph summary object

**Example:**
```javascript
const summary = await graph.scan();
console.log(`Nodes: ${summary.nodeCount}, Edges: ${summary.edgeCount}`);
```

##### `async analyzeFile(filePath)`
Analyzes a single file and adds it to the graph.

**Parameters:**
- `filePath` (string): Path to the file to analyze

**Returns:** Promise resolving when analysis is complete

##### `getSummary()`
Gets a summary of the current graph.

**Returns:** Object with nodeCount, edgeCount, files, and dependencies

##### `findReferences(fileName)`
Finds all references to a specific file in the graph.

**Parameters:**
- `fileName` (string): Name of the file to find references for

**Returns:** Array of references

### State Management API

#### State Functions
The state management system provides project state persistence and management.

##### `async loadState()`
Loads the current project state.

**Returns:** Promise resolving to the state object or null if not found

**Example:**
```javascript
import { loadState } from './cli/lib/commands/state.js';

const state = await loadState();
if (state) {
  console.log(`Project: ${state.project.name}`);
}
```

##### `async saveState(state)`
Saves the project state.

**Parameters:**
- `state` (object): State object to save

**Returns:** Promise resolving to true if successful, false otherwise

##### `async updateState(updates)`
Updates specific parts of the state.

**Parameters:**
- `updates` (object): Updates to apply to the state

**Returns:** Promise resolving to true if successful, false otherwise

##### `async computeState()`
Computes the current state based on project files.

**Returns:** Promise resolving to the computed state object

##### `generateMarkdown(state)`
Generates markdown representation of the state.

**Parameters:**
- `state` (object): State object to convert to markdown

**Returns:** String containing the markdown representation

### Agent System API

#### Agent Execution
The agent system provides programmatic access to specialized AI assistants.

##### `async runAgentLoop(agentName, task, provider, context, depth = 0)`
Executes an agent task with potential delegation.

**Parameters:**
- `agentName` (string): Name of the agent to run
- `task` (string): Task for the agent to perform
- `provider` (object): AI provider instance
- `context` (object): Context for the agent
- `depth` (number): Delegation depth (for preventing infinite loops)

**Returns:** Promise resolving to the agent's response

**Example:**
```javascript
import { runAgentLoop } from './cli/lib/commands/run.js';
import { createProvider } from './cli/lib/providers/index.js';

const provider = createProvider('claude');
const result = await runAgentLoop('backend', 'Create user API', provider, context);
```

## MCP Server API

The Model Context Protocol (MCP) server provides AI integration capabilities.

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Dashboard UI |
| `/api/info` | GET | Active Kernel metadata and endpoint list |
| `/api/state` | GET | Machine-readable project state |
| `/api/plan` | GET | Implementation plan (markdown) |
| `/api/graph` | GET | Code Property Graph summary |
| `/api/swarm` | POST | Trigger a swarm run |
| `/stream` | WS | WebSocket event stream |
| `/events` | SSE | Dashboard events stream |

### MCP Tools API

The MCP server provides several tools for AI agents:

#### `read_code(filePath)`
Reads a file from the codebase.

**Parameters:**
- `filePath` (string): Path to the file relative to project root

**Returns:** Object with file content

#### `write_code(filePath, content, description)`
Writes or updates a file in the codebase.

**Parameters:**
- `filePath` (string): Path to the file relative to project root
- `content` (string): New content for the file
- `description` (string, optional): Description of the change for audit logs

**Returns:** Object with success status

#### `query_codebase(query, type)`
Searches the codebase structure and dependencies.

**Parameters:**
- `query` (string): Search term or file name
- `type` (enum): Type of search ('files', 'dependencies', 'reverse_deps')

**Returns:** Object with search results

#### `remember(text, tags, source)`
Saves a fact, decision, or piece of context to persistent memory.

**Parameters:**
- `text` (string): The fact or information to remember
- `tags` (array, optional): Tags to categorize the information
- `source` (string, optional): Source of the information (default: 'agent')

**Returns:** Object with success status

#### `recall(query, limit)`
Searches persistent memory for relevant past context.

**Parameters:**
- `query` (string): Search query to find relevant memories
- `limit` (number, optional): Maximum number of memories to return (default: 5)

**Returns:** Object with search results

#### `update_task_status(taskId, status)`
Updates the status of a task in the project plan.

**Parameters:**
- `taskId` (string): The ID of the task (e.g., '1.1', '2.3')
- `status` (enum): New status ('pending', 'in_progress', 'completed')

**Returns:** Object with success status

## WebSocket API

The WebSocket server provides real-time updates for the dashboard.

### Connection
Connect to `ws://localhost:3002` for real-time updates.

### Message Types

#### `state_update`
Sent when project state changes.

```json
{
  "type": "state_update",
  "data": { /* state object */ },
  "timestamp": "ISO string"
}
```

#### `log_message`
Sent when a log message is generated.

```json
{
  "type": "log_message",
  "level": "info|warn|error",
  "message": "log message",
  "timestamp": "ISO string"
}
```

#### `agent_status`
Sent when agent status changes.

```json
{
  "type": "agent_status",
  "agent": "agent name",
  "status": "idle|working|error",
  "activity": "current activity description",
  "timestamp": "ISO string"
}
```

## Plugin System API

### Plugin Structure
A plugin is a JavaScript module that exports the following:

```javascript
// Plugin metadata
export const name = 'my-plugin';
export const version = '1.0.0';
export const description = 'My awesome Ultra-Dex plugin';
export const author = 'Your Name';

/**
 * Activation function - called when the plugin is activated
 * @param {PluginManager} pluginManager - The plugin manager instance
 * @param {Command} cliProgram - The main CLI program instance
 */
export async function activate(pluginManager, cliProgram) {
  // Register new commands or modify existing functionality
  cliProgram
    .command('my-command')
    .description('My plugin command')
    .action(() => {
      console.log('Hello from my plugin!');
    });

  // Register hooks to modify Ultra-Dex behavior
  pluginManager.registerHook('project-init', 'Called when initializing a new project');
  pluginManager.attachToHook('project-init', name, async (context) => {
    console.log(`Plugin ${name} modifying project initialization for ${context.projectName}`);
    return context;
  });
}

// Export as default for ES module compatibility
export default {
  name,
  version,
  description,
  author,
  activate
};
```

### Plugin Manager API

#### `registerHook(hookName, description)`
Registers a new hook that plugins can attach to.

**Parameters:**
- `hookName` (string): Name of the hook
- `description` (string): Description of when the hook is called

#### `attachToHook(hookName, pluginName, callback)`
Attaches a function to a hook.

**Parameters:**
- `hookName` (string): Name of the hook to attach to
- `pluginName` (string): Name of the plugin
- `callback` (function): Function to execute when hook is triggered

#### `executeHook(hookName, ...args)`
Executes all functions attached to a hook.

**Parameters:**
- `hookName` (string): Name of the hook to execute
- `...args`: Arguments to pass to the hook functions

**Returns:** Promise resolving to the final result after all hooks execute

#### `async installPlugin(pluginSource, options)`
Installs a plugin from a local file.

**Parameters:**
- `pluginSource` (string): Path to the plugin file
- `options` (object): Installation options

**Returns:** Promise resolving to installation result

#### `async uninstallPlugin(pluginName)`
Uninstalls a plugin by name.

**Parameters:**
- `pluginName` (string): Name of the plugin to uninstall

**Returns:** Promise resolving to uninstallation result

#### `getInstalledPlugins()`
Gets a list of all installed plugins.

**Returns:** Array of plugin objects with name, version, description, and author

#### `getPlugin(name)`
Gets a specific plugin by name.

**Parameters:**
- `name` (string): Name of the plugin

**Returns:** Plugin object or null if not found

## Configuration API

### Configuration Management

#### `async load()`
Loads configuration from file.

**Returns:** Promise resolving to the configuration object

#### `async save(config)`
Saves configuration to file.

**Parameters:**
- `config` (object): Configuration object to save

**Returns:** Promise resolving to true if successful

#### `get(path, defaultValue)`
Gets a configuration value by path (dot notation).

**Parameters:**
- `path` (string): Dot notation path to the value
- `defaultValue` (any): Default value if path doesn't exist

**Returns:** Configuration value or default value

#### `set(path, value)`
Sets a configuration value by path (dot notation).

**Parameters:**
- `path` (string): Dot notation path to the value
- `value` (any): Value to set

#### `validate()`
Validates the current configuration.

**Returns:** Object with validation results

#### `reset()`
Resets configuration to defaults.

#### `getConfig()`
Gets the current configuration object.

**Returns:** Copy of the current configuration object

#### `update(updates)`
Updates multiple configuration values.

**Parameters:**
- `updates` (object): Updates to apply

## Error Handling

### Error Recovery System
Ultra-Dex implements comprehensive error handling with circuit breakers and fallback mechanisms.

#### `executeWithRecovery(serviceName, operation, options)`
Executes an operation with error recovery.

**Parameters:**
- `serviceName` (string): Name of the service
- `operation` (function): Operation to execute
- `options` (object): Recovery options

**Returns:** Promise resolving to the operation result

### Circuit Breaker Pattern
The system implements circuit breakers to prevent cascading failures:
- **Closed State**: Normal operation
- **Open State**: Requests blocked after failure threshold
- **Half-Open State**: Testing if service recovered

## Environment Variables

### Core Configuration
- `LOG_LEVEL`: Logging level (default: "info")
- `LOG_FILE`: Log file path (default: ".ultra-dex/logs/ultra-dex.log")
- `METRICS_ENABLED`: Enable metrics (default: true)
- `HEALTH_CHECK_INTERVAL`: Health check interval in ms (default: 30000)
- `MAX_LOG_SIZE`: Maximum log file size (default: "20m")
- `MAX_LOG_FILES`: Maximum number of log files (default: 5)

### AI Provider Configuration
- `ANTHROPIC_API_KEY`: Claude API key
- `OPENAI_API_KEY`: OpenAI API key
- `GOOGLE_AI_KEY`: Google Gemini API key

### Performance Configuration
- `CACHE_TIMEOUT`: Graph analysis cache timeout in ms (default: 30000)
- `CONCURRENCY_LIMIT`: File processing concurrency limit (default: 100)
- `MAX_FILE_SIZE`: Maximum file size for processing (default: 10485760)

### MCP Server Configuration
- `MCP_PORT`: MCP server port (default: 3001)
- `MCP_HOST`: MCP server host (default: "localhost")
- `MCP_TIMEOUT`: MCP connection timeout in ms (default: 30000)
- `MCP_CONNECTION_RETRY`: MCP connection retry attempts (default: 3)

## Versioning

Ultra-Dex follows semantic versioning (SemVer):
- MAJOR.MINOR.PATCH (e.g., 3.4.5)
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes (backward compatible)

## Migration Guide

When upgrading Ultra-Dex versions:
1. Check the CHANGELOG.md for breaking changes
2. Update your API usage if needed
3. Test your plugins with the new version
4. Verify all commands work as expected

## Support

For API support:
- Check the documentation in the root directory
- Open an issue on GitHub with detailed information
- Include your Ultra-Dex version, Node.js version, and OS
- Provide the exact command that failed and the full error message
- Share what you were trying to accomplish

## Merged From APIDOC.md

# Ultra-Dex API & CLI Reference (v3.4.5)

> **The Headless CTO for your SaaS.**
> Comprehensive documentation for all 50+ commands available in the Ultra-Dex CLI.

## 📚 Table of Contents

1. [Core Workflow](#core-workflow)
2. [AI Agents & Swarms](#ai-agents--swarms)
3. [Project Management](#project-management)
4. [Quality & Verification](#quality--verification)
5. [Monitoring & Health](#monitoring--health)
6. [Advanced Features](#advanced-features)
7. [System & Configuration](#system--configuration)

## 🚀 Core Workflow

Essential commands for starting and building projects.

### `init`
Initialize a new Ultra-Dex project.
```bash
npx ultra-dex init [name]
# Options:
#   --live      Use a live scaffold template (Next.js/Remix)
#   --preview   Preview changes without writing
```

### `generate`
Generate a comprehensive implementation plan from a simple idea.
```bash
npx ultra-dex generate "A marketplace for dog sitters"
# Options:
#   --provider  AI provider (claude, openai, gemini)
#   --dry-run   Estimate cost without generating
```

### `build`
Interactive AI-assisted development mode. Auto-loads project context.
```bash
npx ultra-dex build
# Options:
#   --cursor    Open generated prompt in Cursor
#   --copy      Copy prompt to clipboard
```

### `review`
AI-powered code review and architectural analysis.
```bash
npx ultra-dex review
# Options:
#   --quick     Fast structure check
#   --json      Output as JSON
```

### `serve`
Start the Unified Active Kernel (MCP Server + Dashboard + Real-time Stream).
```bash
npx ultra-dex serve
# Options:
#   --port      Port to listen on (default: 3001)
```

## 🤖 AI Agents & Swarms

Orchestrate AI workers to perform complex tasks.

### `agents`
List available AI agents and their capabilities.
```bash
npx ultra-dex agents
```

### `run`
Execute a specific agent on a task.
```bash
npx ultra-dex run <agent> --task "Build login form"
# Example: npx ultra-dex run backend --task "Create auth API"
```

### `swarm`
Run an autonomous multi-agent pipeline (Planner → CTO → Builders).
```bash
npx ultra-dex swarm "Implement Stripe payments"
# Options:
#   --parallel  Run implementation agents concurrently
#   --dry-run   Preview the plan without executing
```

### `autonomous` (New in v3.4.5)
Self-healing mode that detects errors and auto-fixes them.
```bash
npx ultra-dex autonomous
# Options:
#   --watch     Continuously monitor and heal
#   --fix       Auto-apply fixes
```

### `suggest`
Get AI context-aware suggestions for your next task.
```bash
npx ultra-dex suggest
```

### `voice` (New in v3.5.0)
Voice-to-Plan: Convert speech to implementation plans.
```bash
npx ultra-dex voice "Build a SaaS dashboard"
# Options:
#   --provider  Speech-to-text provider (default: whisper)
#   --no-plan   Only transcribe, do not generate plan
```

## 📋 Project Management

Manage plans, workflows, and workspaces.

### `plan`
Visualize and manage your project timeline.
```bash
npx ultra-dex plan
# Options:
#   --gantt     Show ASCII Gantt chart
#   --timeline  Show milestone timeline
#   --generate  Regenerate markdown plan
#   --estimate  Show realistic effort estimates based on methodology
```

### `sync`
Synchronize project state across agents and tools.
```bash
npx ultra-dex sync
# Options:
#   --brain     Autonomous memory synchronization
```

### `workflow`
Visualize and start predefined implementation workflows.
```bash
npx ultra-dex workflow <name>
# Options:
#   --viz       Visualize the workflow graph
#   --start     Add workflow steps to your plan
```

## 🛡️ Quality & Verification

// ...

### `search`
Semantic search across your codebase using embeddings.
```bash
npx ultra-dex search "auth middleware"
# Options:
#   --index     Rebuild the search index
#   --symbol    Search for symbol definitions
#   --impact    Analyze the impact of changing a file
```

## ⚙️ System & Configuration

// ...

### `pipeline` (New in v3.5.0)
Run a multi-agent, multi-command pipeline from a JSON file.
```bash
npx ultra-dex pipeline ./release.json
# Options:
#   --dry-run   Show steps without executing
```

### `batch`
// ...
Visualize and start predefined implementation workflows.
```bash
npx ultra-dex workflow <name>
# Options:
#   --viz       Visualize the workflow graph
#   --start     Add workflow steps to your plan
```

### `workspace` (New in v3.4.5)
Manage multiple projects from a global registry.
```bash
npx ultra-dex workspace list
npx ultra-dex workspace add .
```

### `status`
Show high-level project status and alignment score.
```bash
npx ultra-dex status
```

## 🛡️ Quality & Verification

Ensure your code meets production standards.

### `audit`
Deep project audit for security, quality, and documentation.
```bash
npx ultra-dex audit
# Options:
#   --report    Generate JSON report
```

### `verify`
Run the 21-Step Verification Framework.
```bash
npx ultra-dex verify
```

### `validate`
Check project structure and file integrity.
```bash
npx ultra-dex validate
# Options:
#   --scan      Deep code quality scan
```

### `exec`
Run code safely in a Docker sandbox.
```bash
npx ultra-dex exec script.js
# Options:
#   --safe      Block dangerous patterns
#   --network   Allow network access
```

### `pre-commit`
Run quality checks before git commit.
```bash
npx ultra-dex pre-commit
```

## 📊 Monitoring & Health

Real-time system observability.

### `metrics`
Show system performance metrics.
```bash
npx ultra-dex metrics
# Options:
#   --watch     Real-time dashboard
#   --export    Export to JSON/CSV
```

### `dashboard`
Launch the web-based "God Mode" dashboard.
```bash
npx ultra-dex dashboard
```

### `doctor`
Diagnose system issues and configuration.
```bash
npx ultra-dex doctor
```

### `health`
Check service health status.
```bash
npx ultra-dex health
```

## ⚙️ System & Configuration

Configure the Ultra-Dex environment.

### `config`
Manage CLI configuration.
```bash
npx ultra-dex config
# Options:
#   --mcp       Generate Claude Desktop config
#   --set       Set config value
```

### `plugin`
Manage Ultra-Dex plugins.
```bash
npx ultra-dex plugin list
npx ultra-dex plugin install <path>
```

### `upgrade`
Update Ultra-Dex to the latest version.
```bash
npx ultra-dex upgrade
```

### `batch`
Execute a sequence of commands from a file.
```bash
npx ultra-dex batch ./commands.txt
```

## 🔗 Integrations

### `github`
GitHub integration for issues and PRs.
```bash
npx ultra-dex github
```

### `cloud`
Connect to Ultra-Dex Cloud features.
```bash
npx ultra-dex cloud
```

*Generated for Ultra-Dex v3.4.5*