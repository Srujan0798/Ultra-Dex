# 🔌 Ultra-Dex MCP Integration Guide

> **"Build Once, Use Everywhere."**
> Ultra-Dex is designed as a universal Model Context Protocol (MCP) server. It provides your project's context, memory, and tools to *any* MCP-compliant AI editor.

---

## 🚀 Quick Setup

The configuration is standardized in `mcp-config.json` at your project root.

### 1. Cursor / Windsurf / Cline
Add this to your editor's MCP settings (usually `~/.cursor/mcp.json` or similar):

```json
{
  "mcpServers": {
    "ultra-dex": {
      "command": "npx",
      "args": ["ultra-dex", "serve"],
      "cwd": "/absolute/path/to/your/project",
      "env": {
        "ANTHROPIC_API_KEY": "your-key-here"
      }
    }
  }
}
```

> **Note:** Replace `/absolute/path/to/your/project` with the actual full path.

---

## ✨ Capabilities by Tool

Once connected, your AI editor gains these Superpowers:

### 🧠 Persistent Memory
- **Tool:** `recall` / `remember`
- **Use Case:** "What did we decide about the auth schema last week?"
- **Benefit:** The AI stops hallucinating and checks the `CONTEXT.md` graph.

### 🏗️ Project Graph
- **Tool:** `query_codebase` / `analyze_impact`
- **Use Case:** "If I change `User.ts`, what breaks?"
- **Benefit:** Deep dependency analysis that standard generic LSP misses.

### 🛡️ Verification
- **Tool:** `verify_task`
- **Use Case:** "Verify if the Login feature is ready for production."
- **Benefit:** Runs the Protocol 21 checklist inside your editor.

---

## ❓ Frequently Asked Questions

**Q: Does this replace Claude Desktop?**
A: No, it *powers* Claude Desktop. You can use Claude for the reasoning interface and Ultra-Dex for the "Hands & Eyes" on the codebase.

**Q: Can I use local models (Ollama)?**
A: Yes. Ultra-Dex is the *Context Layer*. Connect it to Cline using a local Llama 3 model, and it will still have access to the full Project Graph and Memory.

**Q: What about latency?**
A: The Ultra-Dex 'Active Kernel' runs locally on your machine. Latency is near-zero for context retrieval.
