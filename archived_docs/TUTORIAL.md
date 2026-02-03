# Ultra-Dex Complete Tutorial

## Table of Contents
1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Project Initialization](#project-initialization)
5. [Generating Implementation Plans](#generating-implementation-plans)
6. [Working with AI Agents](#working-with-ai-agents)
7. [Building Features](#building-features)
8. [Reviewing & Validating](#reviewing--validating)
9. [Advanced Features](#advanced-features)
10. [Best Practices](#best-practices)

## Introduction

Ultra-Dex is an AI orchestration meta-layer that provides structure, memory, and architectural context for AI assistants. Rather than writing code for you, it makes your AI assistants dramatically smarter by giving them structure and context.

### Core Philosophy: "Your Skeleton, Not Your Cage"
- Ultra-Dex provides a comprehensive 34-section template to prevent "forgot to plan X" syndrome
- The system is 100% flexible - add, remove, or modify any section to fit your needs
- Each section is designed to be atomic (4-9 hour tasks) with realistic estimates
- The 21-step verification framework ensures production-grade quality

## Prerequisites

Before getting started, ensure you have:

### System Requirements
- **Node.js**: Version 18 or higher
- **Git**: Version control system
- **Operating System**: macOS, Linux, or Windows with WSL2

### AI Provider Account
Choose one or more AI providers:
- Anthropic API key (Claude) - Recommended
- OpenAI API key (GPT-4, GPT-4 Turbo)
- Google AI key (Gemini)

### Recommended Setup
- VS Code or Cursor IDE
- Git client
- Terminal/shell access

## Installation

### Option 1: Global Installation (Recommended)
```bash
npm install -g ultra-dex
```

### Option 2: npx (No Installation Required)
```bash
npx ultra-dex --help
```

### Verify Installation
```bash
ultra-dex --version
# Should output: Ultra-Dex v3.4.5
```

## Project Initialization

### Step 1: Set Up Your AI Provider
```bash
# For Claude (recommended)
export ANTHROPIC_API_KEY=your-key-here

# For OpenAI
export OPENAI_API_KEY=your-key-here

# For Google Gemini
export GOOGLE_AI_KEY=your-key-here
```

### Step 2: Create Your Project Directory
```bash
mkdir my-awesome-saas
cd my-awesome-saas
```

### Step 3: Initialize Ultra-Dex Project
```bash
ultra-dex init
```

Follow the interactive prompts:
1. Enter your project name
2. Describe your core idea in one sentence
3. Identify your target audience
4. Define the primary problem you're solving
5. Choose your tech stack preferences
6. Select optional features (Cursor rules, documentation, etc.)

The initialization creates:
```
my-awesome-saas/
├── QUICK-START.md         # Quick overview of your project
├── CONTEXT.md             # Detailed project context
├── IMPLEMENTATION-PLAN.md # 34-section implementation plan
├── docs/
│   ├── CHECKLIST.md       # 21-step verification checklist
│   └── AI-PROMPTS.md      # AI agent instructions
└── .cursor/rules/         # (Optional) Cursor AI rules
```

## Generating Implementation Plans

### Step 1: Generate Complete Plan
```bash
ultra-dex generate "A task management SaaS for remote teams"
```

This command:
- Sends your idea to the AI provider
- Generates a complete 34-section implementation plan
- Saves it to IMPLEMENTATION-PLAN.md
- Creates a detailed roadmap with atomic tasks

### Step 2: Review the Generated Plan
Open IMPLEMENTATION-PLAN.md and review:
- Each of the 34 sections
- Task breakdowns and estimates
- Technical decisions and architecture
- Security and performance considerations

### Step 3: Customize the Plan
Modify the plan to better fit your specific requirements:
- Add or remove features
- Adjust technical decisions
- Modify task estimates
- Update acceptance criteria

## Working with AI Agents

### Understanding the Agent System
Ultra-Dex includes 17 specialized AI agents organized into 6 tiers:

#### Tier 1: Leadership
- **@CTO**: Architecture & tech stack decisions
- **@Planner**: Task breakdown & sprint planning
- **@Research**: Technology evaluation & comparison

#### Tier 2: Development
- **@Backend**: API & server implementation
- **@Frontend**: UI & component implementation
- **@Database**: Schema design & query optimization

#### Tier 3: Security
- **@Auth**: Authentication & authorization
- **@Security**: Security audits & vulnerability fixes

#### Tier 4: DevOps
- **@DevOps**: Deployment & infrastructure

#### Tier 5: Quality
- **@Testing**: QA & test automation
- **@Documentation**: Technical writing & docs maintenance
- **@Reviewer**: Code review & quality checks
- **@Debugger**: Bug investigation & fixes

#### Tier 6: Specialist
- **@Performance**: Performance optimization
- **@Refactoring**: Code quality & design patterns

### Using Agents

#### Interactive Agent Selection
```bash
ultra-dex build
```
This command presents an interactive menu to select the appropriate agent for the next task.

#### Direct Agent Execution
```bash
ultra-dex run backend --task "Create user authentication API"
ultra-dex run frontend --task "Build login form component"
ultra-dex run database --task "Design user schema"
```

#### Multi-Agent Swarms
```bash
ultra-dex swarm "Implement user profile feature"
```
This orchestrates multiple agents to work together on a complex feature.

## Building Features

### The Build Process
The `build` command executes the next pending task from your implementation plan:

```bash
ultra-dex build
```

This process:
1. Reads your IMPLEMENTATION-PLAN.md
2. Identifies the next pending task
3. Selects the appropriate AI agent
4. Executes the task with proper context
5. Updates the plan when complete

### Atomic Task Methodology
Each task should be:
- **Atomic**: Focused on a single responsibility
- **Testable**: Has clear acceptance criteria
- **Time-boxed**: 4-9 hours to complete
- **Verifiable**: Can be checked against the plan

### Example Workflow
1. **Identify Task**: Find the next task in your plan
2. **Select Agent**: Choose the appropriate agent (@Backend for APIs, @Frontend for UI, etc.)
3. **Provide Context**: Ensure the agent has proper context from your plan
4. **Execute**: Run the task with `ultra-dex build` or `ultra-dex run`
5. **Verify**: Check the output against your plan
6. **Update**: Mark the task as complete in your plan

## Reviewing & Validating

### Code Review
```bash
ultra-dex review
```
This command reviews your code against the implementation plan using AI.

### Project Validation
```bash
ultra-dex validate
```
Checks your project structure against Ultra-Dex standards.

### Alignment Check
```bash
ultra-dex align
```
Measures how well your code aligns with your plan.

### 21-Step Verification
Use the 21-step checklist in docs/CHECKLIST.md to verify each task:
1. Atomic Scope Defined
2. Context Loaded
3. Architecture Alignment
4. Security Patterns Applied
5. Type Safety Check
6. Error Handling Strategy
7. API Documentation Updated
8. Database Schema Verified
9. Environment Variables Set
10. Implementation Complete
11. Console Logs Removed
12. Edge Cases Handled
13. Performance Check
14. Accessibility (A11y) Check
15. Cross-browser Check
16. Unit Tests Passed
17. Integration Tests Passed
18. Linting & Formatting
19. Code Review Approved
20. Migration Scripts Ready
21. Deployment Readiness

## Advanced Features

### MCP Integration
Start the Model Context Protocol server:
```bash
ultra-dex serve
```

This enables:
- Claude Desktop integration
- Real-time project context
- WebSocket updates
- Dashboard access

### Dashboard Access
```bash
ultra-dex dashboard
```
Provides real-time visualization of:
- Project progress
- Agent status
- Task completion
- Alignment scores

### Plugin System
Manage plugins:
```bash
ultra-dex plugin list          # List installed plugins
ultra-dex plugin install <path> # Install a plugin
ultra-dex plugin uninstall <name> # Uninstall a plugin
```

### Configuration Management
```bash
ultra-dex config --show        # Show current configuration
ultra-dex config --mcp         # Generate MCP config for Claude Desktop
ultra-dex config --cursor      # Generate Cursor rules
ultra-dex config --vscode      # Generate VS Code settings
```

## Best Practices

### 1. Start with a Clear Vision
- Define your project's core purpose in a single sentence
- Identify your target audience and their specific needs
- Document the primary, secondary, and tertiary problems you're solving
- Establish success metrics for your project

### 2. Iterate in Small Steps
- Use `ultra-dex build` to work on one task at a time
- Validate progress regularly with `ultra-dex validate`
- Review code against plans with `ultra-dex review`
- Commit frequently with descriptive messages

### 3. Leverage the Agent System
- Use the appropriate agent for each task (@Backend for APIs, @Frontend for UI, etc.)
- Leverage @Planner for task breakdown and @CTO for architecture decisions
- Use @Reviewer for code quality checks
- Employ @Testing for automated test generation

### 4. Maintain Quality Standards
- Apply the 21-step verification framework to every task
- Keep your implementation plan updated
- Regularly run validation checks
- Monitor alignment scores

### 5. Secure Your Credentials
- Never commit API keys or other sensitive information to version control
- Use environment variables for all sensitive data
- Implement proper secret rotation policies
- Use secure vault solutions for production deployments

### 6. Document Decisions
- Keep CONTEXT.md updated with evolving requirements
- Document architectural decisions in your plan
- Record trade-offs and reasoning
- Maintain a changelog of significant changes

## Troubleshooting

### Common Issues

#### API Key Issues
**Problem**: Getting errors about missing or invalid API keys
**Solution**: 
```bash
# Verify your API key is set
echo $ANTHROPIC_API_KEY

# Ensure no extra spaces or quotes
export ANTHROPIC_API_KEY=your-actual-key-here
```

#### Command Not Found
**Problem**: Getting "command not found: ultra-dex"
**Solution**:
```bash
# Reinstall globally
npm uninstall -g ultra-dex
npm install -g ultra-dex
```

#### Slow Performance
**Problem**: Commands taking too long to execute
**Solution**:
- Check your internet connection
- Verify your AI provider API is responding normally
- Close other bandwidth-intensive applications
- Consider using a different AI provider if one is slow

## Next Steps

After completing this tutorial:
1. Start with a simple project to practice the workflow
2. Experiment with different AI agents
3. Try the swarm command for multi-agent coordination
4. Explore the dashboard and monitoring features
5. Create your first plugin to extend functionality
6. Join the community to share your experiences

## Support

If you encounter issues:
1. Check the troubleshooting guide in docs/TROUBLESHOOTING.md
2. Look for similar issues in the GitHub repository
3. Ask for help in the community forums
4. Submit an issue on GitHub if you believe you've found a bug

---

*Congratulations! You now have a complete understanding of Ultra-Dex and how to use it effectively for AI-assisted development.*