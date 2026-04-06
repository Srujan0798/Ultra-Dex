# CLI Command Audit Report

**Date:** 2026-04-06
**Scope:** `apps/cli/lib/commands/*.js`
**Entry Points:** `apps/cli/bin/ultra-dex.js`, `apps/cli/bin/ultra-dex-full.js`

## Classification Criteria
- **ACTIVE:** Registered in entry point and modified after Apr 3.
- **STALE:** Not registered OR modified before Apr 3.
- **BROKEN:** Imports missing (validated a sample) OR failed registration.
- **DEPRECATED:** Registered but likely old or replaced (e.g., duplicated logic).

## Audit Table

| Command File | Registered | Imports Valid | Last Modified | Status |
| :--- | :---: | :---: | :--- | :--- |
| `advanced.js` | YES | YES | Apr 5 | ACTIVE |
| `agent-gen.js` | YES | YES | Apr 2 | STALE |
| `agents.js` | YES | YES | Apr 5 | ACTIVE |
| `ai-advisor.js` | YES | YES | Apr 2 | STALE |
| `api.js` | YES | YES | Apr 2 | STALE |
| `architect.js` | YES | YES | Apr 2 | STALE |
| `audit.js` | YES | YES | Apr 2 | STALE |
| `auth-sso.js` | YES | YES | Apr 2 | STALE |
| `auth.js` | YES | YES | Apr 2 | STALE |
| `auto-implement.js` | YES | YES | Apr 5 | ACTIVE |
| `autonomous.js` | YES | YES | Apr 5 | ACTIVE |
| `background-agent.js` | YES | YES | Apr 2 | STALE |
| `banner.js` | YES | YES | Apr 5 | ACTIVE |
| `batch.js` | YES | YES | Apr 2 | STALE |
| `benchmark.js` | YES | YES | Apr 2 | STALE |
| `bot.js` | YES | YES | Apr 2 | STALE |
| `brain.js` | YES | YES | Apr 5 | ACTIVE |
| `browse.js` | YES | YES | Apr 2 | STALE |
| `browser-auto.js` | YES | YES | Apr 5 | ACTIVE |
| `browser.js` | YES | YES | Apr 2 | STALE |
| `budget.js` | YES | YES | Apr 2 | STALE |
| `build.js` | YES | YES | Apr 5 | ACTIVE |
| `challenge.js` | YES | YES | Apr 2 | STALE |
| `chat.js` | YES | YES | Apr 2 | STALE |
| `check.js` | YES | YES | Apr 5 | ACTIVE |
| `chrome-agent.js` | YES | YES | Apr 2 | STALE |
| `ci-monitor.js` | YES | YES | Apr 2 | STALE |
| `cicd.js` | YES | YES | Apr 2 | STALE |
| `clean.js` | YES | YES | Apr 2 | STALE |
| `cloud.js` | YES | YES | Apr 2 | STALE |
| `code-gen.js` | YES | YES | Apr 5 | ACTIVE |
| `commit.js` | YES | YES | Apr 2 | STALE |
| `compare.js` | YES | YES | Apr 2 | STALE |
| `config.js` | YES | YES | Apr 5 | ACTIVE |
| `credentials.js` | YES | YES | Apr 2 | STALE |
| `daemon.js` | YES | YES | Apr 2 | STALE |
| `dashboard 2.js` | NO | YES | Apr 2 | BROKEN (Dupe) |
| `dashboard-websocket-client.js` | YES | YES | Apr 2 | STALE |
| `dashboard.js` | YES | YES | Apr 2 | STALE |
| `db-advisor.js` | YES | YES | Apr 2 | STALE |
| `demo.js` | YES | YES | Apr 2 | STALE |
| `deploy.js` | YES | YES | Apr 5 | ACTIVE |
| `diff.js` | YES | YES | Apr 2 | STALE |
| `docker.js` | YES | YES | Apr 2 | STALE |
| `docs.js` | YES | YES | Apr 2 | STALE |
| `doctor.js` | YES | YES | Apr 5 | ACTIVE |
| `dr-check.js` | NO | YES | Apr 2 | STALE (Not Reg) |
| `enterprise.js` | YES | YES | Apr 3 | ACTIVE |
| `env.js` | YES | YES | Apr 2 | STALE |
| `estimate.js` | YES | YES | Apr 2 | STALE |
| `examples.js` | YES | YES | Apr 2 | STALE |
| `exec.js` | YES | YES | Apr 5 | ACTIVE |
| `export.js` | YES | YES | Apr 5 | ACTIVE |
| `fetch.js` | YES | YES | Apr 5 | ACTIVE |
| `fix.js` | YES | YES | Apr 2 | STALE |
| `forge.js` | YES | YES | Apr 5 | ACTIVE |
| `gate.js` | YES | YES | Apr 2 | STALE |
| `generate.js` | YES | YES | Apr 5 | ACTIVE |
| `ghost.js` | YES | YES | Apr 2 | STALE |
| `git.js` | YES | YES | Apr 2 | STALE |
| `github.js` | YES | YES | Apr 5 | ACTIVE |
| `governance.js` | YES | YES | Apr 2 | STALE |
| `graph.js` | NO | YES | Apr 2 | STALE (Not Reg) |
| `health.js` | YES | YES | Apr 3 | ACTIVE |
| `help.js` | YES | YES | Apr 5 | ACTIVE |
| `hooks.js` | YES | YES | Apr 2 | STALE |
| `ide.js` | YES | YES | Apr 5 | ACTIVE |
| `impact.js` | YES | YES | Apr 2 | STALE |
| `import.js` | YES | YES | Apr 5 | ACTIVE |
| `init.js` | YES | YES | Apr 5 | ACTIVE |
| `install-completion.js` | YES | YES | Apr 2 | STALE |
| `integrate.js` | YES | YES | Apr 5 | ACTIVE |
| `jira.js` | YES | YES | Apr 2 | STALE |
| `k8s.js` | YES | YES | Apr 2 | STALE |
| `ledger.js` | YES | YES | Apr 2 | STALE |
| `marketplace.js` | YES | YES | Apr 2 | STALE |
| `mcp-host.js` | YES | YES | Apr 2 | STALE |
| `mcp-remote.js` | YES | YES | Apr 5 | ACTIVE |
| `mcp.js` | YES | YES | Apr 2 | STALE |
| `memory.js` | YES | YES | Apr 2 | STALE |
| `mobile.js` | YES | YES | Apr 2 | STALE |
| `monitor.js` | YES | YES | Apr 2 | STALE |
| `monitoring.js` | YES | YES | Apr 2 | STALE |
| `neuro-plan.js` | YES | YES | Apr 2 | STALE |
| `nexus.js` | YES | YES | Apr 2 | STALE |
| `notion.js` | YES | YES | Apr 2 | STALE |
| `onboard.js` | YES | YES | Apr 2 | STALE |
| `perf.js` | YES | YES | Apr 2 | STALE |
| `pipeline.js` | YES | YES | Apr 5 | ACTIVE |
| `plan.js` | YES | YES | Apr 2 | STALE |
| `playground.js` | YES | YES | Apr 5 | ACTIVE |
| `plugin-scan.js` | YES | YES | Apr 2 | STALE |
| `plugin.js` | YES | YES | Apr 2 | STALE |
| `pre-commit.js` | YES | YES | Apr 2 | STALE |
| `predict-debug.js` | YES | YES | Apr 2 | STALE |
| `predict.js` | YES | YES | Apr 5 | ACTIVE |
| `privacy.js` | YES | YES | Apr 2 | STALE |
| `production-ready.js` | YES | YES | Apr 2 | STALE |
| `profile.js` | YES | YES | Apr 2 | STALE |
| `pty.js` | YES | YES | Apr 2 | STALE |
| `quality-enhanced.js` | YES | YES | Apr 5 | ACTIVE |
| `quality.js` | YES | YES | Apr 5 | ACTIVE |
| `rag.js` | YES | YES | Apr 2 | STALE |
| `ralph.js` | YES | YES | Apr 5 | ACTIVE |
| `reality-check.js` | YES | YES | Apr 2 | STALE |
| `review.js` | YES | YES | Apr 5 | ACTIVE |
| `risk.js` | YES | YES | Apr 2 | STALE |
| `rollback.js` | YES | YES | Apr 2 | STALE |
| `route.js` | YES | YES | Apr 2 | STALE |
| `router-cmd.js` | YES | YES | Apr 2 | STALE |
| `rules.js` | YES | YES | Apr 2 | STALE |
| `run-context.js` | YES | YES | Apr 2 | STALE |
| `run.js` | YES | YES | Apr 5 | ACTIVE |
| `scaffold-enhanced.js` | YES | YES | Apr 2 | STALE |
| `scaffold-plan.js` | YES | YES | Apr 2 | STALE |
| `scaffold.js` | YES | YES | Apr 5 | ACTIVE |
| `search.js` | YES | YES | Apr 5 | ACTIVE |
| `security.js` | YES | YES | Apr 2 | STALE |
| `serve.js` | YES | YES | Apr 5 | ACTIVE |
| `session.js` | YES | YES | Apr 2 | STALE |
| `setup.js` | NO | YES | Apr 2 | STALE (Not Reg) |
| `snap.js` | YES | YES | Apr 2 | STALE |
| `sso.js` | YES | YES | Apr 2 | STALE |
| `state.js` | YES | YES | Apr 5 | ACTIVE |
| `status.js` | YES | YES | Apr 2 | STALE |
| `suggest.js` | YES | YES | Apr 5 | ACTIVE |
| `swarm-advanced.js` | YES | YES | Apr 2 | STALE |
| `swarm-p2p.js` | YES | YES | Apr 2 | STALE |
| `swarm.js` | YES | YES | Apr 5 | ACTIVE |
| `sync-pm.js` | YES | YES | Apr 2 | STALE |
| `sync.js` | YES | YES | Apr 5 | ACTIVE |
| `team.js` | YES | YES | Apr 2 | STALE |
| `telemetry.js` | YES | YES | Apr 2 | STALE |
| `template.js` | YES | YES | Apr 2 | STALE |
| `templates.js` | YES | YES | Apr 2 | STALE |
| `test.js` | YES | YES | Apr 2 | STALE |
| `think.js` | YES | YES | Apr 2 | STALE |
| `trello.js` | YES | YES | Apr 2 | STALE |
| `tutorial.js` | YES | YES | Apr 2 | STALE |
| `tutorials.js` | YES | YES | Apr 2 | STALE |
| `undo.js` | YES | YES | Apr 2 | STALE |
| `upgrade.js` | YES | YES | Apr 5 | ACTIVE |
| `validate.js` | YES | YES | Apr 2 | STALE |
| `vault.js` | YES | YES | Apr 2 | STALE |
| `vector-search.js` | YES | YES | Apr 5 | ACTIVE |
| `verify.js` | YES | YES | Apr 5 | ACTIVE |
| `version-check.js` | YES | YES | Apr 2 | STALE |
| `vibe.js` | YES | YES | Apr 2 | STALE |
| `vision.js` | YES | YES | Apr 2 | STALE |
| `voice.js` | YES | YES | Apr 2 | STALE |
| `watch.js` | YES | YES | Apr 2 | STALE |
| `white-label.js` | YES | YES | Apr 2 | STALE |
| `workflow.js` | YES | YES | Apr 2 | STALE |
| `workflows.js` | YES | YES | Apr 2 | STALE |
| `workspace.js` | YES | YES | Apr 2 | STALE |

## Recommended for Deletion
The following files are either duplicates, not registered, or modified significantly before the April 3 refactor:
1. `dashboard 2.js` (Broken/Duplicate)
2. `dr-check.js` (Not registered)
3. `graph.js` (Not registered)
4. `setup.js` (Not registered)
5. All commands marked **STALE** (Modified before Apr 3) should be reviewed for migration to the new architecture.
