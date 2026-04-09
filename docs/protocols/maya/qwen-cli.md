# Qwen CLI — Final High-Power Operator Manual (Maya Lane)

## Role in .AGI Maya Protocol

Long-running labor lane for repetitive tasks, scanning, mapping, and background-heavy execution.

## Local CLI Evidence

```
Version: 0.13.2
Binary: qwen
```

## Lane Priority + Window Policy

- Long-running labor lane.
- Default windows: 6-10.
- Highest parallel count for volume workloads.

## ⚠️ CRITICAL WARNING

**Qwen Code can delete untracked files without warning.**
Always commit or stash work before using Qwen for risky operations.

## Authentication Type Matrix

| Auth Type  | Flag                     | Limits               | Best For         |
| ---------- | ------------------------ | -------------------- | ---------------- |
| qwen-oauth | `--auth-type qwen-oauth` | 60 req/min, 1000/day | Free high-volume |
| openai     | `--auth-type openai`     | API key limits       | OpenAI models    |
| anthropic  | `--auth-type anthropic`  | API key limits       | Claude models    |
| gemini     | `--auth-type gemini`     | API key limits       | Gemini models    |
| vertex-ai  | `--auth-type vertex-ai`  | GCP limits           | Enterprise       |

## Model Power Tiers

| Tier     | Model      | Best For           |
| -------- | ---------- | ------------------ |
| HIGH     | qwen-max   | Complex reasoning  |
| BALANCED | qwen-plus  | Standard tasks     |
| LOW      | qwen-turbo | Quick simple tasks |

## Core CLI Capability Map

### Interactive & Headless Modes

- Default: interactive mode
- `-p, --prompt <text>` — (deprecated) use positional prompt
- `-i, --prompt-interactive <text>` — execute then continue interactive
- `[query..]` — positional prompt (defaults to one-shot)

### Model & Output Control

- `-m, --model <model>` — select model
- `-o, --output-format <format>` — text, json, stream-json
- `--input-format <format>` — text or stream-json
- `--include-partial-messages` — include partial messages (stream-json)

### Authentication

- `--auth-type <type>` — openai, anthropic, qwen-oauth, gemini, vertex-ai
- `--openai-api-key <key>` — OpenAI API key
- `--openai-base-url <url>` — custom OpenAI endpoint
- `qwen auth` — configure authentication

### Approval Modes

- `--approval-mode plan` — plan only (read-only)
- `--approval-mode default` — prompt for approval
- `--approval-mode auto-edit` — auto-approve edits
- `--approval-mode yolo` — auto-approve all
- `-y, --yolo` — shortcut for yolo mode

### Session Management

- `-c, --continue` — resume most recent session
- `-r, --resume [id]` — resume specific session
- `--session-id <id>` — specify session ID
- `--max-session-turns <n>` — limit session turns
- `--chat-recording` — enable/disable chat history

### MCP Integration

- `qwen mcp` — manage MCP servers
- `--allowed-mcp-server-names <names>` — whitelist MCP servers

### Experimental Features

- `--experimental-lsp` — enable LSP for code intelligence
- `--experimental-hooks` — enable lifecycle hooks
- `qwen hooks` — manage hooks
- `qwen extensions <command>` — manage extensions
- `-e, --extensions <list>` — specify extensions
- `-l, --list-extensions` — list extensions

### Tool Control

- `--allowed-tools <tools>` — whitelist tools (bypass confirmation)
- `--core-tools <paths>` — core tool paths
- `--exclude-tools <tools>` — exclude specific tools

### Web Search

- `--tavily-api-key <key>` — Tavily search API
- `--google-api-key <key>` — Google Custom Search API
- `--google-search-engine-id <id>` — Google CSE ID
- `--web-search-default <provider>` — dashscope, tavily, google

### Advanced Controls

- `-s, --sandbox` — run in sandbox
- `--sandbox-image <uri>` — (deprecated) sandbox image
- `-d, --debug` — debug mode
- `--checkpointing` — (deprecated) enable file edit checkpoints
- `--include-directories, --add-dir <dirs>` — additional directories
- `--channel <channel>` — VSCode, ACP, SDK, CI
- `--screen-reader` — accessibility mode
- `--acp` — start in ACP mode

### Telemetry (All Deprecated)

- `--telemetry` — enable/disable telemetry
- `--telemetry-target` — local or gcp
- `--telemetry-otlp-endpoint` — OTLP endpoint
- `--openai-logging` — log OpenAI calls
- `--openai-logging-dir` — custom log directory

## Assignment Rules for Maya

Use for:

- cheap high-volume throughput
- repetitive mechanical transformations
- repository scanning
- background workloads
- long-running batch operations
- tasks where cost sensitivity is high

Ideal for volume labor where speed matters more than precision.

## Example Dispatch Commands

```bash
# High-volume scanning with OAuth (free)
qwen --auth-type qwen-oauth "Scan all files for TODO comments"

# YOLO mode for trusted automation
qwen -y "Rename all .jsx files to .tsx"

# LSP-enhanced code intelligence
qwen --experimental-lsp "Refactor imports in src/"

# Plan mode (read-only analysis)
qwen --approval-mode plan "Analyze dependency graph"

# Session continuation
qwen --continue

# Multi-provider routing
qwen --auth-type openai --openai-api-key $OPENAI_KEY "Use GPT for this"
```

## Cost Class

- FREE (qwen-oauth within limits)
- API-KEY-USAGE (other auth types)
- CODING-PLAN (Alibaba Cloud subscription)
