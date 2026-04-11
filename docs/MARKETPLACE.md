# Agent Marketplace

Ultra-Dex v4.0.0 introduces an agent marketplace for discovering, installing, and publishing agents.

## Overview

The marketplace enables:

- **Discover** — Browse available agents by category
- **Install** — Download and use community agents
- **Publish** — Share your own agents
- **Search** — Find agents by capability or description

## Built-in Agents

8 agents included with Ultra-Dex:

| Agent               | Category       | Description                                |
| ------------------- | -------------- | ------------------------------------------ |
| @ultra-dex/planner  | planning       | Task decomposition and planning specialist |
| @ultra-dex/backend  | coding         | Server-side code and API design            |
| @ultra-dex/frontend | coding         | UI components and user interfaces          |
| @ultra-dex/reviewer | review         | Code review and quality analysis           |
| @ultra-dex/cto      | planning       | High-level architecture decisions          |
| @ultra-dex/security | security       | Security vulnerability detection           |
| @ultra-dex/database | data           | Database schema and query design           |
| @ultra-dex/devops   | infrastructure | Deployment and infrastructure              |

## CLI Commands

```bash
# List available agents
ultra-dex marketplace list
ultra-dex marketplace list --category coding

# Install an agent
ultra-dex marketplace install @ultra-dex/security

# Show agent details
ultra-dex marketplace info @ultra-dex/planner

# Search for agents
ultra-dex marketplace search "security audit"

# Publish your agent
ultra-dex marketplace publish ./my-agent

# Uninstall a local agent
ultra-dex marketplace uninstall @community/my-agent
```

## Agent Package Format

Agent packages have this structure:

```
my-agent/
├── agent.json       # Metadata
├── prompt.md        # System prompt
├── tools.json       # MCP tools (optional)
└── README.md        # Documentation
```

### agent.json

```json
{
  "name": "@community/my-agent",
  "version": "1.0.0",
  "description": "What this agent does",
  "author": "Your Name",
  "capabilities": ["coding", "review"],
  "providers": ["claude", "openai"],
  "minVersion": "3.1.0"
}
```

### prompt.md

```markdown
# System Prompt

You are @MyAgent. Your role is to...

## Capabilities

- Thing 1
- Thing 2

## Guidelines

1. Always do X
2. Never do Y
```

## Agent Resolution

Ultra-Dex resolves agents in this order:

1. **Built-in** — `@ultra-dex/planner` → internal agents
2. **Community** — `@community/security-auditor` → marketplace
3. **Local** — `./my-agent` → relative path

## Registry

Agents are stored in:

```
~/.ultra-dex/agents/
├── @ultra-dex/      # Built-in (symlinks)
├── @community/       # Installed from marketplace
└── local/            # Local development
```

## Creating Custom Agents

1. Create a directory for your agent
2. Write `agent.json` with metadata
3. Write `prompt.md` with the system prompt
4. Test locally: `ultra-dex run ./my-agent -t "task"`
5. Publish: `ultra-dex marketplace publish ./my-agent`

## Categories

- `planning` — Task decomposition, architecture
- `coding` — Code generation, review
- `security` — Auditing, vulnerability detection
- `data` — Database, analytics
- `infrastructure` — DevOps, deployment
- `review` — Code review, analysis

## Cost

- **Built-in agents** — Free
- **Community agents** — Free or paid (set by author)
- **Publishing** — Free

## Security

- Agents run in isolated sandboxes
- No filesystem access outside project directory
- Network access restricted to declared providers
