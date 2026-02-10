---
id: PHASE-10-PROMPTS
title: 'Phase 10 - SaaS Templates & Decision Frameworks'
category: phases
priority: high
status: completed
version: 6.0.0
last-updated: 2026-02-10
author: Ultra-Dex Team
related:
  - PROMPT-10-TEMPLATES
  - SPEC-TEMPLATES
tags:
  - saas
  - templates
  - decision-frameworks
dependencies: []
testing:
  - method: manual
  - coverage: 100%
---

# Ultra-Dex Phase 10 - SaaS Templates & Decision Frameworks

> **Source:** Complete SaaS Templates, Decision Frameworks, Onboarding
> **Total:** 15 New Prompts (#81-95)
> **Date:** Feb 5, 2026

---

## 🔵 SAAS TEMPLATE GENERATORS

---

### PROMPT 81: SaaSKit Template Generator

> **Source:** SaaSKit-Complete.md (1432 lines)
> **Status:** Full documentation exists

```
## Task: Create SaaSKit Template Command

**Files to create:**
- cli/lib/commands/template.js (NEW)
- templates/saaskit/README.md (NEW)
- templates/saaskit/schema.prisma (NEW)

**Requirements:**

1. Command to generate B2B SaaS starter:
   - `ultra-dex template saaskit`
   - Generates multi-tenant workspace model
   - Includes Clerk auth, Stripe billing, Resend email

2. Features included:
   | Feature | Priority | Complexity |
   |---------|----------|------------|
   | Multi-Tenant Workspaces | P0 | Medium |
   | RBAC (admin/member/viewer) | P0 | Medium |
   | Stripe Subscriptions | P0 | High |
   | Team Invitations | P0 | Medium |
   | Notification Center | P1 | Medium |

3. Tech stack:
   - Next.js 15 + Prisma + PostgreSQL
   - Clerk + Stripe + Resend
   - shadcn/ui + Tailwind

**Commit:** "feat: Add SaaSKit template generator"
```

---

### PROMPT 82: HabitStack Template (B2C)

> **Source:** HabitStack-Complete.md (1048 lines)
> **Status:** Full documentation exists

````
## Task: Create HabitStack Template

**Files to create:**
- templates/habitstack/README.md (NEW)
- templates/habitstack/schema.prisma (NEW)
- templates/habitstack/streak-logic.ts (NEW)

**Requirements:**

1. B2C habit tracking app:
   - `ultra-dex template habitstack`
   - Streak tracking with freeze days
   - Calendar heatmap visualization
   - Push notifications

2. Core features:
   - Daily check-ins (30 seconds)
   - Streak freeze (miss 1 day, keep streak)
   - Progress charts
   - Accountability partners

3. Streak calculation logic included:
```typescript
async function calculateStreak(habitId: string, userId: string) {
  // Get completed dates as Set for O(1) lookup
  // Calculate current streak going backwards
  // Handle target days (Mon-Fri only, etc.)
  // Use streak freezes if available
}
````

**Commit:** "feat: Add HabitStack B2C template"

```

---

### PROMPT 83: DevToolsHub Template (API Platform)

> **Source:** DevToolsHub-Complete.md (1214 lines)
> **Status:** Full documentation exists

```

## Task: Create DevToolsHub Template

**Files to create:**

- templates/devtoolshub/README.md (NEW)
- templates/devtoolshub/rate-limiter.ts (NEW)
- templates/devtoolshub/webhook-delivery.ts (NEW)

**Requirements:**

1. API platform template:
   - `ultra-dex template devtoolshub`
   - API key management (hash + prefix)
   - Usage tracking + rate limiting
   - Webhook delivery with retries

2. Core features:
   | Feature | Priority | Complexity |
   |---------|----------|------------|
   | API Key Management | P0 | Medium |
   | Usage Tracking | P0 | High |
   | Rate Limiting (Redis) | P0 | Medium |
   | Webhook Delivery | P0 | Medium |
   | SDK Generation | P1 | Medium |
   | Metered Billing | P0 | High |

3. Rate limiting middleware:

```typescript
// Token bucket in Redis
// <5ms overhead
// 429 with reset header
```

**Commit:** "feat: Add DevToolsHub API platform template"

```

---

### PROMPT 84: SupportDesk Template (Helpdesk)

> **Source:** SupportDesk-Complete.md
> **Status:** Documentation exists

```

## Task: Create SupportDesk Template

**Files to create:**

- templates/supportdesk/README.md (NEW)
- templates/supportdesk/ticket-workflow.ts (NEW)

**Requirements:**

1. Helpdesk/ticketing system:
   - `ultra-dex template supportdesk`
   - Ticket creation + assignment
   - Knowledge base
   - SLA tracking

2. Core features:
   - Ticket lifecycle (open→assigned→resolved→closed)
   - Agent assignment with load balancing
   - Canned responses
   - Customer satisfaction ratings

**Commit:** "feat: Add SupportDesk helpdesk template"

```

---

### PROMPT 85: CourseForge Template (LMS)

> **Source:** CourseForge-Complete.md
> **Status:** Documentation exists

```

## Task: Create CourseForge LMS Template

**Files to create:**

- templates/courseforge/README.md (NEW)
- templates/courseforge/progress-tracker.ts (NEW)

**Requirements:**

1. Learning management system:
   - `ultra-dex template courseforge`
   - Course + lesson structure
   - Progress tracking
   - Quizzes + certificates

2. Core features:
   - Course builder with drag-drop
   - Video streaming integration
   - Progress completion tracking
   - Certificate generation

**Commit:** "feat: Add CourseForge LMS template"

```

---

### PROMPT 86: ContentStudio Template (CMS)

> **Source:** ContentStudio-Complete.md
> **Status:** Documentation exists

```

## Task: Create ContentStudio CMS Template

**Files to create:**

- templates/contentstudio/README.md (NEW)
- templates/contentstudio/editor.tsx (NEW)

**Requirements:**

1. Content management system:
   - `ultra-dex template contentstudio`
   - Rich text editor (Tiptap/ProseMirror)
   - Media management
   - Publishing workflow

2. Core features:
   - WYSIWYG editor
   - Draft → Review → Published workflow
   - SEO optimization
   - Multi-author support

**Commit:** "feat: Add ContentStudio CMS template"

```

---

## 🟢 DECISION FRAMEWORKS

---

### PROMPT 87: Database Decision Framework CLI

> **Source:** DATABASE-DECISION-FRAMEWORK.md (522 lines)
> **Status:** Full documentation exists

```

## Task: Create Database Advisor Command

**Files to create:**

- cli/lib/commands/db-advisor.js (NEW)
- cli/lib/advisor/database-tree.js (NEW)

**Requirements:**

1. Interactive decision tree:

```bash
ultra-dex db-advisor
# What's your primary use case?
# > Structured data with relationships → PostgreSQL
# > Highly variable schemas → MongoDB
# > Real-time/analytics → PostgreSQL + Redis
```

2. Recommendations:
   | Use Case | Database | Hosting |
   |----------|----------|---------|
   | E-commerce | PostgreSQL | Neon |
   | CMS | MongoDB | Atlas |
   | SaaS Project | PostgreSQL | Supabase |
   | Analytics | PostgreSQL + TimescaleDB | Railway |

3. Output Prisma setup commands:

```bash
npm install prisma @prisma/client
npx prisma init --datasource-provider postgresql
```

**Commit:** "feat: Add database advisor CLI"

```

---

### PROMPT 88: AI Model Selection CLI

> **Source:** AI-MODEL-SELECTION.md (352 lines)
> **Status:** Full documentation exists

```

## Task: Create AI Model Advisor Command

**Files to create:**

- cli/lib/commands/ai-advisor.js (NEW)
- cli/lib/advisor/model-costs.js (NEW)

**Requirements:**

1. Interactive selection:

```bash
ultra-dex ai-advisor
# What's your budget?
# > Highest quality → Claude Opus 4.5 ($30/MTok)
# > Balanced → Claude Sonnet 4.5 ($18/MTok)
# > Budget → Claude Haiku ($6/MTok)
```

2. Cost comparison table:
   | Model | Input | Output | Best For |
   |-------|-------|--------|----------|
   | Claude Opus 4.5 | $5 | $25 | Architecture |
   | Claude Sonnet 4.5 | $3 | $15 | Balanced |
   | GPT-5.2 | $1.75 | $14 | Code gen |
   | GPT-5 mini | $0.25 | $2 | Simple tasks |

3. Hybrid strategy recommendation

**Commit:** "feat: Add AI model advisor CLI"

```

---

### PROMPT 89: Multi-Tool Orchestration Guide

> **Source:** MULTI-TOOL-WORKFLOW.md (435 lines)
> **Status:** Full documentation exists

```

## Task: Add Multi-Tool Orchestration Docs

**Files to update:**

- docs/MULTI-TOOL.md (NEW)
- cli/lib/commands/workflow.js (enhance)

**Requirements:**

1. Document workflow:
   - Claude Code for architecture
   - Cursor for fast coding
   - Copilot for autocomplete
   - ChatGPT for research (free)

2. Handoff protocol:

```markdown
## Handoff from @Backend to @Frontend

### What I Built

- POST /api/auth/signup
- POST /api/auth/login

### API Contract

POST /api/auth/login
Body: { email, password }
Response: { token, user }

### Next Steps for @Frontend

- Create login form
- Store token in httpOnly cookie
```

3. Command to validate handoffs:
   - `ultra-dex workflow validate`

**Commit:** "docs: Add multi-tool orchestration guide"

```

---

## 🟡 METHODOLOGY & ONBOARDING

---

### PROMPT 90: 21-Step Verification CLI

> **Source:** CHECKLIST-21-STEP.md (143 lines)
> **Status:** Full documentation exists

```

## Task: Automate 21-Step Verification

**Files to create:**

- cli/lib/commands/verify.js (enhance)
- cli/lib/verify/21-steps.js (NEW)

**Requirements:**

1. Run all 21 verification steps:

```bash
ultra-dex verify --full
```

2. Checklist:
   | Phase | Steps | Time |
   |-------|-------|------|
   | Planning | 1-4 | ~20 min |
   | Implementation | 5-9 | ~30 min |
   | Quality | 10-14 | ~45 min |
   | Security | 15-17 | ~15 min |
   | Documentation | 18-20 | ~10 min |
   | Final | 21 | ~15 min |

3. Output blockers for incomplete steps

**Commit:** "feat: Add 21-step verification command"

```

---

### PROMPT 91: Overhead Calculator

> **Source:** CHECKLIST-21-STEP.md
> **Status:** Formula documented

```

## Task: Create Overhead Calculator

**Files to create:**

- cli/lib/commands/estimate.js (NEW)

**Requirements:**

1. Command:

```bash
ultra-dex estimate --hours 6 --new-tech --integration
```

2. Multipliers:
   | Factor | Add | When |
   |--------|-----|------|
   | Testing | +25% | Always |
   | Code Review | +10% | Always |
   | Context Switching | +15% | If >2 tasks |
   | New Technology | +30% | First time |
   | Integration | +20% | External APIs |
   | Uncertainty | +20% | Unclear reqs |

3. Formula:

```
Actual Hours = Base × (1 + sum of factors)
```

4. Auto-split tasks >9 hours

**Commit:** "feat: Add task overhead calculator"

```

---

### PROMPT 92: Onboarding Wizard Enhancement

> **Source:** ONBOARDING.md (420 lines)
> **Status:** Full guide exists

```

## Task: Create Interactive Onboarding

**Files to create:**

- cli/lib/commands/onboard.js (NEW)

**Requirements:**

1. Interactive wizard:

```bash
ultra-dex onboard
# Step 1: Set up AI provider
# Step 2: Create first project
# Step 3: Generate implementation plan
# Step 4: Start building
```

2. Provider setup:

```bash
# For Claude
export ANTHROPIC_API_KEY=xxx

# For OpenAI
export OPENAI_API_KEY=xxx
```

3. Validate setup:
   - `ultra-dex doctor` checks all deps
   - `ultra-dex validate --scan` checks structure

**Commit:** "feat: Add interactive onboarding wizard"

```

---

### PROMPT 93: Template Unified Command

> **Source:** All *-Complete.md files
> **Status:** Multiple templates documented

```

## Task: Create Unified Template Command

**Files to create:**

- cli/lib/commands/template.js (enhance)

**Requirements:**

1. Single command for all templates:

```bash
ultra-dex template list
ultra-dex template saaskit
ultra-dex template habitstack
ultra-dex template devtoolshub
ultra-dex template supportdesk
ultra-dex template courseforge
ultra-dex template contentstudio
```

2. Each template includes:
   - README.md with overview
   - Prisma schema
   - Core components
   - API endpoints
   - Example tests

3. Interactive mode:
   - `ultra-dex template --interactive`

**Commit:** "feat: Add unified template command"

```

---

### PROMPT 94: Quick Start Enhancement

> **Source:** ONBOARDING.md + QUICK-START patterns
> **Status:** Patterns documented

```

## Task: Enhance Quick Start Flow

**Files to update:**

- cli/lib/commands/init.js (enhance)
- templates/quick-start/README.md (enhance)

**Requirements:**

1. 2-minute quick start:

```bash
mkdir my-saas
cd my-saas
ultra-dex init
ultra-dex generate "A task management SaaS"
ultra-dex build
```

2. Generated structure:

```
my-saas/
├── QUICK-START.md
├── CONTEXT.md
├── IMPLEMENTATION-PLAN.md
├── docs/
│   ├── CHECKLIST.md
│   └── AI-PROMPTS.md
└── .cursor/rules/
```

3. Auto-detect AI provider from env

**Commit:** "feat: Enhance quick start flow"

```

---

### PROMPT 95: Production-Ready Checklist

> **Source:** CHECKLIST-21-STEP.md
> **Status:** Full checklist exists

```

## Task: Create Production Readiness Check

**Files to create:**

- cli/lib/commands/production-ready.js (NEW)

**Requirements:**

1. Command:

```bash
ultra-dex production-ready
```

2. Checks:
   | Category | Criteria |
   |----------|----------|
   | Code Quality | All 21 steps, Zero P0 bugs, >80% coverage |
   | Performance | Page load <3s, API <500ms, No memory leaks |
   | Operations | Monitoring, Logs, Rollback plan |
   | User | Mobile works, A11y WCAG 2.1, Helpful errors |

3. Output report with blockers

**Commit:** "feat: Add production readiness checker"

```

---

## 📊 PHASE 10 SUMMARY

| # | Feature | Source | Category |
|---|---------|--------|----------|
| 81 | SaaSKit Template | SaaSKit-Complete.md | 🔵 Templates |
| 82 | HabitStack Template | HabitStack-Complete.md | 🔵 Templates |
| 83 | DevToolsHub Template | DevToolsHub-Complete.md | 🔵 Templates |
| 84 | SupportDesk Template | SupportDesk-Complete.md | 🔵 Templates |
| 85 | CourseForge Template | CourseForge-Complete.md | 🔵 Templates |
| 86 | ContentStudio Template | ContentStudio-Complete.md | 🔵 Templates |
| 87 | Database Advisor | DATABASE-DECISION.md | 🟢 Frameworks |
| 88 | AI Model Advisor | AI-MODEL-SELECTION.md | 🟢 Frameworks |
| 89 | Multi-Tool Orchestration | MULTI-TOOL-WORKFLOW.md | 🟢 Frameworks |
| 90 | 21-Step Verification | CHECKLIST-21-STEP.md | 🟡 Methodology |
| 91 | Overhead Calculator | CHECKLIST-21-STEP.md | 🟡 Methodology |
| 92 | Onboarding Wizard | ONBOARDING.md | 🟡 Methodology |
| 93 | Template Unified Command | All templates | 🟡 Methodology |
| 94 | Quick Start Enhancement | ONBOARDING.md | 🟡 Methodology |
| 95 | Production-Ready Check | CHECKLIST-21-STEP.md | 🟡 Methodology |

---

## 📁 FILES EXTRACTED

**Complete SaaS Templates:**
- `SaaSKit-Complete.md` → Prompt 81
- `HabitStack-Complete.md` → Prompt 82
- `DevToolsHub-Complete.md` → Prompt 83
- `SupportDesk-Complete.md` → Prompt 84
- `CourseForge-Complete.md` → Prompt 85
- `ContentStudio-Complete.md` → Prompt 86

**Decision Frameworks:**
- `DATABASE-DECISION-FRAMEWORK.md` → Prompt 87
- `AI-MODEL-SELECTION.md` → Prompt 88
- `MULTI-TOOL-WORKFLOW.md` → Prompt 89

**Methodology:**
- `CHECKLIST-21-STEP.md` → Prompts 90, 91, 95
- `ONBOARDING.md` → Prompts 92, 94

---

**Total Prompts Now: 95**
| Phase | Prompts | Focus |
|-------|---------|-------|
| 5 | #1-15 | New 2026 Trends |
| 6 | #16-35 | Archived Tasks |
| 7 | #36-50 | Advanced AI |
| 8 | #51-65 | Specs + Moonshots |
| 9 | #66-80 | Developer Tools |
| 10 | #81-95 | Templates + Frameworks |

*All prompts copy-paste ready for AI agents!*
```
