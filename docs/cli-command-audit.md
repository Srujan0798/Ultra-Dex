# CLI Command Audit

Date: 2026-04-06  
Scope: `apps/cli/lib/commands/*.js`, `apps/cli/bin/ultra-dex.js`, `apps/cli/bin/ultra-dex-full.js`

## Final Counts

- Active command files in `apps/cli/lib/commands`: `39`
- Command registrations in `apps/cli/bin/ultra-dex-full.js`: `40`
- Helper modules moved out of `apps/cli/lib/commands`: `4`
- Newly archived command entry files this cycle: `7`
- Deprecated commands left on the active surface: `0`

## Retained Command Surface

| Command File | Registered | Role | Status |
| --- | --- | --- | --- |
| `agents.js` | YES | agent catalog and subcommands | ACTIVE |
| `auto-implement.js` | YES | automated implementation workflow | ACTIVE |
| `autonomous.js` | YES | autonomous mode runner | ACTIVE |
| `brain.js` | YES | reasoning and brain orchestration entry | ACTIVE |
| `build.js` | YES | build-oriented workflow command | ACTIVE |
| `check.js` | YES | repo health checks | ACTIVE |
| `config.js` | YES | runtime configuration | ACTIVE |
| `deploy.js` | YES | deployment workflow | ACTIVE |
| `doctor.js` | YES | diagnostics and repair | ACTIVE |
| `enterprise.js` | YES | enterprise management surface | ACTIVE |
| `exec.js` | YES | command execution helpers | ACTIVE |
| `export.js` | YES | export workflow | ACTIVE |
| `fetch.js` | YES | fetch/download helpers | ACTIVE |
| `forge.js` | YES | forge workflow | ACTIVE |
| `generate.js` | YES | plan/content generation | ACTIVE |
| `github.js` | YES | GitHub integration | ACTIVE |
| `health.js` | YES | health reporting | ACTIVE |
| `help.js` | YES | help surface | ACTIVE |
| `import.js` | YES | import workflow | ACTIVE |
| `init.js` | YES | project bootstrap | ACTIVE |
| `integrate.js` | YES | integration helpers | ACTIVE |
| `mcp-remote.js` | YES | remote MCP control | ACTIVE |
| `pipeline.js` | YES | pipeline runner | ACTIVE |
| `plan.js` | NO | plan/state support module still used by tests and commands | ACTIVE |
| `predict.js` | YES | predictive analysis command | ACTIVE |
| `quality.js` | YES | quality workflow | ACTIVE |
| `ralph.js` | YES | RALPH agent loop entry | ACTIVE |
| `review.js` | YES | review workflow | ACTIVE |
| `run.js` | YES | run, swarm, and distributed command bundle | ACTIVE |
| `scaffold.js` | YES | scaffold workflow | ACTIVE |
| `search.js` | YES | code and repo search | ACTIVE |
| `serve.js` | YES | local service/runtime hosting | ACTIVE |
| `state.js` | YES | state inspection and mutation | ACTIVE |
| `suggest.js` | YES | suggestion workflow | ACTIVE |
| `swarm.js` | YES | retained because tests and downstream modules import it directly | ACTIVE |
| `sync.js` | YES | sync workflow | ACTIVE |
| `upgrade.js` | YES | upgrade surface | ACTIVE |
| `vector-search.js` | YES | vector retrieval command | ACTIVE |
| `verify.js` | YES | verification workflow | ACTIVE |

## Helper Modules Moved Out Of `lib/commands`

| Previous Path | New Path | Reason |
| --- | --- | --- |
| `apps/cli/lib/commands/agent-gen.js` | `apps/cli/lib/agents/agent-generator.js` | helper for `agents.js`, not a top-level command |
| `apps/cli/lib/commands/banner.js` | `apps/cli/lib/ui/banner.js` | UI helper, not a maintained CLI command |
| `apps/cli/lib/commands/run-context.js` | `apps/cli/lib/run-context.js` | shared helper for `run.js` and tests |
| `apps/cli/lib/commands/scaffold-plan.js` | `apps/cli/lib/scaffold/plan.js` | scaffold helper, not registered from the full entrypoint |

## Newly Archived This Cycle

| Archived File | Reason |
| --- | --- |
| `advanced.js` | full entrypoint expected `registerAdvancedCommand`, but the file only exposed sub-registrars |
| `audit.js` | helper-only module after quality surface consolidation |
| `browser-auto.js` | full entrypoint expected `registerBrowserAutoCommand`, but the file exported `registerBrowserCommand` |
| `code-gen.js` | dormant generation command outside the tested surface |
| `ide.js` | dormant IDE entry outside the tested surface |
| `playground.js` | dormant playground entry outside the tested surface |
| `quality-enhanced.js` | full entrypoint expected `registerQualityEnhancedCommand`, but the file exported `registerQualityCommand` |

Archive note: the repository already contained a larger pre-existing `archive/cli-deprecated/` backlog before this pass. The seven files above are the command entries intentionally retired during this cycle.
