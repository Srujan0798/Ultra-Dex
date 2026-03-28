// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Embedded module
 * @module templates/embedded
 */

import { githubTreeUrl } from '../config/urls.js';

export const CORE_CURSOR_RULE = `# Ultra-Dex Core Rules

> Load this as your base ruleset. Add domain-specific rules as needed.

## Project Philosophy

- Build production-ready from day 1
- Every task: 4-9 hours with clear acceptance criteria
- 21-step verification for features (simplified for fixes)
- Code > Documentation (but document decisions)

## Code Standards

- TypeScript strict mode always
- Zod validation at all API boundaries
- Error handling: never swallow errors silently
- Logging: structured JSON, include request IDs
- Tests: minimum 80% coverage for business logic

## Architecture Defaults

- Next.js App Router (or specified framework)
- PostgreSQL with Prisma ORM
- NextAuth.js for authentication
- Stripe for payments
- Vercel for deployment

## Task Completion Checklist (Quick 5-Step)

1. Does it work? (Manual test)
2. Are there tests? (Automated)
3. Is it secure? (No secrets exposed, inputs validated)
4. Is it documented? (Code comments for complex logic)
5. Is it deployable? (No breaking changes)

## When to Use Full 21-Step

- New features affecting multiple files
- Security-sensitive changes
- Database schema changes
- API contract changes

## File Naming

- Components: PascalCase (UserProfile.tsx)
- Utilities: camelCase (formatDate.ts)
- API routes: kebab-case (/api/user-profile)
- Database: snake_case (user_profiles)
`;

export const AGENT_INSTRUCTIONS_EMBEDDED = `# Ultra-Dex AI Agent Quick Reference

## Agent Selection

| Task | Agent | Use When |
|------|-------|----------|
| Architecture decisions | @CTO | Tech stack, scaling, trade-offs |
| Task breakdown | @Planner | Feature to atomic tasks |
| API endpoints | @Backend | REST/GraphQL, middleware |
| React components | @Frontend | UI, state, forms |
| Schema design | @Database | Models, migrations, queries |
| Auth flows | @Security | Login, sessions, permissions |
| CI/CD setup | @DevOps | Deploy, monitoring, infra |
| Code review | @Reviewer | PR review, quality gates |
| Test coverage | @Testing | Unit, integration, E2E |
| Bug fixing | @Debugger | Root cause, fixes |

## Quick Start Prompts

### @Backend - API Endpoint
Act as @Backend. Context: [paste CONTEXT.md]
Task: Create POST /api/users endpoint with validation.
Requirements: Zod schema, error handling, rate limiting.

### @Database - Schema Design
Act as @Database. Context: [paste CONTEXT.md]
Task: Design User and Organization tables with relationships.
Requirements: Prisma schema, indexes, soft deletes.

### @Frontend - Component
Act as @Frontend. Context: [paste CONTEXT.md]
Task: Create UserProfile component with edit form.
Requirements: React Hook Form, Zod validation, loading states.

## 21-Step Verification (Quick 5)

1. Does it work? (Manual test)
2. Are there tests? (80%+ coverage)
3. Is it secure? (Inputs validated, no secrets)
4. Is it documented? (Complex logic commented)
5. Is it deployable? (No breaking changes)

---
Full agents: ${githubTreeUrl('agents')}
`;

export const VERIFICATION_CHECKLIST = `# Ultra-Dex 21-Step Verification Checklist

## Quick 5 (Every Task)
- [ ] 1. Does it work? (Manual test)
- [ ] 2. Are there tests? (Unit tests passing)
- [ ] 3. Is it secure? (No secrets, inputs validated)
- [ ] 4. Is it documented? (Comments for complex logic)
- [ ] 5. Is it deployable? (No breaking changes)

## Full 21 (New Features)

### Understanding (1-4)
- [ ] 1. Requirements clear?
- [ ] 2. Assumptions documented?
- [ ] 3. Logic flow mapped?
- [ ] 4. Subtasks identified?

### Implementation (5-10)
- [ ] 5. Setup complete?
- [ ] 6. Code written?
- [ ] 7. Comments added?
- [ ] 8. Unit tests passing?
- [ ] 9. Bugs fixed?
- [ ] 10. Integration verified?

### Quality (11-16)
- [ ] 11. Acceptance criteria met?
- [ ] 12. UX acceptable?
- [ ] 13. Performance acceptable?
- [ ] 14. Security reviewed?
- [ ] 15. Code refactored?
- [ ] 16. Errors handled?

### Delivery (17-21)
- [ ] 17. API documented?
- [ ] 18. Committed?
- [ ] 19. Build passing?
- [ ] 20. Deploy ready?
- [ ] 21. Final verified?

---
Use Quick 5 for bug fixes. Use Full 21 for new features.
`;

/**
 * Error handler for embedded
 * @param {Error} error - Error to handle
 */
function handleEmbeddedError(error) {
  try {
    logger.error('[embedded]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
