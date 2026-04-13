# Ultra-Dex v2.0 Migration Guide (Hard Reset)

This document outlines the changes made during the Phase 0 "Hard Reset" to transition from the legacy agent architecture to the new DexGraph-based architecture.

## Overview
Ultra-Dex v2.0 is a complete architectural reset. All legacy modules from `src/core/` that do not fit the DexGraph model have been archived, and a new canonical folder structure has been established.

## New Folder Structure
- `core/`: Task graph compiler, scheduler, and engine.
- `runtime/`: Worker nodes, execution dispatch, and the core engine.
- `memory/`: Unified MUNI memory system (Episodic, Semantic, State).
- `dexgraph/`: The core DAG workflow engine.
- `adapters/`: External system integration layer.
- `governance/`: Policy and rule engine.
- `tools/`: Tool registry and protocols.
- `observability/`: Logging and event hooks.
- `cli/`: New `ultradex` CLI entry point.
- `sdk/`: Developer API surface.

## Archived Modules
All archived code is located in `archive/v1/src/core/`. This includes:
- Legacy Agent system (Planner, Backend, Frontend, etc.)
- Legacy Billing, Auth, and Marketing systems
- Legacy Infrastructure and Analytics modules

See `archive/v1/AUDIT.md` for a full list of archived directories and the reasoning for each.

## Breaking Changes
- **Version Reset**: package.json version is now `2.0.0-alpha.0`.
- **Module Paths**: Any code importing from `src/core/*` needs to be updated or migrated to the new top-level directories.
- **Memory System**: MUNI has been migrated to `memory/`. Legacy `MemoryManager` imports should be replaced with `MemoryStore`, `SemanticSearch`, or `SessionManager` from the `memory/` module.

## How to Run Old Code
If you need to reference or run legacy logic:
1. Logic still exists in `archive/v1/`.
2. History is preserved via `git mv`.
3. Use `archive/v1/AUDIT.md` to find the original location of any module.

---
*Migration completed 2026-04-13*
