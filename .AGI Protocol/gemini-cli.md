# Gemini CLI — Final High-Power Operator Manual (Maya Lane)

## Role in .AGI Protocol
Fast parallel worker lane for utilities, docs, tests, scaffolding, and structured automation.

## Local CLI Evidence
```
Version: 0.35.2
Binary: gemini
```

## Lane Priority + Window Policy
- Parallel worker lane.
- Default windows: 4-6.
- Scale up when queue depth is high and review capacity is stable.

## Model Power Tiers
| Tier | Model | Best For |
|------|-------|----------|
| HIGH | gemini-2.5-pro | Complex reasoning, large context |
| BALANCED | gemini-2.5-flash | Standard tasks, good speed |
| LOW | gemini-2.0-flash-lite | Quick simple tasks |

## Free Tier Limits (Google Account)
- 60 requests/minute
- 1000 requests/day
- Context: up to 1M tokens (model dependent)

## Core CLI Capability Map

### Interactive & Headless Modes
- Default: interactive mode
- `-p, --prompt <text>` — non-interactive headless mode
- `-i, --prompt-interactive <text>` — execute prompt then continue interactive
- `[query..]` — positional initial prompt

### Model & Output Control
- `-m, --model <model>` — select model
- `-o, --output-format <format>` — text, json, stream-json
- `--raw-output` — disable output sanitization (security risk)
- `--accept-raw-output-risk` — suppress raw-output warning

### Approval Modes
- `--approval-mode default` — prompt for approval
- `--approval-mode auto_edit` — auto-approve edit tools
- `--approval-mode yolo` — auto-approve all tools
- `--approval-mode plan` — read-only mode
- `-y, --yolo` — shortcut for yolo mode

### Session Management
- `-r, --resume <id>` — resume session (use "latest" or index)
- `--list-sessions` — list available sessions
- `--delete-session <id>` — delete session by index

### MCP Integration
- `gemini mcp` — manage MCP servers
- `--allowed-mcp-server-names <names>` — whitelist MCP servers

### Skills, Hooks & Extensions
- `gemini skills <command>` — manage agent skills
- `gemini hooks <command>` — manage hooks
- `gemini extensions <command>` — manage extensions
- `-e, --extensions <list>` — specify extensions to use
- `-l, --list-extensions` — list available extensions

### Policy Engine
- `--policy <files>` — additional policy files/directories
- `--admin-policy <files>` — admin policy files/directories
- `--allowed-tools <tools>` — (deprecated) use Policy Engine instead

### Advanced Controls
- `-s, --sandbox` — run in sandbox
- `-d, --debug` — debug mode (F12 opens debug console)
- `--include-directories <dirs>` — additional workspace directories
- `--screen-reader` — accessibility mode
- `--acp` — start in ACP mode

## Assignment Rules for Maya
Use for:
- medium/low-risk high-throughput jobs
- documentation generation
- test scaffolding
- utility scripts
- machine-readable automation output
- parallel side-worker execution

Ideal for volume labor that doesn't require premium precision.

## Example Dispatch Commands
```bash
# Non-interactive doc generation
gemini -p "Generate API docs for src/api/" -o json

# YOLO mode for trusted automation
gemini -y -p "Run all tests and report failures"

# Plan mode (read-only analysis)
gemini --approval-mode plan -p "Analyze code structure"

# Resume previous session
gemini --resume latest

# Parallel batch execution (multiple windows)
gemini -p "Write unit tests for utils.js" -o text
```

## Cost Class
- FREE (Google account, within limits)
- API-KEY-USAGE (for higher limits)
