# Ultra-Dex Project Structure Documentation

## Overview
This document describes the final project structure after optimization, providing a comprehensive map of the Ultra-Dex AI orchestration framework for future reference and development.

## Root Directory Structure
```
Ultra-Dex/
├── .claude/                    # Claude AI configuration
├── .cursor/                    # Cursor IDE rules
├── .github/                    # GitHub configuration
├── .git/                       # Git repository metadata
├── .ultra/                     # Ultra-Dex runtime state (user-generated)
├── .ultra-dex/                 # Ultra-Dex runtime state (user-generated)
├── @ ultra-dex/                # Core template directory
│   └── Saas plan/
│       ├── 00-README.md        # Template navigation hub
│       ├── 01-QUICK-START.md   # Quick start guide
│       ├── 02-HOW-TO-USE.md    # Usage instructions
│       ├── 03-METHODOLOGY.md   # Development methodology
│       ├── 04-Imp-Template.md  # 34-section implementation template
│       ├── Examples/           # Complete example projects
│       └── Templates/          # Template files
├── agents/                     # AI agent prompts (17 specialized agents)
│   ├── 0-orchestration/        # Meta-orchestration agents
│   ├── 1-leadership/           # Leadership tier agents (@CTO, @Planner, @Research)
│   ├── 2-development/          # Development tier agents (@Backend, @Frontend, @Database)
│   ├── 3-security/             # Security tier agents (@Auth, @Security)
│   ├── 4-devops/               # DevOps tier agents (@DevOps)
│   ├── 5-quality/              # Quality tier agents (@Testing, @Documentation, @Reviewer, @Debugger)
│   └── 6-specialist/           # Specialist tier agents (@Performance, @Refactoring)
├── archived_docs/              # Archived documentation and planning files
├── assets/                     # Project assets
├── cli/                        # Main CLI implementation
│   ├── bin/                    # Binary executables
│   │   └── ultra-dex.js        # Main CLI entry point
│   ├── lib/                    # Core libraries
│   │   ├── ai/                 # AI integration utilities
│   │   ├── commands/           # Command implementations (50+ commands)
│   │   ├── config/             # Configuration management
│   │   ├── kernel/             # Core kernel functionality
│   │   ├── mcp/                # Model Context Protocol implementation
│   │   ├── memory/             # Memory management
│   │   ├── nlp/                # Natural language processing
│   │   ├── providers/          # AI provider integrations
│   │   ├── quality/            # Quality assurance tools
│   │   ├── repl/               # REPL functionality
│   │   ├── swarm/              # Agent swarm orchestration
│   │   ├── templates/          # Template utilities
│   │   ├── themes/             # UI theming
│   │   ├── ui/                 # User interface components
│   │   ├── utils/              # Utility functions (40+ modules)
│   │   └── vision/             # Vision processing
│   ├── assets/                 # CLI assets
│   └── test/                   # Test files (retained for quality assurance)
├── cleanup_area/               # Moved development artifacts
├── CONTRIBUTING.md             # Contribution guidelines
├── cursor-rules/               # Cursor IDE rules (31 rules)
├── docs/                       # Streamlined documentation (10 essential files)
│   ├── API-REFERENCE.md        # Command reference
│   ├── CICD-GUIDE.md           # CI/CD setup guide
│   ├── FAQ.md                  # Frequently asked questions
│   ├── MCP-INTEGRATION.md      # MCP server integration
│   ├── PLUGINS.md              # Plugin system documentation
│   ├── QUICK-REFERENCE.md      # Quick reference card
│   ├── README.md               # Documentation hub
│   ├── TROUBLESHOOTING.md      # Issue resolution guide
│   ├── USER-GUIDE.md           # Complete user guide
│   └── guides/                 # Specialized guides
│       └── PROJECT-ORCHESTRATION.md # Multi-agent workflows
├── examples/                   # Example projects
├── marketing/                  # Marketing materials
├── mcp-config.json             # MCP server configuration
├── node_modules/               # Node.js dependencies
├── OPTIMIZATION-SUMMARY.md     # This optimization summary
├── package.json                # Project configuration
├── package-lock.json           # Dependency lock file
├── plugins/                    # Plugin system
├── QUICK-START.md              # Quick start guide
├── README.md                   # Main project README
├── RELEASE-NOTES-v3.4.3.md     # Release notes
├── sample-plugin.js            # Sample plugin implementation
├── templates/                  # Project templates
├── vscode-extension/           # VS Code extension
└── website/                    # Website files
```

## Core CLI Structure
The main CLI implementation is located in `/cli/` with the following key components:

### Commands (`/cli/lib/commands/`)
- **Core Commands**: init, generate, build, review, validate, serve
- **Agent Commands**: agents, run, swarm
- **System Commands**: status, metrics, health, debug
- **Plugin Commands**: plugin management
- **Specialized Commands**: 40+ additional commands for specific functionality

### Libraries (`/cli/lib/`)
- **MCP Server**: Model Context Protocol implementation for Claude Desktop integration
- **Plugin System**: Extensible architecture for third-party functionality
- **Agent System**: 17 specialized AI agents with tier-based organization
- **State Management**: Project state tracking and persistence
- **Utilities**: 40+ utility modules for various functions

## Documentation Structure
The streamlined documentation consists of 10 essential files:

### Core Documentation (`/docs/`)
1. **USER-GUIDE.md** - Complete user guide with installation and usage
2. **API-REFERENCE.md** - Comprehensive command reference
3. **README.md** - Documentation hub and navigation
4. **FAQ.md** - Frequently asked questions and troubleshooting
5. **QUICK-REFERENCE.md** - Quick reference card for commands
6. **MCP-INTEGRATION.md** - MCP server and Claude Desktop integration
7. **PLUGINS.md** - Plugin system documentation
8. **TROUBLESHOOTING.md** - Issue resolution guide
9. **CICD-GUIDE.md** - CI/CD setup and integration

### Specialized Guide (`/docs/guides/`)
10. **PROJECT-ORCHESTRATION.md** - Multi-agent workflow coordination

## Agent System Structure
The 17 specialized AI agents are organized in 6 tiers:

### Tier 1: Leadership
- @CTO: Architecture & tech stack decisions
- @Planner: Task breakdown & sprint planning
- @Research: Technology evaluation & comparison

### Tier 2: Development
- @Backend: API & server implementation
- @Frontend: UI & component implementation
- @Database: Schema design & query optimization

### Tier 3: Security
- @Auth: Authentication & authorization
- @Security: Security audits & vulnerability fixes

### Tier 4: DevOps
- @DevOps: Deployment & infrastructure

### Tier 5: Quality
- @Testing: QA & test automation
- @Documentation: Technical writing & docs maintenance
- @Reviewer: Code review & quality checks
- @Debugger: Bug investigation & fixes

### Tier 6: Specialist
- @Performance: Performance optimization
- @Refactoring: Code quality & design patterns

### Tier 0: Orchestration
- @Orchestrator: Multi-agent coordination

## Key Features
1. **AI Orchestration**: Coordinate multiple AI agents for complex tasks
2. **MCP Integration**: Model Context Protocol for Claude Desktop
3. **Plugin System**: Extensible architecture with hook-based extensions
4. **34-Section Template**: Comprehensive project planning framework
5. **21-Step Verification**: Quality assurance framework
6. **Multi-Agent Swarms**: Parallel execution of specialized agents
7. **Code Property Graph**: Project structure analysis and dependency tracking

## Distribution Configuration
- **Binary Entry Point**: `./cli/bin/ultra-dex.js`
- **Package Files**: `cli/bin`, `cli/lib`, `cli/assets`
- **Module Type**: ES modules (`"type": "module"`)
- **Node Engine**: `">=18"`
- **Dependencies**: Minimal core dependencies (chalk, uuid)

## Version Information
- **Current Version**: 3.4.3
- **License**: MIT
- **Repository**: https://github.com/Srujan0798/Ultra-Dex

This structure represents a professional, streamlined AI orchestration framework optimized for production use while maintaining all essential functionality.