# Technical Debt Backlog

**Generated:** 2026-04-14  
**Scope:** `src/core/` archive decision for V2.0 Phase 0 W2  
**Reference audit:** `docs/skills/engineering/tech-debt/TECHNICAL_DEBT_AUDIT.md`

---

## Executive Summary

The existing backlog of 156 debt items is still valid, but for Phase 0 W2 the real decision is architectural triage, not line-item cleanup.

`src/core/` currently contains **56 top-level directories**. Under the V2.0 hard-reset invariants, no legacy `src/core/*` directory should remain a canonical runtime dependency for new V2.0 modules. That means the Phase 0 decision framework is:

- **KEEP in place:** `0`
- **MIGRATE selectively into new V2.0 top-level modules:** `26`
- **ARCHIVE to `archive/v1/` after audit:** `30`

This backlog converts the generic debt list into a Phase 0 execution plan for archive vs migrate.

---

## Phase 0 Decision Rule

Use this rule consistently:

- **MIGRATE** when a directory contains reusable capability that maps to the V2.0 target structure (`memory/`, `adapters/`, `governance/`, `observability/`, `runtime/`, `tools/`, `cli/`, `sdk/`, `core/`).
- **ARCHIVE** when a directory is tied to the legacy agent-framework/product-surface model, duplicates V2.0 concepts, or would create cross-contamination.
- **KEEP in place** is intentionally empty for `src/core/` because Phase 0 forbids new V2.0 directories from depending on legacy `src/`.

---

## P0: Immediate Archive/Migrate Priorities

### TD-V20-001: `src/core/memory` must be extracted first

- **Decision:** MIGRATE
- **Target:** `memory/episodic/`, `memory/semantic/`, `memory/state/`
- **Why:** Phase 0 W3 depends on this; memory is explicitly part of the new architecture
- **Risk if delayed:** new scheduler/context work will depend on legacy memory assumptions

### TD-V20-002: `src/core/governance` must be isolated from legacy flows

- **Decision:** MIGRATE
- **Target:** `governance/`
- **Why:** governance is a first-class V2.0 boundary and cannot stay buried in legacy code
- **Risk if delayed:** policy checks remain optional or entangled with old orchestration

### TD-V20-003: `src/core/observability`, `monitoring`, `telemetry`, `audit` need consolidation

- **Decision:** MIGRATE selectively
- **Target:** `observability/` plus governance audit hooks
- **Why:** four overlapping concerns currently fragment logging, tracing, and audit
- **Risk if delayed:** duplicate instrumentation and inconsistent event semantics

### TD-V20-004: legacy orchestration surfaces must not leak into DexGraph

- **Directories:** `agents`, `ai`, `coordination`, `mesh`, `meta`, `orchestration`, `team`
- **Decision:** ARCHIVE unless a specific utility is explicitly extracted
- **Why:** these represent the old agent-centric model, not the V2.0 control-plane boundary
- **Risk if delayed:** new DexGraph modules inherit obsolete abstractions

### TD-V20-005: integration surface must be split cleanly

- **Directories:** `adapters`, `connectors`, `integration`, `integrations`, `mcp`, `plugins`, `webhooks`, `routing`
- **Decision:** MIGRATE selectively
- **Target:** `adapters/`, `tools/`, `runtime/executor/`
- **Why:** these are execution/integration concerns and belong outside graph core
- **Risk if delayed:** provider logic bleeds into scheduler/dispatcher design

### TD-V20-006: `src/core/utils` is a hidden dependency sink

- **Decision:** MIGRATE selectively
- **Target:** shared V2.0 helpers only
- **Why:** generic utility modules often smuggle legacy behavior into new code
- **Risk if delayed:** hard-reset boundaries fail silently through helper imports

---

## Recommended Classification

## MIGRATE

These directories contain concepts or code worth preserving, but only through selective extraction into the new V2.0 structure.

| Legacy directory | Target area | Priority | Notes |
| --- | --- | --- | --- |
| `adapters` | `adapters/` | P0 | align with `executionAdapter.ts` contract |
| `audit` | `observability/`, `governance/` | P1 | split audit trail from policy logic |
| `cache` | `memory/state/`, `runtime/` | P2 | migrate only reusable caching primitives |
| `connectors` | `adapters/`, `tools/registry/` | P1 | preserve connector contracts, not old plumbing |
| `database` | `memory/state/`, `runtime/` | P2 | migrate persistence utilities, not old schema sprawl |
| `governance` | `governance/` | P0 | core V2.0 boundary |
| `init` | `cli/`, `sdk/` | P2 | only if scaffold/init flows are still relevant |
| `integration` | `adapters/`, `runtime/executor/` | P2 | merge into one integration model |
| `integrations` | `adapters/`, `runtime/executor/` | P2 | de-duplicate with `integration` |
| `interfaces` | `adapters/`, `sdk/`, `core/` | P1 | salvage stable contracts only |
| `mcp` | `tools/`, `adapters/` | P1 | preserve protocol-facing pieces |
| `memory` | `memory/episodic/`, `memory/semantic/`, `memory/state/` | P0 | primary Phase 0 migration area |
| `monitoring` | `observability/` | P1 | merge with telemetry/observability |
| `observability` | `observability/` | P0 | aligns directly with V2.0 target |
| `orchestration` | `core/`, `runtime/` | P1 | salvage patterns, not agent-era abstractions |
| `performance` | `observability/` | P2 | keep benchmarks/profiling primitives only |
| `plugins` | `tools/registry/`, `sdk/` | P2 | preserve extension concepts selectively |
| `protocols` | `governance/`, `tools/`, `sdk/` | P2 | migrate only still-relevant protocol contracts |
| `quality` | `governance/`, `dexgraph/verifier.ts`, `testing/` | P1 | use for verification and policy ideas |
| `queue` | `runtime/executor/` | P1 | if still needed for async execution |
| `rate-limiting` | `governance/`, `runtime/` | P2 | salvage only concrete enforcement utilities |
| `reliability` | `runtime/`, `observability/` | P2 | extract retries/failover utilities carefully |
| `routing` | `adapters/`, `runtime/executor/` | P1 | execution/provider routing only |
| `sandbox` | `runtime/executor/` | P1 | useful if execution isolation survives architecture review |
| `security` | `governance/`, `runtime/` | P1 | separate control-plane policy from app security legacy |
| `server` | `cli/`, future API surface | P2 | keep only reusable infra, not legacy serving model |
| `services` | varies | P2 | migrate case-by-case; likely over-broad and fragmented |
| `telemetry` | `observability/` | P1 | merge with monitoring/observability |
| `testing` | `tests/`, validation harnesses | P2 | preserve reusable test utilities |
| `utils` | varies | P1 | extract only narrow shared helpers |
| `webhooks` | `runtime/executor/`, `adapters/` | P2 | only if webhook execution is still in scope |

## ARCHIVE

These directories should move to `archive/v1/` after audit, unless a specific file is explicitly extracted during migration.

| Legacy directory | Reason to archive | Priority |
| --- | --- | --- |
| `agents` | legacy agent-framework surface conflicts with DexGraph model | P0 |
| `ai` | provider/runtime abstractions from pre-reset architecture | P0 |
| `analytics` | product-layer concern, not Phase 0 core | P2 |
| `auth` | non-core product surface for hard reset | P2 |
| `billing` | non-core product surface for hard reset | P2 |
| `chaos` | premature for current MVO | P3 |
| `cicd` | deployment concern, not core architecture reset | P3 |
| `coordination` | overlaps old swarm/agent abstractions | P1 |
| `di` | keep only if specific utility is proven necessary; default archive | P3 |
| `enterprise` | product packaging, not orchestration core | P3 |
| `finance` | non-core business functionality | P3 |
| `infrastructure` | overly broad legacy infra bucket | P3 |
| `marketing` | not part of V2.0 runtime foundation | P3 |
| `marketplace` | ecosystem layer, not Phase 0 | P3 |
| `mesh` | old coordination model superseded by DexGraph boundaries | P1 |
| `meta` | meta-agent concepts do not map cleanly to V2.0 | P2 |
| `multimodal` | capability layer, not foundation architecture | P3 |
| `optimization` | defer until post-foundation | P3 |
| `skills` | legacy skill runtime not part of V2.0 hard reset core | P2 |
| `streaming` | not required for Gate 0-Gate 4 | P3 |
| `system` | catch-all legacy bucket; archive unless specifically extracted | P2 |
| `team` | legacy human/agent coordination surface | P2 |
| `templates` | content/scaffold library, not architecture foundation | P3 |
| `tenant` | multi-tenant product concern, not Phase 0 | P3 |
| `tests` | legacy test layout tied to archived surfaces | P2 |

## REVIEW BEFORE DECIDING

These are the gray-area directories. Default action is archive unless a named migration target is identified during audit.

| Legacy directory | Default | Review question |
| --- | --- | --- |
| `database` | MIGRATE | is there reusable state-store logic or only legacy schema baggage? |
| `di` | ARCHIVE | is dependency injection actually helping the new simpler module graph? |
| `init` | MIGRATE | is this useful for CLI bootstrap or just old app scaffolding? |
| `performance` | MIGRATE | are there real benchmarks/profilers worth preserving? |
| `server` | MIGRATE | do we need any of this before post-MVO API work? |
| `services` | MIGRATE | can this be decomposed, or is it just a legacy dumping ground? |

---

## Phase 0 Backlog by Priority

## P0 This Week

1. Complete `src/core/` top-level directory audit with a decision for every directory.
2. Migrate `memory`, `governance`, and `observability` concepts first.
3. Freeze legacy agent/orchestration directories as archive candidates.
4. Add a hard rule: no new V2.0 module imports from `src/core/*`.

## P1 Before Phase 1/2 Integration

1. Resolve the integration surface across `adapters`, `connectors`, `mcp`, `routing`, and `webhooks`.
2. Extract only the minimum viable utilities from `utils`, `interfaces`, `quality`, and `queue`.
3. Consolidate `audit`, `monitoring`, `observability`, and `telemetry` into one V2.0 observability model.

## P2 Before Gate 4

1. Decide whether `server`, `services`, and `database` contain post-MVO reusable assets.
2. Revisit archived product-surface areas only if they become direct blockers.
3. Keep the archive as reference, not dependency.

---

## Key Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Selective migration turns into hidden full-port | high | require explicit target path for every migrated file |
| Generic `utils` imports bypass hard-reset boundaries | high | review and whitelist migrated helpers |
| Legacy orchestration concepts leak into DexGraph naming and contracts | high | keep ADR/spec docs authoritative |
| Audit stops at directory names and misses hot files | medium | follow up with file-level review for P0/P1 directories |
| Product-surface modules consume early bandwidth | medium | defer non-core areas until after Gate 4 |

---

## Recommended Outcome

For Phase 0 W2, the correct move is not “clean up `src/core/`.” The correct move is:

1. **Archive most of it intact**
2. **Extract only the capabilities that directly map to the V2.0 architecture**
3. **Prevent any new dependency on legacy `src/core/`**

That gives V2.0 a clean control-plane foundation while still preserving history and reusable ideas from v1.
