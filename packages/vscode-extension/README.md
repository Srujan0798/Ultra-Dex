# Ultra-Dex for VS Code

> **AI orchestration from within VS Code.** Run agents, launch swarms, and search persistent memory — without leaving your editor.

[![Version](https://img.shields.io/badge/version-4.0.0-blue.svg)](package.json) [![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE) [![VS Code >=1.85](https://img.shields.io/badge/vscode-%3E%3D1.85-brightgreen.svg)](package.json)

---

## Features

- **Run Agents** — Execute any Ultra-Dex agent (`planner`, `cto`, `backend`, `reviewer`, etc.) directly from the command palette or sidebar
- **Launch Swarms** — Kick off multi-agent workflows for complex features
- **Persistent Memory Search** — Search past execution context with semantic search
- **Task History** — View and replay previous task executions
- **Provider Routing** — Route tasks across 12+ AI providers with intelligent fallback
- **Configuration UI** — Manage provider keys, default models, and memory settings from VS Code settings

### Sidebar

The Ultra-Dex sidebar provides three panels:

- **Agents** — List available agents and run tasks
- **Tasks** — View active and completed task executions
- **Memory** — Search and browse persistent memory

![Sidebar screenshot placeholder](./assets/sidebar-placeholder.png)

### Command Palette

All commands are accessible via `Ctrl+Shift+P` / `Cmd+Shift+P`:

![Command palette placeholder](./assets/command-palette-placeholder.png)

---

## Installation

### From VS Code Marketplace (Recommended)

1. Open VS Code
2. Press `Ctrl+Shift+X` / `Cmd+Shift+X` to open Extensions
3. Search for **Ultra-Dex**
4. Click **Install**

### From VSIX File

1. Download the latest `.vsix` from [GitHub Releases](https://github.com/Srujan0798/Ultra-Dex/releases)
2. In VS Code, open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Run **Extensions: Install from VSIX...**
4. Select the downloaded `.vsix` file

### From Source

```bash
git clone https://github.com/Srujan0798/Ultra-Dex.git
cd Ultra-Dex/packages/vscode-extension
npm install
npm run compile
# Press F5 to launch Extension Development Host
```

---

## Configuration

### Required: Ultra-Dex CLI

This extension requires the Ultra-Dex CLI to be installed:

```bash
npm install -g @ultra-dex/cli
```

Verify installation:

```bash
ultra-dex --version
```

### Provider API Keys

Set your provider keys in your `.env` file (in your project root or home directory):

```bash
# At least one provider key is required
NVIDIA_API_KEY=nvapi-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
OPENAI_API_KEY=sk-your-key-here
GOOGLE_AI_KEY=your-key-here
```

### VS Code Settings

| Setting | Default | Description |
|---|---|---|
| `ultra-dex.cliPath` | `ultra-dex` | Path to the ultra-dex CLI executable |
| `ultra-dex.defaultProvider` | `nvidia` | Default AI provider (`nvidia`, `claude`, `openai`, `gemini`) |
| `ultra-dex.defaultAgent` | `planner` | Default agent role to use |
| `ultra-dex.autoSaveOutput` | `true` | Automatically save task output to workspace |

To configure, open VS Code Settings (`Ctrl+,` / `Cmd+,`) and search for **Ultra-Dex**.

### Memory Tier

The extension uses the CLI's memory configuration. Set in your `.env`:

```bash
# Redis (production) — requires docker compose or external Redis
MEMORY_BACKEND=redis
REDIS_URL=redis://localhost:6379

# File-based (development) — no external dependencies
MEMORY_BACKEND=file
```

---

## Commands Reference

| Command | Title | Description |
|---|---|---|
| `ultra-dex.run` | Ultra-Dex: Run Agent | Execute a single agent task |
| `ultra-dex.swarm` | Ultra-Dex: Run Swarm | Launch a multi-agent swarm workflow |
| `ultra-dex.config` | Ultra-Dex: Configure | Open configuration settings |
| `ultra-dex.stop` | Ultra-Dex: Stop Task | Stop the currently running task |
| `ultra-dex.replay` | Ultra-Dex: Replay Last Task | Replay the most recent task execution |

---

## Keyboard Shortcuts

| Shortcut | Command | Description |
|---|---|---|
| `Ctrl+Shift+U` / `Cmd+Shift+U` | `ultra-dex.run` | Run agent task (when editor focused) |
| `Ctrl+Shift+S` / `Cmd+Shift+S` | `ultra-dex.swarm` | Launch agent swarm |
| `Ctrl+Shift+M` / `Cmd+Shift+M` | `ultra-dex.memorySearch` | Search persistent memory |

---

## Available Agents

| Agent | Role | Best For |
|---|---|---|
| `planner` | Technical planner | Architecture design, task breakdown |
| `cto` | Chief Technology Officer | Strategic decisions, tech stack choices |
| `backend` | Backend developer | API design, database schemas, server logic |
| `frontend` | Frontend developer | UI components, React/Vue code |
| `reviewer` | Code reviewer | Code review, security audit |
| `debugger` | Debugger | Bug investigation, root cause analysis |

---

## Troubleshooting

### "ultra-dex command not found"

The CLI is not installed or not in your PATH. Install it:

```bash
npm install -g @ultra-dex/cli
```

Or set the full path in VS Code settings:

```json
{
  "ultra-dex.cliPath": "/usr/local/bin/ultra-dex"
}
```

### "No provider configured"

You need at least one AI provider API key. Add it to your `.env` file:

```bash
NVIDIA_API_KEY=nvapi-your-key-here
```

Then restart VS Code.

### Tasks hang or timeout

1. Check your provider API key is valid
2. Verify network connectivity to the provider API
3. Try a different provider: `ultra-dex.defaultProvider` setting
4. Use `ultra-dex.stop` to cancel the hanging task

### Memory search returns no results

- Ensure `MEMORY_BACKEND` is set in your `.env`
- For Redis: verify Redis is running (`redis-cli ping` → `PONG`)
- For file-based: check `.ultra-dex/` directory exists in your workspace

### Extension doesn't load after install

1. Reload VS Code: `Ctrl+Shift+P` → **Developer: Reload Window**
2. Check the Output panel (select **Ultra-Dex** from the dropdown)
3. Check VS Code version is >= 1.85

---

## Contributing

Contributions are welcome! See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT — see [LICENSE](../../LICENSE)
