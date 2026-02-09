# MCP Integration Guide

This guide shows how to connect Ultra‑Dex MCP with popular tools.

---

## 1. Start MCP Server

```bash
ultra-dex serve
```

Default:
- HTTP: `http://localhost:3001`
- WebSocket: `ws://localhost:3002`

---

## 2. Cursor

1. Open Cursor settings
2. Add MCP endpoint:
   - `http://localhost:3001`
3. Restart Cursor

---

## 3. Windsurf / Cline

Use the same MCP endpoint:
```
http://localhost:3001
```

---

## 4. Resources + Tools

Common MCP resources:
- `ultra://project/state`
- `ultra://project/context`
- `ultra://memory/search?q=...`

Common MCP tools:
- `remember(text, tags)`
- `query_graph(query)`
- `validate_output(code)`

---

## 5. Troubleshooting

- Verify server running: `ultra-dex serve`
- Check logs: `ultra-dex monitor`
- Ensure no port conflicts on 3001/3002
