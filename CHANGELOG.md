# Changelog

## [2.0.0] - 2026-04-02

### Added

- Autonomous Agent Loop with AI-powered planning
- Checkpoint/Resume for interrupted loops
- Rate limiting with token bucket algorithm
- Health check endpoint (/health)
- Vector similarity search in MemoryBridge
- Telemetry and metrics export
- Interactive dashboard improvements

### Changed

- Migrated console.log to Logger class
- Improved test coverage for autonomous modules

### Fixed

- Race condition in MemoryBridge initialization
- Circuit breaker thread safety
- Path traversal vulnerability in task IDs
- Prompt injection in AI judge validation
