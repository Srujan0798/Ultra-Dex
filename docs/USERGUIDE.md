# Ultra-Dex User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Core Commands](#core-commands)
4. [AI Agents](#ai-agents)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites
- Node.js 18 or higher
- Git
- An AI provider account (Anthropic, OpenAI, or Google Gemini)

### Installation
```bash
npm install -g ultra-dex
```

### Quick Start
1. Initialize a new project:
   ```bash
   ultra-dex init
   ```

2. Generate an implementation plan:
   ```bash
   ultra-dex generate "My awesome SaaS idea"
   ```

3. Start building:
   ```bash
   ultra-dex build
   ```

## Project Structure

When you initialize a new Ultra-Dex project, the following structure is created:

```
my-project/
├── QUICK-START.md         # Quick start guide for your project
├── CONTEXT.md             # Project context and requirements
├── IMPLEMENTATION-PLAN.md # Detailed implementation plan
├── docs/
│   ├── CHECKLIST.md       # 21-step verification checklist
│   └── AI-PROMPTS.md      # AI agent prompts
├── .cursor/rules/         # (Optional) Cursor IDE rules
└── .agents/               # (Optional) AI agent configurations
```

### Key Files Explained

- **QUICK-START.md**: A quick overview of your project and next steps
- **CONTEXT.md**: Detailed project context, requirements, and constraints
- **IMPLEMENTATION-PLAN.md**: A comprehensive 34-section plan for your project

## Core Commands

### `ultra-dex init`
Creates a new Ultra-Dex project with the required structure.

**Options:**
- `-n, --name <name>`: Specify the project name
- `-d, --dir <directory>`: Output directory (default: current directory)
- `--preview`: Preview what files will be created without creating them
- `--live`: Generate a runnable scaffold with a specific stack
- `--stack <preset>`: Choose a preset stack (next15-prisma-clerk, remix-supabase, sveltekit-drizzle)

### `ultra-dex generate [idea]`
Generates a full 34-section implementation plan from your idea using AI.

**Options:**
- `-p, --provider <provider>`: AI provider (claude, openai, gemini)
- `-m, --model <model>`: Specific model to use
- `-o, --output <directory>`: Output directory (default: current directory)
- `-k, --key <apiKey>`: API key (or use environment variable)
- `--stream`: Stream output in real-time (default: true)

### `ultra-dex build`
Executes the next pending task from your implementation plan using AI agents.

**Options:**
- `-p, --provider <provider>`: AI provider
- `-k, --key <apiKey>`: API key
- `--dry-run`: Preview the task without executing

### `ultra-dex review`
Reviews your code against the implementation plan using AI.

**Options:**
- `-d, --dir <directory>`: Directory to review (default: current directory)
- `-p, --provider <provider>`: AI provider (claude, openai, gemini)
- `-k, --key <apiKey>`: API key
- `--quick`: Quick review without AI (checks file structure only)
- `--json`: Output as JSON

### `ultra-dex serve`
Starts the Active Kernel (MCP server, WebSocket, and Dashboard).

**Options:**
- `-p, --port <port>`: Port to listen on (default: 3001)
- `--stdio`: Run in Stdio mode (MCP Standard Only)

### `ultra-dex swarm <task>`
Runs an autonomous agent pipeline to complete a task.

**Options:**
- `--dry-run`: Show pipeline without executing
- `--parallel`: Run implementation tier agents in parallel

### `ultra-dex validate`
Validates your project structure against Ultra-Dex standards.

**Options:**
- `-d, --dir <directory>`: Project directory to validate (default: current directory)
- `--scan`: Run deep code quality scan

## AI Agents

Ultra-Dex includes 17 specialized AI agents organized into 6 tiers:

### Tier 1: Leadership
- **@CTO**: Architecture & tech stack decisions
- **@Planner**: Task breakdown & sprint planning
- **@Research**: Technology evaluation & comparison

### Tier 2: Development
- **@Backend**: API & server implementation
- **@Frontend**: UI & component implementation
- **@Database**: Schema design & query optimization

### Tier 3: Security
- **@Auth**: Authentication & authorization
- **@Security**: Security audits & vulnerability fixes

### Tier 4: DevOps
- **@DevOps**: Deployment & infrastructure

### Tier 5: Quality
- **@Testing**: QA & test automation
- **@Reviewer**: Code review & quality checks
- **@Debugger**: Bug investigation & fixes
- **@Documentation**: Technical writing & docs maintenance

### Tier 6: Specialist
- **@Performance**: Performance optimization
- **@Refactoring**: Code quality & design patterns

### Using Agents

You can interact with agents in several ways:

1. **Direct interaction**:
   ```bash
   ultra-dex run planner -t "Break down user authentication feature"
   ```

2. **Through the build command** (automatically selects appropriate agent):
   ```bash
   ultra-dex build
   ```

3. **Through the swarm command** (orchestrates multiple agents):
   ```bash
   ultra-dex swarm "Implement user profile page"
   ```

## Best Practices

### 1. Start with a Clear Idea
Before generating a plan, spend time refining your project idea. The clearer your idea, the better the generated plan.

### 2. Review Generated Plans
Always review the generated implementation plan before proceeding. Modify it to better suit your specific needs.

### 3. Iterate in Small Steps
Use the `ultra-dex build` command to tackle one task at a time rather than trying to implement everything at once.

### 4. Validate Regularly
Regularly run `ultra-dex validate` to ensure your project follows Ultra-Dex standards.

### 5. Review Often
Use `ultra-dex review` to check your code against the plan and maintain alignment.

### 6. Use the Dashboard
The dashboard provides visual feedback on your project's progress and status:
```bash
ultra-dex dashboard
```

### 7. Secure Your Credentials
Never commit API keys or other sensitive information to version control. Use environment variables.

## Troubleshooting

### Common Issues

#### API Key Not Recognized
**Problem**: Getting errors about missing or invalid API keys.
**Solution**: Ensure your API key is properly set in the environment:
```bash
export ANTHROPIC_API_KEY=your-key-here
# or
export OPENAI_API_KEY=your-key-here
# or
export GOOGLE_AI_KEY=your-key-here
```

#### Command Not Found
**Problem**: Getting "command not found" errors.
**Solution**: Ensure Ultra-Dex is properly installed globally:
```bash
npm install -g ultra-dex
```

#### Slow Performance
**Problem**: Commands taking too long to execute.
**Solution**: 
- Check your internet connection
- Verify your AI provider API is responding normally
- Consider using a different AI provider if one is slow

#### Permission Errors
**Problem**: Getting permission errors when creating files.
**Solution**: Ensure Ultra-Dex has write permissions to the target directory.

#### Invalid Project Structure
**Problem**: Commands failing because of missing files.
**Solution**: Ensure you've initialized your project with `ultra-dex init`.

### Debugging Tips

1. **Enable Debug Mode**: Set the DEBUG environment variable to get more detailed output:
   ```bash
   DEBUG=true ultra-dex command
   ```

2. **Check Project State**: Use `ultra-dex status` to check the current project state.

3. **Validate Structure**: Run `ultra-dex validate` to check for structural issues.

4. **Review Logs**: Check the log file at `.ultra-dex/logs/ultra-dex.log` for detailed error information.

### Getting Help

If you encounter issues not covered in this guide:

1. Check the official documentation
2. Look for similar issues in the GitHub repository
3. Ask for help in the community forums
4. Submit an issue on GitHub if you believe you've found a bug