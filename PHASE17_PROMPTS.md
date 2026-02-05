# Ultra-Dex Phase 17 - Quality & Intelligence Protocol

> **Source:** 07-Rule-Book-21.md, Copilot.md, PLAN-CLI-4.0.md
> **Total:** 15 New Prompts (#186-200)
> **Date:** Feb 5, 2026

---

## 🛡️ PROTOCOL 21 (Quality Assurance)

---

### PROMPT 186: The 21-Step Verifier
> **Source:** 07-Rule-Book-21.md
> **Status:** Core Protocol

```
## Task: Implement 21-Step Verification CLI

**Files to create:**
- cli/lib/quality/protocol-21.js

**Requirement:**
- Interactive checklist CLI command: `ultra-dex verify --task [ID]`
- Enforce all 21 steps (Understand, Analyze, Implement, Test, Security, etc.).
- Block task completion until all steps are checked.
- Store verification proof in `docs/verification-logs/`.

**Commit:** "feat: Implement Protocol 21 verification engine"
```

---

### PROMPT 187: Risk Register Module
> **Source:** 07-Rule-Book-21.md
> **Status:** Quality

```
## Task: Implement Risk Register

**Files to create:**
- cli/lib/quality/risk-register.js

**Requirement:**
- CLI to manage project risks: `ultra-dex risk add`
- Fields: Description, Probability (Low/Med/High), Impact, Mitigation.
- Generate `RISK-REGISTER.md` table automatically.
- Alert on "Critical" risks during deployment.

**Commit:** "feat: Add risk register management module"
```

---

### PROMPT 188: Rollback Plan Generator
> **Source:** 07-Rule-Book-21.md
> **Status:** DevOps

```
## Task: Automate Rollback Plans

**Files to create:**
- cli/lib/ops/rollback-gen.js

**Requirement:**
- Generate `ROLLBACK-PLAN.md` before every deployment.
- Triggers: Critical bug > 10% users, Perf degradation > 50%.
- Steps: Stop traffic, Revert code/DB, Verify health.
- Time Estimate calculation (<15 mins target).

**Commit:** "ops: Add automated rollback plan generator"
```

---

### PROMPT 189: Accessibility Enforcer
> **Source:** 07-Rule-Book-21.md
> **Status:** Quality

```
## Task: Implement Accessibility Guard

**Files to create:**
- cli/lib/quality/a11y-check.js

**Requirement:**
- Integrate `axe-core` or similar.
- Check: Alt text, Contrast ratio (4.5:1), Semantic HTML.
- Command: `ultra-dex check a11y`
- Gate: Fail build if critical accessibility issues found.

**Commit:** "feat: Add WCAG 2.1 accessibility enforcement"
```

---

### PROMPT 190: Decision Ledger
> **Source:** Copilot.md
> **Status:** Intelligence

```
## Task: Implement Decision Ledger

**Files to create:**
- cli/lib/intelligence/decision-ledger.js

**Requirement:**
- Immutable log of architectural decisions: `DECISION_LOG.md`.
- Inputs: Context, Decision, Consequences, Status (Accepted/Rejected).
- Link decisions to specific Git commits.
- "Project Memory" that agents must read before suggesting changes.

**Commit:** "feat: Add immutable decision ledger"
```

---

## 🧠 PROJECT INTELLIGENCE (Copilot)

---

### PROMPT 191: Persistent Project Mind
> **Source:** Copilot.md
> **Status:** AI Core

```
## Task: Build 'Project Mind' Engine

**Files to create:**
- cli/lib/memory/mind.js

**Requirement:**
- Hybrid RAG system (Vector + Graph + Keywords).
- Index: Commits, Decisions, PRs, Architecture.
- "Hot Memory": Recent active files.
- "Cold Memory": Full project history.
- API: `ultra-dex memory query "Why did we choose Postgres?"`

**Commit:** "ai: Implement persistent project mind engine"
```

---

### PROMPT 192: Model Router
> **Source:** Copilot.md
> **Status:** AI Core

```
## Task: Implement AI Model Router

**Files to create:**
- cli/lib/ai/router.js

**Requirement:**
- Algorithm to select best model per task.
- Complex Reasoning -> Claude Opus/3.5 Sonnet.
- Coding -> GPT-4o / Claude 3.5 Sonnet.
- Quick Fixes -> Haiku / GPT-4o-mini.
- Cost/Perf optimization logic.

**Commit:** "ai: Add smart model routing logic"
```

---

### PROMPT 193: Cross-Tool Context Bus
> **Source:** Copilot.md
> **Status:** Integration

```
## Task: Build MCP Context Bus

**Files to create:**
- cli/lib/mcp/context-bus.js

**Requirement:**
- Standard protocol for context sharing.
- Enable IDEs (Cursor) and CLI to share `CONTEXT.md` state.
- Serve context via MCP to any compatible tool.
- "One Truth" for all AI agents.

**Commit:** "feat: Implement cross-tool MCP context bus"
```

---

### PROMPT 194: Traceability Engine
> **Source:** Copilot.md
> **Status:** Intelligence

```
## Task: Add AI Logic Traceability

**Files to create:**
- cli/lib/ai/trace.js

**Requirement:**
- Force agents to output "Reasoning Summary" with every change.
- Log: "Why I changed X", "Constraints Checked".
- Build trust by showing the "Thought Process" (CoT) log.

**Commit:** "ai: Add agent reasoning traceability logging"
```

---

### PROMPT 195: Repo Knowledge Graph
> **Source:** Copilot.md
> **Status:** Advanced AI

```
## Task: Build Repo Knowledge Graph

**Files to create:**
- cli/lib/graph/repo-indexer.js

**Requirement:**
- Parse codebase to build dependency graph.
- Map: Functions -> Files -> Imports.
- Use for impact analysis: "If I change User.js, what breaks?"
- Feed this graph to the Project Mind.

**Commit:** "feat: Add repository knowledge graph indexer"
```

---

## 🚀 CLI 4.0 EXPERIENCE (PLAN-CLI-4.0)

---

### PROMPT 196: The Omni-Box
> **Source:** PLAN-CLI-4.0.md
> **Status:** UX

```
## Task: Implement Omni-Box Dashboard

**Files to create:**
- cli/lib/ui/dashboard.js

**Requirement:**
- Replace default help with interactive TUI (using Ink).
- Menu: [Start Project] [Run Agent] [System Status].
- Show "Recent Projects" list.
- "Magic Bar" for natural language input.

**Commit:** "ui: Implement interactive Omni-Box dashboard"
```

---

### PROMPT 197: NLP Intent Router
> **Source:** PLAN-CLI-4.0.md
> **Status:** UX

```
## Task: Implement Natural Language Intent

**Files to create:**
- cli/lib/nlp/intent-parser.js

**Requirement:**
- Parse user input: "Fix my build" -> `ultra-dex fix --build`
- Keyword matching + Basic LLM classification.
- "Create a finance app" -> `ultra-dex init --template finance`

**Commit:** "feat: Add NLP intent routing for CLI commands"
```

---

### PROMPT 198: Smart Error Handling
> **Source:** PLAN-CLI-4.0.md
> **Status:** DX

```
## Task: Implement Smart Errors

**Files to create:**
- cli/lib/utils/smart-error.js

**Requirement:**
- Intercept stack traces.
- Display: 1. What happened (English), 2. Why, 3. Suggested Fix.
- Interactive: [Press Enter to Try Fix].
- Context-aware debugging suggestions.

**Commit:** "dx: Replace stack traces with smart AI error handling"
```

---

### PROMPT 199: Agent Persona Engine
> **Source:** PLAN-CLI-4.0.md
> **Status:** UX

```
## Task: Add Agent Personality

**Files to update:**
- cli/lib/ui/logger.js

**Requirement:**
- Distinct voices for agents.
- Success: "✅ System secured." (Confident).
- Failure: "⚠️ Encountered obstacle." (Proactive).
- Waiting: "⏳ Waiting for approval..." (Respectful).
- Theme support (Professional/Fun/Doomsday).

**Commit:** "ui: Add configurable agent persona engine"
```

---

### PROMPT 200: Interactive Docs TUI
> **Source:** PLAN-CLI-4.0.md
> **Status:** Documentation

```
## Task: Implement Docs TUI

**Files to create:**
- cli/lib/commands/docs.js

**Requirement:**
- `ultra-dex docs` command.
- TUI file explorer for local `.md` documentation.
- Read docs without leaving terminal.
- Search functionality within documentation.

**Commit:** "feat: Add interactive TUI for documentation"
```
