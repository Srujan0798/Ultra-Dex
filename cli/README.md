# Ultra-Dex CLI

> Scaffold Ultra-Dex projects from the command line, now with **AI-powered plan generation** and **God Mode** autonomous agents.

## What's New in v3.4.2 (Ecosystem Mode)

### 🆕 v3.4.2 Features
```bash
# 🏪 Agent Marketplace - install community agents
npx ultra-dex agents list --marketplace
npx ultra-dex agents install security-auditor
npx ultra-dex agents create my-custom-agent

# 🔗 LangChain Integration - use any LangChain agent
# See: cli/lib/providers/langchain.js

# 🤖 OpenAI Assistants Sync - persistent threads
# See: cli/lib/providers/openai-assistants.js

# 🎬 Streaming AI responses
npx ultra-dex run backend -t "Build API" --stream
```

### v3.3.0 Features (Included)
```bash
# 🧠 Auto-sync CONTEXT.md from codebase
npx ultra-dex sync --brain

# 🐳 Execute code in Docker sandbox
npx ultra-dex exec "console.log('safe!')" --lang javascript

# 🔍 Semantic search with vector embeddings
npx ultra-dex search "user authentication" --index

# 🐙 GitHub integration (issues → tasks, auto-PR)
npx ultra-dex github sync
npx ultra-dex github pr --from-swarm

# 🤖 Autonomous agent swarms with parallel execution
npx ultra-dex swarm "Build user authentication" --parallel

# 🔄 Start the Active Kernel (MCP + WebSocket + Dashboard)
npx ultra-dex serve

# 📊 Health monitoring and metrics
npx ultra-dex health
npx ultra-dex metrics
```

## First 10 Minutes

```bash
# Option 1: AI-Generated Plan (Recommended)
export ANTHROPIC_API_KEY=your-key  # or OPENAI_API_KEY or GOOGLE_AI_KEY
npx ultra-dex generate "Your SaaS idea here"

# Option 2: Manual Setup
npx ultra-dex init
```

## Installation

```bash
# Run directly with npx (no installation needed)
npx ultra-dex generate "Your idea"

# Or install globally
npm install -g ultra-dex
ultra-dex generate "Your idea"
```

## Scaffold Command (NEW)

Generate production-ready boilerplate instantly:

```bash
# List available templates
npx ultra-dex scaffold --list

# Generate Next.js 15 + Prisma + Clerk project
npx ultra-dex scaffold next15-prisma-clerk

# Generate Remix + Supabase project
npx ultra-dex scaffold remix-supabase

# Generate SvelteKit + Drizzle project
npx ultra-dex scaffold sveltekit-drizzle
```

## AI Commands (God Mode)

### `swarm` - Autonomous Agent Pipeline

Run complex task pipelines with multiple agents:

```bash
# Build a feature with a swarm of agents
npx ultra-dex swarm "Implement Stripe subscriptions" --parallel

# Dry run to see the plan
npx ultra-dex swarm "Migrate to Tailwind" --dry-run
```

### `serve` - Active Kernel

Start the MCP-compatible server for IDE integration and dashboard:

```bash
npx ultra-dex serve
```

### `auto-implement` - Autonomous Engineer

Fully autonomous feature implementation loop:

```bash
# Implement a feature from scratch
npx ultra-dex auto-implement "Create a user profile page with Avatar upload"
```

### `watch` - Real-time Daemon

Keep the project state and Code Property Graph updated as you code:

```bash
npx ultra-dex watch --interval 1000
```

## Core Commands

### `generate` - AI Plan Generation

Generate a complete implementation plan using AI:

```bash
# Basic usage
npx ultra-dex generate "A booking platform for dog groomers"

# With options
npx ultra-dex generate "idea" --provider openai --output ./my-project
```

### `build` - AI-Assisted Development

Start development with AI agents (Interactive Mode):

```bash
# Interactive agent selection
npx ultra-dex build

# Specific agent
npx ultra-dex run backend --task "Create user API endpoints"
```

### `review` - Graph-Aware Code Review

Audit code against the plan using structural graph analysis:

```bash
npx ultra-dex review
```

### `align` - Quick Score

Get alignment score (Files + Plan + Graph Integrity):

```bash
npx ultra-dex align
```

### `check` - System Health

Verify repository health and graph consistency:

```bash
npx ultra-dex check
```

## Environment Variables

```bash
ANTHROPIC_API_KEY=sk-ant-...  # Claude (recommended for complex tasks)
OPENAI_API_KEY=sk-...         # OpenAI
GOOGLE_AI_KEY=...             # Gemini
OLLAMA_HOST=http://localhost:11434  # Ollama (local AI)
ULTRA_DEX_DEFAULT_PROVIDER=claude # Default AI provider
```

## Local AI with Ollama

Ultra-Dex supports Ollama for fully local, private AI operations:

```bash
# 1. Install Ollama (https://ollama.ai)
curl -fsSL https://ollama.ai/install.sh | sh

# 2. Pull a model
ollama pull llama3.2
ollama pull codellama

# 3. Use with Ultra-Dex
npx ultra-dex generate "Your idea" --provider ollama --model codellama

# For agent swarms with local AI
npx ultra-dex swarm "Build user auth" --provider ollama
```

**Supported Ollama Models:**
- `llama3.2` - General tasks
- `codellama` - Code generation (recommended)
- `mistral` - Fast, efficient
- `mixtral` - Best quality for local
- Any model available via `ollama list`

## All Commands (44+)

| Command | Description |
|---------|-------------|
| `init` | Initialize a new project |
| `scaffold` | **NEW** Generate production boilerplate |
| `generate` | Generate full SaaS plan from idea |
| `swarm` | Run autonomous agent pipeline |
| `auto-implement` | Autonomously implement a feature |
| `serve` | Start the Active Kernel (MCP + Dashboard) |
| `watch` | Auto-update state on file changes |
| `build` | Interactive AI agent development loop |
| `review` | Review code against plan |
| `align` | Quick alignment score |
| `audit` | Audit project for completeness |
| `validate` | Validate project against 21-step framework |
| `check` | Verify repository health |
| `doctor` | Diagnose project issues |
| `dashboard` | Start the local web dashboard |
| `sync` | Sync project state across devices |
| `fetch` | Download assets for offline use |
| `hooks` | Manage Git hooks |
| `export` | Export project context |
| `upgrade` | Check for CLI updates |
| `config` | Manage CLI and editor configuration |
| `agents` | List available AI agents |
| `agent` | Show specific agent prompt |
| `workflow` | Show specific production workflow |
| `suggest` | Get AI-powered task suggestions |
| `plan` | Generate or update implementation plan |
| `fix` | Automatically fix project issues |
| `team` | Team collaboration commands |
| `memory` | Manage long-term agent memory |
| `verify` | Run executable verification |
| `ci-monitor` | Self-healing CI/CD listener |
| `status` | Show project and kernel status |
| `pre-commit` | Run pre-commit checks |
| `state` | Manage machine-readable state |
| `examples` | Access reference workflows |
| `pack` | Bundle agents and rules |
| `run` | Execute agent task |
| `diff` | Compare plan vs implemented code |
| `exec` | **NEW** Execute code in Docker sandbox |
| `search` | **NEW** Semantic codebase search |
| `github` | **NEW** GitHub sync (issues, PRs) |
| `cloud` | **NEW** Team collaboration server |
| `metrics` | **NEW** Show CLI metrics |
| `health` | **NEW** System health check |
| `debug` | **NEW** Debug information |

## Links

- [Full Template](https://github.com/Srujan0798/Ultra-Dex/blob/main/@%20Ultra%20DeX/Saas%20plan/04-Imp-Template.md)
- [Examples](https://github.com/Srujan0798/Ultra-Dex/tree/main/@%20Ultra%20DeX/Saas%20plan/Examples)
- [Methodology](https://github.com/Srujan0798/Ultra-Dex/blob/main/@%20Ultra%20DeX/Saas%20plan/03-METHODOLOGY.md)
- [AI Agents](https://github.com/Srujan0798/Ultra-Dex/tree/main/agents)

## License

MIT