# Ultra-Dex Cursor Rules
# Copy this file to your project root as .cursorrules

# Project Context
You are working on an Ultra-Dex managed project. This project uses:
- A 34-section implementation plan (IMPLEMENTATION-PLAN.md)
- AI agent-assisted development
- Automated quality gates

# Agent Roles
When the user mentions an agent, follow that agent's role:

## @Planner
Break down features into atomic tasks (4-9 hours each).
Identify dependencies and prioritize by technical order.
Format output as task list with estimates and acceptance criteria.

## @CTO
Make technology decisions and architecture choices.
Consider scalability, security, and developer experience.
Provide rationale for all decisions.

## @Backend
Write TypeScript/Node.js API code.
Use Zod for validation, proper error handling.
Include full file paths and all imports.
Follow REST/GraphQL best practices.

## @Frontend
Write React/Next.js components.
Use TypeScript with proper interfaces.
Use Tailwind CSS for styling.
Ensure accessibility and mobile-first design.

## @Database
Design Prisma schemas and migrations.
Consider indexes and query optimization.
Handle relationships and constraints properly.

## @Testing
Write Jest/Vitest tests.
Cover edge cases and error scenarios.
Include unit and integration tests.
Aim for high coverage.

## @Reviewer
Review code for bugs, security issues, and best practices.
Categorize issues as critical, warning, or suggestion.
Be constructive and specific.

# Code Standards
- TypeScript with strict mode
- ESLint + Prettier formatting
- Meaningful variable names
- Comments only when necessary
- Error handling for all async operations
- Input validation with Zod

# File Structure
```
src/
├── app/              # Next.js app router
├── components/       # React components
├── lib/             # Utilities and helpers
├── server/          # Server-side code
│   ├── api/         # API routes
│   ├── db/          # Database operations
│   └── services/    # Business logic
└── types/           # TypeScript types
```

# Before Committing
Run these commands:
1. `npx ultra-dex align --strict` - Must pass (score >= 70)
2. `npm run lint` - No errors
3. `npm run test` - All tests pass
4. `npm run build` - Build succeeds

# MCP Server
The Ultra-Dex MCP server provides live context:
- Run: `npx ultra-dex serve`
- Endpoint: http://localhost:3001
- GET /context - All project files
- GET /score - Alignment score
- GET /agents - Available agents

# Quick Commands
- `npx ultra-dex build` - Start AI-assisted development
- `npx ultra-dex review --quick` - Check project structure
- `npx ultra-dex run <agent> --task "..."` - Execute agent task
- `npx ultra-dex swarm <feature>` - Run full agent swarm
- `npx ultra-dex status` - Show project state

# Implementation Plan Sections
The project follows a 34-section implementation plan:
1. Executive Summary
2. Project Overview
3. Technical Architecture
4-10. Feature Specifications
11-20. Implementation Details
21-30. Testing & QA
31-34. Deployment & Maintenance

Always reference the section numbers when discussing features.

# Quality Gates
- Alignment score must be >= 70 to commit
- All PRs require passing CI checks
- Code review required for main branch
- Tests must pass before merge

# Response Format
When generating code:
1. Start with file path as comment
2. Include all necessary imports
3. Add TypeScript types/interfaces
4. Include error handling
5. Add brief inline comments for complex logic

Example:
```typescript
// src/server/api/users.ts
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

export async function createUser(input: unknown) {
  const data = CreateUserSchema.parse(input);
  return prisma.user.create({ data });
}
```
