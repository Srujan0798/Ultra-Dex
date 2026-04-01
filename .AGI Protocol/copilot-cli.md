# Copilot CLI — Final High-Power Operator Manual (Maya Lane)

## Role in .AGI Protocol
Secondary governance lane for PR/review/fleet orchestration and overflow execution.

## Local CLI Evidence
```
Version: GitHub Copilot CLI 1.0.14
Binary: copilot
```

## Lane Priority + Window Policy
- Secondary lane (not primary worker).
- Default windows: 0-2.
- Use for governance, PR, review, and overflow only.

## Model Power Tiers
| Tier | Reasoning Effort | Best For |
|------|------------------|----------|
| HIGH | xhigh | Complex multi-step reasoning |
| BALANCED | high | Standard planning/review |
| LOW | medium/low | Quick responses |

## Core CLI Capability Map

### Non-Interactive / Scripting
- `-p, --prompt <text>` — execute prompt non-interactively
- `-s, --silent` — output only agent response (for scripting)
- `--output-format <format>` — text or json (JSONL)
- `--autopilot` — enable autopilot continuation
- `--max-autopilot-continues <count>` — limit continuation messages

### Reasoning & Models
- `--effort, --reasoning-effort <level>` — low, medium, high, xhigh
- `--model <model>` — select AI model
- `--enable-reasoning-summaries` — request reasoning summaries (OpenAI)

### Permissions & Tools
- `--allow-all` — enable all permissions
- `--allow-all-tools` — auto-approve all tools (required for non-interactive)
- `--allow-all-paths` — access any file path
- `--allow-all-urls` — access all URLs
- `--allow-tool[=tools]` — whitelist specific tools
- `--deny-tool[=tools]` — blacklist specific tools
- `--available-tools[=tools]` — limit tools available to model
- `--excluded-tools[=tools]` — hide tools from model
- `--no-ask-user` — autonomous mode without questions

### Session Controls
- `--continue` — resume most recent session
- `--resume[=sessionId]` — resume specific session
- `-i, --interactive <prompt>` — start interactive with auto-prompt
- `--share[=path]` — share session to markdown

### MCP Integration
- `--additional-mcp-config <json>` — add MCP servers (JSON or @file)
- `--disable-builtin-mcps` — disable built-in MCPs
- `--disable-mcp-server <name>` — disable specific MCP
- `--enable-all-github-mcp-tools` — enable all GitHub MCP tools
- `--add-github-mcp-tool <tool>` — enable specific GitHub MCP tool
- `--add-github-mcp-toolset <toolset>` — enable GitHub MCP toolset

### Path & Security
- `--add-dir <directory>` — add directory to allowed list
- `--allow-url[=urls]` — allow specific URLs/domains
- `--deny-url[=urls]` — deny specific URLs (takes precedence)
- `--secret-env-vars[=vars]` — redact env vars from output
- `--disallow-temp-dir` — prevent temp directory access

### Advanced Controls
- `--agent <agent>` — use custom agent
- `--plugin-dir <directory>` — load plugins from directory
- `--config-dir <directory>` — custom config directory
- `--acp` — start as Agent Client Protocol server
- `--experimental` — enable experimental features
- `--no-custom-instructions` — disable AGENTS.md loading
- `--log-level <level>` — none, error, warning, info, debug, all

### Display Options
- `--banner` — show startup banner
- `--no-color` — disable color output
- `--plain-diff` — disable rich diff rendering
- `--screen-reader` — screen reader optimizations
- `--mouse[=value]` — enable/disable mouse support

## Interactive Slash Commands (Verified)
When running interactively, these slash commands are available:

### Core Commands
- `/help` — show available commands
- `/compact` — toggle compact mode
- `/model` — change model
- `/clear` — clear conversation

### Code Review & PR
- `/review` — review code changes
- `/pr` — PR-related operations
- `/diff` — show diff

### Task Management
- `/tasks` — manage tasks
- `/delegate` — delegate tasks
- `/fleet` — fleet orchestration

### Session Management
- `/resume` — resume session
- `/share` — share session
- `/history` — show history

### Configuration
- `/config` — configuration options
- `/terminal-setup` — terminal setup

## Assignment Rules for Maya
Use for:
- governance workflows (PR review, code review)
- fleet orchestration and task delegation
- secondary overflow when primary lanes are saturated
- GitHub-native operations via MCP

Do NOT use as primary worker lane.

## Example Dispatch Commands
```bash
# Non-interactive PR review
copilot -p "Review PR #123 for security issues" --allow-all-tools -s

# Code review with high reasoning
copilot --reasoning-effort high -p "Review changes in src/auth/"

# Fleet task delegation
copilot -p "Delegate test writing to available agents" --autopilot

# JSON output for automation
copilot -p "List open issues" --output-format json -s

# GitHub MCP integration
copilot --enable-all-github-mcp-tools -p "Summarize recent commits"
```

## Cost Class
- SUBSCRIPTION-INCLUDED (GitHub Copilot subscription)
