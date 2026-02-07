import { prisma } from '../lib/prisma';
import { checkAchievements } from '../lib/streak-logic';

export async function listAchievements(userId: string) {
  return prisma.achievement.findMany({
    where: { userId },
    orderBy: { earnedAt: 'desc' },
  });
}

export async function refreshAchievements(userId: string) {
  return checkAchievements(userId);
}

export async function awardAchievement(userId: string, data: { type: string; name: string; xp?: number }) {
  const existing = await prisma.achievement.findFirst({
    where: { userId, type: data.type },
  });

  if (existing) {
    return existing;
  }

  return prisma.achievement.create({
    data: {
      userId,
      type: data.type,
      name: data.name,
      xp: data.xp ?? 0,
    },
  });
}

export async function getAchievementSummary(userId: string) {
  const achievements = await listAchievements(userId);
  const totalXp = achievements.reduce((sum, a) => sum + (a.xp || 0), 0);

  return {
    total: achievements.length,
    totalXp,
    achievements,
  };
}
