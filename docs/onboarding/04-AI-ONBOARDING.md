# AI Agent Onboarding Guide

> **Welcome to Ultra-Dex! Read this before doing ANYTHING.**

---

## 🚨 STOP: Read These First (In Order)

Before you write a single line of code or suggest a single change:

1. **[00-PROJECT-MANIFEST.md](./00-PROJECT-MANIFEST.md)** - What we are and what we NEVER compromise on
2. **[01-WHAT-WE-ARE.md](./01-WHAT-WE-ARE.md)** - Full philosophy and positioning
3. **[02-FEB-14-FOCUS.md](./02-FEB-14-FOCUS.md)** - Current priorities and final countdown
4. **[03-CONTEXT.md](./03-CONTEXT.md)** - Current project state

**Total reading time:** 15 minutes  
**Time saved from making wrong suggestions:** Infinite

---

## 🎯 What You Need to Know (TL;DR)

### We Are:

- A **Meta-Orchestration Layer** for AI development.
- The **Cognitive Core** that gives AI tools memory, structure, and quality standards.
- We **don't just generate code** - we ensure it is production-grade and secure.

### We Are NOT:

- A simple wrapper or template.
- Competing with Cursor/Devin (we are the meta-layer above them).
- For weekend hackathons (we're for professional SaaS engineering).

### Sacred Principles (NEVER Violate):

1. **34-Section Template** - Our architectural backbone.
2. **21-Step Verification** - Production-grade quality protocol.
3. **AI-Agnostic** - Works with any model or tool.
4. **Atomic Tasks** - 4-9 hours max per task to prevent drift.
5. **Git-Versioned Context** - `CONTEXT.md` is the project Mind.

---

## 📁 Project Structure (v6.0.0)

```
Ultra-Dex/
├── onboarding/                  ← READ THIS FIRST
├── cli/                         ← The Core Engine (145+ commands)
│   ├── bin/ultra-dex.js         ← Entry point
│   ├── lib/commands/            ← Command logic (100% Real)
│   ├── lib/mcp/                 ← Context Bus & Protocol
│   └── lib/agents/              ← Swarm & Persona logic
│
├── docs/                        ← The Knowledge Base
│   ├── AgPrompts/               ← THE BRAIN (System Prompts)
│   ├── architecture/            ← System Design specs
│   └── guides/                  ← User manuals
│
├── apps/                        ← Ecosystem Platforms
│   ├── dashboard/               ← React Cloud UI
│   ├── desktop/                 ← Electron Native App
│   └── mobile/                  ← React Native App
│
├── packages/                    ← SDKs & Plugins
│   ├── sdk/                     ← Agent Development Kit
│   └── extensions/              ← IDE Plugins (VS Code/JetBrains)
│
└── templates/                   ← SaaS Blueprints & Scaffolds
```

---

## 🎮 Current State (As of Feb 10, 2026)

### Production-Ready Infrastructure:

- ✅ **Singularity Engine** - 1000% efficiency breakthrough.
- ✅ **P2P Swarm Network** - Decentralized agent coordination.
- ✅ **Autonomous Self-Healing** - Background fix loops active.
- ✅ **Persistent Memory Graph** - Multi-hop RAG implementation.
- ✅ **Protocol 21** - Programmatic verification enforcement.

---

## 🎯 Your Role as an Agent

### When You Join This Project:

**Step 1: Assume the Persona**

- Load the relevant prompt from `docs/AgPrompts/core-systems/` (e.g., `CODER-PROMPT.md`).
- Respect the "Brutal Standard" of your assigned role.

**Step 2: Load the Law**

- Consult the technical specs in `docs/AgPrompts/core-systems/` (e.g., `QA_SPEC.md`).
- Never suggest changes that bypass these specifications.

**Step 3: Verify Everything**

- Run `ultra-dex verify --full` after every modification.
- Zero warnings are tolerated in the production branch.

---

## 🚫 Anti-Patterns (NEVER Do These)

### Code Changes:

- ❌ Adding `TODO` or `FIXME` without immediate tracking.
- ❌ Hardcoding secrets or environment-specific values.
- ❌ Bypassing the Docker sandbox for shell execution.
- ❌ Creating large, monolithic files (> 200 lines).

### Agent Behavior:

- ❌ "I think this is enough" (Always run exhaustive verification).
- ❌ "This is just a prototype" (Build like it will survive a nuclear war).
- ❌ Hallucinating library versions (Verify with `npm info` first).

---

## ✅ Good Patterns (DO These)

### Code Changes:

- ✅ Write tests before or alongside implementation.
- ✅ Add TSDoc/JSDoc to every exported function.
- ✅ Use atomic commits with conventional messages.
- ✅ Implement self-healing logic for all API calls.

### Agent Behavior:

- ✅ Backtrack on bad decisions using MCTS reasoning.
- ✅ Cross-check with the Decision Ledger before changing architecture.
- ✅ Proactively update `CONTEXT.md` on significant milestones.

---

## 🎉 Welcome to the Singularity!

You're now part of building the **Cognitive Operating System for Software Engineering**.

Remember: **We don't write code. We orchestrate the future of engineering.**

**Ready? Start with [00-PROJECT-MANIFEST.md](./00-PROJECT-MANIFEST.md)**