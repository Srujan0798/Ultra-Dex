# Multi-Tool Orchestration Guide

## Overview

Ultra-Dex coordinates multiple AI tools in a single workflow. Each tool is used for what it does best.

## Recommended Flow

1. Planner (Claude/Gemini) for architecture.
2. Implementation (Cursor/IDE) for rapid edits.
3. Review (Reviewer agent) for quality enforcement.

## Handoff Template

```
## Handoff from @Backend to @Frontend

### What I Built
- POST /api/auth/login
- POST /api/auth/signup

### Contract
POST /api/auth/login
Body: { email, password }
Response: { token, user }

### Next Steps
- Build login UI
- Store token in httpOnly cookie
```
