# Ultra-Dex CLI Reference

This guide documents the Ultra-Dex CLI surface area and how to use it in practice.  
For the authoritative list on your machine, run `ultra-dex --help` or `ultra-dex <command> --help`.

---

## Global Usage

```bash
ultra-dex <command> [options]
```

Common global flags:

- `--help` show command help
- `--json` output machine‑readable JSON (where supported)
- `--verbose` show debug logging
- `--quiet` suppress non‑critical output

---

## Configuration

Config files:

- Project: `.ultra-dex/config.json`
- User: `~/.ultra-dex/config.json`

Environment variables (common):

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY`
- `ULTRA_DEX_THEME`
- `ULTRA_DEX_PROVIDER`
- `ULTRA_DEX_MODEL`

Useful commands:

- `ultra-dex config` (inspect or set config values)
- `ultra-dex setup` (interactive wizard)

---

## Core Workflows

### Project Bootstrapping

```bash
ultra-dex init
ultra-dex scaffold --from-plan
ultra-dex template list
ultra-dex template generate saaskit
```

### Planning & Alignment

```bash
ultra-dex plan "Build a task manager"
ultra-dex check --p0-only --strict
ultra-dex verify --full
```

### Execution & Swarm

```bash
ultra-dex run task.md
ultra-dex swarm start task.md --parallel 4
ultra-dex auto-implement "Add billing"
```

### Review & Quality

```bash
ultra-dex review
ultra-dex diff --drift
ultra-dex quality --fix
ultra-dex production-ready
```

### DevOps & Deploy

```bash
ultra-dex docker init
ultra-dex k8s init
ultra-dex deploy --provider vercel
ultra-dex cloud deploy
```

---

## Command Catalog (Grouped)

### Project + Planning

`init`, `plan`, `generate`, `scaffold`, `scaffold-plan`, `scaffold-plan-new`, `scaffold-enhanced`,  
`check`, `check-enhanced`, `check-enhanced-v2`, `verify`, `quality`, `quality-enhanced`, `diff`, `export`

### Execution + Automation

`run`, `exec`, `swarm`, `swarm-advanced`, `auto-implement`, `ralph`, `batch`, `pipeline`, `workflow`, `workflows`

### Context + Memory

`memory`, `rag`, `graph`, `search`, `vector-search`, `brain`, `state`, `sync`, `sync-pm`, `watch`, `context`

### Agents + Teams

`agents`, `agent-gen`, `team`, `session`, `background-agent`, `bot`, `compare`, `governance`

### Integrations

`integrate`, `github`, `jira`, `notion`, `trello`, `marketplace`, `plugin`, `plugin-scan`

### DevOps + Ops

`deploy`, `cloud`, `docker`, `k8s`, `env`, `monitor`, `monitoring`, `dr-check`, `risk`, `audit`,  
`security`, `privacy`, `gate`, `production-ready`, `benchmark`

### UI + Dashboard

`dashboard`, `dashboard-websocket-client`, `browse`, `browser`, `browser-auto`, `playground`, `help`, `banner`

### Config + Tooling

`config`, `setup`, `install-completion`, `telemetry`, `status`, `version-check`, `upgrade`, `clean`, `test`

---

## Full Command Index (Alphabetical)

This list is generated from `cli/lib/commands/*.js` and is the canonical inventory.

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

## Troubleshooting

If a command fails:

- Run `ultra-dex doctor` to check environment health.
- Use `--verbose` for stack traces.
- Verify provider API keys are set and valid.

For detailed options, always run:

```bash
ultra-dex <command> --help
```
