# 🎮 Ultra-Dex v4.0.0

> **The Gamified AI Kernel & Meta-Layer for Autonomous Coding**

[![npm version](https://img.shields.io/npm/v/ultra-dex.svg)](https://www.npmjs.com/package/ultra-dex)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green.svg)](https://nodejs.org/)

Ultra-Dex is an AI orchestration meta-layer that sits above your development tools (Cursor, Claude, VS Code, etc.) to provide persistent memory, architectural governance, and autonomous coding capabilities.

---

## 🚀 What is Ultra-Dex?

Ultra-Dex is the **"Kubernetes for AI Coding"** - we don't compete with AI coding tools, we orchestrate them.

### The Problem: "AI Amnesia"

AI coding tools are powerful but suffer from:
- **Context Loss**: They forget your project's architecture between sessions
- **Drift**: They deviate from your architectural decisions
- **Inconsistency**: Each session starts from scratch
- **No Governance**: No guardrails for AI-generated code

### The Solution: Active Meta-Layer

Ultra-Dex provides:
1. **Persistent Memory**: `CONTEXT.md` brain that never forgets your project
2. **Architectural Governance**: Enforces rules through Protocol 21 verification gates
3. **Multi-Provider AI**: Smart routing across OpenAI, Anthropic, Google, and local models
4. **MCP Integration**: Model Context Protocol for real-time tool synchronization
5. **Gamification**: Turn shipping code into achievements, XP, and challenges

---

## ✨ Core Features

### 🧠 Memory & Context
- **Hot-Warm-Cold Tiered Memory**: Efficient context management with automatic tier transitions
- **Vector Embeddings**: Semantic search across your codebase and documentation
- **Knowledge Graph**: Understand code relationships and impact analysis
- **Context Pruning**: Automatic cleanup with `--prune` to keep memory relevant

### 🤖 AI Orchestration
- **Multi-Provider Support**: OpenAI (GPT-4), Anthropic (Claude), Google (Gemini), Ollama (local)
- **Smart Routing**: Automatically select the best model based on task complexity and cost
- **Token Budgeting**: Track and optimize AI usage costs
- **Streaming Responses**: Real-time AI output with progress indicators

### 🔌 Model Context Protocol (MCP)
- **MCP Server**: Share context with Claude Desktop, VS Code, and other MCP clients
- **Context Bus**: WebSocket-based real-time synchronization across tools
- **Resource Exposure**: `ultradex://context`, `ultradex://plan`, `ultradex://state`, `ultradex://graph`
- **Tool Integration**: Execute Ultra-Dex commands from any MCP client

### 🛡️ Governance & Quality
- **Protocol 21**: 21-step verification gate for every feature
- **Capability Contracts**: Declarative tool permissions and rate limits
- **Governance Agent**: ADR-aware validation and architectural decision enforcement
- **Glass Box Ledger**: Immutable audit log of every AI decision
- **Security First**: RBAC, token encryption, secure storage

### 🎮 Gamification
- **Challenges**: Time-boxed coding sprints with XP rewards
- **Leaderboards**: Compete on shipping velocity and code quality
- **Achievements**: Unlock badges for milestones
- **XP System**: Earn points for commits, tests, and deploys

### 🌐 Integrations
- **Version Control**: GitHub, GitLab
- **Project Management**: Jira, Linear, Notion, Trello
- **Communication**: Slack, Discord
- **Cloud**: Vercel, Supabase, Stripe
- **Analytics**: Segment tracking

---

## 🏁 Quick Start

### Installation

```bash
npm install -g ultra-dex
```

### Initialize a Project

```bash
# Create a new project with enterprise governance
mkdir my-saas && cd my-saas
ultra-dex init --enterprise

# Or initialize in an existing project
ultra-dex init
```

This creates:
- `CONTEXT.md` - Your project's persistent memory
- `IMPLEMENTATION-PLAN.md` - Living architecture document
- `.ultra/` - State, config, and logs
- `.ultra-dex.config.json` - Project configuration

### Configure AI Providers

```bash
# Set up API keys
ultra-dex auth setup

# Configure your preferred provider
ultra-dex config set provider openai
ultra-dex config set model gpt-4

# Or use Claude
ultra-dex config set provider anthropic
ultra-dex config set model claude-sonnet-4
```

### Start Building

```bash
# Generate a feature with AI
ultra-dex scaffold "User authentication with JWT"

# Run autonomous implementation
ultra-dex auto-implement "Add password reset flow"

# Check code quality
ultra-dex check

# Verify against Protocol 21
ultra-dex verify

# Commit with AI-generated message
ultra-dex commit
```

---

## 📖 Core Commands

### Project Management
```bash
ultra-dex init              # Initialize Ultra-Dex in a project
ultra-dex state             # View current project state
ultra-dex memory            # Show memory tiers and usage
ultra-dex memory --prune    # Clean up old context
ultra-dex memory --visual   # Visual memory status
```

### AI Development
```bash
ultra-dex scaffold <feature>          # Generate feature scaffolding
ultra-dex auto-implement <task>       # Autonomous implementation
ultra-dex agents                       # Manage AI agent swarm
ultra-dex exec <command>              # Execute with AI assistance
ultra-dex diff                        # Intelligent code diff
```

### Architecture & Planning
```bash
ultra-dex architect         # Run architecture planning
ultra-dex scaffold-plan     # Generate implementation plan
ultra-dex estimate          # Estimate task complexity
ultra-dex impact            # Analyze change impact
```

### Quality & Verification
```bash
ultra-dex check            # Run quality checks
ultra-dex verify           # Protocol 21 verification
ultra-dex audit            # Security audit
ultra-dex test             # Run tests with AI analysis
```

### Integrations
```bash
ultra-dex sync github      # Sync with GitHub
ultra-dex jira             # Jira integration
ultra-dex notion           # Notion sync
ultra-dex slack            # Slack notifications
```

### MCP & Context Sharing
```bash
ultra-dex mcp start        # Start MCP server
ultra-dex mcp status       # Check MCP status
ultra-dex export mcp       # Export to MCP format
```

### Gamification
```bash
ultra-dex challenge start "Feature in 30m"  # Start timed challenge
ultra-dex challenge list                     # Show active challenges
ultra-dex leaderboard                        # View rankings
ultra-dex achievements                       # Show unlocked achievements
```

---

## 🧩 Advanced Features

### 1. Agent Swarm Orchestration

Deploy multiple specialized AI agents that collaborate:

```bash
# Start an agent swarm
ultra-dex swarm deploy --agents architect,executor,reviewer

# Monitor swarm activity
ultra-dex swarm status

# View agent communication
ultra-dex swarm logs
```

### 2. Browser Automation

Automate web tasks with AI-powered browser control:

```bash
# Launch browser agent
ultra-dex browse --task "Fill out the signup form"

# Headless automation
ultra-dex browser-auto --script deployment-test.yml
```

### 3. Sandboxed Execution

Run code safely in isolated Docker containers:

```bash
# Execute in sandbox
ultra-dex sandbox run --language python --file script.py

# Test in multiple runtimes
ultra-dex sandbox test --runtimes node,python,rust
```

### 4. Smart Model Routing

Automatically route tasks to the optimal AI model:

```bash
# Configure routing preferences
ultra-dex route config --prefer-cost    # Optimize for cost
ultra-dex route config --prefer-quality # Optimize for quality
ultra-dex route config --prefer-speed   # Optimize for speed

# View routing decisions
ultra-dex route analyze
```

### 5. Team Collaboration

Sync context and state across your team:

```bash
# Initialize team workspace
ultra-dex team init

# Share context with team
ultra-dex team sync push

# Pull latest team context
ultra-dex team sync pull
```

---

## 🔧 Configuration

### Project Configuration (.ultra-dex.config.json)

```json
{
  "provider": "openai",
  "model": "gpt-4",
  "temperature": 0.7,
  "maxTokens": 4000,
  "memory": {
    "hotTierSize": 100,
    "warmTierSize": 500,
    "coldTierSize": 2000,
    "autoPrune": true
  },
  "governance": {
    "enableProtocol21": true,
    "requireApproval": ["high-risk"],
    "autoVerify": false
  },
  "mcp": {
    "enabled": true,
    "port": 3002,
    "autoStart": true
  },
  "gamification": {
    "enabled": true,
    "trackXP": true
  }
}
```

### Environment Variables

```bash
# AI Provider Keys
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export GOOGLE_API_KEY="AIza..."

# Integration Keys
export GITHUB_TOKEN="ghp_..."
export JIRA_TOKEN="..."
export NOTION_TOKEN="..."
export SLACK_TOKEN="..."

# Ultra-Dex Settings
export ULTRA_DEX_LOG_LEVEL="info"
export ULTRA_DEX_TELEMETRY="true"
```

---

## 🏗️ Architecture

Ultra-Dex consists of several interconnected subsystems:

### Core Systems
- **CLI Router**: Command parsing and execution
- **State Machine**: Project state management
- **Config Manager**: Configuration and settings
- **Plugin System**: Extensible architecture

### AI & Memory
- **Provider Abstraction**: Unified interface for AI models
- **Model Router**: Task-based model selection
- **Memory Tiers**: Hot-warm-cold context storage
- **Vector Store**: Semantic search with SQLite
- **Knowledge Graph**: Code relationship mapping

### Protocols
- **MCP Server**: Model Context Protocol implementation
- **Context Bus**: Real-time sync via WebSocket
- **ACP Host**: GitHub's Agent Client Protocol

### Quality & Governance
- **Protocol 21**: 21-step verification pipeline
- **Capability Contracts**: Tool permission system
- **Governance Agent**: ADR enforcement
- **Glass Box Ledger**: Audit logging

### Execution
- **Agent Swarm**: Multi-agent orchestration
- **Sandbox**: Docker-based isolated execution
- **Browser Automation**: Playwright/Puppeteer integration

---

## 📚 Documentation

- **[MCP Integration Guide](docs/mcp/MCP-INTEGRATION-GUIDE.md)** - Connect with Claude Desktop and other MCP clients
- **[CLI Commands Reference](docs/CLI-REFERENCE.md)** - Complete command documentation
- **[Architecture Guide](docs/ARCHITECTURE.md)** - System design and internals
- **[Plugin Development](docs/PLUGIN-DEVELOPMENT.md)** - Build custom extensions
- **[RFC-001: Capability Contracts](docs/rfc/001-capability-contracts.md)** - Tool permission system
- **[RFC-002: Governance Agent](docs/rfc/002-governance-agent.md)** - Architectural governance

---

## 🤝 Contributing

Ultra-Dex is open source and welcomes contributions!

```bash
# Clone the repository
git clone https://github.com/Srujan0798/Ultra-Dex.git
cd Ultra-Dex

# Install dependencies
npm install

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

### Development Guidelines
- Follow the existing code style
- Write tests for new features
- Update documentation
- Respect Protocol 21 for major changes

---

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🌟 Why Ultra-Dex?

### For Solo Developers
- Never lose context between coding sessions
- Automate repetitive development tasks
- Learn from AI-powered code analysis
- Track your progress with gamification

### For Teams
- Shared context across the entire team
- Consistent architectural decisions
- Governance and quality gates
- Real-time collaboration with MCP

### For Enterprises
- Security-hardened with RBAC and audit logs
- Cost optimization with smart model routing
- Compliance-ready with glass box transparency
- Plugin architecture for custom integrations

---

## 🙏 Acknowledgments

Built with:
- [@anthropic-ai/sdk](https://www.npmjs.com/package/@anthropic-ai/sdk) - Claude AI integration
- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) - MCP protocol
- [LangChain](https://js.langchain.com/) - Agent orchestration
- [Commander.js](https://github.com/tj/commander.js) - CLI framework

**Author:** Srujan Sai Karna
**Version:** 4.0.0
**Repository:** [github.com/Srujan0798/Ultra-Dex](https://github.com/Srujan0798/Ultra-Dex)

---

**Made with ❤️ for developers who ship**
