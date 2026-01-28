# Ultra-Dex MCP Integration Guide

> **Model Context Protocol (MCP)** is the open standard that connects AI assistants to your systems. Ultra-Dex provides a native MCP server ("Active Kernel") that allows tools like **Claude Desktop** and **Cursor** to read your project context, execute agents, and monitor state directly.

---

## 🚀 1. Setup for Claude Desktop

Claude Desktop can connect directly to your local Ultra-Dex project, giving it "God Mode" access to your plans, code graph, and CLI agents.

### Automatic Setup (Recommended)
Run this command in your project root:
```bash
npx ultra-dex config --mcp
```
This will generate the configuration and output the path to your Claude Desktop config file.

### Manual Setup
Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ultra-dex": {
      "command": "npx",
      "args": ["ultra-dex", "serve"],
      "cwd": "/absolute/path/to/your/project"
    }
  }
}
```

### Verification
1. Restart Claude Desktop.
2. Look for the 🔌 icon (Project Connection).
3. Ask Claude: *"What is the current status of the project plan?"*

---

## 🖱️ 2. Setup for Cursor / Windsurf

Cursor can use the Ultra-Dex "Active Kernel" via MCP or by consuming the generated context files.

### Option A: Direct Context (Simple)
Ultra-Dex maintains `CONTEXT.md` and `IMPLEMENTATION-PLAN.md` as the single source of truth.
1. Run `npx ultra-dex watch` in a terminal.
2. In Cursor, type `@CONTEXT.md` to reference the project state.

### Option B: Rule Integration
Generate AI-optimized rules for Cursor:
```bash
npx ultra-dex config --cursor
```
This creates `.cursor/rules/ultra-dex.mdc` which teaches Cursor how to follow your implementation plan.

---

## 🔌 3. WebSocket Protocol (For Custom Clients)

You can build your own tools that connect to the Ultra-Dex Kernel.

**Endpoint:** `ws://localhost:3001/stream`

### Message Types

#### `connected`
Sent immediately upon connection.
```json
{ "type": "connected", "timestamp": 1709238492000 }
```

#### `state_update`
Broadcast when file watcher detects changes.
```json
{
  "type": "state_update",
  "data": {
    "project": { "name": "MyApp", "version": "0.1.0" },
    "phases": [...]
  }
}
```

#### `log`
Real-time system logs from the CLI.
```json
{ "type": "log", "message": "Build started", "level": "info" }
```

#### `agent_status`
Live updates on agent activity.
```json
{
  "type": "agent_status",
  "agent": "backend",
  "status": "working",
  "activity": "Generating API routes..."
}
```

---

## 🛠️ MCP Tools Exposed

The Ultra-Dex MCP server exposes these tools to the AI:

| Tool | Description |
|------|-------------|
| `get_context` | Read full project context and plan |
| `get_graph` | Get the code dependency graph (nodes/edges) |
| `run_agent` | Execute a specific sub-agent (e.g., @backend) |
| `check_alignment` | Compare plan vs. implementation |

---

## FAQ

**Q: Do I need to run `npx ultra-dex serve` manually?**
A: If you use Claude Desktop, it starts the server automatically in the background. If you want the Web Dashboard or WebSocket access, run `npx ultra-dex serve --http` manually.

**Q: Can I use this with OpenAI?**
A: Yes! The CLI supports OpenAI. However, the deep integration (MCP) is currently optimized for Claude Desktop. We are working on a ChatGPT plugin.
