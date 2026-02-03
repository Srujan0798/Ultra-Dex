# Performance Tuning Guide

> **Optimize Ultra-Dex for speed and scale.**
> Strategies for handling large codebases and complex agent swarms.

---

## ⚡ Overview

Ultra-Dex is built for performance, but large projects (>10k files) may require tuning. This guide covers configuration and best practices.

## 🛠️ Configuration

Edit your `~/.ultra-dex/config.json` or project `.ultra/config.json`:

```json
{
  "performance": {
    "cacheEnabled": true,
    "maxConcurrentTasks": 10,
    "graphScanInterval": 60000
  }
}
```

| Setting | Default | Recommendation for Large Projects |
|---------|---------|-----------------------------------|
| `cacheEnabled` | `true` | Keep `true`. Crucial for graph scans. |
| `maxConcurrentTasks` | `5` | Increase to `10-20` if you have high bandwidth/CPU. |
| `graphScanInterval` | `30000` | Increase to `300000` (5 mins) to reduce I/O. |

## 🧠 Code Graph Optimization

The Code Property Graph (CPG) scans your project to understand dependencies.

### Ignoring Files
Ensure you are ignoring build artifacts and heavy directories in `.gitignore`. Ultra-Dex respects `.gitignore` automatically.

**Recommended `.gitignore`:**
```text
node_modules/
dist/
build/
coverage/
.next/
*.log
```

### Selective Scanning
Use `ultra-dex search --index --force` only when structure changes significantly. Routine operations use the cache.

## 🤖 Agent Performance

### Parallel Swarms
Use the `--parallel` flag when tasks are independent:

```bash
npx ultra-dex swarm "Build auth and payment endpoints" --parallel
```

This runs `@Backend` (Auth) and `@Backend` (Payments) simultaneously if the planner determines they don't overlap.

### Context Window Management
Large context windows ($$$) slow down responses.
- **Use `CONTEXT.md` effectively:** Keep it high-level. Don't dump entire files unless necessary.
- **Use `read_file` sparsely:** Agents should read only what they need.

## 🐳 Docker Sandbox

The Docker sandbox adds overhead (~1-2s startup).
- **Reuse Containers:** (Coming in v3.5)
- **Native Mode:** Use `--no-sandbox` if you trust the agents and need raw speed (use with caution).

## 📊 Monitoring

Use `ultra-dex metrics --watch` to identify bottlenecks.

- **High CPU?** Reduce `maxConcurrentTasks`.
- **High Memory?** Check graph node count. If >100k nodes, consider splitting the project into workspaces.

---

*Found a performance bug? Report it on GitHub.*
