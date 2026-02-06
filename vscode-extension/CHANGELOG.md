# Changelog

All notable changes to the Ultra-Dex VS Code extension will be documented in this file.

## [3.3.0] - 2026-01-30

### Added

- **Code Execution Sandbox**: Execute selected code in Docker isolation directly from VS Code
- **Semantic Search**: Search your codebase by meaning, not just keywords (`Cmd+Shift+S`)
- **GitHub Integration**: Sync GitHub issues to Ultra-Dex tasks, create PRs from swarm output
- **Swarm Status Panel**: Real-time monitoring of agent swarm execution
- **Quick Actions Panel**: Common operations accessible from sidebar
- **New Commands**:
  - `Ultra-Dex: Execute in Sandbox` - Run code safely in Docker
  - `Ultra-Dex: Semantic Search` - Vector-based code search
  - `Ultra-Dex: Sync GitHub Issues` - Import issues as agent tasks
  - `Ultra-Dex: Start Active Kernel` - Launch MCP server
  - `Ultra-Dex: Open Dashboard` - Open God Mode dashboard

### Changed

- Updated agent explorer to show 17 agents (added @Orchestrator)
- Improved context menu with conditional visibility
- Enhanced status bar with real-time alignment scoring

### Fixed

- Agent prompt copying now works reliably
- Hover provider performance improvements
- Better error handling for missing CONTEXT.md

## [3.2.0] - 2026-01-29

### Added

- Sidebar Agent Explorer grouped by 7 tiers
- Status bar alignment score indicator
- Right-click context menu for asking agents
- Keyboard shortcuts for common operations

### Changed

- Reorganized agent prompts by capability tier
- Improved extension activation performance

## [1.0.0] - 2026-01-28

### Added

- Initial release
- Agent Explorer view
- Basic command palette commands
- Configuration options for AI provider
