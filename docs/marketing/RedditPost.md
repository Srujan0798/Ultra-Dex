# 📣 Ultra-Dex Reddit Posts

> **Last Updated:** Feb 6, 2026

---

# v3.7 Post (r/programming) - LATEST

**Date:** Feb 5, 2026 (17h ago)
**Subreddit:** r/programming
**Author:** u/Vegetable-Cat114
**Status:** Removed by Reddit filters (but comments still active)
**Comments:** 2

## Title
**Solving "AI Amnesia": Building a persistent state layer for LLM-assisted engineering**

## Body

Hey r/programming,

I've been working on the problem of "context drift" in AI-assisted coding. Even with tools like Cursor or Claude Code, there's a recurring issue: as a project scales, the AI begins to "hallucinate" architectural decisions or forget the original implementation plan, leading to technical debt that only becomes apparent after several iterations.

I built Ultra-Dex as a CLI meta-layer to address this. I wanted to share the technical approach I used to solve persistent context across different AI tools (Claude, GPT, Cursor) using a shared memory graph.

**The Core Technical Challenges:**

1. **Ephemeral Session State:** LLMs treat each chat as a fresh slate. To fix this, I implemented a Standardized Context Format (UDCF). It's a markdown-based state machine that the CLI syncs between the local codebase and the LLM's active prompt.

2. **Architectural Enforcement:** Most AI agents drift from the plan because they lack a "skeleton" to follow. Ultra-Dex uses a 34-section state-aware template. When an agent runs, the CLI pre-validates the codebase against the plan sections, forcing the agent to adhere to established patterns (like Zod schemas or Prisma models) before it even generates a line of code.

3. **The "Verify" Loop:** Building an autonomous self-healing loop. The CLI implements a 21-step verification framework that runs in a Docker sandbox. If a test fails, it doesn't just show an error; it feeds the stack trace back to a specialized @Debugger agent to attempt an autonomous fix.

4. **Multi-Agent Orchestration via MCP:** We implemented the Model Context Protocol (MCP) to allow tools like Cursor or Claude Desktop to query the project's internal Knowledge Graph directly. This turns the codebase into a queryable database for the AI.

**Lessons Learned:**
The biggest takeaway was that code generation is the easy part. The hard part is state management for agents. By moving the "brain" of the project out of the LLM and into a CLI-managed graph, we reduced architectural drift by ~70% in our internal benchmarks.

I've open-sourced the orchestration layer and the agent tiers. I'd love to hear how others are handling architectural memory in their AI workflows.

**Tech Stack:** Node.js, TypeScript, Docker (for sandboxing), LangGraph for state machines.

**GitHub:** https://github.com/Srujan0798/Ultra-Dex

---

# v3.5 Post (r/programming)

**Date:** Feb 4, 2026 (2d ago)
**Subreddit:** r/programming
**Author:** u/Vegetable-Cat114
**Status:** Removed by Reddit filters
**Comments:** 4

## Title
**Ultra-Dex v3.5 - AI orchestration with 17 agents**

## Body

I've been spending the last few months building with Claude Code, Cursor, and various autonomous agents. While the "single-prompt-to-code" loop is getting better, I keep hitting the same wall: AI Amnesia.

As soon as a project hits a certain level of complexity (5+ database tables, complex auth, or long debugging sessions), the agents start to lose the architectural thread. They forget the constraints we set 100 prompts ago and start introducing technical debt or contradicting the original plan.

I built Ultra-Dex to solve this. It's an open-source (MIT) meta-orchestration layer that sits above your AI tools to act as a "Headless CTO" and maintain architectural memory.

**The Problem: The "Human Middleware"**
Right now, developers act as the clipboard between tools—copying the plan from a README into a prompt, then copying the error log back to the plan. Ultra-Dex automates this context loop.

**How it works:**
Instead of just sending isolated prompts, you use an Active Kernel (MCP) that maintains your project state in versioned Markdown (CONTEXT.md, IMPLEMENTATION-PLAN.md) and SQLite.

**Technical Highlights:**
- **17 Specialized Agents:** Organized into 7 tiers (Leadership, Implementation, Security, Quality, etc.).
- **Active Kernel (MCP):** A Model Context Protocol server that injects your plan and project graph directly into Claude Desktop or Cursor.
- **61 CLI Commands:** Beyond just code gen, it handles swarm execution (parallel loops), audit (alignment scoring), and integrate (automated SDK setup).
- **Autonomous Self-Healing:** A watch mode that detects test failures and automatically triggers a @Debugger agent to fix and verify without user intervention.
- **Docker Sandbox:** Safely executes and tests generated code before it touches your host OS.

**Getting Started:**
```bash
npx ultra-dex init
```

**GitHub:** https://github.com/Srujan0798/Ultra-Dex

---

**GitHub:** https://github.com/Srujan0798/Ultra-Dex
