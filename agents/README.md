# Ultra-Dex AI Agents

> 14 specialized AI agent prompts organized by production tier

---

## What Are Agents?

Agents are specialized AI prompts that you copy into your AI tool (Cursor, Claude, ChatGPT, etc.). Each agent has a specific role in the production pipeline and knows how to coordinate with other agents.

---

## Quick Reference

See [00-AGENT_INDEX.md](./00-AGENT_INDEX.md) for complete agent directory with "when to use" guidance.

---

## Agent Organization

Agents are organized into **6 tiers** representing the production pipeline:

### 1. Leadership Tier (`1-leadership/`)
Strategic planning and architecture decisions.

- **[@CTO](./1-leadership/cto.md)** - Architecture & tech stack decisions
- **[@Planner](./1-leadership/planner.md)** - Task breakdown & sprint planning
- **[@Research](./1-leadership/research.md)** - Technology evaluation & comparison

### 2. Development Tier (`2-development/`)
Core feature implementation.

- **[@Backend](./2-development/backend.md)** - API & server logic
- **[@Database](./2-development/database.md)** - Schema & queries
- **[@Frontend](./2-development/frontend.md)** - UI & components

### 3. Security Tier (`3-security/`)
Authentication and security audits.

- **[@Auth](./3-security/auth.md)** - Auth flows & permissions
- **[@Security](./3-security/security.md)** - Vulnerability audits

### 4. DevOps Tier (`4-devops/`)
Deployment and infrastructure.

- **[@DevOps](./4-devops/devops.md)** - CI/CD & deployment

### 5. Quality Tier (`5-quality/`)
Testing, debugging, and code review.

- **[@Debugger](./5-quality/debugger.md)** - Bug investigation
- **[@Reviewer](./5-quality/reviewer.md)** - Code review
- **[@Testing](./5-quality/testing.md)** - Test automation

### 6. Specialist Tier (`6-specialist/`)
Advanced optimization and refactoring.

- **[@Performance](./6-specialist/performance.md)** - Performance optimization
- **[@Refactoring](./6-specialist/refactoring.md)** - Code quality improvement

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

See [Orchestration Guide](../Reviews/Orchestration/) for multi-agent workflows.

---

## Orchestration

For coordinating multiple agents, see:
- [Orchestration Patterns](../Reviews/Orchestration/README.md)
- [Workflow Examples](../Reviews/Orchestration/EXAMPLES.md)
- [Formal Production Pipeline](../Reviews/Orchestration/WORKFLOW.md)

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

*Part of [Ultra-Dex v1.6.0](https://github.com/Srujan0798/Ultra-Dex) - Professional AI Orchestration Meta Layer*
