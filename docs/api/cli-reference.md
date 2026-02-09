# Ultra-Dex CLI Reference

This is the canonical CLI reference. For local accuracy, run `ultra-dex --help` and `ultra-dex <command> --help`.

---

## Usage

```bash
ultra-dex <command> [options]
```

Common flags:
- `--help` show help
- `--json` output JSON (where supported)
- `--verbose` debug logging
- `--quiet` minimal output

---

## Core Workflows

### Start a project
```bash
ultra-dex init
ultra-dex plan "Build a SaaS dashboard"
```

### Execute + Verify
```bash
ultra-dex run task.md
ultra-dex verify --full
```

### Review + Drift
```bash
ultra-dex review
ultra-dex diff --drift
```

---

## Command Catalog (Grouped)

### Planning & Execution
`init`, `plan`, `generate`, `run`, `swarm`, `auto-implement`, `scaffold`, `scaffold-plan`, `exec`

### Validation & Quality
`check`, `verify`, `quality`, `audit`, `risk`, `production-ready`

### Context & Memory
`memory`, `rag`, `graph`, `vector-search`, `sync`, `watch`

### Integrations
`integrate`, `github`, `jira`, `notion`, `trello`, `marketplace`, `plugin`

### DevOps & Deploy
`deploy`, `cloud`, `docker`, `k8s`, `env`, `monitor`, `dr-check`

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
