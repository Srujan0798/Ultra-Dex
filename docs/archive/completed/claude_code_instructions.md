# Ultra-Dex: Remaining Tasks for Claude Code

> **Status:** Project is 98% complete. These are polish tasks only.

---

## CONTEXT (Already Done - Don't Redo)

✅ README.md with Mermaid diagram  
✅ docs/README.md navigation hub  
✅ docs/BUILD-AUTH-30M.md tutorial  
✅ guides/AI-RESEARCH.md  
✅ cursor-rules/11-nextjs-v15.mdc  
✅ cursor-rules/12-multi-tenancy.mdc  
✅ agents/0-orchestration/ META-ORCHESTRATOR  
✅ CLI v1.7.1 published to npm

---

## TASK 1: Add Code Examples to Agents (v1.8.0 Roadmap)

### 1.1 Backend Agent

**File:** `agents/2-development/backend.md`

Add this section at the end:

```markdown
## Code Examples

### Express.js API Endpoint

\`\`\`typescript
// src/routes/tasks.ts
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

const createTaskSchema = z.object({
title: z.string().min(1).max(255),
description: z.string().optional(),
priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

router.post('/tasks', async (req: Request, res: Response) => {
try {
const data = createTaskSchema.parse(req.body);
const task = await prisma.task.create({
data: { ...data, userId: req.user.id },
});
res.status(201).json(task);
} catch (error) {
if (error instanceof z.ZodError) {
res.status(400).json({ errors: error.errors });
} else {
res.status(500).json({ error: 'Internal server error' });
}
}
});

export default router;
\`\`\`

### Prisma Query with Relations

\`\`\`typescript
const userWithTasks = await prisma.user.findUnique({
where: { id: userId },
include: {
tasks: { orderBy: { createdAt: 'desc' }, take: 10 },
profile: true,
},
});
\`\`\`
```

### 1.2 Testing Agent

**File:** `agents/5-quality/testing.md`

Add this section at the end:

```markdown
## Code Examples

### Jest Unit Test

\`\`\`typescript
// **tests**/utils/formatDate.test.ts
import { formatDate } from '../../src/utils/formatDate';

describe('formatDate', () => {
it('formats date correctly', () => {
const date = new Date('2026-01-25');
expect(formatDate(date)).toBe('January 25, 2026');
});

it('handles null gracefully', () => {
expect(formatDate(null)).toBe('N/A');
});
});
\`\`\`

### Playwright E2E Test

\`\`\`typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
await page.goto('/login');
await page.fill('[name="email"]', 'test@example.com');
await page.fill('[name="password"]', 'password123');
await page.click('button[type="submit"]');
await expect(page).toHaveURL('/dashboard');
await expect(page.locator('h1')).toContainText('Welcome');
});
\`\`\`
```

### 1.3 Database Agent

**File:** `agents/2-development/database.md`

Add this section at the end:

```markdown
## Code Examples

### Prisma Schema

\`\`\`prisma
// prisma/schema.prisma
model User {
id String @id @default(cuid())
email String @unique
name String?
tasks Task[]
profile Profile?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
}

model Task {
id String @id @default(cuid())
title String
description String?
priority Priority @default(MEDIUM)
completed Boolean @default(false)
user User @relation(fields: [userId], references: [id])
userId String
createdAt DateTime @default(now())
}

enum Priority {
LOW
MEDIUM
HIGH
}
\`\`\`

### Seed Script

\`\`\`typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
await prisma.user.create({
data: {
email: 'admin@example.com',
name: 'Admin User',
tasks: {
create: [
{ title: 'Setup project', priority: 'HIGH' },
{ title: 'Write documentation', priority: 'MEDIUM' },
],
},
},
});
}

main().catch(console.error).finally(() => prisma.$disconnect());
\`\`\`
```

### 1.4 Security Agent

**File:** `agents/3-security/security.md`

Add this section at the end:

```markdown
## Code Examples

### Rate Limiting Middleware

\`\`\`typescript
// src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
windowMs: 15 _ 60 _ 1000, // 15 minutes
max: 100,
message: { error: 'Too many requests, please try again later' },
standardHeaders: true,
legacyHeaders: false,
});

export const authLimiter = rateLimit({
windowMs: 60 _ 60 _ 1000, // 1 hour
max: 5,
message: { error: 'Too many login attempts' },
});
\`\`\`

### Input Sanitization

\`\`\`typescript
import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

const sanitizedString = z.string().transform((val) => DOMPurify.sanitize(val));

const userInputSchema = z.object({
name: sanitizedString,
bio: sanitizedString.max(500),
});
\`\`\`
```

### 1.5 Performance Agent

**File:** `agents/6-specialist/performance.md`

Add this section at the end:

```markdown
## Code Examples

### React.memo for Expensive Components

\`\`\`tsx
import { memo } from 'react';

interface TaskListProps {
tasks: Task[];
onComplete: (id: string) => void;
}

export const TaskList = memo(function TaskList({ tasks, onComplete }: TaskListProps) {
return (

<ul>
{tasks.map((task) => (
<TaskItem key={task.id} task={task} onComplete={onComplete} />
))}
</ul>
);
});
\`\`\`

### Database Query Optimization

\`\`\`typescript
// BAD: N+1 query
const users = await prisma.user.findMany();
for (const user of users) {
const tasks = await prisma.task.findMany({ where: { userId: user.id } });
}

// GOOD: Single query with include
const users = await prisma.user.findMany({
include: { tasks: true },
});
\`\`\`

### Redis Caching Pattern

\`\`\`typescript
import Redis from 'ioredis';
const redis = new Redis();

async function getCachedUser(userId: string) {
const cached = await redis.get(`user:${userId}`);
if (cached) return JSON.parse(cached);

const user = await prisma.user.findUnique({ where: { id: userId } });
await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));
return user;
}
\`\`\`
```

---

## TASK 2: Add "What If" Scenarios to Examples

**File:** `@ Ultra DeX/Saas plan/Examples/TaskFlow-Complete.md`

Add section at the end:

```markdown
## Scaling Scenarios

### Scenario: 10,000 Users

**Problem:** Database queries become slow, API response times increase.

**Solution:**

1. Add Redis caching (see Section 28 - Caching Strategy)
2. Use @Performance agent to identify N+1 queries
3. Add database indexes per cursor-rules/01-database.mdc
4. Consider read replicas for heavy read workloads

### Scenario: Multi-Tenant Expansion

**Problem:** Adding B2B features with tenant isolation.

**Solution:**

1. Load cursor-rules/12-multi-tenancy.mdc
2. Add `tenantId` to all user-facing tables
3. Implement Row-Level Security in PostgreSQL
4. Use @Security agent to audit isolation
```

---

## TASK 3: Update CHANGELOG for v1.7.1

**File:** `CHANGELOG.md`

Add at the top (after header):

```markdown
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

### Changed

- Reorganized root files to 5 essential files
- Moved 9 files from root to docs/
- Moved AGENT-INSTRUCTIONS.md to agents/
- Updated folder structure diagram in README.md

### Fixed

- All internal links verified
- Navigation improved with docs hub
```

---

## TASK 4: Optional CLI Enhancements

### 4.1 Add --preview Flag

**File:** `cli/bin/ultra-dex.js`

Find the init command and add preview logic:

```javascript
// Add to command options
.option('--preview', 'Preview files without creating them')

// In the init handler, add:
if (options.preview) {
  console.log('\n📋 Files that would be created:\n');
  console.log('  QUICK-START.md');
  console.log('  CONTEXT.md');
  console.log('  IMPLEMENTATION-PLAN.md');
  console.log('  docs/CHECKLIST.md');
  console.log('  docs/AI-PROMPTS.md');
  console.log('\nRun without --preview to create files.');
  return;
}
```

---

## EXECUTION ORDER

1. **Task 1** - Add code examples to 5 agents (most impactful)
2. **Task 3** - Update CHANGELOG (quick win)
3. **Task 2** - Add scenarios to examples (nice to have)
4. **Task 4** - CLI enhancements (optional)

---

## COPY-PASTE PROMPT FOR CLAUDE CODE

```
I need you to add code examples to 5 agent files in Ultra-Dex:

1. agents/2-development/backend.md - Add Express.js API endpoint example
2. agents/5-quality/testing.md - Add Jest and Playwright examples
3. agents/2-development/database.md - Add Prisma schema and seed examples
4. agents/3-security/security.md - Add rate limiting and sanitization examples
5. agents/6-specialist/performance.md - Add React.memo and caching examples

For each file, add a "## Code Examples" section at the end with TypeScript code blocks.
The examples should be production-ready, not just stubs.

After that, update CHANGELOG.md with v1.7.1 release notes.
```
