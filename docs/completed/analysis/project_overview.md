# Ultra-Dex: Project Overview (Fresh Perspective)

> **"We are not the Architect. We are the Physics Engine that prevents the Architect's building from falling down."**

---

## 🎯 THE PROBLEM WE SOLVE

**AI Amnesia:** Claude, Cursor, Copilot forget everything between sessions.

- You explain the architecture → AI forgets it
- You set constraints → AI ignores them 100 prompts later
- You debug for hours → AI introduces the same bug again

**Result:** Developers become "human middleware" - copying context between tools.

---

## 💡 THE SOLUTION

**Ultra-Dex = Memory + Structure + Quality for AI Development**

| Component | What It Does |
|-----------|--------------|
| **CONTEXT.md** | Version-controlled memory (auditable via git diff) |
| **18 Agents** | Specialized AI roles (CTO, Backend, Security, etc.) |
| **50+ Commands** | CLI for orchestration, verification, generation |
| **34-Section Template** | Structure for complex SaaS implementation |
| **21-Step Verification** | Quality gates before code is "done" |
| **MCP Server** | Integration with Cursor, Claude Code, Windsurf |

---

## 🏗️ ARCHITECTURE

```
Ultra-Dex/
├── cli/                 # 638 files - THE CORE
│   ├── bin/             # Entry point (ultra-dex.js)
│   ├── lib/commands/    # 50+ CLI commands
│   ├── lib/mcp/         # Model Context Protocol server
│   ├── lib/providers/   # OpenAI, Anthropic, Google, Ollama
│   └── lib/swarm/       # Multi-agent orchestration
├── agents/              # 18 specialized AI agent prompts
├── cursor-rules/        # 43 .mdc rules for Cursor IDE
├── docs/                # 106 documentation files
├── vscode-extension/    # VS Code sidebar integration
└── templates/           # Project scaffolding templates
```

---

## 🔥 CORE COMMANDS

```bash
# Start everything
npx ultra-dex init                    # Initialize project

# AI Orchestration
npx ultra-dex swarm "Build auth"      # Multi-agent execution
npx ultra-dex run @backend            # Single agent run
npx ultra-dex voice "Build a SaaS"    # Voice-to-plan

# Quality
npx ultra-dex audit                   # Project health check
npx ultra-dex verify --live           # Automated quality gates
npx ultra-dex align                   # Context alignment score

# Development
npx ultra-dex serve                   # MCP server (port 3001)
npx ultra-dex build                   # Execute next task
npx ultra-dex watch                   # Auto-execute on changes
```

---

## 🆚 COMPETITIVE POSITIONING

| Tool | What They Do | Our Relationship |
|------|--------------|------------------|
| **Cursor** | IDE with AI | We are their memory |
| **Devin** | Full agent | We give it structure |
| **Claude Code** | Codebase agent | We prevent its amnesia |
| **Bolt.new** | Quick prototypes | We productionize |

**We are the META-LAYER that sits above all tools.**

---

## 📊 CURRENT STATUS (v3.5.0 → v3.6.0)

| Category | Status |
|----------|--------|
| **Published** | ultra-dex@3.5.0 on npm |
| **Commands** | 50+ working |
| **Agents** | 18 tiered |
| **Tests** | 300+ passing |
| **Coverage** | ~90% |

### v3.6.0 In Progress (8 terminals)
- Voice-to-Plan ✅ Pushed
- Live Boilerplate ✅ Pushed
- PTY Mode ✅ Done
- Graph RAG ✅ Done
- Active Verification 🔄
- React Ink UI 🔄
- ACP Support 🔄
- Agent Governance 🔄

---

## 🎯 THE PHILOSOPHY

### "Glass Box" vs "Black Box"
- **Black Box (others):** AI manages context invisibly
- **Glass Box (us):** Context is static Markdown, auditable via git

### "Skeleton, Not Cage"
- We don't restrict creativity
- We provide structure that prevents chaos
- AI can still do anything, but within a trackable framework

### Key Principles
1. **Version-Controlled Context** - Not chat history
2. **Atomic Tasks** - Fresh context per task, no bleed
3. **Human Loop** - Verify after each "atom" of work
4. **Quality Gates** - 21 steps before "done"

---

*Ultra-Dex is "The Headless CTO" - infrastructure that makes AI tools production-ready.*
