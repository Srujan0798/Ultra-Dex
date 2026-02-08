# Ultra-Dex Project Manifest

> **THE SOURCE OF TRUTH - READ THIS FIRST**
> **Current Version:** 4.3.0 (Headless CTO) | **Updated:** February 8, 2026

---

## 🛡️ VERSIONING AUTHORITY (Mandatory for All Agents)

**This file is the absolute source of truth.** If another file or agent claims a different version, they are WRONG. 

| Phase | Version | Status | Focus |
| :--- | :--- | :--- | :--- |
| **Current** | **v4.3.0** | ✅ **ACTIVE** | REPL, Docker Sandbox, Fixed Streaming, 43Reviews fixes. |
| **Target** | **v4.4.0** | 🚀 **UPCOMING** | Visual Swarm UI, Automated ADR Enforcement. |
| **Future** | **v5.0.0** | 🔮 **PLANNING** | Cognitive Core, Neuro-Symbolic Planning, Native Voice. |

**Agent Directive:** You MUST check this manifest before performing any action. All metadata, package files, and documentation MUST align with the versions listed here.

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

## 📊 Current State (As of Feb 8, 2026)

### What's WORKING (10/10 REPAIRED)

- ✅ **REPL Mode** - CLI defaults to interactive persistent session.
- ✅ **Docker Sandbox** - Secure execution via `ultra-dex exec`.
- ✅ **Real-time Streaming** - Vercel AI SDK integration.
- ✅ **MCP Active Kernel** - Live context bus for Claude/Cursor.
- ✅ **34-Section Blueprint** - AI-powered plan generation.
- ✅ **Swarm Orchestration** - Multi-agent parallel task execution.
- ✅ **21-Step Verification** - Programmatic quality enforcement.

### What's POSTPONED / TARGET v4.4

- ⚠️ Visual Dashboard UI (React-based)
- ⚠️ Plugin Marketplace remote registry
- ⚠️ Native Whisper integration (Voice)
- ⚠️ Test coverage push to 70%+ (Current: 41%)

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