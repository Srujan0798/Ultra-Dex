# Ultra-Dex CLI v3.5.0

> **AI Orchestration Meta-Layer for SaaS Development** - The complete toolkit for AI-assisted software engineering.

[![npm version](https://img.shields.io/npm/v/ultra-dex.svg)](https://www.npmjs.com/package/ultra-dex)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 What's New in v3.5.0 (February 2026)

### ✨ Major Features

#### 🎯 VS Code Extension Sidebar

Full IDE integration with 4 sidebar views:

```bash
# Install from VSIX or marketplace
# Access: Agent Explorer, Swarm Status, Context Preview, Quick Actions
```

#### ⚡ Real-Time WebSocket Dashboard

Instant updates, no polling:

```bash
npx ultra-dex dashboard  # or: npx ultra-dex d
# Live agent status, auto-reconnect, connection indicators
```

#### 🧠 Session Persistence & Memory

Never lose context:

```bash
npx ultra-dex memory sessions     # List all sessions
npx ultra-dex memory query "auth" # Search past decisions
```

### 📦 New Commands

```bash
# 💰 Cost Estimation
npx ultra-dex estimate "Build login system"
npx ultra-dex estimate feature-impl --monthly 100

# 🎤 Voice-to-Plan (Speech input)
npx ultra-dex voice "Create a task manager app"
npx ultra-dex voice --template full

# 📋 Batch Execution
npx ultra-dex batch setup.json
npx ultra-dex batch deploy.txt --dry-run

# 🔄 Command History
npx ultra-dex history list
npx ultra-dex history replay abc123

# ⚙️ Setup Wizard
npx ultra-dex setup              # Interactive configuration
npx ultra-dex setup --quick      # Fast defaults
```

### 🔧 Enhanced Features

```bash
# Quick Aliases
npx ultra-dex s "task"      # swarm
npx ultra-dex d             # dashboard
npx ultra-dex v             # verify
npx ultra-dex b             # build
npx ultra-dex g "idea"      # generate
npx ultra-dex i             # init
npx ultra-dex st            # status
npx ultra-dex m sessions    # memory

# Shell Completions (Tab completion)
source <(ultra-dex completions bash)  # Add to ~/.bashrc
source <(ultra-dex completions zsh)   # Add to ~/.zshrc

# Smart Error Handling
# Auto-suggestions when commands fail

# Auto-Sync on File Save
npx ultra-dex watch --sync  # Auto-runs sync --brain
```

### 🔄 CI/CD Integration

```yaml
# .github/workflows/ultra-dex.yml
- uses: Srujan0798/ultra-dex-action/verify@v1
  with:
    fail-on: 'incomplete-p0-sections'
    min-alignment: '70'

- uses: Srujan0798/ultra-dex-action/align@v1
  with:
    comment-on-pr: 'true'
```

### 📚 Example Repositories

Complete starter templates:

- **E-commerce** (Next.js + Stripe + PostgreSQL)
- **SaaS Analytics** (ClickHouse + Redis + Real-time)
- **Real-time Chat** (Socket.io + WebSocket)

[View Examples](./examples/)

---

## 📊 By The Numbers

- **60 CLI Commands** (with 10 smart aliases)
- **34 Cursor Rules** for comprehensive guidance
- **4 VS Code Sidebar Views** for IDE integration
- **3 GitHub Actions** for CI/CD
- **3 Example Repositories** production-ready
- **26 Total Features** in v3.5.0
- **95/95 Tests Passing**

---

## 🚀 Quick Start (30 seconds)

```bash
# Install globally
npm install -g ultra-dex

# Or use npx (no install needed)
npx ultra-dex setup

# Initialize project
npx ultra-dex init

# Generate plan from idea
npx ultra-dex generate "Your amazing SaaS idea"

# Start dashboard
npx ultra-dex dashboard
```

---

## 📖 Core Commands

### Project Management

```bash
npx ultra-dex init                    # Initialize new project
npx ultra-dex generate "idea"         # AI-generated implementation plan
npx ultra-dex swarm "objective"       # Run autonomous agents
npx ultra-dex run <agent>             # Run single agent
npx ultra-dex align                   # Check plan vs code alignment
npx ultra-dex verify                  # Verify implementation completeness
```

### Development

```bash
npx ultra-dex build                   # Build project
npx ultra-dex validate                # Validate against standards
npx ultra-dex fix                     # Auto-fix issues
npx ultra-dex doctor                  # System diagnostics
npx ultra-dex exec "code"             # Execute in sandbox
```

### Monitoring & Control

```bash
npx ultra-dex dashboard               # Open God Mode dashboard
npx ultra-dex serve                   # Start MCP server
npx ultra-dex watch                   # Watch mode with auto-sync
npx ultra-dex status                  # Show project status
npx ultra-dex health                  # Health check
npx ultra-dex metrics                 # Show metrics
```

### Advanced

```bash
npx ultra-dex sync --brain            # Auto-sync CONTEXT.md
npx ultra-dex cloud                   # Cloud collaboration
npx ultra-dex github                  # GitHub integration
npx ultra-dex search "query"          # Semantic search
npx ultra-dex memory                  # Persistent memory
npx ultra-dex batch file.json         # Batch execution
npx ultra-dex history                 # Command history
```

---

## 🎯 Key Features

### 1. 21-Step Verification Framework

Every task follows production-ready standards:

1. Understand requirement
2. List assumptions
3. Analyze logic flow
4. Decompose into steps
5. Prepare environment
6. Implement code
7. Document code
8. Write unit tests
9. Debug issues
10. Integrate systems
11. Validate output
12. UX check
13. Optimize performance
14. Security check
15. Refactor quality
16. Error handling
17. Document API
18. Version control
19. Build validation
20. Deploy ready
21. Final verify

### 2. 34 Cursor Rules

Production-grade coding standards:

- Core principles, TypeScript, React patterns
- Authentication, database, testing
- Security, performance, accessibility
- **NEW:** i18n, analytics, SEO

[View Rules](./cli/assets/cursor-rules/)

### 3. Agent Ecosystem

**17 Specialized Agents:**

- **Leadership:** @cto, @planner, @research
- **Development:** @backend, @frontend, @database
- **Security:** @auth, @security
- **DevOps:** @devops
- **Quality:** @debugger, @reviewer, @testing, @docs
- **Specialist:** @performance
- **Meta:** @orchestrator

### 4. Template System

**3 Template Variants:**

- **LITE** (12 sections) - Quick MVPs
- **FULL** (34 sections) - Complete projects
- **ENTERPRISE** (50+ sections) - Large-scale

---

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+
- Git
- (Optional) Docker for sandbox execution

### Install

```bash
npm install -g ultra-dex
```

### First-Time Setup

```bash
npx ultra-dex setup
# Interactive wizard configures:
# - AI provider (Anthropic, OpenAI, Google, Ollama)
# - API keys
# - Default template
# - Shell completions
```

### Shell Completions

```bash
# Bash
source <(ultra-dex completions bash)
# Add to ~/.bashrc for persistence

# Zsh
source <(ultra-dex completions zsh)
# Add to ~/.zshrc for persistence
```

---

## 📚 Documentation

- **Quick Start:** `npx ultra-dex setup`
- **Help:** `npx ultra-dex --help`
- **Command Help:** `npx ultra-dex <command> --help`
- **Full Guide:** [MEGA-IMPLEMENTATION-FINAL.md](./MEGA-IMPLEMENTATION-FINAL.md)
- **Examples:** [examples/](./examples/)
- **Release Notes:** [RELEASE-v3.5.0.md](./RELEASE-v3.5.0.md)

---

## 🎓 Learning Path

### Beginner (Day 1)

```bash
npx ultra-dex init                    # Create project
npx ultra-dex generate "Todo app"     # Generate plan
npx ultra-dex align                   # Check alignment
```

### Intermediate (Week 1)

```bash
npx ultra-dex swarm "Feature X"       # Run agents
npx ultra-dex dashboard               # Monitor progress
npx ultra-dex verify                  # Verify completion
```

### Advanced (Month 1)

```bash
npx ultra-dex voice "Complex system"  # Voice input
npx ultra-dex sync --brain            # Auto-sync
npx ultra-dex cloud                   # Team collaboration
```

---

## 🤝 VS Code Integration

1. Install extension: `ultra-dex-vscode-3.5.0.vsix`
2. Click Ultra-Dex icon in sidebar
3. Access:
   - Agent Explorer (browse all agents)
   - Swarm Status (real-time progress)
   - Context Preview (tech stack, focus)
   - Quick Actions (one-click commands)

---

## 🔐 Environment Variables

```bash
# AI Providers (at least one required)
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
export GOOGLE_API_KEY=...

# Optional
export GITHUB_TOKEN=GITHUB_TOKEN_HERE           # GitHub integration
export LINEAR_API_KEY=...             # Linear sync
export SLACK_WEBHOOK_URL=...          # Notifications
```

---

## 📦 Project Structure

```
my-project/
├── IMPLEMENTATION-PLAN.md      # Auto-generated plan
├── CONTEXT.md                   # Project context (synced)
├── .ultra/
│   ├── state.json              # Project state
│   ├── memory/                 # Persistent memory
│   │   └── sessions.db         # SQLite database
│   └── config.json             # Local config
└── src/                        # Your code
```

---

## 🐛 Troubleshooting

### Common Issues

**Command not found:**

```bash
npm install -g ultra-dex
# Or use: npx ultra-dex
```

**API key errors:**

```bash
npx ultra-dex setup              # Configure keys
# Or set env var: export ANTHROPIC_API_KEY=...
```

**Port already in use:**

```bash
npx ultra-dex serve --port 3003  # Use different port
lsof -ti:3001 | xargs kill -9   # Kill process
```

**Need help:**

```bash
npx ultra-dex doctor             # Diagnostics
npx ultra-dex <command> --help   # Command help
```

---

## 🌟 Why Ultra-Dex?

### Before Ultra-Dex

- ❌ AI agents forget context between sessions
- ❌ No standard for AI-assisted development
- ❌ Manual coordination between tools
- ❌ Plans drift from implementation
- ❌ No verification framework

### With Ultra-Dex

- ✅ Persistent memory across sessions
- ✅ 21-step production-ready framework
- ✅ Coordinated agent swarms
- ✅ Real-time alignment tracking
- ✅ Automated verification

---

## 📈 Roadmap

### v3.6.0 (March 2026)

- Deep Graph RAG (FalkorDB/Neo4j)
- Enterprise Auth (SSO/SAML)
- LangGraph Integration

### v4.0.0 (Q2 2026)

- AI Agent Protocol SDK
- JetBrains/Neovim plugins
- Agent Marketplace

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md)

### Ways to Contribute

- Report bugs
- Suggest features
- Add cursor rules
- Create examples
- Improve docs

---

## 📄 License

MIT License - see [LICENSE](./LICENSE)

---

## 🙏 Acknowledgments

- 8 comprehensive code reviews incorporated
- Community feedback integrated
- Real-world testing validated

---

**Ultra-Dex v3.5.0** - _The most complete AI orchestration platform for developers._

🚀 **Ready for production. Ready for you.** 🚀

[Get Started →](#quick-start-30-seconds)
