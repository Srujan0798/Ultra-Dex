# Ultra-Dex v6.0.0: AI Agent Orchestration for VS Code

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/SrujanSaiKarna.ultra-dex-vscode)](https://marketplace.visualstudio.com/items?itemName=SrujanSaiKarna.ultra-dex-vscode)
[![npm version](https://img.shields.io/npm/v/ultra-dex.svg)](https://www.npmjs.com/package/ultra-dex)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**The Meta-Orchestration Layer for AI Development**

Ultra-Dex makes your AI assistants (Claude, GPT, Cursor, Copilot) dramatically smarter by giving them structure, memory, and architectural context. This VS Code extension provides deep integration with the Ultra-Dex CLI.

---

## ✨ Features

### 🤖 Agent Explorer

Browse and select from 17 specialized AI agents organized by tier:

- **Leadership**: @CTO, @Planner, @Research
- **Development**: @Backend, @Frontend, @Database
- **Security**: @Auth, @Security
- **DevOps**: @DevOps
- **Quality**: @Testing, @Documentation, @Reviewer, @Debugger
- **Specialist**: @Performance, @Refactoring
- **Orchestration**: @Orchestrator

### 🐝 Swarm Orchestration

Run autonomous agent swarms directly from VS Code:

- Multi-agent parallel execution
- Real-time progress tracking
- Automatic task breakdown and delegation

### 🔍 Semantic Search

Search your codebase semantically, not just by keywords:

- Vector embeddings understand code intent
- Find related code across your project
- Keyboard shortcut: `Cmd+Shift+S` / `Ctrl+Shift+S`

### 🐳 Code Execution Sandbox

Execute selected code safely in Docker isolation:

- Run generated code before committing
- Test snippets without affecting your environment
- Supports JS, TS, Python, Go, Rust, Ruby

### 📊 Dashboard & Monitoring

- Status bar showing alignment score
- Quick Actions panel for common operations
- Real-time swarm status tracking

### 🔗 GitHub Integration

Sync GitHub issues directly to Ultra-Dex tasks:

- Auto-convert issues to agent tasks
- Create PRs from swarm output

---

## 🚀 Quick Start

### Prerequisites

1. Install the Ultra-Dex CLI:

   ```bash
   npm install -g ultra-dex
   ```

2. Set your AI provider API key:
   ```bash
   export ANTHROPIC_API_KEY=your-key
   # or
   export OPENAI_API_KEY=your-key
   ```

### Usage

1. **Open a project** with `IMPLEMENTATION-PLAN.md` or `CONTEXT.md`
2. **Click the Ultra-Dex icon** in the Activity Bar
3. **Browse agents** and click to copy prompts
4. **Run a swarm**: `Cmd+Shift+R` / `Ctrl+Shift+R`
5. **Semantic search**: `Cmd+Shift+S` / `Ctrl+Shift+S`

---

## ⌨️ Keyboard Shortcuts

| Command         | Mac           | Windows/Linux  |
| --------------- | ------------- | -------------- |
| Select Agent    | `Cmd+Shift+A` | `Ctrl+Shift+A` |
| Semantic Search | `Cmd+Shift+S` | `Ctrl+Shift+S` |
| Run Swarm       | `Cmd+Shift+R` | `Ctrl+Shift+R` |

---

## 📋 Commands

Access via Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`):

| Command                          | Description                   |
| -------------------------------- | ----------------------------- |
| `Ultra-Dex: Select Agent`        | Choose an agent for your task |
| `Ultra-Dex: Run Agent Swarm`     | Execute autonomous pipeline   |
| `Ultra-Dex: Semantic Search`     | Search codebase by meaning    |
| `Ultra-Dex: Execute in Sandbox`  | Run selected code in Docker   |
| `Ultra-Dex: Check Alignment`     | Verify plan vs code alignment |
| `Ultra-Dex: Generate Plan`       | Create implementation plan    |
| `Ultra-Dex: Start Active Kernel` | Launch MCP server             |
| `Ultra-Dex: Open Dashboard`      | Open God Mode UI              |
| `Ultra-Dex: Sync GitHub Issues`  | Import issues as tasks        |

---

## ⚙️ Configuration

| Setting                     | Default     | Description                           |
| --------------------------- | ----------- | ------------------------------------- |
| `ultra-dex.defaultProvider` | `anthropic` | AI provider (anthropic/openai/google) |
| `ultra-dex.kernelPort`      | `3001`      | Port for Active Kernel                |
| `ultra-dex.dashboardPort`   | `3002`      | Port for Dashboard                    |
| `ultra-dex.autoStartKernel` | `false`     | Auto-start kernel on project open     |
| `ultra-dex.enableSandbox`   | `true`      | Enable Docker sandbox                 |

---

## 🔌 MCP Integration

Ultra-Dex serves as an MCP (Model Context Protocol) server for Claude Desktop and other MCP clients:

```bash
# Generate MCP config
ultra-dex config --mcp
```

This lets Claude Desktop access your project context directly.

---

## 📖 Documentation

- [Full Documentation](https://github.com/Srujan0798/Ultra-Dex#readme)
- [CLI Reference](https://github.com/Srujan0798/Ultra-Dex/blob/main/cli/README.md)
- [Agent Prompts](https://github.com/Srujan0798/Ultra-Dex/tree/main/agents)
- [Roadmap](https://github.com/Srujan0798/Ultra-Dex/blob/main/docs/ROADMAP.md)

---

## 🐛 Issues & Feedback

Found a bug or have a feature request?

- [GitHub Issues](https://github.com/Srujan0798/Ultra-Dex/issues)

---

## 📄 License

MIT License - see [LICENSE](https://github.com/Srujan0798/Ultra-Dex/blob/main/LICENSE)

---

**Made with 💜 by the Ultra-Dex Team**

_"From Idea to Full-Scale, Production-Ready Application"_
