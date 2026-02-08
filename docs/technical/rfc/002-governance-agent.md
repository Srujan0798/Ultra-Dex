# RFC 002: The Governance Agent (ADR Enforcement)

## 🎯 Objective
Implement a specialized **Governance Agent** (`@Governor`) within the Ultra-Dex orchestration layer. Its sole purpose is to enforce Architectural Decision Records (ADRs) and Compliance Rules *statistically* and *semantically* before code is merged.

## 🧠 The Problem
Developers (and AI Agents) often violate architectural constraints because they are "forgotten" or buried in docs.
*   *Example:* "No external UI libraries" (ADR-004) -> Agent installs `chakra-ui`.
*   *Example:* "All entities must use UUIDs" (ADR-012) -> Agent uses `integers`.

## 🛡️ The Solution: "Active Governance"

We propose a new middleware hook in the `verify_task` pipeline.

### 1. The ADR Index
We already have `store_decision`. We will structure the ADRs into a machine-readable index:
```json
// .ultra-dex/adrs.json
[
  {
    "id": "ADR-004",
    "title": "No External UI Libraries",
    "status": "active",
    "patterns": ["npm install @chakra", "import .* from '@chakra'"],
    "enforcement": "strict"
  }
]
```

### 2. The Governor Agent
A lightweight LLM (Claude Haiku / GPT-3.5) that runs on every `git commit` or `verify_task`.

**Input:**
- The `diff` of changes.
- The `adrs.json` active list.

**Prompt:**
> "You are the Governance Engine. Review this diff against the following 12 Active ADRs.
> If any line violates a rule, block the commit and return the error.
> Diff: ..."

### 3. Integration Point
Add to `cli/lib/mcp/tools.js` in the `verify_task` tool:

```javascript
// Pseudo-code for v4.1
await governorAgent.audit(diff);
```

## 📋 Implementation Tasks

### Phase 1: The Primitive
- [ ] Create `.ultra-dex/adrs.json` schema.
- [ ] Update `store_decision` tool to write to this JSON.

### Phase 2: The Agent
- [ ] Create `agents/5-quality/governor.md` (System Prompt).
- [ ] Implement `governor.js` in CLI to run the check.

### Phase 3: The Hook
- [ ] Add pre-commit hook or `verify_task` step.

---

**Status:** Proposed for v4.1
**Owner:** @Architecture
