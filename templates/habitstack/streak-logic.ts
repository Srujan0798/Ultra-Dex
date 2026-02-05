export async function calculateStreak(habitId: string, userId: string) {
  // TODO: load completed dates, apply target days, streak freezes
  return { habitId, userId, streak: 0, lastCheckin: null };
}
