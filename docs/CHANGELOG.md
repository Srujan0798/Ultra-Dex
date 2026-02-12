# Changelog

All notable changes to Ultra-Dex will be documented in this file.

## [6.0.0] - 2026-02-12

### Added

- `gitFail/compliance/MAIN_AGENT_HANDOFF.md` with complete suspension/reinstatement workflow and command reference.
- Service-level AI provider registry and adapters under `src/services/ai-providers/`.
- CLI integration adapters for Neon, Netlify, and Railway in both `apps/cli` and `src/platform/cli`.
- Extension development guide at `packages/EXTENSION-GUIDE.md`.
- Core regression test for provider registry behavior: `tests/core/ai-providers-registry.test.js`.

### Changed

- `plan` command now supports `--generate` in both command trees:
  - `apps/cli/lib/commands/plan.js`
  - `src/platform/cli/commands/plan.js`
- Docker dependency install now uses `HUSKY=0 npm install --omit=dev --legacy-peer-deps` for safer production installs.
- README updated to remove stale hardcoded benchmark/competitor claims and keep repository description policy-safe.

### Fixed

- `lru-cache` import compatibility in `apps/cli/lib/cache/index.js`.
- Profiler test flakiness in `apps/cli/test/profiler.test.js`.
- Plan CLI test alignment with option-driven flow in `apps/cli/test/plan.test.js`.

## [Previous Releases]

Historical release details are preserved in git history and tags.
