# Ultra-Dex

[![npm version](https://img.shields.io/npm/v/ultra-dex.svg)](https://www.npmjs.com/package/ultra-dex)
[![CI Status](https://github.com/Srujan0798/Ultra-Dex/actions/workflows/ci.yml/badge.svg)](https://github.com/Srujan0798/Ultra-Dex/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-90%25-brightgreen.svg)](./cli/package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](./cli/tsconfig.json)
[![Tests](https://img.shields.io/badge/Tests-300+-brightgreen.svg)](./cli/test/README.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![Template](https://img.shields.io/badge/Template-34_Sections-blue.svg)](./@%20ultra-dex/Saas%20plan/04-Imp-Template.md)
[![Cursor Rules](https://img.shields.io/badge/Cursor_Rules-31_Modules-green.svg)](./cursor-rules/)
[![AI Agents](https://img.shields.io/badge/AI_Agents-18_Prompts-orange.svg)](./agents/)
[![Commands](https://img.shields.io/badge/CLI_Commands-50+-blue.svg)](./cli/)

> **The Autonomous OS for Software Engineering — The Headless CTO.**

---


## 📖 New Here? Start with [00-START/README.md](./00-START/README.md)

**Don't read this long README first.** Read the 6 core docs in `00-START/` folder (takes 15 minutes):
1. [START-HERE.md](./00-START/START-HERE.md) — Reading Guide
2. [00-PROJECT-MANIFEST.md](./00-START/00-PROJECT-MANIFEST.md) — Sacred Principles
3. [01-WHAT-WE-ARE.md](./00-START/01-WHAT-WE-ARE.md) — Philosophy
4. [02-FEB-14-FOCUS.md](./00-START/02-FEB-14-FOCUS.md) — Launch Roadmap
5. [03-CONTEXT.md](./00-START/03-CONTEXT.md) — System State
6. [04-AI-ONBOARDING.md](./00-START/04-AI-ONBOARDING.md) — For AI Agents

---

## 🚀 NEW: Ultra-Dex v3.5.0 (The Professional Standard)

**Valentine's Day Launch — "Fall in Love with Building SaaS Again"**

Ultra-Dex v3.5.0 introduces **Autonomous Self-Healing**, **Voice-to-Plan**, and **LangGraph Native Integration**. The CLI has been completely refactored with a Professional UI/UX, unified design system, and strict security sandboxing.

```bash
# Start the Interactive Dashboard (Conversational Interface)
npx ultra-dex

# Voice-to-Plan: Convert speech to blueprints
npx ultra-dex voice "Build a finance SaaS with Next.js"

# Run autonomous self-healing test loops
npx ultra-dex autonomous --fix --watch

# Analyze the impact of changing a file
npx ultra-dex search --impact "src/lib/auth.ts"

# Show realistic effort estimates based on methodology
npx ultra-dex plan --estimate

# Manage project workspaces and identity
npx ultra-dex auth login
npx ultra-dex workspace switch "my-pro-project"
```

**50+ commands. 18 production-ready agents. MCP integration. Autonomous Self-Healing.**

---

## ✨ v3.5.0 Feature Highlights

### **1. Autonomous Intelligence (Wave 6)**
- **Self-Healing Loop** — Automatically detects build/test failures and triggers @Debugger to fix them.
- **Code Impact Analysis** — Predict downstream breakages across the Code Property Graph (CPG).
- **Cognitive Link** — Persistent memory across sessions using Vector Store embeddings.

### **2. Professional UI/UX (CLI 4.0)**
- **Conversational Interface** — NLP intent routing allows natural language commands.
- **Interactive Dashboard** — Real-time project status, alignment scores, and agent activity.
- **Themed Design System** — Unified professional "Purple Edition" visuals with high-fidelity headers.
- **"Did you mean?"** — Graceful handling of command typos with smart suggestions.

### **3. Enterprise Security**
- **Strict Sandbox Enforcement** — Force all agent-run shell commands through isolated Docker containers.
- **Grade A Audit Framework** — 90% benchmark for documentation, structure, and security.
- **Identity Profiles** — Manage local and cloud sessions with `ultra-dex auth`.

### **4. Connectivity & Ecosystem**
- **LangGraph Native** — Export Ultra-Dex swarm pipelines as state-machine graphs.
- **Agent Marketplace** — Browse and install community-contributed specialist agents.
- **MCP Portal** — Seamless integration with Cursor, Claude Code, and Windsurf.

---

## 🏗️ Architecture & Components

### **AI Agent Ecosystem**
Ultra-Dex orchestrates 18 specialized AI agents organized in 6 tiers:

**Leadership Tier**: @CTO, @Planner, @Research
**Development Tier**: @Backend, @Frontend, @Database
**Security Tier**: @Auth, @Security
**DevOps Tier**: @DevOps
**Quality Tier**: @Testing, @Documentation, @Reviewer, @Debugger
**Specialist Tier**: @Performance, @Refactoring
**Orchestration Tier**: @Orchestrator

### **Multi-Agent Swarms**
Coordinate multiple specialized agents for complex tasks:
```bash
# Run an autonomous agent swarm
ultra-dex swarm "Build user authentication system"

# This triggers: @Planner → @CTO → @Database → @Backend → @Frontend → @Security → @Reviewer → @DevOps
```

### **Verification Framework**
Every task follows a 21-step verification framework ensuring production-ready quality:
1. Atomic Scope Defined
2. Context Loaded
3. Architecture Alignment
4. Security Patterns Applied
5. Type Safety Check
6. Error Handling Strategy
7. API Documentation Updated
8. Database Schema Verified
9. Environment Variables Set
10. Implementation Complete
11. Console Logs Removed
12. Edge Cases Handled
13. Performance Check
14. Accessibility (A11y) Check
15. Cross-browser Check
16. Unit Tests Passed
17. Integration Tests Passed
18. Linting & Formatting
19. Code Review Approved
20. Migration Scripts Ready
21. Deployment Readiness

---

## 🤔 Is Ultra-Dex Right for You?

**✅ YES if:**
- You are building a production-grade SaaS, not a weekend prototype.
- You use multiple AI tools (Claude, GPT, Cursor) and need shared context.
- You want to automate the "Verify" loop (Testing, Linting, Security).
- You need a structured skeleton that agents can't "drift" from.
- You're working on complex projects with 5+ database tables or microservices.

**❌ NO if:**
- You prefer ad-hoc, unstructured prompting.
- You are building a static landing page or simple script.
- You don't care about architectural integrity or long-term maintenance.
- You're working on a simple CRUD app with <3 features.

---

## 🧠 Meta-Layer Philosophy: Your Skeleton, Not Your Cage

Ultra-Dex provides the **backbone** for AI-driven development. It solves "AI Amnesia" by giving every LLM a shared, transparent structure to follow via the 34-section template.

```
┌─────────────────────────────────────────────────────────┐
│  YOUR IDEA  +  ANY AI/LLM  +  ULTRA-DEX STRUCTURE      │
│                      ↓                                  │
│            STRUCTURED IMPLEMENTATION PLAN               │
│                      ↓                                  │
│            PRODUCTION-READY APPLICATION                 │
└─────────────────────────────────────────────────────────┘
```

**AI-Agnostic**: Works with Claude, GPT, Gemini, Cursor, Copilot
**Comprehensive by Design**: 34 sections prevent "forgot to plan X" syndrome
**100% Flexible**: Add, remove, modify any section to fit your needs
**Production-Grade**: Not for MVPs - for real, scalable applications

---

## 📈 Performance & Reliability

- **46+ CLI commands** with comprehensive functionality
- **281+ passing tests** ensuring stability
- **0 ESLint warnings** for code quality
- **Circuit breaker patterns** to prevent cascading failures
- **Caching systems** for improved performance
- **Proper error recovery mechanisms**

---

## 🆘 Support & Resources

- **Main Repo:** [GitHub](https://github.com/Srujan0798/Ultra-Dex)
- **Documentation:** [APIDOC.md](./APIDOC.md) | [USER-GUIDE.md](./docs/USER-GUIDE.md)
- **Roadmap:** [ROADMAP.md](./docs/ROADMAP.md)
- **Issues:** [Report Bug](https://github.com/Srujan0798/Ultra-Dex/issues)
- **VS Code Extension:** [Marketplace](https://marketplace.visualstudio.com/items?itemName=SrujanSaiKarna.ultra-dex-vscode)

---

**Ready for launch on February 14, 2026** 💝

**"Ultra-Dex: The Headless CTO for your SaaS."**
