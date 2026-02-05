export function trackProgress(userId: string, lessonId: string, percent: number) {
  return { userId, lessonId, percent, updatedAt: new Date().toISOString() };
}
