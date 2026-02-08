# Context Management Guide

Effective context management is crucial for successful AI-assisted development with Ultra-Dex. This guide explains how to manage project context for optimal results.

## Understanding Context in Ultra-Dex

Ultra-Dex maintains project context across multiple files and systems:

- **CONTEXT.md**: Current project state and important information
- **IMPLEMENTATION_PLAN.md**: Detailed execution plan
- **Memory System**: Persistent knowledge across sessions
- **RAG (Retrieval Augmented Generation)**: Knowledge retrieval from codebase

## Context Files

### CONTEXT.md
This file contains the current state of your project:

```markdown
# Project Context

## Current State
- User authentication system implemented
- Database schema defined
- Frontend components created

## Active Tasks
- [ ] Payment integration
- [ ] Email notifications
- [x] User profiles

## Constraints
- Must support 1000+ concurrent users
- GDPR compliance required
- Mobile-first design
```

### IMPLEMENTATION_PLAN.md
This file contains the detailed plan for implementation:

```markdown
# Implementation Plan

## Phase 1: Authentication
1. Create user model
2. Implement login/logout
3. Add password reset

## Phase 2: Core Features
1. Build main dashboard
2. Create data models
3. Implement CRUD operations

## Phase 3: Polish
1. Add unit tests
2. Performance optimization
3. Security audit
```

## Managing Context

### Updating Context
```bash
# Update context manually
ultra-dex context update

# Analyze current codebase to update context
ultra-dex context analyze

# Summarize recent changes
ultra-dex context summarize
```

### Viewing Context
```bash
# View current context
ultra-dex context show

# View context history
ultra-dex context history

# Compare contexts
ultra-dex context diff --previous
```

## Best Practices

### 1. Keep Context Current
Regularly update your context files to reflect the current state:

```bash
# After major changes
ultra-dex context refresh

# Before starting new work
ultra-dex context sync
```

### 2. Be Specific
Provide detailed information in context files:

```markdown
# Good
## Database
PostgreSQL 14.5, hosted on AWS RDS
Connection pool: 20 connections
Current tables: users, posts, comments

# Needs Improvement
## Database
Using PostgreSQL
```

### 3. Document Decisions
Record architectural decisions and their rationale:

```markdown
## Technology Decisions
- React over Vue: Team familiarity
- PostgreSQL over MongoDB: ACID requirements
- JWT over sessions: Microservice compatibility
```

### 4. Track Constraints
Keep track of project constraints and requirements:

```markdown
## Constraints
- Response time: < 200ms for 95% of requests
- Availability: 99.9%
- Budget: $500/month for hosting
- Timeline: MVP in 6 weeks
```

## Memory Management

Ultra-Dex uses a tiered memory system:

### Hot Memory
- Current context and immediate tasks
- Frequently accessed information
- Automatically managed

### Warm Memory
- Recent project history
- Past decisions and outcomes
- Accessible but lower priority

### Cold Memory
- Historical project data
- Archived decisions
- Long-term knowledge

## Context Commands

### Core Context Commands
```bash
# Show current context
ultra-dex context show

# Update context from current state
ultra-dex context update

# Analyze codebase and update context
ultra-dex context analyze

# Refresh context from files
ultra-dex context refresh

# Export context for sharing
ultra-dex context export --format json
```

### Memory Commands
```bash
# View memory status
ultra-dex memory status

# Clear temporary memory
ultra-dex memory clear --temporary

# Export memory for backup
ultra-dex memory export --destination ./backup/

# Import memory from backup
ultra-dex memory import --source ./backup/
```

## Troubleshooting Context Issues

### Context Drift
If agents seem to be working with outdated information:

```bash
# Resync context
ultra-dex context sync --force

# Regenerate context from current codebase
ultra-dex context analyze --regenerate
```

### Memory Overload
If Ultra-Dex is slow or returning irrelevant information:

```bash
# Clear temporary memory
ultra-dex memory clear --temporary

# Compact memory storage
ultra-dex memory compact
```

## Advanced Context Techniques

### Context Segmentation
For large projects, segment context by module:

```bash
# Work with specific context
ultra-dex context switch --module authentication

# Create module-specific context
ultra-dex context create --module payments --description "Payment processing system"
```

### Context Templates
Use templates for consistent context structure:

```bash
# Apply context template
ultra-dex context apply-template --name microservice

# Create custom template
ultra-dex context template create --name my-template --from-file template.md
```

## Integration with Workflows

Context management integrates with other Ultra-Dex workflows:

```bash
# Context-aware planning
ultra-dex plan "Add feature" --with-context

# Context validation before execution
ultra-dex run plan.md --validate-context

# Context preservation during operations
ultra-dex swarm start plan.md --preserve-context
```

## Security Considerations

### Sensitive Information
Never store sensitive information like passwords or API keys in context files:

```bash
# Good - reference environment variables
API_KEY: env:MY_API_KEY

# Bad - don't put actual keys in context
API_KEY: sk-1234567890abcdef
```

### Access Control
Control who can access context files in shared environments:

```bash
# Set appropriate permissions
chmod 600 CONTEXT.md  # Read/write for owner only
```

By following these context management practices, you'll ensure that Ultra-Dex agents have the information they need to work effectively on your projects.