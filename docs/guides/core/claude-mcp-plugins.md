# Claude Desktop MCP Plugins — Integration Recommendations

## Official MCP Servers from Anthropic

| Plugin | Purpose | Ultra-Dex Integration |
|--------|---------|----------------------|
| **@anthropic/mcp-server-filesystem** | Read/write local files | ✅ Essential — Ultra-Dex file operations |
| **@anthropic/mcp-server-sqlite** | Query SQLite databases | ✅ For audit trails, memory storage |
| **@anthropic/mcp-server-github** | GitHub API access | ✅ Repo management, PR creation |
| **@anthropic/mcp-server-git** | Git operations | ✅ Already have — enhance with this |
| **@anthropic/mcp-server-fetch** | HTTP requests | ✅ API calls to any service |
| **@anthropic/mcp-server-puppeteer** | Browser automation | ✅ Testing, screenshots, scraping |
| **@anthropic/mcp-server-slack** | Slack integration | ✅ Team notifications |

## Community MCP Servers (github.com/modelcontextprotocol/servers)

| Plugin | Purpose | Ultra-Dex Value |
|--------|---------|-----------------|
| **@modelcontextprotocol/server-brave-search** | Web search | Research, documentation lookup |
| **@modelcontextprotocol/server-memory** | Persistent memory | Ultra-Dex memory tier integration |
| **@modelcontextprotocol/server-postgres** | PostgreSQL | Direct DB queries for your Postgres |
| **@modelcontextprotocol/server-redis** | Redis cache | Direct Redis operations |
| **@modelcontextprotocol/server-sequential-thinking** | Complex reasoning | Multi-step problem solving |
| **@modelcontextprotocol/server-aws-kb-retrieval** | AWS Knowledge Base | Enterprise knowledge access |
| **@modelcontextprotocol/server-everart** | AI image generation | Visual content creation |
| **@modelcontextprotocol/server-google-drive** | Google Drive | Document storage integration |
| **@modelcontextprotocol/server-notion** | Notion API | Documentation/wiki integration |
| **@modelcontextprotocol/server-sentry** | Error tracking | Direct Sentry integration |

## Ultra-Dex Custom Plugins to Build

| Plugin | Purpose | Priority |
|--------|---------|----------|
| **@ultra-dex/provider-router** | Route to AI providers | P0 — Core functionality |
| **@ultra-dex/memory-store** | Persistent memory | P0 — Core functionality |
| **@ultra-dex/governance** | Audit, RBAC, policies | P0 — Enterprise feature |
| **@ultra-dex/billing** | Stripe integration | P0 — Revenue |
| **@ultra-dex/swarm-coordinator** | Multi-agent orchestration | P1 — Differentiator |
| **@ultra-dex/github-integration** | Enhanced GitHub | P1 — Developer workflow |
| **@ultra-dex/notion-sync** | Bi-directional Notion | P2 — Documentation |
| **@ultra-dex/linear-sync** | Project management | P2 — Team workflows |
| **@ultra-dex/slack-bot** | Slack notifications | P2 — Team alerts |
| **@ultra-dex/discord-bot** | Community bot | P3 — Community |
| **@ultra-dex/chrome-extension** | Browser extension | P3 — Distribution |
| **@ultra-dex/vscode** | VSCode extension | P3 — Developer experience |

## Recommended First 5 for v2.0

1. **@anthropic/mcp-server-filesystem** — Foundation
2. **@anthropic/mcp-server-sqlite** — Audit/logging
3. **@modelcontextprotocol/server-postgres** — Your Postgres
4. **@modelcontextprotocol/server-redis** — Your Redis
5. **@ultra-dex/provider-router** — Ultra-Dex core

## Installation Format

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-filesystem", "/allowed/path"]
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://..."]
    },
    "ultra-dex": {
      "command": "npx",
      "args": ["-y", "@ultra-dex/mcp-server"]
    }
  }
}
```
