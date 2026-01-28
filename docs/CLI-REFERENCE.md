# Ultra-Dex CLI Reference

This document provides a comprehensive reference for the Ultra-Dex Command Line Interface (CLI).

## Global Options

| Option | Description |
|--------|-------------|
| `-v, --version` | Output the current version |
| `-h, --help` | Display help for command |

---

## Core Commands

### `init`
Initialize a new Ultra-Dex project.

```bash
npx ultra-dex init [options]
```

**Options:**
- `--live`: Generate a runnable scaffold (Next.js, Remix, etc.)
- `--stack <stack>`: Stack to use with `--live` (e.g., `next15-prisma-clerk`)
- `--preview`: Preview files without creating them

**Example:**
```bash
npx ultra-dex init --live --stack next15-prisma-clerk
```

### `generate`
Generate a comprehensive implementation plan from a simple idea.

```bash
npx ultra-dex generate <idea> [options]
```

**Options:**
- `--provider <provider>`: AI provider (`claude`, `openai`, `gemini`)
- `--dry-run`: Estimate cost without generating
- `--stream`: Stream output (default: true)

**Example:**
```bash
npx ultra-dex generate "A marketplace for vintage cameras" --provider claude
```

### `build`
Interactive AI-assisted development mode.

```bash
npx ultra-dex build [options]
```

**Options:**
- `--agent <agent>`: Pre-select an agent
- `--task <task>`: specific task for the agent
- `--copy`: Copy prompt to clipboard
- `--cursor`: Open prompt in Cursor

**Example:**
```bash
npx ultra-dex build --agent backend --task "Create user profile API"
```

### `run`
Execute an agent task autonomously.

```bash
npx ultra-dex run <agent> [options]
```

**Options:**
- `--task <task>`: Task description
- `--provider <provider>`: AI provider
- `--output <file>`: Save output to file
- `--chain <agents>`: Chain multiple agents (comma-separated)

**Example:**
```bash
npx ultra-dex run planner --task "Design auth flow"
```

### `swarm`
Run a multi-agent swarm for a full feature.

```bash
npx ultra-dex swarm <feature> [options]
```

**Options:**
- `--plan-only`: Generate plan but don't execute
- `--provider <provider>`: AI provider

**Example:**
```bash
npx ultra-dex swarm "Implement subscription payments with Stripe"
```

---

## State & Monitoring

### `status`
Show the current project status and completion metrics.

```bash
npx ultra-dex status [options]
```

**Options:**
- `--refresh`: Force state recalculation
- `--json`: Output as JSON

### `dashboard`
Launch the local web dashboard.

```bash
npx ultra-dex dashboard [options]
```

**Options:**
- `--port <port>`: Port to run on (default: 3002)

### `watch`
Watch for file changes and update project state automatically.

```bash
npx ultra-dex watch
```

### `align`
Check project alignment score.

```bash
npx ultra-dex align [options]
```

**Options:**
- `--strict`: Exit with error if score < 70
- `--json`: Output as JSON

---

## Code Quality & Review

### `verify`
Run the executable 21-step verification framework on a specific task or the entire project.

```bash
npx ultra-dex verify [task] [options]
```

**Options:**
- `--provider <provider>`: AI provider

**Example:**
```bash
npx ultra-dex verify "User Authentication"
```

### `review`
Perform an AI-powered code review.

```bash
npx ultra-dex review [options]
```

**Options:**
- `--quick`: Structural check only (no AI)
- `--file <path>`: Review specific file
- `--json`: Output as JSON

### `validate`
Validate project structure and conventions.

```bash
npx ultra-dex validate
```

### `audit`
Audit project for missing sections or files.

```bash
npx ultra-dex audit
```

### `diff`
Compare the implementation plan against the actual codebase.

```bash
npx ultra-dex diff
```

---

## Integration & Config

### `serve`
Start the MCP server for external tool integration.

```bash
npx ultra-dex serve [options]
```

**Options:**
- `--port <port>`: Port to run on (default: 3001)

### `config`
Manage Ultra-Dex configuration.

```bash
npx ultra-dex config [options]
```

**Options:**
- `--list`: List all settings
- `--set <key=value>`: Set a config value
- `--get <key>`: Get a config value
- `--mcp`: Generate Claude Desktop config

### `doctor`
Diagnose setup and configuration issues.

```bash
npx ultra-dex doctor
```

### `hooks`
Manage git hooks.

```bash
npx ultra-dex hooks [options]
```

**Options:**
- `--install`: Install pre-commit hook
- `--remove`: Remove pre-commit hook

---

## Utilities

### `fetch`
Download offline assets (docs, agents, rules).

```bash
npx ultra-dex fetch [options]
```

**Options:**
- `--dir <path>`: Output directory
- `--agents`: Fetch agents only
- `--rules`: Fetch cursor rules only

### `export`
Export project documentation.

```bash
npx ultra-dex export [options]
```

**Options:**
- `--format <format>`: `html`, `json`, `markdown`
- `--output <path>`: Output file path

### `upgrade`
Upgrade the Ultra-Dex CLI.

```bash
npx ultra-dex upgrade [options]
```

**Options:**
- `--check`: Check for updates only
- `--force`: Force reinstall

### `pack`
Package context and agent instructions for external LLMs.

```bash
npx ultra-dex pack <agent>
```

---

## Team

### `team`
Manage team members and roles.

```bash
npx ultra-dex team [command]
```

**Commands:**
- `init`: Initialize team configuration
- `add <email> --role <role>`: Add member
- `remove <email>`: Remove member
- `list`: List members

---

## Agents & Workflows

### `agents`
List all available AI agents.

```bash
npx ultra-dex agents
```

### `agent`
Show the prompt for a specific agent.

```bash
npx ultra-dex agent <name>
```

### `workflow`
Show a standard workflow for a common feature.

```bash
npx ultra-dex workflow <feature>
```

### `suggest`
Get AI suggestions for which agent to use.

```bash
npx ultra-dex suggest
```
