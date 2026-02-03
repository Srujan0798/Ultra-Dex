# Changelog

All notable changes to Ultra-Dex will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.4.3-feature-pack] - Self-Healing & Beta Polish Update

### 🎯 Strategic Focus
This release combines **Wave 6: Self-Healing** with comprehensive **Beta Command Polish**, moving 8 key commands from beta to production readiness in preparation for the Feb 14 launch.

### Added - Self-Healing (Wave 6)
- **🔧 Autonomous Self-Healing Engine** (`cli/lib/commands/autonomous.js`)
  - Automated error detection and recovery loop
  - `AutonomousEngine` class with decision logging and reporting
  - Integration with `@Debugger` agent for root cause analysis
- **👁️ Watch & Heal Mode** (`ultra-dex autonomous --watch`)
  - Continuous monitoring of source files
  - Automatic test execution on change
  - Instant self-healing trigger upon test failure
- **📸 Snapshot & Rollback**
  - Automatic filesystem snapshots before healing attempts
  - Safety mechanism to revert changes if healing fails
  - `.ultra-dex/snapshots/` directory for recovery points
- **🧠 "Lessons Learned" Memory**
  - Persistence of successful fixes in `.ultra-dex/history/`
  - Injection of past solutions into agent context for faster resolution
- **🛡️ Dashboard Integration**
  - Real-time "Self-Healing Monitor" widget in the dashboard
  - Live status updates via SSE (Active, Fixed, Failed)
  - Success rate tracking and fix counters

### Added - Beta Command Polish
- **📊 Plan Visualization** (`ultra-dex plan`)
  - `--gantt`: ASCII Gantt chart of implementation phases
  - `--timeline`: Milestone timeline view
  - Markdown parsing for existing plans
- **📋 Workflow Management** (`ultra-dex workflow`)
  - `--viz`: Visual flowcharts of agent handoffs
  - `--start`: Append workflow steps to `IMPLEMENTATION-PLAN.md`
  - 12 built-in templates (Auth, Payments, CI/CD, etc.)
- **💡 Smart Suggestions** (`ultra-dex suggest`)
  - AI-powered context awareness (reads project files)
  - Intelligent agent chain recommendations
- **🔍 Deep Audit** (`ultra-dex audit`)
  - Integrated code quality & security scanning
  - 20+ new rules (Secrets, Gitignore, React patterns, SQL injection)
  - `--report`: JSON report generation
- **⚖️ Executable Verification** (`ultra-dex verify`)
  - Hybrid verification: Automated Checks + AI Review
  - Programmatic gates for Type Safety, Linting, and Unit Tests
- **🐳 Sandbox & Safety** (`ultra-dex exec`)
  - Pre-flight code scanning for dangerous patterns (`eval`, `process.exit`)
  - Improved output formatting
- **📈 Real-Time Monitoring** (`ultra-dex metrics`)
  - `--watch`: Live system metrics dashboard
  - Alerting for high resource usage or errors
### Added - Advanced Features
- **📂 Multi-Project Workspace** (`ultra-dex workspace`)
  - Global project tracking and management
  - `workspace add/list/remove` commands
  - Seamless context switching between projects
- **🔄 Batch Operations** (`ultra-dex batch`)
  - Execute sequential Ultra-Dex commands from a file
  - Automation for repetitive workflows

### Changed
- **Dashboard UI** - Added dedicated self-healing status card and metrics
- **CLI** - New `autonomous` command with `--watch`, `--fix`, and `--heal` options

---

## [3.4.4] - 2026-02-02 - "Professional Enhancement" Release

### 🎯 Strategic Focus
This release focuses on **project organization**, **performance optimization**, **security hardening**, **extensibility**, and **comprehensive documentation**.

### Added
- **Plugin Architecture** - Extensible system for custom functionality (`cli/lib/plugin-system.js`)
  - Plugin manager with load/uninstall capabilities
  - Hook system for modifying Ultra-Dex behavior
  - Plugin command for management (`ultra-dex plugin`)
  - Sample plugin for demonstration purposes
- **Performance Optimizations** - Enhanced graph analysis system (`cli/lib/mcp/graph.js`)
  - Caching with 30-second TTL
  - Concurrency improvements with Promise.allSettled()
  - File change detection to avoid unnecessary work
  - Performance metrics and benchmarking
- **Performance Tests** - Added comprehensive benchmarks (`cli/test/performance-benchmarks.test.js`)
- **Comprehensive Documentation** - New documentation files:
  - API Documentation (`APIDOC.md`)
  - User Guide (`USERGUIDE.md`)
  - Best Practices (`BESTPRACTICES.md`)
  - Troubleshooting Guide (`TROUBLESHOOTING.md`)
  - Contribution Guidelines (`CONTRIBUTING.md`)
  - Migration Guide (`MIGRATION-GUIDE.md`)
  - Security Guide (`SECURITY.md`)
- **Security Hardening** - Enhanced security measures throughout the system
- **Enhanced CLI Commands** - Added plugin management to existing command structure

### Fixed
- **Redundancy Issues** - Removed duplicate template files while preserving core template in `@ ultra-dex/Saas plan/`
- **Path Validation** - Improved security in file operations to prevent traversal attacks
- **Documentation References** - Updated all references to use new directory structure
- **Example Credentials** - Replaced example passwords with secure placeholder instructions
- **Performance Bottlenecks** - Optimized graph scanning and file processing

### Changed
- **Directory Structure** - Renamed `@ Ultra DeX` to `@ ultra-dex` for consistency
- **Security Practices** - Enhanced validation and sanitization throughout the codebase
- **Performance** - Improved efficiency of graph analysis and file operations
- **Documentation** - Updated README with comprehensive information about new features
- **Maintainability** - Reduced code duplication and improved organization

### Metrics (Verified)
| Metric | Value |
|--------|-------|
| Commands | 46+ (with plugin management) |
| Agents | 17 built-in + extensible via plugins |
| Cursor Rules | 31 |
| Tests | 281+ (with performance benchmarks) |
| Documentation Files | 8+ comprehensive guides |
| ESLint | 0 warnings |

## [3.4.3] - 2026-01-31 - "Professional Polish" Release

### 🎯 Strategic Focus
This release focused on **data accuracy**, **code quality**, and **documentation cleanup**. All metrics verified and corrected across the codebase.

### Added
- **Meta-Orchestrator Agent** - Added to CLI tier system (`cli/lib/swarm/tiers.js`)
  - High-level system coordination & strategy
  - Multi-repo and multi-phase project management
  - 17 agents total (was 16)

### Fixed
- **Agent Registration Bug** - meta-orchestrator was missing from TIERS, AGENTS, and AGENT_DEPENDENCIES
- **Command Count Accuracy** - Updated from "42+" to actual 46 commands
- **Cursor Rules Count** - Updated from "26" to actual 31 rules
- **Agent Count** - Updated from "16" to actual 17 agents across all docs

### Changed
- CLI now has **46 commands** (verified by counting register functions)
- All documentation updated with accurate metrics
- Removed outdated docs/reference/ folder (CLI-REFERENCE.md, CODEMAP.md)

### Metrics (Verified)
| Metric | Value |
|--------|-------|
| Commands | 46 |
| Agents | 17 built-in + marketplace |
| Cursor Rules | 31 |
| Tests | 95/95 (100%) |
| ESLint | 0 warnings |

---

## [3.4.2] - 2026-01-30

### Added
- LangChain Adapter with chain templates
- OpenAI Assistants Sync
- Streaming AI responses (`--stream` flag)
- Agent Marketplace (`ultra-dex agents`)

### Fixed
- WebSocket memory leaks
- fs.watch cleanup on exit
- Version consistency across all files

---

## [3.4.1] - 2026-01-30

### Added
- Provider ecosystem integration
- Community agents: @SecurityAuditor, @Accessibility, @APIDesigner, @MLEngineer

---

## [3.4.0] - 2026-01-30

### Added
- Advanced monitoring system (metrics, health, debug)
- sync --brain for autonomous CONTEXT.md updates
- State file locking for parallel swarm

---

## [3.3.0] - 2026-01-30 - "Survival Mode" Release

### 🎯 Strategic Vision
This release transforms Ultra-Dex from a static orchestration framework into an **indispensable AI development platform**. Following the 2026 AI landscape analysis, we've added the critical features needed to compete with Claude Code, Devin, and Cursor Agent.

### Added

#### 🐳 Code Execution Sandbox (`ultra-dex exec`)
- **Docker-based isolated execution** - Run generated code safely
- Multi-language support: JavaScript, TypeScript, Python, Go, Rust, Ruby
- Resource limits (memory, CPU, timeout)
- Network isolation option
- Test runner integration: `ultra-dex exec --test`

#### 🐙 GitHub Integration (`ultra-dex github`)
- **Issue → Task conversion** - Sync GitHub issues to Ultra-Dex tasks
- **Auto-PR creation** - Create PRs from swarm output
- Label-to-agent mapping (frontend → @Frontend, etc.)
- PR status tracking and CI integration
- Webhook support for real-time sync

#### 🔍 Enhanced Semantic Search (`ultra-dex search`)
- Vector embeddings for codebase understanding
- "Find where auth is handled" style queries
- Code structure extraction (functions, classes, imports)
- Local TF-IDF fallback when no API key available
- Persistent index with auto-rebuild

#### 🤖 Anthropic Agent SDK Integration
- **True autonomous agents** with tool use
- Agentic loops with iteration limits
- Tool execution: read_file, write_file, search_code, run_command
- Delegation between agents
- Checkpoint/rollback support
- Browser automation via browse_web tool

#### 🌐 Browser Automation (Playwright)
- Research agent can now browse the web
- Screenshot capture for visual testing
- Page content extraction (text, links, headings)
- Google search integration
- Documentation fetching from common sources

#### 🔌 MCP Client Hub
- **Consume external MCP servers** (GitHub, Slack, Postgres, etc.)
- Connect to any MCP-compatible tool
- Real-time state synchronization
- Multi-server connection management

#### ☁️ Cloud Dashboard (`ultra-dex cloud`)
- **Team collaboration** via WebSocket sync
- Session management with team support
- Real-time agent status across team members
- Swarm event broadcasting
- API server for external integrations

#### 💻 VS Code Extension v3.3.0
- 10 new commands (exec, search, swarm, cloud, etc.)
- Configuration options for kernel and sandbox
- Keyboard shortcuts (Cmd+Shift+A for agents)
- Context menu integration
- Marketplace-ready with proper metadata

### Changed
- CLI version bumped to **3.3.0**
- CLI now has **42+ commands**
- Added 5 new optional dependencies
- Updated all documentation

### Technical
- New files: `exec.js`, `github.js`, `cloud.js`, `agent-sdk.js`, `browser.js`, `client.js`
- VS Code extension updated with marketplace metadata
- MCP client architecture for consuming external servers

---

## [3.2.0] - 2026-01-30

### Added
- **🏗️ Scaffold Command** - `ultra-dex scaffold <template>` generates production boilerplate
  - Templates: next15-prisma-clerk, remix-supabase, sveltekit-drizzle
  - Generates actual .tsx, .ts, .prisma files (not just markdown)
- **📝 Production Code Patterns** - Ready-to-use 2026 patterns in `cli/lib/templates/code/`
  - `server-actions.ts` - Next.js 15 Server Actions with useActionState
  - `prisma-schema.prisma` - Full multi-tenant schema with RLS support
  - `clerk-middleware.ts` - Complete Clerk auth middleware
  - `trpc-router.ts` - Type-safe tRPC router example
  - `rls-policies.sql` - PostgreSQL Row-Level Security policies
- **🎯 5 New Cursor Rules** (13-17) for 2026 patterns:
  - `13-ai-integration.mdc` - Vercel AI SDK, streaming, tool use
  - `14-server-components.mdc` - Server vs Client component decisions
  - `15-server-actions.mdc` - Form handling with Server Actions
  - `16-edge-middleware.mdc` - Auth, rate limiting, geolocation
  - `17-streaming-ssr.mdc` - Suspense and streaming patterns
- **📖 Philosophy Section** - "Your Skeleton, Not Your Cage" added to README
- **📚 HOW-TO-USE Guide** - `docs/02-HOW-TO-USE.md` with phased approach
- **🎨 Professional Purple Theme** - Clean indigo-to-pink gradient interface
- **🔧 Enhanced Doctor Command** - MCP port, config source, AI provider scan
- **📊 Extended Dashboard** - Real-time agent status and timeline
- **🧠 Memory Command** - Persistent agent memory management
- **👥 Team Command** - Team collaboration workflows

### Changed
- CLI now has **38+ commands** (added scaffold)
- Cursor rules increased to **18 modules** (added 13-17)
- Updated README badges to reflect new counts
- Improved error messages and user feedback

---

## [3.1.0] - 2026-01-27

### Added
- **🪐 Doomsday Theme** - Matrix-green CLI mode with `--doomsday` flag
- **🔄 Auto-Implement Command** - Fully autonomous feature implementation
- **🛠️ CI Monitor** - Self-healing CI/CD webhook listener
- **📦 Export Command** - Export project context to JSON/HTML/Markdown/PDF
- **⬆️ Upgrade Command** - Check and install CLI updates
- **⚙️ Config Command** - Generate MCP, Cursor, and VS Code configurations

### Changed
- Major CLI architecture refactor - modular command structure
- All commands now in `lib/commands/` with utilities in `lib/utils/`
- Added MCP SDK integration for Claude Desktop

---

## [3.0.0] - 2026-01-28

### Added
- **🪐 Unified Active Kernel** - `ultra-dex serve` now serves the Dashboard, MCP API, and WebSocket Stream from a single process.
- **🧠 Graph-Augmented Swarms** - Agents now receive a structural map of the codebase via the Code Property Graph (CPG) during swarms.
- **⚖️ Executable Verification** - `ultra-dex verify [task]` runs the 21-Step Verification Framework using structural analysis and AI.
- **🚦 AI Quality Gate** - `ultra-dex pre-commit --ai` runs an automated architectural review of staged changes before allowing a commit.
- **📈 Live Swarm Tracking** - Dashboard now shows active agent status and swarm progress in real-time.

### Changed
- Major version jump to 3.0.0 reflecting the transition to a fully AI-native "God Mode" architecture.

### Documentation
- **📚 CLI Reference** - Added `docs/CLI-REFERENCE.md` with comprehensive command documentation.
- **CONTRIBUTING.md** - Added CLI development setup, testing, and code style guidelines.
- **README.md** - Added CI status badge and terminal visual placeholder.

---

## [2.4.1] - 2026-01-28 (Internal)

### Documentation
- General polish and consistency improvements.

---

## [2.4.0] - 2026-01-27

### Added
- **🐝 `ultra-dex swarm`** - Autonomous agent pipeline
- **👁️ `ultra-dex watch`** - Auto-update on file changes
- **📊 `ultra-dex diff`** - Plan vs code comparison
- **📦 `ultra-dex export`** - Export to JSON/HTML/Markdown
- **⬆️ `ultra-dex upgrade`** - Check for updates
- **⚙️ `ultra-dex config --mcp`** - Generate Claude Desktop config
- **📊 `ultra-dex dashboard` Command** - Local web dashboard
  - Real-time project status visualization
  - Shows alignment score, agents, state, and metrics
  - Auto-refresh with configurable interval
  - Accessible at http://localhost:3002

### Changed
- Total CLI commands: 28+
- Version bump to 2.4.0
  - Detects missing/found features
  - Shows completion percentage
  - Exit codes for CI/CD integration

- **📦 `ultra-dex export` Command** - Export project to various formats
  - JSON format for machine processing
  - Markdown format for documentation
  - HTML format for standalone reports
  - Custom output path with `--output`

- **⬆️ `ultra-dex upgrade` Command** - Self-upgrade CLI
  - `--check` - Check for updates only
  - `--force` - Force reinstall
  - Shows current vs latest version

### Changed
- CLI version bumped to 2.4.0
- All advanced commands now available

---

## [2.3.0] - Unreleased

### Added
- Tests coverage and CLI test suite expansions.
- Team CLI workflows for member management.
- Agent Builder for custom agent prompts.
- Landing page updates for v2.3.0 launch.

---

## [2.3.0] - 2026-01-27

### Added
- **🩺 `ultra-dex doctor` Command** - Diagnose setup and configuration
  - Checks Node.js, Git, AI providers, project structure
  - Validates git hooks and configuration
  - Provides actionable suggestions

- **⚙️ `ultra-dex config` Command** - Manage configuration
  - `--list` - Show all settings
  - `--get <key>` / `--set <key=value>` - Read/write settings
  - `--mcp` - Generate MCP config for Claude Desktop
  - `--init` - Create new config file
  - `--global` - Use global config (~/.ultra-dex.json)

- **📁 `.ultra-dex.json`** - Project configuration file
  - Set default provider, model, minimum score
  - Configure MCP server port
  - Toggle pre-commit/pre-push hooks

- **🔧 VS Code Integration Templates**
  - `templates/vscode-settings.json` - Editor settings
  - `templates/vscode-tasks.json` - Quick tasks for Ultra-Dex commands

### Changed
- CLI version bumped to 2.3.0

---

## [2.2.0] - 2026-01-27

### Added
- **🤖 `ultra-dex run <agent>` Command** - Execute agent tasks automatically
  - Run any agent with AI: `ultra-dex run planner --task "Build auth"`
  - Chain agents: `--chain backend,testing`
  - Dry-run mode to preview prompts
  - Output to file with `--output`

- **🐝 `ultra-dex swarm <feature>` Command** - Full agent orchestration
  - Runs @Planner → @CTO pipeline automatically
  - Task breakdown + architecture review
  - `--plan-only` for just task breakdown

- **📋 GitHub Actions Template** (`templates/github-actions-workflow.yml`)
  - Automatic alignment checks on PRs
  - Comments PR with score
  - Optional AI-powered review job

- **🔧 Cursor IDE Integration** (`templates/cursorrules-template.md`)
  - Agent role definitions
  - Code standards
  - Quick command reference
  - MCP server integration

### Changed
- CLI version bumped to 2.2.0
- Version now shows 2.2.0 in `--version` output

---

## [2.1.0] - 2026-01-27

### Added
- **🔧 `ultra-dex build` Command** - AI-assisted development with auto-loaded context
  - Interactive agent selection (10 specialized agents across 4 tiers)
  - Auto-loads CONTEXT.md and IMPLEMENTATION-PLAN.md
  - Generates ready-to-paste prompts with full context
  - `--copy` to clipboard, `--cursor` to open in Cursor IDE
  
- **🔍 `ultra-dex review` Command** - AI-powered code review
  - Quick structure check with `--quick`
  - Full AI analysis with Claude/OpenAI/Gemini
  - Alignment scoring and section breakdown
  - JSON output mode (`--json`)

- **📊 `ultra-dex align` Command** - One-liner alignment check
  - Instant score with emoji indicator (✅ ⚠️ ❌)
  - `--strict` flag exits with error if score < 70
  - Perfect for CI/CD pipelines

- **🚦 `ultra-dex pre-commit` Command** - Git pre-commit hook
  - `--install` creates .git/hooks/pre-commit
  - Blocks commits if alignment score < 70
  - Enforces quality automatically

- **📡 Enhanced MCP Server** (`ultra-dex serve`)
  - New endpoints: `/state`, `/score`, `/agents`, `/agent/:name`, `/refresh`
  - CORS headers for browser/tool access
  - Auto-generates state on first request

- **📁 `.ultra/state.json`** - Machine-readable project state
  - Version, score, files, sections tracked
  - Generated by `ultra-dex state --init`
  - Auto-updated by watch mode

- **👁️ `ultra-dex status`** - Visual project dashboard
  - Shows score, files, sections at a glance
  - `--json` for programmatic access
  - `--refresh` to update state first

- **⌚ `ultra-dex watch`** - Auto-update state on changes
  - Watches CONTEXT.md, IMPLEMENTATION-PLAN.md, CHECKLIST.md
  - Updates .ultra/state.json on changes
  - Shows score trends (📈📉)

### Addresses "2026 Reality Check" Criticism
- **"Human Middleware"** → `build` auto-loads context, no copy-paste needed
- **"No Enforcement"** → `pre-commit` blocks bad commits automatically
- **"Static Checklists"** → `align` gives instant CI/CD-friendly scores
- **"Manual Friction"** → MCP server provides live context to AI tools
- **"Markdown State"** → `.ultra/state.json` is machine-readable
- **"Prompts not Swarms"** → `run` and `swarm` commands execute agents automatically

---
- Enhanced build command replaces placeholder
- Enhanced review command replaces placeholder
- All v2 roadmap commands now implemented

### Addresses Review Criticism
This release directly addresses the "2026 Reality Check" review criticisms:
- ✅ **"Human Middleware"** → `build` command auto-loads context, no copy-paste needed
- ✅ **"Static Prompts"** → Prompts are now dynamically generated with project context
- ✅ **"No Enforcement"** → `review` command provides automated alignment checking
- ✅ **"Markdown Rot"** → `review --quick` detects stale/missing structure

---

## [2.0.1] - 2026-01-27

### Added
- **🚀 `ultra-dex generate` Command** - AI-powered implementation plan generation
  - Transform a one-sentence idea into a complete 34-section implementation plan
  - Multi-provider support: Claude, OpenAI, Gemini
  - Streaming output with real-time progress feedback
  - Cost estimation before generation (`--dry-run`)
  - Generates: IMPLEMENTATION-PLAN.md, QUICK-START.md, CONTEXT.md
- **AI Provider Infrastructure** (`cli/lib/providers/`)
  - `base.js` - Abstract provider interface
  - `claude.js` - Claude (Anthropic) integration
  - `openai.js` - OpenAI GPT integration
  - `gemini.js` - Google Gemini integration
  - `index.js` - Provider factory and selection
- **Prompt Engineering** (`cli/lib/templates/prompts/`)
  - `system-prompt.md` - Expert SaaS architect instructions
  - `section-prompts.js` - 34-section structure templates
- **Utility Modules** (`cli/lib/utils/`)
  - `prompt-builder.js` - Prompt assembly and cost estimation
  - `parser.js` - Response parsing and validation
- **Configuration Files**
  - `.env.example` - API key configuration template
- **Live Scaffold Presets** - `ultra-dex init --live`
  - `next15-prisma-clerk`, `remix-supabase`, `sveltekit-drizzle`
- **`ultra-dex sync`** - Auto-sync CONTEXT.md with codebase snapshot
- **MCP Metadata** - `/context` now returns protocol metadata

### Changed
- CLI version bumped to 2.0.1
- `package.json` updated with optional AI SDK dependencies
- Added `"type": "module"` for ES module support
- `lib/` folder now included in npm package

### Upgrade Guide
```bash
# Install with AI support
npm install ultra-dex

# Configure API key (choose one)
export ANTHROPIC_API_KEY=your-key  # Claude (recommended)
export OPENAI_API_KEY=your-key     # OpenAI
export GOOGLE_AI_KEY=your-key      # Gemini

# Generate a plan
npx ultra-dex generate "A task management SaaS for remote teams"
```

---

## [1.8.0] - 2026-01-27

### Added
- **Cursor Rules Code Examples** - All 13 cursor-rules/*.mdc files now include:
  - Before/after fintech code examples (transactions, payments, compliance)
  - Before/after healthcare code examples (HIPAA, patient data, audit logs)
  - Bad→Good transformation patterns for each domain
- **CLI Modular Architecture** - Refactored cli/bin/ultra-dex.js into:
  - `cli/lib/commands/` - Individual command modules
  - `cli/lib/utils/` - Shared utility functions
  - `cli/lib/config/` - Configuration constants
  - `cli/lib/templates/` - Template generators
- **`ultra-dex init --preview`** - Preview generated files without creating them
- **`ultra-dex serve`** - Serve CONTEXT.md and plan over HTTP (MCP-compatible)

### Changed
- **AGENT-INSTRUCTIONS.md** - Added deprecation notice, now links to /agents/ tier structure
- **00-AGENT_INDEX.md** - Enhanced with template-section mapping
- **CLI Error Handling** - Improved error messages with context
- **Documentation** - Updated QUICK-REFERENCE.md, TROUBLESHOOTING.md, TUTORIAL.md

### Fixed
- CLI input validation for project names and file paths
- Hardcoded GitHub URLs replaced with config constants

---

## [1.7.1] - 2026-01-25

### Added
- `docs/BUILD-AUTH-30M.md` - Quick auth tutorial
- `docs/README.md` - Documentation navigation hub
- `guides/AI-RESEARCH.md` - Embeddings, RAG, vector databases
- `cursor-rules/11-nextjs-v15.mdc` - Next.js 15 production patterns
- `cursor-rules/12-multi-tenancy.mdc` - SaaS multi-tenancy patterns
- `agents/0-orchestration/META-ORCHESTRATOR.md` - Agent coordination
- Mermaid flow diagram in README.md
- docs/QUICK-REFERENCE.md linked in Quick Start table
- `ultra-dex init --preview` - Preview files without creating them
- `ultra-dex serve` - Serve CONTEXT.md and plan over HTTP (MCP-compatible)

### Changed
- Reorganized root files to 5 essential files
- Moved 9 files from root to docs/
- Moved AGENT-INSTRUCTIONS.md to agents/
- Updated folder structure diagram in README.md

### Fixed
- Navigation improved with docs hub

---

## [1.7.3] - 2026-01-26

### Added
- **`fetch` Command** - `npx ultra-dex fetch` downloads all assets for offline development
  - Downloads cursor rules (12 .mdc files), agent prompts (16 agents), docs, and guides
  - Supports selective fetching: `--agents`, `--rules`, `--docs`
  - Custom target directory: `--dir <path>` (default: `.ultra-dex`)
  - No GitHub access needed after initial fetch
  - CLI now has 13 commands total

### Changed
- CLI now fully supports offline workflows after initial fetch
- Removed GitHub dependency for repeat usage

---

## [1.7.2] - 2026-01-26

### Added
- **`hooks` Command** - `npx ultra-dex hooks` sets up git pre-commit validation
  - Automatically validates project structure before each commit
  - Blocks commits if required files (QUICK-START.md, IMPLEMENTATION-PLAN.md) are missing
  - Warns about incomplete sections
  - Remove with `npx ultra-dex hooks --remove`
  - Bypass with `git commit --no-verify` (not recommended)

### Changed
- CLI now has 12 commands total (init, audit, examples, agents, agent, pack, hooks, validate, workflow, suggest, help, version)
- Updated agent count to 16 in package.json

---

## [1.7.0] - 2026-01-26 (Legacy)

### Added
- **@Orchestrator Meta-Agent** - New agent that coordinates all 15 agents for complete feature implementation
  - Located in `agents/0-orchestration/orchestrator.md`
  - Provides workflow templates for multi-tier features
  - Includes handoff protocols between agents
- **Multi-Tenancy Cursor Rule** - `cursor-rules/12-multi-tenancy.mdc` with SaaS patterns
  - Row-Level Security (RLS) with Prisma
  - Subdomain-based tenant identification
  - PostgreSQL RLS policies
  - Tenant-scoped database client pattern
- **Next.js 15 Cursor Rule** - `cursor-rules/11-nextjs-v15.mdc` with App Router patterns
  - Server/Client components, Server Actions, Streaming
  - Middleware for auth/tenant, Error boundaries
  - Multi-tenancy patterns, Vercel AI SDK integration
- **Copilot Support** - CLI now generates `.github/copilot-instructions.md` automatically
- **`pack` Command** - `npx ultra-dex pack <agent>` packages context + agent for ANY AI tool
  - Works with Claude, ChatGPT, Gemini, local LLMs
  - Combines agent prompt + CONTEXT.md + IMPLEMENTATION-PLAN.md
- **Visual Flow Diagram** - Mermaid diagram in README showing IDEA → PRODUCTION flow
- **Case Study Template** - `templates/CASE-STUDY-TEMPLATE.md` for documenting real projects
- **Business Model** - Added to ROADMAP (OSS core free forever + optional paid playbooks)
- **Enhanced load.sh v2.0** - Cursor auto-detection, nextjs and tenancy domain support
- **First 10 Minutes Guide** - Quick start path in CLI README

### Changed
- **README Simplified to ONE funnel** - Reduced Quick Start from 15 links to 4-step path
  - Step 1: QUICK-START.md (5 min)
  - Step 2: HOW-TO-USE.md (10 min)
  - Step 3: BUILD-AUTH-30M.md (30 min) ← First working feature
  - Step 4: Start coding
- **CLI Trust Messages Fixed** - Now explains WHY assets aren't bundled (npm size optimization)
  - Shows `npx degit` one-liner commands for quick setup
  - No longer looks like a broken stub
- **Major Repo Restructure**
  - Moved 9 docs to `docs/` folder (ROADMAP, VISION-V2, QUICK-REFERENCE, etc.)
  - Moved AGENT-INSTRUCTIONS.md to `agents/`
  - Moved Orchestration/ to root (was Reviews/Orchestration/)
  - Removed edualc./ folder (project-specific content)
- **Enhanced Agents with Code Examples**
  - @DevOps: Full GitHub Actions CI/CD pipeline, Vercel config, Railway setup, Sentry monitoring
  - @Backend: REST API endpoint examples (Next.js App Router), Service layer, Stripe webhooks
  - @Database: Complete Prisma schema with multi-tenancy, N+1 avoidance, transactions
  - @CTO & @Reviewer: Added decision frameworks (Approve/Reject/Request Changes criteria)
- **CLI Improvements**
  - Fixed version mismatch (1.6.1 → 1.7.1)
  - Asset messages now explain npm size optimization
  - Added `pack` command for tool-agnostic AI context
  - Updated file paths for moved docs

### Added Files
- `agents/0-orchestration/orchestrator.md`
- `cursor-rules/11-nextjs-v15.mdc`
- `cursor-rules/12-multi-tenancy.mdc`
- `templates/CASE-STUDY-TEMPLATE.md`
- `guides/CUSTOM-AGENTS-GUIDE.md` - Template for creating domain-specific agents
- `templates/ORDER-TRACKER-TEMPLATE.md` - Step-by-step execution with copy-paste prompts
- `Reviews/A_New_Review/` - AI review files from Devin, Gemini, Jules, Perplexity

### Fixed
- README had too many entry points - now ONE clear funnel
- CLI "Download from GitHub" messages sounded like broken stub
- Broken Orchestration folder links throughout templates and guides
- .DS_Store removed from git tracking
- CLI paths updated for moved VERIFICATION.md and AGENT-INSTRUCTIONS.md

---

## [1.7.0] - 2026-01-24

### Added
- **6 Advanced Workflow Examples** (3,139 new lines in ADVANCED-WORKFLOWS.md)
  - Example 5: Supabase Authentication Setup (587 lines) - Complete auth with RLS policies, OAuth providers, and Row Level Security
  - Example 6: Vercel Deployment Pipeline (380 lines) - Full deployment pipeline from local to production
  - Example 7: GitHub Actions CI/CD (493 lines) - Automated testing, linting, and deployment
  - Example 8: Sentry Error Tracking (524 lines) - Frontend and backend error monitoring with source maps
  - Example 9: Shopify Product Integration (596 lines) - E-commerce product sync with webhooks
  - Example 10: PostHog Analytics Integration (561 lines) - User behavior tracking and conversion funnels
- **3 Enhanced CLI Commands** (438 new lines in cli/bin/ultra-dex.js)
  - `ultra-dex workflow <feature>` - Display agent workflow for 12 common features (auth, payments, deployment, etc.)
  - `ultra-dex suggest` - Interactive AI agent suggestions based on task type with reasoning
  - `ultra-dex validate` - Validate project structure against Ultra-Dex standards

### Changed
- Updated CLI version from 1.6.1 to 1.7.0
- Expanded workflow examples from 4 to 10 (150% increase)
- Total ADVANCED-WORKFLOWS.md now 3,534 lines (was 395 lines)
- Added 12 workflow definitions to CLI for quick reference

### Success Metrics
- ✅ 10 workflow examples (6 new examples covering Supabase, Vercel, GitHub Actions, Sentry, Shopify, PostHog)
- ✅ Enhanced CLI with 3 new interactive commands
- ✅ Visual diagrams already present (WORKFLOW-DIAGRAMS.md)
- ✅ Transformed Ultra-Dex from framework to comprehensive reference library

---

## [1.6.1] - 2026-01-24

### Added
- **Comprehensive Production Guides** (6 new guides, 3,283 lines, 83 KB)
  - `PROJECT-ORCHESTRATION.md` - Step-by-step multi-agent workflow guide with authentication example
  - `DATABASE-DECISION-FRAMEWORK.md` - PostgreSQL vs MongoDB vs MySQL decision guide
  - `ARCHITECTURE-PATTERNS.md` - 5 architecture patterns from Monolith to Microservices
  - `ADVANCED-WORKFLOWS.md` - 4 real-world examples (Stripe, emails, migrations, real-time)
  - `guides/README.md` - Navigation hub for all guides
- **Enhanced Templates with Documentation**
  - `templates/README.md` - Complete template usage guide
  - `MASTER-PLAN-TEMPLATE.md` - Single-file project overview template (800 lines)
  - `PHASE-TRACKER-TEMPLATE.md` - 5-phase task tracking template (329 lines)
- **Enhanced Agent Documentation**
  - Updated `agents/00-AGENT_INDEX.md` with comprehensive orchestration references
  - Enhanced `agents/README.md` with detailed tier descriptions and use case examples
- **Cross-References** - All guides now link to related guides and agent references
- **CHANGELOG.md** - Version history tracking (this file)

### Changed
- Updated `README.md` with tier-based agent structure and guides/ folder documentation
- Fixed all references from `Reviews/Orchestration` to `Orchestration/` at root level
- Improved agent organization visibility in main README

### Fixed
- Corrected outdated path references in Agent Index
- Fixed Orchestration folder location (moved from Reviews/ to root)

---

## [1.6.0] - 2026-01-23

### Added
- **Tier-Based Agent Organization** - Reorganized 15 agents into 6 production tiers:
  - 1-leadership (CTO, Planner, Research)
  - 2-development (Backend, Frontend, Database)
  - 3-security (Auth, Security)
  - 4-devops (DevOps)
  - 5-quality (Testing, Documentation, Reviewer, Debugger)
  - 6-specialist (Performance, Refactoring)
- **Agent Index** - `agents/00-AGENT_INDEX.md` quick reference table
- **Documentation Agent** - New agent for technical writing and documentation maintenance

### Changed
- Reorganized agent files from flat structure to tier-based directories
- Updated CLI to support tier-based agent discovery
- Updated all agent cross-references to new tier structure

---

## [1.5.0] - 2026-01-23

### Added
- **5 Production-Critical Agents** (expanded from 9 to 14 agents):
  - **@Testing** - QA & test automation (Jest, Playwright, coverage targets)
  - **@Performance** - Performance optimization (page load, API latency, caching)
  - **@Security** - Security audits (OWASP, vulnerability scanning)
  - **@Refactoring** - Code quality improvement (DRY, design patterns, complexity)
  - **@Research** - Technology evaluation & comparison
- **Multi-Tool AI Orchestration**
  - `guides/MULTI-TOOL-WORKFLOW.md` - Coordinate Claude + Cursor + Copilot + ChatGPT + Gemini
  - Shared state via IMPLEMENTATION-PLAN.md and CONTEXT.md
  - Agent handoff protocols between different AI tools
- **AI Decision Framework**
  - `guides/AI-MODEL-SELECTION.md` - Model selection guide with 2026 pricing
  - Cost comparison matrix (Claude Opus/Sonnet/Haiku, GPT-5.2/mini, Llama 3.1)
  - Use case recommendations and hybrid strategy

### Changed
- Updated badge from "9 Agents" to "14 Agents"
- Enhanced multi-tool coordination documentation
- Added cost optimization strategies

---

## [1.4.0] - 2026-01-20

### Added
- **Multi-Agent Orchestration Framework**
  - `Orchestration/README.md` - Agent coordination patterns
  - `Orchestration/EXAMPLES.md` - 3 real-world multi-agent workflows
  - @AgentName handoff protocol
- **Quality Gate Checklists** - Added to all 9 agents
- **"Works With" Sections** - Agent collaboration documentation

### Changed
- All 9 agent files updated with collaboration sections
- README updated with orchestration section

---

## [1.3.0] - 2026-01-18

### Added
- **9 Core AI Agents** - Specialized prompts for production pipeline:
  - @CTO (Architecture & tech stack)
  - @Planner (Task breakdown)
  - @Backend (API & server logic)
  - @Frontend (UI & components)
  - @Database (Schema & queries)
  - @Auth (Authentication & authorization)
  - @DevOps (CI/CD & deployment)
  - @Reviewer (Code review)
  - @Debugger (Bug fixing)
- **CLI Tool** - `npx ultra-dex` command-line interface
  - `init` - Interactive project setup
  - `audit` - Check project completeness
  - `agents` - List AI agent prompts
  - `agent <name>` - Show specific agent
  - `examples` - Show example projects

### Changed
- Reorganized project structure for better AI agent integration

---

## [1.2.0] - 2026-01-15

### Added
- **34-Section Implementation Template** - Comprehensive SaaS planning framework
- **21-Step Verification Framework** - Quality gates for atomic tasks
- **Atomic Task Methodology** - 4-9 hour tasks with realistic estimates
- **3 Complete Examples**:
  - TaskFlow (project management SaaS)
  - InvoiceFlow (invoicing SaaS)
  - HabitStack (habit tracking SaaS)
- **Cursor Rules** - 11 modular AI-optimized rules
  - Database, API, Authentication, Error Handling, Testing, etc.

### Changed
- Restructured documentation for phased approach
- Added overhead calculation (+25% testing, +10% review)

---

## [1.1.0] - 2026-01-10

### Added
- **Quick Start Guide** - 5-minute project setup
- **Methodology Documentation** - Detailed explanation of framework
- **How to Use Guide** - Phased approach and workflows
- **Template Supplementary Files**:
  - CONTEXT-TEMPLATE.md
  - STATUS-TEMPLATE.md
  - CONSTRAINTS-TEMPLATE.md
  - INTEGRATIONS-TEMPLATE.md
  - CHANGELOG-TEMPLATE.md

---

## [1.0.0] - 2026-01-05

### Added
- Initial release of Ultra-Dex
- Core philosophy: "Your Skeleton, Not Your Cage"
- Basic implementation template structure
- Foundation for AI-driven development workflow

---

## Version History Summary

| Version | Date | Key Feature | Agents | Guides | Templates |
|---------|------|-------------|--------|--------|-----------|
| **1.7.1** | 2026-01-26 | Multi-tenancy + Copilot + pack | 16 | 6 | 4 |
| **1.7.0** | 2026-01-24 | Workflow Examples + CLI | 15 | 6 (10 examples) | 2 |
| **1.6.1** | 2026-01-24 | Production Guides | 15 | 6 | 2 |
| **1.6.0** | 2026-01-23 | Tier-Based Organization | 15 | 2 | 2 |
| **1.5.0** | 2026-01-23 | Multi-Tool Orchestration | 14 | 2 | 0 |
| **1.4.0** | 2026-01-20 | Agent Orchestration | 9 | 0 | 0 |
| **1.3.0** | 2026-01-18 | AI Agents + CLI | 9 | 0 | 0 |
| **1.2.0** | 2026-01-15 | 34-Section Template | 0 | 0 | 1 |
| **1.1.0** | 2026-01-10 | Quick Start + Docs | 0 | 0 | 6 |
| **1.0.0** | 2026-01-05 | Initial Release | 0 | 0 | 1 |

---

## Upgrade Guide

### From 1.7.0 to 1.7.1

**New Features:**
- **@Orchestrator Meta-Agent** - Coordinates all 15 agents for complete features
- **Multi-Tenancy Cursor Rule** - `cursor-rules/12-multi-tenancy.mdc` with SaaS patterns
- **Copilot Support** - CLI generates `.github/copilot-instructions.md` automatically
- **`pack` Command** - `npx ultra-dex pack <agent>` for tool-agnostic AI context

**README Simplified:**
- One clear onboarding funnel: QUICK-START → HOW-TO-USE → BUILD-AUTH-30M → Code
- Reduced Quick Start from 15 links to 4 steps
- Full resources in collapsible section

**Action Required:**
- None - Fully backward compatible

**Recommended:**
- Use `npx ultra-dex pack backend` to package context for any AI tool
- Load `12-multi-tenancy.mdc` if building SaaS with tenant isolation
- Try `@Orchestrator` agent for features spanning multiple tiers

---

### From 1.6.1 to 1.7.0

**New Workflow Examples:**
- 6 comprehensive SaaS integration examples added to `guides/ADVANCED-WORKFLOWS.md`
- Examples cover: Supabase auth, Vercel deployment, GitHub Actions, Sentry, Shopify, PostHog

**New CLI Commands:**
- `ultra-dex workflow <feature>` - Quick reference for 12 common workflows
- `ultra-dex suggest` - Interactive agent selection helper
- `ultra-dex validate` - Project structure validation

**Action Required:**
- None - Fully backward compatible
- Run `npx ultra-dex workflow auth` to see new workflow reference format
- Run `npx ultra-dex suggest` to get AI agent recommendations for your task

**Recommended:**
- Review new workflow examples for copy-pasteable integration patterns
- Use `ultra-dex workflow` command for quick agent workflow reference

### From 1.6.0 to 1.6.1

**New Files:**
- `guides/` folder with 6 comprehensive guides
- `guides/README.md` - Navigation hub
- `templates/README.md` - Template usage guide
- `CHANGELOG.md` - This file

**Changed Files:**
- `README.md` - Added guides section
- `agents/00-AGENT_INDEX.md` - Updated orchestration references
- `agents/README.md` - Enhanced tier descriptions

**Action Required:**
- Update any hardcoded references to `Reviews/Orchestration` → `Orchestration/`
- Read new guides for improved workflow understanding

### From 1.5.0 to 1.6.0

**Breaking Changes:**
- Agent files moved from flat structure to tier-based directories
- Example: `agents/cto.md` → `agents/1-leadership/cto.md`

**Action Required:**
- Update agent file references in your scripts/tools
- CLI handles tier structure automatically (no changes needed for `npx ultra-dex`)

### From 1.4.0 to 1.5.0

**New Agents:**
- @Testing, @Performance, @Security, @Refactoring, @Research

**New Files:**
- `guides/MULTI-TOOL-WORKFLOW.md`
- `guides/AI-MODEL-SELECTION.md`

**Action Required:**
- Review multi-tool workflow guide for cost optimization strategies
- Consider adding new agents to your workflow

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to contribute to Ultra-Dex.

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

*Ultra-Dex - Professional AI Orchestration Meta Layer for Production SaaS Development*
