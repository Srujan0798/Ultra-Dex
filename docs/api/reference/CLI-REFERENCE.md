# Ultra-Dex CLI Reference

This document covers the legacy core command set. For the complete, up-to-date CLI catalog, see `docs/api/cli-reference.md` and `docs/api/reference/QUICK-REFERENCE.md`.

## Global Options

| Option          | Description                |
| --------------- | -------------------------- |
| `-v, --version` | Output the current version |
| `-h, --help`    | Display help for command   |

---

## Core Command Index (Legacy Subset)

| Command    | Purpose                                      |
| ---------- | -------------------------------------------- |
| `init`     | Initialize a new Ultra-Dex project           |
| `generate` | Generate a full implementation plan using AI |
| `examples` | List available example projects              |
| `agents`   | List all AI agents                           |
| `agent`    | Show a specific agent prompt                 |
| `build`    | Auto-pilot the next task from state          |
| `review`   | Review code against the plan                 |
| `align`    | Show alignment score                         |
| `audit`    | Audit project completeness                   |
| `validate` | Validate project structure                   |
| `serve`    | Start the Active Kernel (MCP + API)          |
| `hooks`    | Manage git hooks                             |
| `fetch`    | Download offline assets                      |
| `sync`     | Sync project state/context                   |
| `workflow` | Show workflow for common features            |
| `suggest`  | Suggest agents for a task                    |

---

## Setup & Planning

### `init`

Initialize a new Ultra-Dex project.

```bash
npx ultra-dex init [options]
```

**Options:**

- `-n, --name <name>`: Project name
- `-d, --dir <directory>`: Output directory (default: `.`)
- `--preview`: Preview files without creating them
- `--live`: Generate a runnable scaffold
- `--stack <preset>`: Live preset (`next15-prisma-clerk`, `remix-supabase`, `sveltekit-drizzle`)

**Examples:**

```bash
npx ultra-dex init
npx ultra-dex init --preview
npx ultra-dex init --live --stack next15-prisma-clerk --dir ./my-app
```

### `generate`

Generate a full implementation plan from an idea using AI.

```bash
npx ultra-dex generate [idea] [options]
```

**Options:**

- `-p, --provider <provider>`: AI provider (`claude`, `openai`, `gemini`)
- `-m, --model <model>`: Specific model to use
- `-o, --output <directory>`: Output directory (default: `.`)
- `-k, --key <apiKey>`: API key override
- `--stream`: Stream output (default)
- `--no-stream`: Disable streaming

**Examples:**

```bash
npx ultra-dex generate "A scheduling app for clinics"
npx ultra-dex generate "A SaaS idea" --provider claude --output ./clinic-app
```

### `examples`

List available Ultra-Dex examples.

```bash
npx ultra-dex examples
```

**Example:**

```bash
npx ultra-dex examples
```

---

## Agents

### `agents`

List all available AI agents.

```bash
npx ultra-dex agents
```

**Example:**

```bash
npx ultra-dex agents
```

### `agent`

Show a specific agent prompt (or list all agents when omitted).

```bash
npx ultra-dex agent [name]
```

**Examples:**

```bash
npx ultra-dex agent backend
npx ultra-dex agent
```

---

## Build & Review

### `build`

Auto-pilot: execute the next pending task from the plan.

```bash
npx ultra-dex build [options]
```

**Options:**

- `-p, --provider <provider>`: AI provider
- `-k, --key <apiKey>`: API key override
- `--dry-run`: Preview the task without executing

**Examples:**

```bash
npx ultra-dex build --dry-run
npx ultra-dex build --provider claude
```

### `review`

Review code against the implementation plan.

```bash
npx ultra-dex review [options]
```

**Options:**

- `-d, --dir <directory>`: Directory to review (default: `.`)
- `-p, --provider <provider>`: AI provider
- `-k, --key <apiKey>`: API key override
- `--quick`: Structure-only review (no AI)
- `--json`: JSON output

**Examples:**

```bash
npx ultra-dex review --quick
npx ultra-dex review --provider claude
```

### `align`

Show alignment score for the project.

```bash
npx ultra-dex align [options]
```

**Options:**

- `--strict`: Exit with error if score < 70
- `--json`: JSON output

**Examples:**

```bash
npx ultra-dex align
npx ultra-dex align --strict
```

---

## Project Checks

### `audit`

Audit project completeness.

```bash
npx ultra-dex audit [options]
```

**Options:**

- `-d, --dir <directory>`: Project directory (default: `.`)

**Example:**

```bash
npx ultra-dex audit --dir ./my-app
```

### `validate`

Validate project structure against Ultra-Dex standards.

```bash
npx ultra-dex validate [options]
```

**Options:**

- `-d, --dir <directory>`: Project directory (default: `.`)
- `--scan`: Run deep code quality scan

**Examples:**

```bash
npx ultra-dex validate
npx ultra-dex validate --scan
```

---

## MCP & Automation

### `serve`

Start the Ultra-Dex Active Kernel (MCP + Dashboard + API).

```bash
npx ultra-dex serve [options]
```

**Options:**

- `-p, --port <port>`: Port to listen on (default: `3001`)
- `--stdio`: Run MCP in stdio mode only

**Examples:**

```bash
npx ultra-dex serve
npx ultra-dex serve --port 3005
```

### `hooks`

Manage Ultra-Dex git hooks for automated verification.

```bash
npx ultra-dex hooks <command> [options]
```

**Commands:**

- `install`: Install pre-commit hook
  - `--force`: Overwrite existing hook
  - `--min-score <score>`: Minimum alignment score (default: 70)
- `remove`: Remove Ultra-Dex hooks
- `status`: Check hook status

**Examples:**

```bash
npx ultra-dex hooks install
npx ultra-dex hooks install --min-score 80
npx ultra-dex hooks status
```

### `fetch`

Download Ultra-Dex assets for offline use.

```bash
npx ultra-dex fetch [options]
```

**Options:**

- `-d, --dir <directory>`: Target directory (default: `.ultra-dex`)
- `--agents`: Fetch only agent prompts
- `--rules`: Fetch only cursor rules
- `--docs`: Fetch only documentation

**Examples:**

```bash
npx ultra-dex fetch
npx ultra-dex fetch --docs --dir ./offline-assets
```

### `sync`

Synchronize project state and context across devices.

```bash
npx ultra-dex sync [options]
```

**Options:**

- `-d, --dir <directory>`: Project directory (default: `.`)
- `--push`: Push local state to target
- `--pull`: Pull state from target
- `--target <path>`: Sync target (default: `.ultra/sync`)

**Examples:**

```bash
npx ultra-dex sync
npx ultra-dex sync --push --target ./shared-sync
```

---

## Guides

### `workflow`

Show a standard workflow for a common feature.

```bash
npx ultra-dex workflow <feature>
```

**Example:**

```bash
npx ultra-dex workflow auth
```

### `suggest`

Get agent suggestions for a task.

```bash
npx ultra-dex suggest
```

**Example:**

```bash
npx ultra-dex suggest
```
