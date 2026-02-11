# HabitStack - Complete Implementation Plan

> **What is this?** A fully filled Ultra-Dex example for a habit tracking app.
> **Purpose:** Show the template works for B2C/productivity SaaS.
> **SaaS:** HabitStack - Build habits that stick with streaks and accountability.

---

# SECTION 1: PRODUCT DEFINITION

## 1.1 Product Overview

**Product Name:** HabitStack
**Tagline:** "Stack your habits. Build your life."
**One-liner:** A habit tracking app with streaks, daily check-ins, and social accountability to help you build lasting habits.

**Problem Statement:**
People fail at building habits because:

1. They forget to do them (no reminders/accountability)
2. They don't see progress (no visualization)
3. They give up after breaking a streak (no recovery mechanism)
4. They lack social support (building habits alone is hard)

**Solution:**
HabitStack provides:

- Simple daily check-ins (30 seconds)
- Streak tracking with "freeze" days (miss one day, don't lose everything)
- Visual progress charts and calendars
- Accountability partners (share progress with friends)
- Smart reminders at optimal times

**Target Audience:**

- Primary: Productivity-focused millennials (25-40)
- Secondary: Students building study habits
- Tertiary: Health-conscious individuals

## 1.2 Core Features (MVP)

| Feature                 | Priority | Complexity | User Value |
| ----------------------- | -------- | ---------- | ---------- |
| User Authentication     | P0       | Medium     | Critical   |
| Create/Edit Habits      | P0       | Low        | Critical   |
| Daily Check-ins         | P0       | Low        | Critical   |
| Streak Tracking         | P0       | Medium     | High       |
| Calendar View           | P0       | Medium     | High       |
| Push Notifications      | P1       | Medium     | High       |
| Progress Analytics      | P1       | Medium     | Medium     |
| Accountability Partners | P2       | High       | High       |
| Habit Templates         | P2       | Low        | Medium     |
| Subscription (Pro)      | P0       | High       | Critical   |

## 1.3 Success Metrics

| Metric           | Target (Month 1) | Target (Month 6) | Target (Year 1) |
| ---------------- | ---------------- | ---------------- | --------------- |
| Downloads        | 1,000            | 20,000           | 100,000         |
| DAU/MAU Ratio    | 30%              | 40%              | 50%             |
| Paid Subscribers | 50               | 1,000            | 10,000          |
| MRR              | $250             | $5,000           | $50,000         |
| 30-Day Retention | 20%              | 30%              | 40%             |

---

# SECTION 2: TECH STACK

## 2.1 Frontend Stack

| Layer         | Technology       | Version | Justification                 |
| ------------- | ---------------- | ------- | ----------------------------- |
| Framework     | Next.js          | 14.x    | PWA support, great mobile web |
| Language      | TypeScript       | 5.3+    | Type safety                   |
| Styling       | Tailwind CSS     | 3.4+    | Rapid UI                      |
| UI Components | shadcn/ui        | Latest  | Accessible                    |
| State         | Zustand          | 4.x     | Simple, fast                  |
| Charts        | Recharts         | 2.x     | Progress visualization        |
| Calendar      | react-day-picker | 8.x     | Calendar heatmap              |
| Animations    | Framer Motion    | 10.x    | Celebration animations        |

## 2.2 Backend Stack

| Layer              | Technology         | Version    | Justification      |
| ------------------ | ------------------ | ---------- | ------------------ |
| Runtime            | Node.js            | 20 LTS     | Stable             |
| Framework          | Next.js API Routes | 14.x       | Unified            |
| Database           | PostgreSQL         | 16         | Reliable           |
| ORM                | Prisma             | 5.x        | Type-safe          |
| Cache              | Upstash Redis      | Serverless | Session, streaks   |
| Push Notifications | OneSignal          | Latest     | Cross-platform     |
| Auth               | NextAuth.js        | 5.x        | Multiple providers |
| Payments           | Stripe             | Latest     | Subscriptions      |
| Background Jobs    | Trigger.dev        | Latest     | Reminders          |

## 2.3 Infrastructure Costs

| Component  | Provider  | Plan          | Monthly Cost |
| ---------- | --------- | ------------- | ------------ |
| Hosting    | Vercel    | Pro           | $20          |
| Database   | Neon      | Launch        | $19          |
| Cache      | Upstash   | Pay-as-you-go | ~$5          |
| Push       | OneSignal | Free tier     | $0           |
| Monitoring | Sentry    | Team          | $26          |

**Total MVP Cost: ~$70/month**

---

# SECTION 3: DATABASE SCHEMA

## 3.1 Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      User       │────<│     Habit       │────<│   HabitEntry    │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ email           │     │ userId (FK)     │     │ habitId (FK)    │
│ name            │     │ name            │     │ date            │
│ avatarUrl       │     │ description     │     │ completed       │
│ timezone        │     │ icon            │     │ note            │
│ plan            │     │ color           │     │ createdAt       │
│ streakFreezes   │     │ frequency       │     └─────────────────┘
│ pushEnabled     │     │ reminderTime    │
│ createdAt       │     │ currentStreak   │
└─────────────────┘     │ longestStreak   │
        │               │ archived        │
        │               │ createdAt       │
        ▼               └─────────────────┘
┌─────────────────┐
│  Accountability │
├─────────────────┤
│ id (PK)         │
│ userId (FK)     │
│ partnerId (FK)  │
│ status          │
│ createdAt       │
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
  timezone      String    @default("UTC")
  plan          Plan      @default(FREE)
  streakFreezes Int       @default(0)
  pushEnabled   Boolean   @default(true)
  pushToken     String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts        Account[]
  sessions        Session[]
  habits          Habit[]
  sentPartners    Accountability[] @relation("SentPartnership")
  receivedPartners Accountability[] @relation("ReceivedPartnership")

  @@map("users")
}

enum Plan {
  FREE      // 3 habits
  PRO       // Unlimited + analytics
}

model Habit {
  id            String      @id @default(cuid())
  userId        String
  name          String
  description   String?
  icon          String      @default("✅")
  color         String      @default("#6366f1")
  frequency     Frequency   @default(DAILY)
  targetDays    Int[]       @default([0, 1, 2, 3, 4, 5, 6]) // 0=Sunday
  reminderTime  String?     // "09:00"
  currentStreak Int         @default(0)
  longestStreak Int         @default(0)
  archived      Boolean     @default(false)
  position      Int         @default(0)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  user    User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  entries HabitEntry[]

  @@index([userId, archived])
  @@map("habits")
}

enum Frequency {
  DAILY
  WEEKLY
  CUSTOM
}

model HabitEntry {
  id        String   @id @default(cuid())
  habitId   String
  date      DateTime @db.Date
  completed Boolean  @default(true)
  note      String?
  createdAt DateTime @default(now())

  habit Habit @relation(fields: [habitId], references: [id], onDelete: Cascade)

  @@unique([habitId, date])
  @@index([habitId, date])
  @@map("habit_entries")
}

model Accountability {
  id        String              @id @default(cuid())
  userId    String
  partnerId String
  status    AccountabilityStatus @default(PENDING)
  createdAt DateTime            @default(now())

  user    User @relation("SentPartnership", fields: [userId], references: [id], onDelete: Cascade)
  partner User @relation("ReceivedPartnership", fields: [partnerId], references: [id], onDelete: Cascade)

  @@unique([userId, partnerId])
  @@map("accountability")
}

enum AccountabilityStatus {
  PENDING
  ACCEPTED
  DECLINED
}

// NextAuth models
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
```

---

# SECTION 4: API DESIGN

## 4.1 API Routes

| Method | Endpoint                    | Description                  | Auth |
| ------ | --------------------------- | ---------------------------- | ---- |
| GET    | /api/habits                 | List user's habits           | Yes  |
| POST   | /api/habits                 | Create habit                 | Yes  |
| PATCH  | /api/habits/[id]            | Update habit                 | Yes  |
| DELETE | /api/habits/[id]            | Delete habit                 | Yes  |
| POST   | /api/habits/[id]/check-in   | Mark today complete          | Yes  |
| DELETE | /api/habits/[id]/check-in   | Uncheck today                | Yes  |
| GET    | /api/habits/[id]/entries    | Get entries (for calendar)   | Yes  |
| GET    | /api/stats                  | Get user statistics          | Yes  |
| POST   | /api/streak-freeze          | Use a streak freeze          | Yes  |
| GET    | /api/partners               | List accountability partners | Yes  |
| POST   | /api/partners/invite        | Invite partner               | Yes  |
| POST   | /api/partners/[id]/accept   | Accept invitation            | Yes  |
| GET    | /api/partners/[id]/activity | Get partner's activity       | Yes  |

## 4.2 Request/Response Examples

### Check-in Habit

**Request:**

```http
POST /api/habits/habit_abc123/check-in
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2024-02-14",
  "note": "Did 20 minutes of meditation today!"
}
```

**Response (200 OK):**

```json
{
  "entry": {
    "id": "entry_xyz",
    "habitId": "habit_abc123",
    "date": "2024-02-14",
    "completed": true,
    "note": "Did 20 minutes of meditation today!"
  },
  "habit": {
    "id": "habit_abc123",
    "name": "Meditate",
    "currentStreak": 15,
    "longestStreak": 15
  },
  "achievement": {
    "type": "streak_milestone",
    "value": 15,
    "message": "🔥 15 day streak! You're on fire!"
  }
}
```

---

# SECTION 5: STREAK LOGIC

## 5.1 Streak Calculation

```typescript
// lib/streaks.ts

import { prisma } from '@/lib/prisma';
import { startOfDay, subDays, eachDayOfInterval, format } from 'date-fns';

export async function calculateStreak(
  habitId: string,
  userId: string
): Promise<{
  currentStreak: number;
  longestStreak: number;
}> {
  const habit = await prisma.habit.findUnique({
    where: { id: habitId },
    include: {
      entries: {
        where: { completed: true },
        orderBy: { date: 'desc' },
      },
    },
  });

  if (!habit) throw new Error('Habit not found');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const freezesAvailable = user?.streakFreezes || 0;

  // Get all completed dates as Set for O(1) lookup
  const completedDates = new Set(habit.entries.map((e) => format(e.date, 'yyyy-MM-dd')));

  // Calculate current streak (going backwards from today)
  let currentStreak = 0;
  let freezesUsed = 0;
  const today = startOfDay(new Date());

  for (let i = 0; i < 365; i++) {
    const checkDate = subDays(today, i);
    const dateStr = format(checkDate, 'yyyy-MM-dd');

    // Check if this day is a target day for the habit
    const dayOfWeek = checkDate.getDay();
    if (!habit.targetDays.includes(dayOfWeek)) {
      continue; // Skip non-target days
    }

    if (completedDates.has(dateStr)) {
      currentStreak++;
    } else if (freezesUsed < freezesAvailable && i > 0) {
      // Use a freeze (can't freeze today)
      freezesUsed++;
      currentStreak++;
    } else {
      break; // Streak broken
    }
  }

  // Calculate longest streak (scan all entries)
  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;

  const sortedEntries = habit.entries.sort((a, b) => a.date.getTime() - b.date.getTime());

  for (const entry of sortedEntries) {
    if (!lastDate) {
      tempStreak = 1;
    } else {
      const daysDiff = Math.floor(
        (entry.date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 1 || daysDiff === 0) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);
    lastDate = entry.date;
  }

  return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak) };
}
```

## 5.2 Streak Freeze Logic

```typescript
// app/api/streak-freeze/route.ts

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { habitId, date } = await req.json();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || user.streakFreezes <= 0) {
    return NextResponse.json({ error: 'No streak freezes available' }, { status: 400 });
  }

  // Create a "frozen" entry (completed but marked as freeze)
  await prisma.habitEntry.create({
    data: {
      habitId,
      date: new Date(date),
      completed: true,
      note: '❄️ Streak freeze used',
    },
  });

  // Decrement user's freezes
  await prisma.user.update({
    where: { id: session.user.id },
    data: { streakFreezes: { decrement: 1 } },
  });

  // Recalculate streak
  const streak = await calculateStreak(habitId, session.user.id);
  await prisma.habit.update({
    where: { id: habitId },
    data: streak,
  });

  return NextResponse.json({ success: true, freezesRemaining: user.streakFreezes - 1 });
}
```

---

# SECTION 6: FRONTEND COMPONENTS

## 6.1 Habit Card Component

```typescript
// components/habits/habit-card.tsx

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface HabitCardProps {
  habit: {
    id: string;
    name: string;
    icon: string;
    color: string;
    currentStreak: number;
    isCompletedToday: boolean;
  };
  onCheckIn: (habitId: string) => Promise<void>;
}

export function HabitCard({ habit, onCheckIn }: HabitCardProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [isCompleted, setIsCompleted] = useState(habit.isCompletedToday);

  const handleCheckIn = async () => {
    if (isCompleted || isChecking) return;

    setIsChecking(true);
    try {
      await onCheckIn(habit.id);
      setIsCompleted(true);

      // Celebration animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: [habit.color, '#fbbf24', '#22c55e'],
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <motion.div
      layout
      className={cn(
        'relative p-4 rounded-xl border transition-all cursor-pointer',
        isCompleted
          ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900'
          : 'bg-white border-gray-200 hover:border-gray-300 dark:bg-gray-900 dark:border-gray-800'
      )}
      onClick={handleCheckIn}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${habit.color}20` }}
        >
          {habit.icon}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="font-semibold">{habit.name}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Flame className="h-4 w-4 text-orange-500" />
            <span>{habit.currentStreak} day streak</span>
          </div>
        </div>

        {/* Check Button */}
        <AnimatePresence mode="wait">
          {isCompleted ? (
            <motion.div
              key="completed"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center"
            >
              <Check className="h-6 w-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="incomplete"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Streak milestone badge */}
      {habit.currentStreak > 0 && habit.currentStreak % 7 === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full"
        >
          🔥 {habit.currentStreak} days!
        </motion.div>
      )}
    </motion.div>
  );
}
```

## 6.2 Calendar Heatmap

```typescript
// components/habits/habit-calendar.tsx

'use client';

import { useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { cn } from '@/lib/utils';

interface HabitCalendarProps {
  entries: { date: string; completed: boolean }[];
  color: string;
}

export function HabitCalendar({ entries, color }: HabitCalendarProps) {
  const completedDates = useMemo(() => {
    return new Set(entries.filter(e => e.completed).map(e => e.date));
  }, [entries]);

  const modifiers = useMemo(() => {
    const completed: Date[] = [];
    entries.forEach(entry => {
      if (entry.completed) {
        completed.push(new Date(entry.date));
      }
    });
    return { completed };
  }, [entries]);

  const modifiersStyles = {
    completed: {
      backgroundColor: color,
      color: 'white',
      borderRadius: '50%',
    },
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border">
      <DayPicker
        mode="single"
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        showOutsideDays={false}
        className="mx-auto"
      />

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700" />
          <span>Missed</span>
        </div>
      </div>
    </div>
  );
}
```

---

# SECTION 7: PUSH NOTIFICATIONS

## 7.1 OneSignal Setup

```typescript
// lib/push.ts

import OneSignal from '@onesignal/node-onesignal';

const configuration = OneSignal.createConfiguration({
  appKey: process.env.ONESIGNAL_APP_ID!,
  restApiKey: process.env.ONESIGNAL_REST_API_KEY!,
});

const client = new OneSignal.DefaultApi(configuration);

export async function sendPushNotification(
  userIds: string[],
  title: string,
  message: string,
  data?: Record<string, string>
) {
  const notification = new OneSignal.Notification();
  notification.app_id = process.env.ONESIGNAL_APP_ID!;
  notification.include_external_user_ids = userIds;
  notification.headings = { en: title };
  notification.contents = { en: message };
  notification.data = data;

  await client.createNotification(notification);
}
```

## 7.2 Reminder Job

```typescript
// jobs/send-habit-reminders.ts

import { cronTrigger } from '@trigger.dev/sdk';
import { prisma } from '@/lib/prisma';
import { sendPushNotification } from '@/lib/push';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export const sendHabitReminders = client.defineJob({
  id: 'send-habit-reminders',
  name: 'Send Habit Reminders',
  version: '1.0.0',
  trigger: cronTrigger({ cron: '*/15 * * * *' }), // Every 15 minutes
  run: async (payload, io) => {
    const now = new Date();

    // Get all habits with reminders
    const habits = await prisma.habit.findMany({
      where: {
        reminderTime: { not: null },
        archived: false,
      },
      include: {
        user: true,
        entries: {
          where: {
            date: {
              gte: new Date(format(now, 'yyyy-MM-dd')),
            },
          },
        },
      },
    });

    let sent = 0;

    for (const habit of habits) {
      if (!habit.user.pushEnabled || !habit.user.pushToken) continue;
      if (habit.entries.length > 0) continue; // Already completed today

      // Check if it's reminder time in user's timezone
      const userTime = formatInTimeZone(now, habit.user.timezone, 'HH:mm');

      if (userTime === habit.reminderTime) {
        await sendPushNotification(
          [habit.userId],
          `Time for ${habit.name}! ${habit.icon}`,
          habit.currentStreak > 0
            ? `Keep your ${habit.currentStreak} day streak going!`
            : `Start your streak today!`,
          { habitId: habit.id }
        );
        sent++;
      }
    }

    return { remindersSent: sent };
  },
});
```

---

# SECTION 8: ANALYTICS DASHBOARD

## 8.1 Stats API

```typescript
// app/api/stats/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfWeek, startOfMonth, subDays, format } from 'date-fns';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const today = new Date();

  // Get all habits with entries
  const habits = await prisma.habit.findMany({
    where: { userId, archived: false },
    include: {
      entries: {
        where: {
          date: { gte: subDays(today, 30) },
        },
      },
    },
  });

  // Calculate stats
  const totalHabits = habits.length;
  const totalStreak = habits.reduce((sum, h) => sum + h.currentStreak, 0);
  const longestStreak = Math.max(...habits.map((h) => h.longestStreak), 0);

  // Completion rate (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(today, i), 'yyyy-MM-dd'));

  let completed = 0;
  let possible = 0;

  habits.forEach((habit) => {
    habit.entries.forEach((entry) => {
      if (last7Days.includes(format(entry.date, 'yyyy-MM-dd'))) {
        possible++;
        if (entry.completed) completed++;
      }
    });
  });

  const completionRate = possible > 0 ? Math.round((completed / possible) * 100) : 0;

  // Weekly heatmap data
  const weeklyData = last7Days.reverse().map((date) => ({
    date,
    completed: habits.reduce((sum, h) => {
      const entry = h.entries.find((e) => format(e.date, 'yyyy-MM-dd') === date);
      return sum + (entry?.completed ? 1 : 0);
    }, 0),
    total: habits.length,
  }));

  // Best performing habit
  const bestHabit = habits.reduce(
    (best, habit) => (habit.currentStreak > (best?.currentStreak || 0) ? habit : best),
    null as (typeof habits)[0] | null
  );

  return NextResponse.json({
    totalHabits,
    totalStreak,
    longestStreak,
    completionRate,
    weeklyData,
    bestHabit: bestHabit
      ? { name: bestHabit.name, icon: bestHabit.icon, streak: bestHabit.currentStreak }
      : null,
  });
}
```

---

# SECTION 9: ACCOUNTABILITY PARTNERS

## 9.1 Partner Invite Flow

```
1. User A sends invite to User B's email
2. User B receives email with invite link
3. User B clicks link → accepts/declines
4. If accepted, both can see each other's activity
5. Daily digest email shows partner's progress
```

## 9.2 Partner Activity Feed

```typescript
// app/api/partners/[id]/activity/route.ts

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partnership exists
  const partnership = await prisma.accountability.findFirst({
    where: {
      OR: [
        { userId: session.user.id, partnerId: params.id },
        { userId: params.id, partnerId: session.user.id },
      ],
      status: 'ACCEPTED',
    },
  });

  if (!partnership) {
    return NextResponse.json({ error: 'Not partners' }, { status: 403 });
  }

  // Get partner's habits and recent activity
  const partner = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      habits: {
        where: { archived: false },
        include: {
          entries: {
            where: { date: { gte: subDays(new Date(), 7) } },
            orderBy: { date: 'desc' },
          },
        },
      },
    },
  });

  // Calculate partner's stats
  const stats = {
    totalHabits: partner?.habits.length || 0,
    completedToday:
      partner?.habits.filter((h) =>
        h.entries.some(
          (e) => format(e.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && e.completed
        )
      ).length || 0,
    weeklyStreak: partner?.habits.reduce((sum, h) => sum + h.currentStreak, 0) || 0,
  };

  return NextResponse.json({
    partner: {
      id: partner?.id,
      name: partner?.name,
      avatarUrl: partner?.avatarUrl,
    },
    stats,
    recentActivity: partner?.habits.map((h) => ({
      habit: { name: h.name, icon: h.icon },
      entries: h.entries.slice(0, 7),
    })),
  });
}
```

---

# SECTION 10: TASK BREAKDOWN

## 10.1 Epic Overview

| Epic                    | Tasks  | Hours   |
| ----------------------- | ------ | ------- |
| E1: Setup & Auth        | 5      | 24      |
| E2: Habit CRUD          | 5      | 22      |
| E3: Check-ins & Streaks | 4      | 20      |
| E4: Calendar & History  | 3      | 14      |
| E5: Push Notifications  | 4      | 18      |
| E6: Analytics Dashboard | 4      | 18      |
| E7: Accountability      | 5      | 26      |
| E8: Subscription        | 4      | 20      |
| E9: Testing & Deploy    | 5      | 24      |
| **Total**               | **39** | **186** |

## 10.2 Key Tasks

### Epic 3: Check-ins & Streaks

| ID    | Task                        | Hours | Acceptance Criteria                     |
| ----- | --------------------------- | ----- | --------------------------------------- |
| E3-T1 | Build check-in API          | 5     | Creates entry, updates streak           |
| E3-T2 | Streak calculation logic    | 6     | Handles gaps, freezes, custom frequency |
| E3-T3 | Check-in UI with animations | 5     | Tap to complete, confetti on milestone  |
| E3-T4 | Streak freeze feature       | 4     | Can use freeze, streak preserved        |

### Epic 7: Accountability

| ID    | Task                    | Hours | Acceptance Criteria            |
| ----- | ----------------------- | ----- | ------------------------------ |
| E7-T1 | Partner invite API      | 5     | Email sent, token works        |
| E7-T2 | Accept/decline flow     | 5     | Partnership created on accept  |
| E7-T3 | Partner activity feed   | 6     | Shows partner's habits/streaks |
| E7-T4 | Daily digest email      | 5     | Sent at user's preferred time  |
| E7-T5 | Partner comparison view | 5     | Side-by-side progress          |

---

# SECTION 11: PRICING

## 11.1 Plans

| Plan | Price    | Limits    | Features                                      |
| ---- | -------- | --------- | --------------------------------------------- |
| Free | $0       | 3 habits  | Basic tracking, 1 partner                     |
| Pro  | $5/month | Unlimited | Analytics, unlimited partners, streak freezes |

## 11.2 Conversion Strategy

- Free users hit 3-habit limit → upgrade prompt
- Weekly "Your stats" email with Pro feature teaser
- 7-day Pro trial for new users

---

# SECTION 12: DEPLOYMENT

## 12.1 Environment Variables

```bash
# App
NEXT_PUBLIC_APP_URL=https://habitstack.app
NODE_ENV=production

# Database
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_URL=https://habitstack.app
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Push
ONESIGNAL_APP_ID=...
ONESIGNAL_REST_API_KEY=...

# Payments
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_PRICE_ID_MONTHLY=...

# Cache
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Monitoring
SENTRY_DSN=...
```

---

# END OF HABITSTACK IMPLEMENTATION PLAN

**Total Development Hours:** 186
**Estimated Cost:** ~$70/month
**Break-even:** 14 paid users ($70 revenue)
**Target:** 1,000 paid users = $5,000 MRR by month 6
