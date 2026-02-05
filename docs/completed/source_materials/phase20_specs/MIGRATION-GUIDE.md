# Ultra-Dex Migration Guide

## Overview
This document provides guidance for migrating between different versions of Ultra-Dex and understanding the changes introduced in recent updates.

## Current Release: v3.4.5

### What's New in v3.4.5
- **Professional Purple Theme**: Enhanced UI with indigo-to-pink gradient interface
- **MCP Server Integration**: Model Context Protocol server for Claude Desktop
- **WebSocket Real-time Updates**: Live dashboard with instant updates
- **Agent System**: 17 specialized AI agents organized in 6 tiers
- **Swarm Orchestration**: Multi-agent pipeline execution
- **Verification Framework**: 21-step quality assurance system
- **Performance Optimizations**: Enhanced graph analysis with caching
- **Security Hardening**: Improved validation and sanitization
- **Enhanced CLI**: 46+ commands with improved UX

## Migration Steps

### From Previous Versions (v3.3.x to v3.4.5)

#### 1. Update Ultra-Dex
```bash
npm update -g ultra-dex
# Verify the update
ultra-dex --version
```

#### 2. Update Existing Projects
For existing projects, you don't need to make any changes to your implementation plans. The new features are additive and won't break existing functionality.

#### 3. Review New Features
- Check the new commands with `ultra-dex --help`
- Review the 17 new AI agents with `ultra-dex agents`
- Try the new dashboard with `ultra-dex dashboard`
- Test the MCP server with `ultra-dex serve`

### From v3.2.x to v3.4.5

#### 1. Major Changes to Be Aware Of
- The MCP server is now integrated into the main serve command
- Dashboard now runs on port 3002 by default
- New agent system with 17 specialized agents
- Enhanced security validation

#### 2. Update Process
```bash
# Uninstall old version
npm uninstall -g ultra-dex

# Install new version
npm install -g ultra-dex@3.4.5

# Verify installation
ultra-dex --version
```

## Breaking Changes (If Any)

### v3.4.5
- No breaking changes - all features are backward compatible
- Existing implementation plans remain valid
- All commands continue to work as before

### Previous Versions
- v3.0.0: MCP server integration introduced
- v2.0.0: Generate command now uses AI for full plan generation

## Configuration Updates

### Environment Variables
The following new environment variables are available in v3.4.5:

```bash
# Performance settings
export CACHE_TIMEOUT=30000  # Graph analysis cache timeout in ms
export CONCURRENCY_LIMIT=100  # File processing concurrency limit

# MCP server settings
export MCP_PORT=3001  # MCP server port
export MCP_HOST=localhost  # MCP server host

# Monitoring settings
export LOG_LEVEL=info  # Logging level (debug, info, warn, error)
export METRICS_ENABLED=true  # Enable performance metrics
```

### Configuration File Changes
If you have a custom configuration file, you may want to update it to include new settings:

```json
{
  "version": "3.4.5",
  "performance": {
    "cacheTimeout": 30000,
    "concurrencyLimit": 100
  },
  "mcp": {
    "port": 3001,
    "host": "localhost"
  },
  "logging": {
    "level": "info",
    "enabled": true
  },
  "metrics": {
    "enabled": true
  }
}
```

## Project Structure Updates

### New Files Created by Default
Projects initialized with v3.4.5 will include:

```
my-project/
├── QUICK-START.md         # Quick overview of your project
├── CONTEXT.md             # Project context and requirements
├── IMPLEMENTATION-PLAN.md # Detailed implementation plan
├── docs/
│   ├── CHECKLIST.md       # 21-step verification checklist
│   └── AI-PROMPTS.md      # AI agent prompts
├── .cursor/rules/         # (Optional) Cursor AI rules
└── .agents/               # (Optional) AI agent configurations
```

### Legacy Files
Older project templates may have different file structures. These remain compatible but you can update them to the new structure if desired.

## Agent Migration

### New Agent System
In v3.4.5, Ultra-Dex introduces a tiered agent system:

#### Tier 1: Leadership
- @CTO: Architecture & tech stack decisions
- @Planner: Task breakdown & sprint planning
- @Research: Technology evaluation & comparison

#### Tier 2: Development
- @Backend: API & server implementation
- @Frontend: UI & component implementation
- @Database: Schema design & query optimization

#### Tier 3: Security
- @Auth: Authentication & authorization
- @Security: Security audits & vulnerability fixes

#### Tier 4: DevOps
- @DevOps: Deployment & infrastructure

#### Tier 5: Quality
- @Testing: QA & test automation
- @Documentation: Technical writing & docs maintenance
- @Reviewer: Code review & quality checks
- @Debugger: Bug investigation & fixes

#### Tier 6: Specialist
- @Performance: Performance optimization
- @Refactoring: Code quality & design patterns

## Performance Considerations

### Graph Analysis Improvements
v3.4.5 includes performance optimizations for graph analysis:
- Caching with 30-second TTL
- Concurrency improvements with Promise.allSettled()
- File change detection to avoid unnecessary work

### Memory Usage
- Monitor memory usage during large project analysis
- Consider increasing Node.js memory limits for very large projects:
  ```bash
  export NODE_OPTIONS="--max-old-space-size=8192"
  ```

## Security Updates

### Path Validation
Enhanced path validation prevents directory traversal attacks. Ensure all file paths:
- Don't contain `../` or `..\\` sequences
- Are relative to the project root
- Don't reference sensitive directories like `.git` or `node_modules`

### API Key Handling
- Never commit API keys to version control
- Use environment variables for all sensitive data
- Implement proper secret rotation policies

## Troubleshooting Migration Issues

### Common Migration Problems

#### Problem: Commands Not Working After Update
**Symptoms**: Getting "command not found" or unexpected errors
**Solution**:
1. Verify the installation:
   ```bash
   ultra-dex --version
   ```
2. Clear npm cache:
   ```bash
   npm cache clean --force
   npm install -g ultra-dex@3.4.5
   ```

#### Problem: Configuration Issues
**Symptoms**: Getting configuration-related errors
**Solution**:
1. Check if your configuration file is compatible
2. Regenerate configuration if needed:
   ```bash
   ultra-dex config --reset
   ```

#### Problem: Agent Commands Failing
**Symptoms**: Agent commands not working as expected
**Solution**:
1. Verify your AI provider API keys are set
2. Check that your internet connection is working
3. Try with a different AI provider:
   ```bash
   ultra-dex generate "test" --provider openai
   ```

## Rollback Procedure

If you encounter issues with v3.4.5 and need to rollback:

```bash
# Uninstall current version
npm uninstall -g ultra-dex

# Install previous version
npm install -g ultra-dex@3.3.x  # Replace x with specific version

# Verify rollback
ultra-dex --version
```

## Support During Migration

### Getting Help
- Check the updated documentation in the root directory
- Open an issue on GitHub with detailed information
- Include your Ultra-Dex version, Node.js version, and OS
- Provide the exact command that failed and the full error message
- Share what you were trying to accomplish

### Community Resources
- GitHub Discussions for migration questions
- Discord community (when available)
- Stack Overflow with the `ultra-dex` tag

## Post-Migration Verification

After migrating to v3.4.5, verify that everything works:

```bash
# Check version
ultra-dex --version

# Test basic commands
ultra-dex --help
ultra-dex agents
ultra-dex validate

# Test AI integration (requires API key)
ultra-dex generate "test idea" --dry-run
```

## Questions?

If you have questions about migrating to v3.4.5, please open an issue or consult the community forums.