# CLI Overview

The Ultra-Dex CLI is the primary interface for interacting with the Ultra-Dex platform. It provides over 135 commands organized into logical categories to support your entire development workflow.

## Command Structure

Ultra-Dex commands follow a consistent structure:

```bash
ultra-dex [command] [subcommand] [options]
```

For example:
- `ultra-dex plan "Build a feature"` - Plan a new feature
- `ultra-dex github repo create --name my-repo` - Create a GitHub repository
- `ultra-dex swarm start plan.md --parallel 4` - Run a multi-agent swarm

## Core Commands

### Project Initialization
- `ultra-dex init` - Initialize a new project
- `ultra-dex scaffold` - Generate project structure from templates
- `ultra-dex setup` - Interactive setup wizard

### Planning & Design
- `ultra-dex plan` - Generate implementation plan from requirements
- `ultra-dex architect` - Architectural decision support
- `ultra-dex generate` - Generate code from specifications

### Execution & Automation
- `ultra-dex run` - Execute a plan or script
- `ultra-dex swarm` - Run multi-agent collaboration
- `ultra-dex auto-implement` - Automatically implement features

### Verification & Quality
- `ultra-dex verify` - Verify implementation against plan
- `ultra-dex quality` - Run quality checks
- `ultra-dex check` - Perform various checks and validations

### Context & Memory
- `ultra-dex context` - Manage project context
- `ultra-dex memory` - Interact with persistent memory
- `ultra-dex rag` - Retrieval augmented generation operations

### Integration & DevOps
- `ultra-dex github` - GitHub integration commands
- `ultra-dex deploy` - Deployment operations
- `ultra-dex docker` - Docker integration
- `ultra-dex k8s` - Kubernetes integration

## Command Help

Get help for any command:

```bash
# General help
ultra-dex --help

# Command-specific help
ultra-dex plan --help

# Subcommand help
ultra-dex github repo --help
```

## Common Options

All commands support these common options:

- `--help` - Show command help
- `--json` - Output in JSON format (where supported)
- `--verbose` - Show detailed logging
- `--quiet` - Suppress non-critical output
- `--dry-run` - Show what would happen without executing

## Command Categories

The 135+ commands are organized into these categories:

### Project & Planning
Commands for initializing projects, creating plans, and managing project structure.

### Execution & Automation
Commands for running tasks, orchestrating agents, and automating workflows.

### Context & Memory
Commands for managing project context, memory, and knowledge.

### Agents & Teams
Commands for managing AI agents, teams, and collaboration.

### Integrations
Commands for connecting with external services (GitHub, Jira, etc.).

### DevOps & Operations
Commands for deployment, monitoring, and operational tasks.

### UI & Dashboard
Commands for dashboard, visualization, and user interface elements.

### Configuration & Tooling
Commands for configuration, setup, and tooling.

## Advanced Usage

### Command Composition

Chain commands together for complex workflows:

```bash
# Plan, then run, then verify in one command
ultra-dex plan "Add user auth" && ultra-dex run IMPLEMENTATION_PLAN.md && ultra-dex verify
```

### Scripting

Use Ultra-Dex in shell scripts:

```bash
#!/bin/bash
PROJECT_NAME=$1
ultra-dex init --name "$PROJECT_NAME"
ultra-dex plan "Basic CRUD operations for $PROJECT_NAME"
ultra-dex run IMPLEMENTATION_PLAN.md
```

### Aliases

Create command aliases for frequently used operations:

```bash
# Add to your shell profile
alias udx='ultra-dex'
alias udx-dev='ultra-dex run DEVELOPMENT_PLAN.md'
```

## Command Reference

For a complete list of all 135+ commands with detailed documentation, see the [Generated CLI Reference](./generated-cli-reference.md).