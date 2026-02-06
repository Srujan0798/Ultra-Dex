# Ultra-Dex Project Manifest

> **THE SOURCE OF TRUTH - READ THIS FIRST**
> Version: 3.4.5 | Updated: February 2, 2026

---

## 🎯 What We Are (In One Sentence)

**Ultra-Dex is the Meta-Orchestration Layer that gives AI tools memory, structure, and quality standards.**

We don't write code. We make sure AI-generated code doesn't suck.

---

## 🚫 What We Are NOT (Stop Misunderstanding This)

| ❌ We Are NOT         | ✅ We ARE                                              |
| --------------------- | ------------------------------------------------------ |
| A code generator      | A planning & orchestration framework                   |
| Competing with Cursor | Working WITH Cursor (and Claude, Copilot, GPT, Gemini) |
| An AI tool            | A layer ABOVE AI tools                                 |
| For MVPs/hackathons   | For production SaaS (3+ month timeline)                |
| A simple template     | A comprehensive 34-section system                      |
| Replaceable by Devin  | The memory Devin doesn't have                          |

---

## 🔒 SACRED PRINCIPLES (NEVER Compromise)

### 1. The 34-Section Template is NON-NEGOTIABLE

- **Why:** Production apps need comprehensive planning
- **Anti-pattern:** "Simplify to 10 sections for beginners"
- **Reality:** 34 sections IS the value proposition

### 2. The 21-Step Verification is MANDATORY

- **Why:** Prevents "forgot to handle X" disasters
- **Anti-pattern:** "21 steps is overkill"
- **Reality:** Production requires rigorous QA

### 3. AI-Agnostic by Design

- **Why:** Users choose their AI tools
- **Anti-pattern:** "Build our own AI"
- **Reality:** We ORCHESTRATE, not compete

### 4. Atomic Tasks (4-9 Hours)

- **Why:** Prevents hidden complexity
- **Anti-pattern:** "Add user management" (vague)
- **Reality:** "Implement Google OAuth with session management" (6h, specific)

### 5. Git-Versioned Context

- **Why:** Survives session amnesia
- **Anti-pattern:** Relying on AI chat history
- **Reality:** CONTEXT.md is the single source of truth

---

## 📊 Current State (As of Feb 2, 2026)

### What's WORKING (Production-Ready)

- ✅ **init** - Project scaffolding with 3 live templates
- ✅ **generate** - AI-powered 34-section plan generation
- ✅ **build** - Auto-pilot executes pending tasks
- ✅ **swarm** - 8-agent orchestration with parallel execution
- ✅ **serve** - MCP server + WebSocket + Dashboard (ports 3001/3002)
- ✅ **validate** - Project structure validation
- ✅ **dashboard** - Live web UI with real-time updates

### What's POSTPONED to Feb 14 (Valentine's Day Launch)

- ⚠️ 8 beta commands need polish (plan, workflows, suggest, audit, verify, exec, monitoring, advanced)
- ⚠️ 5 more example projects (AI SaaS, Analytics, API Platform, Microservices, Blockchain)
- ⚠️ VS Code extension sidebar completion
- ⚠️ Test coverage push (281 → 500+ tests)
- ⚠️ Marketing materials & website

### What's INTENTIONALLY Minimal

- Documentation beyond core flows (we have examples for that)
- Fancy UI (CLI-first, IDE-agnostic)
- Built-in AI (we orchestrate external AIs)

---

## 🎯 The Meta-Layer Position

```
┌─────────────────────────────────────────────────────────┐
│  LAYER 3: ULTRA-DEX (Meta-Orchestration)                │
│  Context + Plans + Verification + Agents + MCP Server   │
└─────────────────────────────────────────────────────────┘
         │              │              │              │
    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
    │ Claude  │    │ Cursor  │    │ Devin   │    │ Gemini  │
    │  Code   │    │   IDE   │    │   AI    │    │  Code   │
    └────▼────┘    └────▼────┘    └────▼────┘    └────▼────┘
         └──────────────┴──────────────┴──────────────┘
                    💻 PRODUCTION CODE 💻
```

**We OWN Layer 3. No one else does.**

---

## 🧠 The Memory Problem We Solve

**WITHOUT Ultra-Dex:**

```
Open AI tool → Work 2 hours → Close session → AI FORGETS EVERYTHING
Next day → Start from ZERO context
Week 2 → "Wait, what was the auth edge case again?"
Month 3 → Complete project amnesia
```

**WITH Ultra-Dex:**

```
CONTEXT.md holds all project knowledge (ALWAYS)
IMPLEMENTATION-PLAN.md tracks every decision (VERSIONED)
cursor-rules inject standards (EVERY SESSION)
21-step enforces quality (EVERY TASK)
ANY AI reads + continues seamlessly (NO LOCK-IN)
```

---

## 🎮 Quick Navigation

**New to the project?**

1. Read [01-WHAT-WE-ARE.md](./01-WHAT-WE-ARE.md) for the full philosophy
2. Check [04-AI-ONBOARDING.md](./04-AI-ONBOARDING.md) to get started as an agent
3. See [02-FEB-14-FOCUS.md](./02-FEB-14-FOCUS.md) for current priorities

**Looking for something?**

- CLI Commands: `cli/lib/commands/`
- Agent Prompts: `agents/`
- Templates: `@ ultra-dex/Saas plan/`
- Examples: `examples/`
- Reviews from other AIs: `archives/reviews/` (for reference only)

---

## 🚨 For AI Agents Reading This

**Before you suggest changes:**

1. Does it violate any SACRED PRINCIPLE above? → DON'T suggest it
2. Is it already in the Feb 14 postponed list? → DON'T suggest it now
3. Does it align with our meta-layer position? → OK to suggest
4. Does it add complexity without value? → DON'T suggest it

**When in doubt:** Ask before implementing.

---

_"We don't generate code. We make sure AI-generated code doesn't suck. We're the MEMORY for tools with AMNESIA."_
