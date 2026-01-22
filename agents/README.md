# Ultra-Dex Agents

> Pre-built AI agent prompts for SaaS development

## What Are Agents?

Agents are specialized AI prompts that you copy and paste into your AI tool (Cursor, Claude, ChatGPT, etc.). Each agent has a specific role and knows how to work with your Ultra-Dex project.

## How to Use

1. **Choose an agent** from the list below
2. **Copy the entire file content** (the file IS the prompt)
3. **Paste into your AI tool** (Cursor chat, Claude, ChatGPT, etc.)
4. **Start working** - the AI will follow the agent's instructions

## Available Agents

| Agent | File | Purpose |
|-------|------|---------|
| CTO | [cto.md](cto.md) | Architecture decisions, tech stack, system design |
| Backend | [backend.md](backend.md) | API endpoints, server logic, integrations |
| Frontend | [frontend.md](frontend.md) | UI components, styling, user experience |
| Database | [database.md](database.md) | Schema design, queries, migrations |
| Auth | [auth.md](auth.md) | Authentication, authorization, security |
| DevOps | [devops.md](devops.md) | Deployment, CI/CD, infrastructure |
| Reviewer | [reviewer.md](reviewer.md) | Code review, quality checks, best practices |
| Debugger | [debugger.md](debugger.md) | Bug fixing, troubleshooting, error analysis |
| Planner | [planner.md](planner.md) | Task breakdown, sprint planning, prioritization |

## Example Usage

```
1. Open Cursor/Claude/ChatGPT
2. Copy contents of backend.md
3. Paste as your first message
4. Say: "Build the user authentication API endpoints"
5. AI follows the agent instructions + your project plan
```

## Customization

These are YOUR files after you install Ultra-Dex. Feel free to:

- **Modify** - Change instructions to fit your workflow
- **Delete** - Remove agents you don't need
- **Add new** - Create `security.md`, `tester.md`, whatever you need
- **Combine** - Merge multiple agents into one

## Creating Custom Agents

```markdown
# [Role Name] Agent

You are a [role description] working on this project.

## Your Context
- Read IMPLEMENTATION-PLAN.md for the full project specification
- Read CONTEXT.md for project background
- Check .cursor/rules/ for coding patterns

## Your Responsibilities
- [List specific tasks this agent handles]

## How You Work
1. [Step-by-step process]

## Start By
1. Read the relevant project files
2. Ask: "What would you like me to work on?"
```

## Integration with Ultra-Dex

All agents are designed to work with:
- `IMPLEMENTATION-PLAN.md` - Your 34-section project plan
- `CONTEXT.md` - Project background and context
- `QUICK-START.md` - Core project summary
- `.cursor/rules/` - AI coding patterns

The agents reference these files to stay aligned with your project vision.

---

*Part of [Ultra-Dex](https://github.com/Srujan0798/Ultra-Dex) - From Idea to Production-Ready SaaS*
