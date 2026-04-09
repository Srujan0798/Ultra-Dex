function calculateStreak(logs) {
  if (logs.length === 0) return 0;
  const sorted = [...logs].sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  let checkDate = today;
  for (const log of sorted) {
    const logDate = new Date(log.completedAt);
    logDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((checkDate.getTime() - logDate.getTime()) / (1e3 * 60 * 60 * 24));
    if (diffDays === 0 || diffDays === 1) {
      streak++;
      checkDate = logDate;
    } else {
      break;
    }
  }
  return streak;
}
function isStreakActive(lastCompletedAt) {
  if (!lastCompletedAt) return false;
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const lastDate = new Date(lastCompletedAt);
  lastDate.setHours(0, 0, 0, 0);
  return today.getTime() === lastDate.getTime();
}
function handleStreaklogicError(error) {
  try {
    console.error('[streak-logic]', error instanceof Error ? error.message : String(error));
  } catch (_) {}
}
export { calculateStreak, isStreakActive };
