# Ultra-Dex

[![npm version](https://img.shields.io/npm/v/ultra-dex.svg)](https://www.npmjs.com/package/ultra-dex)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![Template](https://img.shields.io/badge/Template-34_Sections-blue.svg)](./@ Ultra DeX/Saas plan/04-Imp-Template.md)
[![Example](https://img.shields.io/badge/Example-TaskFlow-purple.svg)](./@ Ultra DeX/Saas plan/Examples/TaskFlow-Complete.md)
[![Cursor Rules](https://img.shields.io/badge/Cursor_Rules-11_Modules-green.svg)](./cursor-rules/)
[![AI Agents](https://img.shields.io/badge/AI_Agents-9_Prompts-orange.svg)](./agents/)

> **From Idea to Full-Scale, Production-Ready Application**

---

## What is Ultra-Dex?

A comprehensive framework for building complete, production-grade applications. **This is not for MVPs or quick prototypes** — it is a rigorous system for engineering full-scale software with:

- **34-section Implementation Template** - Covers every aspect of a production application
- **21-Step Verification Framework** - Strict quality gates for every atomic task
- **Atomic Task Methodology** - 4-9 hour tasks with realistic estimates
- **AI Agent Instructions** - Prompts for Claude, GPT, Gemini
- **Modular Cursor Rules** - AI-optimized rules for Cursor, Copilot
- **9 Pre-built AI Agents** - CTO, Backend, Frontend, Database, Auth, DevOps, Reviewer, Debugger, Planner

---

## Quick Start

| Your Goal | Go Here |
|-----------|---------|
| **Start in 5 minutes** | [01-QUICK-START.md](./@ Ultra DeX/Saas plan/01-QUICK-START.md) |
| **How to use correctly** | [02-HOW-TO-USE.md](./@ Ultra DeX/Saas plan/02-HOW-TO-USE.md) |
| **Understand the methodology** | [03-METHODOLOGY.md](./@ Ultra DeX/Saas plan/03-METHODOLOGY.md) |
| **Full template** | [04-Imp-Template.md](./@ Ultra DeX/Saas plan/04-Imp-Template.md) |
| **See a real example** | [TaskFlow-Complete.md](./@ Ultra DeX/Saas plan/Examples/TaskFlow-Complete.md) |
| **AI-ready rules** | [cursor-rules/](./cursor-rules/) |
| **AI agent prompts** | [agents/](./agents/) |

---

## 🤔 Is Ultra-Dex Right for You?

**✅ USE Ultra-Dex if:**
- Building a SaaS with users, auth, payments
- Complex data model (5+ database tables)
- Team of 2+ developers OR solo with 3+ month timeline
- Targeting production users, not just a demo

**❌ DON'T use Ultra-Dex if:**
- Static website / blog
- Simple CRUD app (<3 features)
- Weekend hackathon project
- Solo dev with <1 month timeline

---

## 🚀 Your First 30 Minutes

| Time | Do This |
|------|---------|
| **0-5 min** | Read "Core Philosophy" below → decide if this fits |
| **5-10 min** | Fill [01-QUICK-START.md](./@ Ultra DeX/Saas plan/01-QUICK-START.md) |
| **10-15 min** | Read [02-HOW-TO-USE.md](./@ Ultra DeX/Saas plan/02-HOW-TO-USE.md) → understand phasing |
| **15-30 min** | Skim [TaskFlow Sections 1-3](./@ Ultra DeX/Saas plan/Examples/TaskFlow-Complete.md) |
| **After 30 min** | Fill Phase 1 sections (4-5 hours) → **START CODING** |

---

## 💻 CLI Quick Start

```bash
npx ultra-dex init
```

**This generates:**
```
your-project/
├── QUICK-START.md         ← Your idea captured
├── CONTEXT.md             ← Project context for AI
├── IMPLEMENTATION-PLAN.md ← Starter sections
├── docs/
│   ├── CHECKLIST.md       ← 21-step verification
│   └── AI-PROMPTS.md      ← Agent instructions
└── .cursor/rules/         ← (optional) AI rules
```

**CLI Options:**
```bash
npx ultra-dex init              # Interactive setup
npx ultra-dex audit             # Check project completeness
npx ultra-dex examples          # Show example projects
npx ultra-dex agents            # List AI agent prompts
npx ultra-dex agent backend     # Show specific agent prompt
```

---

## Folder Structure

```
Ultra-Dex/
├── README.md                      ← You are here
├── AGENT-INSTRUCTIONS.md          ← AI agent prompts
├── agents/                        ← Pre-built AI agents
│   ├── cto.md, backend.md, frontend.md
│   ├── database.md, auth.md, devops.md
│   └── reviewer.md, debugger.md, planner.md
├── cursor-rules/                  ← Modular AI rules
│   ├── 00-ultra-dex-core.mdc
│   ├── 01-database.mdc
│   ├── 02-api.mdc
│   └── ... (10 domain-specific rules)
│
└── @ Ultra DeX/
    └── Saas plan/
        │
        │  # Core (numbered for order)
        ├── 00-README.md           ← Navigation hub
        ├── 01-QUICK-START.md      ← 5-minute entry point
        ├── 02-HOW-TO-USE.md       ← Phased approach & workflows
        ├── 03-METHODOLOGY.md      ← 21-step system explained
        ├── 04-Imp-Template.md     ← Full 34-section template (5,500 lines)
        │
        ├── Examples/              ← Complete filled examples
        │   ├── TaskFlow-Complete.md
        │   ├── InvoiceFlow-Complete.md
        │   └── HabitStack-Complete.md
        │
        └── Templates/             ← Supplementary templates
            ├── 01-CONTEXT-TEMPLATE.md
            ├── 02-STATUS-TEMPLATE.md
            ├── 03-CONSTRAINTS-TEMPLATE.md
            ├── 04-INTEGRATIONS-TEMPLATE.md
            ├── 05-CHANGELOG-TEMPLATE.md
            ├── 06-SaaS-Workflow.md
            └── 07-Rule-Book-21.md
```

---

## The Pipeline

```
💡 IDEA
    ↓
📋 QUICK-START (5 minutes)
    ↓
📝 FULL TEMPLATE (34 sections)
    ↓
✅ 21-STEP VERIFICATION (per task)
    ↓
🚀 PRODUCTION-READY
```

---

## Template Sections (34 Total)

| Part | Sections | Coverage |
|------|----------|----------|
| **Product** | 1-10 | Definition, Tech Stack, Database, API, Auth, Frontend, Real-time, Payments, UI/UX, Testing |
| **Operations** | 11-20 | Deployment, Errors, Logging, Performance, Security, Tasks, Timeline, Risks, Maintenance, Launch |
| **Advanced** | 21-34 | Docs, Roadmap, Accessibility, Cost, Analytics, Error Strategy, Legal, SEO, i18n, Feature Flags, Real-time Architecture, Support, AI/ML |

---

## The Ultra-Dex Difference

| Other Templates | Ultra-Dex |
|-----------------|-----------|
| Product definition only | Product → Code → Deploy |
| Vague tasks | 4-9 hour atomic tasks |
| No verification | 21-step checklist |
| Optimistic estimates | Overhead calculation (+25% testing, +10% review) |
| "Done when shipped" | Production-ready definition |

---

## 🦴 Core Philosophy: Your Skeleton, Not Your Cage

**Ultra-Dex is a backbone, not a straitjacket.**

### The Problem Ultra-Dex Solves

When working with AI agents (Claude, GPT, Gemini, Copilot, etc.), you've likely experienced this:

1. You start with a clear plan
2. A few conversations later, you're deep in some tangent
3. The AI forgets the main architecture
4. You waste tokens re-explaining context
5. You lose the structured path you started with

**Ultra-Dex prevents this.** It gives every AI a shared, transparent structure to follow.

### How It Works

```
┌─────────────────────────────────────────────────────────┐
│  YOUR IDEA  +  ANY AI/LLM  +  ULTRA-DEX STRUCTURE      │
│                      ↓                                  │
│            STRUCTURED IMPLEMENTATION PLAN               │
│                      ↓                                  │
│            PRODUCTION-READY APPLICATION                 │
└─────────────────────────────────────────────────────────┘
```

### Key Principles

| Principle | What It Means |
|-----------|---------------|
| **Use ANY AI** | Claude, GPT, Gemini, Copilot, local LLMs — your choice |
| **100% Flexible** | Add sections, remove sections, modify anything |
| **You Own the Plan** | The AI fills the template, but YOU control what stays |
| **Never Lose Focus** | The structure keeps AI on track, even after 50+ messages |
| **No Lock-in** | Export your plan, use it anywhere, no dependencies |

### What Ultra-Dex Is NOT

- ❌ **Not a code generator** — It's a planning framework
- ❌ **Not restrictive** — Modify anything you want
- ❌ **Not AI-specific** — Works with ANY LLM or without AI
- ❌ **Not a product** — It's open-source infrastructure

---

## Using with AI Agents

### Pre-built Agents (NEW in v1.3)

Copy and paste these prompts into your AI tool (Cursor, Claude, ChatGPT):

| Agent | Purpose | File |
|-------|---------|------|
| CTO | Architecture & tech decisions | [agents/cto.md](./agents/cto.md) |
| Backend | API, database, server logic | [agents/backend.md](./agents/backend.md) |
| Frontend | UI, components, styling | [agents/frontend.md](./agents/frontend.md) |
| Database | Schema design, queries | [agents/database.md](./agents/database.md) |
| Auth | Authentication & authorization | [agents/auth.md](./agents/auth.md) |
| DevOps | Deployment, CI/CD | [agents/devops.md](./agents/devops.md) |
| Reviewer | Code review & quality | [agents/reviewer.md](./agents/reviewer.md) |
| Debugger | Bug fixing | [agents/debugger.md](./agents/debugger.md) |
| Planner | Task breakdown | [agents/planner.md](./agents/planner.md) |

**Quick access via CLI:**
```bash
npx ultra-dex agent backend   # Prints prompt to copy
```

### Legacy Agent Instructions

See [AGENT-INSTRUCTIONS.md](./AGENT-INSTRUCTIONS.md) for additional prompts.

---

## Quality Targets

| Area | Target |
|------|--------|
| Code Coverage | >80% |
| API Response (p95) | <500ms |
| Page Load | <3s |
| Lighthouse Score | >90 |
| Security | Zero critical vulnerabilities |
| Accessibility | WCAG 2.1 AA |

---

## Get Started

1. **New to Ultra-Dex?** → Start with [01-QUICK-START.md](./@ Ultra DeX/Saas plan/01-QUICK-START.md)
2. **Want to see it in action?** → Read [TaskFlow-Complete.md](./@ Ultra DeX/Saas plan/Examples/TaskFlow-Complete.md)
3. **Ready for full planning?** → Use [04-Imp-Template.md](./@ Ultra DeX/Saas plan/04-Imp-Template.md)

---

> **Principle:** "Do it right the first time, verify it the 21st time."

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

- Report issues
- Suggest improvements
- Submit your own filled examples
- Fix typos and errors

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## Star History

If Ultra-Dex helps you build your SaaS, give it a star!

---

*Created by the Ultra-Dex Team*
