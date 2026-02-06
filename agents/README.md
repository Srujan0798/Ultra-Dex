# Ultra-Dex AI Agents

> 15 specialized AI agent prompts organized by production tier

---

## What Are Agents?

Agents are specialized AI prompts that you copy into your AI tool (Cursor, Claude, ChatGPT, etc.). Each agent has a specific role in the production pipeline and knows how to coordinate with other agents.

---

## Quick Reference

See [00-AGENT_INDEX.md](./00-AGENT_INDEX.md) for complete agent directory with "when to use" guidance.

---

## Agent Organization

Agents are organized into **7 tiers** representing the production pipeline:

### 0. Meta Orchestration (`0-orchestration/`)

**High-level coordination and project manifestation**

- **[@Architect](./0-orchestration/architect.md)** - Manifest reality from a raw idea
  - Use for: Starting a new project from scratch, generating the plan
  - Example: "I want to build a SaaS for X, generate the full implementation plan"

- **[@Orchestrator](./0-orchestration/orchestrator.md)** - Multi-agent coordination
  - Use for: Coordinating complex features across multiple tiers

- **[@Meta-Orchestrator](./0-orchestration/meta-orchestrator.md)** - System-wide coordination
  - Use for: Complex multi-repo or multi-phase projects

### 1. Leadership Tier (`1-leadership/`)

**Strategic planning and architecture decisions**

- **[@CTO](./1-leadership/cto.md)** - Architecture & tech stack decisions
  - Use for: Major features, system design, technology choices
  - Example: "Should we use Next.js or separate React + Express?"

- **[@Planner](./1-leadership/planner.md)** - Task breakdown & sprint planning
  - Use for: Starting any feature, breaking down complex work
  - Example: "Break down 'user authentication' into implementation tasks"

- **[@Research](./1-leadership/research.md)** - Technology evaluation & comparison
  - Use for: Choosing frameworks, libraries, comparing approaches
  - Example: "Compare Prisma vs Drizzle ORM for PostgreSQL"

### 2. Development Tier (`2-development/`)

**Core feature implementation**

- **[@Backend](./2-development/backend.md)** - API & server logic
  - Use for: Building endpoints, business logic, server code
  - Example: "Build REST API for user authentication"

- **[@Database](./2-development/database.md)** - Schema & queries
  - Use for: Database changes, migrations, query optimization
  - Example: "Create User and Post tables with relationships"

- **[@Frontend](./2-development/frontend.md)** - UI & components
  - Use for: Building pages, components, user flows
  - Example: "Build login page with form validation"

### 3. Security Tier (`3-security/`)

**Authentication, authorization, and security audits**

- **[@Auth](./3-security/auth.md)** - Auth flows & permissions
  - Use for: Login, permissions, user management
  - Example: "Implement JWT authentication with refresh tokens"

- **[@Security](./3-security/security.md)** - Vulnerability audits
  - Use for: Before deployment, security reviews, OWASP checks
  - Example: "Audit authentication system for security vulnerabilities"

### 4. DevOps Tier (`4-devops/`)

**Deployment and infrastructure management**

- **[@DevOps](./4-devops/devops.md)** - CI/CD & deployment
  - Use for: Shipping to production, deployment pipelines
  - Example: "Deploy to Vercel with PostgreSQL on Railway"

### 5. Quality Tier (`5-quality/`)

**Testing, debugging, code review, and documentation**

- **[@Debugger](./5-quality/debugger.md)** - Bug investigation
  - Use for: When something breaks, troubleshooting issues
  - Example: "Fix: Login endpoint returns 500 error"

- **[@Documentation](./5-quality/documentation.md)** - Technical writing & docs maintenance
  - Use for: Updating docs, API documentation, user guides
  - Example: "Document API endpoints with examples"

- **[@Reviewer](./5-quality/reviewer.md)** - Code review
  - Use for: Before merging, final approval, quality checks
  - Example: "Review authentication implementation for best practices"

- **[@Testing](./5-quality/testing.md)** - Test automation
  - Use for: Writing tests, ensuring coverage, QA
  - Example: "Write unit tests for auth API (80% coverage)"

### 6. Specialist Tier (`6-specialist/`)

**Advanced optimization and code improvement**

- **[@Performance](./6-specialist/performance.md)** - Performance optimization
  - Use for: Slow pages/APIs, optimization needed
  - Example: "Optimize user list page (currently 5s load time)"

- **[@Refactoring](./6-specialist/refactoring.md)** - Code quality improvement
  - Use for: Cleaning up code, reducing complexity, applying patterns
  - Example: "Refactor authentication code to use strategy pattern"

---

## How to Use

### Single Agent (Simple Tasks)

```
1. Open your AI tool (Cursor, Claude, ChatGPT)
2. Copy contents of an agent file (e.g., backend.md)
3. Paste into chat
4. Say: "Build the user authentication API"
5. AI follows agent instructions + your project plan
```

### Multi-Agent Workflow (Complex Features)

For complex features, use multiple agents in sequence:

```
1. @Planner → Break down feature into tasks
2. @CTO → Review architecture
3. @Backend → Build API
4. @Frontend → Build UI
5. @Testing → Write tests
6. @Reviewer → Code review
7. @DevOps → Deploy
```

See [Project Orchestration Guide](../guides/PROJECT-ORCHESTRATION.md) for complete multi-agent workflows.

---

## Multi-Agent Orchestration

For coordinating multiple agents on complex features, see:

**Production Guides:**

- **[Project Orchestration](../guides/PROJECT-ORCHESTRATION.md)** - Step-by-step multi-agent workflows
- **[Advanced Workflows](../guides/ADVANCED-WORKFLOWS.md)** - Stripe, emails, migrations, real-time
- **[Multi-Tool Workflow](../guides/MULTI-TOOL-WORKFLOW.md)** - Coordinate multiple AI tools

**Examples:**

- **[Orchestration Examples](../Orchestration/EXAMPLES.md)** - Real-world workflow examples
- **[Orchestration README](../Orchestration/README.md)** - Pattern overview

---

## Integration with Ultra-Dex

All agents are designed to work with:

- `IMPLEMENTATION-PLAN.md` - Your 34-section project plan
- `CONTEXT.md` - Project background and decisions
- `QUICK-START.md` - Core project summary
- `.cursor/rules/` - AI coding patterns (if installed)

Agents reference these files to stay aligned with your project vision.

---

## Customization

These are YOUR files after installing Ultra-Dex. Feel free to:

- **Modify** - Change instructions to fit your workflow
- **Delete** - Remove agents you don't need
- **Add new** - Create custom agents in appropriate tier
- **Reorganize** - Adjust tier structure as needed

---

## Creating Custom Agents

Follow this template:

```markdown
# [Role Name] Agent

You are a [role description] for this project.

## Your Context

- Read `IMPLEMENTATION-PLAN.md` for full specification
- Read `CONTEXT.md` for project background

## Your Responsibilities

- [List specific tasks]

## Works With

- Request review from: @[OtherAgent]
- Hand off to: @[NextAgent]

## Quality Checklist

Before handing off work, verify:

- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Handoff Protocol

[Use standardized handoff format from other agents]
```

---

## Multi-Tool Support

Ultra-Dex agents work with **ANY AI tool**:

- **Claude Code** (best for complex reasoning)
- **Cursor** (fast coding)
- **GitHub Copilot** (inline suggestions)
- **ChatGPT** (research & planning)
- **Gemini** (free alternative)

See [Multi-Tool Workflow Guide](../guides/MULTI-TOOL-WORKFLOW.md) for details.

---

## CLI Usage

```bash
# List all agents
npx ultra-dex agents

# Show specific agent
npx ultra-dex agent backend

# Include agents when initializing project
npx ultra-dex init
# Answer "yes" to "Include AI agent prompts?"
```

---

_Part of [Ultra-Dex v1.7.0](https://github.com/Srujan0798/Ultra-Dex) - Professional AI Orchestration Meta Layer_
