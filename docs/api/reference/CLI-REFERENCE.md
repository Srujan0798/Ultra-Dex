# 📋 Ultra-Dex CLI Command Reference

> **Complete Command-Line Interface Documentation**
> **Version:** 6.0.0 OVERPOWERED
> **Last Updated:** 2026-02-10

Comprehensive reference for all Ultra-Dex CLI commands, options, and usage patterns. This document provides authoritative documentation for every command in the Ultra-Dex system.

---

## 🎯 COMMAND CATEGORIES

### 🚀 **Core Commands (Essential)**
- `init` - Project initialization and setup
- `generate` - Implementation plan generation
- `swarm` - Agent swarm orchestration
- `verify` - Quality verification and validation
- `serve` - MCP server and dashboard

### 🔧 **Development Commands (Advanced)**
- `build` - Project building and compilation
- `test` - Testing and validation
- `lint` - Code quality checking
- `format` - Code formatting
- `debug` - Debugging and issue resolution

### 🌐 **Integration Commands (Connectivity)**
- `mcp` - Model Context Protocol management
- `sync` - Context synchronization
- `export` - Project export and packaging
- `import` - Project import and restoration
- `diff` - Context comparison and change detection

### 🚢 **Deployment Commands (Production)**
- `deploy` - Production deployment
- `status` - System and project status
- `health` - Health checks and monitoring
- `doctor` - System diagnostics and troubleshooting
- `metrics` - Performance metrics and analytics

---

## 📚 DETAILED COMMAND REFERENCE

### 1. `ultra-dex init` - Project Initialization
**Description:** Initialize a new Ultra-Dex project with proper structure and configuration.

#### Usage
```bash
ultra-dex init [project-name] [options]
```

#### Arguments
- `[project-name]` *(optional)*: Name of the project to create (defaults to current directory name)

#### Options
- `-t, --template <name>`: Use a specific template (nextjs-saas, remix-saas, sveltekit-saas)
- `-c, --config <file>`: Use custom configuration file
- `-f, --force`: Force overwrite of existing project
- `--no-git`: Skip git initialization
- `--no-install`: Skip dependency installation
- `--bare`: Create minimal project structure only

#### Examples
```bash
# Initialize project in current directory
ultra-dex init

# Initialize project with specific name
ultra-dex init my-awesome-project

# Initialize with specific template
ultra-dex init my-saas --template nextjs-saas

# Initialize with custom config
ultra-dex init my-project --config ./custom-config.json

# Initialize bare project
ultra-dex init my-project --bare
```

#### Exit Codes
- `0`: Success
- `1`: Invalid arguments
- `2`: Project already exists (without --force)
- `3`: Configuration error

#### Aliases
- `ultra-dex create`
- `ultra-dex new`

---

### 2. `ultra-dex generate` - Plan Generation
**Description:** Generate comprehensive implementation plans from natural language descriptions.

#### Usage
```bash
ultra-dex generate [description] [options]
```

#### Arguments
- `[description]`: Natural language description of the project or feature to implement

#### Options
- `-o, --output <file>`: Output file for generated plan (default: IMPLEMENTATION-PLAN.md)
- `-t, --template <name>`: Use specific template for generation
- `-f, --force`: Overwrite existing plan files
- `--model <name>`: Specify AI model to use (gpt-4o, claude-sonnet, etc.)
- `--temperature <value>`: AI temperature setting (0.0-1.0)
- `--tokens <count>`: Maximum tokens to use (default: 4000)
- `--stream`: Stream results in real-time

#### Examples
```bash
# Generate plan from description
ultra-dex generate "Create a task management SaaS with user authentication"

# Generate with specific output file
ultra-dex generate "Build API endpoints" --output ./api-plan.md

# Generate with specific AI model
ultra-dex generate "Create dashboard" --model claude-sonnet

# Generate with streaming output
ultra-dex generate "Build frontend" --stream
```

#### Exit Codes
- `0`: Success
- `1`: Invalid arguments
- `2`: AI provider error
- `3`: Plan already exists (without --force)

#### Aliases
- `ultra-dex plan`
- `ultra-dex create-plan`
- `ultra-dex generate-plan`

---

### 3. `ultra-dex swarm` - Agent Swarm Orchestration
**Description:** Coordinate multiple AI agents to work together on complex tasks.

#### Usage
```bash
ultra-dex swarm [command] [task] [options]
```

#### Commands
- `start` - Start a new agent swarm
- `status` - Check swarm status
- `cancel` - Cancel running swarm
- `list` - List active swarms
- `logs` - View swarm logs

#### Options
- `-a, --agents <list>`: Comma-separated list of agents to include
- `-p, --parallel`: Run agents in parallel (default: sequential)
- `-w, --workers <count>`: Number of parallel workers (default: 4)
- `--dry-run`: Show execution plan without running
- `--timeout <seconds>`: Maximum execution time (default: 3600)
- `--retry <count>`: Number of retries on failure (default: 3)
- `--checkpoint`: Enable checkpointing for resume capability
- `--verbose`: Show detailed execution information

#### Examples
```bash
# Start swarm with default agents
ultra-dex swarm start "Implement user authentication"

# Start swarm with specific agents
ultra-dex swarm start "Build API" --agents architect,coder,reviewer

# Start parallel swarm
ultra-dex swarm start "Build frontend" --parallel --workers 6

# Dry run to preview execution
ultra-dex swarm start "Deploy to production" --dry-run

# Start with checkpoint capability
ultra-dex swarm start "Large feature" --checkpoint --timeout 7200
```

#### Exit Codes
- `0`: Success
- `1`: Invalid arguments
- `2`: Agent execution error
- `3`: Timeout exceeded
- `4`: Swarm cancellation

#### Aliases
- `ultra-dex agents`
- `ultra-dex orchestrate`
- `ultra-dex multi-agent`

---

### 4. `ultra-dex verify` - Quality Verification
**Description:** Execute comprehensive quality verification using the 21-step protocol.

#### Usage
```bash
ultra-dex verify [options]
```

#### Options
- `-f, --full`: Run complete 21-step verification
- `-s, --steps <list>`: Comma-separated list of specific steps to run
- `-r, --report`: Generate detailed verification report
- `-o, --output <file>`: Output report to specific file
- `-F, --format <format>`: Report format (json, md, html, junit)
- `--ci`: CI/CD friendly output format
- `--strict`: Fail on any verification step failure
- `--skip <list>`: Skip specific verification steps
- `--threshold <percent>`: Minimum quality threshold (default: 80%)

#### Verification Steps
1. **Requirements Validation** - Verify implementation matches requirements
2. **Architecture Review** - Validate system architecture decisions
3. **Security Assessment** - Check for security vulnerabilities
4. **Performance Testing** - Validate performance benchmarks
5. **Code Quality** - Static analysis and code review
6. **Documentation Completeness** - Verify all documentation exists
7. **Testing Coverage** - Validate test coverage and quality
8. **Integration Validation** - Test all integrations
9. **Database Validation** - Verify database schemas and queries
10. **API Validation** - Test all API endpoints and contracts
11. **UI/UX Validation** - Validate user interface and experience
12. **Accessibility Check** - Ensure accessibility compliance
13. **Localization Readiness** - Verify internationalization support
14. **Deployment Validation** - Test deployment processes
15. **Monitoring Setup** - Verify monitoring and alerting
16. **Backup & Recovery** - Test backup and recovery procedures
17. **Disaster Recovery** - Validate disaster recovery plans
18. **Compliance Check** - Verify regulatory compliance
19. **Performance Optimization** - Optimize for performance
20. **Security Hardening** - Apply security hardening measures
21. **Final Acceptance** - Final sign-off and approval

#### Examples
```bash
# Run full verification
ultra-dex verify --full

# Run specific verification steps
ultra-dex verify --steps security,performance,quality

# Generate verification report
ultra-dex verify --report --format json --output ./verification-report.json

# Run in CI mode
ultra-dex verify --ci --strict --threshold 95

# Skip specific steps
ultra-dex verify --full --skip database,disaster-recovery
```

#### Exit Codes
- `0`: All verifications passed
- `1`: Invalid arguments
- `2`: Verification failed (below threshold)
- `3`: Verification error
- `4`: Required verification step failed

#### Aliases
- `ultra-dex quality`
- `ultra-dex check`
- `ultra-dex validate`

---

### 5. `ultra-dex serve` - MCP Server & Dashboard
**Description:** Start the Model Context Protocol server and interactive dashboard.

#### Usage
```bash
ultra-dex serve [options]
```

#### Options
- `-p, --port <port>`: Port to run server on (default: 3001)
- `-h, --host <host>`: Host to bind to (default: 127.0.0.1)
- `-o, --open`: Open dashboard in browser
- `--no-dashboard`: Run MCP server only (no dashboard)
- `--no-mcp`: Run dashboard only (no MCP server)
- `--ssl`: Enable SSL/TLS
- `--cert <file>`: SSL certificate file
- `--key <file>`: SSL key file
- `--cors-origin <origin>`: CORS origin (default: *)
- `--rate-limit <requests>`: Rate limit per minute (default: 100)

#### Examples
```bash
# Start server with dashboard
ultra-dex serve

# Start on specific port
ultra-dex serve --port 8080

# Start with SSL
ultra-dex serve --ssl --cert ./server.crt --key ./server.key

# Start MCP server only
ultra-dex serve --no-dashboard

# Start dashboard only
ultra-dex serve --no-mcp

# Open in browser automatically
ultra-dex serve --open
```

#### Exit Codes
- `0`: Server started successfully
- `1`: Invalid arguments
- `2`: Port already in use
- `3`: SSL configuration error
- `4`: Permission error

#### Aliases
- `ultra-dex dashboard`
- `ultra-dex mcp`
- `ultra-dex context-bus`

---

## 🔧 DEVELOPMENT COMMANDS

### 6. `ultra-dex build` - Project Building
**Description:** Build and compile the project for deployment.

#### Usage
```bash
ultra-dex build [options]
```

#### Options
- `-e, --environment <env>`: Build environment (development, staging, production)
- `-o, --output <dir>`: Output directory (default: ./dist)
- `--analyze`: Analyze bundle size and dependencies
- `--minify`: Minify output (production default)
- `--sourcemap`: Generate source maps
- `--watch`: Watch for changes and rebuild
- `--clean`: Clean output directory before build
- `--stats`: Generate build statistics

#### Examples
```bash
# Build for production
ultra-dex build --environment production

# Build with analysis
ultra-dex build --analyze

# Build and watch for changes
ultra-dex build --watch

# Build with source maps
ultra-dex build --sourcemap
```

---

### 7. `ultra-dex test` - Testing
**Description:** Run project tests with comprehensive coverage analysis.

#### Usage
```bash
ultra-dex test [options]
```

#### Options
- `-t, --type <type>`: Test type (unit, integration, e2e, all)
- `--coverage`: Generate coverage report
- `--watch`: Watch mode for development
- `--debug`: Debug mode with verbose output
- `--bail`: Stop after first test failure
- `--reporter <name>`: Test reporter (tap, json, verbose)
- `--timeout <ms>`: Test timeout in milliseconds
- `--concurrency <count>`: Number of concurrent tests

#### Examples
```bash
# Run all tests
ultra-dex test

# Run unit tests only
ultra-dex test --type unit

# Run with coverage
ultra-dex test --coverage

# Run in watch mode
ultra-dex test --watch

# Run with specific reporter
ultra-dex test --reporter json
```

---

### 8. `ultra-dex lint` - Code Quality
**Description:** Check code quality and style consistency.

#### Usage
```bash
ultra-dex lint [options]
```

#### Options
- `--fix`: Automatically fix fixable issues
- `--format <format>`: Output format (simple, unix, tap, checkstyle, compact)
- `--max-warnings <count>`: Maximum warnings allowed
- `--quiet`: Show only errors
- `--cache`: Use cache to speed up linting
- `--cache-location <path>`: Cache location
- `--ext <extensions>`: File extensions to lint (comma-separated)

#### Examples
```bash
# Check code quality
ultra-dex lint

# Fix issues automatically
ultra-dex lint --fix

# Lint specific extensions
ultra-dex lint --ext .js,.ts,.jsx,.tsx

# Lint with cache
ultra-dex lint --cache
```

---

### 9. `ultra-dex format` - Code Formatting
**Description:** Format code according to project standards.

#### Usage
```bash
ultra-dex format [options]
```

#### Options
- `--check`: Check if files are formatted (don't modify)
- `--write`: Write formatted files (default behavior)
- `--parser <parser>`: Parser to use (babel, flow, typescript, etc.)
- `--single-quote`: Use single quotes instead of double
- `--semi`: Add semicolons
- `--trailing-comma <es5|none|all>`: Trailing comma setting

#### Examples
```bash
# Format all files
ultra-dex format

# Check formatting without modifying
ultra-dex format --check

# Format with specific options
ultra-dex format --single-quote --semi
```

---

### 10. `ultra-dex debug` - Debugging
**Description:** Debug and troubleshoot project issues.

#### Usage
```bash
ultra-dex debug [options]
```

#### Options
- `-v, --verbose`: Verbose output
- `-l, --level <level>`: Log level (error, warn, info, debug)
- `--inspect`: Enable Node.js inspector
- `--profile`: Profile execution
- `--trace`: Enable execution tracing
- `--heap`: Generate heap dump
- `--cpu`: Generate CPU profile
- `--timeline`: Generate execution timeline

#### Examples
```bash
# Debug with verbose output
ultra-dex debug --verbose

# Debug with specific log level
ultra-dex debug --level debug

# Profile execution
ultra-dex debug --profile

# Generate heap dump
ultra-dex debug --heap
```

---

## 🌐 INTEGRATION COMMANDS

### 11. `ultra-dex mcp` - Model Context Protocol
**Description:** Manage MCP (Model Context Protocol) connections and context synchronization.

#### Usage
```bash
ultra-dex mcp [command] [options]
```

#### Commands
- `connect` - Connect to MCP server
- `disconnect` - Disconnect from MCP server
- `status` - Show MCP connection status
- `sync` - Synchronize context manually
- `logs` - View MCP logs
- `config` - Configure MCP settings

#### Options
- `--server <url>`: MCP server URL (default: http://localhost:3001)
- `--token <token>`: MCP authentication token
- `--timeout <seconds>`: Connection timeout (default: 30)
- `--reconnect`: Enable auto-reconnect
- `--reconnect-interval <ms>`: Reconnect interval (default: 5000)
- `--context-file <file>`: Context file to sync (default: CONTEXT.md)

#### Examples
```bash
# Connect to MCP server
ultra-dex mcp connect

# Connect to specific server
ultra-dex mcp connect --server https://mcp.mycompany.com

# Check connection status
ultra-dex mcp status

# Sync context manually
ultra-dex mcp sync

# Configure MCP settings
ultra-dex mcp config --server https://mcp.mycompany.com --token abc123
```

---

### 12. `ultra-dex sync` - Context Synchronization
**Description:** Synchronize context across tools and environments.

#### Usage
```bash
ultra-dex sync [options]
```

#### Options
- `--force`: Force synchronization regardless of timestamps
- `--bidirectional`: Enable bidirectional sync
- `--exclude <patterns>`: Exclude patterns from sync
- `--include <patterns>`: Include only specific patterns
- `--dry-run`: Show what would be synced without doing it
- `--verbose`: Show detailed sync information
- `--timeout <seconds>`: Sync timeout (default: 60)
- `--retry <count>`: Number of sync retries (default: 3)

#### Examples
```bash
# Sync context
ultra-dex sync

# Force sync
ultra-dex sync --force

# Dry run sync
ultra-dex sync --dry-run

# Sync with specific patterns
ultra-dex sync --include "**/*.md" --exclude "**/node_modules/**"
```

---

### 13. `ultra-dex export` - Project Export
**Description:** Export project context and configuration for sharing or backup.

#### Usage
```bash
ultra-dex export [options]
```

#### Options
- `-o, --output <file>`: Output file (default: ultra-dex-export.zip)
- `--format <format>`: Export format (zip, tar, json, ultra)
- `--include <list>`: Include specific file types (context, plan, code, all)
- `--exclude <list>`: Exclude specific file types
- `--compress`: Compress output (default: true)
- `--encrypt`: Encrypt export with password
- `--password <pwd>`: Password for encryption
- `--metadata`: Include metadata in export

#### Examples
```bash
# Export project
ultra-dex export

# Export to specific file
ultra-dex export --output ./my-project-backup.zip

# Export with encryption
ultra-dex export --encrypt --password my-secret-pwd

# Export only context files
ultra-dex export --include context,plan
```

---

### 14. `ultra-dex import` - Project Import
**Description:** Import project context and configuration from export files.

#### Usage
```bash
ultra-dex import [file] [options]
```

#### Arguments
- `[file]`: Export file to import

#### Options
- `--force`: Overwrite existing files
- `--dry-run`: Show what would be imported without doing it
- `--decrypt`: Decrypt import with password
- `--password <pwd>`: Password for decryption
- `--merge`: Merge with existing project (default: replace)
- `--validate`: Validate import before applying
- `--backup`: Create backup before import

#### Examples
```bash
# Import project
ultra-dex import ./project-export.zip

# Import with decryption
ultra-dex import ./encrypted-export.zip --decrypt --password my-secret-pwd

# Import with validation
ultra-dex import ./project-export.zip --validate

# Import with backup
ultra-dex import ./project-export.zip --backup
```

---

### 15. `ultra-dex diff` - Context Comparison
**Description:** Compare context files and show differences.

#### Usage
```bash
ultra-dex diff [file1] [file2] [options]
```

#### Arguments
- `[file1]`: First file to compare (default: CONTEXT.md)
- `[file2]`: Second file to compare (default: IMPLEMENTATION-PLAN.md)

#### Options
- `--format <format>`: Output format (unified, side-by-side, json)
- `--context <lines>`: Number of context lines (default: 3)
- `--ignore-whitespace`: Ignore whitespace differences
- `--ignore-case`: Ignore case differences
- `--output <file>`: Output to file instead of console
- `--color`: Enable colored output (default: auto)
- `--summary`: Show summary only

#### Examples
```bash
# Compare context files
ultra-dex diff

# Compare specific files
ultra-dex diff ./old-context.md ./new-context.md

# Compare with summary
ultra-dex diff --summary

# Compare ignoring whitespace
ultra-dex diff --ignore-whitespace
```

---

## 🚢 DEPLOYMENT COMMANDS

### 16. `ultra-dex deploy` - Project Deployment
**Description:** Deploy project to various environments and platforms.

#### Usage
```bash
ultra-dex deploy [options]
```

#### Options
- `-e, --environment <env>`: Target environment (staging, production, development)
- `-p, --platform <platform>`: Target platform (vercel, netlify, aws, gcp, azure)
- `--dry-run`: Show deployment plan without executing
- `--rollback`: Rollback to previous version
- `--canary`: Deploy canary version for testing
- `--blue-green`: Use blue-green deployment strategy
- `--with-verification`: Run verification after deployment
- `--auto-confirm`: Skip confirmation prompts

#### Examples
```bash
# Deploy to production
ultra-dex deploy --environment production

# Deploy to specific platform
ultra-dex deploy --platform vercel

# Dry run deployment
ultra-dex deploy --dry-run

# Deploy with canary
ultra-dex deploy --canary --environment staging

# Blue-green deployment
ultra-dex deploy --blue-green --environment production
```

---

### 17. `ultra-dex status` - System Status
**Description:** Show current system and project status.

#### Usage
```bash
ultra-dex status [options]
```

#### Options
- `--verbose`: Show detailed status information
- `--json`: Output in JSON format
- `--refresh`: Refresh status information
- `--components`: Show specific components (mcp, agents, memory, all)
- `--health`: Show health status only
- `--metrics`: Show performance metrics only

#### Examples
```bash
# Show status
ultra-dex status

# Show detailed status
ultra-dex status --verbose

# Show status in JSON
ultra-dex status --json

# Show health only
ultra-dex status --health
```

---

### 18. `ultra-dex health` - Health Checks
**Description:** Perform comprehensive health checks on system components.

#### Usage
```bash
ultra-dex health [command] [options]
```

#### Commands
- `check` - Run health checks
- `report` - Generate health report
- `monitor` - Start health monitoring
- `alerts` - Show health alerts

#### Options
- `--checks <list>`: Specific checks to run (cpu, memory, disk, network)
- `--thresholds <file>`: Custom threshold configuration
- `--format <format>`: Output format (text, json, html)
- `--output <file>`: Output to file
- `--interval <seconds>`: Check interval for monitoring (default: 30)
- `--alerts`: Enable alerting for health issues

#### Examples
```bash
# Run health checks
ultra-dex health check

# Run specific checks
ultra-dex health check --checks cpu,memory,disk

# Generate health report
ultra-dex health report --format json --output ./health-report.json

# Monitor health continuously
ultra-dex health monitor --interval 10
```

---

### 19. `ultra-dex doctor` - System Diagnostics
**Description:** Comprehensive system diagnostics and troubleshooting.

#### Usage
```bash
ultra-dex doctor [options]
```

#### Options
- `--checks <list>`: Specific checks to run (all, basic, advanced)
- `--fix`: Attempt to fix identified issues
- `--report`: Generate diagnostic report
- `--output <file>`: Output report to file
- `--format <format>`: Report format (text, json, md)
- `--verbose`: Show detailed diagnostic information
- `--interactive`: Interactive diagnostic mode

#### Examples
```bash
# Run diagnostics
ultra-dex doctor

# Run with fixes
ultra-dex doctor --fix

# Generate report
ultra-dex doctor --report --format json

# Interactive diagnostics
ultra-dex doctor --interactive
```

---

### 20. `ultra-dex metrics` - Performance Metrics
**Description:** Show and analyze system performance metrics.

#### Usage
```bash
ultra-dex metrics [command] [options]
```

#### Commands
- `show` - Show current metrics
- `watch` - Watch metrics in real-time
- `export` - Export metrics data
- `report` - Generate metrics report
- `alerts` - Show metric alerts

#### Options
- `--metrics <list>`: Specific metrics to show (cpu, memory, agents, performance)
- `--interval <seconds>`: Update interval for watch mode (default: 5)
- `--format <format>`: Output format (table, json, csv)
- `--since <time>`: Show metrics since specific time (e.g., "1h", "30m", "1d")
- `--export-format <format>`: Export format (json, csv, prometheus)
- `--thresholds <file>`: Custom threshold configuration

#### Examples
```bash
# Show metrics
ultra-dex metrics show

# Watch metrics in real-time
ultra-dex metrics watch --interval 2

# Export metrics
ultra-dex metrics export --format csv --output ./metrics.csv

# Show metrics since last hour
ultra-dex metrics show --since 1h
```

---

## 🤖 ADVANCED COMMANDS

### 21. `ultra-dex agents` - Agent Management
**Description:** Manage AI agents and their configurations.

#### Usage
```bash
ultra-dex agents [command] [options]
```

#### Commands
- `list` - List available agents
- `create` - Create new agent
- `update` - Update agent configuration
- `remove` - Remove agent
- `status` - Show agent status
- `logs` - View agent logs

#### Options
- `--type <type>`: Agent type (core, custom, specialist)
- `--template <name>`: Agent template to use
- `--config <file>`: Agent configuration file
- `--verbose`: Show detailed agent information
- `--json`: Output in JSON format

#### Examples
```bash
# List agents
ultra-dex agents list

# Create custom agent
ultra-dex agents create --template custom --config ./my-agent.json

# Show agent status
ultra-dex agents status
```

---

### 22. `ultra-dex config` - Configuration Management
**Description:** Manage Ultra-Dex configuration settings.

#### Usage
```bash
ultra-dex config [command] [options]
```

#### Commands
- `show` - Show current configuration
- `set` - Set configuration value
- `get` - Get specific configuration value
- `reset` - Reset configuration to defaults
- `import` - Import configuration from file
- `export` - Export configuration to file

#### Examples
```bash
# Show configuration
ultra-dex config show

# Set API key
ultra-dex config set openai.apiKey sk-...

# Get specific value
ultra-dex config get mcp.port

# Export configuration
ultra-dex config export --output ./config.json
```

---

### 23. `ultra-dex version` - Version Management
**Description:** Show and manage Ultra-Dex version information.

#### Usage
```bash
ultra-dex version [options]
```

#### Options
- `--verbose`: Show detailed version information
- `--json`: Output in JSON format
- `--changelog`: Show changelog since last version
- `--upgradable`: Check for upgradable versions
- `--remote`: Show remote version information

#### Examples
```bash
# Show version
ultra-dex version

# Show detailed version info
ultra-dex version --verbose

# Show changelog
ultra-dex version --changelog
```

---

## 🛠️ UTILITY COMMANDS

### 24. `ultra-dex help` - Help System
**Description:** Show help information for commands.

#### Usage
```bash
ultra-dex help [command]
```

#### Examples
```bash
# Show general help
ultra-dex help

# Show help for specific command
ultra-dex help swarm

# Show help with examples
ultra-dex help generate
```

---

### 25. `ultra-dex repl` - Interactive REPL
**Description:** Start interactive Ultra-Dex REPL for experimentation.

#### Usage
```bash
ultra-dex repl [options]
```

#### Options
- `--verbose`: Show detailed execution information
- `--history <file>`: Load command history from file
- `--save-history <file>`: Save command history to file
- `--context <file>`: Load context from file
- `--prompt <text>`: Initial prompt for REPL

#### Examples
```bash
# Start REPL
ultra-dex repl

# Start REPL with context
ultra-dex repl --context ./CONTEXT.md

# Start REPL with history
ultra-dex repl --history ./repl-history.txt
```

---

## 🚀 PROFESSIONAL COMMANDS

### 26. `ultra-dex production-ready` - Production Readiness
**Description:** Check if project is ready for production deployment.

#### Usage
```bash
ultra-dex production-ready [options]
```

#### Options
- `--all`: Run all production readiness checks
- `--security`: Run security checks only
- `--performance`: Run performance checks only
- `--compliance`: Run compliance checks only
- `--report`: Generate readiness report
- `--threshold <percent>`: Minimum readiness threshold (default: 95%)

#### Examples
```bash
# Check production readiness
ultra-dex production-ready --all

# Generate readiness report
ultra-dex production-ready --report --format json

# Check security readiness
ultra-dex production-ready --security
```

---

### 27. `ultra-dex audit` - Security & Compliance Audit
**Description:** Perform comprehensive security and compliance audit.

#### Usage
```bash
ultra-dex audit [options]
```

#### Options
- `--type <type>`: Audit type (security, compliance, performance)
- `--standard <standard>`: Compliance standard (soc2, gdpr, hipaa, pci)
- `--report`: Generate audit report
- `--output <file>`: Output report to file
- `--format <format>`: Report format (json, md, html, pdf)
- `--fix`: Attempt to fix identified issues

#### Examples
```bash
# Run security audit
ultra-dex audit --type security

# Run SOC2 compliance audit
ultra-dex audit --type compliance --standard soc2

# Generate audit report
ultra-dex audit --report --format pdf --output ./audit-report.pdf
```

---

## 📋 COMMAND SUMMARY

### Essential Commands (Daily Use)
- `ultra-dex init` - Start new projects
- `ultra-dex generate` - Create implementation plans
- `ultra-dex swarm` - Execute agent workflows
- `ultra-dex verify` - Quality assurance
- `ultra-dex serve` - Start dashboard and MCP

### Development Commands (Frequent Use)
- `ultra-dex test` - Run tests
- `ultra-dex lint` - Code quality
- `ultra-dex format` - Code formatting
- `ultra-dex debug` - Troubleshooting
- `ultra-dex status` - System status

### Integration Commands (Regular Use)
- `ultra-dex mcp` - Context protocol
- `ultra-dex sync` - Context synchronization
- `ultra-dex diff` - Context comparison
- `ultra-dex export/import` - Project sharing

### Deployment Commands (Production Use)
- `ultra-dex deploy` - Project deployment
- `ultra-dex health` - Health monitoring
- `ultra-dex doctor` - System diagnostics
- `ultra-dex metrics` - Performance monitoring

### Advanced Commands (Expert Use)
- `ultra-dex agents` - Agent management
- `ultra-dex config` - Configuration management
- `ultra-dex audit` - Security/compliance
- `ultra-dex production-ready` - Readiness checks

---

## 🔄 ALTERNATIVE SYNTAX

### Long vs Short Options
All commands support both long and short option formats:

```bash
# Long format
ultra-dex generate --description "Build app" --output plan.md --force

# Short format
ultra-dex generate -d "Build app" -o plan.md -f
```

### Command Aliases
Many commands have aliases for convenience:

```bash
# These are equivalent:
ultra-dex plan "Build app"
ultra-dex generate "Build app"

# These are equivalent:
ultra-dex check --full
ultra-dex verify --full

# These are equivalent:
ultra-dex dashboard
ultra-dex serve
```

---

## 📞 SUPPORT & TROUBLESHOOTING

### Getting Help
```bash
# Show help for any command
ultra-dex [command] --help

# Show version information
ultra-dex --version

# Show detailed system information
ultra-dex doctor --verbose

# Start interactive help
ultra-dex repl --help
```

### Common Issues
- **Command not found:** Ensure Ultra-Dex is installed globally with `npm install -g ultra-dex`
- **API key issues:** Set your API key with `export OPENAI_API_KEY=...`
- **MCP connection issues:** Ensure MCP server is running with `ultra-dex serve`
- **Permission errors:** Check file permissions and run with appropriate privileges

---

## 🚀 PROFESSIONAL TIPS

### Productivity Shortcuts
- Use tab completion for commands and options
- Chain commands with `&&` for sequential execution
- Use `--dry-run` to preview operations before executing
- Leverage configuration files for complex setups

### Performance Optimization
- Use `--workers` option for parallel execution
- Leverage caching with `--cache` options where available
- Monitor performance with `ultra-dex metrics watch`
- Optimize for specific environments with `--environment` options

### Integration Best Practices
- Always use MCP for context synchronization
- Implement proper error handling in automation scripts
- Use `--report` options to generate documentation
- Validate outputs with `ultra-dex verify` commands

---

**Command Reference Version:** 6.0.0 OVERPOWERED
**Last Updated:** 2026-02-10
**Total Commands:** 27+ (with subcommands)
**API Stability:** 100% (Backward compatible)

---

_Last Updated: 2026-02-10_