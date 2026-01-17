# Ultra-Dex CLI

> Scaffold Ultra-Dex projects from the command line.

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

## Commands

| Command | Description |
|---------|-------------|
| `ultra-dex init` | Initialize a new project |
| `ultra-dex examples` | List available examples |
| `ultra-dex --help` | Show help |
| `ultra-dex --version` | Show version |

## Options

### init

| Option | Description |
|--------|-------------|
| `-n, --name <name>` | Project name (skips prompt) |
| `-d, --dir <directory>` | Output directory (default: current) |

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
  └── IMPLEMENTATION-PLAN.md

Next steps:
  1. cd my-saas
  2. Open QUICK-START.md and complete it
  3. Start building! 🚀
```

## Links

- [Full Template](https://github.com/anthropics/ultra-dex/blob/main/%40%20Ultra%20DeX/Saas%20plan/Imp%20Template.md)
- [Examples](https://github.com/anthropics/ultra-dex/tree/main/%40%20Ultra%20DeX/Saas%20plan/Examples)
- [Methodology](https://github.com/anthropics/ultra-dex/blob/main/%40%20Ultra%20DeX/Saas%20plan/METHODOLOGY.md)

## License

MIT
