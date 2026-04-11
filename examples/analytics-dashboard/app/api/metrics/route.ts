/**
 * @fileoverview Route module
 * @module metrics/route
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/db';
import { auth } from '@/app/lib/auth';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const limit = parseInt(searchParams.get('limit') || '1000');
    const aggregation = searchParams.get('aggregation') || 'sum';

    // Build where clause
    const where: any = {
      userId: session.user.id,
    };

    if (type) {
      where.type = type;
    }

    if (start || end) {
      where.timestamp = {};
      if (start) {
        where.timestamp.gte = new Date(start);
      }
      if (end) {
        where.timestamp.lte = new Date(end);
      }
    }

    // Get metrics
    const metrics = await prisma.metric.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    // Calculate summary statistics
    const summary = await prisma.metric.aggregate({
      where,
      _sum: { value: true },
      _avg: { value: true },
      _count: { value: true },
      _min: { value: true },
      _max: { value: true },
    });

    // Get time-series data grouped by day
    const timeSeriesData = await getTimeSeriesData(session.user.id, type, start, end);

    return NextResponse.json({
      metrics,
      summary: {
        total: summary._sum.value || 0,
        average: summary._avg.value || 0,
        count: summary._count.value || 0,
        min: summary._min.value || 0,
        max: summary._max.value || 0,
      },
      timeSeries: timeSeriesData,
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getTimeSeriesData(
  userId: string,
  type: string | null,
  start: string | null,
  end: string | null
) {
  const startDate = start ? new Date(start) : subDays(new Date(), 30);
  const endDate = end ? new Date(end) : new Date();

  const where: any = {
    userId,
    timestamp: {
      gte: startOfDay(startDate),
      lte: endOfDay(endDate),
    },
  };

  if (type) {
    where.type = type;
  }

  const metrics = await prisma.metric.findMany({
    where,
    orderBy: { timestamp: 'asc' },
  });

  // Group by day
  const grouped = metrics.reduce(
    (acc, metric) => {
      const day = format(metric.timestamp, 'yyyy-MM-dd');
      if (!acc[day]) {
        acc[day] = { count: 0, sum: 0 };
      }
      acc[day].count++;
      acc[day].sum += metric.value;
      return acc;
    },
    {} as Record<string, { count: number; sum: number }>
  );

  return Object.entries(grouped).map(([date, data]) => ({
    date,
    value: data.sum,
    count: data.count,
  }));
}
