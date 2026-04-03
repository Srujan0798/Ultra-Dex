# Ultra-Dex AI Agents

This folder contains role-specific AI agent prompts. Each file is a complete prompt that you can copy and paste into your AI assistant (Cursor, Claude Code, Devin, etc.).

## Quick Start

1. **Fast Path** (Recommended for quick builds):

   ```bash
   npx ultra-dex generate "Your app idea here"
   ```

2. **Agent Path** (For controlled, role-based development):
   - Copy the content of an agent file (e.g., `.agents/cto.md`)
   - Paste into your AI assistant
   - Let the AI read your project files and execute

## Available Agents

| Agent         | Purpose                            | When to Use                             |
| ------------- | ---------------------------------- | --------------------------------------- |
| `cto.md`      | Architecture & tech decisions      | Starting a new project, major refactors |
| `planner.md`  | Task breakdown & planning          | Complex multi-step projects             |
| `backend.md`  | API, database, server logic        | Building backend services               |
| `frontend.md` | UI, components, styling            | Building user interfaces                |
| `database.md` | Schema design, queries, migrations | Database design & optimization          |
| `auth.md`     | Authentication & authorization     | Security & access control               |
| `devops.md`   | Deployment, CI/CD, infrastructure  | Production deployment                   |
| `reviewer.md` | Code review & quality check        | Before merging, quality audits          |
| `debugger.md` | Bug fixing & troubleshooting       | When things break                       |

## Usage Patterns

### Pattern 1: Copy & Paste

```bash
# Copy the agent prompt
cat .agents/backend.md | pbcopy

# Paste into your AI assistant with context:
# "Act as the backend.md agent. Here's my project context: [paste CONTEXT.md]"
```

### Pattern 2: Ultra-Dex CLI Helper

```bash
# List available agents
ultra-dex agents

# Copy agent to clipboard
ultra-dex agent backend

# Or print to stdout
ultra-dex agent backend --stdout
```

### Pattern 3: Fast Path (Recommended)

```bash
# Generate complete project from one sentence
ultra-dex generate "Task management SaaS with Stripe integration"

# Review existing code
ultra-dex review ./src
```

## Agent Philosophy

Ultra-Dex agents are **orchestrators, not executors**. They:

- ✅ Provide structured thinking frameworks
- ✅ Ensure no critical steps are missed
- ✅ Maintain quality standards
- ✅ Work with ANY AI assistant (Cursor, Claude, Devin, etc.)
- ✅ Keep humans in the loop for decisions

They do NOT:

- ❌ Replace human judgment
- ❌ Lock you into a specific AI vendor
- ❌ Add unnecessary complexity

## Integration with Ultra-Dex Methodology

Each agent aligns with the [34-section Ultra-Dex template](../docs/v1.0-master-orchestration.md) and ensures AI-generated code meets quality standards.

**Flow:**

```
Human: "Build X"
   ↓
Ultra-Dex: Generates plan (34 sections)
   ↓
Agent: Implements section with AI assistance
   ↓
Reviewer: Audits against 21-step verification
   ↓
Result: Production-ready code
```

## Customization

Feel free to modify agent prompts for your team's needs. The goal is consistency across AI interactions, not rigid adherence to templates.

---

**Next:** Choose an agent based on your current task, or use `ultra-dex generate` for instant projects.
