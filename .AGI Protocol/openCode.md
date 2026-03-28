# OpenCode CLI: Official Deep Feature Playbook

**Document Status:** 2026 Official Documentation Verified  
**Source:** opencode.ai/docs + sst-dev/opencode GitHub  
**Tool:** `opencode` CLI binary (by SST team)  
**Objective:** Use OpenCode as a zero-cost, plugin-extensible, protocol-native engineering daemon.

---

## 1. Installation & Setup

```bash
# Install globally
npm install -g opencode-ai

# Or via curl
curl -fsSL https://opencode.ai/install | bash

# Start TUI (Terminal UI)
opencode

# Start web dashboard
opencode web
```

---

## 2. The Free Model Roster

Run `opencode models` to see available models. The fully free open-weight models are:

| Model ID | Context | Best Use |
|---|---|---|
| `opencode/minimax-m2.5-free` | 128K | Best free general-purpose — heavy architecture tasks |
| `opencode/nemotron-3-super-free` | 1M | 1 million token context — full-repo analysis for free |
| `opencode/mimo-v2-pro-free` | 64K | Balanced code quality |
| `opencode/mimo-v2-omni-free` | 64K | Multimodal — reads images/screenshots |
| `opencode/gpt-5-nano` | 32K | Fastest — simple surgical edits |
| `opencode/big-pickle` | 32K | Creative problem solving |

Switch models at runtime:
```bash
opencode run -m opencode/nemotron-3-super-free -p "Analyze the full codebase"
```

---

## 3. Core CLI Commands

```bash
# Run a one-shot task
opencode run -p "Your task here"

# Restrict context to a single file (critical for saving context window)
opencode run -f src/index.js -p "Remove all AgentScheduler imports"

# Run with a specific free model
opencode run -m opencode/gpt-5-nano -f index.js -p "Delete dead imports"

# Fork a session (try multiple approaches without rebuilding context)
opencode run -s <session-id> --fork -p "Alternative approach"

# List active sessions
opencode session list

# Resume session
opencode session resume <session-id>

# Open web dashboard (real-time monitoring)
opencode web

# List all available models
opencode models

# Manage GitHub integrations
opencode github

# Start as ACP daemon (for IDE integration)
opencode acp
```

---

## 4. MCP (Model Context Protocol) Integration

Configure in `opencode.jsonc` at your project root (or `~/.opencode/config.json` globally):

```jsonc
{
  "mcp": {
    "sqlite-reader": {
      "type": "local",
      "enabled": true,
      "command": ["npx", "-y", "@modelcontextprotocol/server-sqlite", "./data/app.db"]
    },
    "github-issues": {
      "type": "remote",
      "enabled": true,
      "url": "https://api.github.com/mcp"
    },
    "filesystem": {
      "type": "local", 
      "enabled": false,
      "command": ["npx", "-y", "@modelcontextprotocol/server-filesystem", "./src"]
    }
  }
}
```

**The Power:** With `sqlite-reader` active, you can say:
> *"Query the database to get the schema for the users table, then write a TypeScript model and CRUD service for it."*

Codex will query your live database and write correct, schema-matched code without you pasting anything.

**⚠️ Warning:** Every active MCP server injects tokens. Disable unused ones to avoid context limit overflow.

---

## 5. Agent Client Protocol (ACP)

ACP turns OpenCode into a persistent JSON-RPC daemon that external editors can connect to.

```bash
# Start OpenCode as ACP daemon
opencode acp
```

**Supported Editors:**
- Zed
- JetBrains (IntelliJ, WebStorm)
- Neovim (via `avante.nvim` or `codecompanion.nvim`)

**Config for Zed (`settings.json`):**
```json
{
  "agent_servers": {
    "opencode": {
      "command": "opencode",
      "args": ["acp"]
    }
  }
}
```

Once connected, your IDE sends tasks to OpenCode's full agentic engine — including all your free models and MCP tools — directly from the editor command palette.

---

## 6. Custom Plugins

Plugin location: `.opencode/plugins/` (project-level) or `~/.config/opencode/plugins/` (global)

Install from npm:
```bash
# In your config directory
cd ~/.config/opencode
echo '{"dependencies": {"opencode-plugin-eslint": "latest"}}' > package.json
```

Or create a custom plugin in `.opencode/plugins/my-plugin.ts`:
```typescript
export default function myPlugin(ctx) {
  return {
    // Hook: runs after every file write
    afterFileWrite: async ({ file }) => {
      await ctx.shell`eslint ${file} --fix`;
    },
    // Hook: runs before every LLM request
    beforeRequest: async ({ prompt }) => {
      // Inject git log into every prompt
      const log = await ctx.shell`git log --oneline -10`.text();
      return { ...prompt, system: prompt.system + `\nRecent git history:\n${log}` };
    }
  };
}
```

**Available hook events:** `beforeRequest`, `afterFileWrite`, `afterShellCommand`, `onSessionStart`, `onSessionEnd`, `onLSPDiagnostic`

---

## 7. Ultra-Dex Swarm Dispatch Templates

```bash
# Terminal A: Precision File Surgeon (uses cheapest free model)
opencode run -m opencode/gpt-5-nano \
             -f src/services/compliance/compliance-service.ts \
             -p "The dynamic require('crypto') on line 417 must be replaced with a top-level ESM import. Make only this change."

# Terminal B: Full-Repo Architect (uses 1M context free model)
opencode run -m opencode/nemotron-3-super-free \
             -p "Read every file in src/. Identify all architectural violations: missing error handling, missing input validation, console.log statements, and any types. Output as a structured markdown report."

# Terminal C: UI Screenshot to Code (uses multimodal free model)
opencode run -m opencode/mimo-v2-omni-free \
             -p "Look at the attached dashboard screenshot and convert it to a pixel-perfect React component using Tailwind CSS."
```
