# Ultra-Dex Agent Index

Quick reference for all 14 production agents organized by tier.

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

---

## Orchestration Workflow

For complete multi-agent workflows and coordination patterns, see:
- [Orchestration Guide](../Reviews/Orchestration/README.md)
- [Workflow Examples](../Reviews/Orchestration/EXAMPLES.md)
- [Formal Production Pipeline](../Reviews/Orchestration/WORKFLOW.md)

---

*Ultra-Dex v1.6.0 - Professional AI Orchestration Meta Layer*
