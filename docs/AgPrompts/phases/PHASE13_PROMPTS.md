---
id: PHASE-13-PROMPTS
title: 'Phase 13 - Strategic Reviews & Critical Improvements'
category: phases
priority: high
status: completed
version: 6.0.0
last-updated: 2026-02-10
author: Ultra-Dex Team
related:
  - PROMPT-13-CRITICAL
  - SPEC-REVIEWS
tags:
  - strategic-reviews
  - critical-improvements
  - ai-analysis
dependencies: []
testing:
  - method: manual
  - coverage: 100%
---

# Ultra-Dex Phase 13 - Strategic Reviews & Critical Improvements

> **Source:** Gemini-2-Review.md, Kimi-2.2-48H-Critical-Path.md, devin_ceo2.md
> **Total:** 15 New Prompts (#126-140)
> **Date:** Feb 5, 2026

---

## 🔵 CRITICAL IMPLEMENTATION (48H Path)

---

### PROMPT 126: Interactive REPL Core

> **Source:** Kimi-2.2-48H-Critical-Path.md (Task 2.1)
> **Status:** Detailed code provided

```
## Task: Create Interactive REPL

**Files to create:**
- cli/lib/repl/index.js (NEW)
- cli/lib/repl/session.js (NEW)

**Requirements:**

1. Interactive shell:
   - `ultra-dex` (no args) -> starts REPL
   - `ultra-dex> ` prompt with color

2. Feature set:
   - Slash commands (`/help`, `/clear`, `/history`)
   - Session persistence (`--continue` flag)
   - Readline interface with history navigation

3. Session management:
   - Save session state to `~/.ultra-dex/sessions/`
   - Restore context on restart

**Commit:** "feat: Add interactive REPL core"
```

---

### PROMPT 127: Streaming AI Response

> **Source:** Kimi-2.2-48H-Critical-Path.md (Task 3.2)
> **Status:** Detailed code provided

```
## Task: Implement Real-Time Streaming

**Files to create:**
- cli/lib/providers/streaming.js (NEW)
- cli/lib/commands/generate.js (UPDATE)

**Requirements:**

1. Vercel AI SDK Integration:
   - Use `streamText` from `ai` package
   - Support Anthropic and OpenAI providers

2. UX improvements:
   - Live token streaming to stdout
   - Smooth rendering with no buffering lag
   - `--stream` flag for commands

**Commit:** "feat: Add streaming AI response support"
```

---

### PROMPT 128: Docker Sandbox Execution

> **Source:** Kimi-2.2-48H-Critical-Path.md (Task 4.1)
> **Status:** Detailed code provided

```
## Task: Create Docker Code Sandbox

**Files to create:**
- cli/lib/sandbox/docker.js (NEW)
- cli/lib/commands/exec.js (REWRITE)

**Requirements:**

1. Secure execution environment:
   - Node.js Alpine base image
   - Network isolation (optional)
   - CPU/Memory limits

2. Command:
   - `ultra-dex exec "run tests"` -> runs inside container
   - Volume mount for project files

**Commit:** "feat: Add secure Docker sandbox"
```

---

### PROMPT 129: System Health Check

> **Source:** Kimi-2.2-48H-Critical-Path.md (Task 1.4)
> **Status:** Code provided

```
## Task: Create Health Check Command

**Files to create:**
- cli/lib/commands/health.js (NEW)

**Requirements:**

1. Command: `ultra-dex doctor`

2. Checks:
   - Node.js version (>=18)
   - Dependencies installed
   - Config file valid
   - MCP server connection
   - API keys present

**Commit:** "feat: Add system health check"
```

---

### PROMPT 130: File Permission System

> **Source:** Kimi-2.2-48H-Critical-Path.md (Task 4.3)
> **Status:** Code provided

```
## Task: Create File Permission Guard

**Files to create:**
- cli/lib/sandbox/permissions.js (NEW)

**Requirements:**

1. Block dangerous operations:
   - Prevent `rm -rf /` or similar
   - Restrict access to `~/.ssh` or sensitive dirs

2. Allowlist:
   - Project directory only
   - Temp directories

3. Input sanitization for shell commands

**Commit:** "feat: Add file permission/security system"
```

---

## 🟢 META-LAYER STRATEGY (Gemini Review)

---

### PROMPT 131: MCP Host Architecture

> **Source:** Gemini-2-Review.md (Phase 2)
> **Status:** Strategic Plan

```
## Task: Implement MCP Host Capability

**Files to update:**
- cli/lib/mcp/host.js (NEW)

**Requirements:**

1. "Mount" external tools:
   - `ultra-dex mount github`
   - `ultra-dex mount postgres`

2. Architecture:
   - Spawn MCP servers as child processes
   - Aggregate tools into global registry
   - Delegate tool calls from LLM to correct server

3. Solve "Island Problem": Connect Ultra-Dex to 500+ ecosystem tools.

**Commit:** "feat: Add MCP Host architecture"
```

---

### PROMPT 132: "Ralph" Autonomous Loop

> **Source:** Gemini-2-Review.md (Phase 3)
> **Status:** Strategic Plan

```
## Task: Implement 'Ralph' Logic Loop

**Files to create:**
- cli/lib/agents/ralph-loop.js (NEW)

**Requirements:**

1. Finite State Machine for autonomy:
   - PLAN -> ACT -> VERIFY -> RECOVER -> COMMIT

2. Self-correction:
   - Execute code
   - Read stderr
   - If error, feed back to LLM and retry (max N retries)

3. Shifts from "One-Shot" to "Autonomous" execution.

**Commit:** "feat: Add Ralph autonomous loop"
```

---

### PROMPT 133: React Ink Dashboard (TUI)

> **Source:** Gemini-2-Review.md (Phase 1)
> **Status:** Strategic Plan

```
## Task: React Ink Visual Dashboard

**Files to create:**
- cli/lib/ui/dashboard.js (NEW)

**Requirements:**

1. Replace linear logs with TUI:
   - Dependency: `ink` (React for CLI)
   - Dashboard view: Project Health, Active Agents, Context Usage
   - Streaming markdown rendering

2. Aesthetic goal: "Minority Report" feel, 100% observability.

**Commit:** "feat: Implement React Ink TUI dashboard"
```

---

### PROMPT 134: Context Compaction

> **Source:** Gemini-2-Review.md (Phase 3)
> **Status:** Strategic Plan

```
## Task: Context Compaction System

**Files to create:**
- cli/lib/memory/compactor.js (NEW)

**Requirements:**

1. Prevent context overflow during loops:
   - Summarize stdout history into "Observation" strings
   - "Forget" intermediate steps after success
   - Keep "Lessons Learned" in ULTRA.md

2. Maintain "Long-term Memory" without token bloat.

**Commit:** "feat: Add context compaction"
```

---

### PROMPT 135: ULTRA.md Standard

> **Source:** Gemini-2-Review.md (Phase 4)
> **Status:** Strategic Plan

```
## Task: Define ULTRA.md Standard

**Files to create:**
- templates/ULTRA.md (NEW)

**Requirements:**

1. The "Manager's Handbook" file:
   - Section 1: Agent Roles (Who does what)
   - Section 2: Global Context (Invariants)
   - Section 3: Permanent Memory (Decisions log)

2. Superior to CLAUDE.md: Persists knowledge across *different* providers (Claude, Gemini, etc.).

**Commit:** "feat: Define ULTRA.md standard"
```

---

## 🟡 AGENT DEFINITIONS (Devin Review)

---

### PROMPT 136: Planner Agent Prompt

> **Source:** devin_ceo2.md (Section 1)
> **Status:** Reference Prompt

```
## Task: Optimize Planner Agent Prompt

**Files to update:**
- agents/1-leadership/planner.md

**Refinement:**
- Enforce 24-section template usage
- Require atomic tasks (4-9 hours)
- Mandate technical details (API endpoints, schemas)
- Add "Critical Path" identification requirement

**Commit:** "refactor: Optimize planner agent prompt"
```

---

### PROMPT 137: Coder Agent Prompt

> **Source:** devin_ceo2.md (Section 2)
> **Status:** Reference Prompt

```
## Task: Optimize Coder Agent Prompt

**Files to update:**
- agents/2-development/backend.md
- agents/2-development/frontend.md

**Refinement:**
- Add "No placeholder code" rule
- Enforce single-purpose functions (<30 lines)
- Ban `console.log` in production
- Require error handling for all edge cases

**Commit:** "refactor: Optimize coder agent prompt"
```

---

### PROMPT 138: Tester Agent Prompt

> **Source:** devin_ceo2.md (Section 3)
> **Status:** Reference Prompt

```
## Task: Optimize Tester Agent Prompt

**Files to update:**
- agents/5-quality/testing.md

**Refinement:**
- Explicit test types: Unit (Jest), Integration (Supertest), E2E (Playwright)
- Scenarios: Happy path, Edge cases, Error cases, Security, Performance
- Target 80%+ coverage

**Commit:** "refactor: Optimize tester agent prompt"
```

---

### PROMPT 139: Reviewer Agent Prompt

> **Source:** devin_ceo2.md (Section 4)
> **Status:** Reference Prompt

```
## Task: Optimize Reviewer Agent Prompt

**Files to update:**
- agents/5-quality/reviewer.md

**Refinement:**
- Five-point checklist: Quality, Security, Performance, Testing, Documentation
- Output format: Summary, Critical, Suggestions, Praise, Status
- Enforce "Strict Mode" reviews

**Commit:** "refactor: Optimize reviewer agent prompt"
```

---

### PROMPT 140: Debugger Agent Prompt

> **Source:** devin_ceo2.md (Section 7)
> **Status:** Reference Prompt

```
## Task: Optimize Debugger Agent Prompt

**Files to update:**
- agents/5-quality/debugger.md

**Refinement:**
- Structured methodology: Analyze -> Root Cause -> Fix -> Verify
- Require "Edge Case Consideration" step
- Verify fix doesn't break other functionality (regression check)

**Commit:** "refactor: Optimize debugger agent prompt"
```
