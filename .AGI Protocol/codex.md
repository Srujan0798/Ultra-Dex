# Codex — Final High-Power Operator Manual (Maya Lane)

## Role in .AGI Protocol
Premium implementation/review lane for complex multi-file work, deep debugging, and long-run cloud tasks.

## Local CLI Evidence
```
Version: codex-cli 0.117.0
Binary: codex
```

## Lane Priority + Window Policy
- Premium dense-task lane.
- Default windows: 1 max.

## Model Power Tiers
| Tier | Model | Best For |
|------|-------|----------|
| HIGH | o3 | Hardest reasoning |
| BALANCED | o1 / gpt-4 | Standard complex tasks |
| LOW | gpt-4o-mini | Quick validation |

## Core CLI Capability Map

### Main Commands
- `codex [prompt]` — interactive TUI (default)
- `codex exec [prompt]` — non-interactive execution (alias: e)
- `codex review` — code review non-interactively
- `codex apply` — apply latest diff as git apply (alias: a)
- `codex resume` — resume previous session
- `codex fork` — fork previous session

### Cloud Features (Experimental)
- `codex cloud` — browse Codex Cloud tasks
- `codex app-server` — run app server
- `codex app` — launch desktop app

### MCP Integration
- `codex mcp` — manage external MCP servers
- `codex mcp-server` — start as MCP server (stdio)

### Sandbox Policies
- `-s, --sandbox read-only` — read-only sandbox
- `-s, --sandbox workspace-write` — workspace write access
- `-s, --sandbox danger-full-access` — full access (dangerous)
- `codex sandbox` — run commands in sandbox

### Approval Policies
- `-a, --ask-for-approval untrusted` — only trusted commands auto-run
- `-a, --ask-for-approval on-request` — model decides when to ask
- `-a, --ask-for-approval never` — never ask (for automation)
- `--full-auto` — convenience for `-a on-request --sandbox workspace-write`
- `--dangerously-bypass-approvals-and-sandbox` — DANGEROUS, skip all checks

### Model Configuration
- `-m, --model <model>` — select model
- `--oss` — use local OSS provider (LM Studio/Ollama)
- `--local-provider <provider>` — specify lmstudio or ollama
- `-p, --profile <profile>` — config profile from config.toml
- `-c, --config <key=value>` — override config values
- `--enable <feature>` — enable feature flag
- `--disable <feature>` — disable feature flag

### Input/Output
- `-i, --image <file>` — attach image(s) to prompt
- `-C, --cd <dir>` — working directory root
- `--search` — enable web search tool
- `--remote <addr>` — connect to remote app server
- `--remote-auth-token-env <var>` — bearer token env var

### Session Management
- `codex resume` — resume session (picker or --last)
- `codex fork` — fork session
- `codex export [sessionID]` — export session

### Utilities
- `codex login` — manage login
- `codex logout` — remove credentials
- `codex completion` — shell completion
- `codex debug` — debugging tools
- `codex features` — inspect feature flags

## Security Rules
- Prefer sandbox + on-request approvals.
- Use `--full-auto` for trusted automation only.
- Avoid `--dangerously-bypass-approvals-and-sandbox` unless externally sandboxed.
- Review diffs before applying with `codex apply`.

## Assignment Rules for Maya
Use for:
- hardest implementation tasks
- difficult bug isolation
- high-signal review and patching
- complex multi-file refactors
- cloud-based long-running tasks
- tasks requiring strong reasoning (o3, o1)

## Example Dispatch Commands
```bash
# Non-interactive execution
codex exec "Implement authentication module in src/auth/"

# Code review
codex review

# Full-auto sandboxed execution
codex --full-auto "Fix all failing tests"

# With specific model
codex -m o3 "Solve this complex algorithm problem"

# Apply generated diff
codex apply

# Resume previous work
codex resume --last

# Read-only analysis
codex -s read-only exec "Analyze security vulnerabilities"

# Local model (Ollama)
codex --oss --local-provider ollama "Simple code task"
```

## Cost Class
- SUBSCRIPTION-INCLUDED (OpenAI subscription)
- API-KEY-USAGE (OPENAI_API_KEY)
