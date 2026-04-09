# Ultra-Dex Demo Script (3 Minutes)

## 0:00 - Intro

- "This is Ultra-Dex: a CLI orchestration layer for AI coding workflows."
- Show project root and key docs.

## 0:20 - Initialize

- Run: `ultra-dex init`
- Call out generated context and plan structure.

## 0:45 - Plan + Generate

- Run: `ultra-dex plan "Build auth module with RBAC"`
- Run: `ultra-dex generate --stream`
- Show streaming output and task decomposition.

## 1:30 - Execute with Safety

- Run: `ultra-dex exec "npm test" --sandbox`
- Note isolation/safety behavior.

## 2:00 - Verify

- Run: `ultra-dex verify --full`
- Show pass/fail summary and blockers.

## 2:30 - Governance + Memory

- Run: `ultra-dex ledger query auth`
- Run: `ultra-dex memory status --visual`
- Show auditability and continuity.

## 2:50 - Close

- "From idea to controlled execution with traceability."
- Point to `docs/FEATURES.md` for current-state scope.
