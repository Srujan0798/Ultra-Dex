# TaskFlow - Complete Implementation Plan

> **What is this?** A fully filled example of the Ultra-Dex SaaS Implementation Template.
> **Purpose:** Prove the template works by showing real, specific content for ALL 34 sections.
> **SaaS:** TaskFlow - A modern task management application with teams, real-time sync, and AI features.

> ⚠️ **DON'T BE INTIMIDATED BY THE LENGTH!**
> This is a **COMPLETE** example (3,000+ lines). You do NOT need to fill all 34 sections before coding.
> Use this as a **REFERENCE**, not a **PREREQUISITE**.

## How to Use This Example

**As a New User:**
1. Don't read all 3,000 lines — that's not the point
2. Open it **side-by-side** with your own template
3. Copy the **structure** for sections you're filling
4. Pattern-match: "Oh, so Section 10 should look like THIS"

**When You're Stuck:**
- "What should Section 11 (API) contain?" → Search for "SECTION 11" here
- "How detailed should tasks be?" → See Section 16

**What to Copy:** Structure and format, NOT content (it's a different app!)

## 📚 Jump to Section

**Product & Planning:**
[1. Product Definition](#section-1-product-definition--ai-instructions) | [2. Tech Stack](#section-2-tech-stack) | [3. Database](#section-3-database-design) | [4. User Personas](#section-4-user-personas) | [5. User Stories](#section-5-user-stories)

**Core Development:**
[6. Screen Map](#section-6-screen-map) | [7. UX/UI](#section-7-uxui-specifications) | [8. Navigation](#section-8-navigation) | [9. Components](#section-9-component-library) | [10. Data Model](#section-10-data-model)

**APIs & Architecture:**
[11. API Blueprint](#section-11-api-blueprint) | [12. Payments](#section-12-payment-integration) | [13. Auth](#section-13-authentication) | [14. Realtime](#section-14-realtime-features) | [15. Third-party](#section-15-third-party-integrations)

**Implementation:**
[16. Tasks](#section-16-implementation-plan) | [17. Milestones](#section-17-milestones) | [18. Timeline](#section-18-timeline) | [19. Deployment](#section-19-deployment) | [20. Testing](#section-20-testing-strategy)

**Production Prep:**
[21. Security](#section-21-security) | [22. Performance](#section-22-performance) | [23. Monitoring](#section-23-monitoring) | [24. Scaling](#section-24-scaling-strategy)

**Polish & Legal:**
[25. Docs](#section-25-documentation) | [26. Support](#section-26-support) | [27. Error Handling](#section-27-error-handling) | [28. Legal](#section-28-legal) | [29. SEO](#section-29-seo)

**Advanced:**
[30. i18n](#section-30-internationalization) | [31. Analytics](#section-31-analytics) | [32. AI Features](#section-32-ai-features) | [33. Mobile](#section-33-mobile) | [34. Future](#section-34-future-roadmap)

---

# SECTION 1: PRODUCT DEFINITION & AI INSTRUCTIONS

## 1.1 Product Overview

**Product Name:** TaskFlow
**Tagline:** "Team tasks, beautifully organized"
**One-liner:** A modern task management app for small teams with real-time collaboration, AI task suggestions, and Stripe-powered subscriptions.

**Problem Statement:**
Small teams (2-15 people) struggle with task management because:
1. Enterprise tools (Jira, Monday) are too complex and expensive
2. Simple tools (Apple Reminders, Google Tasks) lack collaboration
3. Existing mid-tier tools have poor UX or missing features

**Solution:**
TaskFlow provides the perfect middle ground:
- Simple, beautiful interface (inspired by Linear)
- Real-time collaboration without page refreshes
- AI-powered task suggestions and deadline predictions
- Fair pricing ($8/user/month)

**Target Audience:**
- Primary: Startup teams (5-15 people)
- Secondary: Freelancers with clients
- Tertiary: Small agencies

## 1.2 AI Agent Instructions

**Quality Standards (Non-Negotiable):**
1. Every function must have error handling
2. Every API endpoint must validate input with Zod
3. Every database query must use parameterized queries
4. Every component must be accessible (WCAG 2.1 AA)
5. Every feature must have at least one test

**Specificity Rules:**
- Never use generic names like `data`, `info`, `item`
- Always use descriptive names: `taskPayload`, `userProfile`, `projectMetrics`
- Never hardcode values - use environment variables or constants
- Always include TypeScript types - no `any` allowed

**Output Format:**
- Start each file with a brief comment explaining its purpose
- Group imports: external, internal, types
- Use consistent naming: camelCase for variables, PascalCase for components
- Max file length: 300 lines (split if larger)

## 1.3 Core Features (MVP)

| Feature | Priority | Complexity | User Value |
|---------|----------|------------|------------|
| User Authentication (Email + Google) | P0 | Medium | Critical |
| Create/Edit/Delete Tasks | P0 | Low | Critical |
| Project Organization | P0 | Medium | High |
| Team Invitations | P0 | Medium | High |
| Real-time Task Updates | P1 | High | High |
| Task Comments | P1 | Medium | Medium |
| AI Task Suggestions | P2 | High | Medium |
| Stripe Subscription Billing | P0 | High | Critical |
| Email Notifications | P1 | Medium | Medium |

## 1.4 Success Metrics

| Metric | Target (Month 1) | Target (Month 6) | Target (Year 1) |
|--------|------------------|------------------|-----------------|
| Registered Users | 100 | 1,000 | 10,000 |
| Paid Teams | 5 | 50 | 500 |
| MRR | $200 | $2,000 | $20,000 |
| Churn Rate | <10% | <7% | <5% |
| NPS Score | >30 | >40 | >50 |

---

# SECTION 2: TECH STACK DECISIONS

## 2.1 Frontend Stack

| Layer | Technology | Version | Justification |
|-------|------------|---------|---------------|
| Framework | Next.js | 14.x | App Router, Server Components, excellent DX |
| Language | TypeScript | 5.3+ | Type safety, better tooling |
| Styling | Tailwind CSS | 3.4+ | Rapid UI development, consistent design |
| UI Components | shadcn/ui | Latest | Accessible, customizable, no vendor lock-in |
| State Management | Zustand | 4.x | Simple, TypeScript-first, small bundle |
| Forms | React Hook Form + Zod | 7.x + 3.x | Type-safe validation |
| Data Fetching | TanStack Query | 5.x | Caching, optimistic updates, real-time |
| Real-time | Pusher | Latest | Managed WebSockets, reliable |

## 2.2 Backend Stack

| Layer | Technology | Version | Justification |
|-------|------------|---------|---------------|
| Runtime | Node.js | 20 LTS | Stable, wide ecosystem |
| Framework | Next.js API Routes | 14.x | Unified codebase, edge support |
| Database | PostgreSQL | 16 | ACID, JSON support, proven reliability |
| ORM | Prisma | 5.x | Type-safe queries, migrations, studio |
| Cache | Upstash Redis | Serverless | Session store, rate limiting |
| File Storage | Cloudflare R2 | N/A | S3-compatible, no egress fees |
| Email | Resend | Latest | Developer-friendly, good deliverability |
| Payments | Stripe | Latest | Industry standard, excellent docs |
| Auth | NextAuth.js | 5.x (Auth.js) | Built for Next.js, multiple providers |

## 2.3 Infrastructure

| Component | Provider | Plan | Monthly Cost |
|-----------|----------|------|--------------|
| Hosting | Vercel | Pro | $20 |
| Database | Neon | Launch | $19 |
| Redis | Upstash | Pay-as-you-go | ~$5 |
| File Storage | Cloudflare R2 | Free tier | $0 |
| Email | Resend | Free tier (3k/month) | $0 |
| Real-time | Pusher | Sandbox → Startup | $0-$49 |
| Monitoring | Sentry | Team | $26 |
| Analytics | PostHog | Free tier | $0 |

**Total MVP Cost: ~$70-120/month**

## 2.4 Development Tools

| Tool | Purpose |
|------|---------|
| pnpm | Package manager (faster, disk efficient) |
| ESLint | Code linting |
| Prettier | Code formatting |
| Husky | Git hooks |
| lint-staged | Pre-commit linting |
| Vitest | Unit testing |
| Playwright | E2E testing |
| GitHub Actions | CI/CD |

---

# SECTION 3: DATABASE SCHEMA

## 3.1 Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      User       │────<│   TeamMember    │>────│      Team       │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ email           │     │ userId (FK)     │     │ name            │
│ name            │     │ teamId (FK)     │     │ slug            │
│ avatarUrl       │     │ role            │     │ ownerId (FK)    │
│ createdAt       │     │ joinedAt        │     │ stripeCustomerId│
│ updatedAt       │     └─────────────────┘     │ subscriptionId  │
└─────────────────┘                             │ plan            │
        │                                       │ createdAt       │
        │                                       └─────────────────┘
        │                                               │
        ▼                                               ▼
┌─────────────────┐                             ┌─────────────────┐
│    Account      │                             │     Project     │
├─────────────────┤                             ├─────────────────┤
│ id (PK)         │                             │ id (PK)         │
│ userId (FK)     │                             │ teamId (FK)     │
│ provider        │                             │ name            │
│ providerAcctId  │                             │ description     │
│ accessToken     │                             │ color           │
│ refreshToken    │                             │ createdAt       │
└─────────────────┘                             │ updatedAt       │
                                                └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Comment     │────<│      Task       │>────│      Label      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ taskId (FK)     │     │ projectId (FK)  │     │ teamId (FK)     │
│ authorId (FK)   │     │ title           │     │ name            │
│ content         │     │ description     │     │ color           │
│ createdAt       │     │ status          │     └─────────────────┘
└─────────────────┘     │ priority        │
                        │ assigneeId (FK) │
                        │ dueDate         │
                        │ position        │
                        │ createdAt       │
                        │ updatedAt       │
                        └─────────────────┘
```

## 3.2 Prisma Schema

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
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  avatarUrl     String?
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  teamMembers   TeamMember[]
  ownedTeams    Team[]       @relation("TeamOwner")
  assignedTasks Task[]       @relation("TaskAssignee")
  comments      Comment[]

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model Team {
  id               String   @id @default(cuid())
  name             String
  slug             String   @unique
  ownerId          String
  stripeCustomerId String?  @unique
  subscriptionId   String?  @unique
  plan             Plan     @default(FREE)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  owner    User         @relation("TeamOwner", fields: [ownerId], references: [id])
  members  TeamMember[]
  projects Project[]
  labels   Label[]
  invites  TeamInvite[]

  @@map("teams")
}

enum Plan {
  FREE
  PRO
  ENTERPRISE
}

model TeamMember {
  id       String   @id @default(cuid())
  userId   String
  teamId   String
  role     Role     @default(MEMBER)
  joinedAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@unique([userId, teamId])
  @@map("team_members")
}

enum Role {
  OWNER
  ADMIN
  MEMBER
}

model TeamInvite {
  id        String   @id @default(cuid())
  email     String
  teamId    String
  role      Role     @default(MEMBER)
  token     String   @unique @default(cuid())
  expiresAt DateTime
  createdAt DateTime @default(now())

  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@unique([email, teamId])
  @@map("team_invites")
}

model Project {
  id          String   @id @default(cuid())
  teamId      String
  name        String
  description String?
  color       String   @default("#6366f1")
  archived    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  team  Team   @relation(fields: [teamId], references: [id], onDelete: Cascade)
  tasks Task[]

  @@map("projects")
}

model Task {
  id          String     @id @default(cuid())
  projectId   String
  title       String
  description String?    @db.Text
  status      TaskStatus @default(TODO)
  priority    Priority   @default(MEDIUM)
  assigneeId  String?
  dueDate     DateTime?
  position    Int        @default(0)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  project  Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignee User?       @relation("TaskAssignee", fields: [assigneeId], references: [id])
  comments Comment[]
  labels   TaskLabel[]

  @@index([projectId, status])
  @@index([assigneeId])
  @@map("tasks")
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  DONE
  CANCELLED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

model Label {
  id     String @id @default(cuid())
  teamId String
  name   String
  color  String @default("#6366f1")

  team  Team        @relation(fields: [teamId], references: [id], onDelete: Cascade)
  tasks TaskLabel[]

  @@unique([teamId, name])
  @@map("labels")
}

model TaskLabel {
  taskId  String
  labelId String

  task  Task  @relation(fields: [taskId], references: [id], onDelete: Cascade)
  label Label @relation(fields: [labelId], references: [id], onDelete: Cascade)

  @@id([taskId, labelId])
  @@map("task_labels")
}

model Comment {
  id        String   @id @default(cuid())
  taskId    String
  authorId  String
  content   String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  task   Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  author User @relation(fields: [authorId], references: [id])

  @@map("comments")
}
```

## 3.3 Database Indexes Strategy

```sql
-- Performance indexes (add via Prisma migration)

-- Tasks: Most queried table
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id) WHERE assignee_id IS NOT NULL;
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;

-- Team members: Frequent lookups
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);

-- Full-text search on tasks
CREATE INDEX idx_tasks_search ON tasks USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
```

---

# SECTION 4: API DESIGN

## 4.1 API Routes Overview

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /api/auth/[...nextauth] | NextAuth handlers | No |
| GET | /api/user | Get current user | Yes |
| PATCH | /api/user | Update profile | Yes |
| GET | /api/teams | List user's teams | Yes |
| POST | /api/teams | Create team | Yes |
| GET | /api/teams/[teamId] | Get team details | Yes (Member) |
| PATCH | /api/teams/[teamId] | Update team | Yes (Admin) |
| DELETE | /api/teams/[teamId] | Delete team | Yes (Owner) |
| POST | /api/teams/[teamId]/invite | Invite member | Yes (Admin) |
| GET | /api/teams/[teamId]/projects | List projects | Yes (Member) |
| POST | /api/teams/[teamId]/projects | Create project | Yes (Member) |
| GET | /api/projects/[projectId] | Get project | Yes (Member) |
| PATCH | /api/projects/[projectId] | Update project | Yes (Member) |
| DELETE | /api/projects/[projectId] | Delete project | Yes (Admin) |
| GET | /api/projects/[projectId]/tasks | List tasks | Yes (Member) |
| POST | /api/projects/[projectId]/tasks | Create task | Yes (Member) |
| GET | /api/tasks/[taskId] | Get task | Yes (Member) |
| PATCH | /api/tasks/[taskId] | Update task | Yes (Member) |
| DELETE | /api/tasks/[taskId] | Delete task | Yes (Member) |
| POST | /api/tasks/[taskId]/comments | Add comment | Yes (Member) |
| POST | /api/stripe/checkout | Create checkout | Yes (Admin) |
| POST | /api/stripe/portal | Customer portal | Yes (Admin) |
| POST | /api/webhooks/stripe | Stripe webhooks | No (Verified) |

## 4.2 Request/Response Examples

### Create Task

**Request:**
```http
POST /api/projects/proj_abc123/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Design landing page mockups",
  "description": "Create 3 variations of the landing page for A/B testing",
  "priority": "HIGH",
  "assigneeId": "user_xyz789",
  "dueDate": "2024-02-15T00:00:00Z",
  "labelIds": ["label_design", "label_urgent"]
}
```

**Response (201 Created):**
```json
{
  "id": "task_def456",
  "projectId": "proj_abc123",
  "title": "Design landing page mockups",
  "description": "Create 3 variations of the landing page for A/B testing",
  "status": "TODO",
  "priority": "HIGH",
  "assignee": {
    "id": "user_xyz789",
    "name": "Sarah Chen",
    "avatarUrl": "https://..."
  },
  "dueDate": "2024-02-15T00:00:00Z",
  "labels": [
    { "id": "label_design", "name": "Design", "color": "#8b5cf6" },
    { "id": "label_urgent", "name": "Urgent", "color": "#ef4444" }
  ],
  "position": 0,
  "createdAt": "2024-02-01T10:30:00Z",
  "updatedAt": "2024-02-01T10:30:00Z"
}
```

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "title",
        "message": "Title must be between 1 and 200 characters"
      }
    ]
  }
}
```

## 4.3 Validation Schemas (Zod)

```typescript
// lib/validations/task.ts

import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(10000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  assigneeId: z.string().cuid().optional(),
  dueDate: z.string().datetime().optional(),
  labelIds: z.array(z.string().cuid()).max(10).optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED']).optional(),
  position: z.number().int().min(0).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
```

---

# SECTION 5: AUTHENTICATION & AUTHORIZATION

## 5.1 Authentication Flow

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────┐
│  User   │────>│  NextAuth   │────>│   Provider  │────>│ Callback │
└─────────┘     └─────────────┘     │  (Google/   │     └──────────┘
                                    │   Email)    │           │
                                    └─────────────┘           │
                                                              ▼
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────┐
│ Session │<────│   JWT/DB    │<────│ Create/Get  │<────│ Verify   │
│ Cookie  │     │   Session   │     │    User     │     │ Identity │
└─────────┘     └─────────────┘     └─────────────┘     └──────────┘
```

## 5.2 NextAuth Configuration

```typescript
// lib/auth.ts

import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Resend from 'next-auth/providers/resend';
import { prisma } from '@/lib/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from: 'TaskFlow <noreply@taskflow.app>',
    }),
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/verify-email',
    error: '/auth-error',
  },
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // After sign in, redirect to dashboard
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/dashboard`;
      }
      return url;
    },
  },
});
```

## 5.3 Authorization Middleware

```typescript
// lib/auth/permissions.ts

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';

export type Permission = 'team:read' | 'team:write' | 'team:admin' | 'team:owner';

const rolePermissions: Record<Role, Permission[]> = {
  MEMBER: ['team:read', 'team:write'],
  ADMIN: ['team:read', 'team:write', 'team:admin'],
  OWNER: ['team:read', 'team:write', 'team:admin', 'team:owner'],
};

export async function requireTeamPermission(
  teamId: string,
  requiredPermission: Permission
) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 };
  }

  const membership = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: {
        userId: session.user.id,
        teamId,
      },
    },
  });

  if (!membership) {
    return { error: 'Not a team member', status: 403 };
  }

  const permissions = rolePermissions[membership.role];

  if (!permissions.includes(requiredPermission)) {
    return { error: 'Insufficient permissions', status: 403 };
  }

  return { user: session.user, membership };
}

// Usage in API route
export async function PATCH(
  req: Request,
  { params }: { params: { teamId: string } }
) {
  const authResult = await requireTeamPermission(params.teamId, 'team:admin');

  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  // Authorized - proceed with update
  const { user, membership } = authResult;
  // ...
}
```

## 5.4 Session Security

| Security Measure | Implementation |
|------------------|----------------|
| Session Storage | HTTP-only, Secure, SameSite=Lax cookies |
| Token Rotation | Automatic refresh every 24 hours |
| CSRF Protection | Built into NextAuth |
| Rate Limiting | 5 login attempts per minute per IP |
| Brute Force Protection | 30-minute lockout after 10 failed attempts |

---

# SECTION 6: FRONTEND ARCHITECTURE

## 6.1 Directory Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth routes (no nav)
│   │   ├── login/
│   │   ├── signup/
│   │   └── verify-email/
│   ├── (dashboard)/         # Main app (with nav)
│   │   ├── layout.tsx       # Dashboard layout
│   │   ├── dashboard/       # Dashboard home
│   │   ├── [teamSlug]/      # Team context
│   │   │   ├── projects/
│   │   │   ├── settings/
│   │   │   └── members/
│   │   └── settings/        # User settings
│   ├── api/                 # API routes
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── forms/               # Form components
│   ├── layout/              # Layout components
│   └── features/            # Feature-specific
│       ├── tasks/
│       ├── projects/
│       └── teams/
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities
│   ├── auth.ts
│   ├── prisma.ts
│   ├── pusher.ts
│   └── utils.ts
├── stores/                  # Zustand stores
└── types/                   # TypeScript types
```

## 6.2 Component Architecture

```typescript
// components/features/tasks/task-card.tsx

'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Circle, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { TaskWithRelations } from '@/types/task';

interface TaskCardProps {
  task: TaskWithRelations;
  onClick?: () => void;
  isDragging?: boolean;
}

const priorityColors = {
  LOW: 'bg-slate-100 text-slate-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

const statusIcons = {
  TODO: Circle,
  IN_PROGRESS: Clock,
  IN_REVIEW: Clock,
  DONE: CheckCircle2,
  CANCELLED: Circle,
};

export function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  const StatusIcon = statusIcons[task.status];

  const isOverdue = useMemo(() => {
    if (!task.dueDate || task.status === 'DONE') return false;
    return new Date(task.dueDate) < new Date();
  }, [task.dueDate, task.status]);

  return (
    <Card
      className={cn(
        'p-3 cursor-pointer hover:shadow-md transition-shadow',
        isDragging && 'opacity-50 rotate-2',
        task.status === 'DONE' && 'opacity-60'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <StatusIcon
          className={cn(
            'h-5 w-5 mt-0.5 shrink-0',
            task.status === 'DONE' && 'text-green-500'
          )}
        />
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'font-medium truncate',
              task.status === 'DONE' && 'line-through'
            )}
          >
            {task.title}
          </p>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge
              variant="secondary"
              className={priorityColors[task.priority]}
            >
              {task.priority.toLowerCase()}
            </Badge>

            {task.labels.map((label) => (
              <Badge
                key={label.id}
                style={{ backgroundColor: label.color }}
                className="text-white"
              >
                {label.name}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3">
            {task.dueDate && (
              <span
                className={cn(
                  'text-xs text-muted-foreground',
                  isOverdue && 'text-red-500 font-medium'
                )}
              >
                {format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}

            {task.assignee && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={task.assignee.avatarUrl || undefined} />
                <AvatarFallback>
                  {task.assignee.name?.[0] || <User className="h-3 w-3" />}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
```

## 6.3 State Management (Zustand)

```typescript
// stores/task-store.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Task, TaskStatus } from '@prisma/client';

interface TaskState {
  tasks: Record<string, Task>;
  taskIdsByProject: Record<string, string[]>;
  selectedTaskId: string | null;

  // Actions
  setTasks: (projectId: string, tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  removeTask: (taskId: string) => void;
  moveTask: (taskId: string, newStatus: TaskStatus, newPosition: number) => void;
  selectTask: (taskId: string | null) => void;
}

export const useTaskStore = create<TaskState>()(
  immer((set) => ({
    tasks: {},
    taskIdsByProject: {},
    selectedTaskId: null,

    setTasks: (projectId, tasks) =>
      set((state) => {
        tasks.forEach((task) => {
          state.tasks[task.id] = task;
        });
        state.taskIdsByProject[projectId] = tasks.map((t) => t.id);
      }),

    addTask: (task) =>
      set((state) => {
        state.tasks[task.id] = task;
        const projectTasks = state.taskIdsByProject[task.projectId] || [];
        state.taskIdsByProject[task.projectId] = [task.id, ...projectTasks];
      }),

    updateTask: (taskId, updates) =>
      set((state) => {
        if (state.tasks[taskId]) {
          Object.assign(state.tasks[taskId], updates);
        }
      }),

    removeTask: (taskId) =>
      set((state) => {
        const task = state.tasks[taskId];
        if (task) {
          delete state.tasks[taskId];
          const projectTasks = state.taskIdsByProject[task.projectId];
          if (projectTasks) {
            state.taskIdsByProject[task.projectId] = projectTasks.filter(
              (id) => id !== taskId
            );
          }
        }
      }),

    moveTask: (taskId, newStatus, newPosition) =>
      set((state) => {
        if (state.tasks[taskId]) {
          state.tasks[taskId].status = newStatus;
          state.tasks[taskId].position = newPosition;
        }
      }),

    selectTask: (taskId) =>
      set((state) => {
        state.selectedTaskId = taskId;
      }),
  }))
);
```

---

# SECTION 7: REAL-TIME FEATURES

## 7.1 Real-time Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Client A     │     │     Pusher      │     │    Client B     │
│   (Browser)     │     │    Channels     │     │   (Browser)     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  Subscribe to         │                       │
         │  "project-abc"        │                       │
         │──────────────────────>│<──────────────────────│
         │                       │                       │
         │  Task Created         │                       │
         │──────────────────────>│                       │
         │                       │  Broadcast to all     │
         │                       │  subscribers          │
         │<──────────────────────│──────────────────────>│
         │                       │                       │
         │  Update UI            │         Update UI     │
         ▼                       │                       ▼
```

## 7.2 Pusher Configuration

```typescript
// lib/pusher/server.ts

import Pusher from 'pusher';

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// Event types for type safety
export type PusherEvent =
  | { type: 'task:created'; data: Task }
  | { type: 'task:updated'; data: { id: string; updates: Partial<Task> } }
  | { type: 'task:deleted'; data: { id: string } }
  | { type: 'comment:created'; data: Comment }
  | { type: 'member:joined'; data: TeamMember };

export async function broadcastToProject(
  projectId: string,
  event: PusherEvent
) {
  await pusherServer.trigger(
    `project-${projectId}`,
    event.type,
    event.data
  );
}
```

```typescript
// lib/pusher/client.ts

import PusherClient from 'pusher-js';

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY!,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  }
);
```

## 7.3 Real-time Hook

```typescript
// hooks/use-project-realtime.ts

import { useEffect } from 'react';
import { pusherClient } from '@/lib/pusher/client';
import { useTaskStore } from '@/stores/task-store';
import type { Task, Comment } from '@prisma/client';

export function useProjectRealtime(projectId: string) {
  const { addTask, updateTask, removeTask } = useTaskStore();

  useEffect(() => {
    const channel = pusherClient.subscribe(`project-${projectId}`);

    channel.bind('task:created', (task: Task) => {
      addTask(task);
    });

    channel.bind('task:updated', ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      updateTask(id, updates);
    });

    channel.bind('task:deleted', ({ id }: { id: string }) => {
      removeTask(id);
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(`project-${projectId}`);
    };
  }, [projectId, addTask, updateTask, removeTask]);
}
```

---

# SECTION 8: PAYMENT INTEGRATION

## 8.1 Pricing Model

| Plan | Price | Users | Features |
|------|-------|-------|----------|
| Free | $0 | 3 | 1 project, 100 tasks, basic features |
| Pro | $8/user/month | Unlimited | Unlimited projects, AI features, priority support |
| Enterprise | Custom | Unlimited | SSO, audit logs, dedicated support |

## 8.2 Stripe Products Setup

```typescript
// scripts/setup-stripe.ts

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function setupStripeProducts() {
  // Create Pro product
  const proProduct = await stripe.products.create({
    name: 'TaskFlow Pro',
    description: 'Unlimited projects and AI features for your team',
  });

  // Create monthly price
  const monthlyPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 800, // $8.00
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
    metadata: {
      plan: 'PRO',
    },
  });

  // Create annual price (20% discount)
  const annualPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 7680, // $76.80 ($6.40/month)
    currency: 'usd',
    recurring: {
      interval: 'year',
    },
    metadata: {
      plan: 'PRO',
    },
  });

  console.log('Monthly Price ID:', monthlyPrice.id);
  console.log('Annual Price ID:', annualPrice.id);
}
```

## 8.3 Checkout Flow

```typescript
// app/api/stripe/checkout/route.ts

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireTeamPermission } from '@/lib/auth/permissions';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { teamId, priceId, quantity } = await req.json();

  // Verify admin permission
  const authResult = await requireTeamPermission(teamId, 'team:admin');
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  // Create or get Stripe customer
  let customerId = team.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email!,
      metadata: { teamId },
    });
    customerId = customer.id;
    await prisma.team.update({
      where: { id: teamId },
      data: { stripeCustomerId: customerId },
    });
  }

  // Create checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/${team.slug}/settings/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/${team.slug}/settings/billing?canceled=true`,
    subscription_data: {
      metadata: { teamId },
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
```

## 8.4 Webhook Handler

```typescript
// app/api/webhooks/stripe/route.ts

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const teamId = session.metadata?.teamId;

      if (teamId && session.subscription) {
        await prisma.team.update({
          where: { id: teamId },
          data: {
            subscriptionId: session.subscription as string,
            plan: 'PRO',
          },
        });
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const teamId = subscription.metadata?.teamId;

      if (teamId) {
        const plan = subscription.status === 'active' ? 'PRO' : 'FREE';
        await prisma.team.update({
          where: { id: teamId },
          data: { plan },
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const teamId = subscription.metadata?.teamId;

      if (teamId) {
        await prisma.team.update({
          where: { id: teamId },
          data: {
            subscriptionId: null,
            plan: 'FREE',
          },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

---

# SECTION 9: UI/UX SPECIFICATIONS

## 9.1 Design System

### Colors

```css
/* Tailwind CSS configuration */
:root {
  /* Brand */
  --primary: 239 84% 67%;        /* #6366f1 - Indigo */
  --primary-foreground: 0 0% 100%;

  /* Semantic */
  --success: 142 76% 36%;        /* Green */
  --warning: 38 92% 50%;         /* Amber */
  --destructive: 0 84% 60%;      /* Red */

  /* Task Status */
  --status-todo: 215 20% 65%;
  --status-progress: 199 89% 48%;
  --status-review: 262 83% 58%;
  --status-done: 142 76% 36%;

  /* Priority */
  --priority-low: 215 16% 47%;
  --priority-medium: 217 91% 60%;
  --priority-high: 25 95% 53%;
  --priority-urgent: 0 84% 60%;
}
```

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| H1 | Inter | 36px | 700 |
| H2 | Inter | 24px | 600 |
| H3 | Inter | 18px | 600 |
| Body | Inter | 14px | 400 |
| Small | Inter | 12px | 400 |
| Code | JetBrains Mono | 13px | 400 |

### Spacing

Base unit: 4px
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

## 9.2 Key Screens Wireframes

### Dashboard

```
┌────────────────────────────────────────────────────────────────┐
│  [Logo]  TaskFlow        [Search...]         [Avatar ▼]       │
├────────────┬───────────────────────────────────────────────────┤
│            │                                                   │
│  PROJECTS  │  Good morning, Sarah!                            │
│            │                                                   │
│  ▼ Acme    │  ┌─────────────────────────────────────────────┐ │
│    Website │  │  📊 This Week                               │ │
│    Mobile  │  │                                             │ │
│            │  │  Tasks Due: 5    Completed: 12    Overdue: 2│ │
│  ▼ Personal│  └─────────────────────────────────────────────┘ │
│    Side    │                                                   │
│            │  ┌─────────────────────────────────────────────┐ │
│  ──────────│  │  📋 Recent Tasks                            │ │
│  [+ New]   │  │                                             │ │
│            │  │  ○ Design landing page         Due Today   │ │
│  TEAM      │  │  ○ Write API documentation     Tomorrow    │ │
│            │  │  ○ Fix login bug               Overdue     │ │
│  Sarah     │  │  ✓ Set up CI/CD               Completed    │ │
│  Mike      │  └─────────────────────────────────────────────┘ │
│  Lisa      │                                                   │
│            │                                                   │
└────────────┴───────────────────────────────────────────────────┘
```

### Kanban Board

```
┌────────────────────────────────────────────────────────────────┐
│  [←]  Website Redesign          [Filter ▼]  [+ Add Task]      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   TODO (3)          IN PROGRESS (2)    IN REVIEW (1)   DONE   │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐    ┌─────┐ │
│  │ Homepage │      │ About    │      │ Contact  │    │ Nav │ │
│  │ design   │      │ page     │      │ form     │    │     │ │
│  │ ──────── │      │ ──────── │      │ ──────── │    └─────┘ │
│  │ 🔴 High  │      │ 🟡 Med   │      │ 🟢 Low   │    ┌─────┐ │
│  │ Feb 15   │      │ Feb 18   │      │ Feb 20   │    │ ...│ │
│  │ [Sarah]  │      │ [Mike]   │      │ [Lisa]   │    └─────┘ │
│  └──────────┘      └──────────┘      └──────────┘            │
│  ┌──────────┐      ┌──────────┐                              │
│  │ Footer   │      │ Mobile   │                              │
│  │ section  │      │ menu     │                              │
│  └──────────┘      └──────────┘                              │
│  ┌──────────┐                                                 │
│  │ SEO meta │                                                 │
│  │ tags     │                                                 │
│  └──────────┘                                                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## 9.3 Interactive States

| Component | Default | Hover | Active | Disabled |
|-----------|---------|-------|--------|----------|
| Button Primary | bg-primary | bg-primary/90 | scale-98 | opacity-50 |
| Button Secondary | bg-secondary | bg-secondary/80 | scale-98 | opacity-50 |
| Card | shadow-sm | shadow-md | shadow-sm | opacity-60 |
| Input | border-input | border-ring | border-primary | bg-muted |
| Link | text-primary | underline | text-primary/80 | text-muted |

---

# SECTION 10: TESTING STRATEGY

## 10.1 Testing Pyramid

```
                    ┌─────────────┐
                    │     E2E     │  5-10 critical flows
                    │  Playwright │
                   ─┴─────────────┴─
                  ┌─────────────────┐
                  │   Integration   │  API routes, DB queries
                  │     Vitest      │
                 ─┴─────────────────┴─
                ┌───────────────────────┐
                │      Unit Tests       │  Utils, hooks, components
                │        Vitest         │
               ─┴───────────────────────┴─
```

## 10.2 Test Coverage Requirements

| Category | Minimum Coverage | Target |
|----------|------------------|--------|
| Utils/Helpers | 90% | 95% |
| API Routes | 80% | 90% |
| Components | 70% | 80% |
| Hooks | 80% | 90% |
| E2E (Flows) | N/A | 100% of critical paths |

## 10.3 Unit Test Example

```typescript
// lib/__tests__/utils.test.ts

import { describe, it, expect } from 'vitest';
import { formatTaskDueDate, isTaskOverdue, generateSlug } from '../utils';

describe('formatTaskDueDate', () => {
  it('returns "Today" for tasks due today', () => {
    const today = new Date();
    expect(formatTaskDueDate(today)).toBe('Today');
  });

  it('returns "Tomorrow" for tasks due tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(formatTaskDueDate(tomorrow)).toBe('Tomorrow');
  });

  it('returns formatted date for other dates', () => {
    const date = new Date('2024-03-15');
    expect(formatTaskDueDate(date)).toBe('Mar 15');
  });
});

describe('isTaskOverdue', () => {
  it('returns true for past due dates', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isTaskOverdue(yesterday, 'TODO')).toBe(true);
  });

  it('returns false for completed tasks', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isTaskOverdue(yesterday, 'DONE')).toBe(false);
  });

  it('returns false for future dates', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isTaskOverdue(tomorrow, 'TODO')).toBe(false);
  });
});

describe('generateSlug', () => {
  it('converts to lowercase and replaces spaces', () => {
    expect(generateSlug('My Team Name')).toBe('my-team-name');
  });

  it('removes special characters', () => {
    expect(generateSlug('Team @#$ Name!')).toBe('team-name');
  });

  it('handles multiple spaces', () => {
    expect(generateSlug('Team    Name')).toBe('team-name');
  });
});
```

## 10.4 Integration Test Example

```typescript
// app/api/tasks/__tests__/route.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { prisma } from '@/lib/prisma';
import { POST as createTask } from '../route';

describe('POST /api/projects/[projectId]/tasks', () => {
  let testUser: User;
  let testTeam: Team;
  let testProject: Project;

  beforeEach(async () => {
    // Seed test data
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
      },
    });

    testTeam = await prisma.team.create({
      data: {
        name: 'Test Team',
        slug: 'test-team',
        ownerId: testUser.id,
        members: {
          create: { userId: testUser.id, role: 'OWNER' },
        },
      },
    });

    testProject = await prisma.project.create({
      data: {
        name: 'Test Project',
        teamId: testTeam.id,
      },
    });
  });

  afterEach(async () => {
    await prisma.task.deleteMany();
    await prisma.project.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.team.deleteMany();
    await prisma.user.deleteMany();
  });

  it('creates a task with valid input', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        title: 'Test Task',
        priority: 'HIGH',
      },
    });

    // Mock auth
    vi.mock('@/lib/auth', () => ({
      auth: () => Promise.resolve({ user: { id: testUser.id } }),
    }));

    await createTask(req, { params: { projectId: testProject.id } });

    expect(res._getStatusCode()).toBe(201);
    const task = JSON.parse(res._getData());
    expect(task.title).toBe('Test Task');
    expect(task.priority).toBe('HIGH');
    expect(task.status).toBe('TODO');
  });

  it('returns 400 for missing title', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        priority: 'HIGH',
      },
    });

    await createTask(req, { params: { projectId: testProject.id } });

    expect(res._getStatusCode()).toBe(400);
    const error = JSON.parse(res._getData());
    expect(error.error.code).toBe('VALIDATION_ERROR');
  });
});
```

## 10.5 E2E Test Example

```typescript
// e2e/task-management.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login via API to speed up tests
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('test-auth', 'true');
    });
  });

  test('user can create a new task', async ({ page }) => {
    await page.goto('/acme/projects/website');

    // Click add task button
    await page.click('[data-testid="add-task-button"]');

    // Fill in task details
    await page.fill('[data-testid="task-title-input"]', 'New landing page design');
    await page.selectOption('[data-testid="priority-select"]', 'HIGH');
    await page.click('[data-testid="assignee-select"]');
    await page.click('[data-testid="assignee-option-sarah"]');

    // Submit
    await page.click('[data-testid="create-task-submit"]');

    // Verify task appears in TODO column
    await expect(page.locator('[data-testid="todo-column"]')).toContainText('New landing page design');
  });

  test('user can drag task to different status', async ({ page }) => {
    await page.goto('/acme/projects/website');

    // Find task card and drag to IN_PROGRESS column
    const taskCard = page.locator('[data-testid="task-card-123"]');
    const inProgressColumn = page.locator('[data-testid="in-progress-column"]');

    await taskCard.dragTo(inProgressColumn);

    // Verify task moved
    await expect(inProgressColumn).toContainText('Design homepage');

    // Verify API was called
    await expect(page.locator('[data-testid="todo-column"]')).not.toContainText('Design homepage');
  });

  test('real-time updates work between users', async ({ page, context }) => {
    // Open second browser context
    const page2 = await context.newPage();

    // Both users view same project
    await page.goto('/acme/projects/website');
    await page2.goto('/acme/projects/website');

    // User 1 creates a task
    await page.click('[data-testid="add-task-button"]');
    await page.fill('[data-testid="task-title-input"]', 'Real-time test task');
    await page.click('[data-testid="create-task-submit"]');

    // User 2 should see the task appear (real-time via Pusher)
    await expect(page2.locator('[data-testid="todo-column"]')).toContainText('Real-time test task');
  });
});
```

---

# SECTION 11: DEPLOYMENT CONFIGURATION

## 11.1 Environment Variables

```bash
# .env.example

# App
NEXT_PUBLIC_APP_URL=https://taskflow.app
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:pass@host:5432/taskflow?sslmode=require

# Auth
NEXTAUTH_URL=https://taskflow.app
NEXTAUTH_SECRET=your-32-char-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email
RESEND_API_KEY=re_xxxxxxxxxxxx

# Payments
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxx
STRIPE_PRICE_ID_MONTHLY=price_xxxxxxxxxxxx
STRIPE_PRICE_ID_YEARLY=price_xxxxxxxxxxxx

# Real-time
NEXT_PUBLIC_PUSHER_KEY=xxxxxxxxxxxx
NEXT_PUBLIC_PUSHER_CLUSTER=us2
PUSHER_APP_ID=xxxxxx
PUSHER_SECRET=xxxxxxxxxxxx

# Cache
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxx

# Monitoring
SENTRY_DSN=https://xxxx@xxxx.ingest.sentry.io/xxxx
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## 11.2 Vercel Configuration

```json
// vercel.json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "crons": [
    {
      "path": "/api/cron/cleanup-expired-invites",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/send-due-date-reminders",
      "schedule": "0 8 * * *"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store" }
      ]
    }
  ]
}
```

## 11.3 GitHub Actions CI/CD

```yaml
# .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  DATABASE_URL: postgresql://postgres:postgres@localhost:5432/taskflow_test

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm type-check

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: taskflow_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm prisma migrate deploy
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps
      - run: pnpm build
      - run: pnpm test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  deploy:
    needs: [lint, test, e2e]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

# SECTION 12: ERROR HANDLING

## 12.1 Error Taxonomy

| Error Type | HTTP Code | User Message | Log Level |
|------------|-----------|--------------|-----------|
| Validation | 400 | Show field errors | debug |
| Unauthorized | 401 | "Please sign in" | info |
| Forbidden | 403 | "You don't have permission" | warn |
| Not Found | 404 | "Resource not found" | debug |
| Conflict | 409 | "Already exists" | info |
| Rate Limit | 429 | "Too many requests" | warn |
| Server Error | 500 | "Something went wrong" | error |

## 12.2 Error Classes

```typescript
// lib/errors.ts

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(errors: { field: string; message: string }[]) {
    super('VALIDATION_ERROR', 'Invalid request data', 400, { errors });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super('FORBIDDEN', message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super('RATE_LIMIT', 'Too many requests. Please try again later.', 429);
  }
}
```

## 12.3 Global Error Handler

```typescript
// lib/api/error-handler.ts

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '@/lib/errors';
import { captureException } from '@sentry/nextjs';

export function handleApiError(error: unknown) {
  // Zod validation errors
  if (error instanceof ZodError) {
    const validationError = new ValidationError(
      error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
    );
    return NextResponse.json(
      { error: { code: validationError.code, message: validationError.message, details: validationError.details } },
      { status: validationError.statusCode }
    );
  }

  // Known app errors
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      captureException(error);
    }
    return NextResponse.json(
      { error: { code: error.code, message: error.message, details: error.details } },
      { status: error.statusCode }
    );
  }

  // Unknown errors
  console.error('Unhandled error:', error);
  captureException(error);

  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' } },
    { status: 500 }
  );
}

// Usage in API route
export async function POST(req: Request) {
  try {
    // ... route logic
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

# SECTION 13: LOGGING & MONITORING

## 13.1 Logging Strategy

```typescript
// lib/logger.ts

import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: isProduction ? 'info' : 'debug',
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true },
        },
      }),
});

// Request context logger
export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}

// Domain-specific loggers
export const authLogger = logger.child({ domain: 'auth' });
export const paymentLogger = logger.child({ domain: 'payment' });
export const taskLogger = logger.child({ domain: 'task' });
```

## 13.2 Sentry Configuration

```typescript
// sentry.client.config.ts

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
});
```

## 13.3 Health Check Endpoint

```typescript
// app/api/health/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`;
    checks.checks.database = 'healthy';
  } catch {
    checks.checks.database = 'unhealthy';
    checks.status = 'degraded';
  }

  // Add more checks as needed

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  return NextResponse.json(checks, { status: statusCode });
}
```

---

# SECTION 14: PERFORMANCE OPTIMIZATION

## 14.1 Database Query Optimization

```typescript
// Efficient task queries with selective loading

// BAD - N+1 problem
const tasks = await prisma.task.findMany({ where: { projectId } });
for (const task of tasks) {
  task.assignee = await prisma.user.findUnique({ where: { id: task.assigneeId } });
}

// GOOD - Single query with includes
const tasks = await prisma.task.findMany({
  where: { projectId },
  include: {
    assignee: {
      select: {
        id: true,
        name: true,
        avatarUrl: true,
      },
    },
    labels: {
      include: {
        label: true,
      },
    },
  },
  orderBy: { position: 'asc' },
});
```

## 14.2 Caching Strategy

```typescript
// lib/cache.ts

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 300
): Promise<T> {
  const cached = await redis.get<T>(key);
  if (cached) return cached;

  const fresh = await fetcher();
  await redis.set(key, fresh, { ex: ttlSeconds });
  return fresh;
}

// Usage
const teamStats = await getCachedOrFetch(
  `team:${teamId}:stats`,
  () => calculateTeamStats(teamId),
  600 // 10 minutes
);
```

## 14.3 Image Optimization

```typescript
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google avatars
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com', // Uploaded files
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};
```

---

# SECTION 15: SECURITY MEASURES

## 15.1 Security Checklist

| Category | Measure | Implementation |
|----------|---------|----------------|
| Auth | Session security | HTTP-only cookies, SameSite=Lax |
| Auth | Password policy | Min 8 chars (via OAuth, no passwords stored) |
| Input | Validation | Zod schemas on all inputs |
| Input | Sanitization | DOMPurify for rich text |
| SQL | Injection prevention | Prisma parameterized queries only |
| XSS | Prevention | React auto-escapes, CSP headers |
| CSRF | Protection | NextAuth built-in CSRF |
| Headers | Security headers | via next.config.js |
| Rate Limit | API protection | Upstash rate limiter |
| Secrets | Management | Vercel env vars, never committed |

## 15.2 Security Headers

```typescript
// next.config.js

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' wss://*.pusher.com https://*.pusher.com;",
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

## 15.3 Rate Limiting

```typescript
// lib/rate-limit.ts

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Different limiters for different endpoints
export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
});

export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
});

export const webhookLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 s'),
  analytics: true,
});

// Usage in middleware
import { apiLimiter, RateLimitError } from '@/lib/rate-limit';

export async function checkRateLimit(ip: string, identifier = 'api') {
  const { success, remaining, reset } = await apiLimiter.limit(`${identifier}:${ip}`);

  if (!success) {
    throw new RateLimitError();
  }

  return { remaining, reset };
}
```

---

# SECTION 16: TASK BREAKDOWN

## 16.1 Epic Overview

| Epic | Description | Tasks | Total Hours |
|------|-------------|-------|-------------|
| E1 | Project Setup & Infrastructure | 8 | 36 |
| E2 | Authentication System | 6 | 30 |
| E3 | Team Management | 7 | 35 |
| E4 | Project & Task CRUD | 10 | 50 |
| E5 | Real-time Features | 5 | 25 |
| E6 | Payment Integration | 6 | 30 |
| E7 | UI/UX Polish | 8 | 40 |
| E8 | Testing & QA | 6 | 30 |
| E9 | Deployment & DevOps | 5 | 25 |
| **Total** | | **61** | **301** |

## 16.2 Detailed Task Breakdown

### Epic 1: Project Setup & Infrastructure

| ID | Task | Hours | Dependencies | Acceptance Criteria |
|----|------|-------|--------------|---------------------|
| E1-T1 | Initialize Next.js 14 project with TypeScript | 4 | None | Project runs with `pnpm dev`, TypeScript configured |
| E1-T2 | Configure ESLint, Prettier, Husky | 4 | E1-T1 | Linting passes, pre-commit hooks work |
| E1-T3 | Set up Tailwind CSS and shadcn/ui | 4 | E1-T1 | Sample components render correctly |
| E1-T4 | Configure Prisma with PostgreSQL | 5 | E1-T1 | Migrations work, Prisma Studio accessible |
| E1-T5 | Set up Neon database (prod & preview) | 4 | E1-T4 | Connections work from local and Vercel |
| E1-T6 | Configure Upstash Redis | 4 | E1-T1 | Can read/write to Redis from API |
| E1-T7 | Set up Sentry error tracking | 4 | E1-T1 | Test error appears in Sentry dashboard |
| E1-T8 | Configure PostHog analytics | 4 | E1-T1 | Page views tracked, events firing |

### Epic 2: Authentication System

| ID | Task | Hours | Dependencies | Acceptance Criteria |
|----|------|-------|--------------|---------------------|
| E2-T1 | Configure NextAuth with Prisma adapter | 5 | E1-T4 | Auth tables created, sessions stored in DB |
| E2-T2 | Implement Google OAuth provider | 5 | E2-T1 | Can sign in with Google, user created |
| E2-T3 | Implement magic link email auth | 5 | E2-T1 | Email sent, link works, user authenticated |
| E2-T4 | Build login/signup pages | 5 | E2-T2, E2-T3 | Forms work, errors displayed, redirects correct |
| E2-T5 | Implement auth middleware | 5 | E2-T1 | Protected routes redirect to login |
| E2-T6 | Add session management UI | 5 | E2-T1 | User can view/revoke sessions |

### Epic 3: Team Management

| ID | Task | Hours | Dependencies | Acceptance Criteria |
|----|------|-------|--------------|---------------------|
| E3-T1 | Create team CRUD API endpoints | 5 | E2-T5 | Can create, read, update, delete teams |
| E3-T2 | Build team creation flow UI | 5 | E3-T1 | Form validation, slug generation, redirect |
| E3-T3 | Implement team member invitations | 6 | E3-T1 | Email sent, invite link works, role assigned |
| E3-T4 | Build team settings page | 5 | E3-T1 | Can update name, see members, change roles |
| E3-T5 | Implement role-based permissions | 5 | E3-T1 | Owner/Admin/Member permissions enforced |
| E3-T6 | Add team switching functionality | 4 | E3-T1 | Dropdown works, context switches correctly |
| E3-T7 | Build member management UI | 5 | E3-T3, E3-T5 | Can invite, remove, change roles |

### Epic 4: Project & Task CRUD

| ID | Task | Hours | Dependencies | Acceptance Criteria |
|----|------|-------|--------------|---------------------|
| E4-T1 | Create project CRUD API endpoints | 5 | E3-T5 | Can create, read, update, delete, archive |
| E4-T2 | Build project list sidebar | 5 | E4-T1 | Projects grouped by team, collapsible |
| E4-T3 | Create task CRUD API endpoints | 6 | E4-T1 | Full CRUD, status/priority updates work |
| E4-T4 | Build task creation modal | 5 | E4-T3 | Form validation, all fields work |
| E4-T5 | Implement Kanban board view | 8 | E4-T3 | Columns for each status, cards display |
| E4-T6 | Add drag-and-drop functionality | 6 | E4-T5 | Tasks draggable, position persisted |
| E4-T7 | Build task detail panel | 5 | E4-T3 | All fields editable inline |
| E4-T8 | Implement task comments | 5 | E4-T7 | Can add/edit/delete comments |
| E4-T9 | Add labels/tags system | 4 | E4-T3 | Can create labels, assign to tasks |
| E4-T10 | Implement task filtering/search | 5 | E4-T5 | Filter by status, priority, assignee, label |

### Epic 5: Real-time Features

| ID | Task | Hours | Dependencies | Acceptance Criteria |
|----|------|-------|--------------|---------------------|
| E5-T1 | Configure Pusher server/client | 4 | E1-T1 | Can send/receive test events |
| E5-T2 | Implement task real-time updates | 6 | E5-T1, E4-T3 | Create/update/delete reflected instantly |
| E5-T3 | Add real-time comments | 5 | E5-T1, E4-T8 | New comments appear without refresh |
| E5-T4 | Implement presence indicators | 5 | E5-T1 | See who's viewing same project |
| E5-T5 | Add optimistic UI updates | 5 | E5-T2 | Actions feel instant, rollback on error |

### Epic 6: Payment Integration

| ID | Task | Hours | Dependencies | Acceptance Criteria |
|----|------|-------|--------------|---------------------|
| E6-T1 | Set up Stripe products/prices | 4 | None | Products visible in Stripe dashboard |
| E6-T2 | Implement checkout flow | 6 | E6-T1, E3-T1 | Can start checkout, complete payment |
| E6-T3 | Build Stripe webhook handler | 6 | E6-T2 | Subscription events update DB |
| E6-T4 | Implement customer portal | 4 | E6-T3 | Can manage subscription, view invoices |
| E6-T5 | Add plan-based feature gating | 5 | E6-T3 | Free tier limits enforced |
| E6-T6 | Build billing settings page | 5 | E6-T4 | Shows plan, usage, upgrade button |

### Epic 7: UI/UX Polish

| ID | Task | Hours | Dependencies | Acceptance Criteria |
|----|------|-------|--------------|---------------------|
| E7-T1 | Design and build landing page | 6 | E1-T3 | Hero, features, pricing, CTA |
| E7-T2 | Implement dark mode | 5 | E1-T3 | Toggle works, preference persisted |
| E7-T3 | Add loading states/skeletons | 5 | E4-T5 | All async states handled gracefully |
| E7-T4 | Implement toast notifications | 4 | E1-T3 | Success/error toasts show correctly |
| E7-T5 | Build onboarding flow | 5 | E2-T4, E3-T2 | New users guided through setup |
| E7-T6 | Add keyboard shortcuts | 5 | E4-T5 | Common actions have shortcuts |
| E7-T7 | Implement responsive design | 5 | All UI tasks | Works on mobile, tablet, desktop |
| E7-T8 | Accessibility audit and fixes | 5 | All UI tasks | WCAG 2.1 AA compliant |

### Epic 8: Testing & QA

| ID | Task | Hours | Dependencies | Acceptance Criteria |
|----|------|-------|--------------|---------------------|
| E8-T1 | Set up Vitest with coverage | 4 | E1-T1 | Tests run, coverage reported |
| E8-T2 | Write unit tests for utilities | 5 | E8-T1 | 90%+ coverage on lib/ |
| E8-T3 | Write API integration tests | 6 | E8-T1 | All endpoints tested |
| E8-T4 | Set up Playwright | 4 | E1-T1 | E2E tests run locally |
| E8-T5 | Write E2E tests for critical flows | 6 | E8-T4 | Auth, task CRUD, payments tested |
| E8-T6 | Performance testing and optimization | 5 | All features | Lighthouse score >90 |

### Epic 9: Deployment & DevOps

| ID | Task | Hours | Dependencies | Acceptance Criteria |
|----|------|-------|--------------|---------------------|
| E9-T1 | Configure Vercel project | 4 | E1-T1 | Deploys on push, env vars set |
| E9-T2 | Set up GitHub Actions CI | 5 | E8-T1 | Lint, test, build run on PR |
| E9-T3 | Configure preview deployments | 4 | E9-T1 | Each PR gets preview URL |
| E9-T4 | Set up production monitoring | 4 | E1-T7 | Alerts configured, dashboards built |
| E9-T5 | Create deployment documentation | 4 | All | README complete, runbooks written |

---

# SECTION 17: TIMELINE & MILESTONES

## 17.1 Development Timeline

```
Week 1-2: Foundation
├── E1: Project Setup (36h)
└── E2: Authentication (30h)

Week 3-4: Core Features
├── E3: Team Management (35h)
└── E4: Projects & Tasks (50h)

Week 5: Real-time & Payments
├── E5: Real-time Features (25h)
└── E6: Payment Integration (30h)

Week 6: Polish & Ship
├── E7: UI/UX Polish (40h)
├── E8: Testing & QA (30h)
└── E9: Deployment (25h)
```

## 17.2 Milestones

| Milestone | Target | Deliverable |
|-----------|--------|-------------|
| M1: Foundation | Week 2 | Auth working, DB set up, basic UI |
| M2: Core MVP | Week 4 | Tasks, projects, teams functional |
| M3: Beta Ready | Week 5 | Real-time, payments, polish |
| M4: Launch | Week 6 | Production deployed, monitoring live |

---

# SECTION 18: RISK ASSESSMENT

## 18.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Pusher rate limits at scale | Medium | High | Implement client-side debouncing, upgrade plan |
| Stripe webhook failures | Low | High | Implement retry logic, idempotency keys |
| Database connection limits | Medium | Medium | Connection pooling via Neon, optimize queries |
| Auth provider outages | Low | High | Support multiple providers, graceful degradation |

## 18.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Low initial adoption | High | Medium | Focus on SEO, content marketing, ProductHunt launch |
| Competitor feature parity | Medium | Medium | Differentiate on UX and AI features |
| Churn from free users | High | Low | Improve onboarding, add value to paid tier |

---

# SECTION 19: MAINTENANCE PLAN

## 19.1 Regular Maintenance Tasks

| Task | Frequency | Owner |
|------|-----------|-------|
| Dependency updates | Weekly | Dev |
| Security patches | Immediate | Dev |
| Database backups verification | Weekly | Dev |
| Performance monitoring review | Weekly | Dev |
| User feedback triage | Daily | Product |

## 19.2 Monitoring Alerts

| Alert | Condition | Action |
|-------|-----------|--------|
| Error rate spike | >1% 5xx errors | Page on-call |
| Response time degraded | p99 >2s | Investigate query performance |
| Database connections high | >80% pool | Scale or optimize |
| Payment webhook failures | >0 in 1h | Manual verification |

---

# SECTION 20: LAUNCH CHECKLIST

## 20.1 Pre-Launch

- [ ] All critical E2E tests passing
- [ ] Lighthouse score >90 on all pages
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] Error tracking working
- [ ] Analytics tracking working
- [ ] Stripe webhooks verified
- [ ] Database backups configured
- [ ] Domain and SSL configured
- [ ] Legal pages (Privacy, Terms) published

## 20.2 Launch Day

- [ ] DNS propagation complete
- [ ] Production smoke test passed
- [ ] Monitoring dashboards open
- [ ] Support channels ready
- [ ] Social media posts scheduled
- [ ] ProductHunt submission ready

## 20.3 Post-Launch

- [ ] Monitor error rates for 24h
- [ ] Respond to user feedback
- [ ] Fix any critical bugs immediately
- [ ] Schedule retrospective

---

# SECTION 21: COST PROJECTION

## 21.1 Monthly Infrastructure Costs

| Stage | Users | Vercel | Neon | Pusher | Other | Total |
|-------|-------|--------|------|--------|-------|-------|
| Launch | 0-100 | $20 | $0 | $0 | $26 | $46 |
| Growth | 100-1k | $20 | $19 | $0 | $26 | $65 |
| Scale | 1k-10k | $20 | $69 | $49 | $50 | $188 |

## 21.2 Break-Even Analysis

**Cost to Break Even:** $70/month
**Revenue per Paid User:** $8/month
**Users to Break Even:** 9 paid users

At 50 paid users: $400 MRR - $70 costs = $330 profit/month

---

# SECTION 22: DOCUMENTATION

## 22.1 Code Documentation

- Inline comments for complex logic only
- JSDoc for public API functions
- README in each major directory
- Architecture Decision Records (ADRs) for major decisions

## 22.2 User Documentation

- Getting Started guide
- Feature walkthroughs with screenshots
- FAQ section
- Keyboard shortcuts reference

## 22.3 API Documentation

- OpenAPI spec for all endpoints
- Request/response examples
- Error code reference
- Rate limit information

---

# SECTION 23: FUTURE ROADMAP

## 23.1 Post-MVP Features (v1.1+)

| Feature | Priority | Effort | Value |
|---------|----------|--------|-------|
| AI task suggestions | P1 | High | High |
| Calendar integration | P1 | Medium | High |
| Mobile app (React Native) | P2 | Very High | High |
| Slack integration | P2 | Medium | Medium |
| Time tracking | P2 | Medium | Medium |
| Recurring tasks | P1 | Medium | High |
| Task templates | P2 | Low | Medium |
| Advanced reporting | P2 | High | Medium |

## 23.2 AI Features Roadmap

| Feature | Description | Priority |
|---------|-------------|----------|
| Smart task creation | Parse natural language into structured tasks | P1 |
| Due date suggestions | Predict realistic due dates based on history | P2 |
| Workload balancing | Suggest task reassignments | P2 |
| Weekly summary | AI-generated progress reports | P2 |

---

# SECTION 24: ACCESSIBILITY

## 24.1 WCAG 2.1 AA Compliance

| Criterion | Implementation |
|-----------|----------------|
| Color contrast | Minimum 4.5:1 for text, 3:1 for large text |
| Keyboard navigation | All interactive elements focusable |
| Screen reader support | Proper ARIA labels, semantic HTML |
| Focus indicators | Visible focus rings on all elements |
| Error identification | Errors associated with inputs |

## 24.2 Testing Tools

- axe DevTools for automated testing
- VoiceOver/NVDA for screen reader testing
- Keyboard-only navigation testing

---

# SECTION 25: COST ESTIMATION

## 25.1 Infrastructure Cost Calculator

| Resource | Provider | Pricing Model | Estimated Cost |
|----------|----------|---------------|----------------|
| Web Server | Vercel | Per request/bandwidth | $20/month |
| Database | Neon | Compute hours + storage | $0-69/month |
| Cache | Upstash Redis | Per request | $0-10/month |
| Real-time | Pusher | Connections + messages | $0-49/month |
| Email | Resend | Per email | $0/month (3k free) |
| File Storage | Cloudflare R2 | Per GB + operations | $0/month (10GB free) |
| Monitoring | Sentry | Events | $26/month |
| Analytics | PostHog | Events | $0/month (1M free) |

**Total (Launch):** ~$46/month
**Total (1k users):** ~$65/month
**Total (10k users):** ~$188/month

## 25.2 Development Cost Estimate

| Phase | Hours | Rate | Cost |
|-------|-------|------|------|
| MVP Development | 301 | $0 (solo) | $0 |
| Design Assets | 10 | $50/hr | $500 |
| Legal (Privacy/Terms) | - | Flat fee | $500 |
| **Total** | | | **$1,000** |

---

# SECTION 26: ANALYTICS IMPLEMENTATION

## 26.1 PostHog Configuration

```typescript
// lib/analytics.ts

import posthog from 'posthog-js';

export function initAnalytics() {
  if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      capture_pageview: true,
      capture_pageleave: true,
    });
  }
}

// Track events
export function trackEvent(event: string, properties?: Record<string, unknown>) {
  posthog.capture(event, properties);
}

// Identify user
export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  posthog.identify(userId, traits);
}
```

## 26.2 Key Metrics to Track

| Metric | Event | Properties |
|--------|-------|------------|
| Signup | `user_signed_up` | method, source |
| Task Created | `task_created` | project_id, has_due_date |
| Task Completed | `task_completed` | time_to_complete |
| Team Created | `team_created` | member_count |
| Upgrade Started | `checkout_started` | plan, price |
| Upgrade Completed | `subscription_created` | plan, mrr |

---

# SECTION 27: ERROR HANDLING STRATEGY

## 27.1 Error Categories

| Category | Example | User Message | Technical Action |
|----------|---------|--------------|------------------|
| User Error | Invalid email format | "Please enter a valid email" | Validate client-side |
| Auth Error | Session expired | "Please sign in again" | Redirect to login |
| Business Error | Team limit reached | "Upgrade to add more members" | Show upgrade CTA |
| System Error | Database timeout | "Something went wrong" | Retry, alert on-call |
| External Error | Stripe API down | "Payment processing unavailable" | Queue for retry |

## 27.2 Retry Strategy

```typescript
// lib/retry.ts

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoff?: 'linear' | 'exponential';
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delayMs = 1000, backoff = 'exponential' } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) break;

      const delay = backoff === 'exponential'
        ? delayMs * Math.pow(2, attempt - 1)
        : delayMs * attempt;

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
```

---

# SECTION 28: LEGAL & COMPLIANCE

## 28.1 Required Legal Pages

| Page | Purpose | Location |
|------|---------|----------|
| Privacy Policy | GDPR/CCPA compliance | /privacy |
| Terms of Service | User agreement | /terms |
| Cookie Policy | Cookie consent | /cookies |
| Acceptable Use | Usage rules | /acceptable-use |

## 28.2 Data Handling

| Data Type | Retention | Deletion |
|-----------|-----------|----------|
| User accounts | Until deleted | Within 30 days |
| Task data | Until deleted | With account |
| Analytics | 12 months | Anonymized |
| Logs | 90 days | Auto-deleted |

## 28.3 GDPR Compliance

- [ ] Consent management for cookies
- [ ] Data export functionality
- [ ] Account deletion feature
- [ ] Privacy-by-design architecture
- [ ] DPA with all sub-processors

---

# SECTION 29: SEO STRATEGY

## 29.1 Technical SEO

```typescript
// app/layout.tsx

export const metadata: Metadata = {
  title: {
    default: 'TaskFlow - Team Task Management',
    template: '%s | TaskFlow',
  },
  description: 'Simple, beautiful task management for small teams. Real-time collaboration, AI features, and fair pricing.',
  keywords: ['task management', 'team collaboration', 'project management', 'todo app'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://taskflow.app',
    siteName: 'TaskFlow',
    images: [{ url: 'https://taskflow.app/og-image.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@taskflowapp',
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

## 29.2 Content Strategy

| Page | Target Keywords | Content |
|------|-----------------|---------|
| Homepage | task management, todo app | Landing page with features |
| Pricing | task app pricing, free todo | Comparison table |
| Blog | productivity tips | Weekly articles |
| Changelog | product updates | Release notes |

---

# SECTION 30: INTERNATIONALIZATION

## 30.1 i18n Setup

```typescript
// next.config.js

module.exports = {
  i18n: {
    locales: ['en', 'es', 'de', 'fr', 'ja'],
    defaultLocale: 'en',
    localeDetection: true,
  },
};
```

## 30.2 Translation Structure

```
locales/
├── en/
│   ├── common.json
│   ├── auth.json
│   └── tasks.json
├── es/
│   ├── common.json
│   ├── auth.json
│   └── tasks.json
└── ...
```

## 30.3 Translation Example

```json
// locales/en/tasks.json
{
  "create": "Create task",
  "title": "Title",
  "description": "Description",
  "status": {
    "todo": "To Do",
    "in_progress": "In Progress",
    "done": "Done"
  },
  "priority": {
    "low": "Low",
    "medium": "Medium",
    "high": "High",
    "urgent": "Urgent"
  }
}
```

---

# SECTION 31: FEATURE FLAGS

## 31.1 Feature Flag System

```typescript
// lib/features.ts

import { PostHog } from 'posthog-node';

const posthog = new PostHog(process.env.POSTHOG_API_KEY!);

export type FeatureFlag =
  | 'ai-suggestions'
  | 'dark-mode'
  | 'team-chat'
  | 'calendar-view';

export async function isFeatureEnabled(
  flag: FeatureFlag,
  userId: string
): Promise<boolean> {
  return posthog.isFeatureEnabled(flag, userId) ?? false;
}

// Usage in component
const showAiSuggestions = await isFeatureEnabled('ai-suggestions', user.id);
```

## 31.2 Feature Rollout Plan

| Feature | Flag | Rollout Strategy |
|---------|------|------------------|
| AI Suggestions | ai-suggestions | 10% → 50% → 100% over 2 weeks |
| Dark Mode | dark-mode | 100% (opt-in via settings) |
| Calendar View | calendar-view | Pro users first, then all |

---

# SECTION 32: REAL-TIME ARCHITECTURE

## 32.1 Event Types

| Event | Trigger | Data |
|-------|---------|------|
| task:created | New task saved | Full task object |
| task:updated | Task modified | Task ID + changed fields |
| task:deleted | Task removed | Task ID |
| task:moved | Drag and drop | Task ID, new status, position |
| comment:created | New comment | Full comment object |
| member:online | User opens project | User ID, avatar |
| member:offline | User closes project | User ID |

## 32.2 Channel Structure

```
project-{projectId}     # Task events for a project
team-{teamId}           # Team-wide notifications
user-{userId}           # Personal notifications
presence-{projectId}    # Who's viewing
```

## 32.3 Optimistic Updates Pattern

```typescript
// hooks/use-update-task.ts

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { updateTask: updateStore } = useTaskStore();

  return useMutation({
    mutationFn: async ({ taskId, updates }: UpdateTaskParams) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return response.json();
    },
    onMutate: async ({ taskId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot previous value
      const previousTask = useTaskStore.getState().tasks[taskId];

      // Optimistically update
      updateStore(taskId, updates);

      return { previousTask };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousTask) {
        updateStore(variables.taskId, context.previousTask);
      }
    },
  });
}
```

---

# SECTION 33: CUSTOMER SUPPORT

## 33.1 Support Channels

| Channel | Response Time | Tools |
|---------|---------------|-------|
| In-app chat | <1 hour | Intercom widget |
| Email | <24 hours | Shared inbox |
| Documentation | Self-serve | Mintlify docs |

## 33.2 Intercom Integration

```typescript
// components/intercom.tsx

'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function IntercomProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.Intercom('boot', {
        api_base: 'https://api-iam.intercom.io',
        app_id: process.env.NEXT_PUBLIC_INTERCOM_APP_ID,
        ...(session?.user && {
          user_id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        }),
      });
    }
  }, [session]);

  return <>{children}</>;
}
```

---

# SECTION 34: AI/ML INTEGRATION

## 34.1 AI Features Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User Input    │────>│  OpenAI API     │────>│  Structured     │
│   "Meeting      │     │  gpt-4o-mini    │     │  Task Object    │
│    tomorrow"    │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 34.2 AI Task Parser

```typescript
// lib/ai/task-parser.ts

import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI();

const parsedTaskSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueDate: z.string().datetime().optional(),
});

export async function parseNaturalLanguageTask(input: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a task parser. Extract structured task data from natural language.
Today's date is ${new Date().toISOString().split('T')[0]}.
Return JSON matching this schema: { title, description?, priority, dueDate? }`,
      },
      { role: 'user', content: input },
    ],
    response_format: { type: 'json_object' },
  });

  const parsed = JSON.parse(completion.choices[0].message.content!);
  return parsedTaskSchema.parse(parsed);
}
```

## 34.3 AI Cost Estimation

| Feature | Model | Est. Usage | Monthly Cost |
|---------|-------|------------|--------------|
| Task parsing | gpt-4o-mini | 10k requests | ~$1 |
| Summaries | gpt-4o-mini | 1k requests | ~$0.50 |
| **Total AI** | | | **~$2/month** |

---

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

# END OF TASKFLOW IMPLEMENTATION PLAN

**Total Sections:** 34
**Total Development Hours:** 301
**Estimated Infrastructure Cost:** $46-188/month
**Break-even:** 9 paid users

This document serves as the complete blueprint for building TaskFlow from idea to production.
