# Ultra-Dex Agent Index

Quick reference for all 15 production agents organized by tier.

---

## 0. Meta Orchestration

| Agent | Role | When to Use | File |
|-------|------|-------------|------|
| **@Orchestrator** | Coordinate all agents for complete features | Building features that span multiple tiers | [orchestrator.md](./0-orchestration/orchestrator.md) |

---

## 1. Leadership Tier
Strategic planning and technology decisions.

| Agent | Role | When to Use | File |
|-------|------|-------------|------|
| **@CTO** | Architecture & tech stack decisions | Major features, system design, stack choices | [cto.md](./1-leadership/cto.md) |
| **@Planner** | Task breakdown & sprint planning | Starting any feature, breaking down work | [planner.md](./1-leadership/planner.md) |
| **@Research** | Technology evaluation & comparison | Choosing frameworks, libraries, approaches | [research.md](./1-leadership/research.md) |

---

## 2. Development Tier
Core implementation of features.

| Agent | Role | When to Use | File |
|-------|------|-------------|------|
| **@Backend** | API & server implementation | Building endpoints, business logic | [backend.md](./2-development/backend.md) |
| **@Database** | Schema design & query optimization | Database changes, migrations | [database.md](./2-development/database.md) |
| **@Frontend** | UI & component implementation | Building pages, components, user flows | [frontend.md](./2-development/frontend.md) |

---

## 3. Security Tier
Authentication, authorization, and security audits.

| Agent | Role | When to Use | File |
|-------|------|-------------|------|
| **@Auth** | Authentication & authorization | Login, permissions, user management | [auth.md](./3-security/auth.md) |
| **@Security** | Security audits & vulnerability fixes | Before deployment, security reviews | [security.md](./3-security/security.md) |

---

## 4. DevOps Tier
Deployment and infrastructure management.

| Agent | Role | When to Use | File |
|-------|------|-------------|------|
| **@DevOps** | Deployment & infrastructure | Shipping to production, CI/CD | [devops.md](./4-devops/devops.md) |

---

## 5. Quality Tier
Testing, debugging, and code review.

| Agent | Role | When to Use | File |
|-------|------|-------------|------|
| **@Debugger** | Bug investigation & fixes | When something breaks, troubleshooting | [debugger.md](./5-quality/debugger.md) |
| **@Documentation** | Technical writing & docs maintenance | Updating docs, API documentation, guides | [documentation.md](./5-quality/documentation.md) |
| **@Reviewer** | Code review & quality checks | Before merging, final approval | [reviewer.md](./5-quality/reviewer.md) |
| **@Testing** | QA & test automation | Writing tests, ensuring coverage | [testing.md](./5-quality/testing.md) |

---

## 6. Specialist Tier
Advanced optimization and code improvement.

| Agent | Role | When to Use | File |
|-------|------|-------------|------|
| **@Performance** | Performance optimization | Slow pages/APIs, optimization needed | [performance.md](./6-specialist/performance.md) |
| **@Refactoring** | Code quality & design patterns | Cleaning up code, reducing complexity | [refactoring.md](./6-specialist/refactoring.md) |

---

## Agent → Template Section Map

| Agent | Primary Template Sections | Supporting Sections |
|-------|---------------------------|---------------------|
| **@Planner** | 1, 2, 16, 18 | 17, 23 |
| **@CTO** | 12, 15, 19 | 21, 22 |
| **@Research** | 15, 29, 30 | 25, 26 |
| **@Backend** | 11, 13 | 9, 27 |
| **@Database** | 10 | 11, 21 |
| **@Frontend** | 6, 7, 9 | 8, 14 |
| **@Auth** | 11 | 21, 27 |
| **@Security** | 21, 28 | 27, 22 |
| **@DevOps** | 19, 20 | 18, 24 |
| **@Testing** | 20 | 16, 27 |
| **@Reviewer** | 20, 21 | 17, 27 |
| **@Debugger** | 27 | 13, 20 |
| **@Documentation** | 24 | 18, 22 |
| **@Performance** | 21, 22 | 27, 32 |
| **@Refactoring** | 16, 17 | 13, 22 |
| **@Orchestrator** | 16, 18 | 12, 24 |

---

## Quick Selection Guide

**Starting a new feature?**
→ @Planner (break it down) → @CTO (architecture)

**Building the API?**
→ @Backend + @Database

**Building the UI?**
→ @Frontend

**Security concerns?**
→ @Auth (implementation) + @Security (audit)

**Ready to deploy?**
→ @Testing → @Reviewer → @DevOps

**Performance issues?**
→ @Performance

**Code needs cleanup?**
→ @Refactoring

**Something broken?**
→ @Debugger

**Technology choice?**
→ @Research

**Documentation outdated?**
→ @Documentation

---

## Multi-Agent Orchestration

For complete multi-agent workflows and coordination patterns, see:

**Production Guides:**
- [Project Orchestration Guide](../guides/PROJECT-ORCHESTRATION.md) - Step-by-step multi-agent workflows
- [Advanced Workflows](../guides/ADVANCED-WORKFLOWS.md) - Stripe, emails, migrations, real-time features
- [Multi-Tool Workflow](../guides/MULTI-TOOL-WORKFLOW.md) - Coordinate Claude + Cursor + Copilot + ChatGPT
- [Custom Agents Guide](../guides/CUSTOM-AGENTS-GUIDE.md) - Create domain-specific agents for your SaaS

**Orchestration Examples:**
- [Orchestration Examples](../Orchestration/EXAMPLES.md) - Real-world multi-agent workflow examples
- [Orchestration README](../Orchestration/README.md) - Orchestration pattern overview

**Templates:**
- [Phase Tracker Template](../templates/PHASE-TRACKER-TEMPLATE.md) - Track progress by phase
- [Order Tracker Template](../templates/ORDER-TRACKER-TEMPLATE.md) - Step-by-step execution with copy-paste prompts
- [Master Plan Template](../templates/MASTER-PLAN-TEMPLATE.md) - Single-file project overview

**Decision Frameworks:**
- [Database Selection Guide](../guides/DATABASE-DECISION-FRAMEWORK.md) - PostgreSQL vs MongoDB vs MySQL
- [Architecture Patterns](../guides/ARCHITECTURE-PATTERNS.md) - Monolith to Microservices
- [AI Model Selection](../guides/AI-MODEL-SELECTION.md) - Choose the right AI for each task

---

*Ultra-Dex v1.7.1 - Professional AI Orchestration Meta Layer*
