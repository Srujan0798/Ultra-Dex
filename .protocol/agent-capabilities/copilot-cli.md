# GitHub Copilot CLI — Elite AI Assistant Protocol (Maya Lane)

## Executive Overview
**Primary Models**: Claude Sonnet 4.5 (default), Claude Sonnet 4, GPT-5  
**Core Strengths**: Terminal-native development, GitHub integration, agentic capabilities, MCP extensibility  
**Role**: Secondary governance lane for PR/review/fleet orchestration and overflow execution  

## Local CLI Evidence
```bash
Version: GitHub Copilot CLI 1.0.14
Binary: copilot
Installation: brew install copilot-cli | npm install -g @github/copilot
Authentication: GitHub account + Copilot subscription required
```

## Lane Priority + Task Assignment Policy
- **Lane Status**: Secondary (overflow/governance)  
- **Default Windows**: 0-2 concurrent tasks
- **Primary Use Cases**: Code review, PR management, fleet coordination, complex reasoning
- **Escalation Target**: Use when primary lanes are saturated or governance oversight needed

---

## 🚀 CORE POWER CAPABILITIES

### 1. MODEL & REASONING SYSTEM
```bash
# Model Selection & Power Levels
--model <model>              # Select AI model
  • Claude Sonnet 4.5         # DEFAULT - Premier reasoning & code generation  
  • Claude Sonnet 4           # Advanced reasoning variant
  • GPT-5                     # Premium high-performance alternative

# Interactive model switching
/model                       # Switch models mid-conversation

# Reasoning Control  
--effort <level>             # low, medium, high, xhigh
--enable-reasoning-summaries # Enable detailed reasoning traces (OpenAI models)
```

### 2. AUTONOMOUS EXECUTION MODES
```bash
# Autopilot Mode (Experimental)
--experimental               # Enable experimental features
shift+tab                   # Cycle modes: interactive → plan → autopilot
--autopilot                 # Enable autonomous continuation
--max-autopilot-continues <n> # Limit autopilot iterations

# Non-Interactive/Scripting  
-p, --prompt <text>         # Execute prompt non-interactively
-s, --silent                # Output only agent response (scripting)
--output-format <format>    # text | json | jsonl
--no-ask-user              # Full autonomous mode without questions
```

### 3. ADVANCED PERMISSIONS & SECURITY
```bash
# Full Permissions (Use with caution)
--allow-all                 # Enable all permissions (tools, paths, URLs)
--allow-all-tools          # Auto-approve all tools (required for non-interactive)
--allow-all-paths          # Access any file path  
--allow-all-urls           # Access all URLs

# Granular Control
--allow-tool[=tools]       # Whitelist specific tools
--deny-tool[=tools]        # Blacklist specific tools  
--available-tools[=tools]  # Limit tools available to model
--excluded-tools[=tools]   # Hide tools from model

# Interactive Permission Management
/allow-all                 # Enable all permissions
/add-dir                   # Add directory to allowed list
/list-dirs                 # Display allowed directories
/reset-allowed-tools       # Reset tool permissions
```

### 4. GITHUB INTEGRATION POWERHOUSE
```bash
# GitHub MCP Integration
--enable-all-github-mcp-tools    # Enable all GitHub MCP capabilities
--add-github-mcp-tool <tool>     # Enable specific GitHub tool
--additional-mcp-config <json>   # Add custom MCP servers

# PR & Code Review  
/pr                             # PR-related operations
/review                         # Launch code review agent
/diff                          # Review current directory changes
/delegate                      # Send session to GitHub for PR creation

# Repository Management
/cwd                           # Change/show working directory  
@ <file>                       # Mention files, include in context
/init                          # Initialize Copilot instructions for repo
```

### 5. FLEET & TASK ORCHESTRATION
```bash
# Fleet Operations
/fleet                         # Enable fleet mode (parallel subagents)
/tasks                         # View and manage background tasks
/delegate                      # Delegate tasks to GitHub

# Session Management  
/resume [sessionId]            # Switch/resume sessions
/rename                        # Rename current session
/share [path]                  # Share session to markdown/gist
/compact                       # Summarize conversation history
```

### 6. DEVELOPMENT ENVIRONMENT INTEGRATION
```bash
# IDE & Language Server Integration
/ide                           # Connect to IDE workspace
/lsp                           # Manage language server configuration  
/terminal-setup                # Configure multiline input support

# Agent & Skills System
/agent                         # Browse and select available agents
/skills                        # Manage skills for enhanced capabilities
/mcp                           # Manage MCP server configuration
/plugin                        # Manage plugins and marketplaces
```

---

## 💪 ADVANCED USAGE PATTERNS

### Pattern 1: Autonomous Code Review
```bash
# Full autonomous PR review with maximum permissions
copilot --allow-all --autopilot --effort xhigh -p "Review the current PR for security issues, performance problems, and code quality. Generate comprehensive feedback and suggested improvements."
```

### Pattern 2: Fleet-Based Development
```bash  
# Launch fleet mode for parallel development tasks
copilot --experimental --enable-all-github-mcp-tools
/fleet
# Then delegate multiple tasks to different subagents simultaneously
```

### Pattern 3: Repository Intelligence Analysis
```bash
# Deep repository analysis with GitHub integration
copilot --allow-all-paths --enable-all-github-mcp-tools -p "Analyze this repository's architecture, identify technical debt, suggest refactoring priorities, and create implementation roadmap."
```

### Pattern 4: Silent Automation Pipeline
```bash
# Scripting integration for CI/CD
copilot -s --allow-all-tools --output-format json -p "Run security scan and generate JSON report" > security-report.json
```

---

## 🎯 MAYA ASSIGNMENT OPTIMIZATION

### When to Assign Copilot CLI
1. **Code Review Requirements** - Complex PR reviews, security audits
2. **GitHub Integration Needs** - Repository analysis, issue management  
3. **Fleet Coordination** - Managing multiple parallel development tasks
4. **Overflow Capacity** - When primary lanes are at capacity
5. **Governance Tasks** - Policy enforcement, compliance checking

### Power Level Recommendations
- **xhigh effort**: Complex multi-repo analysis, security reviews, architectural decisions
- **high effort**: Standard PR reviews, code refactoring, feature planning  
- **medium/low effort**: Quick fixes, documentation updates, simple queries

### Context Window Management
```bash
/context                       # Monitor token usage
/compact                      # Summarize to reduce context window
ctrl+t                        # Toggle reasoning display
```

---

## ⚡ POWER USER SHORTCUTS

### Essential Keyboard Controls
- `shift+tab` - Cycle modes (interactive → plan → autopilot)
- `ctrl+s` - Execute command while preserving input  
- `ctrl+t` - Toggle model reasoning display
- `ctrl+x → o` - Open links from timeline
- `ctrl+c ×2` - Exit CLI
- `!` - Execute local shell command (bypass Copilot)

### Critical Slash Commands  
- `/model` - Switch AI models
- `/fleet` - Enable parallel subagents
- `/allow-all` - Maximum permissions
- `/experimental` - Access cutting-edge features
- `/tasks` - Monitor background operations

---

## 🏷️ CLASSIFICATION

**Cost Structure**: SUBSCRIPTION-INCLUDED (GitHub Copilot subscription)  
**Performance Tier**: PREMIUM (Claude Sonnet 4.5/GPT-5)  
**Capabilities**: Terminal-native, GitHub-integrated, Autonomous, Fleet-enabled  
**Security Level**: CONFIGURABLE (granular permission system)  
**Use Case**: Development, Review, Governance, Orchestration
