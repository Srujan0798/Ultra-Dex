import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_FILE = join(process.cwd(), 'data', 'metrics.json');

interface ProviderStats {
  avgLatency: number;
  p50: number;
  p95: number;
  p99: number;
  totalCost: number;
  requestCount: number;
  errorCount: number;
  errorRate: number;
}

interface MetricsPayload {
  apiKey: string;
  timestamp: string;
  providers: Record<string, ProviderStats>;
  totalRequests: number;
  totalCost: number;
}

function ensureDataDir() {
  const dir = join(process.cwd(), 'data');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function loadMetrics(): MetricsPayload[] {
  ensureDataDir();
  if (!existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveMetrics(metrics: MetricsPayload[]) {
  ensureDataDir();
  writeFileSync(DATA_FILE, JSON.stringify(metrics, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const payload: MetricsPayload = await request.json();

    // Minimal validation
    if (!payload.apiKey || !payload.providers) {
      return NextResponse.json({ error: 'Missing apiKey or providers' }, { status: 400 });
    }

    const metrics = loadMetrics();
    metrics.push({
      ...payload,
      timestamp: new Date().toISOString(),
    });

    // Keep last 1000 records
    if (metrics.length > 1000) {
      metrics.shift();
    }

    saveMetrics(metrics);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

export async function GET() {
  const metrics = loadMetrics();

  // Aggregate latest stats per provider
  const latest = metrics.length > 0 ? metrics[metrics.length - 1] : null;

  return NextResponse.json({
    metrics,
    latest,
  });
}
