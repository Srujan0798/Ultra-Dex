---
id: PHASE-18-PROMPTS
title: 'Phase 18 - Completion & Inventory Protocol'
category: phases
priority: medium
status: pending
version: 6.0.0
last-updated: 2026-02-10
author: Ultra-Dex Team
related:
  - PROMPT-18-COMPLETION
  - SPEC-INVENTORY
tags:
  - completion
  - inventory
  - reconciliation
dependencies: []
testing:
  - method: manual
  - coverage: 0%
---

# Ultra-Dex Phase 18 - Completion & Inventory Protocol

> **Source:** COMMAND-INVENTORY-REAL.md, CODEX-IMPLEMENTATION-PLAN.md
> **Total:** 15 New Prompts (#201-215)
> **Date:** Feb 5, 2026

---

## 🔍 TRUTH RECONCILIATION

---

### PROMPT 201: The Great Reconciliation Check

> **Source:** COMMAND-INVENTORY-REAL.md vs Devin-CEO-Review.md
> **Status:** Critical Audit

```
## Task: Verify Command Inventory Reality

**Files to check:**
- cli/lib/commands/*.js

**Requirement:**
- Run a structural audit of the 21 "Production Ready" commands listed in Inventory.
- If file size < 50 lines -> Mark as "STUB" (Devin was right).
- If file size > 200 lines -> Mark as "REAL" (Inventory was right).
- Generate `REALITY-REPORT.md`.

**Commit:** "audit: Structural verification of command inventory"
```

---

### PROMPT 202: Beta Command Polish

> **Source:** COMMAND-INVENTORY-REAL.md (Beta List)
> **Status:** Completion

```
## Task: Polish Beta Commands

**Files to update:**
- cli/lib/commands/doctor.js (Add checks)
- cli/lib/commands/config.js (Add wizard)
- cli/lib/commands/monitoring.js (Add metrics)

**Requirement:**
- Take the 18 "Beta" commands and add missing validation/error handling.
- Ensure all have `--help` documentation.
- Remove any "TODO" comments.

**Commit:** "fix: Polish beta commands for production release"
```

---

## 📦 CODEX EXECUTION PLAN (Phases 3-9)

---

### PROMPT 203: VS Code Sidebar

> **Source:** CODEX-IMPLEMENTATION-PLAN.md (Phase 3.1)
> **Status:** Extension

```
## Task: Implement VS Code Sidebar

**Files to create:**
- vscode-extension/src/sidebar/SidebarProvider.ts

**Requirement:**
- Webview showing all 16 agents with icons.
- "Click to Copy Prompt" functionality.
- Display current "Alignment Score".
- Quick Actions: Generate, Build, Review.

**Commit:** "feat: Add VS Code agent sidebar webview"
```

---

### PROMPT 204: VS Code Hover Provider

> **Source:** CODEX-IMPLEMENTATION-PLAN.md (Phase 3.1)
> **Status:** Extension

```
## Task: Implement Context Hover

**Files to create:**
- vscode-extension/src/providers/HoverProvider.ts

**Requirement:**
- When user hovers over reference to `CONTEXT.md` sections.
- Show preview of that section in a tooltip.
- Support `@[AgentName]` hovering to show agent description.

**Commit:** "feat: Add context hover provider"
```

---

### PROMPT 205: Dashboard Enhancements

> **Source:** CODEX-IMPLEMENTATION-PLAN.md (Phase 6)
> **Status:** UI

```
## Task: Upgrade Dashboard UI

**Files to update:**
- cli/lib/dashboard/public/index.html

**Requirement:**
- Integrate `Chart.js` for Real-time Alignment Score.
- Add Dark/Light theme toggle.
- Create "Export Report" button.
- Add "Recent Actions" timeline widget.

**Commit:** "ui: Upgrade dashboard with charts and theming"
```

---

### PROMPT 206: Documentation Completion

> **Source:** CODEX-IMPLEMENTATION-PLAN.md (Phase 7)
> **Status:** Documentation

```
## Task: Complete Core Guides

**Files to create:**
- docs/MCP-INTEGRATION.md (Claude Desktop/Cursor setup)
- docs/CICD-GUIDE.md (GitHub Actions/Hooks)

**Requirement:**
- Full setup guides for external integrations.
- Step-by-step CI/CD configuration.
- API Reference for MCP endpoints.

**Commit:** "docs: Add MCP and CI/CD integration guides"
```

---

### PROMPT 207: MCP Test Suite

> **Source:** CODEX-IMPLEMENTATION-PLAN.md (Phase 8)
> **Status:** Testing

```
## Task: Add MCP Test Suite

**Files to create:**
- cli/test/mcp.test.js

**Requirement:**
- Test all MCP endpoints (GET/POST).
- Verify WebSocket connection handling.
- Test error scenarios.
- Mock AI provider responses.

**Commit:** "test: Add comprehensive MCP server tests"
```

---

### PROMPT 208: Publish Prep

> **Source:** CODEX-IMPLEMENTATION-PLAN.md (Phase 9)
> **Status:** DevOps

```
## Task: Prepare for NPM Publish

**Files to update:**
- cli/package.json

**Requirement:**
- Update version to `3.0.0`.
- Add correct keywords: `ai`, `orchestration`, `mcp`.
- Ensure `main` points to `bin/ultra-dex.js`.
- Run `npm run lint` and `npm run test` as pre-publish check.

**Commit:** "chore: Prepare package for v3.0.0 release"
```

---

## 🛠️ FINAL UTILITIES

---

### PROMPT 209: Dependency Graph Visualizer

> **Source:** COMMAND-INVENTORY-REAL.md
> **Status:** Utility

```
## Task: Visualize Dependency Graph

**Files to create:**
- cli/lib/commands/graph.js

**Requirement:**
- Scan imports and generate a Mermaid graph.
- Output to `ARCHITECTURE.md`.
- Visual verification of "Clean Architecture".

**Commit:** "feat: Add dependency graph visualization command"
```

---

### PROMPT 210: License & Headers

> **Source:** Standard Practice
> **Status:** Legal

```
## Task: Add License Headers

**Files to update:**
- cli/lib/**/*.js

**Requirement:**
- Add "Copyright (c) 2026 Ultra-Dex" header to all source files.
- Ensure `LICENSE` file is present in root (MIT/Apache).

**Commit:** "chore: Add license headers to source files"
```

---

### PROMPT 211: Contributor Guide

> **Source:** Standard Practice
> **Status:** Community

```
## Task: Create Contributing Guide

**Files to create:**
- CONTRIBUTING.md

**Requirement:**
- "How to add a new Agent".
- "How to add a new CLI command".
- "Code Style & Linting rules".
- "Pull Request Process".

**Commit:** "docs: Add contributor guidelines"
```

---

### PROMPT 212: Telemetry (Optional)

> **Source:** Product Logic
> **Status:** Analytics

```
## Task: Add CLI Telemetry (Opt-in)

**Files to create:**
- cli/lib/utils/telemetry.js

**Requirement:**
- Track command usage (anonymized).
- "Opt-in" prompt on first run: `ultra-dex init`.
- Help prioritize which commands to improve.

**Commit:** "feat: Add opt-in CLI usage telemetry"
```

---

### PROMPT 213: Self-Update

> **Source:** COMMAND-INVENTORY-REAL.md (Upgrade)
> **Status:** DevOps

```
## Task: Improve Self-Update

**Files to update:**
- cli/lib/commands/upgrade.js

**Requirement:**
- Check npm registry for new version.
- `ultra-dex upgrade` -> downloads and installs latest.
- Show "New version available" banner on run.

**Commit:** "feat: Improve CLI self-update mechanism"
```

---

### PROMPT 214: Shell Completion

> **Source:** DX
> **Status:** DX

```
## Task: Add Shell Autocomplete

**Files to create:**
- cli/scripts/install-completion.js

**Requirement:**
- Generate completion scripts for Zsh/Bash.
- Tab-completion for commands and flags.
- `ultra-dex install-completion`.

**Commit:** "feat: Add shell autocompletion"
```

---

### PROMPT 215: The Final Polish

> **Source:** All Sources
> **Status:** Polish

```
## Task: Final Codebase Polish

**Files to update:**
- All `.js` files

**Requirement:**
- Run `prettier --write .` on entire repo.
- Ensure consistent indentation (2 spaces).
- Fix any trailing commas or semicolon inconsistencies.
- The codebase should look like it was written by one person.

**Commit:** "style: Final codebase formatting polish"
```
