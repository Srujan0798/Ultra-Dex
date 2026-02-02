# Decision Ledger & Traceability

> **Status:** Draft Specification (v1.0)
> **Source:** Orchestration/Copilot.md (Strategic Requirement #4)

## 1. Overview
Trust is the barrier to AI adoption. The Decision Ledger provides an immutable audit trail of *why* an AI agent made a change, *what* alternatives it considered, and *which* constraints it satisfied.

## 2. Ledger Entry Schema

Every significant action by an agent creates a "Block" in the ledger.

```json
{
  "block_id": "blk_8a7b9c...",
  "timestamp": "2024-02-14T10:00:00Z",
  "task_id": "task_auth_01",
  "agent": "CTO",
  "action": "Architecture Decision",
  "decision": {
    "selected_option": "JWT with httpOnly cookies",
    "rejected_options": [
      "Session IDs (too stateful)",
      "OAuth only (too complex for MVP)"
    ],
    "reasoning": "Statelessness required for planned serverless deployment."
  },
  "constraints_checked": [
    { "rule": "No stateful sessions", "status": "PASS" },
    { "rule": "Secure storage", "status": "PASS" }
  ],
  "artifacts": [
    "docs/auth-architecture.md",
    "src/lib/auth.ts"
  ]
}
```

## 3. Storage Format
- **Local**: `.ultra/ledger.jsonl` (Append-only JSON Lines) for human readability.
- **Git Integration**: Decisions can be automatically appended to commit messages via `ultra-dex commit`.

## 4. Usage
- **Audit**: "Why did we choose MongoDB?" -> `ultra-dex ledger search "database"`
- **Rollback**: "Revert the auth changes from yesterday" -> Uses ledger to identify all related files.
- **Compliance**: Generate a PDF report of all architectural decisions for compliance review.
