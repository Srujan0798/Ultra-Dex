/**
 * @fileoverview Route module
 * @module usage/route
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get last 30 days of usage
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalMessages, totalConversations, creditTransactions] = await Promise.all([
      prisma.message.count({
        where: {
          conversation: { userId: session.user.id },
          role: 'user',
        },
      }),
      prisma.conversation.count({
        where: { userId: session.user.id },
      }),
      prisma.creditTransaction.findMany({
        where: {
          userId: session.user.id,
          createdAt: { gte: thirtyDaysAgo },
          type: 'USAGE',
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalCreditsUsed = Math.abs(creditTransactions.reduce((acc, t) => acc + t.amount, 0));

    // Group usage by day
    const usageByDay = creditTransactions.reduce(
      (acc, t) => {
        const date = t.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + Math.abs(t.amount);
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      success: true,
      data: {
        totalMessages,
        totalConversations,
        totalCreditsUsed,
        usageByDay,
        recentTransactions: creditTransactions.slice(0, 10),
      },
    });
  } catch (error) {
    console.error('Get usage error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
