# Ultra-Dex Quick Reference

One-page cheatsheet for AI-driven SaaS development.

---

## 🚀 Quick Start (2 minutes)

```bash
# Initialize Ultra-Dex in your project
npx ultra-dex init

# List all 15 agents
npx ultra-dex agents

# Show specific agent
npx ultra-dex agent backend
```

---

## 🤖 15 AI Agents by Tier

| Tier | Agent | Use When |
|------|-------|----------|
| **1. Leadership** | @CTO | Architecture & tech stack decisions |
| | @Planner | Breaking down features into tasks |
| | @Research | Comparing frameworks/libraries |
| **2. Development** | @Backend | Building APIs & server logic |
| | @Frontend | Building UI & components |
| | @Database | Database schema & queries |
| **3. Security** | @Auth | Authentication & authorization |
| | @Security | Security audits & OWASP checks |
| **4. DevOps** | @DevOps | Deployment & CI/CD |
| **5. Quality** | @Testing | Writing tests & QA |
| | @Documentation | Technical writing & docs |
| | @Reviewer | Code review & quality checks |
| | @Debugger | Bug fixing & troubleshooting |
| **6. Specialist** | @Performance | Performance optimization |
| | @Refactoring | Code quality & design patterns |

**Full Index:** [agents/00-AGENT_INDEX.md](./agents/00-AGENT_INDEX.md)

---

## 📋 Standard Workflow

### New Feature (Multi-Agent)

```
1. @Planner    → Break down into tasks
2. @CTO        → Review architecture
3. @Database   → Design schema (if needed)
4. @Backend    → Build API
5. @Frontend   → Build UI
6. @Testing    → Write tests
7. @Security   → Security audit (if auth/payments)
8. @Reviewer   → Code review
9. @DevOps     → Deploy to staging/production
```

### Bug Fix (Fast Track)

```
1. @Debugger   → Investigate & fix
2. @Testing    → Add regression test
3. @Reviewer   → Quick review
4. @DevOps     → Deploy hotfix
```

### Performance Issue

```
1. @Performance → Identify bottleneck & optimize
2. @Testing     → Verify improvement
3. @Reviewer    → Review changes
```

---

## 📚 Essential Guides

| Guide | Use For | Time |
|-------|---------|------|
| [Project Orchestration](./guides/PROJECT-ORCHESTRATION.md) | Learn multi-agent workflow | 20 min |
| [Advanced Workflows](./guides/ADVANCED-WORKFLOWS.md) | Copy Stripe/email/real-time patterns | 10 min |
| [Database Decision](./guides/DATABASE-DECISION-FRAMEWORK.md) | Choose PostgreSQL vs MongoDB vs MySQL | 10 min |
| [Architecture Patterns](./guides/ARCHITECTURE-PATTERNS.md) | Choose architecture for team size | 15 min |
| [AI Model Selection](./guides/AI-MODEL-SELECTION.md) | Optimize AI costs | 8 min |
| [Multi-Tool Workflow](./guides/MULTI-TOOL-WORKFLOW.md) | Use multiple AIs together | 12 min |

**All Guides:** [guides/README.md](./guides/README.md)

---

## 🎯 Decision Trees

### Which Database?

```
Need transactions (payments, inventory)?
├─ YES → PostgreSQL
└─ NO  → Flexible schema needed?
         ├─ YES → MongoDB
         └─ NO  → PostgreSQL (still recommended)
```

### Which Architecture?

```
Team size:
├─ 1-3 people  → Full-Stack Next.js
├─ 3-8 people  → Backend + Frontend split
├─ 5-15 people → Backend + Multiple frontends
├─ 10-30 people → Service-Oriented Architecture
└─ 30+ people   → Microservices
```

### Which AI Model?

```
Task type:
├─ Architecture/complex reasoning → Claude Opus ($30/MTok)
├─ Coding/implementation → GPT-5.2 or Claude Sonnet ($15-18/MTok)
├─ Quick fixes/simple tasks → Claude Haiku or GPT-5 mini ($2-6/MTok)
├─ Research with web search → ChatGPT (built-in search)
└─ Very sensitive data → Self-hosted Llama 3.1
```

---

## 💻 CLI Commands

```bash
# Project Setup
npx ultra-dex init              # Interactive setup
npx ultra-dex init --yes        # Use defaults

# Agents
npx ultra-dex agents            # List all 15 agents
npx ultra-dex agent backend     # Show backend agent
npx ultra-dex agent cto         # Show CTO agent

# Validation
npx ultra-dex audit             # Check project completeness

# Examples
npx ultra-dex examples          # Show example projects
```

---

## 📁 File Structure

```
your-project/
├── IMPLEMENTATION-PLAN.md     ← 34-section template
├── CONTEXT.md                 ← Project background
├── QUICK-START.md             ← Core project summary
├── MASTER-PLAN.md             ← Single-file overview (optional)
├── PHASE-TRACKER.md           ← Task tracking (optional)
└── .agents/                   ← Agent prompts (if using init)
```

---

## 🔄 Multi-Tool Strategy

Use different AI tools for different tasks:

| Task | Best Tool | Why |
|------|-----------|-----|
| Planning | ChatGPT (free) | Built-in web search |
| Architecture | Claude Opus | Best reasoning |
| Coding | GPT-5.2 or Cursor | Optimized for code |
| Quick fixes | Claude Haiku | Fast & cheap |
| Review | Claude Sonnet | Thorough analysis |

**Shared state:** All tools read/write `IMPLEMENTATION-PLAN.md`

**Guide:** [Multi-Tool Workflow](./guides/MULTI-TOOL-WORKFLOW.md)

---

## 📊 Quality Targets

| Area | Target | Tool |
|------|--------|------|
| Code Coverage | >80% | Jest, Vitest |
| API Response (p95) | <500ms | Lighthouse, New Relic |
| Page Load | <3s | Lighthouse |
| Lighthouse Score | >90 | Chrome DevTools |
| Bundle Size | <200KB (initial) | Webpack Bundle Analyzer |
| Database Queries | <100ms (p95) | Prisma/Drizzle logs |

---

## 🎓 Learning Path

### Beginner (60 minutes)
1. Read [Project Orchestration](./guides/PROJECT-ORCHESTRATION.md) - 20 min
2. Read [Database Decision](./guides/DATABASE-DECISION-FRAMEWORK.md) - 10 min
3. Read [Architecture Patterns](./guides/ARCHITECTURE-PATTERNS.md) - 15 min
4. Scan [Advanced Workflows](./guides/ADVANCED-WORKFLOWS.md) - 15 min

### Experienced (30 minutes)
1. Scan [Advanced Workflows](./guides/ADVANCED-WORKFLOWS.md) - 10 min
2. Read [Multi-Tool Workflow](./guides/MULTI-TOOL-WORKFLOW.md) - 10 min
3. Read [AI Model Selection](./guides/AI-MODEL-SELECTION.md) - 10 min

---

## 🔗 Quick Links

**Core:**
- [Main README](./README.md) - Project overview
- [Agent Index](./agents/00-AGENT_INDEX.md) - All 15 agents
- [Guide Directory](./guides/README.md) - All guides
- [CHANGELOG](./CHANGELOG.md) - Version history

**Templates:**
- [Master Plan Template](./templates/MASTER-PLAN-TEMPLATE.md) - Project overview
- [Phase Tracker Template](./templates/PHASE-TRACKER-TEMPLATE.md) - Task tracking
- [Template Usage Guide](./templates/README.md) - How to use templates

**Examples:**
- [Orchestration Examples](./Orchestration/EXAMPLES.md) - Multi-agent workflows
- [TaskFlow Complete](./@ Ultra DeX/Saas plan/Examples/TaskFlow-Complete.md) - Full SaaS example

**External:**
- [GitHub Repo](https://github.com/Srujan0798/Ultra-Dex)
- [Issues](https://github.com/Srujan0798/Ultra-Dex/issues)
- [npm Package](https://www.npmjs.com/package/ultra-dex)

---

## 💡 Common Workflows

### Authentication (30 minutes)

```
1. @Planner: Break down auth feature
   → Tasks: Schema, API, UI, Security

2. @CTO: Review architecture
   → Decision: JWT with httpOnly cookies

3. @Database: Create User table
   → Schema with email, passwordHash

4. @Backend: Build endpoints
   → /signup, /login, /logout, /me

5. @Frontend: Build UI
   → Login page, Signup page, Protected routes

6. @Security: Audit
   → Check password hashing, token security

7. @Reviewer: Review code
   → Quality check, test coverage

8. @DevOps: Deploy
   → Set JWT_SECRET, deploy to staging
```

**Full guide:** [Project Orchestration](./guides/PROJECT-ORCHESTRATION.md)

### Stripe Payment (45 minutes)

```
1. @Research: Stripe Checkout vs Elements
   → Recommendation: Stripe Checkout (PCI compliant)

2. @CTO: Architecture
   → Webhook-driven subscription updates

3. @Database: Subscription table
   → stripeCustomerId, status, currentPeriodEnd

4. @Backend: Checkout + webhooks
   → Create session, handle webhook events

5. @Frontend: Checkout button
   → Redirect to Stripe Checkout

6. @Testing: Test with Stripe test cards
   → 4242 4242 4242 4242

7. @Security: Verify webhook signatures
   → Prevent fake events

8. @DevOps: Set STRIPE_SECRET_KEY
   → Deploy to production
```

**Full guide:** [Advanced Workflows - Stripe](./guides/ADVANCED-WORKFLOWS.md#example-1-payment-integration-stripe)

---

## 🎯 Key Principles

1. **Use ANY AI** - Claude, GPT, Gemini, Copilot, local LLMs
2. **100% Flexible** - Add, remove, modify anything
3. **You Own the Plan** - AI fills template, you control what stays
4. **Never Lose Focus** - Structure keeps AI on track
5. **No Lock-in** - Export plan, use anywhere

---

## 📊 Project Statistics

- **15 Agents** - 6 tiers, production pipeline coverage
- **6 Guides** - 3,283 lines, 83 KB of documentation
- **2 Templates** - MASTER-PLAN (800 lines), PHASE-TRACKER (329 lines)
- **34 Sections** - Complete implementation template
- **21 Steps** - Verification framework per task

---

## 🆘 Need Help?

**Documentation:**
- [Main README](./README.md) - Start here
- [Guide Directory](./guides/README.md) - All guides
- [Agent Index](./agents/00-AGENT_INDEX.md) - All agents

**Support:**
- [GitHub Issues](https://github.com/Srujan0798/Ultra-Dex/issues) - Report bugs
- [GitHub Discussions](https://github.com/Srujan0798/Ultra-Dex/discussions) - Ask questions

---

*Ultra-Dex v1.6.1 - Professional AI Orchestration Meta Layer*

**Print this page for quick reference while coding!**
