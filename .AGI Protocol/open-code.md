# OpenCode — Final High-Power Operator Manual (Maya Lane)

## Role in .AGI Protocol
Provider-router lane for model agility, failover, and cost-optimized rerouting.

## Local CLI Evidence
```
Version: 1.3.3
Binary: opencode
```

## Lane Priority + Window Policy
- Router/fallback lane.
- Default windows: as needed for fallback.
- Primary role is routing and resilience, not direct work.

## Core CLI Capability Map

### Main Commands
- `opencode [project]` — start TUI (default)
- `opencode run [message..]` — run with message
- `opencode serve` — headless server mode
- `opencode web` — server + web interface
- `opencode attach <url>` — attach to running server

### Model & Provider Management
- `opencode models [provider]` — list all available models
- `opencode providers` — manage AI providers/credentials (alias: auth)
- `-m, --model <provider/model>` — specify model

### Session Management
- `-c, --continue` — continue last session
- `-s, --session <id>` — continue specific session
- `--fork` — fork session when continuing
- `--prompt <text>` — initial prompt
- `--agent <agent>` — agent to use

### Export/Import
- `opencode export [sessionID]` — export session as JSON
- `opencode import <file>` — import session from JSON/URL
- `opencode session` — manage sessions

### GitHub Integration
- `opencode github` — manage GitHub agent
- `opencode pr <number>` — fetch/checkout PR, run opencode

### MCP & ACP
- `opencode mcp` — manage MCP servers
- `opencode acp` — start ACP server
- `opencode agent` — manage agents

### Server Options
- `--port <n>` — port to listen on (default: 0)
- `--hostname <host>` — hostname (default: 127.0.0.1)
- `--mdns` — enable mDNS discovery
- `--mdns-domain <domain>` — custom mDNS domain
- `--cors <domains>` — additional CORS domains

### Utilities
- `opencode stats` — token usage and cost statistics
- `opencode db` — database tools
- `opencode debug` — debugging tools
- `opencode upgrade [target]` — upgrade to latest/specific version
- `opencode uninstall` — uninstall opencode
- `opencode completion` — generate shell completion

### Logging
- `--print-logs` — print logs to stderr
- `--log-level <level>` — DEBUG, INFO, WARN, ERROR

## Provider Routing Capabilities
OpenCode can route to multiple providers:
- OpenAI (GPT-4, GPT-4o, o1, o3)
- Anthropic (Claude)
- Google (Gemini)
- NVIDIA (via nvidia/ prefix)
- OpenRouter (via openrouter/ prefix)
- Local (Ollama, LM Studio)

Use `opencode models` to see full catalog.

## Assignment Rules for Maya
Use for:
- rerouting and fallback when primary lanes hit quota
- provider switching under pressure
- cost optimization in large cycles
- model elasticity and experimentation
- NVIDIA route access (see nvidia.md)

## Example Dispatch Commands
```bash
# List all available models
opencode models

# List NVIDIA models specifically
opencode models | grep nvidia/

# Run with specific model
opencode run -m "nvidia/meta/llama-3.3-70b-instruct" "Analyze this code"

# Headless server mode
opencode serve --port 8080

# Continue previous session
opencode --continue

# Export session for backup
opencode export > session_backup.json
```

## Cost Class
- FREE (model-dependent, e.g., opencode/nemotron-3-super-free)
- API-KEY-USAGE (most providers)
