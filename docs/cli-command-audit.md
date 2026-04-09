# CLI Command Audit

Date: 2026-04-06  
Scope: `apps/cli/lib/commands/*.js`, `apps/cli/bin/ultra-dex.js`, `apps/cli/bin/ultra-dex-full.js`

## Final Counts

- Active command files in `apps/cli/lib/commands`: `39`
- Command registrations in `apps/cli/bin/ultra-dex-full.js`: `40`
- Archived command entry files this cycle: `7`
- Deprecated commands left active: `0`

## Classification Table

| Command File        | Registered | Imports Valid | Last Modified | Status |
| ------------------- | ---------- | ------------- | ------------- | ------ |
| `agents.js`         | YES        | YES           | 2026-04-06    | ACTIVE |
| `auto-implement.js` | YES        | YES           | 2026-04-04    | ACTIVE |
| `autonomous.js`     | YES        | YES           | 2026-04-04    | ACTIVE |
| `brain.js`          | YES        | YES           | 2026-04-04    | ACTIVE |
| `build.js`          | YES        | YES           | 2026-04-04    | ACTIVE |
| `check.js`          | YES        | YES           | 2026-04-04    | ACTIVE |
| `config.js`         | YES        | YES           | 2026-04-04    | ACTIVE |
| `deploy.js`         | YES        | YES           | 2026-04-04    | ACTIVE |
| `doctor.js`         | YES        | YES           | 2026-04-06    | ACTIVE |
| `enterprise.js`     | YES        | YES           | 2026-04-03    | ACTIVE |
| `exec.js`           | YES        | YES           | 2026-04-04    | ACTIVE |
| `export.js`         | YES        | YES           | 2026-04-04    | ACTIVE |
| `fetch.js`          | YES        | YES           | 2026-04-04    | ACTIVE |
| `forge.js`          | YES        | YES           | 2026-04-04    | ACTIVE |
| `generate.js`       | YES        | YES           | 2026-04-05    | ACTIVE |
| `github.js`         | YES        | YES           | 2026-04-04    | ACTIVE |
| `health.js`         | YES        | YES           | 2026-04-03    | ACTIVE |
| `help.js`           | YES        | YES           | 2026-04-04    | ACTIVE |
| `import.js`         | YES        | YES           | 2026-04-04    | ACTIVE |
| `init.js`           | YES        | YES           | 2026-04-06    | ACTIVE |
| `integrate.js`      | YES        | YES           | 2026-04-04    | ACTIVE |
| `mcp-remote.js`     | YES        | YES           | 2026-04-04    | ACTIVE |
| `pipeline.js`       | YES        | YES           | 2026-04-04    | ACTIVE |
| `plan.js`           | NO         | YES           | 2026-04-01    | ACTIVE |
| `predict.js`        | YES        | YES           | 2026-04-04    | ACTIVE |
| `quality.js`        | YES        | YES           | 2026-04-04    | ACTIVE |
| `ralph.js`          | YES        | YES           | 2026-04-04    | ACTIVE |
| `review.js`         | YES        | YES           | 2026-04-04    | ACTIVE |
| `run.js`            | YES        | YES           | 2026-04-06    | ACTIVE |
| `scaffold.js`       | YES        | YES           | 2026-04-06    | ACTIVE |
| `search.js`         | YES        | YES           | 2026-04-04    | ACTIVE |
| `serve.js`          | YES        | YES           | 2026-04-06    | ACTIVE |
| `state.js`          | YES        | YES           | 2026-04-04    | ACTIVE |
| `suggest.js`        | YES        | YES           | 2026-04-04    | ACTIVE |
| `swarm.js`          | YES        | YES           | 2026-04-06    | ACTIVE |
| `sync.js`           | YES        | YES           | 2026-04-04    | ACTIVE |
| `upgrade.js`        | YES        | YES           | 2026-04-04    | ACTIVE |
| `vector-search.js`  | YES        | YES           | 2026-04-04    | ACTIVE |
| `verify.js`         | YES        | YES           | 2026-04-04    | ACTIVE |

## Archived This Cycle

| Command File          | Registered Before Archive | Status | Reason                                                                                                     |
| --------------------- | ------------------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| `advanced.js`         | YES                       | BROKEN | Full entrypoint expected `registerAdvancedCommand`, but the file only exposed sub-registrars.              |
| `audit.js`            | NO                        | STALE  | Helper-only module after quality surface consolidation.                                                    |
| `browser-auto.js`     | YES                       | BROKEN | Full entrypoint expected `registerBrowserAutoCommand`, but the file exported `registerBrowserCommand`.     |
| `code-gen.js`         | YES                       | STALE  | Dormant generation command outside the validated CLI surface.                                              |
| `ide.js`              | YES                       | STALE  | Dormant IDE entry outside the validated CLI surface.                                                       |
| `playground.js`       | YES                       | STALE  | Dormant playground entry outside the validated CLI surface.                                                |
| `quality-enhanced.js` | YES                       | BROKEN | Full entrypoint expected `registerQualityEnhancedCommand`, but the file exported `registerQualityCommand`. |

## Notes

- `plan.js` is intentionally unregistered but retained because `serve.js`, tests, and internal helpers still import it directly.
- Helper modules moved out of `lib/commands` during cleanup:
  - `agent-gen.js` -> `apps/cli/lib/agents/agent-generator.js`
  - `banner.js` -> `apps/cli/lib/ui/banner.js`
  - `run-context.js` -> `apps/cli/lib/run-context.js`
  - `scaffold-plan.js` -> `apps/cli/lib/scaffold/plan.js`
- Current `npm start -- --help` output is limited to the active fast surface and no longer references the archived command files.
