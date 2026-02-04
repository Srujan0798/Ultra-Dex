# Reddit Post: r/programming

**Title:** Show r/programming: Ultra-Dex v3.5 - AI orchestration with 17 agents

**Content:**

I’ve been spending the last few months building with Claude Code, Cursor, and various autonomous agents. While the "single-prompt-to-code" loop is getting better, I keep hitting the same wall: **AI Amnesia.**

As soon as a project hits a certain level of complexity (5+ database tables, complex auth, or long debugging sessions), the agents start to lose the architectural thread. They forget the constraints we set 100 prompts ago and start introducing technical debt or contradicting the original plan.

I built **Ultra-Dex** to solve this. It’s an open-source (MIT) meta-orchestration layer that sits above your AI tools to act as a "Headless CTO" and maintain architectural memory.

### The Problem: The "Human Middleware"
Right now, developers act as the clipboard between tools—copying the plan from a README into a prompt, then copying the error log back to the plan. Ultra-Dex automates this context loop.

### How it works:
Instead of just sending isolated prompts, you use an **Active Kernel** (MCP) that maintains your project state in versioned Markdown (`CONTEXT.md`, `IMPLEMENTATION-PLAN.md`) and SQLite.

### Technical Highlights:
*   **17 Specialized Agents:** Organized into 7 tiers (Leadership, Implementation, Security, Quality, etc.).
*   **Active Kernel (MCP):** A Model Context Protocol server that injects your plan and project graph directly into Claude Desktop or Cursor.
*   **61 CLI Commands:** Beyond just code gen, it handles `swarm` execution (parallel loops), `audit` (alignment scoring), and `integrate` (automated SDK setup).
*   **Autonomous Self-Healing:** A watch mode that detects test failures and automatically triggers a `@Debugger` agent to fix and verify without user intervention.
*   **Docker Sandbox:** Safely executes and tests generated code before it touches your host OS.

### Getting Started:
It’s a CLI-first tool. No vendor lock-in.

```bash
npx ultra-dex init
```

**GitHub:** [https://github.com/Srujan0798/Ultra-Dex](https://github.com/Srujan0798/Ultra-Dex)

It’s completely free and MIT licensed. I’m curious if anyone else here is building complex SaaS apps with AI and feeling the "context drift" pain—I’d love to get some technical feedback on the orchestration logic.