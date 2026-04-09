# Ultra-Dex Agents

This folder contains all agent definitions for Ultra-Dex.

## Structure

```
agents/
├── README.md           # This file
├── prompts/            # Role-specific AI prompts (.md files)
│   ├── cto.md          # Architecture & tech decisions
│   ├── planner.md      # Task breakdown & planning
│   ├── backend.md      # API, database, server logic
│   ├── frontend.md     # UI, components, styling
│   ├── database.md     # Schema design, queries
│   ├── auth.md         # Authentication & authorization
│   ├── devops.md       # Deployment, CI/CD
│   ├── reviewer.md     # Code review & quality
│   └── debugger.md     # Bug fixing & troubleshooting
│
└── implementations/    # Agent JavaScript implementations
    ├── controller-agent.js
    ├── execution-agent.js
    ├── architecture-agent.js
    └── ...
```

## Using Prompts

### Option 1: Copy & Paste

```bash
# Copy agent prompt to clipboard
cat agents/prompts/backend.md | pbcopy

# Paste into your AI assistant with context
```

### Option 2: Ultra-Dex CLI

```bash
# List available agents
ultra-dex agents

# Use an agent
ultra-dex run backend -t "Create REST API for users"
```

### Option 3: Fast Path

```bash
# Generate complete project
ultra-dex generate "Task management SaaS"
```

## Agent Philosophy

Agents are **orchestrators, not executors**. They:

- ✅ Provide structured thinking frameworks
- ✅ Ensure no critical steps are missed
- ✅ Maintain quality standards
- ✅ Work with ANY AI assistant
- ❌ Don't replace human judgment
- ❌ Don't lock you into a vendor

## Adding New Agents

1. Create prompt in `prompts/your-agent.md`
2. Follow existing prompt structure
3. Add implementation in `implementations/` if needed

---

_Agents exist to help users ship. If an agent doesn't help, improve it._
