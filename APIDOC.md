# Ultra-Dex API & CLI Reference (v3.4.3)

> **The Headless CTO for your SaaS.**
> Comprehensive documentation for all 50+ commands available in the Ultra-Dex CLI.

---

## 📚 Table of Contents

1. [Core Workflow](#core-workflow)
2. [AI Agents & Swarms](#ai-agents--swarms)
3. [Project Management](#project-management)
4. [Quality & Verification](#quality--verification)
5. [Monitoring & Health](#monitoring--health)
6. [Advanced Features](#advanced-features)
7. [System & Configuration](#system--configuration)

---

## 🚀 Core Workflow

Essential commands for starting and building projects.

### `init`
Initialize a new Ultra-Dex project.
```bash
npx ultra-dex init [name]
# Options:
#   --live      Use a live scaffold template (Next.js/Remix)
#   --preview   Preview changes without writing
```

### `generate`
Generate a comprehensive implementation plan from a simple idea.
```bash
npx ultra-dex generate "A marketplace for dog sitters"
# Options:
#   --provider  AI provider (claude, openai, gemini)
#   --dry-run   Estimate cost without generating
```

### `build`
Interactive AI-assisted development mode. Auto-loads project context.
```bash
npx ultra-dex build
# Options:
#   --cursor    Open generated prompt in Cursor
#   --copy      Copy prompt to clipboard
```

### `review`
AI-powered code review and architectural analysis.
```bash
npx ultra-dex review
# Options:
#   --quick     Fast structure check
#   --json      Output as JSON
```

### `serve`
Start the Unified Active Kernel (MCP Server + Dashboard + Real-time Stream).
```bash
npx ultra-dex serve
# Options:
#   --port      Port to listen on (default: 3001)
```

---

## 🤖 AI Agents & Swarms

Orchestrate AI workers to perform complex tasks.

### `agents`
List available AI agents and their capabilities.
```bash
npx ultra-dex agents
```

### `run`
Execute a specific agent on a task.
```bash
npx ultra-dex run <agent> --task "Build login form"
# Example: npx ultra-dex run backend --task "Create auth API"
```

### `swarm`
Run an autonomous multi-agent pipeline (Planner → CTO → Builders).
```bash
npx ultra-dex swarm "Implement Stripe payments"
# Options:
#   --parallel  Run implementation agents concurrently
#   --dry-run   Preview the plan without executing
```

### `autonomous` (New in v3.4.3)
Self-healing mode that detects errors and auto-fixes them.
```bash
npx ultra-dex autonomous
# Options:
#   --watch     Continuously monitor and heal
#   --fix       Auto-apply fixes
```

### `suggest`
Get AI context-aware suggestions for your next task.
```bash
npx ultra-dex suggest
```

---

## 📋 Project Management

Manage plans, workflows, and workspaces.

### `plan`
Visualize and manage your project timeline.
```bash
npx ultra-dex plan
# Options:
#   --gantt     Show ASCII Gantt chart
#   --timeline  Show milestone timeline
#   --generate  Regenerate markdown plan
```

### `workflow`
Visualize and start predefined implementation workflows.
```bash
npx ultra-dex workflow <name>
# Options:
#   --viz       Visualize the workflow graph
#   --start     Add workflow steps to your plan
```

### `workspace` (New in v3.4.3)
Manage multiple projects from a global registry.
```bash
npx ultra-dex workspace list
npx ultra-dex workspace add .
```

### `status`
Show high-level project status and alignment score.
```bash
npx ultra-dex status
```

---

## 🛡️ Quality & Verification

Ensure your code meets production standards.

### `audit`
Deep project audit for security, quality, and documentation.
```bash
npx ultra-dex audit
# Options:
#   --report    Generate JSON report
```

### `verify`
Run the 21-Step Verification Framework.
```bash
npx ultra-dex verify
```

### `validate`
Check project structure and file integrity.
```bash
npx ultra-dex validate
# Options:
#   --scan      Deep code quality scan
```

### `exec`
Run code safely in a Docker sandbox.
```bash
npx ultra-dex exec script.js
# Options:
#   --safe      Block dangerous patterns
#   --network   Allow network access
```

### `pre-commit`
Run quality checks before git commit.
```bash
npx ultra-dex pre-commit
```

---

## 📊 Monitoring & Health

Real-time system observability.

### `metrics`
Show system performance metrics.
```bash
npx ultra-dex metrics
# Options:
#   --watch     Real-time dashboard
#   --export    Export to JSON/CSV
```

### `dashboard`
Launch the web-based "God Mode" dashboard.
```bash
npx ultra-dex dashboard
```

### `doctor`
Diagnose system issues and configuration.
```bash
npx ultra-dex doctor
```

### `health`
Check service health status.
```bash
npx ultra-dex health
```

---

## ⚙️ System & Configuration

Configure the Ultra-Dex environment.

### `config`
Manage CLI configuration.
```bash
npx ultra-dex config
# Options:
#   --mcp       Generate Claude Desktop config
#   --set       Set config value
```

### `plugin`
Manage Ultra-Dex plugins.
```bash
npx ultra-dex plugin list
npx ultra-dex plugin install <path>
```

### `upgrade`
Update Ultra-Dex to the latest version.
```bash
npx ultra-dex upgrade
```

### `batch`
Execute a sequence of commands from a file.
```bash
npx ultra-dex batch ./commands.txt
```

---

## 🔗 Integrations

### `github`
GitHub integration for issues and PRs.
```bash
npx ultra-dex github
```

### `cloud`
Connect to Ultra-Dex Cloud features.
```bash
npx ultra-dex cloud
```

---

*Generated for Ultra-Dex v3.4.3*
