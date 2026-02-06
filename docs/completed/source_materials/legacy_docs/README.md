# Ultra-Dex Agent Orchestration

> How to coordinate multiple AI agents on your SaaS project

---

## What is Orchestration?

Orchestration is using multiple specialized AI agents together, each handling what they do best, coordinating work between them for complex tasks.

**Single Agent**: Good for isolated tasks
**Multiple Agents**: Better for complex features that span domains

---

## The @AgentName Pattern

Reference agents using `@AgentName` to delegate work:

### Example Flow

```
User: "Add user authentication to my SaaS"

@Planner: Breaks down into tasks
  → Task 1: Database schema
  → Task 2: API endpoints
  → Task 3: Login UI
  → Task 4: Security review

@CTO: Reviews architecture approach
  → Approves with recommendations

@Database: Creates User schema
  → Handoff to @Backend

@Backend: Implements auth API
  → Handoff to @Frontend

@Frontend: Creates login UI
  → Handoff to @Auth

@Auth: Security review
  → Handoff to @Reviewer

@Reviewer: Code review
  → Handoff to @DevOps

@DevOps: Deploys
  → Done!
```

---

## The 9 Ultra-Dex Agents

| Agent         | Role                   | Best For                       |
| ------------- | ---------------------- | ------------------------------ |
| **@Planner**  | Task breakdown         | Planning complex features      |
| **@CTO**      | Architecture decisions | Tech stack, system design      |
| **@Backend**  | API & server logic     | Endpoints, business logic      |
| **@Frontend** | UI & components        | Pages, forms, styling          |
| **@Database** | Schema & queries       | Data modeling, optimization    |
| **@Auth**     | Security & auth        | Authentication, authorization  |
| **@DevOps**   | Deployment & infra     | CI/CD, hosting, monitoring     |
| **@Reviewer** | Code review            | Quality checks, best practices |
| **@Debugger** | Bug fixing             | Issue investigation, fixes     |

---

## When to Use Multiple Agents

### ✅ Use Orchestration For:

**Complex Features**

- User authentication (database + API + UI + security)
- Payment integration (backend + frontend + security + review)
- Real-time features (architecture + backend + frontend + devops)

**Cross-Domain Work**

- API + UI that need to work together
- Database changes that affect multiple parts
- Security-sensitive features

**Need for Review/Approval**

- Architecture decisions before implementation
- Security review before deployment
- Code review before merging

### ❌ Don't Over-Orchestrate:

**Simple Tasks**

- Fix a typo → Just do it
- Update a config → One agent is fine
- Add a util function → No need for coordination

**Single-Domain Work**

- Pure UI change → @Frontend only
- Database query optimization → @Database only
- Deploy config change → @DevOps only

---

## Quality Gates

Each agent checks specific criteria before handing off:

| Agent        | Checks Before Handoff                            |
| ------------ | ------------------------------------------------ |
| **Planner**  | Tasks clear, dependencies identified             |
| **CTO**      | Architecture documented, tech decisions recorded |
| **Backend**  | Tests passing, API documented                    |
| **Frontend** | Responsive, accessible, tested                   |
| **Database** | Migration tested, indexes added                  |
| **Auth**     | No vulnerabilities, secrets secure               |
| **DevOps**   | Build successful, deployment verified            |
| **Reviewer** | Code quality acceptable, tests passing           |
| **Debugger** | Root cause found, regression test added          |

---

## Workflow Patterns

### Pattern 1: Feature Development

```
Planner → CTO → Specialists → Reviewer → DevOps
```

Use for: New features, major changes

### Pattern 2: Bug Fix

```
Debugger → Specialist → Reviewer
```

Use for: Bug fixes, performance issues

### Pattern 3: Architecture Change

```
CTO → Planner → Specialists → Reviewer
```

Use for: Tech stack changes, refactoring

---

## Real Examples

See [EXAMPLES.md](./EXAMPLES.md) for detailed workflows:

1. **Add User Authentication** - Full feature workflow
2. **Build Dashboard** - Frontend + Backend coordination
3. **Fix Performance Bug** - Debugging workflow

---

## Best Practices

### 1. Clear Handoffs

When one agent finishes, explicitly state who's next:

```
@Backend: API ready. Handoff to @Frontend.
```

### 2. Quality Checkpoints

Each agent verifies their work before passing:

```
@Backend:
- [x] Tests passing
- [x] API documented
- [x] Error handling added
Ready for @Reviewer
```

### 3. Decision Logging

CTOs and planners should document WHY:

```
@CTO: Using JWT tokens because:
- Stateless (scales better)
- Works across services
- Industry standard
```

### 4. Keep Context

Reference the Ultra-Dex plan:

```
@Backend: Per Section 6 of IMPLEMENTATION-PLAN.md,
implementing these endpoints...
```

---

## Tips for Success

**Start Simple**

- Use single agents for simple tasks
- Add orchestration when you need it

**Be Explicit**

- Always name the next agent
- State what you're handing off

**Use Checklists**

- Verify quality gates before handoff
- Don't skip steps

**Stay Aligned**

- All agents read IMPLEMENTATION-PLAN.md
- Follow the same architecture

---

## Integration with Ultra-Dex

Orchestration works seamlessly with Ultra-Dex:

- **34-Section Template** → Shared context for all agents
- **Cursor Rules** → Coding standards agents follow
- **Agent Prompts** → Each agent has defined role
- **Quality Gates** → 21-step verification per task

---

_Part of [Ultra-Dex](https://github.com/Srujan0798/Ultra-Dex) - AI Orchestration Meta Layer_
