import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

export type AuditAction =
  | 'task.run'
  | 'task.complete'
  | 'task.fail'
  | 'agent.select'
  | 'provider.call'
  | 'memory.read'
  | 'memory.write'
  | 'plugin.install'
  | 'plugin.uninstall'
  | 'team.create'
  | 'team.join'
  | 'rbac.change'
  | 'config.update';

export interface AuditEvent {
  timestamp?: string;
  userId: string;
  teamId?: string | null;
  action: AuditAction | string;
  resource: string;
  details?: Record<string, unknown>;
  result: 'success' | 'failure' | 'allowed' | 'blocked';
  cost?: number;
}

export interface AuditFilters {
  userId?: string;
  teamId?: string;
  action?: string;
  resource?: string;
  from?: string;
  to?: string;
}

export interface DateRange {
  from?: string;
  to?: string;
}

export class AuditTrail {
  private readonly baseDir: string;
  private readonly compressionDays: number;

  constructor(baseDir = path.join(os.homedir(), '.ultra-dex', 'audit'), compressionDays = 7) {
    this.baseDir = baseDir;
    this.compressionDays = compressionDays;
  }

  private async ensureBaseDir(): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true });
  }

  private dateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private dailyLogPath(date: Date): string {
    return path.join(this.baseDir, `${this.dateKey(date)}.jsonl`);
  }

  private async getLogFiles(): Promise<string[]> {
    await this.ensureBaseDir();
    const entries = await fs.readdir(this.baseDir);
    return entries
      .filter((entry) => entry.endsWith('.jsonl') || entry.endsWith('.jsonl.gz'))
      .map((entry) => path.join(this.baseDir, entry));
  }

  async log(event: AuditEvent): Promise<AuditEvent> {
    await this.ensureBaseDir();
    const normalized: AuditEvent = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    };
    const targetPath = this.dailyLogPath(new Date(normalized.timestamp));
    await fs.appendFile(targetPath, `${JSON.stringify(normalized)}\n`, 'utf8');
    await this.compressOlderThan(this.compressionDays);
    return normalized;
  }

  async read(dateRange: DateRange = {}, filters: AuditFilters = {}): Promise<AuditEvent[]> {
    const files = await this.getLogFiles();
    const from = dateRange.from ? new Date(dateRange.from).getTime() : 0;
    const to = dateRange.to ? new Date(dateRange.to).getTime() : Number.POSITIVE_INFINITY;
    const events: AuditEvent[] = [];

    for (const file of files) {
      const raw = file.endsWith('.gz')
        ? (await gunzip(await fs.readFile(file))).toString('utf8')
        : await fs.readFile(file, 'utf8');
      const rows = raw.split('\n').filter(Boolean);
      for (const row of rows) {
        const event = JSON.parse(row) as AuditEvent;
        const ts = new Date(event.timestamp || 0).getTime();
        if (ts < from || ts > to) continue;
        if (filters.userId && event.userId !== filters.userId) continue;
        if (filters.teamId && event.teamId !== filters.teamId) continue;
        if (filters.action && event.action !== filters.action) continue;
        if (filters.resource && event.resource !== filters.resource) continue;
        events.push(event);
      }
    }

    events.sort((a, b) => {
      const aTs = new Date(a.timestamp || 0).getTime();
      const bTs = new Date(b.timestamp || 0).getTime();
      return aTs - bTs;
    });
    return events;
  }

  async compressOlderThan(days: number): Promise<number> {
    const files = await this.getLogFiles();
    const now = Date.now();
    let compressed = 0;

    for (const file of files) {
      if (!file.endsWith('.jsonl')) continue;
      const stat = await fs.stat(file);
      const ageDays = (now - stat.mtimeMs) / (24 * 60 * 60 * 1000);
      if (ageDays < days) continue;
      const raw = await fs.readFile(file);
      const gzipPath = `${file}.gz`;
      let payload = raw;
      try {
        const existing = await fs.readFile(gzipPath);
        const restored = await gunzip(existing);
        payload = Buffer.concat([restored, raw]);
      } catch (error: any) {
        if (error?.code !== 'ENOENT') {
          throw error;
        }
      }
      const zipped = await gzip(payload);
      await fs.writeFile(gzipPath, zipped);
      await fs.unlink(file);
      compressed += 1;
    }

    return compressed;
  }
}
