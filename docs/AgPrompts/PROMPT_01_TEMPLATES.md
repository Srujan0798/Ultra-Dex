# 🔧 Agent Prompt: Complete All 5 Templates

Execute in order. Make each template production-ready.

---

## 1. SaaSKit (templates/saaskit/)

**Already has:** schema.prisma

**CREATE:**

### api/workspaces.ts
```typescript
import { prisma } from '../lib/prisma';
import { requireRole } from '../lib/rbac';

export async function createWorkspace(ownerId: string, data: { name: string }) {
  const slug = data.name.toLowerCase().replace(/\s+/g, '-');
  return prisma.workspace.create({
    data: { name: data.name, slug, ownerId }
  });
}

export async function getWorkspace(id: string, userId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: { members: true }
  });
  if (!workspace) throw new Error('Workspace not found');
  return workspace;
}

export async function deleteWorkspace(id: string, userId: string) {
  await requireRole(id, userId, 'OWNER');
  return prisma.workspace.delete({ where: { id } });
}
```

### api/members.ts
```typescript
export async function addMember(workspaceId: string, email: string, role: Role) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User not found');
  
  return prisma.workspaceMember.create({
    data: { workspaceId, userId: user.id, role }
  });
}

export async function removeMember(workspaceId: string, userId: string) {
  return prisma.workspaceMember.delete({
    where: { workspaceId_userId: { workspaceId, userId } }
  });
}

export async function updateRole(workspaceId: string, userId: string, role: Role) {
  return prisma.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId, userId } },
    data: { role }
  });
}
```

### api/invitations.ts
```typescript
import crypto from 'crypto';

export async function createInvite(workspaceId: string, email: string, invitedBy: string) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  return prisma.workspaceInvite.create({
    data: { workspaceId, email, token, invitedBy, expiresAt }
  });
}

export async function acceptInvite(token: string, userId: string) {
  const invite = await prisma.workspaceInvite.findUnique({ where: { token } });
  if (!invite || invite.status !== 'PENDING') throw new Error('Invalid invite');
  if (new Date() > invite.expiresAt) throw new Error('Invite expired');
  
  await prisma.$transaction([
    prisma.workspaceMember.create({
      data: { workspaceId: invite.workspaceId, userId, role: invite.role }
    }),
    prisma.workspaceInvite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED', invitedUserId: userId }
    })
  ]);
}
```

### api/stripe-webhook.ts
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function handleWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      await activateSubscription(session);
      break;
    case 'customer.subscription.updated':
      await updateSubscription(event.data.object as Stripe.Subscription);
      break;
    case 'customer.subscription.deleted':
      await cancelSubscription(event.data.object as Stripe.Subscription);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailure(event.data.object as Stripe.Invoice);
      break;
  }
}
```

### lib/rbac.ts
```typescript
export const PERMISSIONS = {
  OWNER: ['*'],
  ADMIN: ['workspace:manage', 'member:manage', 'project:*'],
  MEMBER: ['project:read', 'project:write'],
  VIEWER: ['project:read']
};

export async function requireRole(workspaceId: string, userId: string, minimumRole: Role) {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } }
  });
  
  if (!member) throw new Error('Not a member');
  
  const roleHierarchy = ['VIEWER', 'MEMBER', 'ADMIN', 'OWNER'];
  const userLevel = roleHierarchy.indexOf(member.role);
  const requiredLevel = roleHierarchy.indexOf(minimumRole);
  
  if (userLevel < requiredLevel) throw new Error('Insufficient permissions');
  return member;
}

export function hasPermission(role: Role, permission: string): boolean {
  const perms = PERMISSIONS[role];
  return perms.includes('*') || perms.includes(permission);
}
```

---

## 2. HabitStack (templates/habitstack/)

### schema.prisma
```prisma
model Habit {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  frequency   Frequency @default(DAILY)
  targetDays  Int[]
  color       String   @default("#6366f1")
  icon        String   @default("✓")
  createdAt   DateTime @default(now())
  
  completions Completion[]
  streaks     Streak[]
}

model Completion {
  id        String   @id @default(cuid())
  habitId   String
  date      DateTime @db.Date
  notes     String?
  
  habit     Habit    @relation(fields: [habitId], references: [id], onDelete: Cascade)
  @@unique([habitId, date])
}

model Streak {
  id          String    @id @default(cuid())
  habitId     String
  startDate   DateTime  @db.Date
  endDate     DateTime? @db.Date
  currentDays Int       @default(1)
  
  habit       Habit     @relation(fields: [habitId], references: [id], onDelete: Cascade)
  @@index([habitId])
}

model Achievement {
  id        String   @id @default(cuid())
  userId    String
  type      String
  name      String
  earnedAt  DateTime @default(now())
  xp        Int      @default(0)
}

enum Frequency { DAILY, WEEKLY, CUSTOM }
```

### lib/streak-logic.ts
```typescript
export function calculateStreak(completions: Date[]): number {
  if (completions.length === 0) return 0;
  
  const sorted = completions
    .map(d => new Date(d).setHours(0, 0, 0, 0))
    .sort((a, b) => b - a);
  
  const today = new Date().setHours(0, 0, 0, 0);
  const yesterday = today - 86400000;
  
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
  
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i - 1] - sorted[i] === 86400000) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

export function getStreakStats(habitId: string) {
  // Return { current, longest, total, thisWeek, thisMonth }
}
```

---

## 3. ContentStudio (templates/contentstudio/)
Create complete CMS with versioning, media uploads.

## 4. CourseForge (templates/courseforge/)
Create complete LMS with progress tracking.

## 5. DevToolsHub (templates/devtoolshub/)
Create API platform with key management, rate limiting.

---

**SUCCESS:** Each template has schema + API + lib + README
