# 📚 ULTRA-DEX V4.2.0 - COMPLETE DOCUMENTATION

## 🏗️ **TABLE OF CONTENTS**

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Core Features](#core-features)
4. [Advanced Features](#advanced-features)
5. [AI Agents](#ai-agents)
6. [Integrations](#integrations)
7. [Enterprise Features](#enterprise-features)
8. [CLI Commands](#cli-commands)
9. [API Reference](#api-reference)
10. [Troubleshooting](#troubleshooting)
11. [FAQ](#faq)

---

## **INTRODUCTION**

### **What is Ultra-Dex?**

Ultra-Dex is the **"Kubernetes of AI Development"** - we don't compete with AI coding tools, we orchestrate them.

### **The Problem: "AI Amnesia"**

Modern AI coding tools are incredibly powerful, but they all suffer from the same fundamental limitation: **context loss**. Every new session starts from scratch - your AI forgets yesterday's architectural decisions, drifts from established patterns, and lacks shared context.

### **The Solution: Active Meta-Layer**

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

## **GETTING STARTED**

### **Installation**

```bash
# Install globally via npm
npm install -g ultra-dex

# Verify installation
ultra-dex --version
```

### **Initialize a New Project**

```bash
# Create a new project directory
mkdir my-awesome-saas
cd my-awesome-saas

# Initialize with enterprise governance
ultra-dex init --enterprise

# Or initialize with minimal setup
ultra-dex init --minimal
```

### **Configure AI Providers**

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

### **Your First Feature**

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

## **CORE FEATURES**

### **Memory & Context Management**

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

### **AI Orchestration & Smart Routing**

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

### **Model Context Protocol (MCP)**

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

### **Governance & Quality Assurance**

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

---

## **ADVANCED FEATURES**

### **Voice-to-Code Functionality**

Convert spoken commands directly to code using Whisper API and GPT-4:

```bash
# Basic voice command
ultra-dex voice "Create a login component with validation"

# Use audio file instead of recording
ultra-dex voice --file recording.wav "Implement user authentication"

# Stream results in real-time
ultra-dex voice --stream "Add password reset functionality"
```

### **Vision Agent for Screenshot-to-Code**

Analyze UI screenshots and generate corresponding code:

```bash
# Analyze screenshot and generate React component
ultra-dex vision analyze login.png --framework react

# Generate Vue component
ultra-dex vision analyze dashboard.png --framework vue

# Extract design tokens
ultra-dex vision tokens design.png

# Compare two UI designs
ultra-dex vision compare old.png new.png
```

### **Computer Use Agent**

Full desktop automation capabilities:

```bash
# Open applications
ultra-dex computer "open vs code and create new file"

# File operations
ultra-dex computer "create file src/components/Header.jsx with basic component"

# System commands
ultra-dex computer "run npm install in current directory"

# Web browsing simulation
ultra-dex computer "search for react component best practices"
```

### **Autonomous Daemon Mode**

24/7 monitoring with auto-fixing and health checks:

```bash
# Start autonomous daemon
ultra-dex daemon start

# Check daemon status
ultra-dex daemon status

# Stop daemon
ultra-dex daemon stop

# Run with specific configuration
ultra-dex daemon start --config daemon.conf
```

### **Web Dashboard**

Real-time metrics and monitoring:

```bash
# Launch web dashboard
ultra-dex dashboard

# Launch on specific port
ultra-dex dashboard --port 8080

# Open dashboard in browser
ultra-dex dashboard --open
```

### **Agent Marketplace**

Install and manage AI agents from the community:

```bash
# List available agents
ultra-dex marketplace list

# Search for agents
ultra-dex marketplace search "security"

# Install an agent
ultra-dex marketplace install security-agent

# Update an agent
ultra-dex marketplace update security-agent

# Uninstall an agent
ultra-dex marketplace uninstall security-agent
```

---

## **AI AGENTS**

### **Available Agents**

Ultra-Dex comes with 18+ specialized AI agents:

#### **Orchestration Agents**
- `@architect` - System architecture planning
- `@orchestrator` - Multi-agent coordination
- `@meta-orchestrator` - Meta-level orchestration

#### **Leadership Agents**
- `@cto` - Chief Technology Officer perspective
- `@planner` - Project planning and scoping
- `@research` - Research and investigation

#### **Development Agents**
- `@backend` - Backend development
- `@frontend` - Frontend development
- `@database` - Database design and queries

#### **Security Agents**
- `@auth` - Authentication and security
- `@security` - Security analysis and hardening

#### **DevOps Agents**
- `@devops` - DevOps and infrastructure

#### **Quality Agents**
- `@debugger` - Debugging and issue resolution
- `@documentation` - Documentation generation
- `@reviewer` - Code review and quality assurance
- `@testing` - Testing strategy and implementation

#### **Specialist Agents**
- `@performance` - Performance optimization
- `@refactoring` - Code refactoring and improvement

### **Using Agents**

```bash
# Run a specific agent
ultra-dex agents run @security "analyze auth system for vulnerabilities"

# List all available agents
ultra-dex agents list

# Show agent details
ultra-dex agents show @planner

# Deploy agent swarm
ultra-dex swarm deploy --agents @planner,@backend,@frontend
```

---

## **INTEGRATIONS**

### **Version Control**
- **GitHub**: Issues, PRs, releases, actions
- **GitLab**: Merge requests, pipelines, wikis

```bash
ultra-dex sync github
ultra-dex sync github --sync-issues
ultra-dex sync github --create-pr "Feature complete"
```

### **Project Management**
- **Jira**: Create/update issues, sync sprints, track velocity
- **Linear**: Issues, projects, roadmaps
- **Notion**: Sync to databases, create pages
- **Trello**: Cards, boards, checklists

```bash
ultra-dex jira create "Fix auth bug" --priority high
ultra-dex notion sync
ultra-dex trello move <card-id> --list "Done"
```

### **Communication**
- **Slack**: Send notifications, slash commands, interactive messages
- **Discord**: Channel updates, bot commands, embeds

```bash
ultra-dex slack send "#dev" "Deploy complete"
ultra-dex discord notify "Build failed"
```

### **Cloud & Infrastructure**
- **Vercel**: Deploy previews, production builds
- **Supabase**: Database queries, realtime subscriptions
- **Stripe**: Payment tracking, webhook handling

```bash
ultra-dex vercel deploy --production
ultra-dex supabase query "SELECT * FROM users"
```

---

## **ENTERPRISE FEATURES**

### **Role-Based Access Control (RBAC)**

Enterprise-grade security with granular permissions:

```bash
# Create user
ultra-dex enterprise user create --email john@example.com --role admin

# Assign permissions
ultra-dex enterprise permission assign --user john --permission read-projects

# Create team
ultra-dex enterprise team create --name "developers" --members john,jane

# Add user to team
ultra-dex enterprise team add-user --team developers --user john
```

### **Single Sign-On (SSO)**

Enterprise SSO with SAML, OAuth2, and OIDC:

```bash
# Configure SSO
ultra-dex enterprise sso configure --provider saml --metadata-url https://company.com/saml/metadata

# Test SSO
ultra-dex enterprise sso test
```

### **Audit Logging**

Immutable audit logs for compliance:

```bash
# View audit logs
ultra-dex enterprise audit logs

# Filter audit logs
ultra-dex enterprise audit logs --user john --action login

# Export audit logs
ultra-dex enterprise audit export --format csv
```

### **Compliance Reporting**

Generate compliance reports for SOC2, ISO27001, GDPR:

```bash
# Generate SOC2 report
ultra-dex enterprise compliance soc2

# Generate ISO27001 report
ultra-dex enterprise compliance iso27001

# Generate GDPR report
ultra-dex enterprise compliance gdpr
```

---

## **CLI COMMANDS**

### **Project Initialization & State**

```bash
ultra-dex init [--enterprise|--minimal]    # Initialize project
ultra-dex state                             # View current state
ultra-dex state set <key> <value>          # Update state
ultra-dex state machine                     # View state machine diagram
```

### **Memory Management**

```bash
ultra-dex memory                            # Show memory status
ultra-dex memory --visual                   # Visual memory charts
ultra-dex memory --prune                    # Clean old context
ultra-dex memory --prune --aggressive       # Aggressive cleanup
ultra-dex memory tiers                      # View tier distribution
ultra-dex memory search "<query>"           # Semantic search
```

### **AI Development**

```bash
ultra-dex scaffold "<feature>"              # Generate feature scaffold
ultra-dex auto-implement "<task>"           # Autonomous implementation
ultra-dex agents                            # Manage agent swarm
ultra-dex agents deploy --type architect    # Deploy specific agent
ultra-dex exec "<command>"                  # Execute with AI assistance
ultra-dex diff                              # Intelligent code diff
ultra-dex diff --ai-explain                 # Explain changes with AI
```

### **Architecture & Planning**

```bash
ultra-dex architect                         # Run architecture planning
ultra-dex scaffold-plan "<feature>"         # Generate implementation plan
ultra-dex estimate "<task>"                 # Estimate complexity
ultra-dex estimate --breakdown              # Detailed breakdown
ultra-dex impact                            # Analyze change impact
ultra-dex impact --graph                    # Visual impact graph
```

### **Quality & Verification**

```bash
ultra-dex check                             # Run quality checks
ultra-dex check --fix                       # Auto-fix issues
ultra-dex verify                            # Protocol 21 verification
ultra-dex verify --phase <name>             # Run specific phase
ultra-dex verify --strict                   # Strict mode
ultra-dex audit                             # Security audit
ultra-dex audit --report                    # Generate audit report
```

### **Testing**

```bash
ultra-dex test                              # Run tests
ultra-dex test --watch                      # Watch mode
ultra-dex test --coverage                   # With coverage
ultra-dex test --ai-analyze                 # AI test analysis
```

### **Git Integration**

```bash
ultra-dex commit                            # AI-generated commit
ultra-dex commit --convention <type>        # Conventional commits
ultra-dex pr create "<title>"               # Create pull request
ultra-dex pr review                         # AI code review
```

### **Integrations**

```bash
ultra-dex sync github                       # Sync with GitHub
ultra-dex jira                              # Jira operations
ultra-dex notion                            # Notion sync
ultra-dex slack send "<channel>" "<msg>"    # Slack message
ultra-dex discord notify "<message>"        # Discord notification
ultra-dex vercel deploy                     # Vercel deployment
ultra-dex supabase                          # Supabase operations
```

### **MCP & Context Sharing**

```bash
ultra-dex mcp start                         # Start MCP server
ultra-dex mcp start --port <port>           # Custom port
ultra-dex mcp status                        # Server status
ultra-dex mcp export --claude-desktop       # Export config
ultra-dex export mcp                        # Export to MCP format
ultra-dex export langgraph                  # Export to LangGraph
```

### **Gamification**

```bash
ultra-dex challenge start "<name>"          # Start challenge
ultra-dex challenge list                    # Active challenges
ultra-dex challenge complete <id>           # Complete challenge
ultra-dex stats                             # Your statistics
ultra-dex leaderboard                       # View rankings
ultra-dex achievements                      # Your achievements
ultra-dex rank                              # Check your rank
```

### **Configuration**

```bash
ultra-dex config list                       # List all config
ultra-dex config set <key> <value>          # Set config value
ultra-dex config get <key>                  # Get config value
ultra-dex config reset                      # Reset to defaults
```

### **Advanced**

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

## **API REFERENCE**

### **JavaScript API**

```javascript
import { UltraDex } from 'ultra-dex';

const ultra = new UltraDex({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4'
});

// Run a command programmatically
const result = await ultra.runCommand('scaffold', {
  feature: 'user authentication',
  template: 'nextjs'
});

// Access memory system
const memory = ultra.getMemory();
const context = await memory.search('authentication');

// Use agents programmatically
const agent = ultra.getAgent('planner');
const plan = await agent.execute('create user management system');
```

### **MCP Resources**

```javascript
// Access MCP resources programmatically
const context = await ultra.mcp.getResource('ultradex://context');
const plan = await ultra.mcp.getResource('ultradex://plan');
const state = await ultra.mcp.getResource('ultradex://state');
```

---

## **TROUBLESHOOTING**

### **Common Issues**

#### **Installation Issues**
- **Problem**: Permission errors during installation
- **Solution**: Use `sudo npm install -g ultra-dex` on Unix systems

#### **API Key Issues**
- **Problem**: "Invalid API key" errors
- **Solution**: Verify API keys with `ultra-dex auth setup`

#### **MCP Connection Issues**
- **Problem**: MCP server not connecting
- **Solution**: Check firewall settings and ensure port 3002 is available

#### **Memory Issues**
- **Problem**: Slow performance with large projects
- **Solution**: Run `ultra-dex memory --prune` to clean old context

### **Diagnostic Commands**

```bash
# Run diagnostics
ultra-dex doctor

# Check system health
ultra-dex health

# View detailed logs
ultra-dex logs --verbose

# Debug configuration
ultra-dex config --debug
```

---

## **FAQ**

### **General Questions**

**Q: What makes Ultra-Dex different from other AI coding tools?**
A: Ultra-Dex is an orchestration layer that sits above your AI tools, providing persistent memory, architectural governance, and multi-tool coordination. It solves the "AI Amnesia" problem where tools forget context between sessions.

**Q: Is Ultra-Dex free to use?**
A: Yes, Ultra-Dex is completely free and open source under the MIT license. Enterprise features are also free.

**Q: How does the memory system work?**
A: Ultra-Dex uses a three-tier memory architecture (Hot/Warm/Cold) with automatic transitions, semantic search, and AI-powered compression to efficiently manage context.

**Q: Does Ultra-Dex store my code?**
A: No, Ultra-Dex runs locally on your machine and does not store your code on external servers. All processing happens on your device.

### **Technical Questions**

**Q: What AI providers are supported?**
A: OpenAI, Anthropic, Google, and Ollama (local models) are currently supported with more being added regularly.

**Q: How does MCP integration work?**
A: Ultra-Dex runs a local MCP server that exposes your project context to Claude Desktop and other MCP-compatible tools via WebSocket connections.

**Q: Can I use Ultra-Dex with my existing development tools?**
A: Yes, Ultra-Dex integrates with VS Code, JetBrains IDEs, Neovim, Claude Desktop, and many other tools without disrupting your existing workflow.

### **Enterprise Questions**

**Q: Is Ultra-Dex suitable for enterprise use?**
A: Absolutely. Ultra-Dex includes enterprise features like RBAC, SSO, audit logs, compliance reporting, and on-premise deployment options.

**Q: How does the security model work?**
A: Ultra-Dex implements capability contracts, RBAC, encrypted storage, and immutable audit logs to ensure enterprise-grade security.

**Q: Can I deploy Ultra-Dex on-premise?**
A: Yes, Ultra-Dex supports on-premise deployment with all enterprise features available in self-hosted configurations.

---

## **SUPPORT**

### **Getting Help**

- **Documentation**: https://docs.ultra-dex.ai
- **GitHub Issues**: https://github.com/Srujan0798/Ultra-Dex/issues
- **Discord Community**: https://discord.gg/ultra-dex
- **Email Support**: support@ultra-dex.ai

### **Contributing**

Ultra-Dex is open source and welcomes contributions:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

See CONTRIBUTING.md for detailed guidelines.

### **Reporting Issues**

When reporting issues, please include:
- Ultra-Dex version (`ultra-dex --version`)
- Node.js version (`node --version`)
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Any relevant error messages

---

## **LICENSE**

MIT License - see LICENSE file for details.

Ultra-Dex is free and open source software. You can use it for personal or commercial projects.

---

**Document Version:** 1.0
**Last Updated:** February 8, 2026
**Ultra-Dex Version:** 4.2.0 "The Endgame"

---

*Made with ❤️ for developers who ship*