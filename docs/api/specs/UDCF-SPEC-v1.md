# Ultra-Dex Context Format v1.0

> **Open Specification for AI-Assisted Development Context**

## Abstract

The Ultra-Dex Context Format (UDCF) is an open specification for describing and persisting development context in AI-assisted coding workflows. This format enables interoperability between different AI coding tools while maintaining a consistent project understanding.

## Status

**Version:** 1.0.0
**Status:** Draft
**License:** MIT

## Overview

UDCF defines a collection of markdown-based files that capture:

1. Project context and configuration
2. Implementation plans and task tracking
3. Agent definitions and prompts
4. Verification checklists

## File Structure

```
project-root/
├── CONTEXT.md              # Project context (required)
├── IMPLEMENTATION-PLAN.md  # Active implementation plan
├── agents/                 # Agent definitions
│   ├── 00-AGENT_INDEX.md   # Agent registry
│   └── *.md                # Individual agents
└── .ultra-dex/             # Runtime data
    ├── state.json          # Machine state
    └── history/            # Execution history
```

## CONTEXT.md Format

The primary context file MUST contain these sections:

```markdown
# Project Name

## Overview

Brief project description (1-3 paragraphs)

## Tech Stack

- Framework: [e.g., Next.js 15]
- Language: [e.g., TypeScript]
- Database: [e.g., PostgreSQL + Prisma]
- ...

## Architecture

High-level architecture description

## Key Decisions

| Decision | Rationale | Date |
| -------- | --------- | ---- |
| ...      | ...       | ...  |

## Current Focus

What the team is currently working on

## Conventions

Project-specific coding conventions
```

## IMPLEMENTATION-PLAN.md Format

```markdown
# [Feature/Sprint Name]

## Objective

What this plan aims to achieve

## Tasks

- [ ] Task 1
  - [ ] Subtask 1.1
- [x] Completed task

## Timeline

| Phase | Duration | Status |
| ----- | -------- | ------ |
| ...   | ...      | ...    |

## Dependencies

- External dependencies
- Internal dependencies

## Verification

- [ ] 21-step verification checklist
```

## Agent Definition Format

Agent files MUST follow this structure:

```markdown
# Agent Name

## Role

Brief description of agent's role

## Expertise

- Domain expertise 1
- Domain expertise 2

## System Prompt

The actual prompt used to initialize this agent

## Tools

- Available tool 1
- Available tool 2

## Examples

Example interactions
```

## Machine-Readable State

The `.ultra-dex/state.json` file maintains machine-readable state:

```json
{
  "version": "1.0",
  "lastUpdated": "2026-02-05T12:00:00Z",
  "currentPhase": "implementation",
  "completedTasks": [],
  "activeAgents": [],
  "tokenUsage": {
    "total": 0,
    "byAgent": {}
  }
}
```

## Interoperability

### UDCF → Cursor

```javascript
// Read CONTEXT.md → Generate .cursorrules
```

### UDCF → Continue.dev

```javascript
// Read agents/ → Generate .continue/config.json
```

### UDCF → MCP

```javascript
// Expose via ultradex://context resource
```

## Versioning

- MAJOR: Breaking changes to required fields
- MINOR: New optional features
- PATCH: Clarifications and fixes

## Authors

- Ultra-Dex Team
- Community Contributors

## References

- [Model Context Protocol](https://modelcontextprotocol.io)
- [Ultra-Dex CLI](https://github.com/Srujan0798/Ultra-Dex)
