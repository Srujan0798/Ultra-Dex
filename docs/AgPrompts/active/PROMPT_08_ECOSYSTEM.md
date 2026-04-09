# PROMPT_08_ECOSYSTEM.md - v4.3 Ecosystem & Polish

## Context

v4.0, v4.1, and v4.2 are complete. We now need to build the **Ecosystem** around the core CLI to make it developer-friendly and accessible.

## 🎯 Goal

Implement the "Outer Loop" of the Ultra-Dex ecosystem:

1. **Documentation** (Static Site + API Refs)
2. **Editor Extensions** (VS Code)
3. **Desktop App Structure** (Electron/Tauri prep)

## 📋 Task 1: API & Architecture Documentation

**Target:** `docs/api/` and `docs/architecture/`

Create these markdown files with detailed content:

1. `docs/api/cli-reference.md`: Comprehensive guide for all 135+ CLI commands.
2. `docs/api/integrations.md`: Usage guide for the 14 integrated tools (Stripe, GitHub, etc).
3. `docs/api/agents.md`: Developer guide for Swarm, Meta-Orchestrator, and custom agents.
4. `docs/architecture/system-overview.md`: High-level architecture diagram and explanation.

## 📋 Task 2: VS Code Extension

**Target:** `extensions/vscode/`

Create a functional VS Code extension that wraps the CLI:

1. `package.json`: Manifest with `ultra-dex` commands in the command palette.
2. `src/extension.ts`: Activation event and CLI execution logic.
3. `src/commands.ts`: Wrappers for `ultra-dex start`, `ultra-dex plan`, `ultra-dex fix`.
4. `src/sidebar.ts`: A simple TreeView showing Project Status (Health, Budget, Tasks).

## 📋 Task 3: Desktop App Scaffold

**Target:** `apps/desktop/`

Scaffold a simple Electron or Tauri app to wrap the Dashboard:

1. `package.json`: Electron/React setup.
2. `src/main.js`: Main process window creation.
3. `src/preload.js`: Context bridge for CLI interactions.

## 📋 Task 4: Governance Rules

**Target:** `.cursor/rules/` and `governance/`

Finalize the governance rules:

1. `.cursor/rules/ultra-dex-style.md`: Strict coding style guide.
2. `.cursor/rules/security.md`: Security best practices (no hardcoded secrets).

## 🚀 Execution Strategy

Run this prompt in a separate terminal to let the agent build out these non-blocking ecosystem components while the core team publishes tests.
