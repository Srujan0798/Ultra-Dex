# HabitStack Template

HabitStack is a B2C habit tracker starter focused on streaks, consistency, and achievement progression.

## Included

- Prisma schema for `Habit`, `Completion`, `Streak`, and `Achievement`
- Habit CRUD API
- Streak tracking and recalculation endpoints
- Achievement unlock logic based on streak and completion milestones

## Directory

```text
templates/habitstack/
  schema.prisma
  api/
    habits.ts
    streaks.ts
    achievements.ts
    completions.ts
  lib/
    prisma.ts
    streak-logic.ts
```

## Data Model

- `Habit`: habit definition per user with frequency/target days.
- `Completion`: day-level check-in record.
- `Streak`: rolling consecutive completion window.
- `Achievement`: user milestones with XP.

## Setup

1. Copy template into project.
2. Install Prisma dependencies:

```bash
npm install prisma @prisma/client
```

3. Configure database:

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/habitstack"
```

4. Generate client and run migration:

```bash
npx prisma generate
npx prisma migrate dev --name init_habitstack
```

## Core APIs

### Habits

- `createHabit(userId, data)`
- `getHabit(userId, habitId)`
- `listHabits(userId)`
- `updateHabit(habitId, userId, data)`
- `deleteHabit(habitId, userId)`

### Streaks

- `markCompletion(userId, habitId, date?, notes?)`
- `unmarkCompletion(userId, habitId, date?)`
- `getHabitStreak(userId, habitId)`
- `history(userId)`

### Achievements

- `listAchievements(userId)`
- `refreshAchievements(userId)`
- `awardAchievement(userId, data)`
- `getAchievementSummary(userId)`

## Streak Logic

`lib/streak-logic.ts` provides:

- `calculateStreak(userId, habitId)`
- `updateStreak(userId, habitId, completed, reference?)`
- `getStreakHistory(userId)`
- `checkAchievements(userId)`

The algorithm:

- normalizes dates to local day boundaries
- supports target-day schedules
- updates active/open streak windows
- computes `current`, `longest`, weekly, and monthly metrics

## Production Notes

- Always validate `userId` from auth middleware.
- Use transaction boundaries for completion + streak updates if exposed via HTTP route handlers.
- Add unique API idempotency keys for mobile clients that can retry requests.
- Add rate limits to completion endpoints to prevent abuse.
