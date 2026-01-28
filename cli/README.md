# Ultra-Dex CLI

> Scaffold Ultra-Dex projects from the command line, now with **AI-powered plan generation** and **God Mode** autonomous agents.

## What's New in v2.2+ (God Mode)

```bash
# 🤖 Autonomous feature implementation (Plan -> Code -> Verify)
npx ultra-dex auto-implement "Add Stripe checkout"

# 🔄 Real-time State & Graph Synchronization
npx ultra-dex sync --push --target ./s3-bucket

# 🛡️ Self-Healing CI/CD Monitor
npx ultra-dex ci-monitor --port 3003

# 🧠 Structural Graph Health Check
npx ultra-dex check

# 🖥️ Live Dashboard with Brain Visualization
npx ultra-dex dashboard
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

## AI Commands (God Mode)

### `auto-implement` - Autonomous Engineer

Fully autonomous feature implementation loop:

```bash
# Implement a feature from scratch
npx ultra-dex auto-implement "Create a user profile page with Avatar upload"

# Preview the plan without coding
npx ultra-dex auto-implement "Migrate to Tailwind" --dry-run
```

**How it works:**
1. **Structural Analysis:** Scans the Code Property Graph (CPG) for impact.
2. **Planning:** @Planner breaks down the task.
3. **Execution:** @Backend/@Frontend implement the code.
4. **Verification:** @Testing verifies the changes.

### `sync` - State Synchronization

Keep your project's "Brain" (Context + Graph) in sync across devices:

```bash
# Push state to a shared location
npx ultra-dex sync --push --target ./shared-drive

# Pull state from a shared location
npx ultra-dex sync --pull --target ./shared-drive
```

### `ci-monitor` - Self-Healing CI/CD

Listen for build failures and automatically fix them:

```bash
npx ultra-dex ci-monitor --port 3003
```
*Configure your CI provider (GitHub Actions) to send webhooks to this port.*

### `watch` - Real-time Daemon

Keep the Code Property Graph updated as you code:

```bash
npx ultra-dex watch
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
npx ultra-dex build --agent backend --task "Create user API endpoints"
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
ULTRA_DEX_DEFAULT_PROVIDER=router # Use "router" for hybrid local/cloud intelligence
```

## All Commands

| Command | Description |
|---------|-------------|
| `generate` | Generate full SaaS plan from idea |
| `auto-implement` | **(NEW)** Autonomously implement a feature |
| `build` | Interactive AI agent development loop |
| `review` | Review code against plan (Graph-Aware) |
| `align` | Quick alignment score |
| `sync` | **(NEW)** Sync project state across devices |
| `check` | **(NEW)** Verify repository health |
| `watch` | **(NEW)** Real-time graph synchronization daemon |
| `ci-monitor` | **(NEW)** Self-healing CI/CD webhook listener |
| `dashboard` | Start the JARVIS web dashboard |
| `init` | Initialize a new project |
| `audit` | Audit project for completeness |
| `agents` | List AI agents |
| `team` | Team collaboration (local) |
| `fetch` | Download assets for offline |
| `serve` | Serve context (MCP-compatible) |

## Example: AI Generation

```bash
$ npx ultra-dex generate "A booking platform for dog groomers"

🚀 Ultra-Dex AI Plan Generator

✔ AI modules loaded

📝 Idea: "A booking platform for dog groomers"

...

✅ All 34 sections generated
   Tokens used: 42,350 tokens
   Actual cost: $0.52

📦 Project: GroomBook

✓ Created ./IMPLEMENTATION-PLAN.md
✓ Created ./QUICK-START.md
✓ Created ./CONTEXT.md
✓ Created .ultra/state.json (GOD MODE ACTIVE)
```

## Links

- [Full Template](https://github.com/Srujan0798/Ultra-Dex/blob/main/@%20Ultra%20DeX/Saas%20plan/04-Imp-Template.md)
- [Examples](https://github.com/Srujan0798/Ultra-Dex/tree/main/@%20Ultra%20DeX/Saas%20plan/Examples)
- [Methodology](https://github.com/Srujan0798/Ultra-Dex/blob/main/@%20Ultra%20DeX/Saas%20plan/03-METHODOLOGY.md)
- [AI Agents](https://github.com/Srujan0798/Ultra-Dex/tree/main/agents)

## License

MIT
