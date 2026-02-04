# Show HN: Ultra-Dex v3.5.0 – The Meta-Layer for AI Coding That Actually Works

**TL;DR:** We built an AI orchestration framework that prevents "AI amnesia" across Claude, Cursor, Devin, and Copilot. v3.5.0 is production-ready with 46 CLI commands, an MCP server, and 17 specialized agents. Open source, MIT licensed.

**GitHub:** https://github.com/Srujan0798/Ultra-Dex  
**npm:** `npx ultra-dex@latest init`

---

## The Problem

After 6 months of AI-assisted coding, I noticed something: every session started with "Can you remind me what we were building?" 

Context lost. Decisions forgotten. The AI tools were brilliant but had amnesia. We'd spend 30 minutes re-explaining the architecture every time we opened a new chat.

We tried:
- Claude's CLAUDE.md (great, but locked to Claude)
- Cursor's rules (good, but single-tool)
- Devin (amazing, but $500/mo and standalone)

Nothing worked across ALL the tools we used daily.

---

## What We Built

**Ultra-Dex is a meta-orchestration layer** – not competing with AI tools, but making them work together through structured context and memory.

### v3.5.0 Features (Actually Shipped, Not Vaporware)

✅ **46 CLI Commands** – From `init` to `deploy`, all functional (not placeholders)  
✅ **MCP Server (Port 3001)** – Claude Desktop integration via Model Context Protocol  
✅ **17 Specialized Agents** – Orchestrated pipelines: Planner → CTO → Backend → Frontend → Testing  
✅ **34-Section Template System** – Rigorous planning framework (prevents "forgot auth" disasters)  
✅ **21-Step Verification** – Quality gates before code hits production  
✅ **WebSocket Real-Time Updates** – Live sync between agents  
✅ **Session Persistence** – SQLite-backed state management  
✅ **Swarm Mode** – Parallel agent execution (`ultra-dex swarm "build auth system" --parallel`)  
✅ **Docker Sandbox** – Safe code execution environment  

---

## Recent Fixes (We Actually Ship)

Just this week we fixed:
- Shell injection vulnerability in GitHub integration
- Webhook timeouts in CI monitoring (now async)
- Memory leaks in swarm logs (auto-cleanup)
- Pipeline recovery with `--resume` flag (checkpoint/restart)
- Atomic file writes to prevent corruption

**Commit:** `a13731e` – feat(swarm): Add pipeline recovery with --resume flag  
**Status:** Merged to main, all tests passing (300+)

---

## The Architecture

```
Ultra-Dex (Orchestration Layer)
├── MCP Server (stdio + HTTP)
├── 17 Agents (6 tiers from planning → specialist)
├── Context Engine (Graph RAG + Markdown)
└── Provider Adapters (OpenAI, Anthropic, Google, Local)

Integrates with:
├── Claude Desktop (via MCP)
├── Cursor (via .mdc rules)
├── VS Code (extension)
└── Any CLI tool (via hooks)
```

---

## Honest Assessment

**What Works:**
- Context persistence across sessions (solves the amnesia problem)
- Agent pipelines actually execute (not just generate markdown)
- MCP integration is solid (Claude Desktop connects reliably)
- 34-section template catches edge cases we'd normally forget

**What We're Still Building:**
- Streaming responses (partial, needs Vercel AI SDK integration)
- Browser automation (Playwright integration planned)
- Voice input (Whisper integration in progress)
- Deep Graph RAG (FalkorDB migration)

**Current Grade:** A- (300+ tests passing, production-ready for teams)

---

## Try It

```bash
# One-line init
npx ultra-dex@latest init my-project

# Run agent pipeline
ultra-dex swarm "Build authentication system with JWT and refresh tokens" --parallel

# Resume after failure (we all have API outages)
ultra-dex swarm "Build authentication system" --resume

# MCP server for Claude Desktop
ultra-dex serve --port 3001
```

---

## Who's This For?

- **Solo devs** who switch between Claude, Cursor, and Copilot
- **Teams** where context gets lost between handoffs
- **Agencies** building 6-month projects that need to survive AI tool pivots

**Not for:** People who want a single "magic" AI that does everything. We're explicitly the coordination layer, not the execution engine.

---

## Technical Details

- **Language:** TypeScript (Node 18+)
- **Storage:** SQLite (state) + Markdown (context)
- **Protocol:** MCP (Model Context Protocol) – USB-C for AI tools
- **License:** MIT
- **Size:** 1.28 MB unpacked, 210 files
- **Tests:** 300+ passing

---

## The Brutal Truth

This started as a documentation framework. We over-promised on early versions (mea culpa). v3.5.0 is the first release where the execution layer actually matches the vision.

We're not Devin. We don't generate entire apps in 60 minutes. What we do: prevent the "wait, what were we building?" problem that kills 6-month AI-assisted projects.

---

## What's Next

- v3.6.0: Voice input, browser automation, Graph RAG
- v4.0.0: Agent marketplace, LangGraph native integration
- Enterprise: SSO, audit logs, compliance

---

## Show Us Your Use Case

We'd love to hear how you're using (or want to use) Ultra-Dex. Drop a comment with:
1. Your stack (Claude/Cursor/Devin/other)
2. The context loss problem you're solving
3. Feature requests (we actually read them)

**GitHub Issues:** https://github.com/Srujan0798/Ultra-Dex/issues  
**Discord:** [Link in README]

---

*Built by developers who got tired of explaining the same architecture to the AI every Monday morning.*

---

**HN Discussion Questions:**
1. How do you handle context persistence across AI tools?
2. Would you trust a meta-layer over native AI tool memory?
3. What's the biggest "AI amnesia" moment you've had?

Let us know what you think.
