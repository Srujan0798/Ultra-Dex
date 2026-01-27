# Ultra-Dex Cursor Rules

> Modular AI rules for Cursor, Copilot, and other AI coding assistants.

## What is This?

The 34-section Ultra-Dex template, atomized into small, focused rule files. Each file is under 200 lines and optimized for AI context windows.

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
| Frontend components | `00-ultra-dex-core.mdc` + `04-frontend.mdc` |
| Payments | `00-ultra-dex-core.mdc` + `05-payments.mdc` |
| Testing | `00-ultra-dex-core.mdc` + `06-testing.mdc` |
| Security review | `00-ultra-dex-core.mdc` + `07-security.mdc` |
| Deployment | `00-ultra-dex-core.mdc` + `08-deployment.mdc` |
| Error handling | `00-ultra-dex-core.mdc` + `09-error-handling.mdc` |
| Performance | `00-ultra-dex-core.mdc` + `10-performance.mdc` |
| Next.js 15 app | `00-ultra-dex-core.mdc` + `11-nextjs-v15.mdc` |
| Multi-tenant SaaS | `00-ultra-dex-core.mdc` + `12-multi-tenancy.mdc` |

## Files

| File | Lines | Purpose |
|------|-------|---------|
| `00-ultra-dex-core.mdc` | ~60 | Base rules (always load) |
| `01-database.mdc` | ~70 | Prisma, schema, queries |
| `02-api.mdc` | ~100 | API routes, validation, responses |
| `03-auth.mdc` | ~70 | NextAuth configuration |
| `04-frontend.mdc` | ~100 | React, components, state |
| `05-payments.mdc` | ~90 | Stripe integration |
| `06-testing.mdc` | ~100 | Vitest, Playwright |
| `07-security.mdc` | ~100 | Input validation, auth, headers |
| `08-deployment.mdc` | ~90 | Vercel, CI/CD, migrations |
| `09-error-handling.mdc` | ~100 | Error patterns, logging |
| `10-performance.mdc` | ~100 | Optimization, caching |
| `11-nextjs-v15.mdc` | ~200 | Next.js 15 App Router patterns |
| `12-multi-tenancy.mdc` | ~200 | SaaS multi-tenant patterns |

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
