# Changelog

All notable changes to Ultra-Dex will be documented in this file.

## [Unreleased]

### Added - Test Infrastructure (February 5, 2026)

- **456 new tests** across security, memory, graph, and provider modules
- **Security test suite** (170 tests): API keys, RBAC, token storage, config management
- **Memory system tests** (132 tests): Tiered architecture, embeddings, vector store, compression
- **Graph & RAG tests** (105 tests): Semantic knowledge graph, FalkorDB client
- **Provider & router tests** (49 tests): Streaming providers, smart task routing
- Comprehensive TEST_COVERAGE_REPORT.md and updated test documentation

### Changed

- Test coverage improved from 41.27% to ~60% (target: 70%)
- Test file count increased from 40 to 85+ (+112%)
- Test case count increased from 281 to 737+ (+162%)
- README.md now shows accurate coverage metrics

### Fixed

- Vision agent no longer returns fake placeholder responses
- Integration commands clearly labeled as "Alpha"
- NPM plugin installation provides clear guidance
- All security-critical modules now properly validated

## [4.0.0] - 2026-02-05

### Added

- Ultra Protocol (`ultra://`) resources for state, context, decisions, and memory search
- Self-healing evaluation loops with model escalation
- Multi-tier memory schema + graph traversal engine
- Gamified challenges, leaderboards, and achievements
- Template pack manager and SaaS starter template
- Enterprise/DoD visual theming upgrades and snap cleanup
- Dashboard V2 kernel endpoints (heartbeat, memory stream)

### Changed

- Model routing now supports per-project strategy overrides
- Telemetry sanitizes PII and supports encrypted local logs

### Fixed

- MCP HTTP test suite stabilized with in-process kernel boot

## [3.4.5] - 2026-02-04

Initial baseline: 41.27% coverage, 350+ tests

---

**Upcoming: v3.5.0 (Launch: February 14, 2026)**
Theme: Security, Reliability, and Honest Metrics
Status: ✅ Launch Ready
