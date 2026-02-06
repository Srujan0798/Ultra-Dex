# AI Agent Onboarding Guide

> **Welcome to Ultra-Dex! Read this before doing ANYTHING.**

---

## 🚨 STOP: Read These First (In Order)

Before you write a single line of code or suggest a single change:

1. **[00-PROJECT-MANIFEST.md](../00-PROJECT-MANIFEST.md)** - What we are and what we NEVER compromise on
2. **[01-WHAT-WE-ARE.md](../01-WHAT-WE-ARE.md)** - Full philosophy and positioning
3. **[02-FEB-14-FOCUS.md](../02-FEB-14-FOCUS.md)** - Current priorities and what's postponed
4. **[03-CONTEXT.md](../03-CONTEXT.md)** - Current project state

**Total reading time:** 15 minutes  
**Time saved from making wrong suggestions:** Infinite

---

## 🎯 What You Need to Know (TL;DR)

### We Are:

- A **Meta-Orchestration Layer** for AI development
- We give AI tools **memory, structure, and quality standards**
- We **don't write code** - we make sure AI-generated code doesn't suck

### We Are NOT:

- A code generator
- Competing with Cursor/Devin
- An AI model ourselves
- For MVPs (we're for production SaaS)

### Sacred Principles (NEVER Violate):

1. **34-Section Template** - Comprehensive by design
2. **21-Step Verification** - Production-grade quality
3. **AI-Agnostic** - Works with any AI tool
4. **Atomic Tasks** - 4-9 hours max per task
5. **Git-Versioned Context** - CONTEXT.md is truth

---

## 📁 Project Structure

```
Ultra-Dex/
├── 00-PROJECT-MANIFEST.md       ← READ THIS FIRST
├── 01-WHAT-WE-ARE.md            ← Philosophy
├── 02-FEB-14-FOCUS.md           ← Current priorities
├── 03-CONTEXT.md                ← Project state
│
├── cli/                         ← CLI Implementation
│   ├── bin/ultra-dex.js         ← Entry point (46 commands)
│   ├── lib/commands/            ← Command implementations
│   │   ├── init.js              ← Production-ready
│   │   ├── generate.js          ← Production-ready
│   │   ├── build.js             ← Production-ready
│   │   ├── swarm.js             ← Production-ready
│   │   ├── serve.js             ← Production-ready (MCP + WebSocket)
│   │   ├── validate.js          ← Production-ready
│   │   ├── dashboard.js         ← Production-ready
│   │   ├── plan.js              ← Beta (needs polish)
│   │   ├── workflows.js         ← Beta (needs polish)
│   │   ├── suggest.js           ← Beta (needs polish)
│   │   ├── audit.js             ← Beta (needs polish)
│   │   ├── verify.js            ← Beta (needs polish)
│   │   ├── exec.js              ← Beta (needs polish)
│   │   ├── monitoring.js        ← Beta (needs polish)
│   │   └── advanced.js          ← Beta (needs polish)
│   └── lib/mcp/                 ← MCP server implementation
│
├── agents/                      ← 17 AI Agent Prompts
│   ├── 00-AGENT_INDEX.md        ← Quick reference
│   ├── 0-orchestration/         ← Meta-Orchestrator, Orchestrator
│   ├── 1-leadership/            ← CTO, Planner, Research
│   ├── 2-development/           ← Backend, Frontend, Database
│   ├── 3-security/              ← Auth, Security
│   ├── 4-devops/                ← DevOps
│   ├── 5-quality/               ← Testing, Reviewer, Debugger, Documentation
│   └── 6-specialist/            ← Performance, Refactoring
│
├── @
│   ultra-dex/Saas\ plan/        ← Templates & Methodology
│   ├── 00-README.md             ← Navigation hub
│   ├── 01-QUICK-START.md        ← 5-minute entry
│   ├── 02-HOW-TO-USE.md         ← Phased approach
│   ├── 03-METHODOLOGY.md        ← 21-step system
│   ├── 04-Imp-Template.md       ← 34-section template
│   └── Examples/                ← 3 complete examples
│       ├── TaskFlow-Complete.md
│       ├── InvoiceFlow-Complete.md
│       └── HabitStack-Complete.md
│
├── cursor-rules/                ← 31 .mdc files for Cursor AI
├── examples/                    ← Working example projects
├── docs/                        ← Documentation & guides
├── marketing/                   ← Launch materials
├── archives/                    ← Old reports (reference only)
└── Reviews/                     ← Other AI reviews (reference only)
```

---

## 🎮 Current State (As of Feb 2, 2026)

### Production-Ready Commands (7):

These work. Don't break them.

- `init` - Project scaffolding
- `generate` - AI plan generation
- `build` - Auto-pilot execution
- `swarm` - Multi-agent orchestration
- `serve` - MCP server + Dashboard
- `validate` - Project validation
- `dashboard` - Web UI

### Beta Commands (8) - NEED POLISH:

These exist but need work for Feb 14:

- `plan` - Project planning with Gantt charts
- `workflows` - Workflow templates
- `suggest` - AI suggestions
- `audit` - Security/quality audit
- `verify` - 21-step verification
- `exec` - Safe code execution
- `monitoring` - System monitoring
- `advanced` - Advanced features

### Development Commands (18):

These are stubs/placeholders:

- `auto-implement`, `ci-monitor`, `cloud`, `brain`, `github`, `search`, etc.

---

## 🎯 Your Role as an Agent

### When You Join This Project:

**Step 1: Understand the Context**

- Read the 4 core files (15 min)
- Check [02-FEB-14-FOCUS.md](../02-FEB-14-FOCUS.md) for current priorities
- Look at what's ALREADY DONE vs what needs work

**Step 2: Ask Before Implementing**

- "Is this change aligned with our sacred principles?"
- "Is this in the Feb 14 scope?"
- "Does it make a beta command production-ready?"

**Step 3: Follow the Methodology**

- All tasks must be 4-9 hours (atomic)
- All code must pass 21-step verification
- All changes must be git-versioned
- All agents must be AI-agnostic

---

## 🚫 Anti-Patterns (NEVER Do These)

### Code Changes:

- ❌ Simplify 34 sections to "make it easier"
- ❌ Remove 21-step verification as "overkill"
- ❌ Build our own AI model
- ❌ Compete with Cursor/Devin
- ❌ Add features not in Feb 14 scope
- ❌ Break working production commands

### Agent Behavior:

- ❌ Assume we want to be "simpler"
- ❌ Suggest removing constraints
- ❌ Propose competing with our partners
- ❌ Ignore the meta-layer positioning
- ❌ Think we want to replace AI tools

### Project Management:

- ❌ Skip reading the manifest
- ❌ Work on postponed items
- ❌ Break existing functionality
- ❌ Add complexity without value

---

## ✅ Good Patterns (DO These)

### Code Changes:

- ✅ Make beta commands production-ready
- ✅ Add tests for existing functionality
- ✅ Create the 5 missing examples
- ✅ Document the 34 commands
- ✅ Fix bugs in production commands
- ✅ Follow the 21-step verification

### Agent Behavior:

- ✅ Ask clarifying questions
- ✅ Verify alignment with principles
- ✅ Respect the meta-layer position
- ✅ Work WITH other AI tools
- ✅ Keep context in git-versioned files

### Project Management:

- ✅ Read all 4 core files first
- ✅ Focus on Feb 14 priorities
- ✅ Preserve working functionality
- ✅ Add value, not complexity

---

## 🎓 Quick Reference

### Commands Status:

```bash
# Production-Ready (7):
npx ultra-dex init           # ✓ Works
npx ultra-dex generate       # ✓ Works
npx ultra-dex build          # ✓ Works
npx ultra-dex swarm          # ✓ Works
npx ultra-dex serve          # ✓ Works (MCP + WebSocket)
npx ultra-dex validate       # ✓ Works
npx ultra-dex dashboard      # ✓ Works

# Beta (8) - Needs Polish:
npx ultra-dex plan           # ⚠️ Needs work
npx ultra-dex workflows      # ⚠️ Needs work
npx ultra-dex suggest        # ⚠️ Needs work
npx ultra-dex audit          # ⚠️ Needs work
npx ultra-dex verify         # ⚠️ Needs work
npx ultra-dex exec           # ⚠️ Needs work
npx ultra-dex monitoring     # ⚠️ Needs work
npx ultra-dex advanced       # ⚠️ Needs work

# Development (18) - Placeholders:
npx ultra-dex auto-implement # 🚧 Stub
npx ultra-dex ci-monitor     # 🚧 Stub
# ... etc
```

### Agent Tiers:

| Tier          | Agents                                         | When to Use                 |
| ------------- | ---------------------------------------------- | --------------------------- |
| Orchestration | @Meta-Orchestrator, @Orchestrator              | Complex multi-repo projects |
| Leadership    | @CTO, @Planner, @Research                      | Architecture decisions      |
| Development   | @Backend, @Frontend, @Database                 | Core implementation         |
| Security      | @Auth, @Security                               | Authentication & audits     |
| DevOps        | @DevOps                                        | Deployment & CI/CD          |
| Quality       | @Testing, @Reviewer, @Debugger, @Documentation | QA & review                 |
| Specialist    | @Performance, @Refactoring                     | Optimization                |

---

## 📞 When in Doubt

**Ask these questions:**

1. "Does this violate any sacred principle?"
   - If YES → Don't do it
   - If NO → Continue

2. "Is this in the Feb 14 scope?"
   - If YES → Priority it
   - If NO → Postpone it

3. "Does it make a beta command production-ready?"
   - If YES → High priority
   - If NO → Lower priority

4. "Does it align with our meta-layer position?"
   - If YES → Good
   - If NO → Reconsider

---

## 🎉 Welcome to the Team!

You're now part of building the **Kubernetes of AI Coding**.

Remember: **We don't generate code. We make sure AI-generated code doesn't suck.**

**Start here:**

1. Read the 4 core files (15 min)
2. Check [FEB-14-FOCUS.md](../FEB-14-FOCUS.md) for current tasks
3. Pick a beta command to polish
4. Follow the 21-step verification
5. Git commit with clear messages

**Questions?** Check the agent prompts in `agents/` for guidance.

---

_"We are the MEMORY for tools with AMNESIA."_
