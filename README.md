# 🎮 Ultra-Dex v4.0.0 "The Endgame"

> **The Gamified AI Kernel & Meta-Layer for Autonomous Coding**
>
> _The Kubernetes of AI Development - Orchestrate, Don't Compete_

[![npm version](https://img.shields.io/npm/v/ultra-dex.svg)](https://www.npmjs.com/package/ultra-dex)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green.svg)](https://nodejs.org/)
[![Protocol](https://img.shields.io/badge/Protocol-21-red.svg)](./docs/completed/legacy_docs/07-Rule-Book-21.md)

Ultra-Dex is an **AI orchestration meta-layer** that sits above your development tools (Cursor, Claude, VS Code, Windsurf, etc.) to provide **persistent memory**, **architectural governance**, and **autonomous coding capabilities**. Think of it as the conductor for your AI development orchestra.

---

## 🚀 What is Ultra-Dex?

Ultra-Dex is the **"Kubernetes for AI Coding"** - we don't compete with AI coding tools, we **orchestrate** them.

### 🧠 The Problem: "AI Amnesia"

Modern AI coding tools are incredibly powerful, but they all suffer from the same fundamental limitation:

- **Context Loss**: Every new session starts from scratch - your AI forgets yesterday's architectural decisions
- **Drift**: Without memory, AI assistants deviate from established patterns and best practices
- **Inconsistency**: Different tools give different answers because they lack shared context
- **No Governance**: There are no guardrails - AI can suggest changes that break your architecture
- **Token Waste**: You repeatedly explain the same context, burning through API costs

### ✨ The Solution: Active Meta-Layer

Ultra-Dex sits **above** your AI tools and provides what they're missing:

1. **Persistent Memory System**
   - `CONTEXT.md` brain that captures and retains your project's DNA
   - Hot-warm-cold tiered memory architecture for efficient context management
   - Semantic vector search across your entire codebase history
   - Automatic context pruning to keep memory relevant

2. **Architectural Governance**
   - **Protocol 21**: Every feature goes through a rigorous 21-step verification gate
   - **Capability Contracts**: Declarative permissions that define what tools can and cannot do
   - **Governance Agent**: ADR-aware validation that enforces architectural decisions
   - **Glass Box Ledger**: Immutable audit log of every AI decision for compliance

3. **Multi-Provider AI Orchestration**
   - Smart routing across OpenAI, Anthropic, Google, and local models (Ollama)
   - Task-based model selection - use cheap models for simple tasks, powerful ones for complex work
   - Token budgeting and cost optimization
   - Unified API across all providers

4. **Model Context Protocol (MCP) Integration**
   - Share context in real-time with Claude Desktop, VS Code, and any MCP-compatible tool
   - WebSocket-based context bus for instant synchronization
   - Expose project resources as `ultradex://` URIs
   - Execute Ultra-Dex commands from any MCP client

5. **Gamification Engine**
   - Turn shipping code into achievements, XP, and leaderboard rankings
   - Time-boxed challenges that create focus and urgency
   - Track velocity, quality, and consistency metrics
   - Compete with teammates or yourself

---

## ✨ Core Features

### 🧠 Memory & Context Management

Ultra-Dex implements a sophisticated **three-tier memory architecture**:

#### Hot Tier (Active Working Memory)
- **Size**: 100 items (configurable)
- **Purpose**: Currently relevant context for active development
- **Contains**: Current feature plans, recent code changes, active discussions
- **Access Time**: < 10ms
- **Use Case**: What you're working on RIGHT NOW

#### Warm Tier (Recent Context)
- **Size**: 500 items (configurable)
- **Purpose**: Recently accessed but not immediately active
- **Contains**: This week's changes, recent architectural decisions, resolved issues
- **Access Time**: < 50ms
- **Use Case**: Context from the last few days that might be relevant

#### Cold Tier (Historical Archive)
- **Size**: 2000+ items (configurable)
- **Purpose**: Long-term project memory and historical decisions
- **Contains**: Compressed summaries, architectural history, resolved design debates
- **Access Time**: < 200ms
- **Use Case**: "How did we solve this problem 6 months ago?"

**Key Features:**
- **Automatic Transitions**: Context moves between tiers based on access patterns
- **Smart Pruning**: `ultra-dex memory --prune` intelligently removes outdated information
- **Visual Status**: `ultra-dex memory --visual` shows memory usage with charts
- **Vector Embeddings**: Semantic search finds relevant context even if keywords don't match
- **Compression**: Cold tier uses AI-powered summarization to save space

```bash
# View memory status
ultra-dex memory

# Visualize memory tiers
ultra-dex memory --visual

# Prune stale context
ultra-dex memory --prune

# Force aggressive cleanup
ultra-dex memory --prune --aggressive
```

### 🤖 AI Orchestration & Smart Routing

Ultra-Dex provides a **unified interface** to multiple AI providers with **intelligent routing**:

#### Supported Providers
- **OpenAI**: GPT-4, GPT-4-Turbo, GPT-3.5-Turbo
- **Anthropic**: Claude Opus, Claude Sonnet, Claude Haiku
- **Google**: Gemini Pro, Gemini Flash (with multimodal support)
- **Ollama**: Llama 2, Mistral, CodeLlama, and any local model

#### Smart Routing Algorithm
Ultra-Dex automatically selects the optimal model based on:

1. **Task Complexity Classification**
   - **Simple** (keywords: typo, rename, format): Use cheap, fast models (GPT-3.5, Claude Haiku)
   - **Medium** (keywords: refactor, update, enhance): Use balanced models (GPT-4, Claude Sonnet)
   - **Complex** (keywords: architect, design, security): Use powerful models (GPT-4, Claude Opus)

2. **Cost Optimization**
   - Configure cost bias: `--prefer-cost`, `--prefer-quality`, `--prefer-speed`
   - Track spending per feature with token budgets
   - Automatic fallback to cheaper models when over budget

3. **Context Window Requirements**
   - Large codebases automatically use long-context models
   - Split large tasks across multiple requests when needed

```bash
# Configure default provider
ultra-dex config set provider openai
ultra-dex config set model gpt-4

# Override for specific commands
ultra-dex scaffold "Complex auth system" --provider anthropic --model claude-opus-4

# Configure routing preferences
ultra-dex route config --prefer-cost      # Optimize for cost
ultra-dex route config --prefer-quality   # Optimize for quality
ultra-dex route config --prefer-speed     # Optimize for speed

# View routing decisions
ultra-dex route analyze

# Check token usage and forecast costs
ultra-dex budget
ultra-dex budget --forecast "Next sprint"
```

### 🔌 Model Context Protocol (MCP)

Ultra-Dex is a **first-class MCP server**, meaning any MCP-compatible tool can access your project's context.

#### What is MCP?
Model Context Protocol is an open standard (created by Anthropic) that lets AI tools share context. Think of it as "GraphQL for AI context."

#### Ultra-Dex MCP Resources
When you start the MCP server, these resources become available:

- **`ultradex://context`** - Your CONTEXT.md file (project brain)
- **`ultradex://plan`** - IMPLEMENTATION-PLAN.md (living architecture)
- **`ultradex://state`** - Current project state (JSON)
- **`ultradex://graph`** - Knowledge graph (code relationships)

#### Context Bus (Real-Time Sync)
The Context Bus is a **WebSocket server** that synchronizes context across tools in real-time:

- Changes in VS Code instantly appear in Claude Desktop
- Updates from Cursor sync back to your CONTEXT.md
- Multiple developers can share context in real-time
- Automatic conflict resolution

```bash
# Start MCP server (default port 3002)
ultra-dex mcp start

# Start on custom port
ultra-dex mcp start --port 8080

# Check MCP server status
ultra-dex mcp status

# Enable in Claude Desktop (add to config)
ultra-dex mcp export --claude-desktop

# Test MCP connection
ultra-dex mcp test
```

**Claude Desktop Configuration:**
```json
{
  "mcpServers": {
    "ultra-dex": {
      "command": "ultra-dex",
      "args": ["mcp", "start"],
      "env": {}
    }
  }
}
```

### 🛡️ Governance & Quality Assurance

Ultra-Dex enforces **architectural governance** through multiple systems:

#### Protocol 21: 21-Step Verification Pipeline

Every feature goes through a rigorous verification process:

**Phase 1: Requirements (Steps 1-5)**
1. Requirement clarity check
2. Acceptance criteria validation
3. Scope boundary definition
4. Dependency analysis
5. Risk assessment

**Phase 2: Design (Steps 6-10)**
6. Architecture alignment
7. Design pattern validation
8. API contract review
9. Security review
10. Performance impact analysis

**Phase 3: Implementation (Steps 11-15)**
11. Code quality check
12. Test coverage validation
13. Documentation completeness
14. Error handling review
15. Edge case coverage

**Phase 4: Integration (Steps 16-20)**
16. Integration testing
17. Regression prevention
18. Database migration safety
19. Deployment readiness
20. Rollback plan

**Phase 5: Delivery (Step 21)**
21. Final sign-off and deployment

```bash
# Run Protocol 21 verification
ultra-dex verify

# Run specific phases
ultra-dex verify --phase requirements
ultra-dex verify --phase design

# Strict mode (fail on warnings)
ultra-dex verify --strict

# Generate verification report
ultra-dex verify --report
```

#### Capability Contracts (RFC-001)

Define what each tool/plugin can and cannot do:

```yaml
# .ultra/contracts/github-plugin.yml
name: github-integration
version: 1.0.0
permissions:
  - read:repo
  - write:issues
  - read:pull_requests
rate_limits:
  max_requests_per_hour: 1000
  max_concurrent: 5
risk_score: medium
requires_approval: false
```

#### Governance Agent (RFC-002)

An AI agent that enforces architectural decisions:

- Reads your ADRs (Architecture Decision Records)
- Validates changes against established patterns
- Suggests alternatives when rules are violated
- Auto-approves low-risk changes, flags high-risk ones

```bash
# Run governance check
ultra-dex governance check

# Apply governance rules
ultra-dex governance apply

# View governance violations
ultra-dex governance violations
```

#### Glass Box Ledger

Every AI decision is logged for **complete transparency**:

```bash
# View audit log
ultra-dex ledger

# Export for compliance
ultra-dex ledger export --format csv

# Query specific events
ultra-dex ledger query --event "scaffold" --date "2026-02"
```

### 🎮 Gamification System

Turn coding into a game with **challenges, XP, and achievements**:

#### Challenges
Time-boxed coding sprints that create focus:

```bash
# Start a challenge
ultra-dex challenge start "Auth in 30m"

# List active challenges
ultra-dex challenge list

# Complete a challenge
ultra-dex challenge complete <id>

# View challenge history
ultra-dex challenge history
```

**Challenge Types:**
- **Speed Run**: Complete a feature in X minutes
- **Quality Quest**: Achieve 100% test coverage
- **Bug Bash**: Fix 10 bugs in one session
- **Refactor Rally**: Improve code quality scores

#### XP System
Earn experience points for:
- **Commits**: 10 XP per commit
- **Tests Written**: 5 XP per test
- **Deploys**: 50 XP per successful deploy
- **Reviews**: 15 XP per code review
- **Documentation**: 20 XP per doc page

#### Achievements
Unlock badges for milestones:
- 🏆 **First Blood**: First commit
- 🔥 **Hot Streak**: 7 days of commits
- 🧪 **Test Master**: 1000+ tests written
- 🚀 **Shipper**: 100+ deploys
- 📚 **Documentarian**: 50+ doc pages

```bash
# View your stats
ultra-dex stats

# Check leaderboard
ultra-dex leaderboard

# View achievements
ultra-dex achievements

# Check your rank
ultra-dex rank
```

### 🌐 Integrations

Ultra-Dex integrates with your entire development toolchain:

#### Version Control
- **GitHub**: Issues, PRs, releases, actions
- **GitLab**: Merge requests, pipelines, wikis

```bash
ultra-dex sync github
ultra-dex sync github --sync-issues
ultra-dex sync github --create-pr "Feature complete"
```

#### Project Management
- **Jira**: Create/update issues, sync sprints, track velocity
- **Linear**: Issues, projects, roadmaps
- **Notion**: Sync to databases, create pages
- **Trello**: Cards, boards, checklists

```bash
ultra-dex jira create "Fix auth bug" --priority high
ultra-dex notion sync
ultra-dex trello move <card-id> --list "Done"
```

#### Communication
- **Slack**: Send notifications, slash commands, interactive messages
- **Discord**: Channel updates, bot commands, embeds

```bash
ultra-dex slack send "#dev" "Deploy complete"
ultra-dex discord notify "Build failed"
```

#### Cloud & Infrastructure
- **Vercel**: Deploy previews, production builds
- **Supabase**: Database queries, realtime subscriptions
- **Stripe**: Payment tracking, webhook handling

```bash
ultra-dex vercel deploy --production
ultra-dex supabase query "SELECT * FROM users"
```

#### Analytics
- **Segment**: Track events, identify users

```bash
ultra-dex segment track "Feature Used" --user <id>
```

---

## 🏁 Quick Start

### Installation

```bash
# Install globally via npm
npm install -g ultra-dex

# Verify installation
ultra-dex --version
```

### Initialize a New Project

```bash
# Create a new project directory
mkdir my-awesome-saas
cd my-awesome-saas

# Initialize with enterprise governance
ultra-dex init --enterprise

# Or initialize with minimal setup
ultra-dex init --minimal
```

**What gets created:**
- `CONTEXT.md` - Your project's persistent memory and brain
- `IMPLEMENTATION-PLAN.md` - Living architecture document
- `.ultra/` - State directory (config, logs, cache)
  - `.ultra/state.json` - Current project state
  - `.ultra/memory.db` - SQLite memory store
  - `.ultra/graph.db` - Knowledge graph
- `.ultra-dex.config.json` - Project configuration
- `.gitignore` - Ignore Ultra-Dex internals

### Configure AI Providers

```bash
# Interactive setup wizard
ultra-dex auth setup

# Or configure manually
ultra-dex auth add-key openai <your-key>
ultra-dex auth add-key anthropic <your-key>
ultra-dex auth add-key google <your-key>

# Set default provider
ultra-dex config set provider openai
ultra-dex config set model gpt-4

# Verify configuration
ultra-dex config list
```

### Your First Feature

```bash
# 1. Generate feature scaffolding
ultra-dex scaffold "User authentication with JWT tokens"

# 2. Review the generated plan
cat IMPLEMENTATION-PLAN.md

# 3. Run autonomous implementation
ultra-dex auto-implement --feature "JWT authentication"

# 4. Check code quality
ultra-dex check

# 5. Run Protocol 21 verification
ultra-dex verify

# 6. Commit with AI-generated message
ultra-dex commit

# 7. Deploy
ultra-dex vercel deploy
```

---

## 📖 Complete Command Reference

### Project Initialization & State

```bash
ultra-dex init [--enterprise|--minimal]    # Initialize project
ultra-dex state                             # View current state
ultra-dex state set <key> <value>          # Update state
ultra-dex state machine                     # View state machine diagram
```

### Memory Management

```bash
ultra-dex memory                            # Show memory status
ultra-dex memory --visual                   # Visual memory charts
ultra-dex memory --prune                    # Clean old context
ultra-dex memory --prune --aggressive       # Aggressive cleanup
ultra-dex memory tiers                      # View tier distribution
ultra-dex memory search "<query>"           # Semantic search
```

### AI Development

```bash
ultra-dex scaffold "<feature>"              # Generate feature scaffold
ultra-dex auto-implement "<task>"           # Autonomous implementation
ultra-dex agents                            # Manage agent swarm
ultra-dex agents deploy --type architect    # Deploy specific agent
ultra-dex exec "<command>"                  # Execute with AI assistance
ultra-dex diff                              # Intelligent code diff
ultra-dex diff --ai-explain                 # Explain changes with AI
```

### Architecture & Planning

```bash
ultra-dex architect                         # Run architecture planning
ultra-dex scaffold-plan "<feature>"         # Generate implementation plan
ultra-dex estimate "<task>"                 # Estimate complexity
ultra-dex estimate --breakdown              # Detailed breakdown
ultra-dex impact                            # Analyze change impact
ultra-dex impact --graph                    # Visual impact graph
```

### Quality & Verification

```bash
ultra-dex check                             # Run quality checks
ultra-dex check --fix                       # Auto-fix issues
ultra-dex verify                            # Protocol 21 verification
ultra-dex verify --phase <name>             # Run specific phase
ultra-dex verify --strict                   # Strict mode
ultra-dex audit                             # Security audit
ultra-dex audit --report                    # Generate audit report
```

### Testing

```bash
ultra-dex test                              # Run tests
ultra-dex test --watch                      # Watch mode
ultra-dex test --coverage                   # With coverage
ultra-dex test --ai-analyze                 # AI test analysis
```

### Git Integration

```bash
ultra-dex commit                            # AI-generated commit
ultra-dex commit --convention <type>        # Conventional commits
ultra-dex pr create "<title>"               # Create pull request
ultra-dex pr review                         # AI code review
```

### Integrations

```bash
ultra-dex sync github                       # Sync with GitHub
ultra-dex jira                              # Jira operations
ultra-dex notion                            # Notion sync
ultra-dex slack send "<channel>" "<msg>"    # Slack message
ultra-dex discord notify "<message>"        # Discord notification
ultra-dex vercel deploy                     # Vercel deployment
ultra-dex supabase                          # Supabase operations
```

### MCP & Context Sharing

```bash
ultra-dex mcp start                         # Start MCP server
ultra-dex mcp start --port <port>           # Custom port
ultra-dex mcp status                        # Server status
ultra-dex mcp export --claude-desktop       # Export config
ultra-dex export mcp                        # Export to MCP format
ultra-dex export langgraph                  # Export to LangGraph
```

### Gamification

```bash
ultra-dex challenge start "<name>"          # Start challenge
ultra-dex challenge list                    # Active challenges
ultra-dex challenge complete <id>           # Complete challenge
ultra-dex stats                             # Your statistics
ultra-dex leaderboard                       # View rankings
ultra-dex achievements                      # Your achievements
ultra-dex rank                              # Check your rank
```

### Configuration

```bash
ultra-dex config list                       # List all config
ultra-dex config set <key> <value>          # Set config value
ultra-dex config get <key>                  # Get config value
ultra-dex config reset                      # Reset to defaults
```

### Advanced

```bash
ultra-dex swarm deploy --agents <list>      # Deploy agent swarm
ultra-dex browse --task "<task>"            # Browser automation
ultra-dex sandbox run --lang <lang>         # Sandboxed execution
ultra-dex route config --prefer-<type>      # Configure routing
ultra-dex team init                         # Initialize team workspace
ultra-dex team sync push                    # Share context
ultra-dex team sync pull                    # Pull team context
ultra-dex governance check                  # Governance validation
ultra-dex ledger                            # View audit log
ultra-dex budget                            # Token budget tracking
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
    "autoPrune": true,
    "pruneThreshold": 0.3,
    "compressionEnabled": true
  },

  "governance": {
    "enableProtocol21": true,
    "strictMode": false,
    "requireApproval": ["high-risk"],
    "autoVerify": false,
    "capabilityContracts": true,
    "governanceAgent": true
  },

  "mcp": {
    "enabled": true,
    "port": 3002,
    "autoStart": true,
    "contextBus": true,
    "contextBusPort": 3003
  },

  "gamification": {
    "enabled": true,
    "trackXP": true,
    "challenges": true,
    "leaderboard": true
  },

  "routing": {
    "strategy": "balanced",
    "costBias": 0.5,
    "qualityBias": 0.5,
    "speedBias": 0.0
  },

  "integrations": {
    "github": { "enabled": true, "autoSync": true },
    "jira": { "enabled": false },
    "notion": { "enabled": false },
    "slack": { "enabled": false },
    "discord": { "enabled": false }
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
export JIRA_EMAIL="..."
export JIRA_URL="https://your-company.atlassian.net"
export NOTION_API_KEY="..."
export SLACK_BOT_TOKEN="xoxb-..."
export DISCORD_BOT_TOKEN="..."
export STRIPE_SECRET_KEY="sk_..."
export VERCEL_TOKEN="..."
export SUPABASE_URL="..."
export SUPABASE_KEY="..."

# Ultra-Dex Settings
export ULTRA_DEX_LOG_LEVEL="info"
export ULTRA_DEX_TELEMETRY="true"
export ULTRA_DEX_AUTO_UPDATE="true"
```

---

## 🏗️ Architecture

Ultra-Dex is built as a **modular, extensible system** with these core subsystems:

### Core Systems
- **CLI Router** - Command parsing, validation, and execution
- **State Machine** - Project lifecycle and transition management
- **Config Manager** - Configuration loading, validation, and persistence
- **Plugin System** - Dynamic plugin loading and lifecycle management
- **Event Bus** - Internal pub/sub for system-wide events

### AI & Memory Layer
- **Provider Abstraction** - Unified interface for OpenAI, Anthropic, Google, Ollama
- **Model Router** - Task classification and optimal model selection
- **Memory Tiers** - Hot-warm-cold tiered storage architecture
- **Vector Store** - SQLite-based semantic search with embeddings
- **Knowledge Graph** - FalkorDB/Neo4j for code relationship mapping
- **Token Budget** - Cost tracking and optimization

### Protocol Layer
- **MCP Server** - Model Context Protocol implementation (HTTP/WebSocket)
- **Context Bus** - Real-time context synchronization via WebSocket
- **ACP Host** - GitHub's Agent Client Protocol support
- **Resource Providers** - Context, plan, state, graph resources

### Quality & Governance Layer
- **Protocol 21 Engine** - 21-step verification pipeline
- **Capability Contracts** - Tool permission and rate limit system
- **Governance Agent** - ADR-aware validation and enforcement
- **Glass Box Ledger** - Immutable audit logging for compliance
- **Security Scanner** - OWASP Top 10 vulnerability detection

### Execution Layer
- **Agent Swarm** - Multi-agent orchestration with LangGraph
- **Sandbox Manager** - Docker-based isolated execution
- **Browser Automation** - Playwright/Puppeteer integration
- **Team Sync** - Real-time context sharing across developers

### Integration Layer
- **GitHub** - Issues, PRs, releases, actions
- **Jira** - Issue tracking and sprint management
- **Notion** - Database sync and page creation
- **Slack/Discord** - Notifications and bot commands
- **Cloud Providers** - Vercel, Supabase, Stripe

---

## 📚 Documentation

### Getting Started
- **[Installation Guide](docs/INSTALLATION.md)** - Detailed setup instructions
- **[Quick Start Tutorial](docs/QUICK-START.md)** - Build your first feature
- **[Configuration Guide](docs/CONFIGURATION.md)** - All configuration options

### Core Concepts
- **[Memory System](docs/MEMORY-SYSTEM.md)** - Hot-warm-cold tiers explained
- **[Smart Routing](docs/SMART-ROUTING.md)** - Model selection algorithm
- **[Protocol 21](docs/completed/legacy_docs/07-Rule-Book-21.md)** - 21-step verification
- **[State Machine](docs/STATE-MACHINE.md)** - Project lifecycle

### Integration Guides
- **[MCP Integration Guide](docs/mcp/MCP-INTEGRATION-GUIDE.md)** - Connect with Claude Desktop
- **[GitHub Integration](docs/integrations/GITHUB.md)** - Issues, PRs, automation
- **[Jira Integration](docs/integrations/JIRA.md)** - Issue tracking and sprints
- **[Notion Integration](docs/integrations/NOTION.md)** - Database sync

### Advanced Topics
- **[Agent Swarm](docs/AGENT-SWARM.md)** - Multi-agent orchestration
- **[Browser Automation](docs/BROWSER-AUTOMATION.md)** - Web scraping and testing
- **[Sandbox Execution](docs/SANDBOX.md)** - Isolated code execution
- **[Plugin Development](docs/PLUGIN-DEVELOPMENT.md)** - Build custom extensions

### RFCs & Architecture
- **[RFC-001: Capability Contracts](docs/rfc/001-capability-contracts.md)** - Tool permissions
- **[RFC-002: Governance Agent](docs/rfc/002-governance-agent.md)** - ADR enforcement
- **[Architecture Guide](docs/ARCHITECTURE.md)** - System design deep-dive

### API Reference
- **[CLI Commands](docs/CLI-REFERENCE.md)** - Complete command reference
- **[JavaScript API](docs/API.md)** - Programmatic usage
- **[MCP Resources](docs/MCP-RESOURCES.md)** - MCP URIs and schemas

---

## 🤝 Contributing

Ultra-Dex is **open source** and we welcome contributions!

### Development Setup

```bash
# Clone the repository
git clone https://github.com/Srujan0798/Ultra-Dex.git
cd Ultra-Dex

# Install dependencies
npm install

# Link for local development
npm link

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Development Guidelines

1. **Code Style**
   - Follow existing patterns
   - Use ESLint and Prettier
   - Write clear, self-documenting code

2. **Testing**
   - Write tests for all new features
   - Maintain test coverage above 70%
   - Test edge cases and error conditions

3. **Documentation**
   - Update README for user-facing changes
   - Add JSDoc comments for APIs
   - Update relevant guides in `/docs`

4. **Protocol 21**
   - Respect the 21-step verification for major changes
   - Get sign-off on architectural decisions
   - Document design decisions in ADRs

5. **Commit Messages**
   - Use conventional commits: `feat:`, `fix:`, `docs:`, etc.
   - Be descriptive and clear
   - Reference issues and PRs

### Areas for Contribution

- 🐛 **Bug Fixes** - Check GitHub issues
- ✨ **New Features** - See the roadmap
- 📚 **Documentation** - Improve guides and tutorials
- 🧪 **Tests** - Increase coverage
- 🎨 **UI/UX** - Dashboard and CLI improvements
- 🔌 **Integrations** - Add new tool integrations
- 🌍 **Translations** - Localize for other languages

---

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

Ultra-Dex is **free and open source software**. You can use it for personal or commercial projects.

---

## 🌟 Why Ultra-Dex?

### For Solo Developers
- **Never lose context** - Your AI remembers everything between sessions
- **Automate repetitive tasks** - Scaffold, implement, test, commit, deploy
- **Learn from AI** - Get architectural insights and best practice suggestions
- **Track your progress** - XP, achievements, and velocity metrics
- **Save money** - Smart routing uses cheaper models when appropriate

### For Teams
- **Shared context** - Everyone has the same architectural understanding
- **Consistent decisions** - Governance enforces team standards
- **Quality gates** - Protocol 21 catches issues before code review
- **Real-time sync** - MCP keeps tools in sync across the team
- **Visibility** - Glass box ledger shows all AI decisions

### For Enterprises
- **Security-hardened** - RBAC, audit logs, encrypted storage
- **Cost optimization** - Token budgeting and smart routing
- **Compliance-ready** - Immutable audit trail for SOC 2, ISO 27001
- **Governance** - Capability contracts and ADR enforcement
- **Plugin architecture** - Extend with custom integrations
- **Team collaboration** - Multi-developer context sharing
- **Self-hosted** - Run on your own infrastructure

---

## 🚀 The "Endgame" Vision

Ultra-Dex v4.0.0 represents the **culmination** of autonomous AI development - where AI doesn't just write code, but **understands** your project, **respects** your architecture, and **collaborates** with your team.

### What "The Endgame" Means

- **Memory Solved**: Never explain the same context twice
- **Governance Solved**: AI that respects architectural boundaries
- **Cost Solved**: Smart routing that optimizes for your budget
- **Collaboration Solved**: Real-time context sharing via MCP
- **Quality Solved**: Protocol 21 catches issues before they ship

This isn't just another AI coding tool. This is the **orchestration layer** that makes all your AI tools work together as a cohesive system.

---

## 🙏 Acknowledgments

Built with incredible open source tools:

- **[@anthropic-ai/sdk](https://www.npmjs.com/package/@anthropic-ai/sdk)** - Claude AI integration
- **[@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)** - MCP protocol
- **[LangChain](https://js.langchain.com/)** - Agent orchestration framework
- **[LangGraph](https://github.com/langchain-ai/langgraphjs)** - Agent state management
- **[Commander.js](https://github.com/tj/commander.js)** - CLI framework
- **[Inquirer.js](https://github.com/SBoudrias/Inquirer.js)** - Interactive prompts
- **[Chalk](https://github.com/chalk/chalk)** - Terminal colors
- **[Ora](https://github.com/sindresorhus/ora)** - Terminal spinners

**Author:** Srujan Sai Karna
**Version:** 4.0.0 "The Endgame"
**Repository:** [github.com/Srujan0798/Ultra-Dex](https://github.com/Srujan0798/Ultra-Dex)
**License:** MIT

---

**🎮 Made with ❤️ for developers who ship**

_The game has changed. Welcome to the endgame._
