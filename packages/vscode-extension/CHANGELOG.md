# Ultra-Dex VS Code Extension — Changelog

All notable changes to the Ultra-Dex VS Code extension.

## [4.0.0] — 2026-04-12

### Added
- Sidebar with three panels: Agents, Tasks, Memory
- `ultra-dex.run` — Execute a single agent task from the command palette or sidebar
- `ultra-dex.swarm` — Launch a multi-agent swarm workflow
- `ultra-dex.config` — Open VS Code settings for Ultra-Dex configuration
- `ultra-dex.stop` — Stop the currently running task
- `ultra-dex.replay` — Replay the most recent task execution
- Memory search via `ultra-dex.memorySearch`
- Keyboard shortcuts:
  - `Ctrl+Shift+U` / `Cmd+Shift+U` — Run agent
  - `Ctrl+Shift+S` / `Cmd+Shift+S` — Run swarm
  - `Ctrl+Shift+M` / `Cmd+Shift+M` — Memory search
- VS Code settings for CLI path, default provider, default agent, and auto-save
- Support for 12+ AI providers with intelligent routing
- Task output auto-save to workspace

### Changed
- Renamed from `ultra-dex-vscode` to `Ultra-Dex` display name
- Updated to VS Code engine ^1.85.0

### Notes
- Requires `@ultra-dex/cli` to be installed globally
- At least one AI provider API key required in `.env`
