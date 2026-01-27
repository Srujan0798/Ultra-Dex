# Ultra-Dex CLI

> Scaffold Ultra-Dex projects from the command line, now with **AI-powered plan generation**.

## What's New in v2.1

```bash
# 🚀 Generate a complete 34-section plan with AI
npx ultra-dex generate "A task management SaaS for remote teams"

# 🔧 Start AI-assisted development
npx ultra-dex build --agent planner

# 🔍 Review code against plan
npx ultra-dex review

# 📊 Quick alignment check
npx ultra-dex align
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

## AI Commands (v2.0+)

### `generate` - AI Plan Generation

Generate a complete implementation plan using AI:

```bash
# Basic usage
npx ultra-dex generate "A booking platform for dog groomers"

# With options
npx ultra-dex generate "idea" --provider openai --output ./my-project

# Preview without calling AI
npx ultra-dex generate "idea" --dry-run
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --provider` | AI provider (claude, openai, gemini) | claude |
| `-m, --model` | Specific model to use | provider default |
| `-o, --output` | Output directory | current |
| `-k, --key` | API key | env variable |
| `--dry-run` | Show structure only | false |

### `build` - AI-Assisted Development

Start development with AI agents:

```bash
# Interactive agent selection
npx ultra-dex build

# Specific agent
npx ultra-dex build --agent backend --task "Create user API endpoints"

# Copy to clipboard for external AI
npx ultra-dex build --agent planner --copy
```

**Available Agents:**
| Agent | Role |
|-------|------|
| `planner` | Break down features into atomic tasks |
| `cto` | Architecture decisions |
| `backend` | API endpoints and business logic |
| `frontend` | UI components and pages |
| `database` | Schema design and migrations |
| `auth` | Authentication and authorization |
| `security` | Security audit |
| `testing` | Write and run tests |
| `reviewer` | Code review |
| `devops` | Deployment and CI/CD |

### `review` - Code Review

Check code alignment with plan:

```bash
npx ultra-dex review
npx ultra-dex review --dir ./src
```

### `align` - Quick Score

Get alignment score instantly:

```bash
npx ultra-dex align
npx ultra-dex align --json  # Machine-readable output
```

**Environment Variables:**
```bash
ANTHROPIC_API_KEY=sk-ant-...  # Claude (recommended)
OPENAI_API_KEY=sk-...         # OpenAI
GOOGLE_AI_KEY=...             # Gemini
```

### `init`

Interactive project setup:

```bash
npx ultra-dex init
```

Generate a runnable scaffold:

```bash
npx ultra-dex init --live --stack next15-prisma-clerk
```

Presets: `next15-prisma-clerk`, `remix-supabase`, `sveltekit-drizzle`.

**Options (init):**
| Option | Description |
|--------|-------------|
| `-n, --name <name>` | Project name (skips prompt) |
| `-d, --dir <directory>` | Output directory (default: current) |
| `--preview` | Preview files without creating them |
| `--live` | Generate a runnable scaffold |
| `--stack <preset>` | Preset: next15-prisma-clerk, remix-supabase, sveltekit-drizzle |

### `audit`

Check project completeness:

```bash
npx ultra-dex audit
```

### `agents`

List and use AI agent prompts:

```bash
npx ultra-dex agents           # List all agents
npx ultra-dex agent backend    # Show specific agent
```

### `fetch`

Download assets for offline use:

```bash
npx ultra-dex fetch
npx ultra-dex fetch --agents --rules
```

### `sync`

Sync assets or refresh CONTEXT.md with a codebase snapshot:

```bash
npx ultra-dex sync
npx ultra-dex sync --assets
```

### `export`

Export project context as JSON or YAML:

```bash
npx ultra-dex export --json
npx ultra-dex export --yaml
```

### `check`

Real-time project health monitor:

```bash
npx ultra-dex check
npx ultra-dex check --watch
```

### `deploy-check`

Pre-deployment validation checklist:

```bash
npx ultra-dex deploy-check
```

### Other Commands

| Command | Description |
|---------|-------------|
| `init` | Initialize a new project |
| `init --preview` | Preview files without creating them |
| `init --live` | Generate a runnable scaffold |
| `audit` | Audit project for completeness |
| `examples` | List available examples |
| `agents` | List AI agents |
| `agent <name>` | Show specific agent prompt |
| `hooks` | Set up git pre-commit hooks |
| `fetch` | Download assets for offline |
| `sync` | Sync assets or refresh CONTEXT.md snapshot |
| `export` | Export project context as JSON/YAML |
| `check` | Real-time project health monitor |
| `deploy-check` | Pre-deployment validation checklist |
| `serve` | Serve context over HTTP |
| `validate` | Validate project structure |
| `workflow <feature>` | Show workflow for a feature |
| `suggest` | Get AI agent suggestions |
| `--help` | Show help |
| `--version` | Show version |

## Example: AI Generation

```bash
$ npx ultra-dex generate "A booking platform for dog groomers"

🚀 Ultra-Dex AI Plan Generator

✔ AI modules loaded

📝 Idea: "A booking platform for dog groomers"

✓ Using Claude (Anthropic) (claude-sonnet-4-20250514)

📊 Estimated Generation:
   Input tokens:  ~2,650
   Output tokens: ~40,000
   Estimated cost: ~$0.45

? Proceed with generation? Yes

⚡ Generating 34-section implementation plan...

✔ Generation complete!

✅ All 34 sections generated
   Tokens used: 42,350 tokens (2,650 in / 39,700 out)
   Actual cost: $0.52

📦 Project: GroomBook

✓ Created ./IMPLEMENTATION-PLAN.md
✓ Created ./QUICK-START.md
✓ Created ./CONTEXT.md

🎉 Generation complete!

Next steps:
  1. Review IMPLEMENTATION-PLAN.md
  2. Customize sections as needed
  3. Start building with: npx ultra-dex init
```

## Links

- [Full Template](https://github.com/Srujan0798/Ultra-Dex/blob/main/@%20Ultra%20DeX/Saas%20plan/04-Imp-Template.md)
- [Examples](https://github.com/Srujan0798/Ultra-Dex/tree/main/@%20Ultra%20DeX/Saas%20plan/Examples)
- [Methodology](https://github.com/Srujan0798/Ultra-Dex/blob/main/@%20Ultra%20DeX/Saas%20plan/03-METHODOLOGY.md)
- [AI Agents](https://github.com/Srujan0798/Ultra-Dex/tree/main/agents)

## License

MIT
