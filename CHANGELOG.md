# Changelog

All notable changes to Ultra-Dex will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.7.1] - 2026-01-25

### Added
- **@Orchestrator Meta-Agent** - New agent that coordinates all 15 agents for complete feature implementation
  - Located in `agents/0-orchestration/orchestrator.md`
  - Provides workflow templates for multi-tier features
  - Includes handoff protocols between agents
- **Visual Flow Diagram** - Mermaid diagram in README showing IDEA → PRODUCTION flow
- **Next.js 15 Cursor Rule** - `cursor-rules/11-nextjs-v15.mdc` with App Router patterns
  - Server/Client components, Server Actions, Streaming
  - Middleware for auth/tenant, Error boundaries
  - Multi-tenancy patterns, Vercel AI SDK integration
- **Enhanced load.sh v2.0** - Cursor auto-detection and nextjs domain support
- **First 10 Minutes Guide** - Quick start path in CLI README

### Changed
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
  - Fixed version mismatch (1.6.1 → 1.7.0)
  - Softer asset messaging (gray info instead of yellow warnings)
  - Updated file paths for moved docs

### Added Files
- `agents/0-orchestration/orchestrator.md`
- `cursor-rules/11-nextjs-v15.mdc`
- `guides/CUSTOM-AGENTS-GUIDE.md` - Template for creating domain-specific agents
- `templates/ORDER-TRACKER-TEMPLATE.md` - Step-by-step execution with copy-paste prompts
- `Reviews/A_New_Review/` - AI review files from Devin, Gemini, Jules, Perplexity

### Fixed
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
