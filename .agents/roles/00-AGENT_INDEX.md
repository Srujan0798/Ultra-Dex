# Ultra-Dex Agent Index (v6.0.0)

This directory contains role definitions for all AI agents in the Ultra-Dex orchestration system.

## Swarm Pipeline Order

For multi-agent swarm execution, agents follow this pipeline:

```
planner → cto → database → backend → frontend → testing → reviewer
```

## Agent Roles

| Agent                       | Role                     | Primary Focus                      |
| --------------------------- | ------------------------ | ---------------------------------- |
| [Planner](planner.md)       | Strategic Architect      | Task decomposition, planning       |
| [CTO](cto.md)               | Technical Director       | Architecture decisions, tech stack |
| [Database](database.md)     | Data Architect           | Schema design, migrations          |
| [Backend](backend.md)       | Backend Engineer         | APIs, services, business logic     |
| [Frontend](frontend.md)     | Frontend Engineer        | UI/UX implementation               |
| [Auth](auth.md)             | Security Specialist      | Authentication, authorization      |
| [DevOps](devops.md)         | Infrastructure Engineer  | CI/CD, deployment, monitoring      |
| [Testing](testing.md)       | QA Engineer              | Test strategy, automation          |
| [Reviewer](reviewer.md)     | Code Reviewer            | Quality assurance, best practices  |
| [Debugger](debugger.md)     | Debug Specialist         | Issue diagnosis, resolution        |
| [Security](security.md)     | Security Analyst         | Vulnerability analysis, hardening  |
| [Coder](coder.md)           | Full-Stack Developer     | Implementation, TDD                |
| [Researcher](researcher.md) | Technology Analyst       | Research, feasibility studies      |
| [Writer](writer.md)         | Documentation Specialist | Docs, guides, tutorials            |

## Context Files

All agents should read:

- `CONTEXT.md` - Current project context and state
- `IMPLEMENTATION-PLAN.md` - Active implementation plan

## Agent Communication

Agents communicate through:

1. **Memory System** - Persistent shared memory (`ppmManager`)
2. **Task Results** - Output stored for downstream agents
3. **Governance** - All actions pass through `GovernanceManager`

## Adding New Agents

1. Create `<role>.md` in this directory
2. Follow the standard template (Protocol, Capabilities, Constraints)
3. Register in `src/core/agents/` if needed
4. Update this index
