# Ultra-Dex Strategic Roadmap (v4.0+)

> **Derived from:** Orchestration/Copilot.md & Copilot2.md
> **Vision:** "The Kubernetes of AI Coding"

## Phase 1: The Persistent Project Mind (PPM)
*Target: Q1 2026*

### 1.1 Memory Daemon
- Build a background process that watches git events and file saves.
- Auto-summarize every commit into the "Cold Memory" graph.

### 1.2 Vector Integration
- Implement `ultra-dex memory search` using local embeddings.
- Add "Context Injection" to all agent prompts to pull relevant memories.

## Phase 2: The Intelligent Model Router
*Target: Q2 2026*

### 2.1 Task Classifier
- Build a lightweight LLM-based classifier to tag tasks (Code, Docs, Security).
- Implement the `router.json` policy engine.

### 2.2 Cost & Performance Optimizer
- Track token usage per task and agent.
- Dashboard visualization of "Saved Cost" by using smaller models for simple tasks.

## Phase 3: Enterprise Quality Gates
*Target: Q3 2026*

### 3.1 Policy Enforcement
- Hard block commits that violate `quality-gate.json`.
- "Self-Healing": If a gate fails, the agent is automatically re-invoked with the error log.

### 3.2 Decision Ledger
- Immutable append-only log of all AI reasoning.
- `ultra-dex audit --since 30d` command to generate compliance reports.

---

## Technical Debt to Resolve
- Replace Regex parsing in `graph.js` with Tree-Sitter for 100% accuracy.
- Paginate the Code Property Graph for 10k+ file repos.
