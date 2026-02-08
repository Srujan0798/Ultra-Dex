# CLI Overview

The Ultra-Dex CLI provides a comprehensive set of commands for managing your AI-assisted development workflow. With 61+ commands, you can orchestrate agents, manage projects, and coordinate complex development tasks.

## Command Structure

Ultra-Dex commands follow the pattern:
```
ultra-dex [command] [subcommand] [options] [arguments]
```

## Core Commands

### Project Management
- `init` - Initialize a new Ultra-Dex project
- `generate` - Generate implementation plans from ideas
- `plan` - Manage project plans (Gantt, Timeline, Generate)
- `sync` - Synchronize project state
- `validate` - Validate project structure

### Agent Orchestration
- `swarm` - Run multi-agent swarms
- `run` - Run individual agents
- `agents` - Manage AI agents
- `brain` - Brain sync and context management
- `delegation` - Delegate tasks between agents

### Development Tools
- `serve` - Start MCP server for AI tools
- `diff` - Compare plan vs code alignment
- `export` - Export project data in various formats
- `search` - Semantic code search
- `exec` - Execute code in sandbox

### Infrastructure
- `cloud` - Cloud deployment and management
- `dashboard` - Launch dashboard UI
- `config` - Configuration management
- `doctor` - Diagnostics and troubleshooting
- `upgrade` - Update Ultra-Dex

## Command Categories

### Initialization & Setup
Commands for starting new projects and configuring Ultra-Dex:

```bash
# Initialize a new project
ultra-dex init

# Generate implementation plan from idea
ultra-dex generate "A SaaS for team collaboration"

# Configure MCP integration
ultra-dex config --mcp
```

### Agent Management
Commands for working with AI agents:

```bash
# List available agents
ultra-dex agents list

# Show agent details
ultra-dex agents show @planner

# Run a specific agent
ultra-dex run @backend "Implement user authentication API"

# Run a multi-agent swarm
ultra-dex swarm "Build complete user profile page"
```

### Project Analysis
Commands for analyzing and managing project state:

```bash
# Check project alignment
ultra-dex align

# Compare plan vs implementation
ultra-dex diff

# Export project data
ultra-dex export --format json

# Semantic search in codebase
ultra-dex search "authentication flow"
```

### Development Workflow
Commands for the development lifecycle:

```bash
# Start MCP server for AI tools
ultra-dex serve

# Run automated verification
ultra-dex verify

# Execute code in secure sandbox
ultra-dex exec --file script.js

# Monitor system status
ultra-dex monitoring status
```

## Common Options

Most commands support these common options:

- `--help` or `-h` - Show command help
- `--verbose` or `-v` - Verbose output
- `--quiet` or `-q` - Minimal output
- `--config` - Path to config file
- `--workspace` - Workspace directory

## Getting Help

Get help for any command:

```bash
# General help
ultra-dex --help

# Command-specific help
ultra-dex swarm --help

# List all commands
ultra-dex --commands
```

## Next Steps

- Explore specific commands in the [CLI Reference](./overview.md)
- Learn about [Agent Orchestration](../agents/overview.md)
- Understand [MCP Integration](../mcp/overview.md)