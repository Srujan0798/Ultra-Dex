# Ultra-Dex Reddit Launch Posts

## r/SideProject

**Title:** I built Ultra-Dex: a CLI meta-layer that orchestrates AI coding agents with persistent context

Hey r/SideProject,

I’ve been building **Ultra-Dex**, a CLI that sits above AI coding tools and keeps them aligned with a structured plan and persistent context. The goal is to stop “prompt amnesia” and keep multi-agent work coherent across days.

Key pieces:

- **CONTEXT.md + IMPLEMENTATION-PLAN.md** as the source of truth
- **Multi-agent orchestration** (planner → builder → reviewer)
- **Memory tiers** (hot/warm/cold) to avoid context blowups
- **MCP integrations** so it works with Cursor/Windsurf/Cline

If you’re building with AI assistants and want reproducible, plan-driven output, I’d love feedback. Happy to share a demo or the repo details.

Questions welcome.

---

## r/programming

**Title:** Ultra-Dex: a CLI that enforces planning + verification for AI coding agents

I’m releasing **Ultra-Dex**, a CLI meta-layer for AI coding orchestration. It enforces planning, verification, and memory across tools (Claude, Cursor, etc.) so agent output doesn’t drift.

Highlights:

- **Structured planning** (24+ section plan)
- **Multi-agent orchestration**
- **Verification gates** + drift detection
- **MCP server + context bus**

This is aimed at teams building real systems with AI (not just demos). If you’ve felt AI output drift across long tasks, this is the fix I’ve been chasing.

Happy to answer questions and take critique.
