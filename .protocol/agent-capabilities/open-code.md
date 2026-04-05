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

# Fork a session (try multiple approaches without rebuilding context)
opencode run -s <session-id> --fork -p "Alternative approach"

# Resume session
opencode session resume <session-id>

# Open web dashboard (real-time monitoring)
opencode web

# Start as ACP daemon (for IDE integration)
opencode acp
```

---

## 4. MCP (Model Context Protocol) Integration

Configure in `opencode.jsonc` at your project root (or `~/.opencode/config.json` globally):

```json
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
    }
  }
}
```

>**Power Use:** With `sqlite-reader` active, OpenCode queries the live database and writes correct, schema-matched models without you pasting anything. Avoid leaving unused MCP servers active to prevent token overflow.

---

## 5. Agent Client Protocol (ACP)

ACP turns OpenCode into a persistent JSON-RPC daemon that external editors connect to directly.

```bash
# Start OpenCode as ACP daemon
opencode acp
```

**Supported Editors:** Zed, JetBrains, Neovim (via avante/codecompanion).

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

---

## 6. Custom Plugins

Plugin location:(`.opencode/plugins/` project-level or `~/.config/opencode/plugins/` global)

Create a custom plugin in `.opencode/plugins/my-plugin.ts`:
```typescript
export default function myPlugin(ctx) {
  return {
    // Hook: runs after every file write
    afterFileWrite: async ({ file }) => {
      await ctx.shell`eslint ${file} --fix`;
    },
    // Hook: runs before every LLM request
    beforeRequest: async ({ prompt }) => {
      const log = await ctx.shell`git log --oneline -10`.text();
      return { ...prompt, system: prompt.system + `\nRecent history:\n${log}` };
    }
  };
}
```

---

## 7. Ultra-Dex Swarm Role & Dispatch

* **Role:** Precision Engineer
* **Best For:** Critical architecture edits, safe refactoring, and single file manipulations relying heavily on zero-cost free models.
* **Windows:** 1-2 Terminal Tabs.
* **$0 Strategy:** Aggressive use of `nemotron-3-super-free` 1M context for free repo scanning.

### Dispatch Templates

```bash
# Terminal (Precision Surgeon File Edit)
opencode run -m opencode/gpt-5-nano \
             -f src/services/compliance/compliance-service.ts \
             -p "Replace dynamic require with top-level ESM import here."

# Terminal (Free 1M Context Architect)
opencode run -m opencode/nemotron-3-super-free \
             -p "Read every file in src/. Identify all violations."

# Terminal (UI Screenshot Read)
opencode run -m opencode/mimo-v2-omni-free \
             -p "Read dashboard.png and build the React component."
```

