# Claude Code — Final High-Power Operator Manual (Maya Lane)

## Role in .AGI Protocol
Premium dense-task lane for critical code, architecture-sensitive refactors, and acceptance-grade review.

## Local CLI Evidence
```
Version: 2.1.87 (Claude Code)
Binary: claude
```

## Maya Boss Model Policy (Required)
- Maya can run with **either Opus or Sonnet** in Claude Code.
- Opus: hardest planning/review/architecture decisions.
- Sonnet: balanced planning/review with faster execution.
- Both are valid boss-capable choices.

## Lane Priority + Window Policy
- Premium dense-task lane.
- Default windows: 1 max.

## Model Power Tiers
| Tier | Model | Context | Best For |
|------|-------|---------|----------|
| HIGH | claude-opus-4 | 200K | Hardest architecture, final review |
| BALANCED | claude-sonnet-4 | 200K | Planning, review, speed |
| LOW | claude-haiku-4 | 200K | Quick validation, simple tasks |

## Core CLI Capability Map
### Model & Effort Control
- `--model <model>` — select model (opus, sonnet, haiku, or full name)
- `--effort <level>` — effort level (low, medium, high, max)
- `--fallback-model <model>` — auto-fallback when overloaded (--print only)

### Non-Interactive / Scripting
- `-p, --print` — print response and exit (for pipes)
- `--output-format <format>` — text, json, stream-json (--print only)
- `--json-schema <schema>` — structured output validation
- `--input-format <format>` — text or stream-json

### Permissions & Tools
- `--permission-mode <mode>` — acceptEdits, bypassPermissions, default, dontAsk, plan, auto
- `--allowed-tools <tools>` — whitelist tools (e.g. "Bash(git:*) Edit")
- `--disallowed-tools <tools>` — blacklist tools
- `--tools <tools>` — specify available tools from built-in set
- `--dangerously-skip-permissions` — bypass all (SANDBOX ONLY)

### Session Controls
- `-c, --continue` — continue most recent conversation
- `-r, --resume [id]` — resume by session ID
- `--fork-session` — create new session ID when resuming
- `--session-id <uuid>` — use specific session ID
- `-n, --name <name>` — set display name for session

### MCP Integration
- `--mcp-config <configs>` — load MCP servers from JSON
- `--strict-mcp-config` — only use MCP from --mcp-config
- `claude mcp ...` — manage MCP servers

### Advanced Controls
- `--add-dir <dirs>` — additional directories for tool access
- `--system-prompt <prompt>` — override system prompt
- `--append-system-prompt <prompt>` — append to system prompt
- `--agent <agent>` — use specific agent
- `--agents <json>` — define custom agents
- `--max-budget-usd <amount>` — spending limit (--print only)
- `--bare` — minimal mode (skip hooks, LSP, auto-memory)
- `-w, --worktree [name]` — create git worktree for session
- `--tmux` — create tmux session for worktree

### Commands
- `claude auth` — manage authentication
- `claude mcp` — configure MCP servers
- `claude agents` — list configured agents
- `claude doctor` — health check
- `claude install [target]` — install native build
- `claude update` — check for updates

## Security Rules
- Permission-first by default.
- Use `--permission-mode plan` for read-only review.
- Avoid `--dangerously-skip-permissions` unless isolated sandbox is guaranteed.
- Review commands before approval.

## Assignment Rules for Maya
Use for:
- highest-risk refactors
- complex architecture logic
- integration-critical edits
- final acceptance review
- Maya boss orchestration (Opus or Sonnet)

Avoid repetitive low-value labor here.

## Example Dispatch Commands
```bash
# High-power architectural review
claude --model opus --effort max -p "Review architecture of src/core/"

# Balanced planning session
claude --model sonnet --effort high -p "Plan refactor for auth module"

# Quick validation
claude --model haiku --effort low -p "Validate syntax in utils.js"

# Non-interactive with JSON output
claude --model sonnet -p --output-format json "Generate API schema"

# Sandboxed execution
claude --permission-mode plan -p "Analyze codebase structure"
```

## Cost Class
- SUBSCRIPTION-INCLUDED (Pro plan)
- API-KEY-USAGE (ANTHROPIC_API_KEY)
