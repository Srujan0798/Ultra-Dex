# Ultra-Dex CLI Reference

This is the practical CLI guide for Ultra-Dex. It summarizes usage patterns, core commands, and the full command index. For deeper reference material, see `docs/api/reference/CLI-REFERENCE.md` and `docs/api/reference/QUICK-REFERENCE.md`.

---

## Global Usage

```bash
ultra-dex <command> [options]
```

Common flags:
- `--help` Show help for a command.
- `--json` Output JSON (where supported).
- `--verbose` Extra debug logging.
- `--quiet` Minimal output.

---

## Core Workflows

### Initialize and Plan
```bash
ultra-dex init
ultra-dex plan "Build a SaaS dashboard"
```

### Generate and Execute
```bash
ultra-dex generate "Build an auth system"
ultra-dex run backend --task "Create auth endpoints"
```

### Validate and Review
```bash
ultra-dex check --p0-only
ultra-dex verify --full
ultra-dex review
```

### Diff and Export
```bash
ultra-dex diff --drift
ultra-dex export --format pdf
```

---

## Command Groups

### Planning and Execution
- `init` Project scaffolding and templates.
- `plan` Generate or update implementation plans.
- `generate` AI plan generation from a prompt.
- `run` Execute a specific agent.
- `swarm` Multi-agent execution.
- `auto-implement` Autonomous task execution.
- `scaffold` Create project scaffolds.
- `scaffold-plan` Generate structure from `IMPLEMENTATION-PLAN.md`.
- `exec` Run commands with optional sandbox.

### Validation and Quality
- `check` Completeness validation with section checks.
- `verify` Protocol 21 verification.
- `quality` Quality gates and audits.
- `audit` Drift and context integrity checks.
- `risk` Risk analysis.
- `production-ready` Production readiness checklist.

### Context and Memory
- `memory` Memory tier management, search, visualize.
- `rag` Retrieval-augmented context.
- `graph` Dependency and impact graph.
- `vector-search` Semantic search across codebase.
- `sync` Sync context and project state.
- `watch` File watching and auto-sync.

### Integrations
- `integrate` Integration manager and status.
- `github` GitHub integration utilities.
- `jira` Jira integration utilities.
- `notion` Notion integration utilities.
- `trello` Trello integration utilities.
- `plugin` Plugin management.

### DevOps and Deploy
- `deploy` Deployment pipelines.
- `cloud` Cloud wrapper utilities.
- `docker` Docker generator.
- `k8s` Kubernetes generator.
- `env` Environment config manager.
- `monitor` Monitoring configuration.
- `dr-check` Disaster recovery check.

### UI and Experience
- `dashboard` Local dashboard server.
- `banner` ASCII banners.
- `profile` Performance profiling.
- `progress` Progress utilities (where available).

---

## Core Command Details

### `init`
Initializes a new Ultra-Dex project.

```bash
ultra-dex init --live --stack next15-saas
```

### `generate`
Generates a full implementation plan from an idea.

```bash
ultra-dex generate "AI meal planner" --provider openai
```

### `run`
Runs a specific agent with a task.

```bash
ultra-dex run backend --task "Create user API endpoints"
```

### `swarm`
Runs multiple agents in parallel, sequential, or waterfall mode.

```bash
ultra-dex swarm "Build auth system" --parallel
```

### `check`
Validates the plan and context for completeness.

```bash
ultra-dex check --p0-only --strict
```

### `verify`
Runs the 21-step verification protocol.

```bash
ultra-dex verify --full
```

### `diff`
Compares plan vs implementation to detect drift.

```bash
ultra-dex diff --drift --output drift-report.md
```

### `export`
Exports context and plans to different formats.

```bash
ultra-dex export --format json --sections 1,2,3
```

---

## Full Command Index (Alphabetical)

```
advanced
agent-gen
agents
ai-advisor
api
architect
audit
auth-sso
auth
auto-implement
autonomous
background-agent
banner
batch
benchmark
bot
brain
browse
browser-auto
browser
budget
build
challenge
chat
check-enhanced-v2
check-enhanced
check
chrome-agent
ci-monitor
cicd
clean
cloud
code-gen
commit
compare
config
credentials
daemon
dashboard-websocket-client
dashboard
db-advisor
deploy
diff
docker
docs
doctor
dr-check
env
estimate
examples
exec
export
fetch
fix
forge
gate
generate
github
governance
graph
health
help
hooks
impact
init
install-completion
integrate
jira
k8s
ledger
marketplace
mcp-host
mcp-remote
memory
monitor
monitoring
neuro-plan
notion
onboard
pipeline
plan
playground
plugin-scan
plugin
pre-commit
privacy
production-ready
profile
pty
quality-enhanced
quality
rag
ralph
reality-check
review
risk
rollback
route
rules
run
scaffold-enhanced
scaffold-plan-new
scaffold-plan
scaffold
search
security
serve
session
setup
snap
state
status
suggest
swarm-advanced
swarm
sync-pm
sync
team
telemetry
template
templates
test
trello
undo
upgrade
validate
vector-search
verify
version-check
vibe
voice
watch
workflow
workflows
workspace
```

---

## Environment Variables

Common variables used by the CLI:
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`
- `ULTRA_DEX_PROVIDER`, `ULTRA_DEX_MODEL`
- `ULTRA_DEX_HOME` (custom config path)

For more details, see `docs/api/reference/API-REFERENCE.md`.
