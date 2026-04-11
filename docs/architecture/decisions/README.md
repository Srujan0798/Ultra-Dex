# Architecture Decision Records (ADRs)

> Records of architectural decisions made in Ultra-Dex with context and consequences.

---

## What are ADRs?

Architecture Decision Records (ADRs) capture **why** we made specific technical decisions, **what alternatives we considered**, and **the consequences** of our choices.

Each ADR:

- Documents a single decision
- Explains the context and problem
- Lists alternatives considered
- Documents consequences (positive and negative)
- Provides validation and metrics

---

## ADR Index

| #                                              | Title                      | Status      | Date       | Owner |
| ---------------------------------------------- | -------------------------- | ----------- | ---------- | ----- |
| [001](./ADR-001-typescript-over-javascript.md) | TypeScript over JavaScript | ✅ Accepted | 2024-03-15 | @CTO  |
| [002](./ADR-002-esm-over-commonjs.md)          | ES Modules over CommonJS   | ✅ Accepted | 2024-03-20 | @CTO  |
| [003](./ADR-003-ai-provider-routing.md)        | Multi-Provider AI Routing  | ✅ Accepted | 2024-04-01 | @CTO  |
| [004](./ADR-004-three-tier-memory.md)          | 3-Tier Memory Architecture | ✅ Accepted | 2024-04-15 | @CTO  |
| [005](./ADR-005-native-test-runner.md)         | Native Node.js Test Runner | ✅ Accepted | 2024-05-01 | @CTO  |

---

## Status Definitions

| Status            | Meaning                           |
| ----------------- | --------------------------------- |
| ✅ **Accepted**   | Decision implemented and in use   |
| 🔄 **Proposed**   | Under discussion, not yet decided |
| ⚠️ **Deprecated** | Decision superseded by newer ADR  |
| ❌ **Rejected**   | Alternative was chosen instead    |

---

## How to Create a New ADR

Use the `/architecture` agent or create a new file following this template:

```markdown
# ADR-XXX: Title

**Status:** 🔄 Proposed / ✅ Accepted / ⚠️ Deprecated / ❌ Rejected
**Date:** YYYY-MM-DD
**Decision Owner:** @Agent
**Stakeholders:** Team

---

## Context

Describe the problem or requirement.

---

## Decision

The decision that was made.

---

## Consequences

### ✅ Positive

### ❌ Negative

### 🔄 Neutral

---

## Alternatives Considered

| Option   | Pros | Cons | Verdict     |
| -------- | ---- | ---- | ----------- |
| Option 1 | ...  | ...  | ❌ Rejected |
| Option 2 | ...  | ...  | ✅ Accepted |

---

## References

- Links to related ADRs
- External documentation

---

**Last Updated:** YYYY-MM-DD
```

---

## Related Resources

- [Decision Ledger](../04-decision-ledger.md) - Immutable audit trail
- [Architecture Overview](../overview.md) - System design
- [Consolidated Architecture](../CONSOLIDATED-ARCHITECTURE.md) - Full architecture doc

---

_ADRs help us remember why we made decisions and avoid revisiting settled questions._
