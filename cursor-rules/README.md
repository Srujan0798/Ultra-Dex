# Ultra-Dex Cursor Rules

> Modular AI rules for Cursor, Copilot, and other AI coding assistants.

## What is This?

The 34-section Ultra-Dex template, atomized into small, focused rule files. Each file is under 250 lines and optimized for AI context windows.

## How to Use

### Option 1: Copy to `.cursor/rules/`

```bash
# In your project root
mkdir -p .cursor/rules
cp path/to/ultra-dex/cursor-rules/*.mdc .cursor/rules/
```

### Option 2: Reference in System Prompt

Paste the relevant rule into your AI assistant's system prompt when working on that domain.

### Option 3: Selective Loading

Only load rules relevant to your current task:

| Working On | Load These |
|------------|------------|
| Database schema | `00-ultra-dex-core.mdc` + `01-database.mdc` |
| API endpoints | `00-ultra-dex-core.mdc` + `02-api.mdc` |
| Authentication | `00-ultra-dex-core.mdc` + `03-auth.mdc` |
| Next.js 15 app | `00-ultra-dex-core.mdc` + `26-nextjs-v15.mdc` |
| Server Components | `00-ultra-dex-core.mdc` + `29-server-components.mdc` |
| Multi-tenant SaaS | `00-ultra-dex-core.mdc` + `27-multi-tenant.mdc` |
| Performance | `00-ultra-dex-core.mdc` + `31-performance.mdc` |
| AI/LLM Integration | `00-ultra-dex-core.mdc` + `34-advanced-ai.mdc` |

## Files (Core & Development)

| File | Purpose |
|------|---------|
| `00-ultra-dex-core.mdc` | Base rules (always load) |
| `01-database.mdc` | Prisma, schema, queries |
| `02-api.mdc` | API routes, validation, responses |
| `03-auth.mdc` | NextAuth configuration |
| `04-frontend.mdc` | React, components, state |
| `05-payments.mdc` | Stripe integration |
| `06-testing.mdc` | Vitest, Playwright |
| `07-security.mdc` | Input validation, auth, headers |
| `08-deployment.mdc` | Vercel, CI/CD, migrations |
| `09-error-handling.mdc` | Error patterns, logging |

## Files (Advanced Patterns)

| File | Purpose |
|------|---------|
| `26-nextjs-v15.mdc` | Next.js 15 App Router & Server Actions |
| `27-multi-tenant.mdc` | SaaS multi-tenant isolation patterns |
| `28-vercel-ai.mdc` | AI SDK & Streaming implementations |
| `29-server-components.mdc` | RSC & Server Action best practices |
| `30-error-boundaries.mdc` | Resilience & Error UX patterns |
| `31-performance.mdc` | Optimization & Caching strategies |
| `32-langgraph.mdc` | Agentic workflow state management |
| `33-voice-nlp.mdc` | Voice & Speech-to-text integration |
| `34-advanced-ai.mdc` | Advanced LLM orchestration |

## Why Modular?

1. **AI Context Limits**: LLMs perform better with focused context (<500 lines)
2. **"Lost in the Middle"**: Long contexts degrade AI attention on middle content
3. **Relevance**: Load only what you need for the current task
4. **Maintainability**: Update one domain without touching others

## Customization

These are starting points. Customize for your stack:

- Using Supabase instead of Prisma? Modify `01-database.mdc`
- Using Clerk instead of NextAuth? Replace `03-auth.mdc`
- Using Paddle instead of Stripe? Replace `05-payments.mdc`

## Full Template

For the complete 34-section template with all details:
- [04-Imp-Template.md](../@%20Ultra%20DeX/Saas%20plan/04-Imp-Template.md)
