# 📈 Ultra-Dex AgPrompts Improvement Plan

## Mission Metadata
- **ID:** IMPROVEMENT_PLAN
- **Category:** Meta-Orchestration
- **Priority:** P1
- **Effort:** Ongoing
- **Status:** 🚧 In Progress

## Problem Statement
While the "Cognitive Core" and "Specifications" are at v6.0.0 (A+ quality), some historical "Phase Prompts" (Phases 5-16) are still using the v4.0.0 minimal format. This causes "Prompt Friction" when advanced agents try to execute older missions.

## Success Criteria
- [ ] All 240 prompts standardized to the v6.0.0 SPEC format.
- [ ] Zero broken links across the 58-file system.
- [ ] 100% adherence to the "Brutal/Sacred" tone.
- [ ] Validation script `validate.js` returns 0 warnings.

## Technical Specification

### 1. Standardization Protocol
For every prompt in the `phases/` directory, add:
- **Metadata:** ID, Category, Priority, Effort.
- **Problem Statement:** Why this task exists.
- **Success Criteria:** Measurable outcomes.
- **Security Considerations:** Relevant safety checks.

### 2. Tiered Quality Gates
- **Tier 1 (Core):** ARCHITECT, CODER, etc. MUST be v6.0.0. (✅ Complete)
- **Tier 2 (Active):** MOONSHOTS, ECOSYSTEM. MUST be v6.0.0. (✅ Complete)
- **Tier 3 (Phases):** PHASE5-20. Should be upgraded as implementation proceeds. (🚧 In Progress)

### 3. Verification Engine
- Use `node docs/AgPrompts/scripts/validate.js` for CI/CD.
- Fail any PR that introduces broken links or non-standard naming.

## Implementation Notes
- **Do not** change the IDs of existing prompts (#1-240) to preserve history.
- **Do** upgrade the "Status" from "Specification" to "v6.0.0 SPEC".

---

## 📅 Roadmap

| Milestone | Task | Status |
| :--- | :--- | :--- |
| **M1** | Standardize Core Personas | ✅ Complete |
| **M2** | Standardize Active Moonshots | ✅ Complete |
| **M3** | Standardize Phase 17-20 (Critical Path) | ✅ Complete |
| **M4** | Standardize Phase 5-16 (Legacy) | ⏳ Pending |

---

_Last Updated: February 10, 2026 | Ultra-Dex Core Team_