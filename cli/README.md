# Ultra-Dex CLI

> Scaffold Ultra-Dex projects from the command line.

## First 10 Minutes

```bash
# 1. Create your project (2 min)
npx ultra-dex init

# 2. Open and review QUICK-START.md (3 min)
cd your-project
cat QUICK-START.md

# 3. Load Cursor rules for AI assistance (1 min)
npx degit Srujan0798/Ultra-Dex/cursor-rules .cursor/rules
# Then: cd .cursor/rules && ./load.sh database api auth

# 4. Start building with AI agents (4 min)
# Use @Backend, @Frontend, @Database agents
npx ultra-dex agents

# You're ready to code!
```

## Installation

```bash
# Run directly with npx (no installation needed)
npx ultra-dex init

# Or install globally
npm install -g ultra-dex
ultra-dex init
```

## Usage

### Initialize a new project

```bash
npx ultra-dex init
```

This will:
1. Ask you about your SaaS idea
2. Gather tech stack preferences
3. Create starter files:
   - `QUICK-START.md` - Pre-filled with your answers
   - `CONTEXT.md` - Project context for AI agents
   - `IMPLEMENTATION-PLAN.md` - Links to full resources

### List examples

```bash
npx ultra-dex examples
```

Shows links to fully filled Ultra-Dex examples:
- TaskFlow (Task Management)
- InvoiceFlow (Invoicing)
- HabitStack (Habit Tracking)

### Audit your project

```bash
npx ultra-dex audit
```

Checks your project for completeness:
- Required files (QUICK-START.md, CONTEXT.md, etc.)
- Key sections (idea, problem, MVP, tech stack)
- Implementation details (database, API, auth)

Outputs a score and grade (A-F) with suggestions.

### List AI agents

```bash
npx ultra-dex agents
```

Shows available AI agent prompts:
- CTO, Backend, Frontend, Database
- Auth, DevOps, Reviewer, Debugger, Planner

### Get agent prompt

```bash
npx ultra-dex agent backend
```

Prints the full agent prompt. Copy and paste into your AI tool (Cursor, Claude, ChatGPT).

## Commands

| Command | Description |
|---------|-------------|
| `ultra-dex init` | Initialize a new project |
| `ultra-dex audit` | Audit project for completeness |
| `ultra-dex examples` | List available examples |
| `ultra-dex agents` | List available AI agents |
| `ultra-dex agent <name>` | Show specific agent prompt |
| `ultra-dex pack <agent>` | Package context + agent for any AI |
| `ultra-dex --help` | Show help |
| `ultra-dex --version` | Show version |

## Options

### init

| Option | Description |
|--------|-------------|
| `-n, --name <name>` | Project name (skips prompt) |
| `-d, --dir <directory>` | Output directory (default: current) |

### audit

| Option | Description |
|--------|-------------|
| `-d, --dir <directory>` | Directory to audit (default: current) |

## Example

```bash
$ npx ultra-dex init

╔═══════════════════════════════════════════════════════════╗
║   ULTRA-DEX                                               ║
║   From Idea to Production-Ready SaaS                      ║
╚═══════════════════════════════════════════════════════════╝

Welcome to Ultra-Dex! Let's plan your SaaS.

? What's your project name? my-saas
? What are you building? A booking platform for dog groomers
? Who is it for? Independent dog grooming businesses
? Problem #1 you're solving: Manual booking via phone is time-consuming
? Problem #2 you're solving: No-shows cost money
? Problem #3 you're solving: No online presence
? Most important MVP feature: Online booking calendar
? Frontend framework: Next.js
? Database: PostgreSQL
? Authentication: NextAuth
? Payments: Stripe
? Hosting: Vercel

✔ Project created successfully!

Files created:
  my-saas/
  ├── QUICK-START.md
  ├── CONTEXT.md
  ├── IMPLEMENTATION-PLAN.md
  ├── .cursor/rules/ (11 AI rule files)
  └── .agents/ (9 AI agent prompts)

Next steps:
  1. cd my-saas
  2. Open QUICK-START.md and complete it
  3. Start building! 🚀
```

## Links

- [Full Template](https://github.com/Srujan0798/Ultra-Dex/blob/main/@%20Ultra%20DeX/Saas%20plan/04-Imp-Template.md)
- [Examples](https://github.com/Srujan0798/Ultra-Dex/tree/main/@%20Ultra%20DeX/Saas%20plan/Examples)
- [Methodology](https://github.com/Srujan0798/Ultra-Dex/blob/main/@%20Ultra%20DeX/Saas%20plan/03-METHODOLOGY.md)
- [AI Agents](https://github.com/Srujan0798/Ultra-Dex/tree/main/agents)

## License

MIT
