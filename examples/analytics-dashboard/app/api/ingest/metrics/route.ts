import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { auth } from '@/app/lib/auth';
import { z } from 'zod';

const metricSchema = z.object({
  type: z.enum(['page_view', 'session', 'purchase', 'conversion', 'click', 'custom']),
  value: z.number(),
  metadata: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime().optional(),
});

export async function POST(request: Request) {
  try {
    // API key authentication (simplified - in production, validate against stored API keys)
    const apiKey = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = metricSchema.parse(body);

    // Find user by API key
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { user: true },
    });

    if (!apiKeyRecord || (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date())) {
      return NextResponse.json({ error: 'Invalid or expired API key' }, { status: 401 });
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsed: new Date() },
    });

    // Create metric
    const metric = await prisma.metric.create({
      data: {
        userId: apiKeyRecord.userId,
        type: validated.type,
        value: validated.value,
        metadata: validated.metadata || {},
        timestamp: validated.timestamp ? new Date(validated.timestamp) : new Date(),
      },
    });

    // Broadcast to connected clients via WebSocket
    // (Implementation depends on your WebSocket setup)

    return NextResponse.json({ success: true, metricId: metric.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error ingesting metric:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Batch ingestion endpoint
export async function PUT(request: Request) {
  try {
    const apiKey = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { metrics } = await request.json();

    if (!Array.isArray(metrics) || metrics.length === 0) {
      return NextResponse.json({ error: 'Metrics array required' }, { status: 400 });
    }

    if (metrics.length > 1000) {
      return NextResponse.json({ error: 'Maximum 1000 metrics per batch' }, { status: 400 });
    }

    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
    });

    if (!apiKeyRecord) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const validatedMetrics = metrics.map((m) => metricSchema.parse(m));

    const createdMetrics = await prisma.$transaction(
      validatedMetrics.map((metric) =>
        prisma.metric.create({
          data: {
            userId: apiKeyRecord.userId,
            type: metric.type,
            value: metric.value,
            metadata: metric.metadata || {},
            timestamp: metric.timestamp ? new Date(metric.timestamp) : new Date(),
          },
        })
      )
    );

    return NextResponse.json({ success: true, count: createdMetrics.length }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error in batch ingestion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
