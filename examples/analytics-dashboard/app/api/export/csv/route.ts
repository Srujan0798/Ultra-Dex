/**
 * @fileoverview Route module
 * @module csv/route
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/app/lib/auth';
import { prisma } from '@/app/lib/db';

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
    const columns = searchParams.get('columns')?.split(',') || [
      'timestamp',
      'type',
      'value',
      'metadata',
    ];

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

    // Fetch metrics
    const metrics = await prisma.metric.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });

    // Generate CSV
    const headers = columns.join(',');
    const rows = metrics.map((metric) => {
      return columns
        .map((col) => {
          const value = metric[col as keyof typeof metric];
          if (col === 'metadata' && typeof value === 'object') {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          if (col === 'timestamp') {
            return new Date(value as string).toISOString();
          }
          return value;
        })
        .join(',');
    });

    const csv = [headers, ...rows].join('\n');

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="metrics-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
