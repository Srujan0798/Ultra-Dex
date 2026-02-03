# Ultra-Dex Example: Task Management SaaS

A complete, production-ready example demonstrating Ultra-Dex capabilities.

## 🎯 What This Example Demonstrates

This example shows how Ultra-Dex can help build a real SaaS application from idea to production:

1. **Project Initialization** - Using `ultra-dex init` with live templates
2. **AI Plan Generation** - Using `ultra-dex generate` for full implementation plan
3. **Agent Swarm** - Using `ultra-dex swarm` for coordinated development
4. **Context Synchronization** - Using `ultra-dex brain` for AI memory
5. **Plan vs Code Alignment** - Using `ultra-dex diff` to track progress
6. **Validation** - Using `ultra-dex validate` for quality checks
7. **Dashboard** - Using `ultra-dex serve` for real-time monitoring

## 🚀 Quick Start

```bash
# 1. Initialize the project
npx ultra-dex init taskflow-saas --live --stack next15-prisma-clerk

# 2. Generate implementation plan
npx ultra-dex generate "A task management SaaS with teams, projects, and real-time collaboration"

# 3. Start the kernel for monitoring
npx ultra-dex serve

# 4. Run agent swarm to build first feature
npx ultra-dex swarm "Build user authentication with email, OAuth, and team invites"

# 5. Sync context with codebase
npx ultra-dex brain

# 6. Check alignment
npx ultra-dex diff

# 7. Validate project structure
npx ultra-dex validate --scan
```

## 📁 Project Structure

```
taskflow-saas/
├── QUICK-START.md              # Project overview and getting started
├── CONTEXT.md                  # AI memory - project context
├── IMPLEMENTATION-PLAN.md      # 34-section detailed plan
├── .cursor/rules/              # AI coding rules for Cursor
├── .agents/                    # 17 AI agent prompts
│   ├── 1-leadership/
│   │   ├── cto.md
│   │   ├── planner.md
│   │   └── research.md
│   ├── 2-development/
│   │   ├── backend.md
│   │   ├── frontend.md
│   │   └── database.md
│   ├── 3-security/
│   │   ├── auth.md
│   │   └── security.md
│   ├── 4-devops/
│   │   └── devops.md
│   ├── 5-quality/
│   │   ├── testing.md
│   │   ├── reviewer.md
│   │   └── debugger.md
│   └── 6-specialist/
│       ├── performance.md
│       └── refactoring.md
├── src/
│   ├── app/                    # Next.js 15 app router
│   ├── components/             # React components
│   ├── lib/                    # Utilities and helpers
│   ├── db/                     # Prisma schema and migrations
│   └── api/                    # API routes
├── .ultra/
│   └── state.json              # Project state tracking
└── docs/
    ├── CHECKLIST.md            # 21-step verification
    └── AI-PROMPTS.md           # Agent instructions
```

## 🎨 Features Implemented

### Phase 1: Foundation ✅
- [x] User authentication (email + OAuth)
- [x] Database schema (Prisma + PostgreSQL)
- [x] Basic UI layout and navigation
- [x] Project structure setup

### Phase 2: Core Features 🚧
- [ ] Task creation and management
- [ ] Project organization
- [ ] Team collaboration
- [ ] Real-time updates (WebSocket)

### Phase 3: Advanced Features ⏳
- [ ] File attachments
- [ ] Comments and activity feed
- [ ] Email notifications
- [ ] API for integrations

### Phase 4: Polish & Deploy ⏳
- [ ] Performance optimization
- [ ] Testing (unit + integration)
- [ ] Documentation
- [ ] Deployment to Vercel

## 🤖 How Agents Were Used

### @Planner (Nick Fury)
**Task**: Break down "Build task management system"

```markdown
## Phase Breakdown

### Phase 1: Foundation (Week 1)
1. Setup Next.js 15 + Prisma + Clerk
2. Design database schema
3. Implement authentication
4. Create basic UI shell

### Phase 2: Core (Week 2-3)
1. Task CRUD operations
2. Project management
3. Team invites
4. Real-time sync

### Phase 3: Advanced (Week 4)
1. File uploads
2. Comments system
3. Notifications
4. API documentation

### Phase 4: Polish (Week 5)
1. Testing
2. Performance
3. Documentation
4. Deployment
```

### @CTO (Iron Man)
**Task**: Define architecture decisions

```markdown
## Architecture Decisions

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: React Server Components + Zustand

### Backend
- **API**: Next.js API routes + tRPC
- **Database**: PostgreSQL via Prisma
- **Auth**: Clerk (handles OAuth, sessions, teams)

### Infrastructure
- **Hosting**: Vercel (serverless)
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage (files)
- **Real-time**: Supabase Realtime
```

### @Backend (Thor)
**Task**: Implement API endpoints

```typescript
// src/app/api/tasks/route.ts
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const tasks = await prisma.task.findMany({
    where: { 
      OR: [
        { assigneeId: userId },
        { project: { members: { some: { userId } } } }
      ]
    },
    include: { project: true, assignee: true }
  });

  return Response.json(tasks);
}

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const data = await req.json();
  
  const task = await prisma.task.create({
    data: {
      ...data,
      creatorId: userId,
    }
  });

  return Response.json(task);
}
```

### @Frontend (Spider-Man)
**Task**: Build UI components

```tsx
// src/components/tasks/TaskCard.tsx
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Task } from '@prisma/client';

interface TaskCardProps {
  task: Task;
  onUpdate: (task: Task) => void;
}

export function TaskCard({ task, onUpdate }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{task.title}</CardTitle>
        <Badge variant={task.status === 'done' ? 'default' : 'secondary'}>
          {task.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{task.description}</p>
        <div className="flex items-center gap-2 mt-4">
          <span className="text-sm text-muted-foreground">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
```

### @Database (Data)
**Task**: Design schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  
  tasks      Task[]      @relation("Assignee")
  createdTasks Task[]    @relation("Creator")
  projects   ProjectMember[]
  comments   Comment[]
}

model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  createdAt   DateTime @default(now())
  
  tasks      Task[]
  members    ProjectMember[]
}

model ProjectMember {
  id        String @id @default(cuid())
  role      String // owner, admin, member
  projectId String
  userId    String
  
  project Project @relation(fields: [projectId], references: [id])
  user    User    @relation(fields: [userId], references: [id])
}

model Task {
  id          String   @id @default(cuid())
  title       String
  description String?
  status      String   @default("todo") // todo, in_progress, done
  priority    String   @default("medium") // low, medium, high
  dueDate     DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  projectId   String
  assigneeId  String?
  creatorId   String
  
  project     Project   @relation(fields: [projectId], references: [id])
  assignee    User?     @relation("Assignee", fields: [assigneeId], references: [id])
  creator     User      @relation("Creator", fields: [creatorId], references: [id])
  comments    Comment[]
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  createdAt DateTime @default(now())
  
  taskId    String
  authorId  String
  
  task      Task     @relation(fields: [taskId], references: [id])
  author    User     @relation(fields: [authorId], references: [id])
}
```

### @Testing (Ant-Man)
**Task**: Write tests

```typescript
// src/__tests__/tasks.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import { createTask, getTasks } from '@/lib/tasks';

describe('Task Management', () => {
  beforeEach(async () => {
    await prisma.task.deleteMany();
  });

  it('should create a task', async () => {
    const task = await createTask({
      title: 'Test Task',
      description: 'Test Description',
      projectId: 'proj-123'
    });

    expect(task.title).toBe('Test Task');
    expect(task.status).toBe('todo');
  });

  it('should retrieve tasks for user', async () => {
    await createTask({ title: 'Task 1', projectId: 'proj-123' });
    await createTask({ title: 'Task 2', projectId: 'proj-123' });

    const tasks = await getTasks({ userId: 'user-123' });
    
    expect(tasks).toHaveLength(2);
  });
});
```

### @Reviewer (Captain America)
**Task**: Code review

```markdown
## Code Review: Task Management API

### ✅ Strengths
- Proper TypeScript types throughout
- Good use of Prisma relations
- Authentication middleware in place
- RESTful endpoint structure

### ⚠️ Improvements Needed
1. **Add input validation** - Use Zod for request body validation
2. **Add error handling** - Wrap database calls in try-catch
3. **Add pagination** - Tasks could grow large
4. **Add rate limiting** - Protect against abuse

### 🔒 Security
- ✅ Authentication check present
- ⚠️ Need authorization (check user belongs to project)
- ⚠️ Validate file uploads (if adding attachments)

### 📊 Performance
- ✅ Efficient queries with includes
- ⚠️ Add database indexes on frequently queried fields
```

## 📊 Alignment Tracking

Using `ultra-dex diff` to track progress:

```
📋 Implementation Analysis:
Codebase: 45 files, 128 dependencies
Tasks: 12/34 completed

✅ Implemented (12):
   User Authentication ● ✓
   Database Schema ● ✓
   Project Structure ● ✓
   Basic UI Layout ● ✓

⚠️ Partial (8):
   Task Management ◐ ⋯
   Project Organization ◐ ⋯

📝 Planned (10):
   Real-time Updates ○ 
   File Attachments ○

🎯 Alignment Score: 72%
```

## 🎓 What We Learned

### Ultra-Dex Benefits
1. **Structured Planning** - 34-section template prevented "forgot X" syndrome
2. **AI Coordination** - Agents worked together without conflicting
3. **Context Persistence** - CONTEXT.md kept AI memory across sessions
4. **Quality Gates** - 21-step verification caught issues early
5. **Real-time Monitoring** - Dashboard showed exactly what was happening

### Challenges Overcome
1. **Complex Authentication** - @Auth agent designed secure multi-tenant system
2. **Database Relations** - @Database agent optimized Prisma schema
3. **UI Consistency** - @Frontend agent maintained design system
4. **Testing Strategy** - @Testing agent ensured coverage

## 🚀 Next Steps

To continue this project:

```bash
# 1. Run swarm for next phase
npx ultra-dex swarm "Build task CRUD with real-time updates"

# 2. Sync context after changes
npx ultra-dex brain

# 3. Check progress
npx ultra-dex diff

# 4. Validate quality
npx ultra-dex validate --scan

# 5. Deploy when ready
npx ultra-dex build
```

## 📚 Additional Resources

- [Full Template](../../04-Imp-Template.md)
- [Methodology Guide](../../03-METHODOLOGY.md)
- [Cursor Rules](../../../cursor-rules/)
- [Agent Prompts](../../../agents/)

---

**Status**: Phase 2 in progress  
**Alignment**: 72%  
**Next Milestone**: Complete task management

*Generated with Ultra-Dex v3.4.5*
