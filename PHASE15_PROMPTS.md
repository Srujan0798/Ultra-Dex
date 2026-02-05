# Ultra-Dex Phase 15 - Critical Repairs & Optimization

> **Source:** Devin-CEO-Review.md, Kimi-2.3-Review.md, jules.md
> **Total:** 15 New Prompts (#156-170)
> **Date:** Feb 5, 2026

---

## 🔴 EMERGENCY REPAIRS (Devin Critical Path)

---

### PROMPT 156: Package.json Unification
> **Source:** Devin-CEO-Review.md (Hour 5-8)
> **Status:** Critical Fix

```
## Task: Fix Package.json Chaos

**Files to update:**
- package.json
- cli/package.json

**Issue:**
- Root says v3.4.5, CLI says v1.0.0.
- Missing dependencies: `@anthropic-ai/sdk`, `vercel-ai`.
- `commander`, `inquirer` missing from root.

**Action:**
- Consolidate to single truth.
- Add `.npmignore` to exclude docs.
- Ensure `npm install` works in one shot.

**Commit:** "fix: Unify package versions and dependencies"
```

---

### PROMPT 157: Import Path Fixes
> **Source:** Kimi-2.2-48H-Critical-Path.md (Task 1.1)
> **Status:** Critical Fix

```
## Task: Fix Broken Imports in CLI

**Files to update:**
- cli/bin/ultra-dex.js

**Issue:**
- Imports reference non-existent files.
- `registerCloudCommand` vs `cloudCommand` export mismatch.
- Relative path errors in tests.

**Action:**
- Audit all `import` statements.
- Verify exports in `cli/lib/commands/*.js`.
- Run `node cli/bin/ultra-dex.js --help` to verify.

**Commit:** "fix: Repair broken CLI imports"
```

---

### PROMPT 158: Honesty Audit (Docs Repair)
> **Source:** Devin-CEO-Review.md (Hour 1-4)
> **Status:** Critical Fix

```
## Task: Documentation Reality Check

**Files to update:**
- README.md
- docs/FEATURES.md

**Issue:**
- Docs claim 28+ commands; only 2 exist.
- Claims "MCP Server Implemented" (False).

**Action:**
- Mark unimplemented features as [Planned].
- Remove "✅" from missing features.
- Add "Current State vs Vision" section.
- "Under Promise, Over Deliver."

**Commit:** "docs: Align documentation with actual codebase state"
```

---

### PROMPT 159: Fix Sync Brain
> **Source:** Kimi-2.3-Review.md (Priority 1)
> **Status:** Bug Fix

```
## Task: Fix `sync --brain` Command

**Files to update:**
- cli/lib/commands/sync.js

**Issue:**
- Command is a placeholder.
- Does not actually sync CONTEXT.md with codebase.

**Action:**
- Implement basic file watcher.
- Update `CONTEXT.md` timestamp on changes.
- (Future) AI summary of changes.

**Commit:** "fix: Implement basic sync logic"
```

---

### PROMPT 160: Cloud Command Stub
> **Source:** Kimi-2.3-Review.md (Priority 2)
> **Status:** Feature Stub

```
## Task: Implement Cloud Command Stub

**Files to create:**
- cli/lib/commands/cloud.js

**Issue:**
- Command missing entirely.

**Action:**
- Create commander action.
- Add providers: `vercel`, `railway`, `fly`.
- Implement `deploy` function (call system CLI).
- `ultra-dex cloud deploy` -> runs `vercel deploy`.

**Commit:** "feat: Add cloud deployment command wrapper"
```

---

## 🟠 OPTIMIZATION & NEW FEATURES (Kimi 2.3)

---

### PROMPT 161: Voice Input Flag
> **Source:** Kimi-2.3-Review.md (Critical Gap 4)
> **Status:** New Feature

```
## Task: Add Voice Input Support

**Files to update:**
- cli/bin/ultra-dex.js
- cli/lib/input/voice.js (NEW)

**Requirement:**
- Flag: `ultra-dex generate "idea" --voice`
- Record audio from mic.
- Transcribe using OpenAI Whisper API.
- Pass text to command.

**Commit:** "feat: Add voice input support via Whisper"
```

---

### PROMPT 162: Browser Automation Stub
> **Source:** Kimi-2.3-Review.md (Critical Gap 5)
> **Status:** New Feature

```
## Task: Add Browser Automation Command

**Files to create:**
- cli/lib/commands/browser.js (NEW)

**Requirement:**
- Command: `ultra-dex browser`
- Use Playwright (headless).
- Action: "Take screenshot of localhost:3000".
- `ultra-dex browser snap --url http://localhost:3000`

**Commit:** "feat: Add browser automation stub"
```

---

### PROMPT 163: LangChain Adapter
> **Source:** Kimi-2.3-Review.md (Priority 2)
> **Status:** Optimization

```
## Task: Create LangChain Adapter

**Files to create:**
- cli/lib/mcp/langchain-adapter.js

**Requirement:**
- Allow Ultra-Dex agents to use LangChain tools.
- Map Ultra-Dex Tool definition -> LangChain Tool.
- Enable massive tool ecosystem access.

**Commit:** "feat: Add LangChain tool adapter"
```

---

### PROMPT 164: Serve WebSocket
> **Source:** Kimi-2.3-Review.md (Priority 2)
> **Status:** Optimization

```
## Task: Add WebSocket to MCP Server

**Files to update:**
- cli/lib/commands/serve.js

**Requirement:**
- Enable real-time updates for Dashboard.
- Socket.io or WS server on port 3002.
- Broadcast "Agent Status" events to connected clients.

**Commit:** "feat: Add WebSocket support to serve command"
```

---

### PROMPT 165: VS Code Extension Prototype
> **Source:** Devin-CEO-Review.md (Hour 25-32)
> **Status:** Prototype

```
## Task: Scaffold VS Code Extension

**Files to create:**
- vscode-extension/* (New Folder)

**Requirement:**
- Minimal extension "Ultra-Dex Companion".
- Command: "Open Context".
- View: Render `CONTEXT.md` in sidebar.
- Button: "Validate Plan" (Runs CLI command).

**Commit:** "init: Scaffold VS Code extension"
```

---

## 🟡 PHILOSOPHY & MARKETING (Jules/Devin)

---

### PROMPT 166: Context Slicing Logic
> **Source:** jules.md (Methodology)
> **Status:** Core Logic

```
## Task: Implement Context Slicing

**Files to create:**
- cli/lib/context/slicer.js (NEW)

**Philosophy:**
- "We do not drive the entire trip in the dark."
- Inject *only* relevant rules.

**Logic:**
- If task contains "Auth", load `rules/auth.mdc`.
- If task contains "DB", load `rules/db.mdc`.
- Prevent context bleeding.

**Commit:** "feat: Add context slicing logic"
```

---

### PROMPT 167: Atomic Task Enforcer
> **Source:** jules.md (Methodology)
> **Status:** Core Logic

```
## Task: Implement Atomic Task Enforcer

**Files to update:**
- cli/lib/agents/planner.js

**Requirement:**
- Reject tasks > 9 hours estimate.
- Warn if task description is vague.
- Enforce "Flashlight Protocol" (break it down).

**Commit:** "feat: Add atomic task size enforcement"
```

---

### PROMPT 168: Glass Box Audit Check
> **Source:** jules.md (Philosophy)
> **Status:** Core Logic

```
## Task: Add 'Glass Box' Audit Command

**Files to create:**
- cli/lib/commands/audit.js

**Requirement:**
- `ultra-dex audit`
- Compare `CONTEXT.md` vs `git log`.
- Detect "Context Drift" (Did we deviate from plan?).
- Report uncommitted architectural decisions.

**Commit:** "feat: Add Glass Box audit command"
```

---

### PROMPT 169: Comparison Table Update
> **Source:** Kimi-2.3-Review.md (Matrix)
> **Status:** Marketing

```
## Task: Update Comparison Matrix

**Files to update:**
- docs/COMPARISON.md

**Action:**
- Add row: "Interactive REPL" (Ultra-Dex vs Claude).
- Add row: "Voice Input".
- Highlight "21-Step Verification" as unique win.
- Be honest about "Code Execution" gap (until fixed).

**Commit:** "docs: Update competitive matrix"
```

---

### PROMPT 170: Demo Video Script
> **Source:** Devin-CEO-Review.md (Hour 33-48)
> **Status:** Marketing

```
## Task: Write Demo Video Script

**Files to create:**
- docs/marketing/DEMO-SCRIPT.md

**Content:**
- 3 Minute "Reality" Demo.
- 0:00 - Init Project.
- 0:45 - Generate Plan (Streaming).
- 1:30 - Execute Task (Docker Sandbox).
- 2:30 - Verify with 21-Steps.
- "From Idea to Execution in 3 Minutes."

**Commit:** "docs: Write demo video script"
```
