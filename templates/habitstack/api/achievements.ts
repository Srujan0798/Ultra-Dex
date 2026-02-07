import { prisma } from '../lib/prisma';

export async function awardAchievement(userId: string, data: { type: string; name: string; xp?: number }) {
  return prisma.achievement.create({
    data: {
      userId,
      type: data.type,
      name: data.name,
      xp: data.xp ?? 0,
    },
  });
}

export async function listAchievements(userId: string) {
  return prisma.achievement.findMany({
    where: { userId },
    orderBy: { earnedAt: 'desc' },
  });
}
