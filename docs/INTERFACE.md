# Ultra-Dex Interactive Interface

Ultra-Dex provides a terminal-first interactive layer for project orchestration, natural-language command routing, and project health inspection. This document matches the current `apps/cli` implementation.

## 1. Omni-Box Entry Point

The Omni-Box is the interactive dashboard exposed by the CLI. In the current implementation, the primary entry point is:

```bash
ultra-dex dashboard
```

The command supports these modes:

```bash
ultra-dex dashboard --once
ultra-dex dashboard --json
ultra-dex dashboard --web --port 3002
ultra-dex dashboard --cwd /path/to/project
```

The terminal dashboard is the default. It shows recent projects, quick actions, and system status, then lets you switch context or launch a command from the menu.

## 2. NLP Intent Router

Ultra-Dex includes an NLP intent router in `apps/cli/lib/nlp/router.js`. It converts free-form phrases into CLI intents by combining:

- semantic and keyword matching
- alias resolution
- contextual phrases such as build failures and health checks
- typo-friendly suggestions via the router's clarification flow

Examples supported by the current router:

- `My build is failing, help me fix it` -> `ultra-dex fix --build`
- `Initialize a new project called my-app` -> `ultra-dex init my-app`
- `Check system health` -> `ultra-dex doctor`
- `Run tests with verbose output` -> `ultra-dex test --verbose`

The router also exposes confidence scoring and follow-up suggestions so the REPL and voice entry points can offer "Did you mean?" style prompts.

## 3. Interactive Dashboard Usage

The dashboard at `apps/cli/lib/commands/dashboard.js` is a full command surface, not just a static status page.

### What It Shows
- Recent projects discovered from the current workspace, project history, and common dev directories
- Quick actions such as `run`, `status`, `align`, `review`, `serve`, and `dashboard --web`
- System status including git branch, alignment score, phase progress, usage summary, theme, MCP port, and runtime details

### How It Behaves
- `Enter` on a recent project switches the dashboard context to that project
- `Enter` on a quick action runs the corresponding Ultra-Dex command
- `--once` prints a snapshot and exits
- `--json` emits the dashboard model for scripts and automation
- `--web` serves the browser dashboard on the requested port

### Supporting UI Pieces
- `apps/cli/lib/ui/interactive.js` provides the broader omni-box-style prompt flow used by the TUI
- `apps/cli/lib/ui/theme.js` and `apps/cli/lib/ui/layout.js` provide the shared visual system
- `apps/cli/lib/ui/components/GradientBanner.js` and `apps/cli/lib/ui/components/AgentStatus.js` add branded terminal visuals

## 4. Current Validation Status

The current implementation is consistent with the docs above:

- `ultra-dex dashboard` exists and defaults to the terminal dashboard
- `--web`, `--json`, `--once`, and `--cwd` are implemented
- the NLP router translates natural language into CLI commands
- typo handling and clarification prompts are available through the router and suggestion helpers
