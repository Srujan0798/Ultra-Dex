---
id: PHASE-08-PROMPTS
title: 'Phase 8 - Extracted from Archives'
category: phases
priority: high
status: completed
version: 6.0.0
last-updated: 2026-02-10
author: Ultra-Dex Team
related:
  - PROMPT-08-ECOSYSTEM
  - SPEC-QA-SPEC
  - SPEC-MEMORY
tags:
  - specs
  - moonshots
  - ecosystem
dependencies: []
testing:
  - method: manual
  - coverage: 100%
---

# Ultra-Dex Phase 8 - Extracted from Archives

> **Source:** \_old/archived_docs/excessive_documentation/, FUTURE-TASKS.md, ADVANCED-WORKFLOWS.md
> **Total:** 15 New Prompts (Not in Phase 5-7)
> **Date:** Feb 5, 2026

---

## 🔴 CRITICAL - NOT YET IMPLEMENTED

---

### PROMPT 51: Persistent Project Memory (PPM) - Full Implementation

> **Source:** 01-persistent-memory.md
> **Status:** Draft spec exists, needs full implementation

````
## Task: Implement 3-Tier Memory System

**Files to create:**
- cli/lib/memory/hot-tier.js (NEW)
- cli/lib/memory/warm-tier.js (NEW)
- cli/lib/memory/cold-tier.js (NEW)
- cli/lib/memory/manager.js (NEW)

**Requirements:**

1. HOT Tier (RAM/Redis):
   - Session context: active files, current task
   - Shell history, recent errors
   - Keyword + exact match retrieval
   - Auto-expire after session ends

2. WARM Tier (Vector DB - Chroma/LanceDB):
   - Architecture decisions, PR summaries
   - Style guides, active patterns
   - Semantic search with embeddings
   - Auto-index CONTEXT.md and IMPLEMENTATION-PLAN.md

3. COLD Tier (Graph DB - SQLite/Neo4j):
   - Full git history analysis
   - Closed issues, legacy decisions
   - Audit logs, time-series queries
   - Graph traversal for "why" questions

4. Memory Entry Schema:
```typescript
interface MemoryEntry {
  id: string;
  content: string;
  type: 'decision' | 'pattern' | 'constraint' | 'error';
  timestamp: string;
  source: { agent: string; file?: string; commit?: string };
  embedding?: number[];
  relations: string[];
}
````

5. Commands:
   - `ultra-dex memory add "Always use Zod"` - Manual remember
   - `ultra-dex memory search "auth"` - Semantic search
   - `ultra-dex memory why "database choice"` - Graph query
   - `ultra-dex memory tier hot` - Show hot memory

**Commit:** "feat: Implement 3-tier persistent memory (PPM)"

```

---

### PROMPT 52: Model Router with Evaluation Loops

> **Source:** 02-model-router.md
> **Status:** Draft spec exists, needs implementation

```

## Task: Intelligent Model Selection with Quality Gates

**Files to create:**

- cli/lib/router/classifier.js (NEW)
- cli/lib/router/router.js (NEW)
- cli/lib/router/evaluator.js (NEW)

**Requirements:**

1. Task Classification:
   - Analyze input prompt to determine TaskType
   - Categories: CodeGen, Refactor, Docs/Text, Analysis, Architect

2. Routing Table (Default):
   | Task Type | Preferred | Fallback |
   |-----------|-----------|----------|
   | Architect | Claude 3.5 Sonnet | GPT-4o |
   | CodeGen | Claude 3.5 Sonnet | DeepSeek |
   | Refactor | GPT-4o | Claude Haiku |
   | Simple Fix | GPT-4o Mini | Llama 3 |
   | Docs | Gemini 1.5 Pro | GPT-3.5 |

3. Evaluation Loop (Self-Healing):
   - If model fails Quality Gates → escalate to stronger model
   - Max 3 escalation attempts
   - Log all routing decisions

4. Configuration (router.json):

```json
{
  "strategies": {
    "cost_optimized": { "default": "gpt-4o-mini" },
    "performance": { "default": "claude-3-5-sonnet" },
    "privacy": { "default": "ollama:llama3" }
  },
  "overrides": [{ "keyword": "security", "model": "gpt-4o" }]
}
```

5. Commands:
   - `ultra-dex route "task"` - Show which model would be used
   - `ultra-dex route --strategy cost_optimized`

**Commit:** "feat: Add intelligent model router with evaluation loops"

```

---

### PROMPT 53: Quality Gate System - Full Implementation

> **Source:** 03-quality-gates.md
> **Status:** Draft spec exists, needs implementation

```

## Task: Implement Quality Gate System

**Files to create:**

- cli/lib/gates/index.js (NEW)
- cli/lib/gates/structural.js (NEW)
- cli/lib/gates/functional.js (NEW)
- cli/lib/gates/architectural.js (NEW)

**Requirements:**

1. Structural Gates (Static):
   - Syntax check (does it parse?)
   - Linting (eslint/ruff)
   - Type check (tsc)

2. Functional Gates (Dynamic):
   - Unit tests pass
   - New tests generated for new code
   - Docker sandbox execution

3. Architectural Gates (Semantic):
   - Pattern compliance (Use Prisma, not raw SQL)
   - Forbidden imports check
   - Security scan (no hardcoded secrets)

4. Configuration (quality-gate.json):

```json
{
  "strict_mode": true,
  "gates": {
    "syntax": { "enabled": true, "blocking": true },
    "linting": { "enabled": true, "command": "npm run lint" },
    "testing": { "require_new_tests": true },
    "architecture": {
      "banned_patterns": ["console.log", "TODO:", "var "],
      "required_patterns": ["try {", "} catch"]
    }
  },
  "on_failure": {
    "action": "reject",
    "retry_attempts": 2,
    "feedback_prompt": "Your code failed: {{error}}. Fix it."
  }
}
```

5. Integration:
   - Pre-commit: Static checks only (fast)
   - CI/CD: Full suite
   - Agent Loop: Reviewer uses this config

**Commit:** "feat: Add quality gate system with 3 gate types"

```

---

### PROMPT 54: Decision Ledger with Traceability

> **Source:** 04-decision-ledger.md
> **Status:** Draft spec exists, needs implementation

```

## Task: Implement Immutable Decision Audit Trail

**Files to create:**

- cli/lib/ledger/index.js (NEW)
- cli/lib/ledger/storage.js (NEW)
- cli/lib/ledger/query.js (NEW)

**Requirements:**

1. Ledger Entry Schema:

```json
{
  "block_id": "blk_8a7b9c...",
  "timestamp": "2024-02-14T10:00:00Z",
  "task_id": "task_auth_01",
  "agent": "CTO",
  "action": "Architecture Decision",
  "decision": {
    "selected_option": "JWT with httpOnly cookies",
    "rejected_options": ["Session IDs", "OAuth only"],
    "reasoning": "Statelessness for serverless"
  },
  "constraints_checked": [{ "rule": "No stateful sessions", "status": "PASS" }],
  "artifacts": ["docs/auth-architecture.md"]
}
```

2. Storage:
   - Local: `.ultra/ledger.jsonl` (append-only)
   - Git integration: Auto-append to commit messages

3. Commands:
   - `ultra-dex ledger search "database"` - Find decisions
   - `ultra-dex ledger from "yesterday"` - Time-based query
   - `ultra-dex ledger export --pdf` - Compliance report
   - `ultra-dex commit` - Auto-append decision to commit

**Commit:** "feat: Add decision ledger with audit trail"

```

---

### PROMPT 55: MCP Context Bus - Cross-Tool Sync

> **Source:** 05-mcp-context-bus.md
> **Status:** Draft spec exists, needs enhancement

```

## Task: Implement Cross-Tool Context Sharing

**Files to modify:**

- cli/lib/mcp/server.js (enhance)

**Files to create:**

- cli/lib/mcp/context-bus.js (NEW)
- cli/lib/mcp/adapters/cursor.js (NEW)
- cli/lib/mcp/adapters/claude.js (NEW)

**Requirements:**

1. Standardized Resources:
   - `ultra://project/state` - Returns state.json
   - `ultra://project/context` - Returns CONTEXT.md
   - `ultra://memory/relevant?q=...` - Semantic search

2. Standardized Tools:
   - `remember(text, tags)` - Save project fact
   - `query_graph(query)` - Understand codebase
   - `validate_output(code)` - Run Quality Gates

3. Tool Adapters:
   | Tool | Integration | Role |
   |------|-------------|------|
   | Claude Desktop | MCP Server | Planner |
   | Cursor IDE | .cursorrules + MCP | Implementer |
   | CLI | Native Access | Orchestrator |
   | GitHub Actions | Container | Enforcer |

4. State Sync Flow:
   - Cursor makes change → Ultra-Dex Watch detects
   - Graph updated → All tools get new context via MCP

**Commit:** "feat: Add MCP context bus for cross-tool sync"

```

---

## 🟡 HIGH PRIORITY - FROM FUTURE-TASKS.md

---

### PROMPT 56: Ultra-Dex SDK (AI Agent Protocol)

> **Source:** FUTURE-TASKS.md #9
> **Effort:** 4 weeks

```

## Task: Create Ultra-Dex SDK for AI Agents

**Files to create:**

- sdk/index.ts (NEW)
- sdk/agent.ts (NEW)
- sdk/providers/ (NEW directory)
- sdk/package.json (NEW)

**Requirements:**

1. Create UltraAgent class:

```typescript
import { UltraAgent } from 'ultra-dex';

const agent = new UltraAgent({
  template: '04-Imp-Template.md',
  llm: 'claude-3.5-sonnet',
  mode: 'planner',
});

await agent.fill({ idea: 'AI recipe generator', sections: [1, 2, 3] });
const tasks = await agent.generateTasks({ from: 'Section 16' });
await agent.execute(tasks[0], { verify: true, autoCommit: true });
```

2. Provider support:
   - OpenAI, Anthropic, Google, Ollama
   - Custom endpoints

3. SDK features:
   - Type-safe API
   - Streaming support
   - Hooks for custom logic
   - Event emitters

4. Publish:
   - npm package: `@ultra-dex/sdk`
   - TypeScript definitions

**Commit:** "feat: Add Ultra-Dex SDK for AI agents"

```

---

### PROMPT 57: Token Cost Estimator & Budget Manager

> **Source:** FUTURE-TASKS.md #8
> **Effort:** 2 days

```

## Task: Implement Token Estimation and Budget Tracking

**Files to create:**

- cli/lib/commands/estimate.js (NEW)
- cli/lib/budget/tracker.js (NEW)
- cli/lib/budget/calculator.js (NEW)

**Requirements:**

1. Estimate command:
   - `ultra-dex estimate "task description"`
   - Show token breakdown by agent
   - Show cost per provider

2. Budget tracking:
   - Store usage in `.ultra/budget.json`
   - Monthly/daily limits
   - Warnings at 80%, 90%, 100%

3. Cost calculation:
   | Provider | Input | Output |
   |----------|-------|--------|
   | GPT-4o | $5/M | $15/M |
   | Claude 3.5 | $3/M | $15/M |
   | Gemini 1.5 | $1.25/M | $5/M |
   | GPT-4o-mini | $0.15/M | $0.60/M |

4. Commands:
   - `ultra-dex estimate "build auth"`
   - `ultra-dex budget status`
   - `ultra-dex budget set --monthly 50`

**Commit:** "feat: Add token cost estimator and budget manager"

```

---

### PROMPT 58: Cursor Rules Marketplace

> **Source:** FUTURE-TASKS.md #17
> **Effort:** 2 weeks

```

## Task: Create Cursor Rules Marketplace

**Files to create:**

- cli/lib/marketplace/rules.js (NEW)
- cursor-rules/community/ (NEW directory)
- cursor-rules/enterprise/ (NEW directory)

**Requirements:**

1. Directory structure:

   ```
   cursor-rules/
   ├── official/ (31 core rules)
   ├── community/ (100+ rules)
   │   ├── react-native.mdc
   │   ├── rust-backend.mdc
   │   ├── python-django.mdc
   │   └── golang-api.mdc
   └── enterprise/
       ├── hipaa-compliance.mdc
       ├── soc2-security.mdc
       └── gdpr-privacy.mdc
   ```

2. Commands:
   - `ultra-dex rules list --community`
   - `ultra-dex rules install golang-api`
   - `ultra-dex rules publish my-rule.mdc`

3. Registry:
   - Remote registry at rules.ultra-dex.dev
   - Versioning and ratings

**Commit:** "feat: Add cursor rules marketplace"

```

---

## 🟢 MEDIUM PRIORITY - LONG-TERM VISION

---

### PROMPT 59: Ultra-Dex Cloud Platform Architecture

> **Source:** FUTURE-TASKS.md #15
> **Effort:** 3 months

```

## Task: Design Ultra-Dex Cloud Platform

**Files to create:**

- cloud/architecture.md (NEW)
- cloud/services/ (NEW directory)
- cloud/api/ (NEW directory)

**Requirements:**

1. Architecture:

   ```
   ┌─────────────────────────────────────────┐
   │         ULTRA-DEX CLOUD                 │
   ├─────────────────────────────────────────┤
   │ Template Editor │ AI Agents │ Analytics │
   ├─────────────────────────────────────────┤
   │         ULTRA-DEX API                   │
   ├─────────────────────────────────────────┤
   │ CLI │ VS Code │ Cursor │ GitHub │ Web  │
   └─────────────────────────────────────────┘
   ```

2. Services:
   - Template Cloud (store, version, collaborate)
   - AI Agent Hub (pre-configured agents)
   - Task Orchestration (queue, dependencies)
   - Quality Gates (automated 21-step)

3. Pricing:
   | Tier | Price | Features |
   |------|-------|----------|
   | Free | $0 | CLI, Templates |
   | Pro | $19/mo | Cloud, AI agents |
   | Team | $49/mo/seat | Collaboration |
   | Enterprise | Custom | SSO, SLA |

**Commit:** "feat: Design Ultra-Dex Cloud platform architecture"

```

---

### PROMPT 60: Ultra-Dex Certification Program

> **Source:** FUTURE-TASKS.md #20
> **Effort:** 3 months

```

## Task: Create Certification Program

**Files to create:**

- docs/certification/README.md (NEW)
- docs/certification/levels/ (NEW)
- docs/certification/exams/ (NEW)

**Requirements:**

1. Certification Levels:
   - **Associate** ($99): Template mastery
   - **Professional** ($199): Full methodology
   - **Architect** ($399): Enterprise systems
   - **Instructor** ($499): Teach others

2. Exam format:
   - Multiple choice questions
   - Practical project submission
   - Peer review

3. Benefits:
   - Digital badge
   - LinkedIn certification
   - Community recognition
   - Job board access

**Commit:** "feat: Add certification program framework"

```

---

### PROMPT 61: Ultra-Dex University (Online Learning)

> **Source:** FUTURE-TASKS.md #21
> **Effort:** 6 months

```

## Task: Create Online Learning Platform

**Files to create:**

- university/README.md (NEW)
- university/courses/ (NEW)
- university/workshops/ (NEW)

**Requirements:**

1. Course catalog:
   - Free: Methodology basics
   - Paid: Masterclasses ($49-149)
   - Live: Workshops ($199-299)
   - Corporate: Training ($999+)

2. Platform features:
   - Video lessons
   - Interactive exercises
   - Progress tracking
   - Certificates

3. Integration:
   - Teachable/Podia backend
   - Ultra-Dex CLI integration
   - Community forum

**Commit:** "feat: Add Ultra-Dex University framework"

```

---

### PROMPT 62: Fully Autonomous AI Agent

> **Source:** FUTURE-TASKS.md #18 (Moonshot)
> **Effort:** 6 months

```

## Task: Create Fully Autonomous Development Agent

**Files to create:**

- cli/lib/autonomous/agent.js (NEW)
- cli/lib/autonomous/pipeline.js (NEW)
- cli/lib/autonomous/gates.js (NEW)

**Requirements:**

1. Autonomous Flow:
   - Takes raw idea from voice/text
   - Fills complete 34-section plan
   - Breaks into atomic tasks
   - Writes production code
   - Runs human approval gates
   - Deploys to production
   - Monitors and iterates

2. Human Gates:
   - Architecture approval
   - Security review
   - Deploy confirmation

3. Commands:
   - `ultra-dex auto "build SaaS" --full`
   - `ultra-dex auto --approve checkpoint-3`

**Commit:** "feat: Add fully autonomous development agent"

```

---

### PROMPT 63: Ultra-Dex OS Concept

> **Source:** FUTURE-TASKS.md #19 (Moonshot)
> **Effort:** 1 year

```

## Task: Design Ultra-Dex Operating System

**Files to create:**

- os-concept/README.md (NEW)
- os-concept/architecture.md (NEW)
- os-concept/components/ (NEW)

**Requirements:**

1. Core Components:

   ```
   ultra-dex-os/
   ├── Workspaces (Project containers)
   ├── Agent Pool (AI workers)
   ├── Memory Bank (Context persistence)
   ├── Quality Engine (21-step automation)
   └── Deploy Layer (One-click production)
   ```

2. Features:
   - Project isolation
   - Resource management
   - Agent scheduling
   - Cross-project learning

**Commit:** "feat: Design Ultra-Dex OS concept"

```

---

## 🔵 COMPLETE SaaS EXAMPLES (From ADVANCED-WORKFLOWS.md)

---

### PROMPT 64: Complete Stripe Payment Integration Example

> **Source:** ADVANCED-WORKFLOWS.md Example 1

```

## Task: Document Complete Stripe Integration Workflow

**Files to create:**

- examples/stripe-payments/README.md (NEW)
- examples/stripe-payments/schema.prisma (NEW)
- examples/stripe-payments/api/ (NEW)

**Full workflow documented:**

1. @Planner: Task breakdown
2. @Research: Provider comparison
3. @CTO: Architecture approval
4. @Database: Schema with Subscription model
5. @Backend: Checkout session, webhook handler
6. @Frontend: Checkout button
7. @Security: Webhook signature validation
8. @DevOps: Environment setup

**Commit:** "docs: Add complete Stripe integration example"

```

---

### PROMPT 65: Complete Email Notification System Example

> **Source:** ADVANCED-WORKFLOWS.md Example 2

```

## Task: Document Complete Email System Workflow

**Files to create:**

- examples/email-notifications/README.md (NEW)
- examples/email-notifications/templates/ (NEW)
- examples/email-notifications/queue/ (NEW)

**Full workflow documented:**

1. @Research: Resend vs SendGrid vs AWS SES
2. @CTO: Async processing with BullMQ
3. @Database: EmailLog schema
4. @Backend: Email service with React Email
5. @Testing: Test email sending

**Commit:** "docs: Add complete email notification example"

```

---

## 📊 PHASE 8 SUMMARY

| # | Feature | Source | Effort | Priority |
|---|---------|--------|--------|----------|
| 51 | Persistent Memory (PPM) | 01-persistent-memory.md | 3 weeks | 🔴 Critical |
| 52 | Model Router | 02-model-router.md | 2 weeks | 🔴 Critical |
| 53 | Quality Gates | 03-quality-gates.md | 2 weeks | 🔴 Critical |
| 54 | Decision Ledger | 04-decision-ledger.md | 1 week | 🔴 Critical |
| 55 | MCP Context Bus | 05-mcp-context-bus.md | 1 week | 🔴 Critical |
| 56 | SDK (AI Agent Protocol) | FUTURE-TASKS.md | 4 weeks | 🟡 High |
| 57 | Token Estimator | FUTURE-TASKS.md | 2 days | 🟡 High |
| 58 | Cursor Rules Marketplace | FUTURE-TASKS.md | 2 weeks | 🟡 High |
| 59 | Cloud Platform | FUTURE-TASKS.md | 3 months | 🟢 Medium |
| 60 | Certification | FUTURE-TASKS.md | 3 months | 🟢 Medium |
| 61 | University | FUTURE-TASKS.md | 6 months | 🟢 Medium |
| 62 | Autonomous Agent | FUTURE-TASKS.md | 6 months | 🔵 Moonshot |
| 63 | OS Concept | FUTURE-TASKS.md | 1 year | 🔵 Moonshot |
| 64 | Stripe Example | ADVANCED-WORKFLOWS | 1 day | 📚 Docs |
| 65 | Email Example | ADVANCED-WORKFLOWS | 1 day | 📚 Docs |

---

## 📁 FILES TO MOVE TO docs/completed/

These archived files have been fully extracted:
- `_old/archived_docs/excessive_documentation/01-persistent-memory.md` → Prompt 51
- `_old/archived_docs/excessive_documentation/02-model-router.md` → Prompt 52
- `_old/archived_docs/excessive_documentation/03-quality-gates.md` → Prompt 53
- `_old/archived_docs/excessive_documentation/04-decision-ledger.md` → Prompt 54
- `_old/archived_docs/excessive_documentation/05-mcp-context-bus.md` → Prompt 55
- `_old/archived_docs/FUTURE-TASKS.md` → Prompts 56-63
- `_old/archived_docs/excessive_documentation/ADVANCED-WORKFLOWS.md` → Prompts 64-65

---

**Total Prompts Now: 65 (Phase 5: 15 + Phase 6: 20 + Phase 7: 15 + Phase 8: 15)**

*All prompts are copy-paste ready for Codex/Claude/Gemini/Qwen!*
```
